import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FaceEnrollmentProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type CaptureStep = "idle" | "loading" | "capture1" | "capture2" | "capture3" | "processing" | "success";

export function FaceEnrollment({ onSuccess, onCancel }: FaceEnrollmentProps) {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [step, setStep] = useState<CaptureStep>("idle");
  const [error, setError] = useState("");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      streamRef.current = stream;
      setStep("capture1");
      setError("");
    } catch (err: any) {
      console.error("[FaceEnroll] Erro ao acessar câmera:", err);
      setError("Erro ao acessar câmera. Permita o acesso nas configurações do navegador.");
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

      const { data, error } = await supabase.functions.invoke("enroll-face", {
        body: {
          nome: nome.trim(),
          matricula: matricula.trim() || null,
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

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
