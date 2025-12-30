import React from 'react';
import { LayoutDashboard, Package, TrendingUp, Users, FileText, Settings, Database, BarChart3, ChevronLeft, ShieldCheck, LogOut, Server, ShoppingCart } from 'lucide-react';
import { ViewMode, UserRole, AppModule } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  collapsed: boolean;
  toggleCollapse: () => void;
  userRole: UserRole;
  allowedModules?: AppModule[]; // Only relevant for CLIENT role
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, collapsed, toggleCollapse, userRole, allowedModules, onLogout }) => {
  
  // Base menu items configuration
  const allMenuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard Ejecutivo', icon: LayoutDashboard, module: 'DASHBOARD' as AppModule },
    { id: ViewMode.INVENTORY, label: 'Alertas Inventario', icon: Package, module: 'INVENTORY' as AppModule },
    { id: ViewMode.PRODUCTS, label: 'Análisis Productos', icon: TrendingUp, module: 'PRODUCTS' as AppModule },
    { id: ViewMode.CUSTOMERS, label: 'Ventas / Clientes', icon: ShoppingCart, module: 'SALES' as AppModule }, // Renamed for clarity
    { id: ViewMode.REPORTS, label: 'Reportes', icon: FileText, module: 'REPORTS' as AppModule },
  ];

  // Filter items:
  // 1. If Admin, show all base items.
  // 2. If Client, show only items included in allowedModules.
  const visibleMenuItems = allMenuItems.filter(item => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'CLIENT' && allowedModules) {
      return allowedModules.includes(item.module);
    }
    return false;
  });

  // Admin specific items (Always hidden for Client)
  const adminItems = [
    { id: ViewMode.CLIENT_MANAGEMENT, label: 'Gestión de Accesos', icon: ShieldCheck },
    { id: ViewMode.CONNECTION_MANAGEMENT, label: 'Conexiones Odoo', icon: Database },
  ];

  return (
    <div className={`bg-odoo-dark text-white flex flex-col transition-all duration-300 h-screen sticky top-0 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="h-16 flex items-center px-4 border-b border-gray-700 bg-opacity-50 bg-black">
        {!collapsed && <span className="font-bold text-xl tracking-tight text-white/90">Toome</span>}
        {collapsed && <BarChart3 className="mx-auto text-odoo-accent" />}
      </div>

      <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {collapsed ? (
             <div className="flex justify-center mb-6">
                 <div className="w-8 h-8 rounded bg-odoo-primary flex items-center justify-center text-xs font-bold">T</div>
             </div>
        ) : (
            <div className="px-4 mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menú Principal</p>
            </div>
        )}

        <nav className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150
                  ${isActive 
                    ? 'bg-white/10 text-white border-l-4 border-odoo-accent' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.label : ''}
              >
                <Icon size={20} className={`${collapsed ? '' : 'mr-3'} ${isActive ? 'text-odoo-accent' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && userRole === 'ADMIN' && (
            <div className="mt-8">
                <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administración</p>
                </div>
                {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150
                            ${isActive 
                                ? 'bg-odoo-secondary/20 text-white border-l-4 border-odoo-secondary' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                            }
                            `}
                        >
                            <Icon size={20} className="mr-3" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}

                <div className="mt-4 px-4">
                    <button className="w-full flex items-center px-0 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        <Server size={18} className="mr-3" />
                        <span>Logs de Servidor</span>
                    </button>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            title="Cerrar Sesión"
        >
            <LogOut size={20} />
            {!collapsed && <span className="ml-2 text-sm">Salir</span>}
        </button>
        <button 
            onClick={toggleCollapse}
            className="flex items-center justify-center w-full p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
            <ChevronLeft size={20} className={`transform transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="ml-2 text-sm">Colapsar</span>}
        </button>
      </div>
    </div>
  );
};