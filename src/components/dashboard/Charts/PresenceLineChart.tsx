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
        <CardTitle>Evolução das Respostas</CardTitle>
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
              dataKey="confirmado" 
              stroke="hsl(142 75% 50%)" 
              name="Confirmado"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="atraso" 
              stroke="hsl(38 92% 50%)" 
              name="Atraso"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="falta" 
              stroke="hsl(0 84% 60%)" 
              name="Falta"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="aguardando" 
              stroke="hsl(240 4% 46%)" 
              name="Aguardando"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
