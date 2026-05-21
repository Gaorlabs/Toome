import React, { useState, useMemo } from 'react';
import { 
  Compass, Plus, Truck, User, Calendar, Check, Play, AlertCircle, 
  MapPin, Clipboard, ArrowRight, TrendingUp, Sparkles, Navigation, Map as MapIcon
} from 'lucide-react';
import { DeliveryRoute, Order } from '../types';
import { RoutesMap } from './RoutesMap';

interface RoutesViewProps {
  routes: DeliveryRoute[];
  orders: Order[];
  onCreateRoute: (newRoute: Omit<DeliveryRoute, 'id'>) => void;
  onAssignOrderToRoute: (orderId: string, routeId: string | undefined) => void;
  onCompleteRoute: (routeId: string) => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({
  routes,
  orders,
  onCreateRoute,
  onAssignOrderToRoute,
  onCompleteRoute
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [routeName, setRouteName] = useState('');
  const [routeZone, setRouteZone] = useState('Zona Norte');
  const [driverName, setDriverName] = useState('Felipe Sandoval (Camioneta Hino 4T)');
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  const zones = ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'];
  
  const drivers = [
    'Felipe Sandoval (Camioneta Hino 4T)',
    'Raúl Belaúnde (Furgón Hyundai 3T)',
    'Héctor Palacios (Furgón JAC 2.5T)',
    'Wilmer Chira (Moto-Tránsito Delivery)',
  ];

  // Confirmed orders not yet assigned to any route, matching the zone constraint
  const getUnassignedOrdersForRoute = (route: DeliveryRoute) => {
    return orders.filter(o => 
      o.status === 'CONFIRMED' && 
      !o.shippingRouteId && 
      o.storeZone === route.zone
    );
  };

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) {
      alert("Por favor ingrese el nombre de la ruta.");
      return;
    }

    onCreateRoute({
      name: routeName,
      zone: routeZone,
      scheduledDate,
      driverName,
      status: 'DRAFT',
      orderIds: []
    });

    setRouteName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <Compass size={13} /> DESPACHO MULTI-ZONE
          </h5>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Planificación de Rutas por Zona
          </h1>
          <p className="text-xs text-slate-400">Consolida despachos generando rutas vehiculares según el distrito del cliente para abaratar costos logísticos.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#017E84] hover:bg-[#006064] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <Plus size={15} />
          <span>Nueva Ruta por Zona</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Trigger Add Route Form Card */}
          {showAddForm && (
            <form onSubmit={handleCreateSubmit} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-spreadsheet space-y-5 animate-slide-up w-full">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500 animate-pulse" />
                Configurador de Ruta de Despacho
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xxs font-bold text-slate-400 uppercase">Nombre descriptivo de ruta</label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Ej. Ruta Norte Intermedia"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50 focus:bg-white font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-bold text-slate-400 uppercase">Zona de Cobertura</label>
                  <select
                    value={routeZone}
                    onChange={(e) => setRouteZone(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium text-slate-800"
                  >
                    {zones.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-bold text-slate-400 uppercase">Chofer & Camioneta de Reparto</label>
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium text-slate-800"
                  >
                    {drivers.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-bold text-slate-400 uppercase">Fecha Programada de Envío</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white font-medium text-slate-800"
                  />
                </div>

              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#017E84] text-white hover:bg-[#006064] font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Guardar Ruta
                </button>
              </div>
            </form>
          )}

          {/* Interactive Routing Map */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-spreadsheet overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <MapIcon size={18} className="text-[#017E84]" /> 
                Vista de Mapa Satelital
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {selectedRouteId ? `Explorando Ruta: ${selectedRouteId}` : 'Vista Global Activa'}
              </p>
            </div>
            <div className="p-2">
              <RoutesMap 
                routes={routes} 
                orders={orders} 
                onAssignOrderToRoute={onAssignOrderToRoute} 
                selectedRouteId={selectedRouteId}
              />
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div> Ruta Seleccionada</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div> Otras Rutas</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div> Por Asignar</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div> Entregados</div>
            </div>
          </div>
        </div>

        {/* Display Routes List Drawer Space */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {routes.map((route) => {
            const routeOrders = orders.filter(o => route.orderIds.includes(o.id));
            const unassignedInThisZone = getUnassignedOrdersForRoute(route);
            const totalVal = routeOrders.reduce((sum, o) => sum + o.total, 0);
            
            const isSelected = selectedRouteId === route.id;

            return (
              <div 
                key={route.id} 
                className={`bg-white rounded-3xl border transition-all shadow-sm overflow-hidden flex flex-col justify-between cursor-pointer hover:border-[#017E84]/50 ${isSelected ? 'border-[#017E84] ring-2 ring-[#017E84]/20' : 'border-slate-100'}`}
                onClick={() => setSelectedRouteId(isSelected ? null : route.id)}
              >
                {/* Route Card Header */}
                <div className={`p-4 border-b flex gap-4 justify-between items-start ${isSelected ? 'bg-[#017E84]/5 border-[#017E84]/20' : 'bg-slate-50/50 border-slate-50'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#017E84]/10 text-[#017E84] font-extrabold text-[9px] rounded uppercase">
                      {route.zone}
                    </span>
                    <span className="text-xxs font-mono text-slate-400 font-bold">{route.id}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base leading-tight">{route.name}</h3>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold border ${
                  route.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                }`}>
                  {route.status === 'COMPLETED' ? 'COMPLETADO' : 'BORRADOR / RECORRIENDO'}
                </span>
              </div>

              {/* Route Attributes (Driver, vehicle, scheduled date) */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Chofer Autorizado</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1 leading-none">{route.driverName}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Día Programación</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1 leading-none">{route.scheduledDate}</span>
                  </div>
                </div>

                {/* Orders assigned currently */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    <span>Paradas / Paraderos en la ruta ({routeOrders.length})</span>
                    <span className="text-slate-500 font-bold">Total Carga: S/ {totalVal.toFixed(2)}</span>
                  </div>

                  {routeOrders.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                      {routeOrders.map((o, index) => (
                        <div key={o.id} className="p-3 bg-white border border-slate-150/60 rounded-xl flex justify-between items-center text-xs group">
                          <div className="flex gap-2.5 items-center">
                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 truncate max-w-[150px]">{o.storeName}</p>
                              <p className="text-xxs text-slate-400">{o.storeAddress}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <span className="font-extrabold text-slate-800 text-xxs">S/ {o.total.toFixed(2)}</span>
                            {route.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => onAssignOrderToRoute(o.id, undefined)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded-md"
                                title="Quitar de esta ruta"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Ruta vacía. Añada pedidos para este chofer abajo.
                    </div>
                  )}
                </div>

                {/* Quick Order Assign section (Only if route is still running/draft) */}
                {route.status !== 'COMPLETED' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pedidos de la zona por incorporar:</span>
                    {unassignedInThisZone.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                        {unassignedInThisZone.map(o => (
                          <div key={o.id} className="p-2.5 bg-yellow-50/50 border border-yellow-100 rounded-lg flex justify-between items-center text-xs">
                            <div className="truncate max-w-[180px]">
                              <p className="font-bold text-slate-800 truncate">{o.storeName}</p>
                              <p className="text-xxs text-slate-400 truncate">{o.storeAddress}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onAssignOrderToRoute(o.id, route.id)}
                              className="bg-[#017E84] hover:bg-[#006064] text-white font-extrabold px-3 py-1 text-xxs rounded-lg flex items-center gap-1 shadow-sm shrink-0"
                            >
                              Arrimar
                              <ArrowRight size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xxs italic text-slate-400 p-2 bg-slate-50 rounded border border-slate-100">
                        No hay más pedidos confirmados listos para reparto en la {route.zone}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom control to close the route */}
              {route.status !== 'COMPLETED' && routeOrders.length > 0 && (
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xxs font-medium text-slate-500 flex items-center gap-1">
                    <Navigation size={12} className="text-[#017E84]" />
                    Coordinado e Incorporado
                  </span>

                  <button
                    type="button"
                    onClick={() => onCompleteRoute(route.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>Despachar & Completar Ruta</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {routes.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-white flex flex-col items-center justify-center gap-1.5">
            <Compass size={32} className="text-slate-300" />
            <h3 className="text-sm font-extrabold text-slate-700">No hay rutas creadas</h3>
            <p className="text-xs text-slate-400">Genere su primera ruta de despacho para empezar.</p>
          </div>
        )}
        </div>
      </div>

    </div>
  );
};
