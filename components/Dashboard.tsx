import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Download, TrendingUp, AlertTriangle, AlertCircle, Package, Activity } from 'lucide-react';
import { KPI, SalesData, ProductPerformance, InventoryItem } from '../types';

interface DashboardProps {
  kpis: KPI[];
  salesData: SalesData[];
  topProducts: ProductPerformance[];
  inventory: InventoryItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ kpis, salesData, topProducts, inventory }) => {
  
  // Filter for dashboard widget
  const criticalStock = inventory.filter(item => item.status === 'Critical').slice(0, 5);

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Activity className="text-odoo-primary" size={24} />
             <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Vista Ejecutiva</h2>
           </div>
           <p className="text-gray-500 font-light">Resumen de rendimiento en tiempo real y alertas de stock.</p>
        </div>
        <button className="flex items-center space-x-2 bg-white hover:bg-odoo-light text-odoo-dark border border-gray-200 hover:border-odoo-secondary/30 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-lg transition-all text-sm font-semibold group active:scale-95">
            <Download size={18} className="text-gray-400 group-hover:text-odoo-secondary transition-colors" />
            <span>Exportar Excel</span>
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            className="glass-card rounded-2xl p-6 relative overflow-hidden group animate-slide-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${kpi.trend === 'up' ? 'from-green-500/10' : 'from-red-500/10'} to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-125`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{kpi.label}</h3>
              <div className={`p-2 rounded-xl ${kpi.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} shadow-inner`}>
                {kpi.trend === 'up' ? <ArrowUpRight size={18} strokeWidth={2.5} /> : <ArrowDownRight size={18} strokeWidth={2.5} />}
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-baseline space-x-3">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{kpi.value}</h2>
              </div>
              <div className="mt-2 flex items-center">
                 <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${kpi.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border ${kpi.change >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                 </span>
                 <span className="text-xs text-gray-400 ml-2 font-medium">vs. mes anterior</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-slide-up delay-200 border-t-4 border-t-odoo-primary/20">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-odoo-primary/10 rounded-xl text-odoo-primary shadow-sm">
                    <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Evolución de Ventas</h3>
                  <p className="text-xs text-gray-400">Últimos 12 días</p>
                </div>
            </div>
            <button className="text-gray-400 hover:text-odoo-primary transition-colors bg-gray-50 p-2 rounded-lg hover:bg-gray-100"><MoreHorizontal size={20} /></button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#714B67" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#714B67" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#017E84" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#017E84" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.95)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontFamily: 'Ubuntu' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Area type="monotone" dataKey="sales" name="Ventas Totales" stroke="#714B67" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="margin" name="Margen Neto" stroke="#017E84" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up delay-300 flex flex-col border-t-4 border-t-odoo-secondary/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800">Top Productos</h3>
            <button className="text-xs text-odoo-secondary font-bold hover:underline bg-odoo-secondary/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-odoo-secondary/20">Ver detalle</button>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topProducts} margin={{ top: 0, right: 0, left: 30, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6"/>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 600 }} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="sales" name="Ventas" fill="#714B67" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="margin" name="Beneficio" fill="#017E84" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section - Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-400">
          
          {/* Inventory Alerts Widget */}
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border-l-4 border-l-red-500 shadow-lg">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-red-50/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-lg animate-pulse">
                         <AlertCircle className="text-red-500" size={20} />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800">Stock Crítico</h3>
                  </div>
                  <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-red-100">
                      {criticalStock.length} items
                  </span>
              </div>
              <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white/50">
                  {criticalStock.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-white transition-colors group">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                                  <Package size={20} className="text-gray-400 group-hover:text-red-400" />
                              </div>
                              <div>
                                  <p className="font-bold text-sm text-gray-800 group-hover:text-red-600 transition-colors">{item.name}</p>
                                  <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-lg font-bold text-red-600">{item.stock}</p>
                              <p className="text-[10px] text-red-400 font-semibold uppercase">Unidades</p>
                          </div>
                      </div>
                  ))}
                  <div className="p-4 text-center bg-white/60">
                      <button className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wide hover:underline">
                          Ver inventario completo &rarr;
                      </button>
                  </div>
              </div>
          </div>

          {/* Profitability Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col h-full border-t-4 border-t-gray-200">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/40">
                  <h3 className="font-bold text-lg text-gray-800">Rentabilidad por Categoría</h3>
                  <button className="text-sm text-gray-500 hover:text-odoo-dark font-medium transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300">Descargar Reporte</button>
              </div>
              <div className="overflow-x-auto bg-white/30">
                  <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                          <tr>
                              <th className="px-6 py-4 font-bold tracking-wider">Categoría</th>
                              <th className="px-6 py-4 text-right font-bold tracking-wider">Ventas</th>
                              <th className="px-6 py-4 text-right font-bold tracking-wider">Margen</th>
                              <th className="px-6 py-4 text-right font-bold tracking-wider">ROI %</th>
                              <th className="px-6 py-4 text-center font-bold tracking-wider">Estado</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          <tr className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-800">Electrónica</td>
                              <td className="px-6 py-4 text-right font-medium">€85,000</td>
                              <td className="px-6 py-4 text-right font-medium">€26,000</td>
                              <td className="px-6 py-4 text-right text-green-600 font-bold">30.5%</td>
                              <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">Excelente</span></td>
                          </tr>
                          <tr className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-800">Mobiliario</td>
                              <td className="px-6 py-4 text-right font-medium">€15,000</td>
                              <td className="px-6 py-4 text-right font-medium">€7,500</td>
                              <td className="px-6 py-4 text-right text-green-600 font-bold">50.0%</td>
                              <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">Excelente</span></td>
                          </tr>
                          <tr className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-800">Accesorios</td>
                              <td className="px-6 py-4 text-right font-medium">€24,592</td>
                              <td className="px-6 py-4 text-right font-medium">€4,500</td>
                              <td className="px-6 py-4 text-right text-yellow-600 font-bold">18.2%</td>
                              <td className="px-6 py-4 text-center"><span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">Revisar</span></td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
};