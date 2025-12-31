
import React, { useEffect, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { RefreshCw, ArrowUpRight, Store, Calendar, TrendingUp, Target, Package, Calculator, DollarSign, PieChart, CreditCard, Wallet, User, Lock, Unlock, Filter, FileText, ShoppingBag, CreditCard as PaymentIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { KPI, DashboardProps, SalesData, BranchKPI, DateRange, PaymentSummary, DailyProductSummary, DocumentTypeSummary } from '../types';
import { fetchOdooRealTimeData } from '../services/odooBridge';
import { MOCK_BRANCHES, MOCK_KPIS } from '../constants';

export const Dashboard: React.FC<DashboardProps> = ({ kpis: initialKpis, salesData: initialSales, branchKPIs: initialBranches, activeConnection, userSession }) => {
  
  const [loading, setLoading] = useState(false);
  const [displayKpis, setDisplayKpis] = useState<KPI[]>(initialKpis);
  const [displayBranches, setDisplayBranches] = useState<BranchKPI[]>(initialBranches);
  const [displaySales, setDisplaySales] = useState<SalesData[]>(initialSales);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentSummary[]>([]);
  const [topProducts, setTopProducts] = useState<DailyProductSummary[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentTypeSummary[]>([]);

  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<'HOY' | 'AYER' | 'MES' | 'AÑO' | 'CUSTOM'>('HOY');
  
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); 
  const [customRange, setCustomRange] = useState<DateRange>({
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
  });

  const getEffectiveDateRange = (): { start: string, end: string, label: string } => {
    const now = new Date();
    
    if (dateFilter === 'AYER') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}`, label: 'Ayer' };
    }

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    if (dateFilter === 'HOY') {
        return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}`, label: 'Hoy' };
    }
    
    if (dateFilter === 'MES') {
        const [year, month] = selectedMonth.split('-');
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('es-ES', { month: 'long' });
        return { 
            start: `${year}-${month}-01`, 
            end: `${year}-${month}-${lastDay}`,
            label: `Mes ${monthName}` 
        };
    }

    if (dateFilter === 'AÑO') {
        return { start: `${y}-01-01`, end: `${y}-12-31`, label: `Año ${y}` };
    }

    if (dateFilter === 'CUSTOM') {
        const label = customRange.start === customRange.end ? customRange.start : `${customRange.start} a ${customRange.end}`;
        return { start: customRange.start, end: customRange.end, label: label };
    }

    return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}`, label: 'Hoy' };
  };

  useEffect(() => {
      if (activeConnection) {
          loadRealTimeData();
      } else {
          setDisplayKpis(MOCK_KPIS);
          setDisplayBranches(MOCK_BRANCHES);
      }
  }, [activeConnection, dateFilter, selectedMonth, customRange.start, customRange.end]); 

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

        const data = await fetchOdooRealTimeData(
            activeConnection, 
            start,
            end,
            allowedCompanyIds, 
            allowedPosIds
        );

        setDisplaySales(data.salesData);
        setDisplayBranches(data.branches);
        setPaymentMethods(data.paymentMethods);
        setTopProducts(data.topProducts);
        setDocTypes(data.documentTypes);

        const marginPercent = data.totalSales > 0 ? (data.totalMargin / data.totalSales) * 100 : 0;
        
        const newKpis = [
            { label: 'Total Venta (Neto)', value: `S/ ${data.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'DollarSign', isDark: true },
            { label: 'Utilidad Bruta', value: `S/ ${data.totalMargin.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, change: 0, trend: 'neutral' as any, icon: 'Target', isDark: false },
            { label: 'Transacciones', value: data.totalItems.toString(), change: 0, trend: 'neutral' as any, icon: 'Package', isDark: false },
            { label: 'Rentabilidad', value: `${marginPercent.toFixed(1)}%`, change: 0, trend: 'neutral' as any, icon: 'Calculator', isDark: false },
        ];
        setDisplayKpis(newKpis);
        
      } catch (e) {
          console.error("Error updating dashboard", e);
      } finally {
          setLoading(false);
      }
  };

  const currentRange = getEffectiveDateRange();

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-fade-in font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
            <h5 className="text-xs font-bold text-odoo-primary tracking-widest uppercase mb-1 flex items-center gap-2">
                <PieChart size={14} /> Toome Analytics
            </h5>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 tracking-tight">
                Tablero de Control
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${activeConnection ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {activeConnection ? activeConnection.name : 'SIN CONEXIÓN'}
                </p>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full xl:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto">
                <div className="flex gap-1 overflow-x-auto w-full sm:w-auto p-1 sm:p-0 no-scrollbar">
                    {['HOY', 'AYER', 'MES', 'AÑO', 'CUSTOM'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setDateFilter(filter as any)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none text-center ${dateFilter === filter ? 'bg-odoo-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {filter === 'CUSTOM' ? 'Personalizado' : filter === 'AYER' ? 'Ayer' : filter === 'HOY' ? 'Hoy' : filter}
                        </button>
                    ))}
                </div>
                <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
                <button 
                    onClick={loadRealTimeData}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:text-odoo-primary transition-colors w-full sm:w-auto"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>SINCRONIZAR</span>
                </button>
            </div>
            
            {/* Month Selector */}
            {dateFilter === 'MES' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs animate-slide-up self-end w-full sm:w-auto justify-end">
                    <span className="font-bold text-gray-500">Seleccionar Mes:</span>
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-odoo-primary outline-none text-gray-700"
                    />
                </div>
            )}

            {/* Custom Range Selector */}
            {dateFilter === 'CUSTOM' && (
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs animate-slide-up self-end w-full sm:w-auto justify-end">
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
                        className="bg-odoo-primary text-white px-2 py-1 rounded hover:bg-odoo-primaryDark ml-auto"
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* KPI Section - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {displayKpis.map((kpi, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl p-6 shadow-sm flex flex-col justify-between h-32 md:h-40 relative overflow-hidden transition-all hover:shadow-md
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
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{kpi.value}</h3>
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
                           {currentRange.label}
                       </span>
                   </div>
              </div>
          ))}
      </div>

      {/* NEW SECTION: Detailed Breakdown (Shown for single day or ranges) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><PaymentIcon size={16} /></div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase">Modalidades (Global)</h3>
              </div>
              <div className="space-y-3">
                  {paymentMethods.length > 0 ? paymentMethods.map((pm, i) => (
                      <div key={i} className="flex justify-between items-center group">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                             <span className="text-sm text-gray-600 font-medium">{pm.name}</span>
                          </div>
                          <div className="text-right">
                              <span className="block text-sm font-bold text-gray-800">S/ {pm.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-400">{pm.count} ops</span>
                          </div>
                      </div>
                  )) : (
                      <p className="text-xs text-gray-400 italic text-center py-4">Sin datos de pago.</p>
                  )}
              </div>
          </div>

          {/* 2. Document Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><FileText size={16} /></div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase">Tipos de Documento</h3>
              </div>
              <div className="space-y-3">
                  {docTypes.length > 0 ? docTypes.map((dt, i) => (
                      <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">{dt.type}</span>
                          <div className="flex items-center gap-2">
                               <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">{dt.count} emitidos</span>
                               <span className="text-sm font-bold text-gray-800">S/ {dt.total.toLocaleString()}</span>
                          </div>
                      </div>
                  )) : (
                      <p className="text-xs text-gray-400 italic text-center py-4">Sin documentos emitidos.</p>
                  )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-400">Total Facturado</span>
                   <span className="text-lg font-bold text-odoo-primary">
                       S/ {docTypes.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                   </span>
              </div>
          </div>

          {/* 3. Top Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600"><ShoppingBag size={16} /></div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase">Top 5 Productos (Global)</h3>
              </div>
              <div className="space-y-3">
                   {topProducts.length > 0 ? topProducts.map((p, i) => (
                      <div key={i} className="flex justify-between items-start">
                          <div className="flex gap-3 items-center">
                              <span className="text-xs font-bold text-gray-300 w-4">#{i+1}</span>
                              <div>
                                  <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]" title={p.name}>{p.name}</p>
                                  <p className="text-[10px] text-gray-400">{p.qty} unidades</p>
                              </div>
                          </div>
                          <span className="text-sm font-bold text-gray-700">S/ {p.total.toLocaleString()}</span>
                      </div>
                   )) : (
                       <p className="text-xs text-gray-400 italic text-center py-4">Sin ventas de productos.</p>
                   )}
              </div>
          </div>

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
                  const isExpanded = expandedBranch === branch.id;
                  
                  return (
                  <div key={idx} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isExpanded ? 'md:col-span-2 lg:col-span-2' : ''}`}>
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
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">
                                        Ventas: <span className="text-odoo-primary">{currentRange.label}</span>
                                    </p>
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

                      {/* Expand Button */}
                      <div 
                        onClick={() => setExpandedBranch(isExpanded ? null : branch.id)}
                        className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                           <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                               {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle Productos'}
                               {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                           </span>
                      </div>

                      {/* Detailed View (Accordion) */}
                      {isExpanded && (
                          <div className="px-6 py-6 bg-gray-50/50 border-t border-gray-100 animate-slide-up">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   {/* Rentabilidad Specific */}
                                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                       <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Rentabilidad Caja</h4>
                                       <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-lg font-bold text-gray-800">
                                                    {branch.profitability ? branch.profitability.toFixed(1) : 0}%
                                                </p>
                                                <p className="text-[10px] text-green-600">Margen Bruto</p>
                                            </div>
                                            <div className="p-2 bg-green-50 rounded-full text-green-600">
                                                <Calculator size={18} />
                                            </div>
                                       </div>
                                   </div>

                                   {/* Payments Specific */}
                                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Métodos Pago</h4>
                                        <div className="space-y-1">
                                            {branch.payments && branch.payments.length > 0 ? branch.payments.map((p, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-gray-600">{p.name}</span>
                                                    <span className="font-bold">S/ {p.amount.toLocaleString()}</span>
                                                </div>
                                            )) : <span className="text-xs italic text-gray-400">Sin datos</span>}
                                        </div>
                                   </div>

                                   {/* Top Products Specific */}
                                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Top Productos en esta Caja</h4>
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-gray-500">
                                                    <th className="pb-1">Producto</th>
                                                    <th className="pb-1 text-right">Cant.</th>
                                                    <th className="pb-1 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {branch.topProducts && branch.topProducts.length > 0 ? branch.topProducts.map((p, i) => (
                                                    <tr key={i} className="border-b border-gray-50 last:border-0">
                                                        <td className="py-1.5 font-medium text-gray-700 truncate max-w-[150px]">{p.name}</td>
                                                        <td className="py-1.5 text-right text-gray-500">{p.qty}</td>
                                                        <td className="py-1.5 text-right font-bold text-gray-800">S/ {p.total.toLocaleString()}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={3} className="py-2 text-center text-gray-400 italic">Sin ventas</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                   </div>
                              </div>
                          </div>
                      )}
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hidden md:block">
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
