import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PresenceDataPoint } from "@/types/dashboard";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PresenceLineChartProps {
  data: PresenceDataPoint[];
}

export const PresenceLineChart = ({ data }: PresenceLineChartProps) => {
  const formattedData = data.map(d => ({
    ...d,
    date: format(parseISO(d.date), 'dd/MM', { locale: ptBR })
  }));

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Evolução da Presença</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="presenca" 
              stroke="hsl(var(--success))" 
              name="Presença"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="atestado" 
              stroke="hsl(var(--warning))" 
              name="Atestado"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="falta" 
              stroke="hsl(var(--destructive))" 
              name="Falta"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="faltaJustificada" 
              stroke="hsl(var(--muted-foreground))" 
              name="Falta Justificada"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
