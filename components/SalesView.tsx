
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Download, FileText, RefreshCw } from 'lucide-react';
import { SalesRegisterItem } from '../types';
import { fetchSalesRegister } from '../services/odooBridge';
import { OdooConnection } from '../types';

interface SalesViewProps {
    connection?: OdooConnection | null;
}

export const SalesView: React.FC<SalesViewProps> = ({ connection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('Todos');
  const [sales, setSales] = useState<SalesRegisterItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      // Load mock data immediately if no connection, or real data if connection
      loadData();
  }, [connection]);

  const loadData = async () => {
      setLoading(true);
      const data = await fetchSalesRegister(connection || { connectionMode: 'MOCK' } as any);
      setSales(data);
      setLoading(false);
  };

  const filtered = sales.filter(t => 
    (docTypeFilter === 'Todos' || t.documentType === docTypeFilter) &&
    (t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.clientDocNum.includes(searchTerm) ||
     t.number.includes(searchTerm))
  );

  const totalBase = filtered.reduce((acc, curr) => acc + curr.baseAmount, 0);
  const totalIGV = filtered.reduce((acc, curr) => acc + curr.igvAmount, 0);
  const totalTotal = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-odoo-primary" /> Registro de Ventas (SUNAT)
          </h2>
          <p className="text-gray-500 text-sm">Formato contable detallado por comprobante de pago.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={loadData}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                <Download size={16} /> Exportar PLE (TXT)
            </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase">Documentos</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{filtered.length}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase">Base Imponible</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  S/ {totalBase.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase">IGV (18%)</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  S/ {totalIGV.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </h3>
          </div>
          <div className="bg-odoo-primary p-4 rounded-xl shadow-sm text-white">
              <p className="text-xs font-bold text-white/80 uppercase">Total Venta</p>
              <h3 className="text-2xl font-bold mt-1">
                  S/ {totalTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </h3>
          </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                  type="text" 
                  placeholder="Buscar por Cliente, RUC, Serie o Número..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-odoo-primary focus:border-odoo-primary outline-none"
              />
          </div>
          <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select 
                value={docTypeFilter} 
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-odoo-primary focus:border-odoo-primary p-2.5"
              >
                  <option value="Todos">Todos los Documentos</option>
                  <option value="Factura">Facturas (01)</option>
                  <option value="Boleta">Boletas (03)</option>
                  <option value="Nota Crédito">Notas de Crédito (07)</option>
              </select>
          </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden spreadsheet-grid">
          <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-700">
                  <thead className="sheet-header">
                      <tr>
                          <th className="px-4 py-3 border-r border-gray-200">Emisión</th>
                          <th className="px-4 py-3 border-r border-gray-200">Tipo</th>
                          <th className="px-4 py-3 border-r border-gray-200">Serie-Número</th>
                          <th className="px-4 py-3 border-r border-gray-200">Doc. Identidad</th>
                          <th className="px-4 py-3 border-r border-gray-200">Razón Social / Nombre</th>
                          <th className="px-4 py-3 border-r border-gray-200 text-right">Base Imp.</th>
                          <th className="px-4 py-3 border-r border-gray-200 text-right">IGV</th>
                          <th className="px-4 py-3 border-r border-gray-200 text-right">Total</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filtered.map((t) => (
                          <tr key={t.id} className="sheet-row hover:bg-blue-50">
                              <td className="px-4 py-2 border-r border-gray-100">{t.date}</td>
                              <td className="px-4 py-2 border-r border-gray-100 font-medium">
                                  {t.documentType === 'Factura' ? '01-FACTURA' : t.documentType === 'Boleta' ? '03-BOLETA' : t.documentType.toUpperCase()}
                              </td>
                              <td className="px-4 py-2 border-r border-gray-100">{t.series}-{t.number}</td>
                              <td className="px-4 py-2 border-r border-gray-100">
                                  <span className="text-[10px] text-gray-500 mr-1">{t.clientDocType}</span>
                                  {t.clientDocNum}
                              </td>
                              <td className="px-4 py-2 border-r border-gray-100 truncate max-w-[200px]" title={t.clientName}>
                                  {t.clientName}
                              </td>
                              <td className="px-4 py-2 border-r border-gray-100 text-right">{t.baseAmount.toFixed(2)}</td>
                              <td className="px-4 py-2 border-r border-gray-100 text-right">{t.igvAmount.toFixed(2)}</td>
                              <td className="px-4 py-2 border-r border-gray-100 text-right font-bold">{t.totalAmount.toFixed(2)}</td>
                              <td className="px-4 py-2 text-center">
                                  {t.status === 'Emitido' ? (
                                      <span className="text-green-600 font-bold">OK</span>
                                  ) : (
                                      <span className="text-red-500 font-bold">ANULADO</span>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                  No se encontraron comprobantes.
              </div>
          )}
      </div>
    </div>
  );
};
