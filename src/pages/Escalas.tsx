import { useState } from "react";
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

interface Escala {
  id: string;
  name: string;
  role: string;
  shift: "manha" | "tarde" | "noite";
  days: string[];
  startTime: string;
  endTime: string;
  status: "ativa" | "pausada";
  assignedPerson: string;
}

const mockEscalas: Escala[] = [
  {
    id: "1",
    name: "Limpeza Manhã",
    role: "Limpeza",
    shift: "manha",
    days: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    startTime: "08:00",
    endTime: "12:00",
    status: "ativa",
    assignedPerson: "Maria Silva"
  },
  {
    id: "2",
    name: "Recepção Integral",
    role: "Recepção", 
    shift: "manha",
    days: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    startTime: "08:00",
    endTime: "18:00",
    status: "ativa",
    assignedPerson: "João Santos"
  },
  {
    id: "3",
    name: "Limpeza Tarde",
    role: "Limpeza",
    shift: "tarde",
    days: ["Segunda", "Quarta", "Sexta"],
    startTime: "14:00",
    endTime: "18:00",
    status: "pausada",
    assignedPerson: "Ana Costa"
  }
];

export default function Escalas() {
  const [escalas, setEscalas] = useState<Escala[]>(mockEscalas);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null);

  const filteredEscalas = escalas.filter(escala => {
    const matchesSearch = escala.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escala.assignedPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || escala.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case "manha": return "default";
      case "tarde": return "secondary";
      case "noite": return "outline";
      default: return "secondary";
    }
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
                placeholder="Buscar escalas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="Limpeza">Limpeza</SelectItem>
                <SelectItem value="Recepção">Recepção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEscalas.map((escala) => (
              <div key={escala.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{escala.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {escala.assignedPerson}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {escala.startTime} - {escala.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {escala.days.join(", ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={escala.role === "Limpeza" ? "default" : "secondary"}>
                    {escala.role}
                  </Badge>
                  <Badge variant={getShiftColor(escala.shift) as any}>
                    {escala.shift === "manha" ? "Manhã" : escala.shift === "tarde" ? "Tarde" : "Noite"}
                  </Badge>
                  <Badge variant={escala.status === "ativa" ? "default" : "secondary"}>
                    {escala.status === "ativa" ? "Ativa" : "Pausada"}
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
                        Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Escala</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Escala</Label>
              <Input id="name" placeholder="Nome da escala" defaultValue={editingEscala?.name} />
            </div>
            <div>
              <Label htmlFor="assignedPerson">Pessoa Designada</Label>
              <Select defaultValue={editingEscala?.assignedPerson}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Horário Início</Label>
                <Input id="startTime" type="time" defaultValue={editingEscala?.startTime} />
              </div>
              <div>
                <Label htmlFor="endTime">Horário Fim</Label>
                <Input id="endTime" type="time" defaultValue={editingEscala?.endTime} />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={editingEscala?.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}