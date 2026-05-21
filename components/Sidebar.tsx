import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Compass, Box, PiggyBank, Briefcase, Store, BarChart3, LogOut, ChevronLeft, Menu, Network } from 'lucide-react';
import { ViewMode, UserSession } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  collapsed: boolean;
  toggleCollapse: () => void;
  session: UserSession;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  toggleCollapse,
  session,
  onLogout
}) => {
  const isAdmin = session.role === 'ADMIN';

  // Define sidebar menu options based on role
  const menuItems = [
    {
      id: ViewMode.DASHBOARD,
      label: 'Resumen Diario',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SELLER']
    },
    {
      id: ViewMode.SELL_FIELD,
      label: 'PEDIDO DE VENTA',
      icon: Briefcase,
      roles: ['SELLER', 'ADMIN'], // Admin can also simulate field sales
      badge: 'Campo'
    },
    {
      id: ViewMode.ROUTES,
      label: 'Rutas por Zona',
      icon: Compass,
      roles: ['ADMIN'],
      badge: 'Despacho'
    },
    {
      id: ViewMode.INVENTORY,
      label: 'Inventario Kardex',
      icon: Box,
      roles: ['ADMIN', 'SELLER']
    },
    {
      id: ViewMode.PAYMENTS,
      label: 'Gestión de Pagos',
      icon: PiggyBank,
      roles: ['ADMIN', 'SELLER']
    },
    {
      id: ViewMode.CLIENTS,
      label: 'Clientes / Tiendas',
      icon: Store,
      roles: ['ADMIN', 'SELLER']
    },
    {
      id: ViewMode.REPORTS,
      label: 'Estadísticas',
      icon: BarChart3,
      roles: ['ADMIN']
    }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(session.role));

  return (
    <div className={`bg-[#0F172A] text-slate-200 hidden md:flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 z-30 ${collapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-[#0F172A] justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
            <Compass size={20} className="text-white shrink-0" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">Toome Campo</span>
              <span className="text-[10px] text-teal-400 mt-0.5 tracking-wider font-semibold">PREVENTA & RUTAS</span>
            </div>
          )}
        </div>
      </div>

      {/* User Session Quick Glance */}
      {!collapsed && (
        <div className="p-4 mx-3 my-3 bg-slate-800/40 rounded-xl border border-slate-700/30 flex flex-col gap-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Sesión Activa</p>
          <p className="text-sm font-bold text-white truncate">{session.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span className="text-xs text-slate-300 font-medium">{isAdmin ? 'Coordinador Admin' : 'Preventista Campo'}</span>
          </div>
        </div>
      )}

      {/* Navigation Space */}
      <div className="flex-1 py-3 overflow-y-auto custom-scrollbar px-2 space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isSellField = item.id === ViewMode.SELL_FIELD;

          if (isSellField) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center px-3 py-3 rounded-xl text-xs font-black transition-all duration-150 group relative uppercase tracking-wider
                ${isActive 
                  ? 'bg-gradient-to-r from-emerald-500 to-[#017E84] text-white border-teal-400 shadow-md ring-1 ring-emerald-400/30' 
                  : 'bg-emerald-950/25 border border-emerald-900/40 text-emerald-300 hover:bg-emerald-900/30 hover:text-white'
                }
                ${collapsed ? 'justify-center px-0 h-11 w-11 mx-auto rounded-full' : ''}
                `}
                title={collapsed ? 'PEDIDO' : ''}
              >
                <Icon 
                  size={18} 
                  className={`transition-colors shrink-0 ${isActive ? 'text-white' : 'text-emerald-400 group-hover:text-white'} ${!collapsed && 'mr-2.5'}`} 
                />
                {!collapsed && <span className="truncate">PEDIDO DE VENTA</span>}
                
                {!collapsed && (
                  <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-800/60 text-emerald-300 border border-emerald-700/30'
                  }`}>
                    PRAL
                  </span>
                )}

                {isActive && collapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-emerald-400 rounded-r-md"></div>}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative
              ${isActive 
                ? 'bg-teal-500 text-white font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
              ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? item.label : ''}
            >
              <Icon 
                size={18} 
                className={`transition-colors shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} ${!collapsed && 'mr-3'}`} 
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              
              {!collapsed && item.badge && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-800 text-teal-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Bar on Left when active */}
              {isActive && collapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-teal-400 rounded-r-md"></div>}
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex items-center justify-center w-full p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft size={18} className={`transform transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center justify-center w-full p-2 text-rose-400 hover:text-white hover:bg-rose-9e50 hover:bg-rose-950/40 rounded-lg transition-colors group"
          title="Cerrar Sesión"
        >
          <LogOut size={18} />
          {!collapsed && <span className="ml-2 text-sm font-semibold">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};
