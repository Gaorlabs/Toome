
import React from 'react';
import { CustomerSegment } from '../types';
import { Users, UserCheck, UserX, Crown, Search, Filter, Inbox } from 'lucide-react';

interface CustomerViewProps {
  customers: CustomerSegment[];
}

export const CustomerView: React.FC<CustomerViewProps> = ({ customers }) => {
  
  const getSegmentColor = (segment: string) => {
      switch(segment) {
          case 'VIP': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'Regular': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Occasional': return 'bg-gray-100 text-gray-600 border-gray-200';
          case 'Risk': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  if (customers.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Users size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-700">Sin Clientes</h2>
              <p className="text-gray-500 mt-2 max-w-md">
                  No se encontraron clientes o datos de ventas para segmentar.
              </p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes (RFM)</h2>
            <p className="text-gray-500 text-sm">Segmentación por valor de vida y frecuencia de compra.</p>
            </div>
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Buscar cliente..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-odoo-primary w-64" />
                 </div>
            </div>
        </div>

        {/* Segmentation Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-purple-600 uppercase">VIP (Alto Valor)</p>
                    <p className="text-2xl font-bold text-gray-800">{customers.filter(c => c.segment === 'VIP').length}</p>
                </div>
                <Crown className="text-purple-300" size={32} />
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-blue-600 uppercase">Regulares</p>
                    <p className="text-2xl font-bold text-gray-800">{customers.filter(c => c.segment === 'Regular').length}</p>
                </div>
                <Users className="text-blue-300" size={32} />
            </div>
             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Ocasionales</p>
                    <p className="text-2xl font-bold text-gray-800">{customers.filter(c => c.segment === 'Occasional').length}</p>
                </div>
                <UserCheck className="text-gray-300" size={32} />
            </div>
             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-red-600 uppercase">En Riesgo</p>
                    <p className="text-2xl font-bold text-gray-800">{customers.filter(c => c.segment === 'Risk').length}</p>
                </div>
                <UserX className="text-red-300" size={32} />
            </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4 text-center">Segmento</th>
                        <th className="px-6 py-4 text-center">Frecuencia</th>
                        <th className="px-6 py-4 text-center">Última Compra (Recencia)</th>
                        <th className="px-6 py-4 text-right">LTV (Valor Total)</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {customers.map(customer => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSegmentColor(customer.segment)}`}>
                                    {customer.segment}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">{customer.frequency} compras</td>
                            <td className="px-6 py-4 text-center text-gray-500">{customer.lastPurchaseDate}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-800">S/. {customer.totalSpent.toLocaleString()}</td>
                             <td className="px-6 py-4 text-center">
                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-200">
                                    <div className={`h-1.5 rounded-full ${customer.ltv > 10000 ? 'bg-purple-600' : 'bg-blue-500'}`} style={{width: '75%'}}></div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
