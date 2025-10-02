import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2 } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScanned: (token: string) => void;
}

export function QRScanner({ onScanned }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const scannedRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;

    const startCamera = async () => {
      try {
        console.log("[Ponto] Solicitando acesso à câmera...");
        
        // Tentar diferentes configurações de câmera
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("[Ponto] Acesso à câmera concedido");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              console.log("[Ponto] Vídeo iniciado");
              setLoading(false);
              setScanning(true);
              scanQR();
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

    const scanQR = () => {
      if (!videoRef.current || !canvasRef.current || scannedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationId = requestAnimationFrame(scanQR);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && !scannedRef.current) {
        console.log("[Ponto] QR Code detectado:", code.data);
        scannedRef.current = true;
        onScanned(code.data);
        return;
      }

      animationId = requestAnimationFrame(scanQR);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onScanned]);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {loading && (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Iniciando câmera...</span>
            </div>
          )}
          
          <div className={`relative rounded-lg overflow-hidden bg-black aspect-video ${loading ? 'hidden' : ''}`}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-primary w-64 h-64 rounded-lg animate-pulse shadow-lg" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
          {!loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>Aponte a câmera para o QR Code</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
