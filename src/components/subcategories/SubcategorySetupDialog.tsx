import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FolderPlus } from 'lucide-react';
import { DEFAULT_SUBCATEGORIES } from '@/types/budget';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';

interface SubcategorySetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

export const SubcategorySetupDialog = ({ isOpen, onClose, categoryId, categoryName }: SubcategorySetupDialogProps) => {
  const { addCategory } = useBudgetSupabase();
  const { toast } = useToast();
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Find subcategories by exact match or similar name
  const subcategoriesForCategory = DEFAULT_SUBCATEGORIES[categoryName] || 
    DEFAULT_SUBCATEGORIES[Object.keys(DEFAULT_SUBCATEGORIES).find(key => 
      key.toLowerCase() === categoryName.toLowerCase()
    ) || ''] || [];

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return colorMap[color] || colorMap.blue;
  };

  const toggleSubcategory = (subcategoryName: string) => {
    const newSelected = new Set(selectedSubcategories);
    if (newSelected.has(subcategoryName)) {
      newSelected.delete(subcategoryName);
    } else {
      newSelected.add(subcategoryName);
    }
    setSelectedSubcategories(newSelected);
  };

  const handleCreateSubcategories = async () => {
    if (selectedSubcategories.size === 0) {
      toast({
        title: "Selecciona subcategorías",
        description: "Debes seleccionar al menos una subcategoría para crear",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const promises = Array.from(selectedSubcategories).map(subcategoryName => {
        const subcategoryData = subcategoriesForCategory.find(sub => sub.name === subcategoryName);
        if (subcategoryData) {
          return addCategory({
            name: subcategoryData.name,
            icon: subcategoryData.icon,
            color: subcategoryData.color,
            parentId: categoryId,
            order: subcategoryData.order
          });
        }
        return Promise.resolve(null);
      });

      await Promise.all(promises);

      toast({
        title: "Subcategorías creadas",
        description: `Se crearon ${selectedSubcategories.size} subcategorías para ${categoryName}`,
      });

      onClose();
      setSelectedSubcategories(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron crear las subcategorías",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (subcategoriesForCategory.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Sin subcategorías disponibles
            </DialogTitle>
            <DialogDescription>
              No hay subcategorías predefinidas disponibles para la categoría "{categoryName}". 
              Puedes crear subcategorías manualmente desde el formulario de categorías.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Agregar Subcategorías a {categoryName}
          </DialogTitle>
          <DialogDescription>
            Selecciona las subcategorías que quieres agregar para organizar mejor tus gastos en {categoryName}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            {subcategoriesForCategory.map((subcategory) => (
              <Card 
                key={subcategory.name}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedSubcategories.has(subcategory.name) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleSubcategory(subcategory.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedSubcategories.has(subcategory.name)}
                        onChange={() => toggleSubcategory(subcategory.name)}
                      />
                      <Badge className={`flex items-center gap-2 ${getColorClass(subcategory.color)}`}>
                        {getIconComponent(subcategory.icon)}
                        {subcategory.name}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateSubcategories}
            disabled={selectedSubcategories.size === 0 || isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creando...' : `Crear ${selectedSubcategories.size} Subcategorías`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};