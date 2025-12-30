import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Download } from 'lucide-react';
import { KPI, SalesData, ProductPerformance } from '../types';

interface DashboardProps {
  kpis: KPI[];
  salesData: SalesData[];
  topProducts: ProductPerformance[];
}

export const Dashboard: React.FC<DashboardProps> = ({ kpis, salesData, topProducts }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Vista Ejecutiva</h2>
           <p className="text-gray-500 text-sm">Resumen de rendimiento de la última semana</p>
        </div>
        <button className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm transition-all text-sm font-medium">
            <Download size={16} />
            <span>Exportar Excel</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{kpi.label}</h3>
              <div className={`p-2 rounded-full ${kpi.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {kpi.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold text-gray-800">{kpi.value}</h2>
              <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">vs. periodo anterior</p>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Tendencia de Ventas vs Margen</h3>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#714B67" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#714B67" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#017E84" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#017E84" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Area type="monotone" dataKey="sales" name="Ventas Totales" stroke="#714B67" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="margin" name="Margen Neto" stroke="#017E84" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Top 5 Productos</h3>
            <button className="text-xs text-odoo-secondary font-medium hover:underline">Ver todo</button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topProducts} margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB"/>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#4B5563' }} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="sales" name="Ventas" fill="#714B67" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="margin" name="Beneficio" fill="#017E84" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section - Profitability Table Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Rentabilidad por Categoría</h3>
              <button className="text-sm text-gray-500 hover:text-gray-800">Descargar Reporte</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                          <th className="px-6 py-3">Categoría</th>
                          <th className="px-6 py-3 text-right">Ventas Totales</th>
                          <th className="px-6 py-3 text-right">Margen Bruto</th>
                          <th className="px-6 py-3 text-right">Rentabilidad %</th>
                          <th className="px-6 py-3 text-center">Estado</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">Electrónica</td>
                          <td className="px-6 py-4 text-right">€85,000</td>
                          <td className="px-6 py-4 text-right">€26,000</td>
                          <td className="px-6 py-4 text-right text-green-600 font-bold">30.5%</td>
                          <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Excelente</span></td>
                      </tr>
                      <tr className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">Mobiliario</td>
                          <td className="px-6 py-4 text-right">€15,000</td>
                          <td className="px-6 py-4 text-right">€7,500</td>
                          <td className="px-6 py-4 text-right text-green-600 font-bold">50.0%</td>
                          <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Excelente</span></td>
                      </tr>
                      <tr className="bg-white hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">Accesorios</td>
                          <td className="px-6 py-4 text-right">€24,592</td>
                          <td className="px-6 py-4 text-right">€4,500</td>
                          <td className="px-6 py-4 text-right text-yellow-600 font-bold">18.2%</td>
                          <td className="px-6 py-4 text-center"><span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Revisar</span></td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};