import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Punch {
  id: string;
  tipo: string;
  punched_at: string;
  selfie_path: string;
  kiosks: {
    nome: string;
  };
}

export function RecentPunches() {
  const { data: punches, isLoading } = useQuery({
    queryKey: ["recent-punches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("id, tipo, punched_at, selfie_path, kiosks(nome)")
        .order("punched_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Punch[];
    },
  });

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage
      .from("attendance-selfies")
      .getPublicUrl(path);
    return data.publicUrl;
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Batidas Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {!punches || punches.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma batida registrada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {punches.map((punch) => (
              <div
                key={punch.id}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <video
                  controls
                  preload="metadata"
                  className="w-32 h-24 rounded object-cover"
                  src={getPublicUrl(punch.selfie_path)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{punch.tipo}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(punch.punched_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Kiosque: {punch.kiosks?.nome || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
