import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { useFamilyContext } from '@/contexts/FamilyContext';
import { useToast } from '@/hooks/use-toast';

interface JoinFamilyFormProps {
  onSuccess: () => void;
}

export const JoinFamilyForm: React.FC<JoinFamilyFormProps> = ({ onSuccess }) => {
  const { joinFamily } = useFamilyContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    familyPublicId: '',
    pin: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.familyPublicId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El ID de familia es obligatorio"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await joinFamily(
        formData.familyPublicId.trim().toUpperCase(),
        formData.pin.trim() || undefined,
        formData.message.trim() || undefined
      );
      
      if (success) {
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud para unirte a la familia ha sido enviada. El administrador la revisará pronto."
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo procesar la solicitud. Verifica el ID de familia y el PIN."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al procesar la solicitud"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFamilyId = (value: string) => {
    // Auto-format as FAM-XXXX-XXXX
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.startsWith('FAM')) {
      const withoutPrefix = cleaned.slice(3);
      if (withoutPrefix.length <= 4) {
        return `FAM-${withoutPrefix}`;
      } else {
        return `FAM-${withoutPrefix.slice(0, 4)}-${withoutPrefix.slice(4, 8)}`;
      }
    } else {
      if (cleaned.length <= 4) {
        return cleaned ? `FAM-${cleaned}` : '';
      } else {
        return `FAM-${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
      }
    }
  };

  const handleFamilyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFamilyId(e.target.value);
    setFormData(prev => ({ ...prev, familyPublicId: formatted }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="family-id">ID de Familia *</Label>
        <Input
          id="family-id"
          value={formData.familyPublicId}
          onChange={handleFamilyIdChange}
          placeholder="FAM-XXXX-XXXX"
          maxLength={13}
          className="font-mono"
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          Formato: FAM-XXXX-XXXX (se completará automáticamente)
        </p>
      </div>

      <div>
        <Label htmlFor="pin">PIN de Unión (si es requerido)</Label>
        <Input
          id="pin"
          type="password"
          value={formData.pin}
          onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
          placeholder="6 dígitos"
          maxLength={6}
          pattern="[0-9]{6}"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Solo requerido si la familia tiene PIN activado
        </p>
      </div>

      <div>
        <Label htmlFor="message">Mensaje para el administrador (opcional)</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Preséntate y explica por qué quieres unirte a esta familia..."
          maxLength={500}
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Solicitar Unión'}
        </Button>
      </DialogFooter>
    </form>
  );
};