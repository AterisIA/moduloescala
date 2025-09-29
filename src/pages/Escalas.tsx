import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, Filter, MoreHorizontal, Edit, Calendar, Clock, Users, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../components/ui/phone-input.css';
interface Escala {
  idescala: number;
  nomepessoaescala: string;
  dataescala: string;
  finalescala?: string;
  telefone?: string;
}

interface Coordenador {
  id_coordenador: string;
  nome: string;
}

interface Empresa {
  id_empresa: string;
  nome: string;
}
export default function Escalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([]);
  const [formData, setFormData] = useState({
    nomepessoaescala: "",
    dataescala: "",
    finalescala: "",
    telefone: "",
    id_coordenador: ""
  });
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchEscalas();
    fetchCoordenadores();
  }, []);

  const fetchCoordenadores = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('coordenador')
        .select('*')
        .order('nome', { ascending: true }) as { data: Coordenador[] | null; error: any };
      
      if (error) {
        toast({
          title: "Erro ao carregar coordenadores",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      setCoordenadores(data || []);
    } catch (error) {
      console.error("Erro ao buscar coordenadores:", error);
    }
  };

  const fetchEscalas = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('escala').select('*').order('dataescala', {
        ascending: false
      });
      if (error) {
        toast({
          title: "Erro ao carregar escalas",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      setEscalas(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar escalas",
        description: "Erro inesperado ao buscar dados.",
        variant: "destructive"
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
  const formatDuration = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    if (!endDate) {
      return `${formatDate(start)} - Em andamento`;
    }
    const duration = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor(duration % (1000 * 60 * 60) / (1000 * 60));
    return `${formatDate(start)} - ${formatDate(end)} (${hours}h${minutes > 0 ? `${minutes}min` : ''})`;
  };
  const handleEditEscala = (escala: Escala) => {
    setEditingEscala(escala);
    setIsCreating(false);
    setIsDialogOpen(true);
  };
  const handleCreateEscala = () => {
    setFormData({
      nomepessoaescala: "",
      dataescala: "",
      finalescala: "",
      telefone: "",
      id_coordenador: ""
    });
    setEditingEscala(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };
  const cleanPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '');
  };
  const handleSubmitEscala = async () => {
    if (!formData.nomepessoaescala || !formData.dataescala) {
      toast({
        title: "Erro",
        description: "Nome da pessoa e data inicial são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Remover o idescala do insert já que é gerado automaticamente
      const escalaData = {
        nomepessoaescala: formData.nomepessoaescala,
        dataescala: formData.dataescala,
        finalescala: formData.finalescala || null,
        telefone: formData.telefone ? cleanPhoneNumber(formData.telefone) : null,
        id_coordenador: formData.id_coordenador || null
      };
      const {
        error
      } = await supabase.from('escala').insert(escalaData);
      if (error) {
        toast({
          title: "Erro ao criar escala",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Sucesso",
        description: "Escala criada com sucesso!"
      });
      setIsDialogOpen(false);
      fetchEscalas(); // Recarregar lista
    } catch (error) {
      toast({
        title: "Erro ao criar escala",
        description: "Erro inesperado ao criar escala.",
        variant: "destructive"
      });
    }
  };
  return <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Escalas</h1>
          <p className="text-muted-foreground mt-1">Escalas ativas do sistema</p>
          
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateEscala} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Escala
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar por nome da pessoa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando escalas...</p>
            </div> : <div className="space-y-4">
              {filteredEscalas.length === 0 ? <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma escala encontrada.</p>
                </div> : filteredEscalas.map(escala => <div key={escala.idescala} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{escala.nomepessoaescala}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(escala.dataescala, escala.finalescala)}
                          </div>
                          {escala.telefone && <div className="text-xs">
                              📞 {escala.telefone}
                            </div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={escala.finalescala ? "secondary" : "default"}>
                        {escala.finalescala ? "Finalizada" : "Em andamento"}
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
                  </div>)}
            </div>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Criar Nova Escala" : "Detalhes da Escala"}</DialogTitle>
          </DialogHeader>
          
          {isCreating ? <div className="space-y-4">
              <div>
                <Label htmlFor="nomepessoaescala">Nome da Pessoa *</Label>
                <Input id="nomepessoaescala" value={formData.nomepessoaescala} onChange={e => setFormData(prev => ({
              ...prev,
              nomepessoaescala: e.target.value
            }))} placeholder="Digite o nome da pessoa" />
              </div>
              <div>
                <Label htmlFor="dataescala">Data/Hora de Início *</Label>
                <Input id="dataescala" type="datetime-local" value={formData.dataescala} onChange={e => setFormData(prev => ({
              ...prev,
              dataescala: e.target.value
            }))} />
              </div>
              <div>
                <Label htmlFor="finalescala">Data/Hora de Término</Label>
                <Input id="finalescala" type="datetime-local" value={formData.finalescala} onChange={e => setFormData(prev => ({
              ...prev,
              finalescala: e.target.value
            }))} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <PhoneInput international countryCallingCodeEditable={false} defaultCountry="BR" value={formData.telefone} onChange={value => setFormData(prev => ({
              ...prev,
              telefone: value || ""
            }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Digite o telefone" />
              </div>
              <div>
                <Label htmlFor="coordenador">Coordenador</Label>
                <Select value={formData.id_coordenador} onValueChange={value => setFormData(prev => ({
              ...prev,
              id_coordenador: value
            }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um coordenador" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordenadores.map(coord => <SelectItem key={coord.id_coordenador} value={coord.id_coordenador}>
                        {coord.nome}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitEscala}>
                  Criar Escala
                </Button>
              </div>
            </div> : editingEscala && <div className="space-y-4">
              <div>
                <Label>ID da Escala</Label>
                <p className="text-sm text-muted-foreground">{editingEscala.idescala}</p>
              </div>
              <div>
                <Label>Nome da Pessoa</Label>
                <p className="text-sm font-medium">{editingEscala.nomepessoaescala}</p>
              </div>
              <div>
                <Label>Duração da Escala</Label>
                <p className="text-sm text-muted-foreground">{formatDuration(editingEscala.dataescala, editingEscala.finalescala)}</p>
              </div>
              <div>
                <Label>Data de Início</Label>
                <p className="text-sm text-muted-foreground">{formatDate(editingEscala.dataescala)}</p>
              </div>
              {editingEscala.finalescala && <div>
                  <Label>Data de Término</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(editingEscala.finalescala)}</p>
                </div>}
              {editingEscala.telefone && <div>
                  <Label>Telefone</Label>
                  <p className="text-sm text-muted-foreground">{editingEscala.telefone}</p>
                </div>}
              <div className="flex justify-end">
                <Button onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
}