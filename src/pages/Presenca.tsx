import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Clock, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PresenceEntry {
  idresposta: number;
  idescala: number;
  idcomunicacao: number;
  nomepessoaescala: string;
  telefone?: string;
  status?: string;
  dtcomunicacao?: string;
  dtresposta?: string;
  horaresposta?: string;
  dataescala?: string;
}

export default function Presenca() {
  const [entries, setEntries] = useState<PresenceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresenceData();
  }, []);

  const fetchPresenceData = async () => {
    try {
      setLoading(true);
      
      // Get resposta_comunicacao data
      const { data: respostaData, error: respostaError } = await supabase
        .from('resposta_comunicacao')
        .select('*')
        .order('dtcomunicacao', { ascending: false });
      
      if (respostaError) {
        console.error('Error fetching presence data:', respostaError);
        return;
      }

      // Get escala data separately
      const { data: escalaData, error: escalaError } = await supabase
        .from('escala')
        .select('*');

      if (escalaError) {
        console.error('Error fetching escala data:', escalaError);
        return;
      }

      // Create a map for quick lookup
      const escalaMap = new Map(escalaData?.map(e => [e.idescala, e]) || []);

      const formattedData: PresenceEntry[] = respostaData?.map((item: any) => {
        const escala = escalaMap.get(item.idescala);
        return {
          idresposta: item.idresposta,
          idescala: item.idescala,
          idcomunicacao: item.idcomunicacao,
          nomepessoaescala: escala?.nomepessoaescala || 'Nome não encontrado',
          telefone: escala?.telefone || undefined,
          status: item.status || undefined,
          dtcomunicacao: item.dtcomunicacao || undefined,
          dtresposta: item.dtresposta || undefined,
          horaresposta: item.horaresposta || undefined,
          dataescala: escala?.dataescala
        };
      }) || [];

      setEntries(formattedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.nomepessoaescala.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    if (!status) return "secondary";
    switch (status) {
      case "1":
        return "default";
      case "2":
        return "secondary";
      case "3":
        return "destructive";
      case "4":
        return "outline";
      case "Aguardando":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusText = (status?: string) => {
    if (!status) return "Sem status";
    switch (status) {
      case "1":
        return "Estarei presente";
      case "2":
        return "Vou me atrasar";
      case "3":
        return "Não poderei ir";
      case "4":
        return "Resposta inválida";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    return timeString;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleCreateEntry = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Detalhe Presença</h1>
          <p className="text-muted-foreground mt-1">Visualização micro para coordenadoras</p>
          <Badge variant="outline" className="mt-2">Responsável: Fernando</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar registros..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Aguardando">Aguardando</SelectItem>
                <SelectItem value="respondido">Respondido</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  Nenhum registro encontrado
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <div key={entry.idresposta} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{entry.nomepessoaescala}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Escala: {entry.idescala}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Comunicação: {formatDate(entry.dtcomunicacao)}
                          </span>
                          {entry.horaresposta && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Resposta: {formatTime(entry.horaresposta)}
                            </span>
                          )}
                        </div>
                        {entry.telefone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Telefone: {entry.telefone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        ID: {entry.idcomunicacao}
                      </Badge>
                      <Badge variant={getStatusColor(entry.status) as any}>
                        {getStatusText(entry.status)}
                      </Badge>
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
            <DialogTitle>Nova Entrada de Presença</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="person">Pessoa</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maria Silva">Maria Silva</SelectItem>
                  <SelectItem value="João Santos">João Santos</SelectItem>
                  <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Local</Label>
              <Input id="location" placeholder="Local de trabalho" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presente">Presente</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="saiu_cedo">Saiu Cedo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Horário Entrada</Label>
                <Input id="checkIn" type="time" />
              </div>
              <div>
                <Label htmlFor="checkOut">Horário Saída</Label>
                <Input id="checkOut" type="time" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" placeholder="Observações sobre a presença..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}