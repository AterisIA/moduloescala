import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FaceVerificationProps {
  token: string;
  onComplete: (success: boolean, data?: any) => void;
  onCancel: () => void;
}

interface GeoLocation {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  timestamp: number | null;
  status: "ok" | "denied" | "timeout" | "unavailable" | "error";
}

export function FaceVerification({ token, onComplete, onCancel }: FaceVerificationProps) {
  const [step, setStep] = useState<"loading" | "ready" | "capturing" | "verifying">("loading");
  const [error, setError] = useState("");
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  
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
    console.log("[FaceVerify] Iniciando câmera...");
    try {
      console.log("[FaceVerify] Solicitando permissão da câmera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      console.log("[FaceVerify] Permissão concedida, exibindo vídeo...");
      streamRef.current = stream;
      // Renderizar o vídeo primeiro
      setStep("ready");
      setError("");
      // O binding do stream para o <video> ocorrerá no useEffect abaixo
    } catch (err: any) {
      console.error("[FaceVerify] Erro:", err);
      setError(`Erro ao acessar câmera: ${err.message || 'Permita o acesso'}`);
      setStep("ready");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Vincular stream ao elemento de vídeo quando o vídeo estiver na tela
  useEffect(() => {
    if (!(step === "ready" || step === "capturing")) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    try {
      if (video.srcObject !== stream) {
        // @ts-ignore
        video.srcObject = stream;
      }
      video.muted = true;
      // @ts-ignore
      video.playsInline = true;
      video
        .play()
        .then(() => console.log("[FaceVerify] Vídeo reproduzindo"))
        .catch((err) => {
          console.error("[FaceVerify] Falha ao dar play no vídeo:", err);
          setError("Não foi possível iniciar o vídeo da câmera.");
        });
    } catch (e) {
      console.error("[FaceVerify] Erro ao vincular stream ao vídeo:", e);
    }
  }, [step]);

  const captureGeolocation = async (): Promise<GeoLocation> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("[FaceVerify] Geolocalização não disponível");
        resolve({
          lat: null,
          lng: null,
          accuracy: null,
          timestamp: null,
          status: "unavailable"
        });
        return;
      }

      setGeoLoading(true);
      console.log("[FaceVerify] Solicitando geolocalização...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[FaceVerify] Geolocalização obtida:", position.coords);
          setGeoLoading(false);
          
          const geo: GeoLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            status: "ok"
          };
          
          setGeoLocation(geo);
          toast({
            title: "Localização capturada",
            description: `Precisão: ${Math.round(position.coords.accuracy)}m`,
          });
          
          resolve(geo);
        },
        (error) => {
          console.error("[FaceVerify] Erro ao obter geolocalização:", error);
          setGeoLoading(false);
          
          let status: GeoLocation["status"] = "error";
          let message = "Não foi possível obter sua localização.";
          
          if (error.code === error.PERMISSION_DENIED) {
            status = "denied";
            message = "Permissão de localização negada. O ponto será registrado sem localização.";
          } else if (error.code === error.TIMEOUT) {
            status = "timeout";
            message = "Tempo esgotado ao obter localização. O ponto será registrado sem localização.";
          }
          
          const geo: GeoLocation = {
            lat: null,
            lng: null,
            accuracy: null,
            timestamp: null,
            status
          };
          
          setGeoLocation(geo);
          toast({
            title: "Localização não disponível",
            description: message,
            variant: "destructive",
          });
          
          resolve(geo);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
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
      // Capturar geolocalização primeiro
      const geo = await captureGeolocation();

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
        const geoData = geo.status === "ok" ? {
          lat: geo.lat,
          lng: geo.lng,
          accuracy: geo.accuracy,
          timestamp: geo.timestamp,
          status: geo.status
        } : {
          status: geo.status
        };

        console.log("[FaceVerify] Enviando punch com geo:", geoData);

        const { data: punchData, error: punchError } = await supabase.functions.invoke("punch", {
          body: {
            token,
            face_user_id: verifyData.face_user_id,
            face_confidence: verifyData.similarity_score,
            device_info: {
              userAgent: navigator.userAgent,
            },
            geo: geoData,
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
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Para registrar sua localização, permita o acesso quando solicitado.
            </AlertDescription>
          </Alert>

          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Olhe diretamente para a câmera e clique em "Verificar Identidade"
            </AlertDescription>
          </Alert>

          {geoLocation && (
            <Alert variant={geoLocation.status === "ok" ? "default" : "destructive"}>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                {geoLocation.status === "ok" 
                  ? `Localização: ${geoLocation.lat?.toFixed(5)}, ${geoLocation.lng?.toFixed(5)} (±${Math.round(geoLocation.accuracy || 0)}m)`
                  : `Status: ${geoLocation.status}`
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCapture}
              disabled={step === "capturing" || geoLoading}
              className="flex-1"
            >
              {(step === "capturing" || geoLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {geoLoading ? "Obtendo localização..." : step === "capturing" ? "Capturando..." : "Verificar Identidade"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={step === "capturing" || geoLoading}>
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
