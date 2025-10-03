import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Coordenador {
  id_coordenador: string;
  nome: string;
  telefone: number | null;
}

export default function Coordenadores() {
  const [open, setOpen] = useState(false);
  const [editingCoordenador, setEditingCoordenador] = useState<Coordenador | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coordenadores, isLoading } = useQuery({
    queryKey: ["coordenadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coordenador")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Coordenador[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCoordenador: { nome: string; telefone: number | null }) => {
      const { error } = await supabase
        .from("coordenador")
        .insert([newCoordenador]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordenadores"] });
      toast({ title: "Coordenador criado com sucesso!" });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar coordenador", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nome: string; telefone: number | null } }) => {
      const { error } = await supabase
        .from("coordenador")
        .update(data)
        .eq("id_coordenador", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordenadores"] });
      toast({ title: "Coordenador atualizado com sucesso!" });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar coordenador", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coordenador")
        .delete()
        .eq("id_coordenador", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordenadores"] });
      toast({ title: "Coordenador excluído com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir coordenador", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setNome("");
    setTelefone("");
    setEditingCoordenador(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const telefoneNum = telefone ? parseInt(telefone) : null;
    
    if (editingCoordenador) {
      updateMutation.mutate({
        id: editingCoordenador.id_coordenador,
        data: { nome, telefone: telefoneNum },
      });
    } else {
      createMutation.mutate({ nome, telefone: telefoneNum });
    }
  };

  const handleEdit = (coordenador: Coordenador) => {
    setEditingCoordenador(coordenador);
    setNome(coordenador.nome);
    setTelefone(coordenador.telefone?.toString() || "");
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este coordenador?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coordenadores</h1>
          <p className="text-muted-foreground">Gerencie os coordenadores do sistema</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Coordenador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCoordenador ? "Editar Coordenador" : "Novo Coordenador"}
              </DialogTitle>
              <DialogDescription>
                {editingCoordenador 
                  ? "Atualize as informações do coordenador" 
                  : "Preencha os dados para criar um novo coordenador"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Nome do coordenador"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Apenas números"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCoordenador ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Coordenadores</CardTitle>
          <CardDescription>
            Total de {coordenadores?.length || 0} coordenadores cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coordenadores?.map((coordenador) => (
                  <TableRow key={coordenador.id_coordenador}>
                    <TableCell className="font-medium">{coordenador.nome}</TableCell>
                    <TableCell>{coordenador.telefone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coordenador)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coordenador.id_coordenador)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {coordenadores?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum coordenador cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
