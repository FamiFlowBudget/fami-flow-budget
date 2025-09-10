import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { useFamilyContext } from '@/contexts/FamilyContext';
import { useToast } from '@/hooks/use-toast';
import { Currency } from '@/types/budget';

interface CreateFamilyFormProps {
  onSuccess: () => void;
}

export const CreateFamilyForm: React.FC<CreateFamilyFormProps> = ({ onSuccess }) => {
  const { createFamily } = useFamilyContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    currency: 'CLP' as Currency
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la familia es obligatorio"
      });
      return;
    }

    setLoading(true);
    try {
      const newFamily = await createFamily(formData.name, formData.currency);
      
      if (newFamily) {
        toast({
          title: "Familia creada",
          description: `La familia "${newFamily.name}" ha sido creada exitosamente`
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear la familia"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al crear la familia"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="family-name">Nombre de la Familia *</Label>
        <Input
          id="family-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="ej. Familia Pérez"
          required
        />
      </div>

      <div>
        <Label htmlFor="currency">Moneda</Label>
        <Select
          value={formData.currency}
          onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as Currency }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
            <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
            <SelectItem value="EUR">Euro (EUR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Familia'}
        </Button>
      </DialogFooter>
    </form>
  );
};