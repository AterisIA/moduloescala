import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRScanner } from "../components/QRScanner";
import { VideoRecorder } from "../components/VideoRecorder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

type Step = "scan" | "record" | "success" | "error";

interface PunchResult {
  tipo: string;
  punched_at: string;
  message?: string;
}

export default function BaterPonto() {
  const [step, setStep] = useState<Step>("scan");
  const [token, setToken] = useState<string>("");
  const [result, setResult] = useState<PunchResult | null>(null);
  const [error, setError] = useState<string>("");

  const handleQRScanned = (scannedToken: string) => {
    console.log("[Ponto] QR escaneado:", scannedToken);
    setToken(scannedToken);
    setStep("record");
  };

  const handleVideoRecorded = async (success: boolean, data?: PunchResult) => {
    if (success && data) {
      setResult(data);
      setStep("success");
    } else {
      setError(data?.message || "Erro ao registrar ponto");
      setStep("error");
    }
  };

  const handleReset = () => {
    setStep("scan");
    setToken("");
    setResult(null);
    setError("");
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bater Ponto</h1>
        <p className="text-muted-foreground">Escaneie o QR Code e registre sua entrada/saída</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === "scan" && "Escaneie o QR Code"}
            {step === "record" && "Grave seu vídeo de confirmação"}
            {step === "success" && "Ponto Registrado!"}
            {step === "error" && "Erro ao Registrar"}
          </CardTitle>
          <CardDescription>
            {step === "scan" && "Aponte a câmera para o QR Code do kiosque"}
            {step === "record" && "Mexa a cabeça lentamente durante a gravação"}
            {step === "success" && "Seu ponto foi registrado com sucesso"}
            {step === "error" && "Ocorreu um erro ao processar sua batida"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "scan" && <QRScanner onScanned={handleQRScanned} />}
          
          {step === "record" && (
            <VideoRecorder 
              token={token} 
              onComplete={handleVideoRecorded}
              onCancel={handleReset}
            />
          )}
          
          {step === "success" && result && (
            <div className="space-y-4">
              <Alert className="border-green-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>Tipo:</strong> {result.tipo}<br />
                  <strong>Horário:</strong> {new Date(result.punched_at).toLocaleString('pt-BR')}
                </AlertDescription>
              </Alert>
              <button 
                onClick={handleReset}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Registrar Novo Ponto
              </button>
            </div>
          )}
          
          {step === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <button 
                onClick={handleReset}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
