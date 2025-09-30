import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TopPerformer } from "@/types/dashboard";

interface TopPerformersTableProps {
  data: TopPerformer[];
}

export const TopPerformersTable = ({ data }: TopPerformersTableProps) => {
  const getBadgeColor = (rate: number) => {
    if (rate >= 90) return "bg-success text-success-foreground";
    if (rate >= 75) return "bg-primary text-primary-foreground";
    if (rate >= 60) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead className="text-right">Dias Presentes</TableHead>
              <TableHead className="text-right">Total Dias</TableHead>
              <TableHead className="text-right">Taxa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum dado disponível
                </TableCell>
              </TableRow>
            ) : (
              data.map((performer, index) => (
                <TableRow key={performer.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{performer.name}</TableCell>
                  <TableCell>{performer.entity}</TableCell>
                  <TableCell className="text-right">{performer.presentDays}</TableCell>
                  <TableCell className="text-right">{performer.totalDays}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={getBadgeColor(performer.presencaRate)}>
                      {performer.presencaRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
