
import React, { useState } from 'react';
import { FileText, Download, BarChart, Calendar, Printer, BookOpen, Truck, Loader2, AlertCircle, ShoppingBag, PieChart, DollarSign } from 'lucide-react';
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

export const ReportsView: React.FC<ReportsViewProps> = ({ connection, userSession }) => {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const reportTypes = [
      { id: 1, title: 'Cierre de Caja Z (SUNAT)', desc: 'Resumen diario de ventas por sesión y arqueo de caja.', icon: Printer },
      { id: 2, title: 'Libro de Ventas Electrónico (PLE)', desc: 'Generación de archivo para auditoría contable.', icon: BookOpen },
      { id: 3, title: 'Kardex Valorizado', desc: 'Control de inventario físico y valorizado por almacén.', icon: Truck },
      { id: 4, title: 'Análisis de Medios de Pago', desc: 'Desglose detallado de transacciones por método.', icon: PieChart },
      { id: 5, title: 'Rentabilidad por Producto', desc: 'Margen bruto descontando costos actualizados.', icon: ShoppingBag },
      { id: 6, title: 'Cuentas por Cobrar', desc: 'Facturas pendientes de pago y antigüedad de deuda.', icon: DollarSign },
  ];

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
      if (!data || data.length === 0) {
          alert("No hay datos para exportar en el rango seleccionado.");
          return;
      }

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Auto-width columns roughly
      const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 15) }));
      ws['!cols'] = colWidths;

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet names max 31 chars

      // Write File
      XLSX.writeFile(wb, filename);
  };

  const handleGenerateReport = async (reportId: number) => {
      if (!connection) {
          setError("No hay conexión activa a Odoo.");
          return;
      }

      setLoading(reportId);
      setError(null);
      
      const allowedCompanies = userSession?.clientData?.allowedCompanyIds;

      try {
          let data = [];
          let baseFilename = '';
          const suffix = `${startDate}_${endDate}`;

          switch (reportId) {
              case 1: // Cierre Z
                  data = await fetchCashClosingReport(connection, startDate, endDate, allowedCompanies);
                  baseFilename = 'CierreCajaZ';
                  break;
              case 2: // PLE
                  data = await fetchSalesRegister(connection, startDate, endDate, allowedCompanies);
                  baseFilename = 'LibroVentas_PLE';
                  break;
              case 3: // Kardex
                  data = await fetchInventoryValuation(connection, allowedCompanies);
                  baseFilename = 'Kardex_Valorizado';
                  break;
              case 4: // Medios Pago
                  data = await fetchPaymentAnalysis(connection, startDate, endDate, allowedCompanies);
                  baseFilename = 'MediosPago';
                  break;
              case 5: // Rentabilidad
                  data = await fetchProductProfitabilityReport(connection, startDate, endDate, allowedCompanies);
                  baseFilename = 'Rentabilidad_Producto';
                  break;
              case 6: // Receivables
                  data = await fetchAccountsReceivable(connection, allowedCompanies);
                  baseFilename = 'CuentasPorCobrar';
                  break;
              default:
                  alert("Reporte no implementado aún.");
                  setLoading(null);
                  return;
          }

          exportToExcel(data, `${baseFilename}_${suffix}.xlsx`, baseFilename);

      } catch (e: any) {
          console.error(e);
          setError("Error generando el reporte. Verifique la conexión.");
      } finally {
          setLoading(null);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Centro de Reportes</h2>
                <p className="text-gray-500 text-sm">Hub centralizado de informes contables y operativos.</p>
            </div>
            
            <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-500 pl-2">Periodo:</span>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-odoo-primary focus:border-odoo-primary outline-none"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-odoo-primary focus:border-odoo-primary outline-none"
                />
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => (
                <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-odoo-primary/10 rounded-lg text-odoo-primary group-hover:bg-odoo-primary group-hover:text-white transition-colors">
                            <report.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{report.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-snug">{report.desc}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                        <button 
                            onClick={() => handleGenerateReport(report.id)}
                            disabled={loading !== null}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 hover:text-white hover:border-green-600 transition-all disabled:opacity-50"
                        >
                            {loading === report.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} 
                            {loading === report.id ? 'Generando...' : 'Exportar Excel'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        {!connection && (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-8">
                Conecta una base de datos Odoo para generar reportes reales.
            </div>
        )}
    </div>
  );
};
