import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Palette } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import * as Icons from 'lucide-react';

const iconOptions = [
  'Home', 'ShoppingCart', 'Car', 'GraduationCap', 'Heart', 'Shield', 
  'Gamepad2', 'Shirt', 'PiggyBank', 'AlertTriangle', 'Coffee', 'Plane',
  'Music', 'Book', 'Smartphone', 'Laptop', 'Gift', 'Camera', 'Bicycle',
  'Pizza', 'Stethoscope', 'Wrench', 'Briefcase', 'Baby'
];

const colorOptions = [
  'blue', 'green', 'yellow', 'indigo', 'red', 'gray', 'purple', 'pink', 
  'orange', 'emerald', 'amber', 'cyan', 'violet', 'rose', 'lime', 'teal'
];

export const CategoryManagement = () => {
  const { categories, addCategory, loading } = useBudgetSupabase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Tag',
    color: 'blue'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const maxOrder = Math.max(...categories.map(c => c.order), 0);
    
    await addCategory({
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      order: maxOrder + 1
    });
    
    setDialogOpen(false);
    setFormData({
      name: '',
      icon: 'Tag',
      color: 'blue'
    });
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-5 h-5" />;
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
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      violet: 'bg-violet-100 text-violet-800 border-violet-200',
      rose: 'bg-rose-100 text-rose-800 border-rose-200',
      lime: 'bg-lime-100 text-lime-800 border-lime-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
          <p className="text-muted-foreground">
            Organiza tus gastos con categorías personalizadas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
              <DialogDescription>
                Crea una nueva categoría para organizar tus gastos
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Supermercado, Gasolina..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícono</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {iconOptions.map(icon => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {getIconComponent(icon)}
                          {icon}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${getColorClass(color).split(' ')[0]}`} />
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 border rounded-lg">
                <Label className="text-sm text-muted-foreground">Vista previa</Label>
                <div className="mt-2">
                  <Badge className={`flex items-center gap-2 w-fit ${getColorClass(formData.color)}`}>
                    {getIconComponent(formData.icon)}
                    {formData.name || 'Nombre de categoría'}
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Categoría
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Categorías Activas
          </CardTitle>
          <CardDescription>
            {categories.length} categorías configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay categorías configuradas</p>
              <p className="text-sm">Crea tu primera categoría para comenzar</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <Badge className={`flex items-center gap-2 w-fit ${getColorClass(category.color)}`}>
                    {getIconComponent(category.icon)}
                    {category.name}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};