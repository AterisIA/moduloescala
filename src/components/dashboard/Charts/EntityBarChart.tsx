import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityRanking } from "@/types/dashboard";

interface EntityBarChartProps {
  data: EntityRanking[];
  title?: string;
}

export const EntityBarChart = ({ data, title = "Top 10 Escalas por Taxa de Confirmação" }: EntityBarChartProps) => {
  const topData = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              width={100}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Bar 
              dataKey="percentage" 
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
