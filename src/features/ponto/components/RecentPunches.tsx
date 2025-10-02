import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, User, CheckCircle2, XCircle } from "lucide-react";

interface Punch {
  id: string;
  tipo: string;
  punched_at: string;
  selfie_path: string | null;
  face_user_id: string | null;
  face_confidence: number | null;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_accuracy: number | null;
  geo_status: string | null;
  kiosks: {
    nome: string;
    local: string;
  };
  face_users?: {
    nome: string;
    matricula: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export function RecentPunches() {
  const [showOnlyWithLocation, setShowOnlyWithLocation] = useState(false);

  const { data: allPunches, isLoading } = useQuery({
    queryKey: ["recent-punches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select(`
          *,
          kiosks (nome, local),
          face_users (nome, matricula, latitude, longitude)
        `)
        .order("punched_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Punch[];
    },
    refetchInterval: 5000,
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getLocationBadge = (punch: Punch) => {
    if (!punch.geo_lat || !punch.geo_lng) {
      return <Badge variant="outline" className="text-xs">Sem GPS</Badge>;
    }

    if (!punch.face_users?.latitude || !punch.face_users?.longitude) {
      return <Badge variant="secondary" className="text-xs">Sem cadastro</Badge>;
    }

    const distance = calculateDistance(
      punch.geo_lat,
      punch.geo_lng,
      punch.face_users.latitude,
      punch.face_users.longitude
    );

    const isWithinRadius = distance <= 200;

    if (isWithinRadius) {
      return (
        <Badge variant="default" className="text-xs flex items-center gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Dentro do raio ({Math.round(distance)}m)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Fora do raio ({Math.round(distance)}m)
        </Badge>
      );
    }
  };

  const getGeoStatusBadge = (status: string | null) => {
    switch(status) {
      case 'ok': return <Badge variant="default" className="text-xs">GPS OK</Badge>;
      case 'low-accuracy': return <Badge variant="secondary" className="text-xs">Baixa precisão</Badge>;
      case 'stale': return <Badge variant="secondary" className="text-xs">Antigo</Badge>;
      case 'denied': return <Badge variant="destructive" className="text-xs">Negado</Badge>;
      case 'timeout': return <Badge variant="destructive" className="text-xs">Timeout</Badge>;
      default: return <Badge variant="outline" className="text-xs">Sem GPS</Badge>;
    }
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
        <div className="flex items-center justify-between">
          <CardTitle>Batidas Recentes ({punches?.length || 0})</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="location-filter" 
              checked={showOnlyWithLocation}
              onCheckedChange={(checked) => setShowOnlyWithLocation(checked as boolean)}
            />
            <Label htmlFor="location-filter" className="text-sm cursor-pointer">
              Somente com localização
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!punches || punches.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma batida registrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Pessoa</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Data/Hora</th>
                  <th className="text-left p-3">Kiosque</th>
                  <th className="text-left p-3">Localização</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((punch) => (
                  <tr key={punch.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      {punch.face_users ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{punch.face_users.nome}</p>
                            {punch.face_confidence && (
                              <p className="text-xs text-green-600">
                                {(punch.face_confidence * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Vídeo</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={punch.tipo === "ENTRADA" ? "default" : "secondary"}>
                        {punch.tipo}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(punch.punched_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{punch.kiosks.nome}</p>
                        <p className="text-xs text-muted-foreground">{punch.kiosks.local}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {punch.geo_lat && punch.geo_lng ? (
                        <div className="space-y-1">
                          {getLocationBadge(punch)}
                          {getGeoStatusBadge(punch.geo_status)}
                          <div className="text-xs text-muted-foreground">
                            ±{Math.round(punch.geo_accuracy || 0)}m
                          </div>
                          <a 
                            href={`https://www.google.com/maps?q=${punch.geo_lat},${punch.geo_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            Mapa
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
