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

interface RoutesMapProps {
  routes: DeliveryRoute[];
  orders: Order[];
  onAssignOrderToRoute: (orderId: string, routeId: string | undefined) => void;
  selectedRouteId: string | null;
}

// Component to handle auto-zooming and panning
function MapController({ markers, selectedRouteId }: { markers: any[], selectedRouteId: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0 && selectedRouteId) {
      const routeOrders = markers.filter(m => m.order.shippingRouteId === selectedRouteId);
      if (routeOrders.length > 0) {
        const bounds = L.latLngBounds(routeOrders.map(m => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, markers, selectedRouteId]);

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
        .leaflet-container {
          font-family: inherit;
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
        
        <MapController markers={markers} selectedRouteId={selectedRouteId} />

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
