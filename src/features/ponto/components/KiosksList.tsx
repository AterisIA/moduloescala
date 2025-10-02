import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Trash2, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KioskQRModal } from "./KioskQRModal";

interface Kiosk {
  id: string;
  nome: string;
  local: string;
  ativo: boolean;
  created_at: string;
}

export function KiosksList() {
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kiosks, isLoading } = useQuery({
    queryKey: ["kiosks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Kiosk[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kiosks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      toast({ title: "Kiosque excluído com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir kiosque", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kiosques Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!kiosks || kiosks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum kiosque cadastrado. Crie um novo para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {kiosks.map((kiosk) => (
                <div
                  key={kiosk.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{kiosk.nome}</h3>
                      <Badge variant={kiosk.ativo ? "default" : "secondary"}>
                        {kiosk.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{kiosk.local}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedKiosk(kiosk)}
                      disabled={!kiosk.ativo}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Abrir QR
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(kiosk.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedKiosk && (
        <KioskQRModal
          kiosk={selectedKiosk}
          open={!!selectedKiosk}
          onClose={() => setSelectedKiosk(null)}
        />
      )}
    </>
  );
}
