import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Edit, Plus, Trash2, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Plantao {
  id_plantao: string;
  nome: string;
  id_empresa: string;
  empresa?: {
    nome: string;
  };
}

interface Empresa {
  id_empresa: string;
  nome: string;
}

export default function Plantoes() {
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlantao, setEditingPlantao] = useState<Plantao | null>(null);
  const [deletingPlantao, setDeletingPlantao] = useState<Plantao | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    id_empresa: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPlantoes();
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) {
        toast({
          title: "Erro ao carregar empresas",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      setEmpresas(data || []);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    }
  };

  const fetchPlantoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plantao')
        .select(`
          *,
          empresa:id_empresa (
            nome
          )
        `)
        .order('nome', { ascending: true });

      if (error) {
        toast({
          title: "Erro ao carregar plantões",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      setPlantoes(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar plantões",
        description: "Erro inesperado ao buscar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlantoes = plantoes.filter(plantao => 
    plantao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plantao.empresa?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditPlantao = (plantao: Plantao) => {
    setEditingPlantao(plantao);
    setFormData({
      nome: plantao.nome,
      id_empresa: plantao.id_empresa
    });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreatePlantao = () => {
    setFormData({
      nome: "",
      id_empresa: ""
    });
    setEditingPlantao(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleDeletePlantao = (plantao: Plantao) => {
    setDeletingPlantao(plantao);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPlantao) return;

    try {
      const { error } = await supabase
        .from('plantao')
        .delete()
        .eq('id_plantao', deletingPlantao.id_plantao);

      if (error) {
        toast({
          title: "Erro ao excluir plantão",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Plantão excluído com sucesso!"
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingPlantao(null);
      fetchPlantoes();
    } catch (error) {
      toast({
        title: "Erro ao excluir plantão",
        description: "Erro inesperado ao excluir plantão.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitPlantao = async () => {
    if (!formData.nome || !formData.id_empresa) {
      toast({
        title: "Erro",
        description: "Nome do plantão e empresa são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('plantao')
          .insert({
            nome: formData.nome,
            id_empresa: formData.id_empresa
          });

        if (error) {
          toast({
            title: "Erro ao criar plantão",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Sucesso",
          description: "Plantão criado com sucesso!"
        });
      } else if (editingPlantao) {
        const { error } = await supabase
          .from('plantao')
          .update({
            nome: formData.nome,
            id_empresa: formData.id_empresa
          })
          .eq('id_plantao', editingPlantao.id_plantao);

        if (error) {
          toast({
            title: "Erro ao atualizar plantão",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Sucesso",
          description: "Plantão atualizado com sucesso!"
        });
      }

      setIsDialogOpen(false);
      fetchPlantoes();
    } catch (error) {
      toast({
        title: "Erro ao salvar plantão",
        description: "Erro inesperado ao salvar plantão.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plantões</h1>
          <p className="text-muted-foreground mt-1">Gerenciar plantões do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreatePlantao} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Plantão
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome do plantão ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando plantões...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlantoes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum plantão encontrado.</p>
                </div>
              ) : (
                filteredPlantoes.map((plantao) => (
                  <div
                    key={plantao.id_plantao}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {plantao.nome}
                        </h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <Badge variant="secondary">
                            {plantao.empresa?.nome || 'Sem empresa'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background z-50">
                        <DropdownMenuItem onClick={() => handleEditPlantao(plantao)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePlantao(plantao)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Criar Novo Plantão" : "Editar Plantão"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Plantão *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  nome: e.target.value
                }))}
                placeholder="Digite o nome do plantão"
              />
            </div>

            <div>
              <Label htmlFor="empresa">Empresa *</Label>
              <Select
                value={formData.id_empresa}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  id_empresa: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id_empresa} value={empresa.id_empresa}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmitPlantao}>
                {isCreating ? "Criar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plantão "{deletingPlantao?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}