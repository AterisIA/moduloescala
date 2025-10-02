import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScanned: (token: string) => void;
}

export function QRScanner({ onScanned }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
          scanQR();
        }
      } catch (err) {
        console.error("[Ponto] Erro ao acessar câmera:", err);
        setError("Não foi possível acessar a câmera");
      }
    };

    const scanQR = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log("[Ponto] QR Code detectado:", code.data);
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
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-4 border-primary w-64 h-64 rounded-lg animate-pulse" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>Aponte a câmera para o QR Code</span>
          </div>
        </>
      )}
    </div>
  );
}
