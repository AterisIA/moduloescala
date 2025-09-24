import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  CheckCircle, 
  Calendar, 
  CalendarDays, 
  UserCheck, 
  BarChart3,
  Building2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  {
    name: "Contatos Terceirização",
    href: "/contatos",
    icon: Users,
    description: "Pessoas de limpeza e recepção"
  },
  {
    name: "Verificação de Presença",
    href: "/verificacao",
    icon: CheckCircle,
    description: "Comunicação e alerta"
  },
  {
    name: "Escalas",
    href: "/escalas",
    icon: Calendar,
    description: "Escalas ativas"
  },
  {
    name: "Visão Calendário",
    href: "/calendario",
    icon: CalendarDays,
    description: "Visualização macro"
  },
  {
    name: "Detalhe Presença",
    href: "/presenca",
    icon: UserCheck,
    description: "Visualização micro"
  },
  {
    name: "Relatório Presença",
    href: "/relatorio",
    icon: BarChart3,
    description: "Resumo do dia"
  }
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-foreground">Gestão</h1>
          <p className="text-xs text-muted-foreground">Sistema de Presença</p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-auto p-3",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.name}
                    </div>
                    <div className={cn(
                      "text-xs truncate",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}