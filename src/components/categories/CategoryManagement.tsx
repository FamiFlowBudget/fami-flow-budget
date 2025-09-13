import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Palette, Edit, Trash2, MoreVertical, FolderPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { useToast } from '@/hooks/use-toast';
import { SubcategorySetupDialog } from '@/components/subcategories/SubcategorySetupDialog';
import * as Icons from 'lucide-react';

const iconOptions = [
  // Hogar y Vida
  'Home', 'Building', 'Building2', 'Warehouse', 'Store', 'House', 'Hotel',
  // Transporte
  'Car', 'Bus', 'Train', 'Plane', 'Bike', 'Motorcycle', 'Truck', 'Ship', 'Taxi', 'CarTaxiFront',
  // Alimentación y Compras
  'ShoppingCart', 'ShoppingBag', 'Store', 'Pizza', 'Coffee', 'Utensils', 'ChefHat', 'Sandwich', 'Salad', 'IceCream',
  // Salud y Bienestar
  'Heart', 'Stethoscope', 'Pill', 'Activity', 'Dumbbell', 'Zap', 'Plus', 'Cross', 'Thermometer',
  // Educación y Trabajo
  'GraduationCap', 'BookOpen', 'Book', 'School', 'Briefcase', 'Laptop', 'Monitor', 'PenTool', 'Calculator',
  // Entretenimiento
  'Gamepad2', 'Music', 'Headphones', 'Camera', 'Film', 'Tv', 'Radio', 'Ticket', 'PartyPopper', 'Guitar',
  // Ropa y Estilo
  'Shirt', 'Crown', 'Glasses', 'Watch', 'Gem', 'Scissors', 'Palette', 'Sparkles',
  // Finanzas y Ahorros
  'PiggyBank', 'DollarSign', 'CreditCard', 'Wallet', 'Coins', 'Banknote', 'TrendingUp', 'TrendingDown', 'Target',
  // Seguros y Emergencias
  'Shield', 'ShieldAlert', 'ShieldCheck', 'AlertTriangle', 'AlertCircle', 'Siren', 'Lock', 'Key',
  // Mascotas y Animales
  'Dog', 'Cat', 'Fish', 'Bird', 'Rabbit', 'Turtle', 'Bug',
  // Tecnología
  'Smartphone', 'Tablet', 'Computer', 'Keyboard', 'Mouse', 'Headphones', 'Speaker', 'Wifi', 'Battery',
  // Servicios
  'Zap', 'Droplets', 'Flame', 'Wind', 'Sun', 'Cloud', 'Wifi', 'Phone', 'Mail', 'MessageCircle',
  // Deportes y Fitness
  'Dumbbell', 'Activity', 'Award', 'Trophy', 'Medal', 'Target', 'Crosshair', 'Mountain', 'Waves',
  // Viajes y Ocio
  'MapPin', 'Map', 'Compass', 'Luggage', 'Tent', 'Palmtree', 'Umbrella', 'Camera', 'Binoculars',
  // Herramientas y Mantenimiento
  'Wrench', 'Hammer', 'Screwdriver', 'Settings', 'Cog', 'Tool', 'HardHat',
  // Regalos y Ocasiones Especiales
  'Gift', 'GiftBox', 'Cake', 'PartyPopper', 'Balloon', 'Heart', 'Star', 'Sparkles', 'Crown',
  // Otros
  'Tag', 'Folder', 'Archive', 'Package', 'Box', 'Circle', 'Square', 'Triangle', 'Hexagon', 'Star'
];

const colorOptions = [
  'blue', 'green', 'yellow', 'indigo', 'red', 'gray', 'purple', 'pink', 
  'orange', 'emerald', 'amber', 'cyan', 'violet', 'rose', 'lime', 'teal'
];

export const CategoryManagement = () => {
  const { categories, addCategory, updateCategory, deleteCategory, cleanDuplicateCategories, loading } = useBudgetSupabase();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<{id: string, name: string} | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Tag',
    color: 'blue',
    parentId: 'none'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'Tag',
      color: 'blue',
      parentId: 'none'
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      parentId: category.parentId || 'none'
    });
    setDialogOpen(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    try {
      await deleteCategory(categoryId);
      toast({
        title: "Categoría eliminada",
        description: `"${categoryName}" ha sido eliminada correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar la categoría",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          parentId: formData.parentId === 'none' ? null : formData.parentId
        });

        toast({
          title: "Categoría actualizada",
          description: `"${formData.name}" ha sido actualizada correctamente`,
        });
      } else {
        // Create new category
        const maxOrder = Math.max(...categories.map(c => c.order), 0);
        
        await addCategory({
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          parentId: formData.parentId === 'none' ? null : formData.parentId,
          order: maxOrder + 1
        });

        toast({
          title: "Categoría creada",
          description: `"${formData.name}" ha sido agregada correctamente`,
        });
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la categoría",
        variant: "destructive"
      });
    }
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={cleanDuplicateCategories}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Duplicados
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría para organizar tus gastos'}
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

              <div className="space-y-2">
                <Label htmlFor="parentId">Categoría Principal (Opcional)</Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría principal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría principal</SelectItem>
                    {categories.filter(cat => !cat.parentId && cat.id !== editingCategory?.id).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {getIconComponent(category.icon)}
                          {category.name}
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
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
         </Dialog>
        </div>
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
            <div className="space-y-4">
              {/* Categorías Principales */}
              {categories.filter(cat => !cat.parentId).map((category) => {
                const subcategories = categories.filter(sub => sub.parentId === category.id);
                return (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="group flex items-center justify-between mb-3">
                      <Badge className={`flex items-center gap-2 ${getColorClass(category.color)}`}>
                        {getIconComponent(category.icon)}
                        {category.name}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedCategoryForSub({id: category.id, name: category.name});
                          setSubcategoryDialogOpen(true);
                        }}>
                          <FolderPlus className="w-4 h-4 mr-2" />
                          Agregar Subcategorías
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Estás a punto de eliminar la categoría "{category.name}". 
                                  Esta acción no se puede deshacer y podría afectar gastos existentes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id, category.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Subcategorías */}
                    {subcategories.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 ml-4">
                        {subcategories.map((subcategory) => (
                          <div key={subcategory.id} className="group p-3 border border-dashed rounded-md hover:bg-muted/50 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`flex items-center gap-1 text-xs ${getColorClass(subcategory.color)}`}>
                                {getIconComponent(subcategory.icon)}
                                {subcategory.name}
                              </Badge>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(subcategory)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar subcategoría?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Estás a punto de eliminar la subcategoría "{subcategory.name}". 
                                          Esta acción no se puede deshacer y podría afectar gastos existentes.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(subcategory.id, subcategory.name)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
         </CardContent>
       </Card>

       {subcategoryDialogOpen && selectedCategoryForSub && (
         <SubcategorySetupDialog
           isOpen={subcategoryDialogOpen}
           onClose={() => {
             setSubcategoryDialogOpen(false);
             setSelectedCategoryForSub(null);
           }}
           categoryId={selectedCategoryForSub.id}
           categoryName={selectedCategoryForSub.name}
         />
       )}
     </div>
   );
 };