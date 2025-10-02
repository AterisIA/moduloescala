import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";

interface KioskQRModalProps {
  kiosk: { id: string; nome: string };
  open: boolean;
  onClose: () => void;
}

export function KioskQRModal({ kiosk, open, onClose }: KioskQRModalProps) {
  const [token, setToken] = useState<string>("");
  const [countdown, setCountdown] = useState(20);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchToken = async (retryCount = 0): Promise<void> => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("[Ponto] Buscando token para kiosk:", kiosk.id);
      
      const { data, error } = await supabase.functions.invoke("qr-token", {
        body: { kiosk_id: kiosk.id },
      });

      if (error) throw error;
      
      if (!data?.ok) {
        throw new Error(data?.message || "Erro ao gerar token");
      }

      console.log("[Ponto] Token recebido com sucesso");
      setToken(data.token);
      setCountdown(20);
    } catch (err: any) {
      console.error("[Ponto] Erro ao buscar token:", err);
      
      // Retry com backoff
      if (retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 500;
        console.log(`[Ponto] Tentando novamente em ${delay}ms...`);
        setTimeout(() => fetchToken(retryCount + 1), delay);
      } else {
        setError(err.message || "Falha ao gerar QR. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchToken();
    }
  }, [open, kiosk.id]);

  useEffect(() => {
    if (!token || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token, countdown]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{kiosk.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isLoading && !token && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {token && !error && (
            <>
              <div className="bg-white p-4 rounded-lg">
                <QRCode value={token} size={256} />
              </div>
              <p className="text-sm text-muted-foreground">
                Atualizando em {countdown} segundos...
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
