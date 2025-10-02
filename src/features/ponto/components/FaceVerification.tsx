import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FaceVerificationProps {
  token: string;
  onComplete: (success: boolean, data?: any) => void;
  onCancel: () => void;
}

export function FaceVerification({ token, onComplete, onCancel }: FaceVerificationProps) {
  const [step, setStep] = useState<"loading" | "ready" | "capturing" | "verifying">("loading");
  const [error, setError] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
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
      setStep("ready");
    } catch (err: any) {
      console.error("[FaceVerify] Erro:", err);
      setError(err.message || "Erro ao inicializar câmera");
      setStep("ready");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCapture = async () => {
    setStep("capturing");
    setError("");

    try {
      const imageData = captureImage();

      if (!imageData) {
        throw new Error("Erro ao capturar imagem");
      }

      setStep("verifying");

      // Chamar verify-face
      console.log("[FaceVerify] Chamando verify-face");
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-face", {
        body: {
          token,
          image: imageData,
          device_info: {
            userAgent: navigator.userAgent,
          },
        },
      });

      if (verifyError) throw verifyError;

      if (!verifyData?.ok) {
        throw new Error(verifyData?.message || "Erro na verificação");
      }

      console.log("[FaceVerify] Resultado:", verifyData);

      if (verifyData.match) {
        // Match encontrado - chamar punch
        const { data: punchData, error: punchError } = await supabase.functions.invoke("punch", {
          body: {
            token,
            face_user_id: verifyData.face_user_id,
            face_confidence: verifyData.similarity_score,
            device_info: {
              userAgent: navigator.userAgent,
            },
          },
        });

        if (punchError) throw punchError;

        if (!punchData?.ok) {
          throw new Error(punchData?.message || "Erro ao registrar ponto");
        }

        console.log("[FaceVerify] Ponto registrado:", punchData);
        onComplete(true, {
          ...punchData,
          nome: verifyData.nome,
          confidence: verifyData.similarity_score,
        });
      } else {
        // Sem match
        onComplete(false, {
          message: "Rosto não reconhecido. Realize seu cadastro primeiro.",
        });
      }

    } catch (err: any) {
      console.error("[FaceVerify] Erro:", err);
      onComplete(false, {
        message: err.message || "Erro ao verificar rosto",
      });
    } finally {
      stopCamera();
    }
  };

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

      {(step === "ready" || step === "capturing") && (
        <>
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
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Olhe diretamente para a câmera e clique em "Verificar Identidade"
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleCapture}
              disabled={step === "capturing"}
              className="flex-1"
            >
              {step === "capturing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === "capturing" ? "Capturando..." : "Verificar Identidade"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={step === "capturing"}>
              Cancelar
            </Button>
          </div>
        </>
      )}

      {step === "verifying" && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p>Verificando identidade com IA...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Canvas oculto */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
