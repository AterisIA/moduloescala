import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface KioskFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function KioskForm({ onSuccess, onCancel }: KioskFormProps) {
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");
  const [ativo, setAtivo] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      // Gerar segredo base32 simples (em produção usar lib adequada)
      const segredo = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase.from("kiosks").insert({
        nome,
        local,
        ativo,
        segredo_base32: segredo.toUpperCase(),
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosks"] });
      toast({ title: "Kiosque criado com sucesso" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao criar kiosque", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !local.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do Kiosque</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Entrada Principal"
        />
      </div>

      <div>
        <Label htmlFor="local">Local</Label>
        <Input
          id="local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Ex: Recepção 1º Andar"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
        <Label htmlFor="ativo">Ativo</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Kiosque
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
