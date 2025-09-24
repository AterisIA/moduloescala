import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Clock, User, MapPin } from "lucide-react";

interface PresenceEntry {
  id: string;
  person: string;
  role: string;
  checkIn?: Date;
  checkOut?: Date;
  status: "presente" | "ausente" | "atrasado" | "saiu_cedo";
  location: string;
  notes?: string;
}

const mockEntries: PresenceEntry[] = [
  {
    id: "1",
    person: "Maria Silva",
    role: "Limpeza",
    checkIn: new Date("2024-01-15T08:00:00"),
    checkOut: new Date("2024-01-15T12:00:00"),
    status: "presente",
    location: "Prédio A",
    notes: "Turno completo"
  },
  {
    id: "2", 
    person: "João Santos",
    role: "Recepção",
    checkIn: new Date("2024-01-15T08:15:00"),
    status: "atrasado",
    location: "Recepção Principal",
    notes: "Chegou 15 min atrasado"
  },
  {
    id: "3",
    person: "Ana Costa",
    role: "Limpeza",
    status: "ausente",
    location: "Prédio B",
    notes: "Não compareceu"
  }
];

export default function Presenca() {
  const [entries, setEntries] = useState<PresenceEntry[]>(mockEntries);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "presente": return "default";
      case "ausente": return "destructive";
      case "atrasado": return "secondary";
      case "saiu_cedo": return "outline";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "presente": return "Presente";
      case "ausente": return "Ausente";
      case "atrasado": return "Atrasado";
      case "saiu_cedo": return "Saiu Cedo";
      default: return status;
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "-";
    return date.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
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
        <Button onClick={handleCreateEntry} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <SelectItem value="presente">Presente</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="saiu_cedo">Saiu Cedo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{entry.person}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Entrada: {formatTime(entry.checkIn)}
                      </span>
                      {entry.checkOut && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Saída: {formatTime(entry.checkOut)}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={entry.role === "Limpeza" ? "default" : "secondary"}>
                    {entry.role}
                  </Badge>
                  <Badge variant={getStatusColor(entry.status) as any}>
                    {getStatusText(entry.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
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