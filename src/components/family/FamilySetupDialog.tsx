import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFamilies } from '@/hooks/useFamilies';
import { Users, Plus, Search, Loader2 } from 'lucide-react';

interface FamilySetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FamilySetupDialog = ({ open, onOpenChange }: FamilySetupDialogProps) => {
  const { createFamily, requestToJoinFamily, loading } = useFamilies();
  const [activeTab, setActiveTab] = useState('create');
  
  // Create family form
  const [familyName, setFamilyName] = useState('');
  const [currency, setCurrency] = useState('CLP');
  
  // Join family form
  const [familyId, setFamilyId] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName) return;

    const result = await createFamily(familyName, currency);
    if (result && !result.error) {
      onOpenChange(false);
      setFamilyName('');
      setCurrency('CLP');
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    console.log('🔥 handleJoinFamily ejecutado con:', { familyId, joinMessage });
    e.preventDefault();
    if (!familyId) {
      console.log('❌ No hay familyId, abortando');
      return;
    }

    console.log('🚀 Llamando a requestToJoinFamily...');
    const result = await requestToJoinFamily(familyId, joinMessage);
    console.log('📋 Resultado de requestToJoinFamily:', result);
    
    if (result && !result.error) {
      console.log('✅ Solicitud exitosa, cerrando diálogo');
      onOpenChange(false);
      setFamilyId('');
      setJoinMessage('');
    } else {
      console.log('❌ Error en la solicitud:', result?.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configurar Familia
          </DialogTitle>
          <DialogDescription>
            Crea una nueva familia o únete a una existente para comenzar a gestionar el presupuesto familiar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Familia
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Unirse a Familia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crear Nueva Familia</CardTitle>
                <CardDescription>
                  Serás el administrador de esta familia y podrás invitar a otros miembros.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateFamily} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="family-name">Nombre de la Familia</Label>
                    <Input
                      id="family-name"
                      placeholder="Ej: Familia García"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                        <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading || !familyName}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Familia'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unirse a Familia Existente</CardTitle>
                <CardDescription>
                  Ingresa el ID de familia que te proporcionó el administrador.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinFamily} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="family-id">ID de Familia</Label>
                    <Input
                      id="family-id"
                      placeholder="FAM-XXXX-XXXX"
                      value={familyId}
                      onChange={(e) => setFamilyId(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="join-message">Mensaje (Opcional)</Label>
                    <Textarea
                      id="join-message"
                      placeholder="Presenta brevemente quién eres..."
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading || !familyId}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitud'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};