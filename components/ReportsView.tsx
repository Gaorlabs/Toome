import React, { useState, useMemo } from 'react';
import { 
  BarChart as RechartBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart as RechartPie, Pie, Legend
} from 'recharts';
import { 
  FileText, Download, Printer, CircleDollarSign, Compass, Store, 
  User, Sparkles, TrendingUp, Landmark, Award
} from 'lucide-react';
import { Order, PaymentRecord, ClientStore, Product } from '../types';

interface ReportsViewProps {
  orders: Order[];
  payments: PaymentRecord[];
  clients: ClientStore[];
  products: Product[];
  session: { role: 'ADMIN' | 'SELLER'; name: string };
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  payments,
  clients,
  products,
  session
}) => {
  const isAdmin = session.role === 'ADMIN';

  // 1. Calculate Revenue by Zone
  const zoneSalesData = useMemo(() => {
    const zoneMap: Record<string, number> = {};
    orders.filter(o => o.status !== 'CANCELLED').forEach(o => {
      const z = o.storeZone || 'Zona General';
      zoneMap[z] = (zoneMap[z] || 0) + o.total;
    });
    return Object.keys(zoneMap).map(k => ({
      name: k,
      total: Math.round(zoneMap[k] * 100) / 100
    }));
  }, [orders]);

  // 2. Calculate Revenue by Payment Channel (YAPE, CASH, etc.)
  const channelData = useMemo(() => {
    const channelMap: Record<string, number> = {
      'EFECTIVO': 0,
      'YAPE / PLIN': 0,
      'TRANSFERENCIA': 0,
      'TARJETA P.O.S.': 0
    };

    payments.filter(p => p.approvedByAdmin).forEach(p => {
      if (p.paymentMethod === 'CASH') channelMap['EFECTIVO'] += p.amount;
      else if (p.paymentMethod === 'YAPE') channelMap['YAPE / PLIN'] += p.amount;
      else if (p.paymentMethod === 'TRANSFER') channelMap['TRANSFERENCIA'] += p.amount;
      else if (p.paymentMethod === 'CREDIT_CARD') channelMap['TARJETA P.O.S.'] += p.amount;
    });

    return Object.keys(channelMap).map(k => ({
      name: k,
      value: Math.round(channelMap[k] * 100) / 100
    })).filter(c => c.value > 0);
  }, [payments]);

  // 3. Calculate Seller Performance (Preventista leaderboard)
  const sellerLeaderboard = useMemo(() => {
    const sellerMap: Record<string, { totalSales: number, count: number }> = {};
    orders.filter(o => o.status !== 'CANCELLED').forEach(o => {
      if (!sellerMap[o.sellerName]) {
        sellerMap[o.sellerName] = { totalSales: 0, count: 0 };
      }
      sellerMap[o.sellerName].totalSales += o.total;
      sellerMap[o.sellerName].count += 1;
    });

    return Object.keys(sellerMap).map(k => ({
      name: k,
      sales: Math.round(sellerMap[k].totalSales * 100) / 100,
      ordersCount: sellerMap[k].count
    })).sort((a, b) => b.sales - a.sales);
  }, [orders]);

  // General statistics calculations
  const totalSalesAll = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);
  const totalPaidAll = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingDebtAll = clients.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const COLORS = ['#017E84', '#F43F5E', '#10B981', '#F59E0B', '#6366F1'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans print:bg-white print:p-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <FileText size={13} /> CENTRO DE BI & REPORTES
          </h5>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Inteligencia y Rendimiento Comercial
          </h1>
          <p className="text-xs text-slate-400">Análisis continuo de preventistas, canales de recaudación financiera y mapas de demanda zonal.</p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <Printer size={15} />
          <span>Imprimir Reporte</span>
        </button>
      </div>

      {/* Numerical Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ventas Acumuladas</span>
            <h3 className="text-2xl font-black text-slate-800">S/ {totalSalesAll.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Abonos Consolidados</span>
            <h3 className="text-2xl font-black text-emerald-600">S/ {totalPaidAll.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Landmark size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Deuda Viva de Clientes En Calle</span>
            <h3 className="text-2xl font-black text-rose-500">S/ {outstandingDebtAll.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
            <CircleDollarSign size={22} />
          </div>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District sales geography */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-spreadsheet space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Demanda Territorial por Distritos</h3>
            <p className="text-xs text-slate-400">Total Soles neto emitidos de preventa</p>
          </div>

          <div className="h-64">
            {zoneSalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartBar data={zoneSalesData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                  <RechartBar dataKey="total" fill="#017E84" radius={[4, 4, 0, 0]}>
                    {zoneSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartBar>
                </RechartBar>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Aún no hay pedidos para catalogar por distrito.
              </div>
            )}
          </div>
        </div>

        {/* Collection methods breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-spreadsheet space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Análisis de Medios de Recaudación</h3>
            <p className="text-xs text-slate-400">Distribución porcentual por canal</p>
          </div>

          <div className="h-64 flex flex-col sm:flex-row items-center gap-4 justify-center">
            {channelData.length > 0 ? (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPie>
                      <Pie
                        data={channelData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                    </RechartPie>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs text-slate-600 shrink-0">
                  {channelData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="font-medium text-slate-500">{entry.name}:</span>
                      <span className="font-extrabold text-slate-800">S/ {entry.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                 Sin recaudador verificado para graficar.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Preventistas performance leaderboard \& historic summaries */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-spreadsheet p-6">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Award size={16} className="text-[#017E84]" /> Rank General de Preventistas de Campo
        </h3>
        <p className="text-xs text-slate-400 mb-5">Venta total tomada por consultor y volumen de cobertura de visitas físicas</p>

        {sellerLeaderboard.length > 0 ? (
          <div className="space-y-4 max-w-2xl">
            {sellerLeaderboard.map((seller, index) => (
              <div key={seller.name} className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    index === 0 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : index === 1
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-white text-slate-500 border border-slate-150'
                  }`}>
                    {index + 1}
                  </span>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{seller.name}</h4>
                    <p className="text-xxs text-slate-400 mt-0.5">{seller.ordersCount} visitas efectivas con venta</p>
                  </div>
                </div>

                <span className="font-black text-[#017E84] text-sm shrink-0">
                  S/ {seller.sales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            Ningún preventista ha registrado pedidos de campo hoy.
          </div>
        )}
      </div>

    </div>
  );
};
