import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Users, Percent, DollarSign, Download } from 'lucide-react';
import { formatCurrency } from '@/types/budget';
import { useState } from 'react';

interface MemberSpending {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MemberStackedData {
  category: string;
  members: MemberSpending[];
  total: number;
}

interface MemberStackedProps {
  data: MemberStackedData[];
  currency: string;
  onMemberClick?: (memberId: string) => void;
}

export const MemberStacked = ({ data, currency, onMemberClick }: MemberStackedProps) => {
  const [viewMode, setViewMode] = useState<'amount' | 'percentage'>('amount');

  // Preparar datos para el gráfico
  const chartData = data.map(item => {
    const result: any = { category: item.category };
    item.members.forEach(member => {
      result[member.memberName] = viewMode === 'amount' ? member.amount : member.percentage;
    });
    return result;
  });

  // Obtener todos los miembros únicos para las barras
  const allMembers = Array.from(
    new Set(data.flatMap(item => item.members.map(m => m.memberName)))
  );

  // Colores para los miembros (usando la paleta del sistema de diseño)
  const memberColors = [
    'hsl(var(--primary))',
    'hsl(var(--accent))', 
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(158 64% 70%)', // Verde claro
    'hsl(217 91% 70%)', // Azul claro
  ];

  const handleBarClick = (data: any) => {
    // Encontrar el primer miembro con gasto en esta categoría
    const categoryData = chartData.find(item => item.category === data.category);
    if (categoryData && onMemberClick) {
      const firstMemberWithSpending = allMembers.find(member => 
        categoryData[member] && categoryData[member] > 0
      );
      if (firstMemberWithSpending) {
        const memberData = data.find(cat => cat.category === categoryData.category)
          ?.members.find(m => m.memberName === firstMemberWithSpending);
        if (memberData) {
          onMemberClick(memberData.memberId);
        }
      }
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Categoría', 'Miembro', 'Monto', 'Porcentaje'],
      ...data.flatMap(item => 
        item.members.map(member => [
          item.category,
          member.memberName,
          member.amount,
          member.percentage
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gastos-por-miembro.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: {viewMode === 'amount' 
                ? formatCurrency(entry.value, currency as any)
                : `${entry.value.toFixed(1)}%`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Gastos por Miembro</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'amount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('amount')}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Monto
            </Button>
            <Button 
              variant={viewMode === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('percentage')}
            >
              <Percent className="h-4 w-4 mr-1" />
              %
            </Button>
            <Button variant="ghost" size="sm" onClick={exportData}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
                className="text-xs"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => 
                  viewMode === 'amount' 
                    ? formatCurrency(value, currency as any)
                    : `${value}%`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {allMembers.map((member, index) => (
                <Bar
                  key={member}
                  dataKey={member}
                  stackId="members"
                  fill={memberColors[index % memberColors.length]}
                  name={member}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Gasto distribuido por miembro en cada categoría</p>
          <p>Haz clic en una barra para filtrar por ese miembro</p>
        </div>
      </CardContent>
    </Card>
  );
};