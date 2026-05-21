import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RechartPie, Pie
} from 'recharts';
import { 
  ClipboardList, CheckCircle2, TrendingUp, HelpCircle, 
  AlertTriangle, Truck, CircleDollarSign, Compass, Store, User,
  X, Eye, Search, MapPin, Plus, Check, Calendar, ArrowRight, ChevronRight
} from 'lucide-react';
import { Order, Product, ClientStore, DeliveryRoute } from '../types';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  clients: ClientStore[];
  routes: DeliveryRoute[];
  session: { role: 'ADMIN' | 'SELLER'; name: string; sellerId?: string };
  onNavigate: any;
  onConfirmOrder?: (orderId: string, scheduledDate: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onAssignOrderToRoute?: (orderId: string, routeId: string | undefined) => void;
  onCreateRoute?: (newRoute: Omit<DeliveryRoute, 'id'>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  orders, 
  products, 
  clients, 
  routes,
  session, 
  onNavigate,
  onConfirmOrder,
  onCancelOrder,
  onAssignOrderToRoute,
  onCreateRoute
}) => {
  const isAdmin = session.role === 'ADMIN';

  // Current calendar month (e.g. "2026-05")
  const currentMonthStr = React.useMemo(() => {
    return new Date().toISOString().substring(0, 7);
  }, []);

  // Helper to convert dynamic calendar months to written Spanish
  const getSpanishMonthName = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return 'Mes Actual';
    const [year, month] = monthStr.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${months[monthIndex] || 'Mes'} ${year}`;
  };

  // State for Goal (Meta de Ventas)
  const defaultGoal = isAdmin ? 50000 : 8000;
  const [salesGoal, setSalesGoal] = React.useState<number>(() => {
    const saved = localStorage.getItem(`toome_goal_${session.name}`);
    return saved ? parseFloat(saved) : defaultGoal;
  });
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);
  const [tempGoal, setTempGoal] = React.useState(salesGoal.toString());

  // State for order details modal & today's orders search
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [showTodayOrdersModal, setShowTodayOrdersModal] = React.useState(false);
  const [todayOrdersSearch, setTodayOrdersSearch] = React.useState('');

  // States for Admin-exclusive Dispatch & Delivery management
  const [adminFilterMode, setAdminFilterMode] = React.useState<'ZONE' | 'SELLER'>('ZONE');
  const [adminSelectedValue, setAdminSelectedValue] = React.useState<string>('ALL');
  const [adminShippingDates, setAdminShippingDates] = React.useState<Record<string, string>>({});
  const [adminQuickRouteZone, setAdminQuickRouteZone] = React.useState('Zona Norte');
  const [adminQuickRouteDriver, setAdminQuickRouteDriver] = React.useState('Felipe Sandoval (Camioneta Hino 4T)');
  const [showQuickRouteForm, setShowQuickRouteForm] = React.useState(false);
  const [quickRouteNameInput, setQuickRouteNameInput] = React.useState('');

  const availableZones = React.useMemo(() => {
    const zs = new Set(orders.map(o => o.storeZone));
    ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'].forEach(z => zs.add(z));
    return Array.from(zs).filter(Boolean);
  }, [orders]);

  const availableSellers = React.useMemo(() => {
    return Array.from(new Set(orders.map(o => o.sellerName))).filter(Boolean);
  }, [orders]);

  // Track state change of Filter Mode to reset the selected value
  React.useEffect(() => {
    setAdminSelectedValue('ALL');
  }, [adminFilterMode]);

  // Calculations for Admin Order Control
  const checkStockAvailability = React.useCallback((order: Order) => {
    const issues: string[] = [];
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId || p.sku === item.productSku);
      if (prod) {
        if (prod.stock < item.qty) {
          issues.push(`${prod.name}: requerido ${item.qty}, stock actual ${prod.stock}`);
        }
      } else {
        issues.push(`Producto de ID ${item.productId} no encontrado en catálogo`);
      }
    });
    return issues;
  }, [products]);

  const adminUnconfirmedCount = React.useMemo(() => {
    return orders.filter(o => o.status === 'PENDING_CONFIRMATION').length;
  }, [orders]);

  const adminUnassignedCount = React.useMemo(() => {
    return orders.filter(o => o.status === 'CONFIRMED' && !o.shippingRouteId).length;
  }, [orders]);

  const adminFilteredOrders = React.useMemo(() => {
    // Only pending confirmation or confirmed orders
    let list = orders.filter(o => o.status === 'PENDING_CONFIRMATION' || o.status === 'CONFIRMED');
    
    // Filter by active selection (seller or zone)
    if (adminSelectedValue !== 'ALL') {
      if (adminFilterMode === 'ZONE') {
        list = list.filter(o => o.storeZone === adminSelectedValue);
      } else if (adminFilterMode === 'SELLER') {
        list = list.filter(o => o.sellerName === adminSelectedValue);
      }
    }
    return list;
  }, [orders, adminFilterMode, adminSelectedValue]);

  // Calculate generic stats
  // If Seller, filter orders to show only theirs of the current month
  const visibleOrders = React.useMemo(() => {
    if (isAdmin) {
      return orders;
    }
    return orders.filter(o => {
      const isSellerOrder = o.sellerName === session.name || o.sellerId === session.sellerId || o.sellerId === 'S1';
      const isCurrentMonth = o.date && o.date.startsWith(currentMonthStr);
      return isSellerOrder && isCurrentMonth;
    });
  }, [orders, session.name, session.sellerId, isAdmin, currentMonthStr]);

  // Filter orders in the Today's Orders list modal
  const filteredModalOrders = React.useMemo(() => {
    if (!todayOrdersSearch.trim()) return visibleOrders;
    const query = todayOrdersSearch.toLowerCase();
    return visibleOrders.filter(o => 
      o.id.toLowerCase().includes(query) ||
      o.storeName.toLowerCase().includes(query) ||
      o.storeZone.toLowerCase().includes(query) ||
      o.items.some(it => it.productName.toLowerCase().includes(query))
    );
  }, [visibleOrders, todayOrdersSearch]);

  const totalOrdersCount = visibleOrders.length;
  const pendingConfirmationCount = visibleOrders.filter(o => o.status === 'PENDING_CONFIRMATION').length;
  const confirmedCount = visibleOrders.filter(o => o.status === 'CONFIRMED').length;
  const deliveredCount = visibleOrders.filter(o => o.status === 'DELIVERED').length;

  const totalSalesAmount = visibleOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const totalPaidAmount = visibleOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.paidAmount, 0);

  const totalOutstandingAmount = visibleOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total - o.paidAmount), 0);

  // Stock Alerts
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Sales by Zone calculation
  const zoneSalesMap: Record<string, number> = {};
  clients.forEach(c => {
    zoneSalesMap[c.zone] = 0;
  });
  // fallback zones
  ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'].forEach(z => {
    if (zoneSalesMap[z] === undefined) zoneSalesMap[z] = 0;
  });

  visibleOrders.forEach(o => {
    if (o.status !== 'CANCELLED') {
      const z = o.storeZone || 'Zona Especial';
      zoneSalesMap[z] = (zoneSalesMap[z] || 0) + o.total;
    }
  });

  const salesByZoneData = Object.keys(zoneSalesMap).map(zone => ({
    name: zone,
    total: Math.round(zoneSalesMap[zone] * 100) / 100
  })).filter(item => item.total > 0 || clients.some(c => c.zone === item.name));

  // Chart colors
  const COLORS = ['#017E84', '#714B67', '#0EA5E9', '#F59E0B', '#10B981', '#6366F1'];

  // Metrics for goal tracking
  const progressPercent = salesGoal > 0 ? Math.min(100, (totalSalesAmount / salesGoal) * 100) : 0;
  const remainingToGoal = Math.max(0, salesGoal - totalSalesAmount);

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-fade-in font-sans">
      
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-[#017E84] to-[#0A4E52] p-6 md:p-8 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6">
          <TrendingUp size={240} />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-200">PANEL DE CONTROL GENERAL</span>
          <h1 className="text-2xl md:text-3xl.5 font-extrabold tracking-tight">
            Hola, {session.name}
          </h1>
          <p className="text-sm text-teal-100 max-w-xl font-light">
            {isAdmin 
              ? 'Bienvenido al gestor central de operaciones de Toome. Filtre rutas de envío, apruebe pedidos de preventistas y realice cuadrantes de recaudación.' 
              : 'Bienvenido a tu panel de preventa. Aquí puedes realizar seguimiento de tus pedidos registrados en el mes actual y ver el progreso para cumplir su meta.'}
          </p>
        </div>
      </div>

      {/* SECCIÓN ADMINISTRADOR DESDE LOGIN: CONFIGURACIÓN MÓDULO RÁPIDO DE CONTROL Y DESPACHOS */}
      {isAdmin && (
        <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-teal-500/25 shadow-spreadsheet space-y-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1 font-sans">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#017E84] tracking-widest uppercase">
                <Compass size={14} className="animate-spin-slow" /> CONTROL LOGÍSTICO CENTRAL DE PEDIDOS
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                Gestión Directa de Pedidos del Día
              </h2>
              <p className="text-xs text-slate-400">
                Filtre pedidos registrados, confirme mercadería e incorpórelos a rutas vehiculares de entrega final de inmediato.
              </p>
            </div>

            {/* Quick Action to Trigger Route Form */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickRouteForm(!showQuickRouteForm)}
                className="p-2 px-3.5 bg-teal-50 hover:bg-[#017E84]/15 text-[#017E84] text-xs font-black rounded-xl border border-teal-100 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>{showQuickRouteForm ? 'Cerrar Formulador' : 'Generar Nueva Ruta'}</span>
              </button>
            </div>
          </div>

          {/* Quick Route Generator Card Box */}
          {showQuickRouteForm && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 max-w-2xl animate-slide-up space-y-4">
              <h4 className="text-xs font-extrabold text-slate-705 uppercase tracking-widest flex items-center gap-1.5">
                <Truck size={14} className="text-teal-600" />
                Nueva Ruta / Camión de Reparto
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Zona Cobertura</label>
                  <select
                    value={adminQuickRouteZone}
                    onChange={(e) => setAdminQuickRouteZone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {availableZones.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Chofer & Furgón</label>
                  <select
                    value={adminQuickRouteDriver}
                    onChange={(e) => setAdminQuickRouteDriver(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {[
                      'Felipe Sandoval (Camioneta Hino 4T)',
                      'Raúl Belaúnde (Furgón Hyundai 3T)',
                      'Héctor Palacios (Furgón JAC 2.5T)',
                      'Wilmer Chira (Moto-Tránsito Delivery)',
                    ].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Ruta</label>
                  <input
                    type="text"
                    value={quickRouteNameInput}
                    onChange={(e) => setQuickRouteNameInput(e.target.value)}
                    placeholder="Ej. Ruta Centro Nocturno"
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setShowQuickRouteForm(false)}
                  className="px-3 py-1 text-xs border border-slate-200 hover:bg-slate-150 rounded-lg font-bold text-slate-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const name = quickRouteNameInput.trim() || `Ruta ${adminQuickRouteZone} - ${new Date().toLocaleDateString('es-PE')}`;
                    onCreateRoute?.({
                      name,
                      zone: adminQuickRouteZone,
                      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                      driverName: adminQuickRouteDriver,
                      status: 'DRAFT',
                      orderIds: []
                    });
                    setQuickRouteNameInput('');
                    setShowQuickRouteForm(false);
                  }}
                  className="px-4 py-1.5 bg-[#017E84] hover:bg-[#006064] text-white rounded-lg font-black uppercase tracking-wider cursor-pointer"
                >
                  Crear Ruta
                </button>
              </div>
            </div>
          )}

          {/* Controls Segment View Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xxs font-black text-slate-400 uppercase tracking-widest">Agrupar / Filtrar por:</span>
              <div className="flex p-0.5 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAdminFilterMode('ZONE')}
                  className={`px-3 py-1 text-xxs font-extrabold rounded-md transition-all cursor-pointer ${
                    adminFilterMode === 'ZONE' 
                      ? 'bg-white text-slate-850 shadow-sm' 
                      : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  Zona / Sector
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilterMode('SELLER')}
                  className={`px-3 py-1 text-xxs font-extrabold rounded-md transition-all cursor-pointer ${
                    adminFilterMode === 'SELLER' 
                      ? 'bg-white text-slate-850 shadow-sm' 
                      : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  Vendedor / Preventista
                </button>
              </div>
            </div>

            {/* Filter Values Selection Drops */}
            <div className="flex-1 max-w-sm">
              {adminFilterMode === 'ZONE' ? (
                <select
                  value={adminSelectedValue}
                  onChange={(e) => setAdminSelectedValue(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#017E84] font-black text-slate-700"
                >
                  <option value="ALL">🌍 Todas las Zonas Comerciales ({availableZones.length})</option>
                  {availableZones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={adminSelectedValue}
                  onChange={(e) => setAdminSelectedValue(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#017E84] font-black text-slate-700"
                >
                  <option value="ALL">👤 Todos los Preventistas Preventa ({availableSellers.length})</option>
                  {availableSellers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Quick Alert KPI counts */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs space-y-0.5">
              <span className="text-[9px] uppercase font-black tracking-widest text-amber-700 block">Pedidos por Confirmar</span>
              <strong className="text-base font-mono text-amber-800 font-extrabold">{adminUnconfirmedCount} hoy</strong>
            </div>

            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs space-y-0.5">
              <span className="text-[9px] uppercase font-black tracking-widest text-indigo-700 block">Confirmados Sin Ruta</span>
              <strong className="text-base font-mono text-indigo-800 font-extrabold">{adminUnassignedCount} listos</strong>
            </div>

            <div className="col-span-2 md:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block font-bold">Filtro activo</span>
                <strong className="text-[11px] font-black text-slate-700 truncate block mt-0.5 max-w-[120px]">
                  {adminSelectedValue === 'ALL' ? 'Todos' : adminSelectedValue}
                </strong>
              </div>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded-full text-[9px]">
                {adminFilteredOrders.length} ped. Match
              </span>
            </div>
          </div>

          {/* Orders grid list to take action */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {adminFilteredOrders.length > 0 ? (
              adminFilteredOrders.map(o => {
                const stockIssues = checkStockAvailability(o);
                const hasCriticalStock = stockIssues.length > 0;
                
                // Active date for confirmation
                const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                const activeShipDate = adminShippingDates[o.id] || tomorrowStr;

                return (
                  <div 
                    key={o.id}
                    className="p-4 bg-white border border-slate-150 rounded-2xl hover:border-teal-400 transition-all shadow-sm space-y-4 relative"
                  >
                    {/* Card header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#017E84] font-mono">{o.id}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-black uppercase tracking-wider">
                            {o.storeZone}
                          </span>
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded border uppercase tracking-wider ${
                            o.status === 'PENDING_CONFIRMATION'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse'
                          }`}>
                            {o.status === 'PENDING_CONFIRMATION' ? 'Por Confirmar' : 'Listo p/ Ruta'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-[#017E84] text-xs leading-snug mt-1">{o.storeName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{o.storeAddress}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Preventista</span>
                        <span className="text-xs text-slate-700 font-extrabold">{o.sellerName}</span>
                        <div className="text-xs text-slate-900 font-black mt-1 font-mono">
                          Total: S/ {o.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Middle items glance & stocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Products list detail */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Items del Pedido:
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200/50 last:border-0 font-medium">
                              <span className="text-slate-600 truncate max-w-[170px] text-xxs">
                                {it.qty}x {it.productName}
                              </span>
                              <span className="text-slate-500 font-bold shrink-0 text-[10px] pl-2 font-mono">
                                S/ {it.total.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {o.notes && (
                          <p className="text-xxs italic text-yellow-800 bg-yellow-50 p-1.5 rounded mt-1 border border-yellow-100">
                            📝 Nota: {o.notes}
                          </p>
                        )}
                      </div>

                      {/* Execution Steps */}
                      <div className="space-y-3 flex flex-col justify-between">
                        {/* Validation Alert */}
                        {o.status === 'PENDING_CONFIRMATION' ? (
                          <div className="space-y-2">
                            {hasCriticalStock ? (
                              <div className="p-2 bg-rose-50 border border-rose-150 rounded-xl space-y-0.5">
                                <p className="text-[9px] font-black text-rose-700 flex items-center gap-1">
                                  <AlertTriangle size={11} /> STOCK BAJO EN KARDEX COMPARTIDO
                                </p>
                                {stockIssues.slice(0, 1).map((err, i) => (
                                  <p key={i} className="text-[9px] text-rose-500 leading-tight pl-1">&bull; {err}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] text-[#017E84] font-black flex items-center gap-1 bg-teal-50 p-1.5 rounded-lg border border-teal-100">
                                <Check size={11} /> Stock de almacén completo. Listo para despacho.
                              </p>
                            )}

                            {/* Confirm widget */}
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 p-1 rounded-xl">
                                <Calendar size={12} className="text-slate-400" />
                                <input
                                  type="date"
                                  value={activeShipDate}
                                  onChange={(e) => {
                                    setAdminShippingDates({
                                      ...adminShippingDates,
                                      [o.id]: e.target.value
                                    });
                                  }}
                                  className="border-0 bg-transparent text-xxs font-black text-slate-800 focus:outline-none w-full"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onConfirmOrder?.(o.id, activeShipDate);
                                }}
                                className="p-2 bg-[#017E84] hover:bg-[#006064] text-white hover:shadow-md rounded-xl text-[10px] font-black uppercase shrink-0 px-3 cursor-pointer transition-all flex items-center gap-1"
                              >
                                <Check size={11} />
                                <span>Confirmar</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Order has been CONFIRMED, now let's choose Route
                          <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 space-y-1.5 text-xs flex flex-col justify-between h-full">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[9px] text-emerald-800 font-extrabold block uppercase tracking-wider">
                                🚚 Asignar Camioneta / Ruta
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-teal-800 font-bold rounded">
                                Confirmado
                              </span>
                            </div>

                            {/* Dropdown element to pick route */}
                            <div className="bg-white border border-teal-200 p-1 rounded-xl">
                              <select
                                value={o.shippingRouteId || ""}
                                onChange={(e) => {
                                  const routeId = e.target.value || undefined;
                                  onAssignOrderToRoute?.(o.id, routeId);
                                }}
                                className="w-full text-xxs bg-transparent font-extrabold text-slate-700 focus:outline-none border-0 p-0.5 pr-4 cursor-pointer"
                              >
                                <option value="">⚠️ Elegir Ruta de Distribución...</option>
                                {routes
                                  .filter(r => r.status !== 'COMPLETED')
                                  .map(r => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} - ({r.zone}) - {r.driverName}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            {o.shippingRouteId && (
                              <div className="flex justify-between items-center bg-teal-800 text-white p-1 px-2 rounded-lg text-[9px] animate-fade-in font-bold">
                                <span className="truncate">📍 Ruta: {routes.find(r => r.id === o.shippingRouteId)?.name || 'Asignada'}</span>
                                <button
                                  type="button"
                                  onClick={() => onAssignOrderToRoute?.(o.id, undefined)}
                                  className="text-white hover:text-red-300 font-bold font-mono pl-1 text-[8px] underline"
                                  title="Quitar asignación"
                                >
                                  Quitar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1">
                <CheckCircle2 size={24} className="text-[#017E84]" />
                <h4 className="text-xxs font-black text-slate-700 uppercase tracking-widest mt-1">¡Operación al Día!</h4>
                <p className="text-xxs text-slate-400">
                  Ningún pedido por procesar coincide con los filtros aplicados en este momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* METAS Y PROGRESO DE VENTAS */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-spreadsheet space-y-4 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#017E84] flex items-center gap-2">
              <TrendingUp size={20} />
              {isAdmin ? 'Progreso de Ventas Claves Mensual' : 'Mi Meta de Ventas del Mes'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rendimiento y avance registrado de ventas para el mes de <span className="font-extrabold text-teal-700">{getSpanishMonthName(currentMonthStr)}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[10px] text-slate-450 uppercase font-black block tracking-wider">OBJETIVO / META COMERCIAL</span>
              {isEditingGoal ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-bold text-slate-500">S/</span>
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-24 p-1 px-2 text-xs font-black border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-[#017E84] bg-slate-50"
                    min="1"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const limit = parseFloat(tempGoal);
                      if (!isNaN(limit) && limit > 0) {
                        setSalesGoal(limit);
                        localStorage.setItem(`toome_goal_${session.name}`, limit.toString());
                        setIsEditingGoal(false);
                      }
                    }}
                    className="p-1 px-2.5 bg-[#017E84] hover:bg-[#006064] text-white rounded-lg text-xxs font-black uppercase transition-all cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="text-xxs font-bold text-rose-500 hover:underline"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                  <span className="text-sm font-black text-slate-700">S/ {salesGoal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempGoal(salesGoal.toString());
                      setIsEditingGoal(true);
                    }}
                    className="text-[10px] text-teal-600 hover:text-teal-850 font-black underline cursor-pointer"
                  >
                    (AJUSTAR)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goal Indicator Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1.5">
          {/* Progress bar container */}
          <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">CUMPLIMIENTO DE COMPROMISO DE VALOR</span>
              <span className="font-black text-teal-700 text-xs bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">{progressPercent.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-3 relative overflow-hidden shadow-inner flex items-center">
              <div 
                className="bg-gradient-to-r from-teal-400 via-[#017E84] to-emerald-500 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2" 
                style={{ width: `${progressPercent}%` }}
              >
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
              <span>Venta en el Mes: <strong className="text-slate-800 font-black">S/ {totalSalesAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></span>
              {remainingToGoal > 0 ? (
                <span>Faltan <strong className="text-rose-600 font-black">S/ {remainingToGoal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> para llegar</span>
              ) : (
                <span className="text-emerald-700 font-black flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 self-start sm:self-auto text-xxs">🎉 ¡Felicitaciones! Meta mensual lograda</span>
              )}
            </div>
          </div>

          {/* Indicator text */}
          <div className="bg-[#017E84]/5 border border-teal-100 p-4 rounded-xl flex flex-col justify-center text-xs space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#017E84]">DIAGNÓSTICO COMERCIAL</span>
            <p className="font-bold text-slate-700 leading-relaxed">
              {progressPercent < 35 ? (
                'Iniciando actividades. Proyecte visitas diarias constantes para concretar pedidos adicionales de alta rotación.'
              ) : progressPercent < 75 ? (
                '¡Un ritmo constante y seguro! Siga visitando y validando deudas con cobros a cuenta para elevar efectividad.'
              ) : progressPercent < 100 ? (
                '¡Excelente preventa! Está a punto de conseguir su meta establecida. Mantenga el enfoque en esta recta final.'
              ) : (
                '¡Rendimiento excepcional! Meta completamente superada. Siga expandiendo el volumen de pedidos este mes.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Section - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* KPI 1: Total Orders */}
        <div 
          onClick={() => setShowTodayOrdersModal(true)}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet hover:border-teal-400 hover:ring-4 hover:ring-teal-500/5 transition-all flex flex-col justify-between h-32 cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pedidos de Hoy</p>
              <h3 className="text-2xl.5 font-extrabold text-[#017E84] group-hover:scale-105 transition-transform origin-left">{totalOrdersCount}</h3>
            </div>
            <div className="p-2.5 bg-teal-50 rounded-xl text-[#017E84] group-hover:bg-[#017E84] group-hover:text-white transition-all">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="text-xs text-slate-500 font-bold flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>{pendingConfirmationCount} por confirmar</span>
            </div>
            <span className="text-[10.5px] text-teal-600 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">Ver lista &rarr;</span>
          </div>
        </div>

        {/* KPI 2: Total Taken Sales Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet hover:shadow-md transition-shadow flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Venta Total Tomada</p>
              <h3 className="text-2xl.5 font-extrabold text-slate-800">S/ {totalSalesAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
              <CircleDollarSign size={18} />
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Total neto prevenido en tiendas</span>
          </div>
        </div>

        {/* KPI 3: Total Collected Payment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet hover:shadow-md transition-shadow flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cobrado / Recaudado</p>
              <h3 className="text-2xl.5 font-extrabold text-emerald-600">S/ {totalPaidAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-700 font-bold">
              {totalSalesAmount > 0 ? Math.round((totalPaidAmount / totalSalesAmount) * 100) : 0}% de efectividad cobros
            </span>
          </div>
        </div>

        {/* KPI 4: Pending Shipping or At Debt Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet hover:shadow-md transition-shadow flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldos por Cobrar</p>
              <h3 className="text-2xl.5 font-extrabold text-rose-500">S/ {totalOutstandingAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Cartera pendiente de clientes</span>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        
        {/* Sales by Zone Chart */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-spreadsheet lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Ventas Registradas por Zona Comercial</h3>
                <p className="text-xs text-slate-400">Total acumulado de pedidos por punto de venta</p>
              </div>
              <div className="p-1 px-2.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                Soles (S/)
              </div>
            </div>

            <div className="h-72 w-full">
              {salesByZoneData.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByZoneData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {salesByZoneData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
                  <Compass size={40} className="text-slate-300 mb-2 animate-spin-slow" />
                  <p className="text-sm font-semibold text-slate-400">Aún no hay pedidos subidos hoy en ninguna zona.</p>
                  <button 
                    onClick={() => onNavigate('SELL_FIELD')}
                    className="mt-3 text-xs text-[#017E84] font-bold hover:underline"
                  >
                    Ir a campo y simular pedido &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Operations panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-spreadsheet flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Panel de Alertas Rápidas</h3>
            <p className="text-xs text-slate-400 mb-4">Stock crítico e indicadores logísticos</p>

            <div className="space-y-4">
              {/* Dispatch Progress indicator */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck size={15} className="text-[#017E84]" />
                    Despachos Realizados
                  </span>
                  <span className="font-extrabold text-slate-900">{deliveredCount} / {totalOrdersCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-[#017E84] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${totalOrdersCount > 0 ? (deliveredCount / totalOrdersCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Stock Warning Box */}
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Productos con Stock Crítico</span>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-rose-50/60 rounded-lg border border-rose-100">
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-semibold">{p.stock} {p.unit}</span>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[9px]">CRÍTICO</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-100">
                    ✅ Todos los productos tienen stock saludable para despacho.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 flex gap-2">
            {isAdmin ? (
              <button 
                onClick={() => onNavigate('ORDERS_CONFIRM')}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-3 rounded-xl text-center transition-all"
              >
                Confirmar Pedidos
              </button>
            ) : null}
            <button 
              onClick={() => onNavigate('SELL_FIELD')}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-[#017E84] hover:from-emerald-600 hover:to-[#004d52] text-white text-xs font-black py-3 rounded-xl text-center shadow-md shadow-emerald-500/20 uppercase tracking-widest transition-all duration-150 hover:shadow-lg active:scale-95 animate-pulse"
            >
              🚀 NUEVO PEDIDO
            </button>
          </div>
        </div>

      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-spreadsheet p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <ClipboardList size={20} className="text-[#017E84]" />
              Pedidos Recientes de Preventa
            </h3>
            <p className="text-xs text-slate-400">Últimos pedidos tomados por los vendedores en tiendas</p>
          </div>
          <button 
            onClick={() => onNavigate(isAdmin ? 'ORDERS_CONFIRM' : 'SELL_FIELD')}
            className="text-xs text-[#017E84] font-bold hover:underline self-start sm:self-center"
          >
            {isAdmin ? 'Ver Gestión de Despachos' : 'Tomar nuevo pedido'} &rarr;
          </button>
        </div>

        {visibleOrders.length > 0 ? (
          <div className="overflow-x-auto relative animate-fade-in">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Pedido ID</th>
                  <th className="py-3 px-4">Cliente / Tienda</th>
                  <th className="py-3 px-4">Zona</th>
                  <th className="py-3 px-4">Preventista</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado Pedido</th>
                  <th className="py-3 px-4 text-center">Cobro</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleOrders.slice(-5).reverse().map((o) => (
                  <tr 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-teal-50/15 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#017E84] text-xs">{o.id}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-extrabold text-slate-800 leading-snug">{o.storeName}</p>
                        <p className="text-xxs text-slate-400 mt-0.5 truncate max-w-[180px]">{o.storeAddress}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase tracking-wide">
                        {o.storeZone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">{o.sellerName}</td>
                    <td className="py-3.5 px-4 font-black text-right text-slate-800">
                      S/ {o.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        o.status === 'PENDING_CONFIRMATION' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : o.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : o.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {o.status === 'PENDING_CONFIRMATION' && 'Por Confirmar'}
                        {o.status === 'CONFIRMED' && 'Confirmado / Ruta'}
                        {o.status === 'DELIVERED' && 'Enviado'}
                        {o.status === 'CANCELLED' && 'Cancelado'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        o.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : o.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {o.paymentStatus === 'PAID' ? 'Total' : o.paymentStatus === 'PARTIALLY_PAID' ? 'A Cuenta' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        className="inline-flex items-center gap-1 p-1 px-2.5 bg-slate-100 hover:bg-[#017E84] text-slate-600 hover:text-white rounded-lg font-black text-xxs transition-all uppercase tracking-wide shadow-sm"
                      >
                        <Eye size={12} />
                        DETALLE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 italic font-medium">
             No hay pedidos registrados hoy para visualizar.
          </div>
        )}
      </div>

      {/* TODAY'S ORDERS LIST MODAL */}
      {showTodayOrdersModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-150/80 overflow-hidden transform transition-all">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-teal-50 text-[#017E84] rounded-lg flex items-center justify-center">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base uppercase tracking-wider">
                    Pedidos Registrados Hoy
                  </h3>
                  <p className="text-xxs text-slate-450 uppercase tracking-widest font-black">
                    Vendedor: {session.name} • {visibleOrders.length} en total
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowTodayOrdersModal(false)}
                className="p-1.5 px-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 hover:text-slate-800 transition-all font-bold text-[10px] flex items-center gap-1 uppercase"
              >
                <X size={13} />
                <span>CERRAR</span>
              </button>
            </div>

            {/* In-modal Search Input */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, tienda, zona o artículo..."
                  value={todayOrdersSearch}
                  onChange={(e) => setTodayOrdersSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#017E84] font-bold text-slate-800"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh] no-scrollbar">
              {filteredModalOrders.length > 0 ? (
                filteredModalOrders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedOrder(o);
                    }}
                    className="p-3.5 bg-white hover:bg-teal-50/10 border border-slate-150 hover:border-teal-400 rounded-xl transition-all cursor-pointer flex justify-between items-center group shadow-sm"
                  >
                    <div className="space-y-1 pr-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[#017E84] text-xs">{o.id}</span>
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase leading-none">
                          {o.storeZone}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider leading-none ${
                          o.status === 'PENDING_CONFIRMATION' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : o.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : o.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {o.status === 'PENDING_CONFIRMATION' ? 'Pendiente' : o.status === 'CONFIRMED' ? 'Confirmado' : o.status === 'DELIVERED' ? 'Despachado' : 'Cancelado'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 truncate leading-snug">{o.storeName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{o.storeAddress}</p>
                    </div>

                    <div className="text-right flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-extrabold text-[#017E84] text-xs">S/ {o.total.toFixed(2)}</p>
                        <p className="text-[9px] text-slate-450 font-bold">{o.items.length} prod.</p>
                      </div>
                      <span className="p-1 px-2.5 bg-teal-50 text-[#017E84] rounded-lg font-black text-xxs group-hover:bg-[#017E84] group-hover:text-white transition-all uppercase">
                        Detalles
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic text-xs font-semibold">
                  Ningún pedido registrado coincide hoy.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED ORDER DRILL-DOWN MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-[#017E84] text-white rounded-xl flex items-center justify-center font-black shadow-sm">
                  {selectedOrder.id.substring(selectedOrder.id.length - 3)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                    PEDIDO {selectedOrder.id}
                  </h3>
                  <p className="text-[10px] text-[#017E84] font-black uppercase mt-0.5 tracking-wider">
                    Preventa • {selectedOrder.date}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 font-bold text-xxs uppercase transition-all flex items-center gap-1"
              >
                <X size={12} />
                <span>CERRAR</span>
              </button>
            </div>

            {/* Client Block */}
            <div className="p-4 bg-teal-50/10 border-b border-slate-100 space-y-1.5 pb-3 text-xs">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cliente de Venta:</span>
                  <h4 className="font-extrabold text-[#017E84] text-[13.5px] leading-tight">{selectedOrder.storeName}</h4>
                  <p className="text-xxs text-slate-550 font-semibold flex items-center gap-1.5 mt-1">
                    <MapPin size={11} className="text-[#017E84]" />
                    <span>{selectedOrder.storeAddress}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    Zona Comercial: <span className="text-slate-600 bg-white border border-slate-150 rounded px-1.5 py-0.5 inline-block text-[9px] font-black uppercase tracking-wider">{selectedOrder.storeZone}</span>
                  </p>
                </div>
                <div className="text-right flex flex-col gap-1 items-end shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider leading-none ${
                    selectedOrder.status === 'PENDING_CONFIRMATION' 
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : selectedOrder.status === 'CONFIRMED'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : selectedOrder.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {selectedOrder.status === 'PENDING_CONFIRMATION' && 'Por Confirmar'}
                    {selectedOrder.status === 'CONFIRMED' && 'En Ruta'}
                    {selectedOrder.status === 'DELIVERED' && 'Completado'}
                    {selectedOrder.status === 'CANCELLED' && 'Cancelado'}
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider leading-none ${
                    selectedOrder.paymentStatus === 'PAID'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : selectedOrder.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    Cobro: {selectedOrder.paymentStatus === 'PAID' ? 'Total' : selectedOrder.paymentStatus === 'PARTIALLY_PAID' ? 'A Cuenta' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Items Table grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar max-h-[350px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Artículos Solicitados ({selectedOrder.items.length})</span>
              <div className="space-y-1.5">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-semibold">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-slate-805 font-extrabold block truncate">{item.productName}</p>
                      <p className="text-slate-400 text-xxs block mt-0.5 font-bold">
                        {item.qty} unidades x S/ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right font-black text-slate-800">
                      S/ {item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Summary / Totals */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-500 font-bold">
                <div className="flex justify-between">
                  <span>Subtotal Neto:</span>
                  <span>S/ {(selectedOrder.total / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>S/ {(selectedOrder.total - (selectedOrder.total / 1.18)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-850 font-black text-sm pt-2 border-t border-slate-200">
                  <span>Importe Total:</span>
                  <span className="text-[#017E84] text-base">S/ {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-150 text-[10px] text-amber-800 font-bold">
                  📝 Detalle Despacho: {selectedOrder.notes}
                </div>
              )}

              <div className="flex gap-2 text-[10px] pt-2 border-t border-slate-200">
                <div className="flex-1 p-2 bg-white rounded-lg border border-slate-150 text-slate-500 font-medium">
                  Vendedor: <span className="text-slate-700 font-extrabold block mt-0.5">{selectedOrder.sellerName}</span>
                </div>
                <div className="flex-1 p-2 bg-white rounded-lg border border-slate-150 text-slate-500 font-medium">
                  Fecha Despacho: <span className="text-slate-700 font-extrabold block mt-0.5">{selectedOrder.shippingDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
