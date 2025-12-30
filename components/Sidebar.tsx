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
    { id: ViewMode.CUSTOMERS, label: 'Ventas / Clientes', icon: ShoppingCart, module: 'SALES' as AppModule }, 
    { id: ViewMode.REPORTS, label: 'Reportes', icon: FileText, module: 'REPORTS' as AppModule },
  ];

  // Filter items
  const visibleMenuItems = allMenuItems.filter(item => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'CLIENT' && allowedModules) {
      return allowedModules.includes(item.module);
    }
    return false;
  });

  const adminItems = [
    { id: ViewMode.CLIENT_MANAGEMENT, label: 'Gestión de Accesos', icon: ShieldCheck },
    { id: ViewMode.CONNECTION_MANAGEMENT, label: 'Conexiones Odoo', icon: Database },
  ];

  return (
    <div className={`bg-odoo-dark text-white flex flex-col transition-all duration-500 ease-in-out h-screen sticky top-0 shadow-2xl z-30 ${collapsed ? 'w-20' : 'w-72'}`}>
      
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-center border-b border-white/5 bg-gradient-to-r from-odoo-dark to-[#34495e]">
        {!collapsed ? (
            <div className="flex items-center space-x-2 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-odoo-primary flex items-center justify-center shadow-lg shadow-odoo-primary/40">
                    <BarChart3 size={20} className="text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-white/95">Toome</span>
            </div>
        ) : (
            <div className="w-10 h-10 rounded-xl bg-odoo-primary flex items-center justify-center shadow-lg shadow-odoo-primary/40 animate-slide-up">
                <BarChart3 size={24} className="text-white" />
            </div>
        )}
      </div>

      <div className="flex-1 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        
        {!collapsed && (
            <div className="px-6 mb-4 animate-slide-in-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menú Principal</p>
            </div>
        )}

        <nav className="space-y-1 px-3">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-odoo-primary to-[#835677] text-white shadow-lg shadow-odoo-primary/25 translate-x-1' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.label : ''}
              >
                <Icon 
                    size={22} 
                    className={`transition-transform duration-300 ${collapsed ? '' : 'mr-3'} ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {!collapsed && <span className="tracking-wide">{item.label}</span>}
                
                {/* Active Indicator Dot for Collapsed Mode */}
                {collapsed && isActive && (
                    <div className="absolute right-2 top-2 w-2 h-2 bg-odoo-accent rounded-full shadow-glow"></div>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && userRole === 'ADMIN' && (
            <div className="mt-8 animate-slide-in-right delay-100">
                <div className="px-6 mb-4">
                    <div className="h-px w-full bg-white/5 mb-4"></div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administración</p>
                </div>
                <div className="px-3 space-y-1">
                    {adminItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-odoo-secondary/20 text-odoo-accent border border-odoo-secondary/20 shadow-lg shadow-odoo-secondary/10' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                }
                                `}
                            >
                                <Icon size={20} className={`mr-3 transition-colors ${isActive ? 'text-odoo-accent' : 'group-hover:text-white'}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}

                    <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-500 hover:text-white transition-colors mt-2 group">
                        <Server size={18} className="mr-3 group-hover:animate-pulse" />
                        <span>Logs de Servidor</span>
                    </button>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full p-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 group"
            title="Cerrar Sesión"
        >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="ml-3 text-sm font-medium">Cerrar Sesión</span>}
        </button>
        <button 
            onClick={toggleCollapse}
            className="flex items-center justify-center w-full mt-2 p-2 text-gray-500 hover:text-white rounded-lg transition-colors"
        >
            <ChevronLeft size={20} className={`transform transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};