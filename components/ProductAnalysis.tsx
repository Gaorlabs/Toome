
import React, { useState } from 'react';
import { ProductPerformance } from '../types';
import { TrendingUp, DollarSign, Package, ArrowUp, ArrowDown, Filter, Download } from 'lucide-react';

interface ProductAnalysisProps {
  products: ProductPerformance[];
}

export const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ products }) => {
  const [sortField, setSortField] = useState<keyof ProductPerformance>('sales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof ProductPerformance) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Análisis de Productos (ABC)</h2>
          <p className="text-gray-500 text-sm">Clasificación por impacto en ventas y rentabilidad.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                <Filter size={16} /> Filtros
            </button>
            <button className="flex items-center gap-2 bg-odoo-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-odoo-primaryDark">
                <Download size={16} /> Exportar Excel
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
                <span className="text-sm font-bold text-gray-500 uppercase">Clase A (Top 20%)</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{products.filter(p => p.abcClass === 'A').length}</p>
            <p className="text-xs text-gray-400 mt-1">Generan el 80% de las ventas</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                <span className="text-sm font-bold text-gray-500 uppercase">Margen Promedio</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">34.5%</p>
            <p className="text-xs text-green-600 mt-1 flex items-center"><ArrowUp size={12} /> +2.1% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={20} /></div>
                <span className="text-sm font-bold text-gray-500 uppercase">Baja Rotación</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{products.filter(p => p.rotation === 'Low').length}</p>
            <p className="text-xs text-red-500 mt-1">Productos estancados &gt; 90 días</p>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-odoo-primary" onClick={() => handleSort('name')}>Producto</th>
                <th className="px-6 py-4 font-medium cursor-pointer text-center hover:text-odoo-primary" onClick={() => handleSort('abcClass')}>Clase ABC</th>
                <th className="px-6 py-4 font-medium text-right cursor-pointer hover:text-odoo-primary" onClick={() => handleSort('sales')}>Ventas</th>
                <th className="px-6 py-4 font-medium text-right cursor-pointer hover:text-odoo-primary" onClick={() => handleSort('cost')}>Costo</th>
                <th className="px-6 py-4 font-medium text-right cursor-pointer hover:text-odoo-primary" onClick={() => handleSort('margin')}>Margen ($)</th>
                <th className="px-6 py-4 font-medium text-right cursor-pointer hover:text-odoo-primary" onClick={() => handleSort('profitability')}>Rentabilidad (%)</th>
                <th className="px-6 py-4 font-medium text-center">Rotación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${product.abcClass === 'A' ? 'bg-green-100 text-green-700' : 
                          product.abcClass === 'B' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-600'}`}>
                        Clase {product.abcClass}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">S/. {product.sales.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-500">S/. {product.cost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">S/. {product.margin.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold ${product.profitability > 25 ? 'text-green-600' : product.profitability > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {product.profitability}%
                        </span>
                        {/* Mini bar chart simulation */}
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-odoo-primary" style={{ width: `${Math.min(product.profitability, 100)}%` }}></div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs ${product.rotation === 'High' ? 'text-green-600' : product.rotation === 'Low' ? 'text-red-500' : 'text-gray-500'}`}>
                        {product.rotation === 'High' ? 'Alta' : product.rotation === 'Medium' ? 'Media' : 'Baja'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
