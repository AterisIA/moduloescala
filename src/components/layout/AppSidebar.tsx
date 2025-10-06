import { 
  Users, 
  CheckCircle, 
  Calendar, 
  CalendarDays, 
  UserCheck, 
  BarChart3,
  Building2,
  LayoutDashboard,
  Clock,
  QrCode,
  Briefcase
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  {
    name: "Dashboard Avançado",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Análise completa"
  },
  {
    name: "Contatos Terceirização",
    href: "/contatos",
    icon: Users,
    description: "Pessoas de limpeza e recepção"
  },
  {
    name: "Coordenadores",
    href: "/coordenadores",
    icon: Users,
    description: "Gestão de coordenadores"
  },
  {
    name: "Plantões",
    href: "/plantoes",
    icon: Briefcase,
    description: "Gestão de plantões"
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
  },
  {
    name: "Gestão de Ponto",
    href: "/gestao-ponto",
    icon: Clock,
    description: "Gerenciar kiosques e batidas"
  },
  {
    name: "Bater Ponto",
    href: "/bater-ponto",
    icon: QrCode,
    description: "Registrar entrada/saída"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigation.some((item) => isActive(item.href));

  return (
    <Sidebar
      className={`transition-all duration-300 ${
        state === "collapsed" 
          ? "w-16" 
          : "w-64"
      }`}
      side="left"
      collapsible="icon"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground">Gestão</h1>
              <p className="text-xs text-muted-foreground">Sistema de Presença</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {state !== "collapsed" ? "Menu Principal" : ""}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    className={`h-auto py-3 justify-start ${isActive(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    <Link to={item.href} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {state !== "collapsed" && (
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-medium text-sm truncate">
                            {item.name}
                          </div>
                          <div className="text-xs opacity-70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}