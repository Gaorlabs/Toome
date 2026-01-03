
import React, { useState, useEffect } from 'react';
import { ViewMode, UserRole, AppModule } from '../types';
import { LayoutDashboard, Package, ShoppingCart, Menu, X, Calendar, FileText, Users, TrendingUp, ShieldCheck, Database, LogOut, Store, Home } from 'lucide-react';

interface MobileNavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  userRole: UserRole;
  allowedModules?: AppModule[];
  onLogout: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentView, onNavigate, userRole, allowedModules, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper to safely check permissions
  const hasAccess = (targetModule: AppModule) => {
      if (userRole === 'ADMIN') return true;
      if (!allowedModules || !Array.isArray(allowedModules)) return false;
      return allowedModules.includes(targetModule);
  };

  // Primary Tabs (Bottom Bar) - Mapped explicitly
  const mainTabs = [
    { id: ViewMode.DASHBOARD, label: 'Inicio', icon: Home, module: 'DASHBOARD' as AppModule },
    { id: ViewMode.CUSTOMERS, label: 'Ventas', icon: ShoppingCart, module: 'SALES' as AppModule },
    { id: ViewMode.INVENTORY, label: 'Stock', icon: Package, module: 'INVENTORY' as AppModule },
  ];

  // Secondary Menu Items (Drawer) - Mapped explicitly
  const menuItems = [
    { id: ViewMode.BRANCHES, label: 'Cajas y Sedes', icon: Store, module: 'SALES' as AppModule }, // Changed to SALES to match Sidebar
    { id: ViewMode.AGENDA, label: 'Agenda', icon: Calendar, module: 'AGENDA' as AppModule },
    { id: ViewMode.PRODUCTS, label: 'Rentabilidad', icon: TrendingUp, module: 'PRODUCTS' as AppModule },
    { id: ViewMode.REPORTS, label: 'Reportes', icon: FileText, module: 'REPORTS' as AppModule },
    { id: ViewMode.STAFF, label: 'Personal', icon: Users, module: 'STAFF' as AppModule },
  ];

  const adminItems = [
    { id: ViewMode.CLIENT_MANAGEMENT, label: 'Accesos', icon: ShieldCheck },
    { id: ViewMode.CONNECTION_MANAGEMENT, label: 'Conexiones', icon: Database },
  ];

  const handleNav = (id: ViewMode) => {
      onNavigate(id);
      setIsMenuOpen(false);
  };

  // Pre-filter items to ensure render consistency
  const visibleMainTabs = mainTabs.filter(t => hasAccess(t.module));
  const visibleMenuItems = menuItems.filter(i => hasAccess(i.module));

  return (
    <>
      {/* Bottom Bar - Fixed */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16">
          {visibleMainTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === tab.id && !isMenuOpen ? 'text-odoo-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <tab.icon size={24} strokeWidth={currentView === tab.id && !isMenuOpen ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isMenuOpen ? 'text-odoo-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Menu size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">Menú</span>
          </button>
        </div>
      </div>

      {/* Full Screen Menu Overlay (Drawer) */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#F9FAFB] z-50 animate-fade-in flex flex-col">
           {/* Menu Header */}
           <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
               <h2 className="text-xl font-bold text-gray-800">Menú Principal</h2>
               <button 
                onClick={() => setIsMenuOpen(false)} 
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
               >
                   <X size={20} className="text-gray-600"/>
               </button>
           </div>
           
           <div className="p-6 space-y-8 overflow-y-auto flex-1 pb-24">
               {/* Modules Grid */}
               <div>
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Módulos Disponibles</h3>
                   {visibleMenuItems.length > 0 ? (
                       <div className="grid grid-cols-2 gap-4">
                           {visibleMenuItems.map(item => (
                               <button
                                 key={item.id}
                                 onClick={() => handleNav(item.id)}
                                 className={`flex flex-col items-center p-5 bg-white border rounded-2xl shadow-sm active:scale-95 transition-all ${currentView === item.id ? 'border-odoo-primary ring-2 ring-odoo-primary/20' : 'border-gray-100'}`}
                               >
                                   <div className={`p-3.5 rounded-full mb-3 ${currentView === item.id ? 'bg-odoo-primary/10 text-odoo-primary' : 'bg-gray-50 text-gray-500'}`}>
                                       <item.icon size={26} />
                                   </div>
                                   <span className="text-sm font-bold text-gray-700">{item.label}</span>
                               </button>
                           ))}
                       </div>
                   ) : (
                       <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">
                           No tienes acceso a módulos adicionales.
                       </p>
                   )}
               </div>

               {/* Admin Section */}
               {userRole === 'ADMIN' && (
                   <div>
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Administración</h3>
                       <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                           {adminItems.map((item, idx) => (
                               <button
                                 key={item.id}
                                 onClick={() => handleNav(item.id)}
                                 className={`w-full flex items-center p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${idx !== adminItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                               >
                                   <div className="bg-odoo-secondary/10 p-2 rounded-lg mr-4 text-odoo-secondary">
                                       <item.icon size={20} />
                                   </div>
                                   <span className="text-sm font-bold text-gray-700">{item.label}</span>
                               </button>
                           ))}
                       </div>
                   </div>
               )}

               {/* Logout Button */}
               <button 
                 onClick={() => { setIsMenuOpen(false); onLogout(); }}
                 className="w-full bg-white text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-red-100 shadow-sm active:scale-95 transition-transform"
               >
                   <LogOut size={20} /> Cerrar Sesión
               </button>
               
               <div className="text-center text-xs text-gray-300 pt-2">
                   Toome Mobile v1.2 &bull; GaorSystem
               </div>
           </div>
        </div>
      )}
    </>
  );
};
