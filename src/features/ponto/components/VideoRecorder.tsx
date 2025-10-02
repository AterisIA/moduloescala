import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VideoRecorderProps {
  token: string;
  faceUserId?: string;
  faceConfidence?: number;
  onComplete: (success: boolean, data?: any) => void;
  onCancel: () => void;
}

interface LocationCheckResult {
  isInLocation: boolean;
  distance: number;
  address: string;
}

interface GeoLocation {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  timestamp: number | null;
  status: "ok" | "denied" | "timeout" | "unavailable" | "error";
}

export function VideoRecorder({ token, faceUserId, faceConfidence, onComplete, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationCheck, setLocationCheck] = useState<LocationCheckResult | null>(null);
  
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

  const captureGeolocation = async (): Promise<GeoLocation> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("[Ponto] Geolocalização não disponível");
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
      console.log("[Ponto] Solicitando geolocalização...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[Ponto] Geolocalização obtida:", position.coords);
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
          console.error("[Ponto] Erro ao obter geolocalização:", error);
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

  const startRecording = async () => {
    if (!videoRef.current?.srcObject) return;

    // Capturar geolocalização antes de iniciar gravação
    await captureGeolocation();

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

      // Preparar dados de geo para envio
      const geoData = geoLocation && geoLocation.status === 'ok' ? {
        lat: geoLocation.lat,
        lng: geoLocation.lng,
        accuracy: geoLocation.accuracy,
        timestamp: geoLocation.timestamp,
        status: geoLocation.status
      } : (geoLocation ? {
        lat: null,
        lng: null,
        accuracy: null,
        timestamp: null,
        status: geoLocation.status
      } : null);

      console.log("[Ponto] Chamando punch function com geo:", geoData);
      
      const { data, error: punchError } = await supabase.functions.invoke("punch", {
        body: {
          token,
          selfie_path: path,
          face_user_id: faceUserId,
          face_confidence: faceConfidence,
          device_info: deviceInfo,
          geo: geoData,
        },
      });

      if (punchError) throw punchError;

      if (!data?.ok) {
        throw new Error(data?.message || "Erro ao registrar ponto");
      }

      console.log("[Ponto] Ponto registrado com sucesso:", data);
      
      // Verificar localização se houver coordenadas
      let locationResult: LocationCheckResult | null = null;
      if (data.face_user?.latitude && data.face_user?.longitude && geoLocation?.status === "ok" && geoLocation.lat && geoLocation.lng) {
        console.log('[Ponto] Verificando localização por coordenadas...');
        locationResult = checkLocationByCoordinates(
          geoLocation.lat,
          geoLocation.lng,
          data.face_user.latitude,
          data.face_user.longitude
        );
        setLocationCheck(locationResult);
      }

      onComplete(true, {
        ...data,
        locationCheck: locationResult,
      });
      
    } catch (err: any) {
      console.error("[Ponto] Erro ao processar vídeo:", err);
      onComplete(false, { message: err.message || "Erro ao processar vídeo" });
    } finally {
      setIsProcessing(false);
    }
  };

  const checkLocationByCoordinates = (
    currentLat: number,
    currentLng: number,
    savedLat: number,
    savedLng: number
  ): LocationCheckResult => {
    console.log('[Ponto] Coordenadas atuais:', { currentLat, currentLng });
    console.log('[Ponto] Coordenadas cadastradas:', { savedLat, savedLng });

    const distance = calculateDistance(currentLat, currentLng, savedLat, savedLng);
    const isInLocation = distance <= 200;

    console.log('[Ponto] Resultado da verificação:', {
      distance: Math.round(distance) + 'm',
      isInLocation,
      raioMaximo: '200m'
    });

    toast({
      title: isInLocation ? "✅ No local de trabalho" : "❌ Fora do local",
      description: `Distância: ${Math.round(distance)}m do local cadastrado`,
      variant: isInLocation ? "default" : "destructive",
    });

    return {
      isInLocation,
      distance,
      address: `${savedLat}, ${savedLng}`
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Para registrar sua localização, permita o acesso quando solicitado. 
              Se não permitir, o ponto será registrado sem localização.
            </AlertDescription>
          </Alert>

          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Mexa a cabeça lentamente durante a gravação (3 segundos)
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

          {locationCheck && (
            <Alert variant={locationCheck.isInLocation ? "default" : "destructive"}>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Verificação de Local:</strong><br />
                {locationCheck.isInLocation ? (
                  <>
                    ✅ <strong>No local de trabalho</strong><br />
                    Distância: {locationCheck.distance.toFixed(0)}m do endereço cadastrado
                  </>
                ) : (
                  <>
                    ❌ <strong>Fora do local de trabalho</strong><br />
                    Distância: {locationCheck.distance.toFixed(0)}m do endereço cadastrado (máx: 200m)
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={startRecording}
              disabled={isRecording || isProcessing || countdown > 0 || loading || geoLoading}
              className="flex-1"
            >
              {geoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {geoLoading ? "Obtendo localização..." : isProcessing ? "Processando..." : "Iniciar Gravação"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={isRecording || isProcessing || geoLoading}>
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
