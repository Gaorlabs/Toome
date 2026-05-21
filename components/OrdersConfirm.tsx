import React, { useState } from 'react';
import { 
  ClipboardList, Check, X, Truck, Calendar, ArrowRight, AlertTriangle, 
  MapPin, Printer, User, UserCheck, RefreshCcw
} from 'lucide-react';
import { Order, Product } from '../types';

interface OrdersConfirmProps {
  orders: Order[];
  products: Product[];
  onConfirmOrder: (orderId: string, scheduledDate: string) => void;
  onCancelOrder: (orderId: string) => void;
  onDeliverOrder: (orderId: string) => void;
}

export const OrdersConfirm: React.FC<OrdersConfirmProps> = ({
  orders,
  products,
  onConfirmOrder,
  onCancelOrder,
  onDeliverOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DELIVERED'>('PENDING_CONFIRMATION');
  const [selectedDatePicker, setSelectedDatePicker] = useState<Record<string, string>>({});

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'PENDING_CONFIRMATION') return o.status === 'PENDING_CONFIRMATION';
    if (activeTab === 'CONFIRMED') return o.status === 'CONFIRMED';
    return o.status === 'DELIVERED';
  });

  // Check if order has products lacking stock
  const checkStockAvailability = (order: Order) => {
    const issues: string[] = [];
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        issues.push(`Producto no encontrado: ${item.productName}`);
      } else if (prod.stock < item.qty) {
        issues.push(`Stock insuficiente para "${item.productName}": Requerido ${item.qty}, en Almacén ${prod.stock}`);
      }
    });
    return issues;
  };

  const handleConfirmClick = (orderId: string) => {
    const scheduled = selectedDatePicker[orderId] || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    onConfirmOrder(orderId, scheduled);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <ClipboardList size={13} /> CONTROL LOGÍSTICO CENTRAL
          </h5>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Gestión y Confirmación de Pedidos
          </h1>
          <p className="text-xs text-slate-400">Aprueba pedidos ingresados por los vendedores de preventa, verifica stock del almacén y programa guías de despacho.</p>
        </div>

        {/* Info label */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xxs gap-2 self-start">
          <span className="font-bold text-slate-400 uppercase tracking-widest px-2 self-center">Filtro Estado:</span>
          {(['PENDING_CONFIRMATION', 'CONFIRMED', 'DELIVERED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'PENDING_CONFIRMATION' && 'Por Confirmar'}
              {tab === 'CONFIRMED' && 'Confirmados / En Ruta'}
              {tab === 'DELIVERED' && 'Despachados / Entregados'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map(order => {
            const stockErrors = checkStockAvailability(order);
            const defaultTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const activeDate = selectedDatePicker[order.id] || defaultTomorrow;

            return (
              <div 
                key={order.id} 
                className="bg-white border border-slate-100 rounded-3xl shadow-spreadsheet overflow-hidden flex flex-col justify-between"
              >
                {/* Order Top Ribbon */}
                <div className="p-5 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono block">Nro. Registro</span>
                    <h3 className="text-slate-800 font-extrabold text-sm">{order.id}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">Fecha Preventa</span>
                    <span className="text-xs text-slate-600 font-bold">{order.date}</span>
                  </div>
                </div>

                {/* Stores & Seller details */}
                <div className="p-5 space-y-4">
                  <div className="flex gap-3.5 items-start">
                    <div className="p-2 bg-teal-50 text-[#017E84] rounded-xl">
                      <MapPin size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-[#017E84] text-sm leading-tight">{order.storeName}</h4>
                      <p className="text-xs text-slate-500 leading-tight">{order.storeAddress}</p>
                      <span className="inline-block text-xxs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1">
                        {order.storeZone}
                      </span>
                    </div>
                  </div>

                  {/* Vendedor */}
                  <div className="flex gap-2 items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <User size={13} className="text-slate-400" />
                    <span>Tomado por: <span className="font-bold text-slate-700">{order.sellerName}</span></span>
                  </div>

                  {/* Items List inside order */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Artículos del Pedido</span>
                    <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-200/40 last:border-0">
                          <span className="text-slate-700 font-medium">
                            {item.qty}x <span className="font-semibold">{item.productName}</span>
                          </span>
                          <span className="font-extrabold text-slate-800 shrink-0">
                            S/ {item.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Sub totals */}
                    <div className="pt-2 border-t border-slate-200 border-dashed flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Monto Total:</span>
                      <span className="font-black text-slate-900 text-sm">S/ {order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="text-xxs italic bg-yellow-50 text-yellow-800 p-2.5 rounded-lg border border-yellow-100">
                      📝 Nota Preventista: {order.notes}
                    </div>
                  )}

                  {/* Action or Warning triggers */}
                  {order.status === 'PENDING_CONFIRMATION' && (
                    <div className="space-y-3 pt-2">
                      {stockErrors.length > 0 ? (
                        <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl space-y-1">
                          <p className="text-xxs font-extrabold text-rose-700 flex items-center gap-1">
                            <AlertTriangle size={13} /> STOCK CRÍTICO (ALERTA)
                          </p>
                          {stockErrors.map((err, i) => (
                            <p key={i} className="text-[10px] text-rose-500 leading-normal pl-3.5">&bull; {err}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xxs font-extrabold text-[#017E84] flex items-center gap-1.5 bg-teal-50 p-3 rounded-lg border border-teal-100">
                          <UserCheck size={14} /> Stock verificado en almacén de despacho. Listo para despacho.
                        </p>
                      )}

                      {/* Date Scheduler Selector */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500 flex items-center gap-1.5">
                          <Calendar size={15} /> Programar Envío:
                        </span>
                        <input
                          type="date"
                          value={activeDate}
                          onChange={(e) => setSelectedDatePicker({ ...selectedDatePicker, [order.id]: e.target.value })}
                          className="border border-slate-200 p-1.5 rounded-lg text-xxs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck size={15} className="text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold text-blue-800">Despacho Programado</p>
                          <p className="text-[10px] text-blue-500 mt-0.5">Fecha: {order.shippingDate}</p>
                        </div>
                      </div>
                      {order.shippingRouteId && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold text-[9px] rounded uppercase">
                          Asignado a Ruta
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom interactive buttons */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3.5 justify-end">
                  {order.status === 'PENDING_CONFIRMATION' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onCancelOrder(order.id)}
                        className="bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Rechazar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmClick(order.id)}
                        className="bg-[#017E84] hover:bg-[#006064] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check size={15} />
                        <span>Confirmar & Reservar</span>
                      </button>
                    </>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-white border border-slate-200 text-slate-600 hover:text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Printer size={14} /> Imprimir Hoja
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeliverOrder(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Truck size={14} /> Entregado / Despachado
                      </button>
                    </>
                  )}

                  {order.status === 'DELIVERED' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 border border-emerald-100 rounded-lg">
                      <Check size={15} /> Entregado correctamente
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-white max-w-lg mx-auto flex flex-col items-center justify-center gap-2">
          <RefreshCcw size={40} className="text-slate-300 animate-spin-slow mb-2" />
          <h2 className="text-base font-extrabold text-slate-700">No hay pedidos para procesar</h2>
          <p className="text-xs text-slate-400">Todo se encuentra al día. Los preventistas subirán nuevos pedidos cuando inicien sus visitas físicas.</p>
        </div>
      )}
    </div>
  );
};
