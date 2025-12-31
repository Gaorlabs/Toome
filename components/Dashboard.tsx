
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { RefreshCw, ArrowUpRight, Store, Calendar, TrendingUp, Target, Package, Calculator, DollarSign } from 'lucide-react';
import { KPI, InventoryItem, OdooConnection, DashboardProps, SalesData, BranchKPI } from '../types';
import { fetchOdooRealTimeData, fetchOdooInventory } from '../services/odooBridge';
import { MOCK_BRANCHES, MOCK_KPIS } from '../constants';

export const Dashboard: React.FC<DashboardProps> = ({ kpis: initialKpis, salesData: initialSales, inventory: initialInventory, branchKPIs: initialBranches, activeConnection }) => {
  
  const [loading, setLoading] = useState(false);
  
  // States
  const [displayKpis, setDisplayKpis] = useState<KPI[]>(initialKpis);
  const [displayBranches, setDisplayBranches] = useState<BranchKPI[]>(initialBranches);
  const [displaySales, setDisplaySales] = useState<SalesData[]>(initialSales);
  
  // Date Filters
  const [dateFilter, setDateFilter] = useState<'HOY' | 'MES' | 'AÑO' | 'CUSTOM'>('MES');

  useEffect(() => {
      if (activeConnection) {
          loadRealTimeData();
      } else {
          // Mock Data Fallback
          setDisplayKpis(MOCK_KPIS);
          setDisplayBranches(MOCK_BRANCHES);
      }
  }, [activeConnection, dateFilter]);

  const loadRealTimeData = async () => {
      if (!activeConnection) return;
      setLoading(true);
      
      try {
        const { salesData, branches, totalSales, totalMargin, totalItems } = await fetchOdooRealTimeData(activeConnection);

        if (salesData.length > 0) {
            setDisplaySales(salesData);
            setDisplayBranches(branches);

            // Update KPIs
            const marginPercent = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;
            
            const newKpis = [
                { label: 'Total Venta', value: `S/ ${totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'DollarSign', isDark: true },
                { label: 'Utilidad Bruta', value: `S/ ${totalMargin.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'Target', isDark: false },
                { label: 'Items Vendidos', value: totalItems.toString(), change: 0, trend: 'neutral' as any, icon: 'Package', isDark: false },
                { label: 'Margen Real %', value: `${marginPercent.toFixed(1)}%`, change: 0, trend: 'neutral' as any, icon: 'Calculator', isDark: false },
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h5 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Smart Business Intelligence</h5>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
                SMART <span className="text-lime-500">ANALYTICS</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${activeConnection ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {activeConnection ? activeConnection.name.toUpperCase() : 'SIN CONEXIÓN'} | {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
             <div className="flex gap-1">
                 {['HOY', 'MES', 'AÑO', 'CUSTOM'].map(filter => (
                     <button
                        key={filter}
                        onClick={() => setDateFilter(filter as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${dateFilter === filter ? 'bg-lime-500 text-white shadow-md shadow-lime-200' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                         {filter}
                     </button>
                 ))}
             </div>
             <div className="h-6 w-px bg-gray-200"></div>
             <button 
                onClick={loadRealTimeData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
             >
                 <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                 <span>SINCRONIZAR</span>
             </button>
        </div>
      </div>

      {/* Branch Performance Section */}
      <div>
          <div className="flex items-center gap-2 mb-4">
              <div className="bg-lime-100 p-1.5 rounded-lg text-lime-600">
                  <Store size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">RENDIMIENTO POR SEDE</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayBranches.map((branch, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow relative overflow-hidden group">
                      
                      {/* Decorative gradient blob */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-lime-400/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

                      <div className="flex justify-between items-start mb-6 relative">
                          <div className="bg-lime-50 p-3 rounded-2xl text-lime-600">
                              <Store size={24} />
                          </div>
                          <button className="text-[10px] font-bold bg-lime-50 text-lime-700 px-3 py-1 rounded-full hover:bg-lime-100 transition-colors flex items-center gap-1">
                              VER DETALLE <ArrowUpRight size={10} />
                          </button>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-6">{branch.name.toUpperCase()}</h3>

                      <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-gray-400 text-xs uppercase">Venta</span>
                              <span className="font-bold text-gray-800">S/ {branch.sales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-gray-400 text-xs uppercase">Margen</span>
                              <span className="font-bold text-lime-600">S/ {branch.margin.toLocaleString()}</span>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Rentabilidad</span>
                              <span className="text-lg font-bold text-gray-800">{branch.profitability.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-lime-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(branch.profitability, 100)}%` }}></div>
                          </div>
                      </div>
                  </div>
              ))}
              
              {displayBranches.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                      <Store size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-medium">No se encontraron sedes activas.</p>
                  </div>
              )}
          </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayKpis.map((kpi, idx) => (
              <div 
                key={idx} 
                className={`rounded-3xl p-8 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden transition-transform hover:-translate-y-1
                    ${kpi.isDark ? 'bg-[#1a1f2c] text-white shadow-xl shadow-gray-900/20' : 'bg-white text-gray-800 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}
                `}
              >
                   {/* Icon background */}
                   {kpi.isDark && (
                       <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                           <TrendingUp size={120} />
                       </div>
                   )}

                   <div>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${kpi.isDark ? 'bg-white/10 text-lime-400' : 'bg-gray-50 text-lime-600'}`}>
                           {kpi.icon === 'DollarSign' && <DollarSign size={20} />}
                           {kpi.icon === 'Target' && <Target size={20} />}
                           {kpi.icon === 'Package' && <Package size={20} />}
                           {kpi.icon === 'Calculator' && <Calculator size={20} />}
                       </div>
                       <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${kpi.isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                           {kpi.label}
                       </p>
                   </div>
                   <h3 className="text-3xl font-bold tracking-tight">{kpi.value}</h3>
              </div>
          ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-800">TENDENCIA DE INGRESOS</h2>
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lime-500"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Ventas Diarias</span>
              </div>
          </div>
          
          <div className="h-80 w-full">
            {displaySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displaySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                            formatter={(value: number) => [`S/ ${value.toLocaleString()}`, 'Ventas']}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#84cc16" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
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
