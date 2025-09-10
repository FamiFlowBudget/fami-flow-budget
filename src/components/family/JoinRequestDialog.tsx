import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFamilies } from '@/hooks/useFamilies';
import { Search, Loader2 } from 'lucide-react';

interface JoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinRequestDialog = ({ open, onOpenChange }: JoinRequestDialogProps) => {
  const { requestToJoinFamily, loading } = useFamilies();
  const [familyId, setFamilyId] = useState('');
  const [message, setMessage] = useState('');

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) return;

    const result = await requestToJoinFamily(familyId, message);
    if (result && !result.error) {
      onOpenChange(false);
      setFamilyId('');
      setMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Unirse a Familia
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID de familia para solicitar unirte a una familia existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleJoinRequest} className="space-y-4">
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
            <Label htmlFor="message">Mensaje (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Presenta brevemente quién eres..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};