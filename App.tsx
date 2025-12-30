import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { Login } from './components/Login';
import { ClientManagement } from './components/ClientManagement';
import { ConnectionManager } from './components/ConnectionManager';
import { ViewMode, UserSession, ClientAccess, OdooConnection } from './types';
import { MOCK_KPIS, MOCK_SALES_DATA, MOCK_TOP_PRODUCTS, MOCK_INVENTORY } from './constants';
import { Bell, Search, ChevronDown, Building } from 'lucide-react';

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
  
  // Connection Data State (The "Companies" available to assign)
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
    
    // Admin sees ALL connections created in the Connection Manager
    if (session.role === 'ADMIN') return connections;
    
    // Client sees ONLY connections assigned to them
    if (session.role === 'CLIENT' && session.clientData) {
      return connections.filter(c => session.clientData!.assignedConnectionIds.includes(c.id));
    }
    return [];
  }, [session, connections]);

  // Ensure selected connection is valid when session changes
  useEffect(() => {
    if (availableConnections.length > 0) {
        // If the currently selected connection is not in the allowed list, switch to the first allowed one
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
    // Redirect Admin directly to Connection Management view
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
      // Clients go to Dashboard by default
      setCurrentView(ViewMode.DASHBOARD);
    } else {
      alert('Clave de acceso inválida');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView(ViewMode.DASHBOARD);
  };

  // Client Management Actions
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

  // Connection Management Actions
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
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        userRole={session.role}
        allowedModules={session.clientData?.allowedModules} // Pass permissions to sidebar
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          
          {/* Left: Search & Connection Context */}
          <div className="flex items-center space-x-6">
            <div className="relative group">
               <button className="flex items-center space-x-2 text-gray-700 hover:text-odoo-primary transition-colors font-medium">
                   <Building size={18} />
                   <span>{selectedConnection ? selectedConnection.name : 'Seleccionar Conexión'}</span>
                   <ChevronDown size={16} />
               </button>
               {/* Dropdown - Filtered by permissions */}
               <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-20">
                   {availableConnections.length > 0 ? availableConnections.map(c => (
                       <div 
                        key={c.id} 
                        className={`p-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 ${selectedConnection?.id === c.id ? 'bg-gray-50 font-bold text-odoo-primary' : ''}`}
                        onClick={() => setSelectedConnection(c)}
                       >
                           <div className="font-medium">{c.name}</div>
                           <div className="text-xs text-gray-400">{c.db}</div>
                       </div>
                   )) : (
                     <div className="p-3 text-sm text-gray-400">No hay conexiones disponibles</div>
                   )}
               </div>
            </div>

            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar en datos..." 
                    className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-odoo-primary/20 w-64 bg-gray-50 focus:bg-white transition-all"
                />
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center space-x-4">
             {session.role === 'ADMIN' && (
                <span className="bg-odoo-secondary/10 text-odoo-secondary px-2 py-1 rounded text-xs font-bold border border-odoo-secondary/20">
                  MODO ADMIN
                </span>
             )}
             <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                 <Bell size={20} />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             
             <div className="relative">
                 <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 pl-2 border-l border-gray-200"
                 >
                     <div className={`w-8 h-8 rounded-full ${session.role === 'ADMIN' ? 'bg-odoo-secondary' : 'bg-odoo-primary'} text-white flex items-center justify-center font-bold text-sm`}>
                         {session.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div className="hidden md:block text-left">
                         <p className="text-xs font-bold text-gray-800">{session.name}</p>
                         <p className="text-[10px] text-gray-500">{session.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
                     </div>
                     <ChevronDown size={14} className="text-gray-400" />
                 </button>
                 {/* Logout Dropdown */}
                 {isProfileOpen && (
                   <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-20 py-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Cerrar Sesión
                      </button>
                   </div>
                 )}
             </div>
          </div>
        </header>

        {/* Dynamic Content View */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 custom-scrollbar">
           <div className="max-w-7xl mx-auto">
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
                    connections={connections} // Pass connections as the source of assignments
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
               {/* Fallback for module links that exist in sidebar but don't have components yet */}
               {(currentView === ViewMode.PRODUCTS || currentView === ViewMode.CUSTOMERS || currentView === ViewMode.REPORTS) && (
                   <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                       <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Building size={32} className="text-gray-400" />
                           </div>
                           <h3 className="text-lg font-bold text-gray-700">Módulo Activado</h3>
                           <p className="text-sm mt-2 max-w-xs mx-auto">
                               Tienes permisos para ver {currentView === ViewMode.CUSTOMERS ? 'Ventas' : currentView}, pero esta vista es un demo estático.
                           </p>
                           {selectedConnection && (
                               <p className="text-xs mt-4 text-odoo-primary font-bold">Conectado a: {selectedConnection.name}</p>
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