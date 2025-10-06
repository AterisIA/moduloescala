import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DashboardFilters } from "@/types/dashboard";

interface StatusMatrixViewProps {
  filters: DashboardFilters;
}

interface MatrixRow {
  entityId: string;
  entityName: string;
  periods: {
    [key: string]: {
      ok: number;
      total: number;
      percentage: number;
    };
  };
  totalPercentage: number;
}

export const StatusMatrixView = ({ filters }: StatusMatrixViewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);

  useEffect(() => {
    fetchMatrixData();
  }, [filters]);

  const fetchMatrixData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch resposta_comunicacao
      const { data: respostasData, error: respostasError } = await supabase
        .from('resposta_comunicacao')
        .select('*')
        .gte('dtcomunicacao', filters.startDate.toISOString())
        .lte('dtcomunicacao', filters.endDate.toISOString());

      if (respostasError) throw respostasError;

      const respostas = (respostasData as any[]) || [];

      // 2. Get unique escala IDs
      const escalaIds = [...new Set(respostas.map(r => r.idescala))];
      
      if (escalaIds.length === 0) {
        setMatrixData([]);
        setPeriods([]);
        return;
      }

      // 3. Fetch escalas
      const { data: escalasData, error: escalasError } = await supabase
        .from('escala')
        .select('idescala, nomepessoaescala, id_coordenador, id_plantao, dataescala')
        .in('idescala', escalaIds);

      if (escalasError) throw escalasError;

      const escalas = (escalasData as any[]) || [];

      // 4. Get unique coordenador and plantao IDs
      const coordenadorIds = [...new Set(escalas.map(e => e.id_coordenador).filter(Boolean))];
      const plantaoIds = [...new Set(escalas.map(e => e.id_plantao).filter(Boolean))];

      // 5. Fetch coordenadores
      const coordenadoresMap = new Map();
      if (coordenadorIds.length > 0) {
        const { data: coordenadoresData } = await supabase
          .from('coordenador')
          .select('id_coordenador, nome')
          .in('id_coordenador', coordenadorIds);
        
        (coordenadoresData || []).forEach((c: any) => {
          coordenadoresMap.set(c.id_coordenador, c);
        });
      }

      // 6. Fetch plantoes and empresas
      const plantoesMap = new Map();
      const empresasMap = new Map();
      if (plantaoIds.length > 0) {
        const { data: plantoesData } = await supabase
          .from('plantao')
          .select('id_plantao, nome, id_empresa')
          .in('id_plantao', plantaoIds);
        
        const plantoes = plantoesData || [];
        plantoes.forEach((p: any) => {
          plantoesMap.set(p.id_plantao, p);
        });

        const empresaIds = [...new Set(plantoes.map((p: any) => p.id_empresa).filter(Boolean))];
        if (empresaIds.length > 0) {
          const { data: empresasData } = await supabase
            .from('empresa')
            .select('id_empresa, nome')
            .in('id_empresa', empresaIds);
          
          (empresasData || []).forEach((e: any) => {
            empresasMap.set(e.id_empresa, e);
          });
        }
      }

      // 7. Merge data
      const respostasWithEscala = respostas.map(resposta => {
        const escala = escalas.find(e => e.idescala === resposta.idescala);
        if (!escala) return { ...resposta, escala: null };

        const coordenador = escala.id_coordenador 
          ? coordenadoresMap.get(escala.id_coordenador) 
          : null;
        
        const plantao = escala.id_plantao 
          ? plantoesMap.get(escala.id_plantao) 
          : null;
        
        const empresa = plantao?.id_empresa 
          ? empresasMap.get(plantao.id_empresa) 
          : null;

        return {
          ...resposta,
          escala: {
            ...escala,
            coordenador,
            plantao: plantao ? {
              ...plantao,
              empresa
            } : null
          }
        };
      });

      // Process data based on filter type
      const processedData = processMatrixData(respostasWithEscala);
      setMatrixData(processedData.rows);
      setPeriods(processedData.periods);
    } catch (err: any) {
      console.error('Error fetching matrix data:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const processMatrixData = (respostas: any[]) => {
    const dataMap = new Map<string, MatrixRow>();
    const periodsSet = new Set<string>();

    respostas.forEach((resposta) => {
      const escala = resposta.escala;
      if (!escala) return;

      let entityId = '';
      let entityName = '';

      // Determine entity based on filter type
      if (filters.viewType === 'coordenador') {
        if (!escala.coordenador) return;
        entityId = escala.coordenador.id_coordenador;
        entityName = escala.coordenador.nome;
      } else if (filters.viewType === 'plantao') {
        if (!escala.plantao) return;
        entityId = escala.plantao.id_plantao;
        entityName = escala.plantao.nome;
      } else if (filters.viewType === 'empresa') {
        if (!escala.plantao?.empresa) return;
        entityId = escala.plantao.empresa.id_empresa;
        entityName = escala.plantao.empresa.nome;
      } else {
        return; // Skip 'all' view type for matrix
      }

      // Extract period from dtcomunicacao (hour range)
      const date = new Date(escala.dataescala);
      const hour = date.getHours();
      const periodKey = `${hour}h`;
      periodsSet.add(periodKey);

      // Initialize entity if not exists
      if (!dataMap.has(entityId)) {
        dataMap.set(entityId, {
          entityId,
          entityName,
          periods: {},
          totalPercentage: 0,
        });
      }

      const row = dataMap.get(entityId)!;

      // Initialize period if not exists
      if (!row.periods[periodKey]) {
        row.periods[periodKey] = { ok: 0, total: 0, percentage: 0 };
      }

      // Count status
      const isOk = resposta.status === '1' || resposta.status === 1; // Status 1 = Confirmado
      row.periods[periodKey].total += 1;
      if (isOk) {
        row.periods[periodKey].ok += 1;
      }
    });

    // Calculate percentages
    const rows = Array.from(dataMap.values()).map((row) => {
      let totalOk = 0;
      let totalCount = 0;

      Object.keys(row.periods).forEach((periodKey) => {
        const period = row.periods[periodKey];
        period.percentage = period.total > 0 ? (period.ok / period.total) * 100 : 0;
        totalOk += period.ok;
        totalCount += period.total;
      });

      row.totalPercentage = totalCount > 0 ? (totalOk / totalCount) * 100 : 0;
      return row;
    });

    const sortedPeriods = Array.from(periodsSet).sort((a, b) => {
      const hourA = parseInt(a);
      const hourB = parseInt(b);
      return hourA - hourB;
    });

    return { rows, periods: sortedPeriods };
  };

  const getCellColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getTotalColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (matrixData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Rápida de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="border border-border p-2 text-left bg-muted font-medium sticky left-0 z-20">
                  {filters.viewType === 'coordenador' && 'Coordenador'}
                  {filters.viewType === 'plantao' && 'Plantão'}
                  {filters.viewType === 'empresa' && 'Empresa'}
                </th>
                {periods.map((period) => (
                  <th key={period} className="border border-border p-2 text-center bg-muted font-medium min-w-[100px]">
                    {period}
                  </th>
                ))}
                <th className="border border-border p-2 text-center bg-muted font-medium min-w-[100px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => (
                <tr key={row.entityId}>
                  <td className="border border-border p-2 font-medium bg-background sticky left-0 z-10">
                    {row.entityName}
                  </td>
                  {periods.map((period) => {
                    const periodData = row.periods[period];
                    if (!periodData) {
                      return (
                        <td key={period} className="border border-border p-2 text-center bg-muted/50">
                          -
                        </td>
                      );
                    }
                    return (
                      <td
                        key={period}
                        className={`border border-border p-2 text-center text-white font-semibold ${getCellColor(periodData.percentage)}`}
                      >
                        {periodData.percentage.toFixed(0)}%
                      </td>
                    );
                  })}
                  <td
                    className={`border border-border p-2 text-center text-white font-bold ${getTotalColor(row.totalPercentage)}`}
                  >
                    {row.totalPercentage.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
