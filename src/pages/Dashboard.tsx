
import React, { useMemo, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Presupuesto } from '../types';
import MonthlyRecapModal from '../components/MonthlyRecapModal';

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const getEffectiveBudget = (presupuesto: Presupuesto, date: Date): number => {
    if (presupuesto.periodo === 'anual') return presupuesto.monto / 12;
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return presupuesto.ajustes_mensuales?.[yearMonth] ?? presupuesto.monto;
};

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
    const iconRadius = outerRadius * 1.25; 
    const lineStartRadius = outerRadius; 
    const lineEndRadius = outerRadius * 1.15;
    const x = cx + iconRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + iconRadius * Math.sin(-midAngle * RADIAN);
    const sx = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
    const sy = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);
    const ex = cx + lineEndRadius * Math.cos(-midAngle * RADIAN);
    const ey = cy + lineEndRadius * Math.sin(-midAngle * RADIAN);
    const displayPercent = payload.realPercentage;
    const color = payload.color || '#999';

    return (
        <g>
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={1} opacity={0.5} />
            <foreignObject x={x - 20} y={y - 20} width={40} height={40} style={{ overflow: 'visible' }}>
                <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border z-10 mb-0.5 transition-transform hover:scale-110" style={{ borderColor: color, color: color }}>
                        <i className={`fas ${payload.icon} text-[10px]`}></i>
                    </div>
                    <div className="flex flex-col items-center bg-white/95 rounded-sm shadow-sm border border-gray-100 px-1 py-0 z-20">
                         <span className="text-[9px] font-bold leading-none" style={{ color: color }}>{displayPercent.toFixed(0)}%</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

// --- MOBILE "STITCH" DASHBOARD COMPONENTS ---

const StitchBalanceCard: React.FC = () => {
    const { gastos, presupuestos, currentUser } = useData();
    const now = new Date();
    const myBudgets = presupuestos.filter(p => p.id_miembro === currentUser.id);
    const myExpenses = gastos.filter(g => g.id_miembro === currentUser.id && new Date(g.fecha).getMonth() === now.getMonth() && new Date(g.fecha).getFullYear() === now.getFullYear());
    const totalBudget = myBudgets.reduce((sum, p) => sum + getEffectiveBudget(p, now), 0);
    const totalSpent = myExpenses.reduce((sum, g) => sum + g.monto, 0);
    const balance = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
        <div className="w-full bg-[#18181b] rounded-2xl p-6 shadow-lg border border-gray-800 relative overflow-hidden">
            {/* Decorative Background Pattern (Matching Accounts/Budgets style) */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-900/10 to-transparent opacity-30 pointer-events-none"></div>
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-gray-400 text-xs font-medium tracking-wider uppercase">Saldo Disponible</p>
                        <h2 className="text-4xl font-bold text-white mt-1 tracking-tight">{formatCurrency(balance)}</h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-800 text-emerald-500 flex items-center justify-center border border-gray-700 shadow-inner">
                        <i className="fas fa-wallet"></i>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Presupuesto</p>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-sm text-gray-200 font-bold">{formatCurrency(totalBudget)}</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                         <p className="text-gray-500 text-xs uppercase tracking-wide">Gastado</p>
                         <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm text-gray-200 font-bold">{formatCurrency(totalSpent)}</span>
                             <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar Stitch Style */}
                <div className="mt-5 h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${percentage > 100 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const StitchActionButtons: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => navigate('/import')}
                className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-gray-800/50"
            >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg border border-gray-700 text-emerald-400">
                    <i className="fas fa-camera"></i>
                </div>
                <span className="text-xs font-bold text-gray-300">Escanear Gasto</span>
            </button>
            <button 
                onClick={() => navigate('/trip-planner')}
                className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-gray-800/50"
            >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg border border-gray-700 text-blue-400">
                    <i className="fas fa-plane-departure"></i>
                </div>
                <span className="text-xs font-bold text-gray-300">Planificar Viaje</span>
            </button>
        </div>
    );
};

const StitchQuickStats: React.FC = () => {
    const { gastos, currentUser } = useData();
    const now = new Date();
    const myExpenses = gastos.filter(g => g.id_miembro === currentUser.id && new Date(g.fecha).getMonth() === now.getMonth());
    const count = myExpenses.length;
    const avg = count > 0 ? myExpenses.reduce((s, g) => s + g.monto, 0) / count : 0;

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                     <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Movimientos</span>
                     <p className="text-xl font-bold text-white">{count}</p>
                </div>
                 <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <i className="fas fa-receipt text-xs"></i>
                </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Promedio</span>
                    <p className="text-xl font-bold text-white">{formatCurrency(avg).replace('$ ', '$')}</p>
                </div>
                 <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <i className="fas fa-chart-line text-xs"></i>
                </div>
            </div>
        </div>
    );
};

const StitchRecentTransactions: React.FC = () => {
     const { gastos, categorias, currentUser } = useData();
     const navigate = useNavigate();
     
     // Filter strictly by current user for mobile view
     const myExpenses = gastos.filter(g => g.id_miembro === currentUser.id);
     // Get last 3 expenses
     const recent = myExpenses.slice(0, 3);

     return (
         <div className="mt-6">
             <div className="flex justify-between items-center mb-4 px-1">
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mis Recientes</h3>
                 <button onClick={() => navigate('/expenses')} className="text-xs text-emerald-500 font-bold hover:text-emerald-400">VER TODO</button>
             </div>
             <div className="space-y-3">
                 {recent.map(g => {
                     const cat = categorias.find(c => c.id === g.id_categoria);
                     return (
                         <div key={g.id} className="flex items-center justify-between bg-[#18181b] p-3 rounded-xl border border-gray-800 active:scale-[0.99] transition-transform">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 border border-gray-700">
                                     <i className={`fas ${cat?.icon || 'fa-circle'} text-sm`}></i>
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-gray-200">{g.descripcion}</p>
                                     <p className="text-xs text-gray-500">{cat?.nombre}</p>
                                 </div>
                             </div>
                             <p className="text-sm font-bold text-white">{formatCurrency(g.monto)}</p>
                         </div>
                     )
                 })}
                 {recent.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Sin movimientos recientes.</p>}
             </div>
         </div>
     )
}


// --- DESKTOP COMPONENTS (UNCHANGED FROM ORIGINAL) ---

const MonefyChartWidget: React.FC = () => {
    const { gastos, presupuestos, categorias, currentUser } = useData();
    const navigate = useNavigate();

    const { totalGastado, totalPresupuesto, chartData } = useMemo(() => {
        const now = new Date();
        const myExpenses = gastos.filter(g => g.id_miembro === currentUser.id);
        const myBudgets = presupuestos.filter(p => p.id_miembro === currentUser.id);
        const parentCategories = categorias.filter(c => !c.parent_id && c.tipo === 'egreso');
        const dataMap = new Map<string, { id: string, name: string, color: string, icon: string, realAmount: number }>();
        
        parentCategories.forEach(cat => {
            dataMap.set(cat.id, {
                id: cat.id,
                name: cat.nombre,
                color: cat.color,
                icon: cat.icon,
                realAmount: 0
            });
        });

        const expensesOfMonth = myExpenses.filter(g => {
            const expenseDate = new Date(g.fecha);
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        });

        let spent = 0;
        expensesOfMonth.forEach(g => {
            spent += g.monto;
            const cat = categorias.find(c => c.id === g.id_categoria);
            if (cat && cat.tipo === 'egreso') {
                const targetId = cat.parent_id || cat.id;
                if (dataMap.has(targetId)) {
                    const item = dataMap.get(targetId)!;
                    item.realAmount += g.monto;
                }
            }
        });

        const budget = myBudgets.reduce((sum, p) => sum + getEffectiveBudget(p, now), 0);
        const finalData = Array.from(dataMap.values()).map(item => {
            const visualValue = item.realAmount > 0 ? item.realAmount : (spent > 0 ? spent * 0.0001 : 1);
            return {
                ...item,
                value: visualValue, 
                realAmount: item.realAmount,
                realPercentage: spent > 0 ? (item.realAmount / spent) * 100 : 0
            };
        });

        finalData.sort((a, b) => b.realAmount - a.realAmount);

        return {
            totalGastado: spent,
            totalPresupuesto: budget,
            chartData: finalData
        };

    }, [gastos, presupuestos, categorias, currentUser.id]);

    const saldo = totalPresupuesto - totalGastado;
    const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });

    return (
        <div className="card flex flex-col h-full relative overflow-visible border-emerald-500 border-t-4">
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center">
                    <h2 className="text-lg font-bold text-gray-800">Mis Finanzas</h2>
                    <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full capitalize">{currentMonthName}</span>
                </div>
                <div className="space-x-3 text-gray-400 text-xs"><span>Solo tú</span></div>
            </div>

            <div className="flex-grow relative flex items-center justify-center py-2">
                {chartData.length > 0 ? (
                    <div className="w-full h-[300px] sm:h-[360px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius="45%" outerRadius="60%" dataKey="value" paddingAngle={2} minAngle={15} label={renderCustomizedLabel} labelLine={false} isAnimationActive={true} animationDuration={800}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={1} fillOpacity={entry.realAmount === 0 ? 0.3 : 1} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string, props: any) => [formatCurrency(props.payload.realAmount), props.payload.name]} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10 w-32">
                            <p className="text-[9px] text-gray-400 font-bold tracking-widest mb-0.5 uppercase">Presupuesto</p>
                            <p className="text-base font-bold text-blue-500 opacity-90 truncate px-1">{formatCurrency(totalPresupuesto)}</p>
                            <div className="w-8 h-px bg-gray-200 mx-auto my-1"></div>
                            <p className="text-base font-bold text-red-500 opacity-90 truncate px-1">{formatCurrency(totalGastado)}</p>
                            <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-0.5 uppercase">Gastado</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[280px] text-gray-400">
                        <i className="fas fa-chart-pie fa-3x mb-3 opacity-20"></i>
                        <p className="text-sm">No hay datos personales aún</p>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100">
                 <div className={`p-3 rounded-lg text-center text-white shadow-md transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5 ${saldo >= 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`} onClick={() => navigate('/budget')}>
                    <p className="text-xs font-bold opacity-90 mb-0.5 uppercase tracking-wide">Mi Saldo Disponible</p>
                    <p className="text-xl font-bold tracking-tight">{formatCurrency(saldo)}</p>
                 </div>
            </div>
        </div>
    );
};

const DailyPacingWidget: React.FC = () => {
    const { gastos, presupuestos, currentUser } = useData();
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = today.getDate();
    const myBudgets = useMemo(() => presupuestos.filter(p => p.id_miembro === currentUser.id), [presupuestos, currentUser.id]);
    const myExpenses = useMemo(() => gastos.filter(g => g.id_miembro === currentUser.id), [gastos, currentUser.id]);
    const totalPresupuesto = useMemo(() => myBudgets.reduce((sum, p) => sum + getEffectiveBudget(p, new Date()), 0), [myBudgets]);
    const gastoObjetivoDiario = totalPresupuesto > 0 ? totalPresupuesto / daysInMonth : 0;
    const gastosHoy = useMemo(() => myExpenses.filter(g => new Date(g.fecha).toDateString() === today.toDateString()), [myExpenses, today]);
    const gastoRealHoy = gastosHoy.reduce((sum, g) => sum + g.monto, 0);
    const pacing = gastoObjetivoDiario > 0 && gastoRealHoy > gastoObjetivoDiario ? ((gastoRealHoy / gastoObjetivoDiario) - 1) * 100 : 0;
    const pacingColor = pacing > 0 ? 'var(--color-warning)' : 'var(--text-secondary)';

    return (
         <div className="card h-full flex flex-col justify-between p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-3 text-emerald-600"><i className="fas fa-tachometer-alt fa-lg"></i></div>
                    <h3 className="text-lg font-semibold text-gray-700">Mi Ritmo Diario</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100" style={{color: pacingColor}}>{pacing > 0 ? 'EXCEDIDO' : 'OK'}</span>
            </div>
            <div className="flex-grow flex flex-col justify-center">
                <div className="flex justify-around text-center mb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Meta Diaria</p>
                        <p className="text-xl font-bold text-gray-700">{formatCurrency(gastoObjetivoDiario)}</p>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                     <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hoy</p>
                        <p className={`text-xl font-bold ${gastoRealHoy > gastoObjetivoDiario ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(gastoRealHoy)}</p>
                    </div>
                </div>
                <div className="relative h-12 mx-4">
                     <div className="absolute top-1/2 w-full border-t-2 border-gray-100"></div>
                     <div className="absolute top-1/2 transform -translate-y-1/2 h-3 bg-emerald-200 rounded-full transition-all duration-1000" style={{ width: `${(currentDayOfMonth / daysInMonth) * 100}%` }}></div>
                    <div className="absolute top-0 flex flex-col items-center transition-all duration-1000" style={{ left: `calc(${(currentDayOfMonth) / daysInMonth * 100}%)`, transform: 'translateX(-50%)' }}>
                        <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 shadow-sm">Día {currentDayOfMonth}</div>
                        <div className="w-0.5 h-full bg-emerald-500"></div>
                    </div>
                </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">{gastoRealHoy > gastoObjetivoDiario ? "Estás gastando más rápido de lo planeado." : "Vas a buen ritmo personal."}</p>
        </div>
    );
}

const SummaryCards: React.FC = () => {
    const { gastos, presupuestos, currentUser } = useData();
    const navigate = useNavigate();
    const now = new Date();
    const myBudgets = presupuestos.filter(p => p.id_miembro === currentUser.id);
    const myExpenses = gastos.filter(g => g.id_miembro === currentUser.id);
    const totalPresupuesto = myBudgets.reduce((sum, p) => sum + getEffectiveBudget(p, now), 0);
    const currentExpenses = myExpenses.filter(g => {
        const d = new Date(g.fecha);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const transacciones = currentExpenses.length;
    
    return (
        <div className="grid grid-cols-1 gap-4">
            <div 
                onClick={() => navigate('/budget')}
                className="card flex items-center p-4 cursor-pointer hover:shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4"><i className="fas fa-wallet fa-lg"></i></div>
                <div>
                    <p className="text-sm text-gray-500">Mi Presupuesto</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(totalPresupuesto)}</p>
                </div>
            </div>
             <div 
                onClick={() => navigate('/expenses')}
                className="card flex items-center p-4 cursor-pointer hover:shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 mr-4"><i className="fas fa-receipt fa-lg"></i></div>
                <div>
                    <p className="text-sm text-gray-500">Mis Movimientos</p>
                    <p className="text-xl font-bold text-gray-800">{transacciones} <span className="text-xs font-normal text-gray-400">reg.</span></p>
                </div>
            </div>
        </div>
    )
}

const FamilyOverviewSection: React.FC = () => {
    const { gastos, presupuestos, categorias } = useData();
    const navigate = useNavigate();
    const { chartData, categoriesProgress, totalFamilyBudget } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const familyExpenses = gastos.filter(g => {
            const d = new Date(g.fecha);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const parentCats = categorias.filter(c => !c.parent_id && c.tipo === 'egreso');
        const data = parentCats.map(cat => {
             const childrenIds = categorias.filter(c => c.parent_id === cat.id).map(c => c.id);
             const allIds = [cat.id, ...childrenIds];
             const spent = familyExpenses.filter(g => allIds.includes(g.id_categoria)).reduce((sum, g) => sum + g.monto, 0);
             const budget = presupuestos.filter(p => allIds.includes(p.id_categoria)).reduce((sum, p) => sum + getEffectiveBudget(p, now), 0);
             return { ...cat, name: cat.nombre, spent, budget, percent: budget > 0 ? (spent / budget) * 100 : 0 };
        });
        const chartD = data.filter(d => d.spent > 0);
        const listD = data.sort((a, b) => b.spent - a.spent);
        const totalBudget = data.reduce((acc, cur) => acc + cur.budget, 0);
        return { chartData: chartD, categoriesProgress: listD, totalFamilyBudget: totalBudget };
    }, [gastos, presupuestos, categorias]);

    const totalFamilySpent = chartData.reduce((acc, cur) => acc + cur.spent, 0);

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><i className="fas fa-users text-indigo-600 mr-2"></i>Resumen Familiar</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-1 flex flex-col items-center justify-center p-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 self-start">Distribución de Gastos</h3>
                    {chartData.length > 0 ? (
                        <div className="w-full h-[250px] relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" paddingAngle={5} dataKey="spent" nameKey="name">
                                        {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-32">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Gastado</p>
                                <p className="text-lg font-bold text-gray-800 leading-tight my-0.5">{formatCurrency(totalFamilySpent)}</p>
                                <div className="w-8 h-px bg-gray-200 mx-auto my-1"></div>
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Presupuesto</p>
                                <p className="text-sm font-semibold text-emerald-600 leading-tight">{formatCurrency(totalFamilyBudget)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col justify-center items-center text-gray-400 text-sm"><i className="fas fa-receipt fa-2x mb-2 opacity-30"></i>No hay gastos familiares este mes.</div>
                    )}
                </div>

                <div className="card lg:col-span-2 p-6">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Progreso de Presupuestos (Por Categoría)</h3>
                        <button onClick={() => navigate('/budget')} className="text-emerald-600 text-xs font-medium hover:underline">Ver detalles</button>
                    </div>
                    <div className="space-y-5 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                        {categoriesProgress.map(cat => {
                            if (cat.spent === 0 && cat.budget === 0) return null;
                            const percent = Math.min(cat.percent, 100);
                            const isOver = cat.spent > cat.budget && cat.budget > 0;
                            return (
                                <div key={cat.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-md flex items-center justify-center mr-2" style={{ backgroundColor: cat.color + '20', color: cat.color }}><i className={`fas ${cat.icon} text-xs`}></i></div>
                                            <span className="font-semibold text-gray-700 text-sm">{cat.nombre}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-gray-800'}`}>{formatCurrency(cat.spent)}</span>
                                            <span className="text-xs text-gray-400 ml-1">/ {cat.budget > 0 ? formatCurrency(cat.budget) : 'Sin límite'}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : ''}`} style={{ width: `${percent}%`, backgroundColor: isOver ? undefined : cat.color }}></div>
                                    </div>
                                </div>
                            );
                        })}
                         {categoriesProgress.every(c => c.spent === 0 && c.budget === 0) && (
                            <p className="text-center text-gray-400 text-sm py-4">No hay actividad financiera este mes.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReminderBanner: React.FC<{ message: string, type?: 'info' | 'warning' }> = ({ message, type = 'info' }) => {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;
    
    const bgColor = type === 'info' ? 'bg-blue-500' : 'bg-orange-500';
    
    return (
        <div className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-md mb-6 flex justify-between items-center animate-fadeIn`}>
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <i className={`fas ${type === 'info' ? 'fa-calendar-week' : 'fa-stopwatch'}`}></i>
                </div>
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={() => setVisible(false)} className="text-white/70 hover:text-white"><i className="fas fa-times"></i></button>
        </div>
    );
}

const Dashboard: React.FC = () => {
    const { gastos, presupuestos, categorias, currentUser } = useData();
    const [showMonthlyRecap, setShowMonthlyRecap] = useState(false);
    const [reminder, setReminder] = useState<{msg: string, type: 'info' | 'warning'} | null>(null);

    useEffect(() => {
        // 1. Check for Monthly Recap Logic
        const checkMonthlyRecap = () => {
            const now = new Date();
            const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            // We check if user has seen report for the PREVIOUS month.
            // E.g., if today is November, we check if we showed October's report.
            // Actually, we tag the "seen" key with the current month, implying "I have seen the recap generated AT the start of this month"
            const lastSeenKey = localStorage.getItem(`famiFlow_recap_seen_${currentUser.id}`);
            
            // If we haven't seen this month's recap of the LAST month, show it.
            if (lastSeenKey !== currentMonthKey) {
                // Only show if it's not the very first day of usage (check if there's data from prev month)
                const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const hasExpensesPrevMonth = gastos.some(g => {
                    const d = new Date(g.fecha);
                    return d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear();
                });

                if (hasExpensesPrevMonth) {
                    setShowMonthlyRecap(true);
                }
            }
        };

        // 2. Check for Weekly/Activity Reminders
        const checkReminders = () => {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri
            
            // Rule A: It's Friday (5) -> Weekly Check-in
            if (dayOfWeek === 5) {
                setReminder({
                    msg: "¿Ya registraste tus gastos de esta semana? No pierdas el control y cierra la semana en verde.",
                    type: 'info'
                });
                return;
            }

            // Rule B: No expenses in last 4 days
            const myExpenses = gastos.filter(g => g.id_miembro === currentUser.id);
            if (myExpenses.length > 0) {
                // Sort descending
                const sorted = [...myExpenses].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                const lastExpenseDate = new Date(sorted[0].fecha);
                const diffTime = Math.abs(now.getTime() - lastExpenseDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 4) {
                    setReminder({
                        msg: `Han pasado ${diffDays} días sin registros. ¡Ponte al día para mantener tus estadísticas precisas!`,
                        type: 'warning'
                    });
                }
            }
        };

        checkMonthlyRecap();
        checkReminders();

    }, [gastos, currentUser.id]);

    const handleCloseRecap = () => {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        localStorage.setItem(`famiFlow_recap_seen_${currentUser.id}`, currentMonthKey);
        setShowMonthlyRecap(false);
    };

    return (
        <>
            {/* Modals & Alerts */}
            <MonthlyRecapModal 
                isOpen={showMonthlyRecap} 
                onClose={handleCloseRecap} 
                gastos={gastos}
                presupuestos={presupuestos}
                categorias={categorias}
                currentUserId={currentUser.id}
            />

            {/* MOBILE VIEW (Stitch Theme) */}
            <div className="block md:hidden space-y-6 animate-fadeIn">
                {reminder && <ReminderBanner message={reminder.msg} type={reminder.type} />}
                <StitchBalanceCard />
                <StitchActionButtons />
                <StitchQuickStats />
                <StitchRecentTransactions />
            </div>

            {/* DESKTOP VIEW (Classic Theme) */}
            <div className="hidden md:block space-y-6 animate-fadeIn pb-8">
                {reminder && (
                    <div className={`p-4 rounded-lg border-l-4 shadow-sm flex justify-between items-center ${reminder.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-orange-50 border-orange-500 text-orange-700'}`}>
                        <div className="flex items-center">
                            <i className={`fas ${reminder.type === 'info' ? 'fa-info-circle' : 'fa-clock'} fa-lg mr-3`}></i>
                            <span className="font-medium">{reminder.msg}</span>
                        </div>
                        <button onClick={() => setReminder(null)} className="text-sm underline hover:no-underline">Cerrar</button>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                    <div className="xl:col-span-1 h-auto min-h-[420px]">
                        <MonefyChartWidget />
                    </div>
                    <div className="xl:col-span-2 flex flex-col gap-6">
                         <SummaryCards />
                         <div className="flex-grow">
                            <DailyPacingWidget />
                         </div>
                    </div>
                </div>
                <FamilyOverviewSection />
            </div>
        </>
    );
};

export default Dashboard;
