import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Edit, Calendar, User, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';
import * as Icons from 'lucide-react';

export const FamilyBudgetView = () => {
  const { budgets, categories, members, upsertBudget, loading } = useBudgetSupabase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    categoryId: '',
    memberId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 0
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Organizar presupuestos por categoría y miembro
  const organizedBudgets = categories.map(category => {
    const categoryBudgets = budgets.filter(b => 
      b.categoryId === category.id && 
      b.year === currentYear && 
      b.month === currentMonth
    );

    const memberBudgets = members.map(member => {
      const memberBudget = categoryBudgets.find(b => b.memberId === member.id);
      return {
        member,
        budget: memberBudget,
        amount: memberBudget?.amount || 0
      };
    });

    const familyTotal = memberBudgets.reduce((sum, mb) => sum + mb.amount, 0);

    return {
      category,
      memberBudgets,
      familyTotal,
      hasData: familyTotal > 0
    };
  }).filter(cb => cb.hasData);

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
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: 0
    });
  };

  const openEditDialog = (categoryId: string, memberId: string, existingBudget?: any) => {
    setSelectedBudget(existingBudget);
    setFormData({
      categoryId,
      memberId,
      year: currentYear,
      month: currentMonth,
      amount: existingBudget?.amount || 0
    });
    setDialogOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Categoría';
  };

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || 'Miembro';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Presupuesto Familiar</h2>
          <p className="text-muted-foreground">
            Presupuestos organizados por categoría y miembro familiar
          </p>
        </div>
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
                    {categories.map(category => (
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

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <CardDescription>
              Presupuestos por categoría con desglose familiar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organizedBudgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay presupuestos configurados para este mes</p>
                <p className="text-sm">Crea presupuestos para cada miembro de la familia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizedBudgets.map((categoryData) => (
                  <Collapsible
                    key={categoryData.category.id}
                    open={expandedCategories.has(categoryData.category.id)}
                    onOpenChange={() => toggleCategory(categoryData.category.id)}
                  >
                    <div className="border rounded-lg">
                      {/* Header de categoría con total familiar */}
                      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {expandedCategories.has(categoryData.category.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                            {getIconComponent(categoryData.category.icon)}
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium">{categoryData.category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {categoryData.memberBudgets.filter(mb => mb.amount > 0).length} miembro(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(categoryData.familyTotal)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Familia</p>
                        </div>
                      </CollapsibleTrigger>

                      {/* Desglose por miembros */}
                      <CollapsibleContent>
                        <div className="border-t bg-accent/20">
                          {categoryData.memberBudgets.map((memberBudget) => (
                            <div 
                              key={memberBudget.member.id}
                              className="p-3 border-b last:border-b-0 flex items-center justify-between hover:bg-accent/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{memberBudget.member.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {memberBudget.member.role}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {formatCurrency(memberBudget.amount)}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditDialog(
                                    categoryData.category.id, 
                                    memberBudget.member.id, 
                                    memberBudget.budget
                                  )}
                                >
                                  {memberBudget.amount > 0 ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};