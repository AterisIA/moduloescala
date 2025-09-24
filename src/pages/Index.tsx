import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CheckCircle, Calendar, UserCheck, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      title: "Contatos Terceirização",
      description: "Gerencie pessoas de limpeza e recepção",
      icon: Users,
      href: "/contatos",
      color: "bg-blue-500"
    },
    {
      title: "Verificação de Presença",
      description: "Sistema de comunicação e alertas",
      icon: CheckCircle,
      href: "/verificacao",
      color: "bg-green-500"
    },
    {
      title: "Escalas",
      description: "Visualize e edite escalas ativas",
      icon: Calendar,
      href: "/escalas",
      color: "bg-purple-500"
    },
    {
      title: "Visão Calendário",
      description: "Visualização macro para coordenação",
      icon: Calendar,
      href: "/calendario",
      color: "bg-orange-500"
    },
    {
      title: "Detalhe Presença",
      description: "Controle micro de presença",
      icon: UserCheck,
      href: "/presenca",
      color: "bg-cyan-500"
    },
    {
      title: "Relatório Presença",
      description: "Resumo e métricas do dia",
      icon: BarChart3,
      href: "/relatorio",
      color: "bg-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Sistema de Gestão</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma completa para gerenciamento de presença e terceirização
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.href}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Bem-vindo ao Sistema</h2>
              <p className="text-muted-foreground mb-6">
                Selecione uma das opções acima para começar a gerenciar seu sistema de presença e terceirização.
              </p>
              <Link to="/contatos">
                <Button size="lg" className="gap-2">
                  <Users className="h-4 w-4" />
                  Começar com Contatos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
