import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ElementType;
}

const metrics: DashboardMetric[] = [
  {
    title: "Total de Funcionários",
    value: "8",
    change: "+2 este mês",
    changeType: "positive",
    icon: Users
  },
  {
    title: "Presença Hoje",
    value: "75%",
    change: "6 de 8 presentes",
    changeType: "neutral",
    icon: CheckCircle
  },
  {
    title: "Horas Trabalhadas",
    value: "32h",
    change: "+4h vs ontem",
    changeType: "positive",
    icon: Clock
  },
  {
    title: "Alertas Pendentes",
    value: "3",
    change: "2 críticos",
    changeType: "negative",
    icon: AlertTriangle
  }
];

interface AttendanceData {
  role: string;
  present: number;
  total: number;
  percentage: number;
}

const attendanceData: AttendanceData[] = [
  { role: "Limpeza", present: 3, total: 4, percentage: 75 },
  { role: "Recepção", present: 3, total: 4, percentage: 75 }
];

interface RecentActivity {
  id: string;
  person: string;
  action: string;
  time: string;
  status: "success" | "warning" | "error";
}

const recentActivities: RecentActivity[] = [
  {
    id: "1",
    person: "Maria Silva",
    action: "Check-in realizado",
    time: "08:00",
    status: "success"
  },
  {
    id: "2",
    person: "João Santos", 
    action: "Chegada atrasada",
    time: "08:15",
    status: "warning"
  },
  {
    id: "3",
    person: "Ana Costa",
    action: "Falta não justificada",
    time: "08:00",
    status: "error"
  }
];

export default function Relatorio() {
  const getChangeColor = (type: string) => {
    switch (type) {
      case "positive": return "text-green-600";
      case "negative": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatório de Presença</h1>
          <p className="text-muted-foreground mt-1">Resumo do dia - {new Date().toLocaleDateString("pt-BR")}</p>
          <Badge variant="outline" className="mt-2">Responsável: Fernando</Badge>
        </div>
        <Badge variant="secondary" className="text-xs">
          Apenas Visualização
        </Badge>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {metric.value}
                  </p>
                  <p className={`text-xs ${getChangeColor(metric.changeType)}`}>
                    {metric.change}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presença por função */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Presença por Função
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceData.map((data) => (
                <div key={data.role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{data.role}</span>
                    <span className="text-sm text-muted-foreground">
                      {data.present}/{data.total}
                    </span>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {data.percentage}% de presença
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atividades recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.person}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${getActivityColor(activity.status)}`}
                    >
                      {activity.status === "success" ? "OK" : 
                       activity.status === "warning" ? "Atenção" : "Erro"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do dia */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">6</div>
              <div className="text-sm text-muted-foreground">Funcionários Presentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">2</div>
              <div className="text-sm text-muted-foreground">Faltas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-muted-foreground">Atrasos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}