
import React, { useEffect, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { RefreshCw, ArrowUpRight, Store, Calendar, TrendingUp, Target, Package, Calculator, DollarSign, PieChart, CreditCard, Wallet } from 'lucide-react';
import { KPI, DashboardProps, SalesData, BranchKPI } from '../types';
import { fetchOdooRealTimeData } from '../services/odooBridge';
import { MOCK_BRANCHES, MOCK_KPIS } from '../constants';

export const Dashboard: React.FC<DashboardProps> = ({ kpis: initialKpis, salesData: initialSales, branchKPIs: initialBranches, activeConnection, userSession }) => {
  
  const [loading, setLoading] = useState(false);
  const [displayKpis, setDisplayKpis] = useState<KPI[]>(initialKpis);
  const [displayBranches, setDisplayBranches] = useState<BranchKPI[]>(initialBranches);
  const [displaySales, setDisplaySales] = useState<SalesData[]>(initialSales);
  const [dateFilter, setDateFilter] = useState<'HOY' | 'MES' | 'AÑO'>('MES');

  useEffect(() => {
      if (activeConnection) {
          loadRealTimeData();
      } else {
          setDisplayKpis(MOCK_KPIS);
          setDisplayBranches(MOCK_BRANCHES);
      }
  }, [activeConnection, dateFilter]); // Reload when dateFilter changes

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

        const { salesData, branches, totalSales, totalMargin, totalItems } = await fetchOdooRealTimeData(activeConnection, allowedCompanyIds, allowedPosIds, dateFilter);

        if (salesData.length > 0 || totalSales > 0) {
            setDisplaySales(salesData);
            setDisplayBranches(branches);

            const marginPercent = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;
            
            const newKpis = [
                { label: 'Total Venta (Neto)', value: `S/ ${totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'DollarSign', isDark: true },
                { label: 'Utilidad Bruta', value: `S/ ${totalMargin.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'Target', isDark: false },
                { label: 'Cuentas x Cobrar', value: 'S/ 1,250.00', change: 12, trend: 'down' as any, icon: 'Wallet', isDark: false },
                { label: 'Rentabilidad', value: `${marginPercent.toFixed(1)}%`, change: 0, trend: 'neutral' as any, icon: 'Calculator', isDark: false },
            ];
            setDisplayKpis(newKpis);
        } else {
            setDisplaySales([]);
            setDisplayBranches([]);
            // Keep mocked KPIs to show structure if 0 data, or set to zero
             const newKpis = [
                { label: 'Total Venta (Neto)', value: `S/ 0.00`, change: 0, trend: 'neutral' as any, icon: 'DollarSign', isDark: true },
                { label: 'Utilidad Bruta', value: `S/ 0.00`, change: 0, trend: 'neutral' as any, icon: 'Target', isDark: false },
                { label: 'Cuentas x Cobrar', value: 'S/ 0.00', change: 0, trend: 'down' as any, icon: 'Wallet', isDark: false },
                { label: 'Rentabilidad', value: `0.0%`, change: 0, trend: 'neutral' as any, icon: 'Calculator', isDark: false },
            ];
            setDisplayKpis(newKpis);
        }
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
                Resumen Financiero
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${activeConnection ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {activeConnection ? activeConnection.name : 'SIN CONEXIÓN'} | {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
             <div className="flex gap-1">
                 {['HOY', 'MES', 'AÑO'].map(filter => (
                     <button
                        key={filter}
                        onClick={() => setDateFilter(filter as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${dateFilter === filter ? 'bg-odoo-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                         {filter}
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
                        {kpi.icon === 'Wallet' && <Wallet size={80} />}
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
                           {kpi.icon === 'Wallet' && <Wallet size={20} />}
                           {kpi.icon === 'Calculator' && <Calculator size={20} />}
                       </div>
                   </div>
                   
                   <div className="flex items-center gap-1 mt-2">
                       <TrendingUp size={14} className={kpi.isDark ? 'text-green-400' : 'text-odoo-primary'} />
                       <span className={`text-xs font-medium ${kpi.isDark ? 'text-green-400' : 'text-odoo-primary'}`}>
                           {kpi.label === 'Cuentas x Cobrar' ? 'Pendiente de pago' : 'Análisis en tiempo real'}
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
              <h2 className="text-xl font-bold text-gray-800">Rendimiento por Sede / Caja</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayBranches.map((branch, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:border-odoo-primary/50 transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-odoo-primary/10 to-transparent rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                      <div className="flex justify-between items-start mb-6 relative">
                          <div className="flex flex-col">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-2 w-fit ${branch.status === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                  {branch.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                              </span>
                              <h3 className="text-lg font-bold text-gray-800">{branch.name}</h3>
                          </div>
                          <button className="text-[10px] font-bold text-odoo-primary hover:bg-odoo-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                              DETALLE <ArrowUpRight size={10} />
                          </button>
                      </div>

                      <div className="space-y-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-500 text-xs uppercase">Venta Total</span>
                              <span className="font-bold text-gray-900">S/ {branch.sales.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-px"></div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-500 text-xs uppercase">Margen Est.</span>
                              <span className="font-bold text-odoo-secondary">S/ {branch.margin.toLocaleString()}</span>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Rentabilidad</span>
                              <span className={`text-sm font-bold ${branch.profitability > 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {branch.profitability.toFixed(1)}%
                              </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-odoo-primary h-1.5 rounded-full" style={{ width: `${Math.min(branch.profitability, 100)}%` }}></div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h2 className="text-xl font-bold text-gray-800">Flujo de Ingresos</h2>
                  <p className="text-xs text-gray-500">Comportamiento diario de ventas brutas</p>
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
