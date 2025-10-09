import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserPunchDetailsProps {
  userId: string | null;
  userName: string;
  onClose: () => void;
}

interface PunchRecord {
  id: string;
  tipo: string;
  punched_at: string;
  escala_id: number | null;
  tempo_trabalho_segundos: number;
  tempo_pausa_segundos: number;
  banco_horas_minutos: number;
  status_horario: string;
  minutos_atraso: number;
}

interface EscalaInfo {
  idescala: number;
  dataescala: string;
  finalescala: string;
  pausa_minutos: number;
}

export function UserPunchDetails({ userId, userName, onClose }: UserPunchDetailsProps) {
  const { data: punches, isLoading: loadingPunches } = useQuery({
    queryKey: ["user-punches", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("face_user_id", userId)
        .order("punched_at", { ascending: false });
      
      if (error) throw error;
      return data as PunchRecord[];
    },
    enabled: !!userId,
  });

  const { data: escala } = useQuery({
    queryKey: ["user-escala", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: faceUser } = await supabase
        .from("face_users")
        .select("nome, id_contato_terceirizacao")
        .eq("id", userId)
        .single();
      
      if (!faceUser?.id_contato_terceirizacao) return null;

      const { data, error } = await supabase
        .from("escala")
        .select("idescala, dataescala, finalescala, pausa_minutos")
        .eq("id_contato_terceirizacao", faceUser.id_contato_terceirizacao)
        .order("dataescala", { ascending: false })
        .limit(1)
        .single();
      
      if (error) return null;
      return data as EscalaInfo;
    },
    enabled: !!userId,
  });

  const calcularTotais = () => {
    if (!punches || !escala) return null;

    const inicioEscala = parseISO(escala.dataescala);
    const fimEscala = parseISO(escala.finalescala);
    
    // Horas devidas por dia = diferença entre horário de saída e entrada
    const horasDevidasPorDia = differenceInMinutes(fimEscala, inicioEscala) / 60;
    
    // Encontrar dias únicos em que houve ENTRADA (dias efetivamente trabalhados)
    const diasTrabalhados = new Set(
      punches
        .filter(p => p.tipo === "ENTRADA")
        .map(p => format(parseISO(p.punched_at), "yyyy-MM-dd"))
    );
    
    // Horas devidas = horas por dia × dias que a pessoa trabalhou
    const horasDevidas = horasDevidasPorDia * diasTrabalhados.size;

    // Somar horas trabalhadas (em segundos) e converter para horas
    const totalSegundosTrabalhados = punches.reduce(
      (acc, p) => acc + (p.tempo_trabalho_segundos || 0),
      0
    );
    const horasTrabalhadas = totalSegundosTrabalhados / 3600;

    // Banco de horas total (em minutos)
    const bancoHorasTotal = punches.reduce(
      (acc, p) => acc + (p.banco_horas_minutos || 0),
      0
    );

    return {
      horasTrabalhadas,
      horasDevidas,
      bancoHorasMinutos: bancoHorasTotal,
      diasTrabalhados: diasTrabalhados.size,
    };
  };

  const totais = calcularTotais();

  const formatarHoras = (horas: number) => {
    const h = Math.floor(Math.abs(horas));
    const m = Math.floor((Math.abs(horas) - h) * 60);
    return `${horas < 0 ? "-" : ""}${h}h ${m}m`;
  };

  const formatarMinutos = (minutos: number) => {
    const h = Math.floor(Math.abs(minutos) / 60);
    const m = Math.abs(minutos) % 60;
    return `${minutos < 0 ? "-" : ""}${h}h ${m}m`;
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "PAUSA":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "VOLTA_PAUSA":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "SAÍDA":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Detalhes de Ponto - {userName}
          </DialogTitle>
        </DialogHeader>

        {loadingPunches ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo */}
            {totais && escala && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Horas Trabalhadas
                  </div>
                  <div className="text-2xl font-bold">
                    {formatarHoras(totais.horasTrabalhadas)}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Horas Devidas
                  </div>
                  <div className="text-2xl font-bold">
                    {formatarHoras(totais.horasDevidas)}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    {totais.bancoHorasMinutos >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    Banco de Horas
                  </div>
                  <div className={`text-2xl font-bold ${
                    totais.bancoHorasMinutos >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatarMinutos(totais.bancoHorasMinutos)}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Dias Trabalhados
                  </div>
                  <div className="text-2xl font-bold">
                    {totais.diasTrabalhados}
                  </div>
                </div>
              </div>
            )}

            {/* Informações da Escala */}
            {escala && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold mb-2">Escala Atual</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Início:</span>{" "}
                    <span className="font-medium">
                      {format(parseISO(escala.dataescala), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Término:</span>{" "}
                    <span className="font-medium">
                      {format(parseISO(escala.finalescala), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pausa:</span>{" "}
                    <span className="font-medium">{escala.pausa_minutos || 60} minutos</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Batidas */}
            <div>
              <h3 className="font-semibold mb-3">Histórico de Batidas</h3>
              {!punches || punches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma batida de ponto registrada
                </p>
              ) : (
                <div className="space-y-2">
                  {punches.map((punch) => (
                    <div
                      key={punch.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={getTipoBadgeColor(punch.tipo)}>
                          {punch.tipo}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {format(parseISO(punch.punched_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(punch.punched_at), "HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        {punch.status_horario && (
                          <Badge variant={punch.status_horario === "pontual" ? "outline" : "destructive"}>
                            {punch.status_horario === "atrasado" && `${punch.minutos_atraso}min atraso`}
                            {punch.status_horario === "pontual" && "Pontual"}
                          </Badge>
                        )}
                        {punch.banco_horas_minutos !== 0 && (
                          <span className={`font-medium ${
                            punch.banco_horas_minutos > 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatarMinutos(punch.banco_horas_minutos)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
