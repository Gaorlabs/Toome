import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Eye, Check, X, Truck, Calendar, Kanban, List, 
  AlertTriangle, CheckCircle2, User, ChevronRight, MapPin, Download, Package,
  Printer
} from 'lucide-react';
import { Product, ClientStore, Order, DeliveryRoute, OrderItem } from '../types';

interface OrderWorkspaceProps {
  products: Product[];
  clients: ClientStore[];
  orders: Order[];
  routes?: DeliveryRoute[];
  session: { role: 'ADMIN' | 'SELLER'; name: string; sellerId?: string };
  onNavigate: any;
  onConfirmOrder?: (orderId: string, scheduledDate: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeliverOrder?: (orderId: string) => void;
  onAssignOrderToRoute?: (orderId: string, routeId: string | undefined) => void;
  onCreateRoute?: (newRoute: Omit<DeliveryRoute, 'id'>) => void;
}

export const OrderWorkspace: React.FC<OrderWorkspaceProps> = ({
  products,
  clients,
  orders = [],
  routes = [],
  session,
  onNavigate,
  onConfirmOrder,
  onCancelOrder,
  onDeliverOrder,
  onAssignOrderToRoute,
  onCreateRoute
}) => {
  const [displayMode, setDisplayMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceiptOrder, setShowReceiptOrder] = useState<Order | null>(null);

  // Quick route form states
  const [showQuickRoute, setShowQuickRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteDriver, setNewRouteDriver] = useState('Felipe Sandoval (Camioneta Hino 4T)');
  const [newRouteZone, setNewRouteZone] = useState('Zona Norte');

  const zones = ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'];

  // List of distinct seller representatives in orders
  const availableSellers = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.sellerName))).filter(Boolean);
  }, [orders]);

  // List of distinct geographic zones in system
  const availableZonesList = useMemo(() => {
    const zs = new Set(orders.map(o => o.storeZone));
    zones.forEach(z => zs.add(z));
    return Array.from(zs).filter(Boolean);
  }, [orders]);

  // Stock availability validation
  const checkStockAvailability = useMemo(() => {
    return (order: Order) => {
      const issues: string[] = [];
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          if (prod.stock < item.qty) {
            issues.push(`${prod.name}: requerido ${item.qty} un., stock real ${prod.stock} un.`);
          }
        } else {
          issues.push(`ID: ${item.productId} no encontrado en catálogo`);
        }
      });
      return issues;
    };
  }, [products]);

  // Computed live selected order
  const activeDetailOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find(o => o.id === selectedOrder.id) || selectedOrder;
  }, [selectedOrder, orders]);

  // Main filter engine
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Enforce role-based restrictions
    if (session.role === 'SELLER') {
      list = list.filter(o => o.sellerName === session.name || o.sellerId === session.sessionSellerId);
    } else {
      if (sellerFilter !== 'ALL') {
        list = list.filter(o => o.sellerName === sellerFilter);
      }
    }

    if (zoneFilter !== 'ALL') {
      list = list.filter(o => o.storeZone === zoneFilter);
    }

    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      list = list.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.storeName.toLowerCase().includes(query) ||
        o.storeAddress.toLowerCase().includes(query) ||
        o.sellerName.toLowerCase().includes(query)
      );
    }

    // Sort by recent first
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [orders, session, sellerFilter, zoneFilter, orderSearchQuery]);

  // Group columns for Kanban
  const kanbanColumns = useMemo(() => {
    const unconfirmed = filteredOrders.filter(o => o.status === 'PENDING_CONFIRMATION');
    const confirmedUnassigned = filteredOrders.filter(o => o.status === 'CONFIRMED' && !o.shippingRouteId);
    const confirmedAssigned = filteredOrders.filter(o => o.status === 'CONFIRMED' && o.shippingRouteId);
    const delivered = filteredOrders.filter(o => o.status === 'DELIVERED');
    const cancelled = filteredOrders.filter(o => o.status === 'CANCELLED');

    return {
      unconfirmed,
      confirmedUnassigned,
      confirmedAssigned,
      delivered,
      cancelled
    };
  }, [filteredOrders]);

  const handleQuickCreateRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim()) return;

    if (onCreateRoute) {
      onCreateRoute({
        name: newRouteName.trim(),
        vehiclePlate: newRouteDriver.includes('Hino') ? 'BFA-893' : 'V9D-232',
        driverName: newRouteDriver,
        status: 'PENDING',
        orderIds: [],
        zone: newRouteZone
      });
      setNewRouteName('');
      setShowQuickRoute(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans">
      
      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Por Confirmar</p>
            <p className="text-lg font-black text-slate-800">
              {orders.filter(o => o.status === 'PENDING_CONFIRMATION').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center font-bold">
            🚛
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Por Asignar Camión</p>
            <p className="text-lg font-black text-slate-800">
              {orders.filter(o => o.status === 'CONFIRMED' && !o.shippingRouteId).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center font-bold">
            📦
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Despachados / En Ruta</p>
            <p className="text-lg font-black text-slate-800">
              {orders.filter(o => o.status === 'CONFIRMED' && o.shippingRouteId).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-[#017E84] border border-teal-100 rounded-xl flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Entregas de Hoy</p>
            <p className="text-lg font-black text-[#017E84]">
              {orders.filter(o => o.status === 'DELIVERED').length}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH CONTROL BAR */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-spreadsheet flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID de pedido, cliente o dirección..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500/25 font-bold text-slate-705"
            />
          </div>

          <div className="flex gap-2.5">
            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500/25"
            >
              <option value="ALL">Todas las Zonas</option>
              {availableZonesList.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            {/* Seller Select (ADMIN Only) */}
            {session.role === 'ADMIN' && (
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500/25"
              >
                <option value="ALL">Todos los Vendedores</option>
                {availableSellers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* View mode toggle SLIDER */}
        <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
          <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Visualización:</span>
          <div className="flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setDisplayMode('KANBAN')}
              className={`p-1.5 px-3.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                displayMode === 'KANBAN' ? 'bg-[#017E84] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban size={12} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('LIST')}
              className={`p-1.5 px-3.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                displayMode === 'LIST' ? 'bg-[#017E84] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List size={12} />
              <span>Lista Simple</span>
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN LAYOUT VIEW */}
      {displayMode === 'KANBAN' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4.5 items-start">
          
          {/* COLUMN 1: PENDING CONFIRMATION */}
          <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-150 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xxs font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                ⏱ POR CONFIRMAR ({kanbanColumns.unconfirmed.length})
              </span>
              <span className="text-xs font-black text-slate-500">
                S/ {kanbanColumns.unconfirmed.reduce((sum, o) => sum + o.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.unconfirmed.map(o => {
                const issues = checkStockAvailability(o);
                const hasIssues = issues.length > 0;
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`p-3 bg-white hover:bg-slate-50 border rounded-xl shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 pointer-events-auto flex flex-col gap-2 ${
                      hasIssues ? 'border-amber-400 hover:border-amber-500' : 'border-slate-150 hover:border-[#017E84]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#017E84] font-black">{o.id}</span>
                      <span className="text-slate-400">{o.date}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-850 text-xs truncate">{o.storeName}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                        <MapPin size={10} className="text-slate-400 shrink-0" />
                        <span className="truncate">{o.storeAddress}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wide">
                          {o.storeZone}
                        </span>
                        <p className="text-[8px] text-slate-400 font-semibold">{o.sellerName}</p>
                      </div>
                      <span className="font-black text-xs text-slate-850">
                        S/ {o.total.toFixed(2)}
                      </span>
                    </div>

                    {hasIssues && (
                      <div className="text-[9.5px] bg-amber-50 text-amber-700 p-1.5 rounded-lg font-bold flex items-center gap-1 border border-amber-100 animate-pulse">
                        <AlertTriangle size={11} className="shrink-0" />
                        <span>¡Stock Insuficiente!</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {kanbanColumns.unconfirmed.length === 0 && (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                  No hay pedidos pendientes de confirmación.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: CONFIRMED - UNASSIGNED */}
          <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-150 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xxs font-black text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                🚛 SIN FURGÓN ({kanbanColumns.confirmedUnassigned.length})
              </span>
              <span className="text-xs font-black text-slate-500">
                S/ {kanbanColumns.confirmedUnassigned.reduce((sum, o) => sum + o.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.confirmedUnassigned.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-150 hover:border-blue-400 rounded-xl shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-blue-600 font-black">{o.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReceiptOrder(o);
                        }}
                        title="Imprimir Recibo"
                        className="p-1 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded border border-teal-100 transition-all cursor-pointer flex items-center justify-center"
                      >
                        <Printer size={10} />
                      </button>
                      <span className="text-slate-400 font-sans font-medium text-[9px]">Entr: {o.shippingDate}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-850 text-xs truncate">{o.storeName}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                      <MapPin size={10} className="text-slate-400 shrink-0" />
                      <span className="truncate">{o.storeAddress}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-105">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">
                        {o.storeZone}
                      </span>
                      <p className="text-[8px] text-slate-400 font-semibold">{o.sellerName}</p>
                    </div>
                    <span className="font-black text-xs text-slate-850">
                      S/ {o.total.toFixed(2)}
                    </span>
                  </div>
                  
                  {session.role === 'ADMIN' && (
                    <button
                      type="button"
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 text-center"
                    >
                      <Truck size={10} />
                      <span> ASIGNAR DIRECTO</span>
                    </button>
                  )}
                </div>
              ))}

              {kanbanColumns.confirmedUnassigned.length === 0 && (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                  Todos los confirmados ya tienen camión asignado.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: ROUNTE ASSIGNED */}
          <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-150 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xxs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                📦 EN RUTA DE DESPACHO ({kanbanColumns.confirmedAssigned.length})
              </span>
              <span className="text-xs font-black text-slate-500">
                S/ {kanbanColumns.confirmedAssigned.reduce((sum, o) => sum + o.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.confirmedAssigned.map(o => {
                const assignedRoute = routes.find(r => r.id === o.shippingRouteId);
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-150 hover:border-indigo-400 rounded-xl shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-indigo-600 font-black">{o.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReceiptOrder(o);
                          }}
                          title="Imprimir Recibo"
                          className="p-1 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded border border-teal-100 transition-all cursor-pointer flex items-center justify-center"
                        >
                          <Printer size={10} />
                        </button>
                        <span className="text-slate-400 font-sans font-medium text-[9px]">Entr: {o.shippingDate}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-850 text-xs truncate">{o.storeName}</h4>
                      <p className="text-[10px] font-bold text-indigo-600 underline truncate mt-0.5">
                        🚚 {assignedRoute ? assignedRoute.name : 'Ruta Activa'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-105">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wide">
                          {o.storeZone}
                        </span>
                        <p className="text-[8px] text-indigo-500 font-bold">{assignedRoute?.driverName ? assignedRoute.driverName.split('(')[0] : 'Despachador'}</p>
                      </div>
                      <span className="font-black text-xs text-slate-850">
                        S/ {o.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {kanbanColumns.confirmedAssigned.length === 0 && (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                  Ningún despacho asignado para hoy.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 4: DELIVERED AND CLOSURE */}
          <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-150 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xxs font-black text-teal-800 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                ✓ ENTREGADOS ({kanbanColumns.delivered.length})
              </span>
              <span className="text-xs font-black text-slate-500">
                S/ {kanbanColumns.delivered.reduce((sum, o) => sum + o.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              {kanbanColumns.delivered.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="p-3 bg-white/80 hover:bg-slate-50 border border-slate-150 hover:border-teal-400 rounded-xl shadow-inner cursor-pointer transition-all flex flex-col gap-2 opacity-90"
                >
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-emerald-700 font-black">{o.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReceiptOrder(o);
                        }}
                        title="Imprimir Recibo"
                        className="p-1 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded border border-teal-100 transition-all cursor-pointer flex items-center justify-center"
                      >
                        <Printer size={10} />
                      </button>
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide">• ENTREGADO</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-850 text-xs truncate">{o.storeName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Preventista: {o.sellerName}</p>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-105">
                    <span className="text-[9px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded uppercase tracking-wide">
                      {o.storeZone}
                    </span>
                    <span className="font-black text-xs text-[#017E84]">
                      S/ {o.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {kanbanColumns.delivered.length === 0 && (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                  Aún no hay entregas finalizadas hoy.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        
        /* LIST EXCEL LAYOUT */
        <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-spreadsheet">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 font-black text-slate-500 text-xxs uppercase tracking-wider">
                  <th className="p-3">ID Pedido</th>
                  <th className="p-3">Visualización / Cliente</th>
                  <th className="p-3">Preventista</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3">Fecha Despacho</th>
                  <th className="p-3">Furgón Asignado</th>
                  <th className="p-3 text-right">Importe Cobrado</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOrders.map(o => {
                  const assignedRoute = routes.find(r => r.id === o.shippingRouteId);
                  const hasIssues = checkStockAvailability(o).length > 0;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-all font-medium text-xs">
                      <td className="p-3 font-extrabold text-[#017E84]">{o.id}</td>
                      <td className="p-3">
                        <span className="font-black text-slate-850 block">{o.storeName}</span>
                        <span className="text-slate-400 text-xxs block mt-0.5 truncate max-w-xs">{o.storeAddress}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-semibold">{o.sellerName}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                          {o.storeZone}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-bold">{o.shippingDate}</td>
                      <td className="p-3">
                        {assignedRoute ? (
                          <span className="text-slate-700 font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded">
                            🚚 {assignedRoute.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-slate-850">S/ {o.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                          o.status === 'PENDING_CONFIRMATION' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          o.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          o.status === 'DELIVERED' ? 'bg-emerald-50 text-[#017E84] border border-teal-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {o.status === 'PENDING_CONFIRMATION' ? '⏱ Por Validar' :
                           o.status === 'CONFIRMED' ? '✓ Confirmado' :
                           o.status === 'DELIVERED' ? '★ Entregado' : 'X Anulado'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mx-auto w-max">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1.5 text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-xxs font-black transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Inspeccionar</span>
                          </button>
                          
                          {(o.status === 'CONFIRMED' || o.status === 'DELIVERED') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReceiptOrder(o);
                              }}
                              title="Imprimir Recibo"
                              className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 text-xxs font-black transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Printer size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400 italic font-semibold">
                      Ningún pedido hoy coincide con los filtros establecidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED DIALOG MODAL */}
      {activeDetailOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-150 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
            
            {/* Header block */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="inline-block text-[10px] font-black text-slate-400 tracking-wider uppercase">Pedido de Venta de Hoy</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#017E84] font-black text-lg">{activeDetailOrder.id}</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    activeDetailOrder.status === 'PENDING_CONFIRMATION' ? 'bg-amber-50 text-amber-700' :
                    activeDetailOrder.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-700' :
                    activeDetailOrder.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {activeDetailOrder.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowReceiptOrder(activeDetailOrder)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#017E84] rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer border border-teal-150"
                  title="Imprimir comprobante"
                >
                  <Printer size={13} />
                  <span>Imprimir Recibo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 transition-all text-slate-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content body Scrollable */}
            <div className="p-5 overflow-y-auto space-y-5 text-slate-705 text-xs">
              
              {/* Row Store details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Cliente de Venta</p>
                  <p className="font-extrabold text-slate-850 text-sm">{activeDetailOrder.storeName}</p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {activeDetailOrder.storeAddress}
                  </p>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Canal de Venta</p>
                  <p className="font-black text-slate-800">{activeDetailOrder.sellerName}</p>
                  <p className="text-slate-500 flex items-center gap-1.5 uppercase font-bold text-[10px] tracking-wide">
                    Zona: <span className="text-[#017E84] font-black">{activeDetailOrder.storeZone}</span>
                  </p>
                </div>
              </div>

              {/* Items Table details */}
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Detalle de Artículos y Canasta</p>
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-2 w-1/12 text-center">Item</th>
                        <th className="p-2">Descripción Producto</th>
                        <th className="p-2 text-center">Cantidad Solicitada</th>
                        <th className="p-2 text-right">P. Mayorista Unit.</th>
                        <th className="p-2 text-right">Subtotal S/</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-705">
                      {activeDetailOrder.items.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/30">
                          <td className="p-2.5 text-center font-bold text-slate-400">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-850">{item.productName}</td>
                          <td className="p-2.5 text-center font-black text-slate-800 bg-slate-50/50">{item.qty} un.</td>
                          <td className="p-2.5 text-right font-semibold">S/ {item.price.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-black text-slate-800 font-mono">S/ {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-black text-slate-800 text-xs">
                        <td colSpan={4} className="p-2.5 text-right uppercase">Monto Total Liquidación:</td>
                        <td className="p-2.5 text-right text-[#017E84] font-mono font-black text-xs">S/ {activeDetailOrder.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes display */}
              {activeDetailOrder.notes && (
                <div className="p-3 bg-amber-50 text-slate-700 rounded-xl border border-amber-100 flex items-start gap-2">
                  <span className="text-amber-500 font-black text-sm">💡</span>
                  <div>
                    <strong className="text-[10px] uppercase font-black text-amber-800 block">Comentarios del Preventista:</strong>
                    <p className="mt-0.5 leading-relaxed font-semibold italic text-slate-650">{activeDetailOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* STOCK AVAILABILITY REPORT */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inspección de Almacén e Inventario de Stock</p>
                {(() => {
                  const itemsIssues = checkStockAvailability(activeDetailOrder);
                  if (itemsIssues.length === 0) {
                    return (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#017E84]" />
                        <span>¡Stock 100% verificado y disponible en almacén para este pedido!</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 font-semibold space-y-1">
                        <div className="flex items-center gap-2 text-rose-700 font-black uppercase text-[10px] tracking-wider">
                          <AlertTriangle size={15} />
                          <span>¡Advertencia: Quiebre de stock detectado!</span>
                        </div>
                        <ul className="list-disc pl-5 text-xxs space-y-0.5 leading-relaxed">
                          {itemsIssues.map((issue, ind) => (
                            <li key={ind}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* ROUTE CREATOR ON-THE-FLY COMPONENT */}
              {showQuickRoute ? (
                <form onSubmit={handleQuickCreateRouteSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 animate-slide-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-xxs font-black text-blue-700 uppercase tracking-widest flex items-center gap-1">
                      🚚 Generar Nueva Unidad de Reparto
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowQuickRoute(false)} 
                      className="text-[10px] text-rose-500 font-black hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Nombre descriptivo de Ruta</label>
                      <input 
                        type="text"
                        placeholder="Ej. Ruta Norte Furgón 1"
                        value={newRouteName}
                        onChange={(e) => setNewRouteName(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Furgón / Conductor</label>
                      <select
                        value={newRouteDriver}
                        onChange={(e) => setNewRouteDriver(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-bold"
                      >
                        <option value="Felipe Sandoval (Camioneta Hino 4T)">Hino 4T - Felipe Sandoval</option>
                        <option value="Roberto Benitez (Furgón Hyundai 2.5T)">Hyundai 2.5T - Roberto Benitez</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-black py-2.5 rounded-xl text-xxs tracking-wider uppercase transition-all"
                  >
                    CONFIRMAR Y CREAR RUTA
                  </button>
                </form>
              ) : null}

              {/* LOGISTICS COMMAND ADMIN STATION ACTIONS */}
              {session.role === 'ADMIN' && (
                <div className="border-t border-slate-150 pt-4.5 space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Panel Admin: Acciones y Dirección de Suministro
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {/* CONFIRMATION WORKFLOWS */}
                    {activeDetailOrder.status === 'PENDING_CONFIRMATION' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (onConfirmOrder) {
                              const deliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                              onConfirmOrder(activeDetailOrder.id, deliveryDate);
                              setSelectedOrder(null);
                            }
                          }}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center justify-center gap-1.5 shadow"
                        >
                          <Check size={14} />
                          <span>CONFIRMAR Y AUTORIZAR DESPACHO</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('¿Anular pedido de venta? El stock ya no será retenido.') && onCancelOrder) {
                              onCancelOrder(activeDetailOrder.id);
                              setSelectedOrder(null);
                            }
                          }}
                          className="px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-150 rounded-xl font-black flex items-center justify-center gap-1"
                        >
                          <X size={14} />
                          <span>ANULAR PEDIDO</span>
                        </button>
                      </>
                    )}

                    {/* TRUCK ASSIGNMENT WORKFLOW */}
                    {activeDetailOrder.status === 'CONFIRMED' && (
                      <div className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800">🚛 Elegir Unidad de Envío y Despacho Fletes:</span>
                          {!showQuickRoute && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewRouteName(`Ruta ${activeDetailOrder.storeZone} - ${new Date().toLocaleDateString()}`);
                                setQuickRouteZone(activeDetailOrder.storeZone);
                                setShowQuickRoute(true);
                              }}
                              className="text-xxs font-black text-blue-600 hover:underline"
                            >
                              + GENERAR NUESTRA NUEVA RUTA
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select
                            value={activeDetailOrder.shippingRouteId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (onAssignOrderToRoute) {
                                onAssignOrderToRoute(activeDetailOrder.id, val ? val : undefined);
                              }
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                          >
                            <option value="">-- Sin asignar / Camioneta libre --</option>
                            {routes.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.driverName.split('(')[0]}) - {r.zone}
                              </option>
                            ))}
                          </select>

                          {activeDetailOrder.shippingRouteId ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeliverOrder) {
                                  onDeliverOrder(activeDetailOrder.id);
                                  setSelectedOrder(null);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>MARCAR COMO ENTREGADO</span>
                            </button>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic flex items-center justify-center font-bold">
                              * Elige una unidad para habilitar entrega
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ALREADY DELIVERED WORKFLOW */}
                    {activeDetailOrder.status === 'DELIVERED' && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-extrabold w-full text-center">
                        ✓ Pedido entregado exitosamente. No se admiten cambios de despacho o ruteo en este estado consolidado final.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowReceiptOrder(activeDetailOrder)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#017E84] hover:bg-[#006064] text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse hover:animate-none"
              >
                <Printer size={14} />
                <span>IMPRIMIR COMPROBANTE / RECIBO</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-4.5 py-2.5 bg-slate-200 hover:bg-slate-300 font-extrabold text-xs text-slate-700 rounded-xl cursor-pointer"
              >
                CERRAR FICHA DETALLADA
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPACT PRINT-READY RECEIPTS MODULE */}
      {showReceiptOrder && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in overflow-y-auto print:p-0 print:bg-white print:inset-auto print:relative">
          
          <style dangerouslySetInnerHTML={{__html: `
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              html, body {
                background: white !important;
                color: black !important;
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 9px !important;
                font-family: 'Courier New', Courier, monospace !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#printable-receipt-card-wrapper) {
                display: none !important;
              }
              #printable-receipt-card-wrapper {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                min-width: 80mm !important;
                height: auto !important;
                overflow: visible !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                padding: 3mm !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div id="printable-receipt-card-wrapper" className="bg-white rounded-2xl w-full max-w-[340px] shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[95vh] print:max-h-full print:shadow-none print:border-none print:rounded-none">
            
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
              <div className="flex items-center gap-1.5">
                <Printer size={16} className="text-[#017E84]" />
                <span className="font-sans font-black text-xs text-slate-800 tracking-tight uppercase">
                  Recibo Térmico (80mm)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptOrder(null)}
                className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 transition-all text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="p-4 overflow-y-auto print:overflow-visible flex-1 space-y-4 text-black text-[9.5px] font-mono select-text print:p-0 print:text-[8px] leading-tight">
              
              {/* Receipt Header Banner */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
                <div className="flex justify-center items-center gap-1">
                  <span className="text-lg font-black text-slate-800 tracking-tighter print:text-black">TOOME</span>
                  <span className="text-[8px] font-black bg-black text-white px-1 py-0.5 rounded uppercase font-sans print:bg-white print:text-black print:border print:border-black">
                    DISTRIBUCIÓN
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase font-sans tracking-wide">
                  Logística Mayorista de Abarrotes
                </p>
                <p className="text-[7.5px] text-slate-400">R.U.C. N° 20601248931 • Av. El Sol 482, Lima</p>
                <p className="text-[8px] font-sans font-bold text-[#017E84] print:text-black">
                  ** TICKET DE ENTREGA **
                </p>
              </div>

              <div className="space-y-1 text-[9px] border-b border-dashed border-black pb-2">
                <div className="font-sans font-black text-[7.5px] text-slate-400 uppercase tracking-wider">DATOS DEL SOCIO / CLIENTE</div>
                
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-slate-800 truncate">
                    ESTABL: <span className="font-mono">{showReceiptOrder.storeName}</span>
                  </div>
                  <div className="truncate">
                    PROPIETARIO: <span className="font-sans text-slate-600">
                      {(() => {
                        const cl = clients.find(c => c.id === showReceiptOrder.storeId);
                        return cl ? cl.ownerName : 'CLIENTE FRECUENTE';
                      })()}
                    </span>
                  </div>
                  <div className="break-words">
                    DIRECCIÓN: <span className="text-slate-650 font-sans">{showReceiptOrder.storeAddress}</span>
                  </div>
                  <div>
                    CELULAR: <span className="text-slate-600 font-sans">
                      {(() => {
                        const cl = clients.find(c => c.id === showReceiptOrder.storeId);
                        return cl ? cl.phone : 'No registrado';
                      })()}
                    </span>
                  </div>
                  <div>
                    DOC IDENTIDAD: <span className="text-slate-600">
                      {(() => {
                        const cl = clients.find(c => c.id === showReceiptOrder.storeId);
                        return cl ? `${cl.docType} ${cl.docNumber}` : 'General';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table Optimized for 80mm width */}
              <div className="space-y-1">
                <div className="font-sans font-black text-[7.5px] text-slate-400 uppercase tracking-wider">DETALLE DE MERCADERÍA</div>
                <table className="w-full text-left border-collapse text-[9.5px] font-mono leading-tight">
                  <thead>
                    <tr className="border-b border-dashed border-black text-[8px] text-slate-500 uppercase">
                      <th className="py-1 text-left w-6/12 font-bold">DESCRIPCIÓN</th>
                      <th className="py-1 text-center w-2/12 font-bold">CANT</th>
                      <th className="py-1 text-right w-2/12 font-bold">P.U.</th>
                      <th className="py-1 text-right w-2/12 font-bold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-200">
                    {showReceiptOrder.items.map((item, index) => (
                      <tr key={index} className="py-1">
                        <td className="py-1 font-bold text-slate-900 leading-tight pr-1">
                          {item.productName}
                        </td>
                        <td className="py-1 text-center font-bold text-slate-700">
                          {item.qty}
                        </td>
                        <td className="py-1 text-right text-slate-600">
                          {item.price.toFixed(1)}
                        </td>
                        <td className="py-1 text-right font-bold text-black">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cost and Balance Summary (Full-Width Ticket style) */}
              <div className="border-t border-dashed border-black pt-2 space-y-1 text-[9.5px]">
                
                <div className="flex justify-between text-slate-500">
                  <span>SUBTOTAL AFECTO (S/):</span>
                  <span>{showReceiptOrder.baseAmount ? showReceiptOrder.baseAmount.toFixed(2) : (showReceiptOrder.total / 1.18).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-slate-500">
                  <span>I.G.V. LIQUIDADO (18%):</span>
                  <span>{showReceiptOrder.igvAmount ? showReceiptOrder.igvAmount.toFixed(2) : (showReceiptOrder.total - (showReceiptOrder.total / 1.18)).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-black font-black text-[10px] border-t border-dashed border-slate-300 pt-1">
                  <span>MONTO TOTAL DE VENTA:</span>
                  <span>S/ {showReceiptOrder.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>ABONO PREVIO REGISTRADO:</span>
                  <span>- S/ {(showReceiptOrder.paidAmount || 0).toFixed(2)}</span>
                </div>

                {/* Net Balance Highlight */}
                <div className="flex justify-between text-rose-700 font-black border-t-2 border-dashed border-black pt-1.5 text-[10.5px] print:text-black">
                  <span>SALDO POR COBRAR (S/):</span>
                  <span className="text-xs">
                    S/ {Math.max(0, showReceiptOrder.total - (showReceiptOrder.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>

                <div className="text-[7.5px] text-slate-500 uppercase tracking-widest text-right">
                  MÉTODO DE PAGO: <strong className="text-black font-black font-sans">{showReceiptOrder.paymentMethod || 'PAGO CONTRAENTREGA'}</strong>
                </div>
              </div>

              {/* Client Acceptance and Driver validation signatures */}
              <div className="pt-4 grid grid-cols-2 gap-x-3 text-center text-[7.5px] font-sans text-slate-400">
                <div className="space-y-1">
                  <div className="border-b border-dashed border-black w-full h-7"></div>
                  <span className="font-bold text-slate-700 uppercase tracking-tight block">Firma Transportista</span>
                  <span>Despacho Toome</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-dashed border-black w-full h-7"></div>
                  <span className="font-bold text-slate-700 uppercase tracking-tight block">Firma Cliente / Socio</span>
                  <span>Recibido Conforme</span>
                </div>
              </div>

              {/* Receipt warning clauses */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-center space-y-0.5 font-sans text-[7px] text-slate-400 uppercase leading-normal">
                <p>Favor verificar mercadería en presencia del conductor.</p>
                <p>No se aceptan reclamos posteriores.</p>
              </div>

              {/* DYNAMIC QR CODE FOR DIGITAL WALLET PAYMENTS */}
              <div className="pt-3 border-t-2 border-dashed border-black text-center space-y-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-200 print:bg-white print:border-none print:p-0">
                <span className="text-[8px] font-sans font-black text-slate-600 block uppercase tracking-wider">
                  ::: ESCANEE AQUÍ PARA PAGAR EN ENTREGA :::
                </span>
                
                {/* Generated QR Code Image targeting the payment to make - using api.qrserver.com */}
                <div className="flex justify-center py-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=125x125&color=017e84&data=${encodeURIComponent(
                      `TOOME ALIMENTOS Y DISTRIBUCION | Pedido: ${showReceiptOrder.id} | Cliente: ${showReceiptOrder.storeName} | Saldo a Cobrar: S/ ${Math.max(0, showReceiptOrder.total - (showReceiptOrder.paidAmount || 0)).toFixed(2)} | Beneficiario RUC: 20601248931`
                    )}`}
                    alt="Código QR de Pago"
                    className="w-28 h-28 border-2 border-dashed border-[#017E84] p-1 bg-white mx-auto print:border-black"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-0.5 text-[8px] font-sans font-medium text-slate-500">
                  <p className="font-bold text-slate-750">MONTO: S/ {Math.max(0, showReceiptOrder.total - (showReceiptOrder.paidAmount || 0)).toFixed(2)}</p>
                  <p className="uppercase text-[7px]">Yape / Plin / Transferencia Directa Interbancaria</p>
                  <p className="font-bold text-[#017E84] print:text-black uppercase text-[7px] tracking-tight">RUC: 20601248931 - Toome S.A.C.</p>
                </div>
              </div>

              {/* Final Greetings message */}
              <div className="pt-2 text-center font-sans space-y-1">
                <div className="text-[8px] text-slate-600 font-black uppercase print:text-black">
                  VENDEDOR: {showReceiptOrder.sellerName}
                </div>
                <div className="text-[8px] text-[#017E84] font-black uppercase tracking-tight print:text-black">
                  ¡Gracias por su preferencia mayorista en TOOME!
                </div>
              </div>

            </div>

            {/* Print action footer controls */}
            <div className="p-3 border-t border-slate-150 flex justify-end gap-2 bg-slate-50 no-print">
              <button
                type="button"
                onClick={() => setShowReceiptOrder(null)}
                className="px-3.5 py-2 hover:bg-slate-200 text-slate-650 text-[10px] font-black rounded-lg transition-all cursor-pointer border border-slate-200 bg-white"
              >
                CERRAR
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#017E84] hover:bg-[#006064] text-white text-[10px] font-black rounded-lg transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} />
                <span>IMPRIMIR EN FISICO</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

