import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  person: string;
  role: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "presente" | "ausente" | "pendente";
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Turno Manhã",
    person: "Maria Silva",
    role: "Limpeza",
    date: new Date("2024-01-15"),
    startTime: "08:00",
    endTime: "12:00",
    status: "presente"
  },
  {
    id: "2",
    title: "Recepção Integral",
    person: "João Santos", 
    role: "Recepção",
    date: new Date("2024-01-15"),
    startTime: "08:00",
    endTime: "18:00",
    status: "ausente"
  },
  {
    id: "3",
    title: "Turno Tarde",
    person: "Ana Costa",
    role: "Limpeza",
    date: new Date("2024-01-16"),
    startTime: "14:00",
    endTime: "18:00",
    status: "pendente"
  }
];

export default function Calendario() {
  const [events] = useState<CalendarEvent[]>(mockEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || event.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "presente": return "success";
      case "ausente": return "destructive";
      case "pendente": return "warning";
      default: return "secondary";
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visão Calendário</h1>
          <p className="text-muted-foreground mt-1">Visualização macro para sócios e coordenadoras</p>
          <Badge variant="outline" className="mt-2">Responsável: Fernando</Badge>
        </div>
        <Badge variant="secondary" className="text-xs">
          Apenas Visualização
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar eventos..."
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-48 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Header with day names */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth(currentDate).map((date, index) => {
              const dayEvents = date ? getEventsForDate(date) : [];
              
              return (
                <div 
                  key={index} 
                  className={`min-h-24 p-1 border border-border ${date ? 'bg-background hover:bg-muted/50' : 'bg-muted/20'} transition-colors`}
                >
                  {date && (
                    <>
                      <div className="text-sm font-medium text-foreground mb-1">
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                            title={`${event.person} - ${event.startTime}-${event.endTime}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                event.status === 'presente' ? 'bg-green-500' :
                                event.status === 'ausente' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className="truncate">{event.person}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <h3 className="text-sm font-medium">Legenda:</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Presente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Ausente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Pendente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}