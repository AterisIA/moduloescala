import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Clock, AlertCircle, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Verification {
  id: string;
  title: string;
  description: string;
  type: "presenca" | "emergencia" | "rotina";
  status: "pendente" | "enviado" | "respondido";
  targetRole: string;
  sentAt?: Date;
  respondedAt?: Date;
}

const mockVerifications: Verification[] = [
  {
    id: "1",
    title: "Verificação de Presença - Manhã",
    description: "Confirmar presença dos funcionários de limpeza no turno da manhã",
    type: "presenca",
    status: "respondido",
    targetRole: "Limpeza",
    sentAt: new Date("2024-01-15T08:00:00"),
    respondedAt: new Date("2024-01-15T08:15:00")
  },
  {
    id: "2", 
    title: "Alerta - Falta não justificada",
    description: "João Santos não compareceu ao trabalho hoje",
    type: "emergencia",
    status: "enviado",
    targetRole: "Recepção",
    sentAt: new Date("2024-01-15T09:30:00")
  },
  {
    id: "3",
    title: "Verificação Semanal",
    description: "Relatório semanal de presença",
    type: "rotina", 
    status: "pendente",
    targetRole: "Ambos"
  }
];

export default function Verificacao() {
  const [verifications, setVerifications] = useState<Verification[]>(mockVerifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVerification, setEditingVerification] = useState<Verification | null>(null);

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || verification.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "warning";
      case "enviado": return "default";
      case "respondido": return "success";
      default: return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "presenca": return <Clock className="h-4 w-4" />;
      case "emergencia": return <AlertCircle className="h-4 w-4" />;
      case "rotina": return <Send className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleCreateVerification = () => {
    setEditingVerification(null);
    setIsDialogOpen(true);
  };

  const handleEditVerification = (verification: Verification) => {
    setEditingVerification(verification);
    setIsDialogOpen(true);
  };

  const handleDeleteVerification = (id: string) => {
    setVerifications(verifications.filter(v => v.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verificação de Presença</h1>
          <p className="text-muted-foreground mt-1">Comunicação e alerta para verificar presença</p>
          <Badge variant="outline" className="mt-2">Responsável: Davi</Badge>
        </div>
        <Button onClick={handleCreateVerification} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Verificação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar verificações..."
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="respondido">Respondido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVerifications.map((verification) => (
              <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {getTypeIcon(verification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{verification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{verification.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Público: {verification.targetRole}</span>
                      {verification.sentAt && (
                        <span>Enviado: {verification.sentAt.toLocaleDateString()}</span>
                      )}
                      {verification.respondedAt && (
                        <span>Respondido: {verification.respondedAt.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={verification.type === "emergencia" ? "destructive" : "secondary"}>
                    {verification.type}
                  </Badge>
                  <Badge variant={getStatusColor(verification.status) as any}>
                    {verification.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditVerification(verification)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteVerification(verification.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
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
            <DialogTitle>
              {editingVerification ? "Editar Verificação" : "Nova Verificação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" placeholder="Título da verificação" />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presenca">Presença</SelectItem>
                  <SelectItem value="emergencia">Emergência</SelectItem>
                  <SelectItem value="rotina">Rotina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetRole">Público Alvo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Limpeza">Limpeza</SelectItem>
                  <SelectItem value="Recepção">Recepção</SelectItem>
                  <SelectItem value="Ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" placeholder="Descrição da verificação..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                {editingVerification ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}