import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as faceapi from "face-api.js";

interface FaceVerificationProps {
  token: string;
  onComplete: (success: boolean, data?: any) => void;
  onCancel: () => void;
}

export function FaceVerification({ token, onComplete, onCancel }: FaceVerificationProps) {
  const [step, setStep] = useState<"loading" | "ready" | "capturing" | "verifying">("loading");
  const [error, setError] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
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
      // Carregar modelos
      console.log("[FaceVerify] Carregando modelos...");
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      console.log("[FaceVerify] Modelos carregados");

      // Iniciar câmera
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
      setError(err.message || "Erro ao inicializar");
      setStep("ready");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    setStep("capturing");
    setError("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context não disponível");

      ctx.drawImage(video, 0, 0);

      // Detectar rosto e gerar embedding
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      // Limpar canvas imediatamente
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detection) {
        setError("Nenhum rosto detectado. Centralize seu rosto na câmera.");
        setStep("ready");
        return;
      }

      const embedding = Array.from(detection.descriptor);

      // Normalizar L2
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = norm === 0 ? embedding : embedding.map(v => v / norm);

      setStep("verifying");

      // Chamar verify-face
      console.log("[FaceVerify] Chamando verify-face");
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-face", {
        body: {
          token,
          embedding: normalizedEmbedding,
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
            face_confidence: verifyData.confidence,
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
          confidence: verifyData.confidence,
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
              Olhe diretamente para a câmera e clique em "Verificar Rosto"
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleCapture}
              disabled={step === "capturing" || !modelsLoaded}
              className="flex-1"
            >
              {step === "capturing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === "capturing" ? "Capturando..." : "Verificar Rosto"}
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
          <p>Verificando rosto...</p>
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
