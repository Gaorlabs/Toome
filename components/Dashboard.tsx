
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area, ComposedChart 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Download, TrendingUp, AlertTriangle, AlertCircle, Package, Activity, RefreshCw, Database, DollarSign, Calendar, Inbox } from 'lucide-react';
import { KPI, InventoryItem, OdooConnection, DashboardProps } from '../types';
import { fetchOdooRealTimeData, fetchOdooInventory } from '../services/odooBridge';

export const Dashboard: React.FC<DashboardProps> = ({ kpis: initialKpis, salesData: initialSales, topProducts, inventory: initialInventory, activeConnection }) => {
  
  const [loading, setLoading] = useState(false);
  const [isRealTime, setIsRealTime] = useState(false);
  const [displayKpis, setDisplayKpis] = useState<KPI[]>(initialKpis);
  const [displayInventory, setDisplayInventory] = useState<InventoryItem[]>(initialInventory);
  
  useEffect(() => {
      if (activeConnection) {
          loadRealTimeData();
      } else {
          setIsRealTime(false);
          setDisplayKpis(initialKpis);
          setDisplayInventory(initialInventory);
      }
  }, [activeConnection]);

  const loadRealTimeData = async () => {
      if (!activeConnection) return;
      setLoading(true);
      const realSales = await fetchOdooRealTimeData(activeConnection);
      const realStock = await fetchOdooInventory(activeConnection);

      if (realSales && Array.isArray(realSales) && realSales.length > 0) {
          setIsRealTime(true);
          const totalSales = realSales.reduce((acc: number, curr: any) => acc + (curr.amount_total || 0), 0);
          const newKpis = [...initialKpis];
          newKpis[0] = { ...newKpis[0], value: `S/. ${totalSales.toLocaleString()}`, trend: 'neutral' };
          setDisplayKpis(newKpis);
      } else {
          setIsRealTime(false);
      }
      
      if (realStock && Array.isArray(realStock)) {
           const mappedInventory: InventoryItem[] = realStock.map((item: any) => ({
               id: item.id.toString(),
               sku: item.default_code || 'N/A',
               name: item.name,
               stock: item.qty_available,
               avgDailySales: Math.floor(Math.random() * 5),
               daysRemaining: 10,
               status: item.qty_available < 5 ? 'Critical' : item.qty_available < 15 ? 'Warning' : 'Healthy',
               category: item.categ_id ? item.categ_id[1] : 'General'
           }));
           setDisplayInventory(mappedInventory);
      }
      setLoading(false);
  };

  const criticalStock = displayInventory.filter(item => item.status === 'Critical').slice(0, 5);
  const hasData = initialSales.length > 0 || topProducts.length > 0;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Spreadsheet Toolbar */}
      <div className="bg-white border border-gray-200 p-2 rounded-lg flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4 px-2">
            <h1 className="font-bold text-xl text-odoo-dark flex items-center gap-2">
                <Activity size={20} className="text-odoo-primary" />
                Dashboard Ejecutivo
            </h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <select className="bg-transparent border-none focus:ring-0 font-medium cursor-pointer hover:text-odoo-primary">
                    <option>Este Mes</option>
                    <option>Último Trimestre</option>
                    <option>Este Año</option>
                </select>
            </div>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={loadRealTimeData}
                disabled={loading || !activeConnection}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-odoo-primary bg-odoo-primary/10 hover:bg-odoo-primary/20 rounded-md font-medium transition-colors"
            >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Actualizando...' : 'Actualizar Datos'}
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors">
                <Download size={14} />
                Exportar
            </button>
        </div>
      </div>

      {/* KPI Spreadsheet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {displayKpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-odoo-dark mt-1">{kpi.value}</h3>
                </div>
                <div className={`p-1.5 rounded-full ${kpi.trend === 'up' ? 'bg-green-100 text-green-700' : kpi.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {kpi.trend === 'up' ? <ArrowUpRight size={16} /> : kpi.trend === 'down' ? <ArrowDownRight size={16} /> : <TrendingUp size={16} />}
                </div>
            </div>
            {kpi.change !== 0 && (
                <div className="mt-3 flex items-center text-xs">
                    <span className={`font-bold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-gray-400 ml-1">vs periodo anterior</span>
                </div>
            )}
          </div>
        ))}
      </div>

      {!hasData && !activeConnection && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <Inbox className="mx-auto text-blue-300 mb-3" size={48} />
              <h3 className="text-lg font-bold text-blue-800">Esperando Conexión</h3>
              <p className="text-blue-600 text-sm">Conecta tu base de datos Odoo para ver la información de tu farmacia aquí.</p>
          </div>
      )}

      {/* Main Analysis Area - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-5 min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800">Tendencia de Ventas y Margen</h3>
                <MoreHorizontal size={18} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="h-80 w-full">
                {initialSales.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={initialSales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend iconType="circle" />
                            <Area type="monotone" dataKey="sales" name="Ventas" fill="#017E84" fillOpacity={0.1} stroke="#017E84" strokeWidth={2} />
                            <Line type="monotone" dataKey="margin" name="Margen" stroke="#714B67" strokeWidth={2} dot={{r: 4, strokeWidth: 2}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <TrendingUp size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">Sin datos de ventas para mostrar</p>
                    </div>
                )}
            </div>
        </div>

        {/* Top Products List (Spreadsheet Style) */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[350px]">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">Top Productos (Rentabilidad)</h3>
            </div>
            <div className="flex-1 overflow-auto">
                {topProducts.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-medium">Producto</th>
                                <th className="px-4 py-3 font-medium text-right">Margen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {topProducts.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5">
                                        <div className="font-medium text-gray-800 truncate max-w-[150px]">{p.name}</div>
                                        <div className="text-xs text-gray-400">{p.category}</div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="font-bold text-odoo-primary">S/. {p.margin.toLocaleString()}</div>
                                        <div className="text-xs text-green-600">{p.profitability}%</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                        <Package size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">No hay productos destacados</p>
                    </div>
                )}
            </div>
            {topProducts.length > 0 && (
                <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-xs text-odoo-primary font-bold hover:underline">Ver Análisis Completo</button>
                </div>
            )}
        </div>
      </div>

      {/* Stock & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  Alertas de Stock
              </h3>
              <div className="space-y-3">
                  {criticalStock.length > 0 ? criticalStock.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                          <div>
                              <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                              <span className="block font-bold text-red-600">{item.stock} un.</span>
                              <span className="text-[10px] text-red-500 uppercase">Crítico</span>
                          </div>
                      </div>
                  )) : (
                      <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-lg">
                          {activeConnection ? "Inventario Saludable (Sin alertas)" : "Sin datos de inventario"}
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Distribución por Categoría</h3>
              <div className="h-60">
                 {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="category" type="category" width={80} tick={{fontSize: 11}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="sales" fill="#714B67" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                     <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                         Sin datos para graficar
                     </div>
                 )}
              </div>
          </div>
      </div>
    </div>
  );
};
