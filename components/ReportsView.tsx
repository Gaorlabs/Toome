
import React, { useState, useEffect } from 'react';
import { FileText, Download, BarChart, Calendar, Printer, BookOpen, Truck, Loader2, AlertCircle, ShoppingBag, PieChart, DollarSign, ArrowLeft, RefreshCw, Filter, Search, Table } from 'lucide-react';
import { OdooConnection, UserSession } from '../types';
import { 
    fetchSalesRegister, 
    fetchInventoryValuation, 
    fetchAccountsReceivable,
    fetchCashClosingReport,
    fetchPaymentAnalysis,
    fetchProductProfitabilityReport
} from '../services/odooBridge';
import * as XLSX from 'xlsx';

interface ReportsViewProps {
    connection?: OdooConnection | null;
    userSession?: UserSession | null;
}

interface ReportDefinition {
    id: number;
    title: string;
    desc: string;
    icon: any;
    color: string;
    bg: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ connection, userSession }) => {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  
  // Data State
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');

  const reportTypes: ReportDefinition[] = [
      { id: 1, title: 'Cierre de Caja Z (SUNAT)', desc: 'Resumen diario de ventas por sesión y arqueo de caja.', icon: Printer, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 2, title: 'Libro de Ventas (PLE)', desc: 'Generación de archivo para auditoría contable.', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
      { id: 3, title: 'Kardex Valorizado', desc: 'Control de inventario físico y valorizado por almacén.', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
      { id: 4, title: 'Análisis de Medios de Pago', desc: 'Desglose detallado de transacciones por método.', icon: PieChart, color: 'text-teal-600', bg: 'bg-teal-50' },
      { id: 5, title: 'Rentabilidad por Producto', desc: 'Margen bruto descontando costos actualizados.', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 6, title: 'Cuentas por Cobrar', desc: 'Facturas pendientes de pago y antigüedad de deuda.', icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  useEffect(() => {
      setReportData([]);
      setError(null);
      setSearchTerm('');
      if (selectedReport && connection) {
          fetchData(); 
      }
  }, [selectedReport]);

  const fetchData = async () => {
      if (!connection || !selectedReport) return;
      
      setLoading(true);
      setError(null);
      const allowedCompanies = userSession?.clientData?.allowedCompanyIds;

      try {
          let data: any[] = [];
          switch (selectedReport.id) {
              case 1: data = await fetchCashClosingReport(connection, startDate, endDate, allowedCompanies); break;
              case 2: data = await fetchSalesRegister(connection, startDate, endDate, allowedCompanies); break;
              case 3: data = await fetchInventoryValuation(connection, allowedCompanies); break;
              case 4: data = await fetchPaymentAnalysis(connection, startDate, endDate, allowedCompanies); break;
              case 5: data = await fetchProductProfitabilityReport(connection, startDate, endDate, allowedCompanies); break;
              case 6: data = await fetchAccountsReceivable(connection, allowedCompanies); break;
          }
          setReportData(data);
      } catch (e) {
          console.error(e);
          setError("Error al obtener los datos. Verifique su conexión.");
      } finally {
          setLoading(false);
      }
  };

  const handleExport = () => {
      if (reportData.length === 0) return;
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte");
      XLSX.writeFile(wb, `${selectedReport?.title.replace(/\s/g, '_')}_${startDate}.xlsx`);
  };

  // --- Dynamic Summary Calculation ---
  const getSummaryMetrics = () => {
      if (reportData.length === 0) return null;
      
      const count = reportData.length;
      let totalAmount = 0;
      let label = 'Monto Total';

      const sample = reportData[0];
      if ('totalAmount' in sample) totalAmount = reportData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      else if ('totalValue' in sample) { totalAmount = reportData.reduce((acc, curr) => acc + (curr.totalValue || 0), 0); label = 'Valorizado Total'; }
      else if ('amountDue' in sample) { totalAmount = reportData.reduce((acc, curr) => acc + (curr.amountDue || 0), 0); label = 'Deuda Total'; }
      else if ('amount' in sample) totalAmount = reportData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      else if ('totalSales' in sample) totalAmount = reportData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);

      return { count, totalAmount, label };
  };

  const summary = getSummaryMetrics();

  const getHeaders = () => {
      if (reportData.length === 0) return [];
      return Object.keys(reportData[0]).filter(k => typeof reportData[0][k] !== 'object' || reportData[0][k] === null);
  };

  const filteredData = reportData.filter(row => 
      JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // VIEW 1: GALLERY
  if (!selectedReport) {
      return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Centro de Reportes</h2>
                    <p className="text-gray-500 text-sm">Selecciona un módulo para visualizar, filtrar y exportar datos.</p>
                </div>
            </div>

            {!connection && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
                    <p className="text-sm text-yellow-700 font-medium">
                        <AlertCircle className="inline mr-2" size={16}/>
                        Conecta una base de datos Odoo para acceder a los reportes.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report) => (
                    <button 
                        key={report.id} 
                        onClick={() => setSelectedReport(report)}
                        disabled={!connection}
                        className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-odoo-primary/30 transition-all text-left flex flex-col justify-between h-48 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${report.bg} transition-transform group-hover:scale-150`}></div>
                        
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl ${report.bg} ${report.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                                <report.icon size={24} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-odoo-primary transition-colors">{report.title}</h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{report.desc}</p>
                        </div>
                        
                        <div className="relative z-10 flex items-center text-xs font-bold text-gray-400 group-hover:text-odoo-primary mt-auto pt-4 uppercase tracking-wide">
                            <span>Explorar Datos</span>
                            <ArrowLeft className="ml-2 rotate-180 transition-transform group-hover:translate-x-1" size={14} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
  }

  // VIEW 2: DETAIL
  return (
      <div className="space-y-6 animate-fade-in h-full flex flex-col">
          {/* Header Bar - Responsive Stacking */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="flex items-center gap-3 w-full xl:w-auto">
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="p-2 shrink-0 hover:bg-gray-100 rounded-full text-gray-500 hover:text-odoo-primary transition-colors"
                  >
                      <ArrowLeft size={24} />
                  </button>
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg shrink-0 ${selectedReport.bg} ${selectedReport.color}`}>
                          <selectedReport.icon size={24} />
                      </div>
                      <div className="min-w-0">
                          <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-none truncate">{selectedReport.title}</h2>
                          <p className="text-xs text-gray-400 mt-1 truncate">Previsualización y Exportación</p>
                      </div>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch sm:items-center">
                   {selectedReport.id !== 3 && (
                       <div className="flex flex-col sm:flex-row items-center bg-gray-50 rounded-lg p-1 border border-gray-200 w-full sm:w-auto">
                           <div className="flex items-center px-2 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-200 w-full sm:w-auto">
                               <Calendar size={14} className="text-gray-400 mr-2 shrink-0"/>
                               <input 
                                   type="date" 
                                   value={startDate}
                                   onChange={(e) => setStartDate(e.target.value)}
                                   className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none w-full sm:w-28"
                               />
                           </div>
                           <div className="flex items-center px-2 py-2 sm:py-0 w-full sm:w-auto">
                               <span className="text-gray-400 text-xs mr-2 shrink-0 hidden sm:inline">a</span>
                               <span className="text-gray-400 text-xs mr-2 shrink-0 sm:hidden">Hasta</span>
                               <input 
                                   type="date" 
                                   value={endDate}
                                   onChange={(e) => setEndDate(e.target.value)}
                                   className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none w-full sm:w-28"
                               />
                           </div>
                       </div>
                   )}
                   
                   <button 
                       onClick={fetchData}
                       disabled={loading}
                       className="flex justify-center items-center gap-2 bg-odoo-primary text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-odoo-primaryDark transition-all shadow-sm active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                   >
                       <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                       {loading ? 'Cargando...' : 'Actualizar'}
                   </button>
              </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">Registros</p>
                              <p className="text-2xl font-bold text-gray-800">{summary.count}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-full text-gray-400"><Table size={20} /></div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between md:col-span-2">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">{summary.label}</p>
                              <p className="text-xl md:text-2xl font-bold text-odoo-primary truncate">
                                  {summary.totalAmount > 0 
                                    ? `S/ ${summary.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` 
                                    : '---'}
                              </p>
                          </div>
                          <div className="p-3 bg-odoo-primary/10 rounded-full text-odoo-primary"><DollarSign size={20} /></div>
                      </div>
                  </div>
              )}

              <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                  
                  <div className="p-3 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="relative w-full sm:w-64">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                              type="text" 
                              placeholder="Filtrar resultados..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-odoo-primary outline-none"
                          />
                      </div>
                      <button 
                          onClick={handleExport}
                          disabled={reportData.length === 0}
                          className="flex w-full sm:w-auto justify-center items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                          <Download size={14} /> Exportar Excel
                      </button>
                  </div>

                  {/* Horizontal Scroll wrapper for Table */}
                  <div className="flex-1 overflow-auto">
                      {loading ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
                              <Loader2 size={40} className="animate-spin mb-4 text-odoo-primary" />
                              <p className="text-sm font-medium">Procesando datos desde Odoo...</p>
                          </div>
                      ) : reportData.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-300 min-h-[200px]">
                              <FileText size={48} className="mb-2 opacity-50" />
                              <p className="text-sm">No se encontraron datos para los filtros seleccionados.</p>
                          </div>
                      ) : (
                          <div className="inline-block min-w-full align-middle">
                              <table className="min-w-full text-xs text-left text-gray-600">
                                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                      <tr>
                                          <th className="px-4 py-3 font-bold text-gray-500 w-12 text-center">#</th>
                                          {getHeaders().map((header) => (
                                              <th key={header} className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                  {header.replace(/([A-Z])/g, ' $1').trim()}
                                              </th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {filteredData.slice(0, 100).map((row, idx) => (
                                          <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                              <td className="px-4 py-2 text-center text-gray-300 font-mono">{idx + 1}</td>
                                              {getHeaders().map((header) => (
                                                  <td key={header} className="px-4 py-2 whitespace-nowrap">
                                                      {typeof row[header] === 'number' 
                                                          ? row[header].toLocaleString() 
                                                          : String(row[header] || '-')}
                                                  </td>
                                              ))}
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
                  
                  {filteredData.length > 100 && (
                      <div className="bg-yellow-50 p-2 text-center text-[10px] text-yellow-700 font-medium border-t border-yellow-100">
                          Mostrando primeros 100 registros. Exporte a Excel para ver la data completa ({reportData.length} filas).
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
};
