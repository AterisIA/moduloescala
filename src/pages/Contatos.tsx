import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Phone, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  notes?: string;
}

interface ContactForm {
  name: string;
  role: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  notes: string;
}

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    role: "",
    phone: "",
    email: "",
    status: "active",
    notes: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contatos-terceirizacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatos_terceirizacao')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contact[];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (contact: ContactForm & { id?: string }) => {
      if (contact.id) {
        const { error } = await supabase
          .from('contatos_terceirizacao')
          .update({
            name: contact.name,
            role: contact.role,
            phone: contact.phone,
            email: contact.email,
            status: contact.status,
            notes: contact.notes || null
          })
          .eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contatos_terceirizacao')
          .insert({
            name: contact.name,
            role: contact.role,
            phone: contact.phone,
            email: contact.email,
            status: contact.status,
            notes: contact.notes || null
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos-terceirizacao'] });
      toast({
        title: editingContact ? "Contato atualizado" : "Contato criado",
        description: editingContact ? "O contato foi atualizado com sucesso." : "O novo contato foi criado com sucesso."
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível salvar o contato: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contatos_terceirizacao')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos-terceirizacao'] });
      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o contato: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      status: "active",
      notes: ""
    });
    setEditingContact(null);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || contact.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateContact = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      status: contact.status,
      notes: contact.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contato?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.role || !formData.phone || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    saveMutation.mutate(editingContact ? { ...formData, id: editingContact.id } : formData);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contatos Terceirização</h1>
          <p className="text-muted-foreground mt-1">Gerenciar pessoas de limpeza e recepção</p>
          <Badge variant="outline" className="mt-2">Responsável: Clara</Badge>
        </div>
        <Button onClick={handleCreateContact} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar contatos..."
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando contatos...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum contato encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{contact.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={contact.role === "Limpeza" ? "default" : "secondary"}>
                    {contact.role}
                  </Badge>
                  <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                    {contact.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteContact(contact.id)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Editar Contato" : "Novo Contato"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name" 
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="role">Função *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Limpeza">Limpeza</SelectItem>
                  <SelectItem value="Recepção">Recepção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input 
                id="phone" 
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingContact ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}