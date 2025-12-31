
import React, { useEffect, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { RefreshCw, ArrowUpRight, Store, Calendar, TrendingUp, Target, Package, Calculator, DollarSign, PieChart, CreditCard, Wallet, User, Lock, Unlock, Filter } from 'lucide-react';
import { KPI, DashboardProps, SalesData, BranchKPI, DateRange } from '../types';
import { fetchOdooRealTimeData } from '../services/odooBridge';
import { MOCK_BRANCHES, MOCK_KPIS } from '../constants';

export const Dashboard: React.FC<DashboardProps> = ({ kpis: initialKpis, salesData: initialSales, branchKPIs: initialBranches, activeConnection, userSession }) => {
  
  const [loading, setLoading] = useState(false);
  const [displayKpis, setDisplayKpis] = useState<KPI[]>(initialKpis);
  const [displayBranches, setDisplayBranches] = useState<BranchKPI[]>(initialBranches);
  const [displaySales, setDisplaySales] = useState<SalesData[]>(initialSales);
  
  // DATE LOGIC
  const [dateFilter, setDateFilter] = useState<'HOY' | 'MES' | 'AÑO' | 'CUSTOM'>('HOY');
  
  // Default states for selectors
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [customRange, setCustomRange] = useState<DateRange>({
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
      if (activeConnection) {
          loadRealTimeData();
      } else {
          setDisplayKpis(MOCK_KPIS);
          setDisplayBranches(MOCK_BRANCHES);
      }
  }, [activeConnection, dateFilter, selectedMonth, customRange.start, customRange.end]); 

  const getEffectiveDateRange = (): { start: string, end: string } => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    if (dateFilter === 'HOY') {
        return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}` };
    }
    
    if (dateFilter === 'MES') {
        // Use selectedMonth state (YYYY-MM)
        const [year, month] = selectedMonth.split('-');
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        return { 
            start: `${year}-${month}-01`, 
            end: `${year}-${month}-${lastDay}` 
        };
    }

    if (dateFilter === 'AÑO') {
        return { start: `${y}-01-01`, end: `${y}-12-31` };
    }

    if (dateFilter === 'CUSTOM') {
        return { start: customRange.start, end: customRange.end };
    }

    return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}` };
  };

  const loadRealTimeData = async () => {
      if (!activeConnection) return;
      setLoading(true);
      
      try {
        let allowedPosIds: number[] | undefined = undefined;
        let allowedCompanyIds: string[] | undefined = undefined;

        if (userSession?.role === 'CLIENT' && userSession.clientData) {
            allowedPosIds = userSession.clientData.allowedPosIds;
            allowedCompanyIds = userSession.clientData.allowedCompanyIds;
        }

        const { start, end } = getEffectiveDateRange();

        const { salesData, branches, totalSales, totalMargin, totalItems } = await fetchOdooRealTimeData(
            activeConnection, 
            start,
            end,
            allowedCompanyIds, 
            allowedPosIds
        );

        setDisplaySales(salesData);
        setDisplayBranches(branches);

        const marginPercent = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;
        
        const newKpis = [
            { label: 'Total Venta (Neto)', value: `S/ ${totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'DollarSign', isDark: true },
            { label: 'Utilidad Bruta', value: `S/ ${totalMargin.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'Target', isDark: false },
            { label: 'Transacciones', value: totalItems.toString(), change: 0, trend: 'neutral' as any, icon: 'Package', isDark: false },
            { label: 'Rentabilidad', value: `${marginPercent.toFixed(1)}%`, change: 0, trend: 'neutral' as any, icon: 'Calculator', isDark: false },
        ];
        setDisplayKpis(newKpis);
        
      } catch (e) {
          console.error("Error updating dashboard", e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
            <h5 className="text-xs font-bold text-odoo-primary tracking-widest uppercase mb-1 flex items-center gap-2">
                <PieChart size={14} /> Toome Analytics
            </h5>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
                Tablero de Control
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${activeConnection ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {activeConnection ? activeConnection.name : 'SIN CONEXIÓN'} | {getEffectiveDateRange().start === getEffectiveDateRange().end ? getEffectiveDateRange().start : `${getEffectiveDateRange().start} - ${getEffectiveDateRange().end}`}
                </p>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                <div className="flex gap-1">
                    {['HOY', 'MES', 'AÑO', 'CUSTOM'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setDateFilter(filter as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${dateFilter === filter ? 'bg-odoo-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {filter === 'CUSTOM' ? 'Personalizado' : filter}
                        </button>
                    ))}
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <button 
                    onClick={loadRealTimeData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:text-odoo-primary transition-colors"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>SINCRONIZAR</span>
                </button>
            </div>
            
            {/* Conditional Sub-selectors */}
            {dateFilter === 'MES' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs animate-slide-up self-end">
                    <span className="font-bold text-gray-500">Seleccionar Mes:</span>
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-odoo-primary outline-none text-gray-700"
                    />
                </div>
            )}

            {dateFilter === 'CUSTOM' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs animate-slide-up self-end">
                    <span className="font-bold text-gray-500">Desde:</span>
                    <input 
                        type="date" 
                        value={customRange.start}
                        onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                        className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-odoo-primary outline-none"
                    />
                    <span className="font-bold text-gray-500">Hasta:</span>
                    <input 
                        type="date" 
                        value={customRange.end}
                        onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                        className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-odoo-primary outline-none"
                    />
                    <button 
                        onClick={loadRealTimeData}
                        className="bg-odoo-primary text-white px-2 py-1 rounded hover:bg-odoo-primaryDark"
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayKpis.map((kpi, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl p-6 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden transition-all hover:shadow-md
                    ${kpi.isDark 
                        ? 'bg-gradient-to-br from-odoo-dark to-[#343a40] text-white border-none' 
                        : 'bg-white text-gray-800 border border-gray-200'
                    }
                `}
              >
                   <div className={`absolute right-[-10px] bottom-[-10px] opacity-5 transform rotate-12`}>
                        {kpi.icon === 'DollarSign' && <DollarSign size={80} />}
                        {kpi.icon === 'Target' && <Target size={80} />}
                        {kpi.icon === 'Package' && <Package size={80} />}
                        {kpi.icon === 'Calculator' && <Calculator size={80} />}
                   </div>

                   <div className="flex justify-between items-start">
                       <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${kpi.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {kpi.label}
                            </p>
                            <h3 className="text-3xl font-bold tracking-tight">{kpi.value}</h3>
                       </div>
                       <div className={`p-2 rounded-lg ${kpi.isDark ? 'bg-white/10 text-white' : 'bg-odoo-primary/10 text-odoo-primary'}`}>
                           {kpi.icon === 'DollarSign' && <DollarSign size={20} />}
                           {kpi.icon === 'Target' && <Target size={20} />}
                           {kpi.icon === 'Package' && <Package size={20} />}
                           {kpi.icon === 'Calculator' && <Calculator size={20} />}
                       </div>
                   </div>
                   
                   <div className="flex items-center gap-1 mt-2">
                       <TrendingUp size={14} className={kpi.isDark ? 'text-green-400' : 'text-odoo-primary'} />
                       <span className={`text-xs font-medium ${kpi.isDark ? 'text-green-400' : 'text-odoo-primary'}`}>
                           {dateFilter === 'CUSTOM' ? 'Rango Personalizado' : dateFilter === 'MES' ? selectedMonth : dateFilter}
                       </span>
                   </div>
              </div>
          ))}
      </div>

      {/* Branch/POS Performance Section */}
      <div>
          <div className="flex items-center gap-2 mb-4">
              <div className="bg-odoo-primary p-1.5 rounded-lg text-white">
                  <Store size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Cajas y Puntos de Venta</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayBranches.map((branch, idx) => {
                  const isOpen = branch.status === 'OPEN';
                  const isClosing = branch.status === 'CLOSING_CONTROL';
                  
                  return (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                      {/* Colored Header */}
                      <div className={`px-6 py-4 border-b flex justify-between items-center ${
                          isOpen ? 'bg-green-50 border-green-100' : 
                          isClosing ? 'bg-yellow-50 border-yellow-100' : 
                          'bg-gray-50 border-gray-200'
                      }`}>
                          <h3 className="text-lg font-bold text-gray-800 truncate" title={branch.name}>{branch.name}</h3>
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isOpen ? 'bg-green-100 text-green-700 border-green-200' : 
                              isClosing ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                              {isOpen ? <Unlock size={12}/> : <Lock size={12}/>}
                              {isOpen ? 'ABIERTA' : isClosing ? 'CERRANDO' : 'CERRADA'}
                          </span>
                      </div>

                      {/* Cashier Info */}
                      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
                          <div className={`p-2 rounded-full ${isOpen ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                              <User size={16} />
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Cajero Actual</p>
                              <p className="text-sm font-medium text-gray-700">{branch.cashier || '---'}</p>
                          </div>
                      </div>

                      {/* Metrics */}
                      <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                          <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Ventas</p>
                                    <p className="text-2xl font-bold text-gray-900">S/ {branch.sales.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Tickets</p>
                                    <p className="text-xl font-bold text-gray-700">{branch.transactionCount}</p>
                                </div>
                          </div>
                          
                          {/* Mini Progress Bar for Target/Visual */}
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                              <div className={`h-1.5 rounded-full ${isOpen ? 'bg-odoo-primary' : 'bg-gray-300'}`} style={{ width: isOpen ? '100%' : '0%' }}></div>
                          </div>
                      </div>
                  </div>
              )})}
              
              {displayBranches.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Store size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">No hay cajas configuradas o visibles para este usuario.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h2 className="text-xl font-bold text-gray-800">Tendencia de Ventas</h2>
                  <p className="text-xs text-gray-500">Comportamiento temporal de ingresos</p>
              </div>
          </div>
          
          <div className="h-80 w-full">
            {displaySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displaySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#017E84" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#017E84" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`S/ ${value.toLocaleString()}`, 'Ventas']}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#017E84" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <TrendingUp size={48} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">Sin datos para graficar</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};
