
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Download, FileText, RefreshCw, Calendar } from 'lucide-react';
import { SalesRegisterItem, UserSession, DateRange } from '../types';
import { fetchSalesRegister } from '../services/odooBridge';
import { OdooConnection } from '../types';

interface SalesViewProps {
    connection?: OdooConnection | null;
    userSession?: UserSession | null;
}

export const SalesView: React.FC<SalesViewProps> = ({ connection, userSession }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('Todos');
  
  // Date State
  const [dateFilter, setDateFilter] = useState<'HOY' | 'AYER' | 'MES' | 'AÑO' | 'CUSTOM'>('MES');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [customRange, setCustomRange] = useState<DateRange>({
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
  });

  const [sales, setSales] = useState<SalesRegisterItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      loadData();
  }, [connection, dateFilter, selectedMonth, customRange.start, customRange.end]); 

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
        return { 
            start: `${year}-${month}-01`, 
            end: `${year}-${month}-${lastDay}`,
            label: selectedMonth
        };
    }

    if (dateFilter === 'AÑO') {
        return { start: `${y}-01-01`, end: `${y}-12-31`, label: `Año ${y}` };
    }

    if (dateFilter === 'CUSTOM') {
        const label = customRange.start === customRange.end ? customRange.start : `${customRange.start} - ${customRange.end}`;
        return { start: customRange.start, end: customRange.end, label };
    }

    return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}`, label: 'Hoy' };
  };

  const loadData = async () => {
      setLoading(true);
      
      let allowedCompanyIds: string[] | undefined = undefined;
      
      if (userSession?.role === 'CLIENT' && userSession.clientData) {
          allowedCompanyIds = userSession.clientData.allowedCompanyIds;
      }

      const { start, end } = getEffectiveDateRange();

      const data = await fetchSalesRegister(
          connection || { connectionMode: 'MOCK' } as any, 
          start,
          end,
          allowedCompanyIds
      );
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

  const currentRange = getEffectiveDateRange();

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-odoo-primary" /> Ventas Detalladas
          </h2>
          <p className="text-gray-500 text-sm">Registro de comprobantes sincronizado en tiempo real.</p>
        </div>
        
        <div className="flex flex-col gap-3">
             <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm self-end md:self-auto">
                 {['HOY', 'AYER', 'MES', 'AÑO', 'CUSTOM'].map(filter => (
                     <button
                        key={filter}
                        onClick={() => setDateFilter(filter as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${dateFilter === filter ? 'bg-odoo-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                         {filter === 'CUSTOM' ? 'Personalizado' : filter === 'AYER' ? 'Ayer' : filter === 'HOY' ? 'Hoy' : filter}
                     </button>
                 ))}
             </div>
            
            {/* Month Selector */}
            {dateFilter === 'MES' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs animate-slide-up self-end">
                    <span className="font-bold text-gray-500">Mes:</span>
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-odoo-primary outline-none"
                    />
                </div>
            )}

            {/* Custom Range Selector */}
            {dateFilter === 'CUSTOM' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-xs animate-slide-up self-end">
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
                        onClick={loadData}
                        className="bg-odoo-primary text-white px-2 py-1 rounded hover:bg-odoo-primaryDark"
                    >
                        Filtrar
                    </button>
                </div>
            )}

            <div className="flex gap-2 self-end">
                <button 
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 
                    <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
                </button>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
                    <Download size={16} /> PLE
                </button>
            </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase">Documentos</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{filtered.length}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Periodo: {currentRange.label}</p>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-odoo-primary focus:border-odoo-primary outline-none text-sm"
              />
          </div>
          <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select 
                value={docTypeFilter} 
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-odoo-primary focus:border-odoo-primary p-2.5 outline-none"
              >
                  <option value="Todos">Todos los Documentos</option>
                  <option value="Factura">Facturas (01)</option>
                  <option value="Boleta">Boletas (03)</option>
                  <option value="Nota Crédito">Notas de Crédito (07)</option>
              </select>
          </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden spreadsheet-grid rounded-lg">
          <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-700">
                  <thead className="sheet-header">
                      <tr>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50">Emisión</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50">Tipo</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50">Serie-Número</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50">Doc. Identidad</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50">Razón Social / Nombre</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50 text-right">Base Imp.</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50 text-right">IGV</th>
                          <th className="px-4 py-3 border-r border-gray-200 bg-gray-50 text-right">Total</th>
                          <th className="px-4 py-3 bg-gray-50 text-center">Estado</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filtered.map((t) => (
                          <tr key={t.id} className="sheet-row hover:bg-blue-50 transition-colors">
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
                                      <span className="text-green-600 font-bold text-[10px]">OK</span>
                                  ) : (
                                      <span className="text-red-500 font-bold text-[10px]">ANULADO</span>
                                  )}
                              </td>
                          </tr>
                      ))}
                      {filtered.length === 0 && !loading && (
                           <tr>
                               <td colSpan={9} className="p-8 text-center text-gray-400 italic">
                                   No se encontraron registros para el periodo {currentRange.label}.
                               </td>
                           </tr>
                      )}
                      {loading && (
                          <tr>
                              <td colSpan={9} className="p-8 text-center text-odoo-primary italic">
                                  Cargando datos de Odoo...
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
