import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KiosksList } from "../components/KiosksList";
import { KioskForm } from "../components/KioskForm";
import { RecentPunches } from "../components/RecentPunches";

export default function GestaoPonto() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Ponto</h1>
          <p className="text-muted-foreground">Gerencie kiosques e visualize batidas de ponto</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Kiosque
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Kiosque</CardTitle>
            <CardDescription>Preencha os dados do novo ponto de registro</CardDescription>
          </CardHeader>
          <CardContent>
            <KioskForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      <KiosksList />
      
      <RecentPunches />
    </div>
  );
}
