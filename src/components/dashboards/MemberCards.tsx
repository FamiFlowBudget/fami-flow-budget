import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, User, Eye, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/types/budget';

interface MemberData {
  id: string;
  name: string;
  photoUrl?: string;
  role: 'admin' | 'adult' | 'kid';
  monthlySpent: number;
  monthlyBudget: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  variance: number;
  expenseCount: number;
  topCategories: {
    categoryName: string;
    amount: number;
    color: string;
  }[];
  last6Months: {
    month: string;
    spent: number;
  }[];
}

interface MemberCardsProps {
  members: MemberData[];
  currency: string;
  onMemberClick?: (memberId: string) => void;
  onViewAllExpenses?: (memberId: string) => void;
}

export const MemberCards = ({ 
  members, 
  currency, 
  onMemberClick,
  onViewAllExpenses 
}: MemberCardsProps) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'adult': return 'bg-secondary text-secondary-foreground';
      case 'kid': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'danger': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'adult': return 'Adulto';
      case 'kid': return 'Niño';
      default: return role;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card 
          key={member.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onMemberClick?.(member.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={member.photoUrl} alt={member.name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                    {getRoleName(member.role)}
                  </Badge>
                </div>
              </div>
              <div className={`text-right ${getStatusColor(member.status)}`}>
                {member.variance >= 0 ? (
                  <TrendingUp className="h-4 w-4 inline" />
                ) : (
                  <TrendingDown className="h-4 w-4 inline" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Gastado</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(member.monthlySpent, currency as any)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Presupuesto</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(member.monthlyBudget, currency as any)}
                </p>
              </div>
            </div>

            {/* Progreso */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Progreso</span>
                <span className={`text-sm font-bold ${getStatusColor(member.status)}`}>
                  {member.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(member.percentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{member.expenseCount} gastos</span>
                <span className={member.variance >= 0 ? 'text-success' : 'text-destructive'}>
                  {member.variance >= 0 ? 'Disponible: ' : 'Excedido: '}
                  {formatCurrency(Math.abs(member.variance), currency as any)}
                </span>
              </div>
            </div>

            {/* Mini gráficos */}
            <div className="grid grid-cols-2 gap-3">
              {/* Sparkline 6 meses */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tendencia 6M</p>
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={member.last6Months}>
                      <Line
                        type="monotone"
                        dataKey="spent"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mini donut categorías */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Top Categorías</p>
                <div className="h-12 flex items-center">
                  <div className="w-12 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={member.topCategories.slice(0, 3)}
                          dataKey="amount"
                          innerRadius={15}
                          outerRadius={24}
                        >
                          {member.topCategories.slice(0, 3).map((category, index) => (
                            <Cell key={index} fill={category.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ml-2 space-y-1">
                    {member.topCategories.slice(0, 2).map((category, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate max-w-[60px]">
                            {category.categoryName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAllExpenses?.(member.id);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver gastos
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onMemberClick?.(member.id);
                }}
              >
                <DollarSign className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};