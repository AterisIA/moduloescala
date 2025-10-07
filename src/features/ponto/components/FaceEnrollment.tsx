import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface FaceEnrollmentProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type CaptureStep = "idle" | "loading" | "capture1" | "capture2" | "capture3" | "processing" | "success";

export function FaceEnrollment({ onSuccess, onCancel }: FaceEnrollmentProps) {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [coordenadas, setCoordenadas] = useState(""); // Formato: "latitude, longitude"
  const [selectedContatoId, setSelectedContatoId] = useState<string>("");
  const [contatos, setContatos] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [step, setStep] = useState<CaptureStep>("idle");
  const [error, setError] = useState("");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load contatos de terceirização
  useEffect(() => {
    loadContatos();
  }, []);

  // Load escalas when contato is selected
  useEffect(() => {
    if (selectedContatoId) {
      loadEscalas(selectedContatoId);
    } else {
      setEscalas([]);
    }
  }, [selectedContatoId]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const loadContatos = async () => {
    setLoadingContatos(true);
    try {
      const { data, error } = await supabase
        .from('contatos_terceirizacao')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setContatos(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar contatos:', err);
      toast({ 
        title: "Erro", 
        description: "Não foi possível carregar os contatos de terceirização",
        variant: "destructive"
      });
    } finally {
      setLoadingContatos(false);
    }
  };

  const loadEscalas = async (contatoId: string) => {
    try {
      const { data, error } = await supabase
        .from('escala')
        .select(`
          *,
          coordenador:id_coordenador(nome),
          plantao:id_plantao(nome)
        `)
        .eq('id_contato_terceirizacao', contatoId)
        .gte('finalescala', new Date().toISOString())
        .order('dataescala', { ascending: false });
      
      if (error) throw error;
      setEscalas(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar escalas:', err);
    }
  };

  const startCamera = async () => {
    console.log("[FaceEnroll] Iniciando câmera...");
    setStep("loading");
    setError("");
    
    try {
      console.log("[FaceEnroll] Solicitando permissão da câmera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      console.log("[FaceEnroll] Permissão concedida, mantendo stream e exibindo vídeo...");
      streamRef.current = stream;
      // Renderizar o vídeo primeiro
      setStep("capture1");

      // O binding do stream para o <video> ocorrerá no useEffect abaixo
    } catch (err: any) {
      console.error("[FaceEnroll] Erro ao acessar câmera:", err);
      setError(`Erro ao acessar câmera: ${err.message || 'Permita o acesso'}`);
      setStep("idle");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    
    // Converter para base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCapture = () => {
    setError("");
    const imageData = captureFrame();
    
    if (!imageData) {
      setError("Erro ao capturar imagem");
      return;
    }

    const newImages = [...capturedImages, imageData];
    setCapturedImages(newImages);

    if (step === "capture1") {
      setStep("capture2");
      toast({ title: "Captura 1/3", description: "Agora vire levemente para a esquerda" });
    } else if (step === "capture2") {
      setStep("capture3");
      toast({ title: "Captura 2/3", description: "Agora vire levemente para a direita" });
    } else if (step === "capture3") {
      toast({ title: "Captura 3/3", description: "Processando cadastro..." });
      processEnrollment(newImages);
    }
  };

  const processEnrollment = async (images: string[]) => {
    setStep("processing");
    stopCamera();

    try {
      console.log("[FaceEnroll] Enviando para enroll-face");

      // Parsear coordenadas (formato: "lat, lng")
      let latitude = null;
      let longitude = null;
      
      if (coordenadas && coordenadas.trim()) {
        const parts = coordenadas.split(',').map(p => p.trim());
        if (parts.length === 2) {
          latitude = parseFloat(parts[0]);
          longitude = parseFloat(parts[1]);
          
          if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error('Coordenadas inválidas. Use o formato: -23.432280, -46.826523');
          }
        } else {
          throw new Error('Coordenadas inválidas. Use o formato: latitude, longitude');
        }
      }

      const { data, error } = await supabase.functions.invoke("enroll-face", {
        body: {
          nome: nome.trim(),
          matricula: matricula.trim() || null,
          id_contato_terceirizacao: selectedContatoId || null,
          latitude,
          longitude,
          images: images,
        },
      });

      if (error) throw error;

      if (!data?.ok) {
        throw new Error(data?.message || "Erro ao cadastrar");
      }

      console.log("[FaceEnroll] Cadastro criado:", data.face_user_id);
      
      setStep("success");
      toast({ 
        title: "Cadastro realizado!", 
        description: `${data.nome} cadastrado com sucesso` 
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error("[FaceEnroll] Erro:", err);
      setError(err.message || "Erro ao processar cadastro");
      setStep("idle");
      setCapturedImages([]);
    }
  };

  const handleReset = () => {
    stopCamera();
    setStep("idle");
    setCapturedImages([]);
    setError("");
  };

  const isCapturing = ["capture1", "capture2", "capture3"].includes(step);

  // Vincular stream ao elemento de vídeo quando o vídeo estiver na tela
  useEffect(() => {
    if (!isCapturing) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    try {
      if (video.srcObject !== stream) {
        // @ts-ignore
        video.srcObject = stream;
      }
      video.muted = true;
      // @ts-ignore - playsInline é atributo, mas reforçamos aqui
      video.playsInline = true;
      video
        .play()
        .then(() => console.log("[FaceEnroll] Vídeo reproduzindo"))
        .catch((err) => {
          console.error("[FaceEnroll] Falha ao dar play no vídeo:", err);
          setError("Não foi possível iniciar o vídeo da câmera.");
        });
    } catch (e) {
      console.error("[FaceEnroll] Erro ao vincular stream ao vídeo:", e);
    }
  }, [isCapturing]);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Iniciando câmera...</p>
        </div>
      )}

      {step === "idle" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Número da matrícula (opcional)"
            />
          </div>

          <div>
            <Label htmlFor="contato">Contato de Terceirização</Label>
            <Select value={selectedContatoId} onValueChange={setSelectedContatoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {loadingContatos ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : contatos.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Nenhum contato disponível
                  </div>
                ) : (
                  contatos.map((contato) => (
                    <SelectItem key={contato.id} value={contato.id}>
                      {contato.name} - {contato.role}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {escalas.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Escalas Associadas ({escalas.length})
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {escalas.map((escala: any) => (
                    <div key={escala.idescala} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">{escala.nomepessoaescala}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(escala.dataescala), 'dd/MM/yyyy HH:mm')} até{' '}
                        {escala.finalescala ? format(new Date(escala.finalescala), 'dd/MM/yyyy HH:mm') : 'Indeterminado'}
                      </div>
                      {escala.coordenador && (
                        <div className="text-xs">Coord: {escala.coordenador.nome}</div>
                      )}
                      {escala.plantao && (
                        <div className="text-xs">Plantão: {escala.plantao.nome}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="coordenadas">Coordenadas do Local de Trabalho</Label>
            <Input
              id="coordenadas"
              value={coordenadas}
              onChange={(e) => setCoordenadas(e.target.value)}
              placeholder="Ex: -23.432280, -46.826523"
            />
            <p className="text-xs text-muted-foreground">
              Formato: latitude, longitude (separados por vírgula)
            </p>
          </div>

          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Serão capturadas 3 fotos (frente, esquerda, direita). 
              As imagens serão analisadas por IA para reconhecimento futuro.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={startCamera}
              disabled={!nome.trim()}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              Iniciar Cadastro
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isCapturing && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover mirror"
              playsInline
              muted
              autoPlay
            />
          </div>

          <Alert>
            <AlertDescription>
              {step === "capture1" && "Olhe diretamente para a câmera"}
              {step === "capture2" && "Vire levemente para a esquerda"}
              {step === "capture3" && "Vire levemente para a direita"}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={handleCapture} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Capturar ({capturedImages.length + 1}/3)
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p>Processando cadastro com IA...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold">Cadastro realizado com sucesso!</p>
        </div>
      )}

      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
