import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Landmark, Wallet, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '@/types/budget';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  bank?: string;
  lastFourDigits?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta Corriente', icon: Landmark },
  { value: 'savings', label: 'Cuenta de Ahorros', icon: Landmark },
  { value: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'cash', label: 'Efectivo', icon: Wallet },
  { value: 'investment', label: 'Inversiones', icon: CreditCard },
];

const BANKS = [
  'Banco de Chile', 'BancoEstado', 'Santander', 'BCI', 'Scotiabank',
  'Itaú', 'BBVA', 'Banco Falabella', 'Banco Ripley', 'Coopeuch', 'Otro'
];

export const AccountManagement = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Cuenta Corriente Principal',
      type: 'checking',
      bank: 'Banco de Chile',
      lastFourDigits: '1234',
      balance: 2450000,
      currency: 'CLP',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Tarjeta Visa',
      type: 'credit',
      bank: 'Santander',
      lastFourDigits: '5678',
      balance: -345000,
      currency: 'CLP',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Efectivo',
      type: 'cash',
      balance: 125000,
      currency: 'CLP',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    bank: '',
    lastFourDigits: '',
    balance: '',
    currency: 'CLP'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      bank: '',
      lastFourDigits: '',
      balance: '',
      currency: 'CLP'
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      bank: account.bank || '',
      lastFourDigits: account.lastFourDigits || '',
      balance: account.balance.toString(),
      currency: account.currency
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const accountData: Account = {
      id: editingAccount?.id || Date.now().toString(),
      name: formData.name,
      type: formData.type as Account['type'],
      bank: formData.bank || undefined,
      lastFourDigits: formData.lastFourDigits || undefined,
      balance: parseFloat(formData.balance) || 0,
      currency: formData.currency,
      isActive: true,
      createdAt: editingAccount?.createdAt || new Date().toISOString()
    };

    if (editingAccount) {
      setAccounts(prev => prev.map(acc => 
        acc.id === editingAccount.id ? accountData : acc
      ));
      toast({
        title: "Cuenta actualizada",
        description: `${accountData.name} ha sido actualizada correctamente`,
      });
    } else {
      setAccounts(prev => [...prev, accountData]);
      toast({
        title: "Cuenta creada",
        description: `${accountData.name} ha sido agregada correctamente`,
      });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    toast({
      title: "Cuenta eliminada",
      description: `${account?.name} ha sido eliminada`,
    });
  };

  const getAccountIcon = (type: Account['type']) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    const Icon = accountType?.icon || Wallet;
    return <Icon className="w-5 h-5" />;
  };

  const getAccountTypeLabel = (type: Account['type']) => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.label || type;
  };

  const totalBalance = accounts
    .filter(acc => acc.isActive && acc.type !== 'credit')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalDebt = accounts
    .filter(acc => acc.isActive && acc.type === 'credit' && acc.balance < 0)
    .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cuentas y Tarjetas</h2>
          <p className="text-muted-foreground">
            Gestiona tus cuentas bancarias y métodos de pago
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showBalances ? 'Ocultar' : 'Mostrar'} Saldos
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Cuenta *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Cuenta Corriente Principal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Cuenta *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type && formData.type !== 'cash' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bank">Banco</Label>
                      <Select 
                        value={formData.bank} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, bank: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="digits">Últimos 4 dígitos</Label>
                      <Input
                        id="digits"
                        value={formData.lastFourDigits}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastFourDigits: e.target.value }))}
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Actual</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAccount ? 'Actualizar' : 'Crear'} Cuenta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patrimonio Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {showBalances ? formatCurrency(totalBalance - totalDebt, 'CLP') : '••••••'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {showBalances ? formatCurrency(totalBalance, 'CLP') : '••••••'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deudas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {showBalances ? formatCurrency(totalDebt, 'CLP') : '••••••'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.filter(acc => acc.isActive).map((account) => (
          <Card key={account.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {getAccountIcon(account.type)}
                  {account.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(account)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {getAccountTypeLabel(account.type)}
                  </Badge>
                  {account.bank && account.lastFourDigits && (
                    <span className="text-xs text-muted-foreground">
                      {account.bank} ****{account.lastFourDigits}
                    </span>
                  )}
                </div>
                
                <p className={`text-lg font-bold ${
                  account.balance < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {showBalances 
                    ? formatCurrency(account.balance, account.currency as any)
                    : '••••••'
                  }
                </p>

                <p className="text-xs text-muted-foreground">
                  Creada: {new Date(account.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Account Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => { resetForm(); setDialogOpen(true); }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Plus className="w-5 h-5" />
              Agregar Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conecta una nueva cuenta bancaria o método de pago
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};