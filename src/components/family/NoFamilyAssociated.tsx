// src/components/family/NoFamilyAssociated.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, LogIn } from 'lucide-react';

interface NoFamilyAssociatedProps {
  createFamily: (name: string) => Promise<any>;
  requestToJoinFamilyByCode: (code: string) => Promise<any>;
  loading: boolean;
}

export const NoFamilyAssociated = ({ createFamily, requestToJoinFamilyByCode, loading }: NoFamilyAssociatedProps) => {
  const [newFamilyName, setNewFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleCreateFamily = async () => {
    if (newFamilyName.trim()) {
      await createFamily(newFamilyName.trim());
      setNewFamilyName('');
    }
  };

  const handleJoinFamily = async () => {
    if (joinCode.trim()) {
      await requestToJoinFamilyByCode(joinCode.trim());
      setJoinCode('');
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Bienvenido a FamiFlow</CardTitle>
          <CardDescription>Para comenzar, crea una nueva familia o únete a una existente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Familia
              </TabsTrigger>
              <TabsTrigger value="join">
                <LogIn className="h-4 w-4 mr-2" />
                Unirse a Familia
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family-name">Nombre de tu Familia</Label>
                  <Input
                    id="family-name"
                    placeholder="Ej: Familia Pérez"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateFamily} disabled={loading || !newFamilyName.trim()} className="w-full">
                  {loading ? 'Creando...' : 'Crear Familia'}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="join" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code">Código de Invitación de Familia</Label>
                  <Input
                    id="join-code"
                    placeholder="Pega el código aquí"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>
                <Button onClick={handleJoinFamily} disabled={loading || !joinCode.trim()} className="w-full">
                  {loading ? 'Enviando solicitud...' : 'Enviar Solicitud para Unirme'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};