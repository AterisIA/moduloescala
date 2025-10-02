import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, ExternalLink } from "lucide-react";

interface Punch {
  id: string;
  tipo: string;
  punched_at: string;
  selfie_path: string;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_accuracy: number | null;
  geo_status: string | null;
  kiosks: {
    nome: string;
  };
}

export function RecentPunches() {
  const [showOnlyWithLocation, setShowOnlyWithLocation] = useState(false);

  const { data: allPunches, isLoading } = useQuery({
    queryKey: ["recent-punches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("id, tipo, punched_at, selfie_path, geo_lat, geo_lng, geo_accuracy, geo_status, kiosks(nome)")
        .order("punched_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Punch[];
    },
  });

  const punches = showOnlyWithLocation 
    ? allPunches?.filter(p => p.geo_lat !== null && p.geo_lng !== null)
    : allPunches;

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

  const getGeoStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ok: "default",
      "low-accuracy": "secondary",
      denied: "destructive",
      timeout: "destructive",
      unavailable: "outline",
      error: "destructive",
      stale: "secondary",
    };

    const labels: Record<string, string> = {
      ok: "OK",
      "low-accuracy": "Baixa precisão",
      denied: "Negado",
      timeout: "Timeout",
      unavailable: "Indisponível",
      error: "Erro",
      stale: "Antigo",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batidas Recentes</CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="location-filter" 
              checked={showOnlyWithLocation}
              onCheckedChange={(checked) => setShowOnlyWithLocation(checked === true)}
            />
            <Label htmlFor="location-filter" className="text-sm cursor-pointer">
              Somente com localização
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!punches || punches.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {showOnlyWithLocation 
              ? "Nenhuma batida com localização encontrada."
              : "Nenhuma batida registrada ainda."
            }
          </p>
        ) : (
          <div className="space-y-4">
            {punches.map((punch) => (
              <div
                key={punch.id}
                className="flex flex-col gap-3 p-4 border rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <video
                    controls
                    preload="metadata"
                    className="w-32 h-24 rounded object-cover"
                    src={getPublicUrl(punch.selfie_path)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{punch.tipo}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(punch.punched_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Kiosque: {punch.kiosks?.nome || "N/A"}
                    </p>
                    
                    {/* Informações de Geolocalização */}
                    {punch.geo_lat !== null && punch.geo_lng !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Localização:</span>
                          <span className="font-mono text-xs">
                            {punch.geo_lat.toFixed(5)}, {punch.geo_lng.toFixed(5)}
                          </span>
                          {punch.geo_accuracy && (
                            <span className="text-muted-foreground">
                              (±{Math.round(punch.geo_accuracy)}m)
                            </span>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${punch.geo_lat},${punch.geo_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Mapa
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getGeoStatusBadge(punch.geo_status)}
                        </div>
                      </div>
                    ) : punch.geo_status ? (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Sem localização:</span>
                        {getGeoStatusBadge(punch.geo_status)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
