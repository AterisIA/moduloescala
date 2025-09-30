import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIMetric } from "@/types/dashboard";

interface KPICardsProps {
  metrics: KPIMetric[];
}

export const KPICards = ({ metrics }: KPICardsProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {metric.prefix}{metric.value.toFixed(metric.suffix === '%' ? 1 : 0)}{metric.suffix}
              </div>
              <div className={`flex items-center gap-1 text-sm ${getChangeColor(metric.changeType)}`}>
                {getIcon(metric.changeType)}
                <span>{Math.abs(metric.change).toFixed(1)}{metric.suffix}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
