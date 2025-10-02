import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoRecorderProps {
  token: string;
  onComplete: (success: boolean, data?: any) => void;
  onCancel: () => void;
}

export function VideoRecorder({ token, onComplete, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        console.log("[Ponto] Solicitando acesso à câmera frontal...");
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false,
        });

        console.log("[Ponto] Acesso à câmera concedido");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              console.log("[Ponto] Vídeo iniciado");
              setLoading(false);
            }).catch(err => {
              console.error("[Ponto] Erro ao iniciar vídeo:", err);
              setError("Erro ao iniciar câmera. Recarregue a página.");
              setLoading(false);
            });
          };
        }
      } catch (err: any) {
        console.error("[Ponto] Erro ao acessar câmera:", err);
        setLoading(false);
        
        if (err.name === "NotAllowedError") {
          setError("Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.");
        } else if (err.name === "NotFoundError") {
          setError("Nenhuma câmera encontrada no dispositivo.");
        } else if (err.name === "NotReadableError") {
          setError("Câmera está sendo usada por outro aplicativo.");
        } else {
          setError(`Erro ao acessar câmera: ${err.message}`);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (!videoRef.current?.srcObject) return;

    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          beginRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      setIsProcessing(true);
      await uploadAndPunch();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Gravar por 3 segundos
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }, 3000);
  };

  const uploadAndPunch = async () => {
    try {
      const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
      
      // Criar path: YYYY-MM-DD/HHmmss-window-uuid.webm
      const now = new Date();
      const datePart = now.toISOString().split("T")[0];
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const uuid = crypto.randomUUID();
      const path = `${datePart}/${timePart}-${uuid}.webm`;

      console.log("[Ponto] Fazendo upload do vídeo:", path);

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("attendance-selfies")
        .upload(path, videoBlob, {
          contentType: "video/webm",
        });

      if (uploadError) throw uploadError;

      // Chamar edge function punch
      const deviceInfo = {
        userAgent: navigator.userAgent,
        videoWidth: 640,
        videoHeight: 480,
      };

      console.log("[Ponto] Chamando punch function");
      
      const { data, error: punchError } = await supabase.functions.invoke("punch", {
        body: {
          token,
          selfie_path: path,
          device_info: deviceInfo,
        },
      });

      if (punchError) throw punchError;

      if (!data?.ok) {
        throw new Error(data?.message || "Erro ao registrar ponto");
      }

      console.log("[Ponto] Ponto registrado com sucesso:", data);
      onComplete(true, data);
      
    } catch (err: any) {
      console.error("[Ponto] Erro ao processar vídeo:", err);
      onComplete(false, { message: err.message || "Erro ao processar vídeo" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Iniciando câmera...</span>
        </div>
      )}

      <div className={`relative rounded-lg overflow-hidden bg-black aspect-video ${loading ? 'hidden' : ''}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover mirror"
          playsInline
          muted
          autoPlay
        />
        
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-6xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Gravando...</span>
            </div>
          </div>
        )}
      </div>

      {!loading && (
        <>
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Mexa a cabeça lentamente durante a gravação (3 segundos)
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={startRecording}
              disabled={isRecording || isProcessing || countdown > 0 || loading}
              className="flex-1"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? "Processando..." : "Iniciar Gravação"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={isRecording || isProcessing}>
              Cancelar
            </Button>
          </div>
        </>
      )}

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
