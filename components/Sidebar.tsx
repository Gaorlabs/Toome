
import React from 'react';
import { LayoutDashboard, Package, TrendingUp, BarChart2, Database, ChevronLeft, ShieldCheck, LogOut, ShoppingCart, Calendar, Store, Percent, FileText, Users } from 'lucide-react';
import { ViewMode, UserRole, AppModule } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  collapsed: boolean;
  toggleCollapse: () => void;
  userRole: UserRole;
  allowedModules?: AppModule[];
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, collapsed, toggleCollapse, userRole, allowedModules, onLogout }) => {
  
  const analyticalItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, module: 'DASHBOARD' as AppModule },
    { id: ViewMode.BRANCHES, label: 'Sedes y Cajas', icon: Store, module: 'DASHBOARD' as AppModule },
    { id: ViewMode.CUSTOMERS, label: 'Ventas Detalladas', icon: ShoppingCart, module: 'SALES' as AppModule }, // Mapped to Sales View
    { id: ViewMode.REPORTS, label: 'Centro de Reportes', icon: FileText, module: 'REPORTS' as AppModule },
  ];

  const operationsItems = [
    { id: ViewMode.INVENTORY, label: 'Inventario', icon: Package, module: 'INVENTORY' as AppModule },
    { id: ViewMode.PRODUCTS, label: 'Rentabilidad Prod.', icon: TrendingUp, module: 'PRODUCTS' as AppModule },
    { id: ViewMode.AGENDA, label: 'Agenda', icon: Calendar, module: 'AGENDA' as AppModule },
    { id: ViewMode.STAFF, label: 'Gestión Personal', icon: Users, module: 'STAFF' as AppModule },
  ];

  const isAllowed = (module: AppModule) => {
      if (userRole === 'ADMIN') return true;
      if (userRole === 'CLIENT' && allowedModules) {
        return allowedModules.includes(module);
      }
      return false;
  };

  const adminItems = [
    { id: ViewMode.CLIENT_MANAGEMENT, label: 'Gestión de Accesos', icon: ShieldCheck },
    { id: ViewMode.CONNECTION_MANAGEMENT, label: 'Conexiones Odoo', icon: Database },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 z-30 ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-white">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-odoo-primary to-odoo-secondary flex items-center justify-center shadow-lg shadow-odoo-primary/20">
                <BarChart2 size={18} className="text-white" />
             </div>
             {!collapsed && (
                 <span className="font-bold text-xl tracking-tight text-gray-800">Toome</span>
             )}
        </div>
      </div>

      <div className="flex-1 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        {/* Section: Analítica */}
        <div>
            {!collapsed && (
                <div className="px-6 mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestión Comercial</p>
                </div>
            )}
            <nav className="space-y-1 px-3">
            {analyticalItems.filter(i => isAllowed(i.module)).map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                    ${isActive 
                        ? 'bg-odoo-primary/10 text-odoo-primary' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center px-0' : ''}
                    `}
                    title={collapsed ? item.label : ''}
                >
                    <Icon 
                        size={20} 
                        className={`transition-colors ${isActive ? 'text-odoo-primary' : 'text-gray-400 group-hover:text-gray-600'} ${!collapsed && 'mr-3'}`} 
                    />
                    {!collapsed && <span>{item.label}</span>}
                    
                    {/* Active Indicator Bar */}
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-odoo-primary rounded-r-full"></div>}
                </button>
                );
            })}
            </nav>
        </div>

        {/* Section: Operaciones */}
        <div>
            {!collapsed && (
                <div className="px-6 mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operaciones</p>
                </div>
            )}
            <nav className="space-y-1 px-3">
            {operationsItems.filter(i => isAllowed(i.module)).map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                    ${isActive 
                        ? 'bg-odoo-primary/10 text-odoo-primary' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center px-0' : ''}
                    `}
                    title={collapsed ? item.label : ''}
                >
                    <Icon 
                        size={20} 
                        className={`transition-colors ${isActive ? 'text-odoo-primary' : 'text-gray-400 group-hover:text-gray-600'} ${!collapsed && 'mr-3'}`} 
                    />
                    {!collapsed && <span>{item.label}</span>}
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-odoo-primary rounded-r-full"></div>}
                </button>
                );
            })}
            </nav>
        </div>

        {/* Section: Admin */}
        {!collapsed && userRole === 'ADMIN' && (
            <div>
                <div className="px-6 mb-2">
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
                                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive 
                                    ? 'bg-gray-100 text-gray-900' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }
                                `}
                            >
                                <Icon size={20} className={`mr-3 transition-colors ${isActive ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'} text-odoo-secondary`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <button 
            onClick={toggleCollapse}
            className="flex items-center justify-center w-full p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
            <ChevronLeft size={20} className={`transform transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full mt-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
            title="Cerrar Sesión"
        >
            <LogOut size={20} />
            {!collapsed && <span className="ml-2 text-sm font-medium">Salir</span>}
        </button>
      </div>
    </div>
  );
};
