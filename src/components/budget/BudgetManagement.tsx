import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Calendar, User, DollarSign } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';

export const BudgetManagement = () => {
  const { budgets, categories, members, upsertBudget, loading } = useBudgetSupabase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    memberId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 0
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentBudgets = budgets.filter(b => b.year === currentYear && b.month === currentMonth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await upsertBudget({
      categoryId: formData.categoryId || undefined,
      memberId: formData.memberId || undefined,
      year: formData.year,
      month: formData.month,
      amount: formData.amount,
      currency: 'CLP'
    });
    
    setDialogOpen(false);
    setSelectedBudget(null);
    setFormData({
      categoryId: '',
      memberId: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: 0
    });
  };

  const openEditDialog = (budget: any) => {
    setSelectedBudget(budget);
    setFormData({
      categoryId: budget.categoryId || '',
      memberId: budget.memberId || '',
      year: budget.year,
      month: budget.month,
      amount: budget.amount
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedBudget(null);
    setFormData({
      categoryId: '',
      memberId: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: 0
    });
    setDialogOpen(true);
  };

  const getCategoryName = (categoryId?: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'General';
  };

  const getMemberName = (memberId?: string) => {
    return members.find(m => m.id === memberId)?.name || 'Familia';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Presupuestos</h2>
          <p className="text-muted-foreground">
            Configura presupuestos por categoría y miembro familiar
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </DialogTitle>
              <DialogDescription>
                Define el monto presupuestado para el período seleccionado
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
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member">Miembro</Label>
                <Select value={formData.memberId} onValueChange={(value) => setFormData(prev => ({ ...prev, memberId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar miembro (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toda la familia</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                  min="0"
                  step="1"
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

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Presupuestos del Mes Actual
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentBudgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay presupuestos configurados para este mes</p>
                <p className="text-sm">Crea tu primer presupuesto para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentBudgets.map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getCategoryName(budget.categoryId)}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getMemberName(budget.memberId)}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(budget.amount)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(budget)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};