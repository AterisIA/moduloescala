import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Play, Pause, StopCircle, RotateCcw } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { QRScanner } from "./QRScanner";
import { FaceVerification } from "./FaceVerification";
import { VideoRecorder } from "./VideoRecorder";

type EstadoPonto = 'ENTRADA' | 'PAUSA' | 'VOLTA_PAUSA' | 'SAIDA' | null;

interface RegistroPontoProps {
  token?: string;
  faceUserId?: string;
  onSaidaComplete?: () => void;
  requireValidationOnSaida?: boolean;
  initialData?: any; // Dados do registro inicial do punch
}

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

export function RegistroPonto({ 
  token: propToken, 
  faceUserId: propFaceUserId,
  onSaidaComplete,
  requireValidationOnSaida = false,
  initialData
}: RegistroPontoProps) {
  const [estado, setEstado] = useState<EstadoPonto>(null);
  const [pausaIniciada, setPausaIniciada] = useState<Date | null>(null);
  const [pausaMinimaMinutos, setPausaMinimaMinutos] = useState<number>(60);
  const [escalaAtiva, setEscalaAtiva] = useState<EscalaAtiva | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroPontoData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Log sempre que o estado mudar
  useEffect(() => {
    console.log("[RegistroPonto] Estado mudou para:", estado);
  }, [estado]);
  
  // Estados para validação de saída
  const [validandoSaida, setValidandoSaida] = useState(false);
  const [stepValidacao, setStepValidacao] = useState<'scan' | 'verify' | 'liveness' | null>(null);
  const [tokenSaida, setTokenSaida] = useState<string>("");
  const [verificationData, setVerificationData] = useState<any>(null);

  // Cronômetros
  const trabalhoTimer = useTimer(
    estado === 'ENTRADA' || estado === 'VOLTA_PAUSA',
    ultimoRegistro?.tempo_trabalho_segundos || 0
  );
  const pausaTimer = useTimer(
    estado === 'PAUSA',
    ultimoRegistro?.tempo_pausa_segundos || 0
  );
  
  console.log("[RegistroPonto] Estado atual:", estado, "Timer rodando?", estado === 'ENTRADA' || estado === 'VOLTA_PAUSA');

  // Buscar escala ativa e último registro ao montar
  useEffect(() => {
    buscarEscalaAtiva();
    
    // Se já temos dados iniciais do punch, configurar estado imediatamente
    if (initialData?.tipo) {
      console.log("[RegistroPonto] Configurando com dados iniciais:", initialData);
      
      // Mapear tipo do punch para estado do ponto
      const estadoInicial: EstadoPonto = initialData.tipo === 'ENTRADA' ? 'ENTRADA' : 
                                         initialData.tipo === 'PAUSA' ? 'PAUSA' :
                                         initialData.tipo === 'VOLTA_PAUSA' ? 'VOLTA_PAUSA' : 'ENTRADA';
      
      setEstado(estadoInicial);
      
      // Buscar último registro para pegar tempos acumulados
      buscarUltimoRegistro();
    } else {
      buscarUltimoRegistro();
    }
  }, [initialData]);

  // NÃO registrar entrada automaticamente - isso será feito no fluxo BaterPonto
  // que já chama a edge function punch após validação
  // useEffect(() => {
  //   if (propFaceUserId && ultimoRegistro === null && !loading && escalaAtiva) {
  //     registrarPonto('ENTRADA');
  //   }
  // }, [propFaceUserId, ultimoRegistro, escalaAtiva]);

  // Atualizar timers quando carregar último registro (APENAS na montagem inicial)
  useEffect(() => {
    console.log("[RegistroPonto] useEffect - ultimoRegistro:", ultimoRegistro);
    
    if (ultimoRegistro && estado === null) {
      // Só atualiza o estado se ainda não foi definido (montagem inicial)
      console.log("[RegistroPonto] Configurando timers com:", {
        tempo_trabalho_segundos: ultimoRegistro.tempo_trabalho_segundos,
        tempo_pausa_segundos: ultimoRegistro.tempo_pausa_segundos,
        estado: ultimoRegistro.estado
      });
      
      trabalhoTimer.setTime(ultimoRegistro.tempo_trabalho_segundos);
      pausaTimer.setTime(ultimoRegistro.tempo_pausa_segundos);
      
      // Atualizar estado para que os timers comecem a rodar
      if (ultimoRegistro.estado === 'ENTRADA' || ultimoRegistro.estado === 'VOLTA_PAUSA') {
        console.log("[RegistroPonto] Iniciando timer de trabalho, estado:", ultimoRegistro.estado);
        setEstado(ultimoRegistro.estado);
      } else if (ultimoRegistro.estado === 'PAUSA') {
        console.log("[RegistroPonto] Iniciando timer de pausa");
        setEstado('PAUSA');
      }
    } else if (ultimoRegistro && estado !== null) {
      // Se já tem estado, só atualiza os timers
      console.log("[RegistroPonto] Atualizando apenas timers, mantendo estado:", estado);
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
      console.log("[RegistroPonto] Buscando último registro...");
      
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('punched_at', hoje)
        .order('punched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      console.log("[RegistroPonto] Último registro encontrado:", data);
      
      if (data) {
        const registro: RegistroPontoData = {
          id: data.id,
          estado: data.estado_ponto as EstadoPonto,
          tempo_trabalho_segundos: data.tempo_trabalho_segundos || 0,
          tempo_pausa_segundos: data.tempo_pausa_segundos || 0,
          pausa_minutos_esperado: data.escala_id ? pausaMinimaMinutos : undefined,
        };
        
        console.log("[RegistroPonto] Registro processado:", registro);
        setUltimoRegistro(registro);
        // NÃO setEstado aqui - será gerenciado em registrarPonto
        
        if (data.estado_ponto === 'PAUSA' && !pausaIniciada) {
          setPausaIniciada(new Date(data.punched_at));
        }
      } else {
        console.log("[RegistroPonto] Nenhum registro encontrado para hoje");
      }
    } catch (error) {
      console.error('[RegistroPonto] Erro ao buscar último registro:', error);
    }
  };

  const handleQRScanned = (scannedToken: string) => {
    setTokenSaida(scannedToken);
    setStepValidacao('verify');
    toast({
      title: "QR Code Escaneado",
      description: "Iniciando verificação facial para saída...",
    });
  };

  const handleFaceVerified = async (success: boolean, data?: any) => {
    if (success && data?.match) {
      setVerificationData(data);
      setStepValidacao('liveness');
      toast({
        title: "Rosto Reconhecido",
        description: "Iniciando prova de vida...",
      });
    } else {
      toast({
        title: "Erro",
        description: data?.message || "Rosto não reconhecido",
        variant: "destructive",
      });
      setValidandoSaida(false);
      setStepValidacao(null);
    }
  };

  const handleLivenessComplete = async (success: boolean) => {
    if (success) {
      setValidandoSaida(false);
      setStepValidacao(null);
      await registrarPonto('SAIDA');
    } else {
      toast({
        title: "Erro",
        description: "Prova de vida falhou",
        variant: "destructive",
      });
      setValidandoSaida(false);
      setStepValidacao(null);
    }
  };

  const registrarPonto = async (novoEstado: EstadoPonto) => {
    // Se for saída e exigir validação, iniciar fluxo de validação
    if (novoEstado === 'SAIDA' && requireValidationOnSaida && !validandoSaida) {
      setValidandoSaida(true);
      setStepValidacao('scan');
      return;
    }

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
      // Preparar dados de geolocalização
      let geoData = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        geoData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          status: 'ok'
        };
      } catch (geoError) {
        console.log('Geolocalização não disponível:', geoError);
        geoData = {
          lat: 0,
          lng: 0,
          accuracy: 0,
          timestamp: Date.now(),
          status: 'error'
        };
      }

      // Preparar dados do dispositivo
      const deviceInfo = {
        userAgent: navigator.userAgent,
        videoWidth: 640,
        videoHeight: 480
      };

      // Chamar a edge function punch
      const { data, error } = await supabase.functions.invoke('punch', {
        body: {
          token: propToken || new Date().toISOString(),
          selfie_path: null, // Não há vídeo neste fluxo
          face_user_id: propFaceUserId,
          face_confidence: 0.95,
          device_info: deviceInfo,
          geo: geoData,
          tipo: novoEstado // Enviar o tipo solicitado
        }
      });

      if (error) throw error;

      setEstado(novoEstado);
      
      if (novoEstado === 'PAUSA') {
        setPausaIniciada(new Date());
      } else if (novoEstado === 'VOLTA_PAUSA') {
        setPausaIniciada(null);
        pausaTimer.reset();
      } else if (novoEstado === 'SAIDA') {
        // Resetar tudo após saída
        if (onSaidaComplete) {
          onSaidaComplete();
        }
      }

      toast({
        title: "Ponto registrado",
        description: `${data?.tipo || novoEstado} registrado com sucesso`,
      });

      buscarUltimoRegistro();
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao registrar ponto",
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

  // Se estiver validando saída, mostrar fluxo de validação
  if (validandoSaida && stepValidacao) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {stepValidacao === 'scan' && "Escaneie o QR Code para Saída"}
            {stepValidacao === 'verify' && "Verificação Facial"}
            {stepValidacao === 'liveness' && "Verificação de Vida"}
          </CardTitle>
          <CardDescription>
            {stepValidacao === 'scan' && "Aponte a câmera para o QR Code"}
            {stepValidacao === 'verify' && "Olhe diretamente para a câmera"}
            {stepValidacao === 'liveness' && "Gire a cabeça lentamente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stepValidacao === 'scan' && <QRScanner onScanned={handleQRScanned} />}
          {stepValidacao === 'verify' && (
            <FaceVerification 
              token={tokenSaida} 
              onComplete={handleFaceVerified}
              onCancel={() => {
                setValidandoSaida(false);
                setStepValidacao(null);
              }}
            />
          )}
          {stepValidacao === 'liveness' && verificationData && (
            <VideoRecorder 
              token={tokenSaida}
              faceUserId={verificationData.face_user_id}
              faceConfidence={verificationData.similarity_score}
              onComplete={handleLivenessComplete}
              onCancel={() => {
                setValidandoSaida(false);
                setStepValidacao(null);
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  }

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
        <div className="flex gap-3 flex-wrap justify-center">
          {/* Botão de Pausar - só aparece quando está trabalhando (ENTRADA ou VOLTA_PAUSA) */}
          {(estado === 'ENTRADA' || estado === 'VOLTA_PAUSA') && (
            <Button
              onClick={() => registrarPonto('PAUSA')}
              disabled={loading}
              variant="secondary"
              size="lg"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pausa
            </Button>
          )}

          {/* Botão de Voltar da Pausa - só aparece quando está em pausa */}
          {estado === 'PAUSA' && (
            <Button
              onClick={() => registrarPonto('VOLTA_PAUSA')}
              disabled={loading || !podeVoltarDaPausa()}
              variant="secondary"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Volta da Pausa
            </Button>
          )}

          {/* Botão de Saída - só aparece quando está trabalhando (ENTRADA ou VOLTA_PAUSA) */}
          {(estado === 'ENTRADA' || estado === 'VOLTA_PAUSA') && (
            <Button
              onClick={() => registrarPonto('SAIDA')}
              disabled={loading}
              variant="destructive"
              size="lg"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Saída
            </Button>
          )}
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
