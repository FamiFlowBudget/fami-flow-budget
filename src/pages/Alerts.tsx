import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, TrendingUp, Bell, Settings, User, DollarSign } from "lucide-react";
import { useBudgetSupabase } from "@/hooks/useBudgetSupabase";
import { useState } from "react";
import { formatCurrency } from "@/types/budget";

export default function Alerts() {
  const { getCategoryProgress, members, currency } = useBudgetSupabase();
  const categoryProgress = getCategoryProgress();
  
  const [settings, setSettings] = useState({
    categoryAlerts: true,
    memberAlerts: true,
    budgetThreshold: 85,
    overspendingThreshold: 100,
    emailNotifications: true,
    pushNotifications: false
  });

  // Generar alertas activas
  const activeAlerts = [
    ...categoryProgress
      .filter(cat => cat.percentage >= settings.budgetThreshold)
      .map(cat => ({
        id: `cat-${cat.categoryId}`,
        type: cat.percentage >= settings.overspendingThreshold ? 'overspending' : 'high_usage',
        title: cat.percentage >= settings.overspendingThreshold ? 
          `Sobrepasaste el presupuesto en ${cat.categoryName}` :
          `Cerca del límite en ${cat.categoryName}`,
        description: `Has gastado ${formatCurrency(cat.spentAmount, currency)} de ${formatCurrency(cat.budgetAmount, currency)} (${cat.percentage.toFixed(1)}%)`,
        category: cat.categoryName,
        percentage: cat.percentage,
        amount: cat.spentAmount,
        timestamp: new Date().toISOString()
      })),
    
    // Alertas de miembros (simuladas)
    ...members
      .filter((_, index) => index < 2) // Solo mostrar algunas alertas de ejemplo
      .map((member, index) => ({
        id: `member-${member.id}`,
        type: 'member_overspending',
        title: `${member.name} ha gastado mucho este mes`,
        description: `Gastos elevados en comparación con meses anteriores`,
        member: member.name,
        percentage: 120 + index * 10,
        timestamp: new Date(Date.now() - index * 86400000).toISOString()
      }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overspending':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'high_usage':
        return <TrendingUp className="h-5 w-5 text-warning" />;
      case 'member_overspending':
        return <User className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'overspending':
        return 'destructive';
      case 'high_usage':
        return 'secondary';
      case 'member_overspending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertas y Notificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus alertas de presupuesto y configuraciones de notificación
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alertas Activas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alertas Activas
                <Badge variant="secondary">{activeAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay alertas activas</p>
                  <p className="text-sm">¡Todo está bajo control!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <Badge variant={getAlertBadge(alert.type) as any} className="text-xs">
                            {alert.percentage ? `${alert.percentage.toFixed(0)}%` : 'Alerta'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.timestamp).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Descartar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuración de Alertas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Alertas de Categorías</p>
                    <p className="text-xs text-muted-foreground">Notificar cuando se acerque al límite</p>
                  </div>
                  <Switch 
                    checked={settings.categoryAlerts}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, categoryAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Alertas de Miembros</p>
                    <p className="text-xs text-muted-foreground">Gastos elevados por miembro</p>
                  </div>
                  <Switch 
                    checked={settings.memberAlerts}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, memberAlerts: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Umbral de Alerta</p>
                    <span className="text-sm text-muted-foreground">{settings.budgetThreshold}%</span>
                  </div>
                  <Slider
                    value={[settings.budgetThreshold]}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, budgetThreshold: value[0] }))
                    }
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alertar cuando se use más del {settings.budgetThreshold}% del presupuesto
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Umbral de Sobregasto</p>
                    <span className="text-sm text-muted-foreground">{settings.overspendingThreshold}%</span>
                  </div>
                  <Slider
                    value={[settings.overspendingThreshold]}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, overspendingThreshold: value[0] }))
                    }
                    max={150}
                    min={90}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alertar cuando se sobrepase el {settings.overspendingThreshold}% del presupuesto
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-xs text-muted-foreground">Enviar por correo</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Push</p>
                    <p className="text-xs text-muted-foreground">Notificaciones push</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• {activeAlerts.filter(a => a.type === 'overspending').length} categorías sobrepasadas</p>
              <p>• {activeAlerts.filter(a => a.type === 'high_usage').length} categorías cerca del límite</p>
              <p>• {activeAlerts.filter(a => a.type === 'member_overspending').length} alertas de miembros</p>
              
              <div className="pt-4 border-t">
                <Button className="w-full" size="sm">
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}