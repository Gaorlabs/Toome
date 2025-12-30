import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { Login } from './components/Login';
import { ClientManagement } from './components/ClientManagement';
import { ConnectionManager } from './components/ConnectionManager';
import { ViewMode, UserSession, ClientAccess, OdooConnection } from './types';
import { MOCK_KPIS, MOCK_SALES_DATA, MOCK_TOP_PRODUCTS, MOCK_INVENTORY } from './constants';
import { Bell, Search, ChevronDown, Building, Menu } from 'lucide-react';

export default function App() {
  // Auth State
  const [session, setSession] = useState<UserSession | null>(null);
  
  // App Data State
  const [clients, setClients] = useState<ClientAccess[]>([
    { 
        id: '1', 
        name: 'Demo Gerente', 
        accessKey: 'DEMO-1234', 
        assignedConnectionIds: ['conn1'], 
        allowedModules: ['DASHBOARD', 'SALES', 'PRODUCTS', 'REPORTS'],
        createdAt: new Date().toISOString() 
    }
  ]);
  
  // Connection Data State
  const [connections, setConnections] = useState<OdooConnection[]>([
      { 
          id: 'conn1', 
          name: 'Sede Principal (Demo)', 
          url: 'https://demo.odoo.com', 
          db: 'demo_db', 
          user: 'admin', 
          apiKey: '****', 
          status: 'PENDING', 
          lastCheck: null 
      }
  ]);

  // View State
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<OdooConnection | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // LOGIC: Determine which connections are available to the current user
  const availableConnections = React.useMemo(() => {
    if (!session) return [];
    if (session.role === 'ADMIN') return connections;
    if (session.role === 'CLIENT' && session.clientData) {
      return connections.filter(c => session.clientData!.assignedConnectionIds.includes(c.id));
    }
    return [];
  }, [session, connections]);

  useEffect(() => {
    if (availableConnections.length > 0) {
        if (!selectedConnection || !availableConnections.find(c => c.id === selectedConnection.id)) {
            setSelectedConnection(availableConnections[0]);
        }
    } else {
        setSelectedConnection(null);
    }
  }, [availableConnections, selectedConnection]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleAdminLogin = () => {
    setSession({
      role: 'ADMIN',
      name: 'Administrador',
    });
    setCurrentView(ViewMode.CONNECTION_MANAGEMENT);
  };

  const handleClientLogin = (key: string) => {
    const client = clients.find(c => c.accessKey === key);
    if (client) {
      setSession({
        role: 'CLIENT',
        name: client.name,
        clientData: client
      });
      setCurrentView(ViewMode.DASHBOARD);
    } else {
      alert('Clave de acceso inválida');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView(ViewMode.DASHBOARD);
  };

  // Actions
  const handleCreateClient = (newClient: Omit<ClientAccess, 'id' | 'createdAt'>) => {
    const client: ClientAccess = {
      ...newClient,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setClients([...clients, client]);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const handleAddConnection = (conn: OdooConnection) => {
      setConnections([...connections, conn]);
  };

  const handleRemoveConnection = (id: string) => {
      setConnections(connections.filter(c => c.id !== id));
  };

  const handleUpdateConnectionStatus = (id: string, status: 'CONNECTED' | 'ERROR') => {
      setConnections(connections.map(c => 
          c.id === id 
          ? { ...c, status, lastCheck: new Date().toLocaleString() } 
          : c
      ));
  };

  // Login Screen
  if (!session) {
    return (
      <Login 
        onAdminLogin={handleAdminLogin}
        onClientLogin={handleClientLogin}
        savedConfig={null}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        userRole={session.role}
        allowedModules={session.clientData?.allowedModules} 
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 z-20 transition-all duration-300 bg-white/50 backdrop-blur-md border-b border-white/40 sticky top-0">
          
          {/* Left: Search & Connection Context */}
          <div className="flex items-center space-x-6">
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-odoo-primary md:hidden">
                <Menu />
            </button>
            
            <div className="relative group">
               <button className="flex items-center space-x-3 text-gray-700 hover:text-odoo-primary transition-all duration-300 font-semibold bg-white/60 px-4 py-2 rounded-xl border border-white/40 shadow-sm hover:shadow hover:-translate-y-0.5">
                   <div className="p-1.5 bg-odoo-primary/10 rounded-lg">
                     <Building size={18} className="text-odoo-primary" />
                   </div>
                   <span>{selectedConnection ? selectedConnection.name : 'Seleccionar Conexión'}</span>
                   <ChevronDown size={16} className="text-gray-400" />
               </button>
               {/* Dropdown */}
               <div className="absolute top-full left-0 mt-3 w-72 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl hidden group-hover:block z-20 p-2 animate-slide-up ring-1 ring-black/5">
                   {availableConnections.length > 0 ? availableConnections.map(c => (
                       <div 
                        key={c.id} 
                        className={`p-3 hover:bg-odoo-primary/5 cursor-pointer rounded-xl transition-colors mb-1 last:mb-0 ${selectedConnection?.id === c.id ? 'bg-odoo-primary/10' : ''}`}
                        onClick={() => setSelectedConnection(c)}
                       >
                           <div className={`font-bold text-sm ${selectedConnection?.id === c.id ? 'text-odoo-primary' : 'text-gray-700'}`}>{c.name}</div>
                           <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                               <span className="w-2 h-2 rounded-full bg-green-400"></span>
                               {c.db}
                           </div>
                       </div>
                   )) : (
                     <div className="p-4 text-sm text-gray-400 text-center italic">No hay conexiones disponibles</div>
                   )}
               </div>
            </div>

            <div className="relative hidden lg:block group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-odoo-primary transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="pl-12 pr-4 py-2.5 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-odoo-primary/20 w-64 bg-white/60 focus:bg-white transition-all shadow-sm"
                />
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center space-x-5">
             {session.role === 'ADMIN' && (
                <span className="bg-odoo-secondary/10 text-odoo-secondary px-3 py-1 rounded-lg text-xs font-bold border border-odoo-secondary/20 shadow-sm">
                  ADMIN
                </span>
             )}
             <button className="relative p-2.5 text-gray-500 hover:text-odoo-primary hover:bg-white rounded-xl transition-all duration-300">
                 <Bell size={22} />
                 <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             
             <div className="relative">
                 <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 pl-3 border-l border-gray-200"
                 >
                     <div className={`w-10 h-10 rounded-xl ${session.role === 'ADMIN' ? 'bg-gradient-to-br from-odoo-secondary to-teal-700' : 'bg-gradient-to-br from-odoo-primary to-purple-800'} text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white`}>
                         {session.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div className="hidden md:block text-left">
                         <p className="text-sm font-bold text-gray-800 leading-none mb-1">{session.name}</p>
                         <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">{session.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
                     </div>
                     <ChevronDown size={14} className="text-gray-400" />
                 </button>
                 
                 {isProfileOpen && (
                   <div className="absolute top-full right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl z-20 py-2 animate-slide-up ring-1 ring-black/5">
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                          <p className="text-sm font-bold text-gray-800">Mi Cuenta</p>
                          <p className="text-xs text-gray-500">Gestión de perfil</p>
                      </div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Cerrar Sesión
                      </button>
                   </div>
                 )}
             </div>
          </div>
        </header>

        {/* Dynamic Content View */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 relative scroll-smooth">
           <div className="max-w-[1600px] mx-auto animate-fade-in">
               {currentView === ViewMode.DASHBOARD && (
                   <Dashboard 
                       kpis={MOCK_KPIS} 
                       salesData={MOCK_SALES_DATA} 
                       topProducts={MOCK_TOP_PRODUCTS}
                   />
               )}
               {currentView === ViewMode.INVENTORY && (
                   <InventoryView items={MOCK_INVENTORY} />
               )}
               {currentView === ViewMode.CLIENT_MANAGEMENT && session.role === 'ADMIN' && (
                  <ClientManagement 
                    clients={clients} 
                    connections={connections} 
                    onCreateClient={handleCreateClient}
                    onDeleteClient={handleDeleteClient}
                  />
               )}
               {currentView === ViewMode.CONNECTION_MANAGEMENT && session.role === 'ADMIN' && (
                  <ConnectionManager
                    connections={connections}
                    onAddConnection={handleAddConnection}
                    onRemoveConnection={handleRemoveConnection}
                    onUpdateStatus={handleUpdateConnectionStatus}
                  />
               )}
               {(currentView === ViewMode.PRODUCTS || currentView === ViewMode.CUSTOMERS || currentView === ViewMode.REPORTS) && (
                   <div className="flex flex-col items-center justify-center h-[70vh] text-gray-400 animate-slide-up">
                       <div className="glass-card p-12 rounded-3xl text-center max-w-lg">
                           <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                               <Building size={40} className="text-odoo-primary/50" />
                           </div>
                           <h3 className="text-2xl font-bold text-gray-800 mb-2">Módulo Activado</h3>
                           <p className="text-gray-500 mb-6 leading-relaxed">
                               Tienes permisos para ver <span className="font-bold text-odoo-secondary">{currentView === ViewMode.CUSTOMERS ? 'Ventas' : currentView}</span>.
                               <br/>Esta vista es un demo estático visual.
                           </p>
                           {selectedConnection && (
                               <div className="inline-flex items-center gap-2 px-4 py-2 bg-odoo-primary/5 text-odoo-primary rounded-xl font-bold text-sm border border-odoo-primary/10">
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                   {selectedConnection.name}
                               </div>
                           )}
                       </div>
                   </div>
               )}
           </div>
        </main>

      </div>
    </div>
  );
}