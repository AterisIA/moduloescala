import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, Filter, MoreHorizontal, Edit, Calendar, Clock, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Escala {
  idescala: number;
  nomepessoaescala: string;
  dataescala: string;
  telefone?: string;
}


export default function Escalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEscalas();
  }, []);

  const fetchEscalas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('escala')
        .select('*')
        .order('dataescala', { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar escalas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setEscalas(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar escalas",
        description: "Erro inesperado ao buscar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEscalas = escalas.filter(escala => {
    const matchesSearch = escala.nomepessoaescala.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditEscala = (escala: Escala) => {
    setEditingEscala(escala);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Escalas</h1>
          <p className="text-muted-foreground mt-1">Escalas ativas do sistema</p>
          <Badge variant="outline" className="mt-2">Responsável: Davi</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            Criar: Não permitido
          </Badge>
          <Badge variant="destructive" className="text-xs">
            Excluir: Não permitido
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome da pessoa..."
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
              <p className="text-muted-foreground">Carregando escalas...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEscalas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma escala encontrada.</p>
                </div>
              ) : (
                filteredEscalas.map((escala) => (
                  <div key={escala.idescala} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Escala #{escala.idescala}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {escala.nomepessoaescala}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(escala.dataescala)}
                          </span>
                          {escala.telefone && (
                            <span className="text-xs">
                              Tel: {escala.telefone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        Escala
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditEscala(escala)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            <DialogTitle>Detalhes da Escala</DialogTitle>
          </DialogHeader>
          {editingEscala && (
            <div className="space-y-4">
              <div>
                <Label>ID da Escala</Label>
                <p className="text-sm text-muted-foreground">{editingEscala.idescala}</p>
              </div>
              <div>
                <Label>Nome da Pessoa</Label>
                <p className="text-sm text-muted-foreground">{editingEscala.nomepessoaescala}</p>
              </div>
              <div>
                <Label>Data/Hora da Escala</Label>
                <p className="text-sm text-muted-foreground">{formatDate(editingEscala.dataescala)}</p>
              </div>
              {editingEscala.telefone && (
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm text-muted-foreground">{editingEscala.telefone}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}