import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { AlertTriangle, AlertCircle, CheckCircle, Search, Filter, Download } from 'lucide-react';

interface InventoryViewProps {
  items: InventoryItem[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({ items }) => {
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Warning'>('All');

  const filteredItems = items.filter(item => {
      if (filter === 'All') return true;
      return item.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
            <AlertCircle size={12} /> Crítico
          </span>
        );
      case 'Warning':
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-200">
            <AlertTriangle size={12} /> Preventiva
          </span>
        );
      case 'Healthy':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200">
            <CheckCircle size={12} /> Saludable
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Alertas de Inventario</h2>
          <p className="text-gray-500 text-sm">Monitoreo en tiempo real de niveles de stock y rotación</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center space-x-2 bg-odoo-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-md shadow-sm transition-all text-sm font-medium">
                <Download size={16} />
                <span>Exportar Alertas</span>
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-sm font-bold text-red-700 uppercase">Alertas Críticas</p>
                      <p className="text-2xl font-bold text-red-800 mt-1">{items.filter(i => i.status === 'Critical').length}</p>
                  </div>
                  <AlertCircle className="text-red-400" size={32} />
              </div>
              <p className="text-xs text-red-600 mt-2">Stock &le; 10 unidades</p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-sm font-bold text-yellow-700 uppercase">Preventivas</p>
                      <p className="text-2xl font-bold text-yellow-800 mt-1">{items.filter(i => i.status === 'Warning').length}</p>
                  </div>
                  <AlertTriangle className="text-yellow-400" size={32} />
              </div>
              <p className="text-xs text-yellow-600 mt-2">Stock &le; 20 unidades</p>
          </div>
           <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-sm font-bold text-blue-700 uppercase">Total SKUs</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{items.length}</p>
                  </div>
                  <Search className="text-blue-400" size={32} />
              </div>
              <p className="text-xs text-blue-600 mt-2">Catálogo Activo</p>
          </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
              </div>
              <input 
                  type="text" 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-odoo-primary focus:border-odoo-primary block w-full pl-10 p-2.5" 
                  placeholder="Buscar por SKU, nombre o categoría..." 
              />
          </div>
          <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">Filtro:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                  {['All', 'Critical', 'Warning'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-white text-odoo-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          {f === 'All' ? 'Todos' : f === 'Critical' ? 'Críticos' : 'Preventivos'}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-center">Ventas Diarias (Avg)</th>
                <th className="px-6 py-4 text-center">Días Restantes</th>
                <th className="px-6 py-4 text-center">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{item.sku}</td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4 text-center font-bold">{item.stock}</td>
                  <td className="px-6 py-4 text-center">{item.avgDailySales}</td>
                  <td className={`px-6 py-4 text-center font-bold ${item.daysRemaining < 3 ? 'text-red-600' : 'text-gray-600'}`}>
                      {item.daysRemaining.toFixed(1)} días
                  </td>
                  <td className="px-6 py-4 flex justify-center">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
                No se encontraron productos con el filtro seleccionado.
            </div>
        )}
      </div>
    </div>
  );
};