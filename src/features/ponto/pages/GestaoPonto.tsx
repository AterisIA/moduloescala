import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KiosksList } from "../components/KiosksList";
import { KioskForm } from "../components/KioskForm";
import { RecentPunches } from "../components/RecentPunches";
import { FaceEnrollment } from "../components/FaceEnrollment";
import { FaceUsersList } from "../components/FaceUsersList";

export default function GestaoPonto() {
  const [showKioskForm, setShowKioskForm] = useState(false);
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Ponto</h1>
          <p className="text-muted-foreground">Gerencie kiosques, cadastros faciais e batidas de ponto</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowFaceEnrollment(true)} variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastro Facial
          </Button>
          <Button onClick={() => setShowKioskForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Kiosque
          </Button>
        </div>
      </div>

      {showKioskForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Kiosque</CardTitle>
            <CardDescription>Preencha os dados do novo ponto de registro</CardDescription>
          </CardHeader>
          <CardContent>
            <KioskForm onSuccess={() => setShowKioskForm(false)} onCancel={() => setShowKioskForm(false)} />
          </CardContent>
        </Card>
      )}

      {showFaceEnrollment && (
        <Card>
          <CardHeader>
            <CardTitle>Cadastro Facial (DEMO)</CardTitle>
            <CardDescription>
              Cadastre um rosto para reconhecimento facial. Nenhuma imagem será armazenada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FaceEnrollment 
              onSuccess={() => {
                setShowFaceEnrollment(false);
              }} 
              onCancel={() => setShowFaceEnrollment(false)} 
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KiosksList />
        <FaceUsersList />
      </div>
      
      <RecentPunches />
    </div>
  );
}
