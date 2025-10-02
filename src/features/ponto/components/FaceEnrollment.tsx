import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as faceapi from "face-api.js";

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
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      console.log("[FaceEnroll] Carregando modelos face-api...");
      const MODEL_URL = '/models'; // Assumindo que modelos estão em public/models
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      console.log("[FaceEnroll] Modelos carregados");
    } catch (err: any) {
      console.error("[FaceEnroll] Erro ao carregar modelos:", err);
      setError("Erro ao carregar modelos de reconhecimento facial. Modelos devem estar em /public/models/");
    }
  };

  const startCamera = async () => {
    if (!modelsLoaded) {
      setError("Aguardando carregamento dos modelos...");
      return;
    }

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

  const captureFrame = async (): Promise<number[] | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Detectar rosto e gerar embedding
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setError("Nenhum rosto detectado. Centralize seu rosto na câmera.");
      return null;
    }

    // Limpar canvas após detecção (não armazenar imagem)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    return Array.from(detection.descriptor);
  };

  const handleCapture = async () => {
    setError("");
    const embedding = await captureFrame();
    
    if (!embedding) return;

    const newEmbeddings = [...embeddings, embedding];
    setEmbeddings(newEmbeddings);

    if (step === "capture1") {
      setStep("capture2");
      toast({ title: "Captura 1/3", description: "Agora vire levemente para a esquerda" });
    } else if (step === "capture2") {
      setStep("capture3");
      toast({ title: "Captura 2/3", description: "Agora vire levemente para a direita" });
    } else if (step === "capture3") {
      toast({ title: "Captura 3/3", description: "Processando cadastro..." });
      await processEnrollment(newEmbeddings);
    }
  };

  const processEnrollment = async (capturedEmbeddings: number[][]) => {
    setStep("processing");
    stopCamera();

    try {
      // Calcular média dos embeddings
      const avgEmbedding = capturedEmbeddings[0].map((_, i) => {
        const sum = capturedEmbeddings.reduce((acc, emb) => acc + emb[i], 0);
        return sum / capturedEmbeddings.length;
      });

      // Normalizar L2
      const norm = Math.sqrt(avgEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = norm === 0 ? avgEmbedding : avgEmbedding.map(v => v / norm);

      console.log("[FaceEnroll] Enviando embedding para enroll-face");

      const { data, error } = await supabase.functions.invoke("enroll-face", {
        body: {
          nome: nome.trim(),
          matricula: matricula.trim() || null,
          embedding: normalizedEmbedding,
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
      setEmbeddings([]);
    }
  };

  const handleReset = () => {
    stopCamera();
    setStep("idle");
    setEmbeddings([]);
    setError("");
  };

  const isCapturing = ["capture1", "capture2", "capture3"].includes(step);

  return (
    <div className="space-y-4">
      {!modelsLoaded && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Carregando modelos de reconhecimento facial...</AlertDescription>
        </Alert>
      )}

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
              Nenhuma imagem será armazenada, apenas dados de reconhecimento.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={startCamera}
              disabled={!nome.trim() || !modelsLoaded}
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
              Capturar ({embeddings.length + 1}/3)
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
          <p>Processando cadastro...</p>
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
