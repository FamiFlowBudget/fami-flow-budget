import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { formatCurrency } from "@/types/budget";
import { useBudgetSupabase } from "@/hooks/useBudgetSupabase";
import { useState } from "react";
import * as Icons from 'lucide-react';

export const FamilyProgressCard = () => {
  const { getFamilyDataByCategory } = useBudgetSupabase();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const familyData = getFamilyDataByCategory();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  const getStatusVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'secondary';
    return 'default';
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  if (familyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progreso por Categoría</CardTitle>
          <CardDescription>No hay datos para mostrar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Configura presupuestos para ver el progreso familiar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso Familiar por Categoría</CardTitle>
        <CardDescription>
          Seguimiento de gastos por categoría con desglose familiar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {familyData.map((categoryData) => (
          <Collapsible
            key={categoryData.category.id}
            open={expandedCategories.has(categoryData.category.id)}
            onOpenChange={() => toggleCategory(categoryData.category.id)}
          >
            <div className="border rounded-lg">
              {/* Header de categoría con progreso familiar */}
              <CollapsibleTrigger className="w-full p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
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
                        {formatCurrency(categoryData.familySpent)} de {formatCurrency(categoryData.familyBudget)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(categoryData.familyPercentage)}>
                    {Math.round(categoryData.familyPercentage)}%
                  </Badge>
                </div>
                <div className="mt-3">
                  <Progress 
                    value={Math.min(categoryData.familyPercentage, 100)} 
                    className="h-2"
                  />
                </div>
              </CollapsibleTrigger>

              {/* Desglose por miembros */}
              <CollapsibleContent>
                <div className="border-t bg-accent/20 p-4 space-y-3">
                  {categoryData.memberData
                    .filter(md => md.budgetAmount > 0)
                    .map((memberData) => (
                      <div key={memberData.member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{memberData.member.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {memberData.member.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <Progress 
                              value={Math.min(memberData.percentage, 100)} 
                              className="h-1"
                            />
                          </div>
                          <div className="text-right min-w-24">
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(memberData.spentAmount)} / {formatCurrency(memberData.budgetAmount)}
                            </p>
                            <Badge variant={getStatusVariant(memberData.percentage)} className="text-xs">
                              {Math.round(memberData.percentage)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};