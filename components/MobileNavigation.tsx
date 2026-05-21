import React, { useState } from 'react';
import { ViewMode, UserSession } from '../types';
import { LayoutDashboard, Compass, Briefcase, Box, PiggyBank, Store, BarChart3, LogOut, Menu, X, FileSpreadsheet, Network } from 'lucide-react';

interface MobileNavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  session: UserSession;
  onLogout: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onNavigate,
  session,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = session.role === 'ADMIN';

  // Quick navigation tabs at the bottom bar
  const quickTabs = [
    { id: ViewMode.DASHBOARD, label: 'Inicio', icon: LayoutDashboard, roles: ['ADMIN', 'SELLER'] },
    { id: ViewMode.SELL_FIELD, label: 'PEDIDO', icon: Briefcase, roles: ['SELLER', 'ADMIN'] },
    { id: ViewMode.INVENTORY, label: 'Kardex', icon: Box, roles: ['ADMIN', 'SELLER'] },
  ];

  const visibleTabs = quickTabs.filter(tab => tab.roles.includes(session.role));

  const allMenuOptions = [
    { id: ViewMode.DASHBOARD, label: 'Resumen Diario', icon: LayoutDashboard, roles: ['ADMIN', 'SELLER'] },
    { id: ViewMode.SELL_FIELD, label: 'Toma de Pedidos (PEDIDO)', icon: Briefcase, roles: ['SELLER', 'ADMIN'] },
    { id: ViewMode.ROUTES, label: 'Rutas por Zona', icon: Compass, roles: ['ADMIN'] },
    { id: ViewMode.INVENTORY, label: 'Inventario Kardex', icon: Box, roles: ['ADMIN', 'SELLER'] },
    { id: ViewMode.PAYMENTS, label: 'Gestión de Pagos', icon: PiggyBank, roles: ['ADMIN', 'SELLER'] },
    { id: ViewMode.CLIENTS, label: 'Clientes / Tiendas', icon: Store, roles: ['ADMIN', 'SELLER'] },
    { id: ViewMode.REPORTS, label: 'Estadísticas Comerciales', icon: BarChart3, roles: ['ADMIN'] }
  ];

  const visibleMenuItems = allMenuOptions.filter(item => item.roles.includes(session.role));

  const handleNav = (id: ViewMode) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Bottom Bar for Mobile Devices */}
      <div className="md:hidden fixed bottom-1 left-3 right-3 bg-slate-900 border border-slate-800 z-50 rounded-2xl pb-1 shadow-2xl">
        <div className="flex justify-around items-center h-16">
          {visibleTabs.map(tab => {
            const isSellField = tab.id === ViewMode.SELL_FIELD;
            const isTabActive = currentView === tab.id && !isMenuOpen;

            if (isSellField) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNav(tab.id)}
                  className={`flex flex-col items-center justify-center -translate-y-4 w-15 h-15 rounded-full shadow-lg transition-transform duration-150 active:scale-95 ${
                    isTabActive 
                      ? 'bg-[#017E84] text-white ring-4 ring-slate-900 border-2 border-teal-300' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 ring-4 ring-slate-900 shadow-[#10b981]/25 shadow-xl'
                  }`}
                  style={{ minWidth: '3.75rem', minHeight: '3.75rem' }}
                >
                  <tab.icon size={20} className="animate-pulse" />
                  <span className="text-[9px] tracking-tight font-black uppercase mt-0.5">PEDIDO</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isTabActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon size={22} />
                <span className="text-[10px] tracking-wide font-medium">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isMenuOpen ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu size={22} />
            <span className="text-[10px] tracking-wide font-medium">Menú</span>
          </button>
        </div>
      </div>

      {/* Full Screen Drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950 z-50 flex flex-col animate-fade-in text-slate-100">
          <div className="px-6 py-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-white">Toome Campo</h2>
              <p className="text-[10px] text-teal-400 font-bold mt-0.5 tracking-wider uppercase">Preventa & Distribución</p>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X size={20} className="text-slate-300" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
            {/* Session Summary */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase">Usuario en Sesión</span>
              <span className="text-sm font-bold text-white block">{session.name}</span>
              <span className="text-xs text-teal-400 font-medium">{session.role === 'ADMIN' ? 'Administrador General' : 'Preventista en Campo'}</span>
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Módulos de Trabajo</h3>
              <div className="grid grid-cols-2 gap-3.5">
                {visibleMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border transition-all text-center ${
                      currentView === item.id 
                        ? 'bg-teal-500 border-teal-400 text-white font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={22} className="mb-2 shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setIsMenuOpen(false); onLogout(); }}
              className="w-full bg-rose-950/40 text-rose-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-rose-900/30 transition-colors"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
