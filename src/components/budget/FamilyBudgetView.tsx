import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, User, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';
import { PeriodSelector } from '@/components/PeriodSelector';
import { BudgetFilters } from './BudgetFilters';
import { MonthlyBudgetView } from './MonthlyBudgetView';
import { AnnualBudgetView } from './AnnualBudgetView';
import { useToast } from '@/hooks/use-toast';
import { getCategoryIconById } from '@/lib/icons';
import { getCategoryPath } from '@/utils/categoryUtils';

// Helper component for category icons
const CategoryIcon = ({ category, categories }: { category: any; categories: any[] }) => {
  const IconComponent = getCategoryIconById(category.id, categories);
  return <IconComponent className="w-4 h-4" />;
};

export const FamilyBudgetView = () => {
  const { categories, members, currentMember, upsertBudget, deleteBudget, loading } = useBudgetSupabase();
  const { period } = usePeriod();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'monthly' | 'annual'>('monthly');
  const [formData, setFormData] = useState({
    categoryId: '',
    memberId: '',
    year: period.year,
    month: period.month,
    amount: 0
  });

  const handleDeleteBudget = async (budgetId: string, categoryName: string, memberName: string) => {
    if (currentMember?.role !== 'admin') return;
    
    try {
      await deleteBudget(budgetId);
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  // Manejar filtros
  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const clearFilters = () => {
    setSelectedMembers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await upsertBudget({
      categoryId: formData.categoryId,
      memberId: formData.memberId,
      year: formData.year,
      month: formData.month,
      amount: formData.amount,
      currency: 'CLP'
    });
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedBudget(null);
    setFormData({
      categoryId: '',
      memberId: '',
      year: period.year,
      month: period.month,
      amount: 0
    });
  };

  const openEditDialog = (categoryId: string, memberId: string, monthOverride?: number, existingBudget?: any) => {
    setSelectedBudget(existingBudget);
    setFormData({
      categoryId,
      memberId,
      year: period.year,
      month: monthOverride || period.month,
      amount: existingBudget?.amount || 0
    });
    setDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = getCategoryIconById(iconName, categories);
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryName = (categoryId: string) => {
    return getCategoryPath(categoryId, categories);
  };

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || 'Miembro';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Presupuesto Familiar</h2>
            <p className="text-muted-foreground">
              Gestiona presupuestos por categoría y miembro familiar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PeriodSelector />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Presupuesto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                  </DialogTitle>
                  <DialogDescription>
                    Define el presupuesto para un miembro específico en una categoría
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Año</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="month">Mes</Label>
                      <Select 
                        value={formData.month.toString()} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, month: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2024, i).toLocaleDateString('es-CL', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => !cat.parentId).map((category) => {
                          const subcategories = categories.filter(sub => sub.parentId === category.id);
                          return (
                            <div key={category.id}>
                              <SelectItem value={category.id}>
                                <div className="flex items-center gap-2 font-medium">
                                  <CategoryIcon category={category} categories={categories} />
                                  <span className="text-muted-foreground">📁</span>
                                  {category.name}
                                </div>
                              </SelectItem>
                              {subcategories.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                  <div className="flex items-center gap-2 ml-4">
                                    <CategoryIcon category={subcategory} categories={categories} />
                                    <span className="text-muted-foreground">└</span>
                                    {subcategory.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member">Miembro *</Label>
            <Select 
              value={formData.memberId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, memberId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar miembro" />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      required
                      min="0"
                      step="1000"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {selectedBudget ? 'Actualizar' : 'Crear'} Presupuesto
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <BudgetFilters 
          selectedMembers={selectedMembers}
          onMemberToggle={handleMemberToggle}
          onClearFilters={clearFilters}
        />

        {/* Tabs para vista mensual/anual */}
        <Tabs value={activeView} onValueChange={(value: string) => setActiveView(value as 'monthly' | 'annual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Vista Mensual
            </TabsTrigger>
            <TabsTrigger value="annual" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vista Anual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            <MonthlyBudgetView 
              selectedMembers={selectedMembers}
              onEditBudget={openEditDialog}
              onDeleteBudget={handleDeleteBudget}
            />
          </TabsContent>

          <TabsContent value="annual" className="mt-6">
            <AnnualBudgetView 
              selectedMembers={selectedMembers}
              onEditBudget={openEditDialog}
              onDeleteBudget={handleDeleteBudget}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};