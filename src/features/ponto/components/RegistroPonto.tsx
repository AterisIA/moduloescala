import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Play, Pause, StopCircle, RotateCcw } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type EstadoPonto = 'ENTRADA' | 'PAUSA' | 'VOLTA_PAUSA' | 'SAIDA' | null;

interface RegistroPontoData {
  id?: string;
  estado: EstadoPonto;
  entrada_at?: string;
  pausa_at?: string;
  volta_pausa_at?: string;
  saida_at?: string;
  tempo_trabalho_segundos: number;
  tempo_pausa_segundos: number;
  pausa_minutos_esperado?: number;
}

interface EscalaAtiva {
  idescala: number;
  dataescala: string;
  finalescala: string | null;
  pausa_minutos: number | null;
}

export function RegistroPonto() {
  const [estado, setEstado] = useState<EstadoPonto>(null);
  const [pausaIniciada, setPausaIniciada] = useState<Date | null>(null);
  const [pausaMinimaMinutos, setPausaMinimaMinutos] = useState<number>(60);
  const [escalaAtiva, setEscalaAtiva] = useState<EscalaAtiva | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroPontoData | null>(null);
  const [loading, setLoading] = useState(false);

  // Cronômetros
  const trabalhoTimer = useTimer(
    estado === 'ENTRADA' || estado === 'VOLTA_PAUSA',
    ultimoRegistro?.tempo_trabalho_segundos || 0
  );
  const pausaTimer = useTimer(
    estado === 'PAUSA',
    ultimoRegistro?.tempo_pausa_segundos || 0
  );

  // Buscar escala ativa e último registro ao montar
  useEffect(() => {
    buscarEscalaAtiva();
    buscarUltimoRegistro();
  }, []);

  // Atualizar timers quando carregar último registro
  useEffect(() => {
    if (ultimoRegistro) {
      trabalhoTimer.setTime(ultimoRegistro.tempo_trabalho_segundos);
      pausaTimer.setTime(ultimoRegistro.tempo_pausa_segundos);
    }
  }, [ultimoRegistro]);

  const buscarEscalaAtiva = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('escala')
        .select('idescala, dataescala, finalescala, pausa_minutos')
        .gte('dataescala', hoje)
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setEscalaAtiva(data);
        setPausaMinimaMinutos(data.pausa_minutos || 60);
      }
    } catch (error) {
      console.error('Erro ao buscar escala:', error);
    }
  };

  const buscarUltimoRegistro = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('punched_at', hoje)
        .order('punched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const registro: RegistroPontoData = {
          id: data.id,
          estado: data.estado_ponto as EstadoPonto,
          tempo_trabalho_segundos: data.tempo_trabalho_segundos || 0,
          tempo_pausa_segundos: data.tempo_pausa_segundos || 0,
          pausa_minutos_esperado: data.escala_id ? pausaMinimaMinutos : undefined,
        };
        setUltimoRegistro(registro);
        setEstado(data.estado_ponto as EstadoPonto);
        
        if (data.estado_ponto === 'PAUSA') {
          setPausaIniciada(new Date(data.punched_at));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar último registro:', error);
    }
  };

  const registrarPonto = async (novoEstado: EstadoPonto) => {
    if (!escalaAtiva) {
      toast({
        title: "Erro",
        description: "Nenhuma escala ativa encontrada para hoje",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const agora = new Date();
      let tempoTrabalho = trabalhoTimer.seconds;
      let tempoPausa = pausaTimer.seconds;

      // Calcular banco de horas
      let bancoHorasMinutos = 0;
      let observacoes = '';

      if (novoEstado === 'VOLTA_PAUSA' && pausaIniciada) {
        const pausaRealMinutos = Math.floor((agora.getTime() - pausaIniciada.getTime()) / 60000);
        const diferencaPausa = pausaRealMinutos - pausaMinimaMinutos;
        
        if (diferencaPausa > 0) {
          bancoHorasMinutos = -diferencaPausa;
          observacoes = `Pausa excedida em ${diferencaPausa} minutos (débito no banco de horas)`;
        }
      }

      if (novoEstado === 'SAIDA' && escalaAtiva.finalescala) {
        const saidaPrevista = new Date(escalaAtiva.finalescala);
        const diferencaMinutos = Math.floor((agora.getTime() - saidaPrevista.getTime()) / 60000);
        
        if (diferencaMinutos > 0) {
          bancoHorasMinutos = diferencaMinutos;
          observacoes = `Trabalhou ${diferencaMinutos} minutos a mais (crédito no banco de horas)`;
        } else if (diferencaMinutos < 0) {
          bancoHorasMinutos = diferencaMinutos;
          observacoes = `Saiu ${Math.abs(diferencaMinutos)} minutos antes (débito no banco de horas)`;
        }
      }

      const { data, error } = await supabase
        .from('attendance_logs')
        .insert({
          kiosk_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          escala_id: escalaAtiva.idescala,
          estado_ponto: novoEstado,
          tempo_trabalho_segundos: tempoTrabalho,
          tempo_pausa_segundos: tempoPausa,
          banco_horas_minutos: bancoHorasMinutos,
          horario_previsto: novoEstado === 'SAIDA' ? escalaAtiva.finalescala : null,
          observacoes: observacoes || null,
          tipo: novoEstado || 'ENTRADA',
          token_window: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setEstado(novoEstado);
      
      if (novoEstado === 'PAUSA') {
        setPausaIniciada(new Date());
      } else if (novoEstado === 'VOLTA_PAUSA') {
        setPausaIniciada(null);
        pausaTimer.reset();
      }

      toast({
        title: "Ponto registrado",
        description: `${novoEstado} registrado com sucesso`,
      });

      if (observacoes) {
        toast({
          title: "Banco de horas",
          description: observacoes,
        });
      }

      buscarUltimoRegistro();
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar ponto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const podeVoltarDaPausa = () => {
    if (!pausaIniciada) return false;
    const minutosDecorridos = Math.floor((Date.now() - pausaIniciada.getTime()) / 60000);
    return minutosDecorridos >= pausaMinimaMinutos;
  };

  const tempoRestantePausa = () => {
    if (!pausaIniciada) return 0;
    const minutosDecorridos = Math.floor((Date.now() - pausaIniciada.getTime()) / 60000);
    return Math.max(0, pausaMinimaMinutos - minutosDecorridos);
  };

  const tempoLiquido = trabalhoTimer.seconds - pausaTimer.seconds;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Ponto</CardTitle>
        <CardDescription>Controle seu ponto com cronômetro e pausas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cronômetros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Tempo de Trabalho</p>
                <p className="text-3xl font-bold font-mono">{trabalhoTimer.formattedTime}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <Pause className="h-8 w-8 mx-auto mb-2 text-warning" />
                <p className="text-sm text-muted-foreground mb-1">Tempo de Pausa</p>
                <p className="text-3xl font-bold font-mono">{pausaTimer.formattedTime}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-sm text-muted-foreground mb-1">Tempo Líquido</p>
                <p className="text-3xl font-bold font-mono">
                  {(() => {
                    const hours = Math.floor(tempoLiquido / 3600);
                    const minutes = Math.floor((tempoLiquido % 3600) / 60);
                    const secs = tempoLiquido % 60;
                    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {estado === 'PAUSA' && !podeVoltarDaPausa() && (
          <Alert variant="destructive">
            <AlertDescription>
              Você deve aguardar mais {tempoRestantePausa()} minuto(s) antes de retornar da pausa.
              Tempo mínimo de pausa: {pausaMinimaMinutos} minutos.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de ação */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => registrarPonto('ENTRADA')}
            disabled={estado !== null || loading}
            className="w-full"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            Entrada
          </Button>

          <Button
            onClick={() => registrarPonto('PAUSA')}
            disabled={estado !== 'ENTRADA' || loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pausa
          </Button>

          <Button
            onClick={() => registrarPonto('VOLTA_PAUSA')}
            disabled={estado !== 'PAUSA' || !podeVoltarDaPausa() || loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            Volta da Pausa
          </Button>

          <Button
            onClick={() => registrarPonto('SAIDA')}
            disabled={(estado !== 'ENTRADA' && estado !== 'VOLTA_PAUSA') || loading}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            Saída
          </Button>
        </div>

        {/* Informações da escala */}
        {escalaAtiva && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>Escala ativa: {new Date(escalaAtiva.dataescala).toLocaleDateString('pt-BR')}</p>
            <p>Pausa prevista: {escalaAtiva.pausa_minutos || 60} minutos</p>
            {escalaAtiva.finalescala && (
              <p>Saída prevista: {new Date(escalaAtiva.finalescala).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
