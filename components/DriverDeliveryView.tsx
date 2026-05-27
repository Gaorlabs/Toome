import React, { useState } from 'react';
import { DeliveryRoute, Order, UserSession } from '../types';
import { MapPin, Navigation, CheckCircle2, XCircle, Camera, Check, Clock, Truck } from 'lucide-react';

interface DriverDeliveryViewProps {
  routes: DeliveryRoute[];
  orders: Order[];
  session: UserSession;
  onUpdateOrderStatus: (orderId: string, status: 'DELIVERED' | 'FAILED', proofOfDelivery?: string, deliveryNotes?: string) => void;
  onUpdateDriverLocation: (routeId: string, lat: number, lng: number) => void;
}

export const DriverDeliveryView: React.FC<DriverDeliveryViewProps> = ({
  routes,
  orders,
  session,
  onUpdateOrderStatus,
  onUpdateDriverLocation
}) => {
  // Find routes assigned to the current user (if seller/driver) 
  // For admin, we could show all, but let's assume they pick the route.
  const myRoutes = routes.filter(r => r.driverName === session.name || session.role === 'ADMIN');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(myRoutes.length > 0 ? myRoutes[0].id : '');

  const [activeOrderActionId, setActiveOrderActionId] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [podPhotoStatus, setPodPhotoStatus] = useState<boolean>(false);

  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [lastLocationUpdateTime, setLastLocationUpdateTime] = useState<string>('');

  const activeRoute = routes.find(r => r.id === selectedRouteId);
  const activeRouteZone = activeRoute?.zone || 'Zona Centro';

  // Use a Ref to store the callback to avoid re-triggering effects when functions recreate on parent re-renders
  const updateDriverLocationRef = React.useRef(onUpdateDriverLocation);
  React.useEffect(() => {
    updateDriverLocationRef.current = onUpdateDriverLocation;
  }, [onUpdateDriverLocation]);

  // 1. Real HTML5 Geolocation watch position
  React.useEffect(() => {
    let watchId: number | null = null;
    if (gpsActive && selectedRouteId && 'geolocation' in navigator) {
      // Set initial location immediately
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateDriverLocationRef.current(selectedRouteId, latitude, longitude);
          setLastLocationUpdateTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        },
        (error) => console.log('Error showing initial gps', error),
        { enableHighAccuracy: true }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateDriverLocationRef.current(selectedRouteId, latitude, longitude);
          setLastLocationUpdateTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        },
        (error) => {
          console.error("Error watching position", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [gpsActive, selectedRouteId]);

  // 2. Simulating telemetry driving movement along active zone
  React.useEffect(() => {
    let intervalId: any = null;
    if (simulating && selectedRouteId) {
      const zoneCenters: Record<string, { lat: number, lng: number }> = {
        'Zona Norte': { lat: -11.9300, lng: -77.0500 },
        'Zona Centro': { lat: -12.0464, lng: -77.0428 },
        'Zona Sur': { lat: -12.1800, lng: -76.9800 },
        'Zona Este': { lat: -12.0200, lng: -76.9000 },
        'Zona Callao': { lat: -12.0500, lng: -77.1200 }
      };

      const center = zoneCenters[activeRouteZone] || { lat: -12.0464, lng: -77.0428 };

      let step = 0;
      let curLat = center.lat;
      let curLng = center.lng;

      // Broadcast first coordinate immediately
      updateDriverLocationRef.current(selectedRouteId, curLat, curLng);
      setLastLocationUpdateTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      intervalId = setInterval(() => {
        step += 1;
        const angle = (step * Math.PI) / 8; // circle around center
        const offsetLat = Math.sin(angle) * 0.012 + (Math.random() - 0.5) * 0.002;
        const offsetLng = Math.cos(angle) * 0.012 + (Math.random() - 0.5) * 0.002;
        
        updateDriverLocationRef.current(selectedRouteId, curLat + offsetLat, curLng + offsetLng);
        setLastLocationUpdateTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [simulating, selectedRouteId, activeRouteZone]);
  const routeOrders = activeRoute 
    ? orders.filter(o => activeRoute.orderIds.includes(o.id)) 
    // basic sorting: pending first, then others
    .sort((a, b) => {
      const isAPending = a.status === 'CONFIRMED' || a.status === 'PENDING_CONFIRMATION';
      const isBPending = b.status === 'CONFIRMED' || b.status === 'PENDING_CONFIRMATION';
      if (isAPending && !isBPending) return -1;
      if (!isAPending && isBPending) return 1;
      return 0;
    })
    : [];

  const completedCount = routeOrders.filter(o => o.status === 'DELIVERED').length;
  const failedCount = routeOrders.filter(o => o.status === 'FAILED' || o.status === 'CANCELLED').length;
  const pendingCount = routeOrders.length - completedCount - failedCount;
  const progressPct = routeOrders.length > 0 ? ((completedCount + failedCount) / routeOrders.length) * 100 : 0;

  const handleDeliver = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'DELIVERED', podPhotoStatus ? 'photo_captured_simulated' : undefined, deliveryNotes);
    resetActionState();
  };

  const handleFail = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'FAILED', undefined, deliveryNotes || 'Motivo no especificado');
    resetActionState();
  };

  const resetActionState = () => {
    setActiveOrderActionId(null);
    setDeliveryNotes('');
    setPodPhotoStatus(false);
  };

  if (myRoutes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 h-full text-center">
        <Truck size={48} className="text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-slate-700">No hay rutas asignadas</h2>
        <p className="text-sm text-slate-500 mt-1">Actualmente no tienes ninguna ruta de despacho activa para hoy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      
      {/* Route Selector (If Admin or multiple routes) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-slate-400 tracking-wider uppercase mb-1">Ruta Activa</h2>
          <select 
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="text-lg font-bold text-[#017E84] bg-transparent outline-none cursor-pointer"
          >
            {myRoutes.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.zone})</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-bold">
          <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[#017E84] text-xl block leading-none">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Pendientes</span>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-emerald-600 text-xl block leading-none">{completedCount}</span>
            <span className="text-[10px] text-emerald-500 uppercase tracking-wider">Entregados</span>
          </div>
        </div>
      </div>

      {/* Real-time Tracking and Simulator Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#017E84]/5 rounded-bl-full pointer-events-none -mr-4 -mt-4"></div>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${gpsActive || simulating ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
            <Truck size={24} />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              Seguimiento Satelital en Tiempo Real (GPS)
              {(gpsActive || simulating) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Transmite tu ubicación geográfica en vivo para que el despachador en oficina visualice tu camión de entrega fluyendo en el mapa satelital.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Real GPS Toggle */}
          <button
            type="button"
            onClick={() => {
              setGpsActive(!gpsActive);
              setSimulating(false); // turn off simulation
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs border transition-all ${
              gpsActive 
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <span className="text-base">{gpsActive ? '🔴' : '🛰️'}</span>
            {gpsActive ? 'Apagar GPS del Dispositivo' : 'Activar GPS Real del Celular'}
          </button>

          {/* Simulated GPS Toggle */}
          <button
            type="button"
            onClick={() => {
              setSimulating(!simulating);
              setGpsActive(false); // turn off real GPS
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs border transition-all ${
              simulating 
                ? 'bg-[#017E84]/10 border-[#017E84]/20 text-[#017E84] hover:bg-[#017E84]/20' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-sm'
            }`}
          >
            <span className="text-base">{simulating ? '⏹️' : '🎮'}</span>
            {simulating ? 'Detener Simulación Automática' : 'Iniciar Simulación de Conducción'}
          </button>
        </div>

        {/* Current Coordinates Banner */}
        {(gpsActive || simulating) && (
          <div className="mt-4 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {gpsActive ? 'Transmisión GPS Real' : 'Simulación de Ruta Activa'}
              </span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-100 pr-1">
                📍 {activeRoute?.gpsLat?.toFixed(4)}, {activeRoute?.gpsLng?.toFixed(4)}
              </span>
              <span className="text-[9px] text-[#017E84] mt-0.5 font-bold uppercase">
                Última señal: {lastLocationUpdateTime || 'Justo ahora'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5 px-1">
        <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
          <span>Avance de Ruta</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Route Stops List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 px-1">
          <MapPin size={16} className="text-[#017E84]" />
          Paradas de Entrega ({routeOrders.length})
        </h3>
        
        {routeOrders.length === 0 ? (
          <p className="text-sm text-slate-500 bg-slate-50 p-6 rounded-2xl text-center border border-dashed border-slate-200">
            No hay pedidos asignados a esta ruta.
          </p>
        ) : (
          routeOrders.map((order, index) => {
            const isPending = order.status === 'CONFIRMED' || order.status === 'PENDING_CONFIRMATION';
            const isDelivered = order.status === 'DELIVERED';
            const isFailed = order.status === 'FAILED' || order.status === 'CANCELLED';
            const isActionActive = activeOrderActionId === order.id;
            
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-3xl border transition-all ${
                  isDelivered ? 'border-emerald-200 bg-emerald-50/30' : 
                  isFailed ? 'border-rose-200 bg-rose-50/30' : 
                  isActionActive ? 'border-[#017E84] ring-4 ring-[#017E84]/10 shadow-lg' : 
                  'border-slate-200 shadow-sm'
                }`}
              >
                <div className="p-5 flex flex-col gap-3">
                  {/* Header Row: Stop Number & Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        isDelivered ? 'bg-emerald-100 text-emerald-600' :
                        isFailed ? 'bg-rose-100 text-rose-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {isDelivered ? <Check size={16} /> : isFailed ? <XCircle size={16} /> : index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{order.storeName}</h4>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{order.storeAddress}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-[#017E84]">S/ {order.total.toFixed(2)}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isDelivered ? 'bg-emerald-100 text-emerald-700' :
                        isFailed ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {isDelivered ? 'Entregado' : isFailed ? 'Fallido' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Actions / Info Row */}
                  {isPending && !isActionActive && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.storeAddress + ' ' + order.storeZone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
                      >
                        <Navigation size={14} /> Navegar
                      </a>
                      <button 
                        onClick={() => setActiveOrderActionId(order.id)}
                        className="flex-[2] flex items-center justify-center gap-1.5 bg-[#017E84] hover:bg-[#006064] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md"
                      >
                        <CheckCircle2 size={16} /> Reportar Entrega
                      </button>
                    </div>
                  )}

                  {/* Active Action Panel */}
                  {isActionActive && (
                    <div className="mt-2 pt-4 border-t border-dashed border-slate-200 space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prueba de Entrega (POD)</label>
                        <button 
                          onClick={() => setPodPhotoStatus(!podPhotoStatus)}
                          className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                            podPhotoStatus 
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700' 
                              : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Camera size={18} /> 
                          {podPhotoStatus ? '📸 Foto Capturada Exitosamente' : 'Tomar Foto del Local / Guía Remisión'}
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notas Adicionales (Opcional)</label>
                        <input
                          type="text"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder="Ej. Recibió el vigilante, local cerrado, etc."
                          className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#017E84] bg-slate-50 focus:bg-white text-slate-800"
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button 
                          onClick={() => handleDeliver(order.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                        >
                          <CheckCircle2 size={20} /> CONFIRMAR ENTREGA EXITOSA
                        </button>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={resetActionState}
                            className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => handleFail(order.id)}
                            className="flex-[2] py-3 text-sm bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl transition-colors"
                          >
                            Reportar Fallido (No Entregado)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completed Info */}
                  {(isDelivered || isFailed) && order.deliveryNotes && (
                    <div className="mt-2 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Nota de Despacho:</p>
                      <p className="text-xs text-slate-700 italic border-l-2 border-slate-300 pl-2 py-0.5">{order.deliveryNotes}</p>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
