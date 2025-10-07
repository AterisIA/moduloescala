import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FaceUsersList() {
  const { data: faceUsers, isLoading } = useQuery({
    queryKey: ["face-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("face_users")
        .select(`
          *,
          contato:id_contato_terceirizacao(
            name,
            role,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
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

  if (!faceUsers || faceUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cadastros Faciais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum cadastro facial encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastros Faciais ({faceUsers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {faceUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{user.nome}</p>
                {user.matricula && (
                  <p className="text-sm text-muted-foreground">
                    Matrícula: {user.matricula}
                  </p>
                )}
                {user.contato && (
                  <p className="text-sm text-muted-foreground">
                    Contato: {user.contato.name} ({user.contato.role})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cadastrado{" "}
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
