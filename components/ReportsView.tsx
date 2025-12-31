
import React from 'react';
import { FileText, Download, BarChart, Calendar, Printer, BookOpen, Truck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const reportTypes = [
      { id: 1, title: 'Cierre de Caja Z (SUNAT)', desc: 'Resumen diario de ventas por serie y método de pago para auditoría.', icon: Printer },
      { id: 2, title: 'Libro de Ventas Electrónico (PLE)', desc: 'Generación de archivo TXT validado para envío a SUNAT.', icon: BookOpen },
      { id: 3, title: 'Kardex Valorizado', desc: 'Control de inventario físico y valorizado por almacén.', icon: Truck },
      { id: 4, title: 'Análisis de Medios de Pago', desc: 'Desglose de Efectivo vs Yape/Plin vs Tarjetas.', icon: BarChart },
      { id: 5, title: 'Rentabilidad por Producto', desc: 'Margen bruto detallado descontando costos actualizados.', icon: FileText },
      { id: 6, title: 'Cuentas por Cobrar', desc: 'Facturas pendientes de pago y antigüedad de deuda.', icon: Calendar },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Centro de Reportes</h2>
            <p className="text-gray-500 text-sm">Hub centralizado de informes contables y operativos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => (
                <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-odoo-primary/10 rounded-lg text-odoo-primary">
                            <report.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{report.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                            <Download size={16} /> Excel
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-odoo-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-odoo-primaryDark transition-colors">
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
