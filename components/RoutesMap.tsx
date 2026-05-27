import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DeliveryRoute, Order } from '../types';

const createIcon = (color: string, scale: number = 1) => {
  const size = 32 * scale;
  const html = `<div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25)); pointer-events: none;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="width: 100%; height: 100%;">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M16 2C9.9 2 5 6.9 5 13c0 7.3 11 17 11 17s11-9.7 11-17c0-6.1-4.9-11-11-11z"/>
      <circle cx="16" cy="13" r="4" fill="#ffffff" />
    </svg>
  </div>`;
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

const createDriverIcon = () => {
  const size = 44;
  const html = `<div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; position: relative;">
    <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(1, 126, 132, 0.4); animation: leaflet-pulse 1.8s infinite ease-in-out;"></div>
    <div style="width: 32px; height: 32px; background: #017E84; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3)); position: relative; z-index: 10;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    </div>
  </div>`;
  
  return L.divIcon({
    className: 'custom-leaflet-driver-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

interface RoutesMapProps {
  routes: DeliveryRoute[];
  orders: Order[];
  onAssignOrderToRoute: (orderId: string, routeId: string | undefined) => void;
  selectedRouteId: string | null;
}

// Component to handle auto-zooming and panning
function MapController({ markers, selectedRouteId, routes }: { markers: any[], selectedRouteId: string | null, routes: DeliveryRoute[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const points: [number, number][] = [];
      
      if (selectedRouteId) {
        // Find orders on this route
        const routeOrders = markers.filter(m => m.order.shippingRouteId === selectedRouteId);
        routeOrders.forEach(m => points.push([m.lat, m.lng]));
        
        // Find driver position on this route
        const activeRoute = routes.find(r => r.id === selectedRouteId);
        if (activeRoute && activeRoute.gpsLat && activeRoute.gpsLng) {
          points.push([activeRoute.gpsLat, activeRoute.gpsLng]);
        }
      } else {
        // Show all points
        markers.forEach(m => points.push([m.lat, m.lng]));
        routes.forEach(r => {
          if (r.gpsLat && r.gpsLng) {
            points.push([r.gpsLat, r.gpsLng]);
          }
        });
      }
      
      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [map, markers, selectedRouteId, routes]);

  return null;
}

export const RoutesMap: React.FC<RoutesMapProps> = ({ routes, orders, onAssignOrderToRoute, selectedRouteId }) => {
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    const zoneCenters: Record<string, { lat: number, lng: number }> = {
      'Zona Norte': { lat: -11.9300, lng: -77.0500 }, // Los Olivos / Comas
      'Zona Centro': { lat: -12.0464, lng: -77.0428 }, // Cercado
      'Zona Sur': { lat: -12.1800, lng: -76.9800 },   // Surco / SJM
      'Zona Este': { lat: -12.0200, lng: -76.9000 },  // SJL / Ate
      'Zona Callao': { lat: -12.0500, lng: -77.1200 } // Callao
    };

    const newMarkers = orders.filter(o => o.status !== 'CANCELLED').map((o) => {
      const center = zoneCenters[o.storeZone] || { lat: -12.0464, lng: -77.0428 };
      
      const latOffset = (Math.sin(o.id.charCodeAt(o.id.length - 1)) * 0.05);
      const lngOffset = (Math.cos(o.id.charCodeAt(o.id.length - 2) || 1) * 0.05);
      
      return {
        id: o.id,
        order: o,
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset
      };
    });

    setMarkers(newMarkers);
  }, [orders]);

  // Handle case where leaflet hasn't loaded fully
  if (typeof window === 'undefined') return null;

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden relative z-0 bg-slate-50">
      {/* We add a style tag to prevent default leafylet icons borders from messing up layout */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-leaflet-icon {
          background: transparent !important;
          border: none !important;
        }
        .custom-leaflet-driver-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
        @keyframes leaflet-pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}} />
      <MapContainer 
        center={[-12.0464, -77.0428]} 
        zoom={12} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&amp;copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapController markers={markers} selectedRouteId={selectedRouteId} routes={routes} />

        {/* Render Driver Markers */}
        {routes
          .filter(r => r.gpsLat && r.gpsLng && (!selectedRouteId || r.id === selectedRouteId))
          .map(r => (
            <Marker
              key={`driver-${r.id}`}
              position={[r.gpsLat!, r.gpsLng!]}
              icon={createDriverIcon()}
            >
              <Popup className="font-sans">
                <div className="text-xs p-1">
                  <span className="px-2 py-0.5 bg-[#017E84]/15 text-[#017E84] font-black text-[9px] rounded uppercase select-none">
                    GPS ACTIVO • EN RUTA
                  </span>
                  <strong className="text-sm font-black text-slate-800 block mt-1">{r.driverName}</strong>
                  <div className="text-slate-500 font-medium text-xxs">Plan: {r.name}</div>
                  
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 font-bold text-[9px]" style={{ minWidth: '150px' }}>
                    <span>ACTUALIZACIÓN</span>
                    <span className="text-emerald-500 animate-pulse">{r.lastActiveTime || '10:00:00'}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        }

        {markers.map(m => {
          let bg = '#94a3b8'; // unassigned
          let scale = 1;

          if (m.order.status === 'DELIVERED') {
            bg = '#10b981'; // emerald
          } else if (m.order.shippingRouteId) {
            bg = m.order.shippingRouteId === selectedRouteId ? '#f59e0b' : '#3b82f6';
            scale = m.order.shippingRouteId === selectedRouteId ? 1.2 : 0.9;
          } else {
            bg = '#ef4444'; // Red if confirmed but unassigned
          }

          return (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={createIcon(bg, scale)}
            >
              <Popup className="font-sans">
                <div className="text-xs p-1">
                  <strong className="text-sm font-black text-slate-800">{m.order.storeName}</strong>
                  <div className="mt-1 text-slate-500 leading-tight">{m.order.storeAddress}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.order.storeZone}</span>
                    <span className="font-black text-[#017E84] text-sm">S/ {m.order.total.toFixed(2)}</span>
                  </div>
                  {m.order.shippingRouteId && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase">
                        Ruta Asignada
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
