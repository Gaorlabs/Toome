
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { ProductAnalysis } from './components/ProductAnalysis';
import { CustomerView } from './components/CustomerView';
import { AgendaModule } from './components/AgendaModule'; // New Import
import { Login } from './components/Login';
import { ClientManagement } from './components/ClientManagement';
import { ConnectionManager } from './components/ConnectionManager';
import { ViewMode, UserSession, ClientAccess, OdooConnection, OdooCompany } from './types';
import { MOCK_KPIS, MOCK_SALES_DATA, MOCK_TOP_PRODUCTS, MOCK_INVENTORY, MOCK_CUSTOMERS } from './constants';
import { Bell, Search, ChevronDown, Building, Menu, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from './services/supabaseClient';

export default function App() {
  // Auth State
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  
  // App Data State (Fetched from Supabase)
  const [connections, setConnections] = useState<OdooConnection[]>([]);
  const [clients, setClients] = useState<ClientAccess[]>([]);

  // View State
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<OdooConnection | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // LOGIC: Determine which connections are available to the current user based on allowed companies
  const availableConnections = React.useMemo(() => {
    if (!session) return [];
    if (session.role === 'ADMIN') return connections;
    if (session.role === 'CLIENT' && session.clientData) {
      // Find connections where the user has at least one allowed company
      const allowedCompIds = session.clientData.allowedCompanyIds || [];
      return connections.filter(conn => 
        conn.companies && conn.companies.some(comp => allowedCompIds.includes(comp.id))
      );
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

  // Helper to count visible companies for the current user in the selected connection
  const getVisibleCompanyCount = () => {
    if (!selectedConnection || !session || !selectedConnection.companies) return 0;
    if (session.role === 'ADMIN') return selectedConnection.companies.length;
    if (session.role === 'CLIENT' && session.clientData) {
        return selectedConnection.companies.filter(c => session.clientData!.allowedCompanyIds.includes(c.id)).length;
    }
    return 0;
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleAdminLogin = async () => {
    setLoadingSession(true);
    try {
        const { data: connData, error: connError } = await supabase.from('odoo_connections').select('*');
        const { data: clientData, error: clientError } = await supabase.from('client_profiles').select('*');

        if (connError) console.warn("Could not fetch connections, ensure table exists.", connError);
        
        const mappedConnections: OdooConnection[] = (connData || []).map(c => ({
            id: c.id,
            name: c.name,
            url: c.url,
            db: c.db_name, 
            user: c.username,
            apiKey: c.api_key,
            status: c.status as any,
            lastCheck: c.last_check,
            companies: c.companies_metadata || []
        }));

        const mappedClients: ClientAccess[] = (clientData || []).map(c => ({
            id: c.id,
            name: c.name,
            accessKey: c.access_key,
            assignedConnectionIds: c.allowed_connection_ids,
            allowedCompanyIds: c.allowed_company_ids,
            allowedModules: c.allowed_modules,
            createdAt: c.created_at
        }));

        setConnections(mappedConnections);
        setClients(mappedClients);
        
        setSession({
            role: 'ADMIN',
            name: 'Administrador',
        });
        setCurrentView(ViewMode.CONNECTION_MANAGEMENT);
    } catch (e) {
        console.error(e);
        alert("Error iniciando sesión. Verifica la consola.");
    } finally {
        setLoadingSession(false);
    }
  };

  const handleClientLogin = async (key: string) => {
    setLoadingSession(true);
    try {
        const { data, error } = await supabase.rpc('login_with_key', { input_key: key });

        if (error) {
             console.error(error);
             alert('Error de conexión o función login_with_key no existe.');
             setLoadingSession(false);
             return;
        }

        if (!data) {
            alert('Clave de acceso inválida');
            setLoadingSession(false);
            return;
        }

        const clientRecord = data.client;
        const connectionRecords = data.connections || [];

        const mappedClient: ClientAccess = {
            id: clientRecord.id,
            name: clientRecord.name,
            accessKey: clientRecord.access_key,
            assignedConnectionIds: clientRecord.allowed_connection_ids,
            allowedCompanyIds: clientRecord.allowed_company_ids,
            allowedModules: clientRecord.allowed_modules,
            createdAt: clientRecord.created_at
        };

        const mappedConnections: OdooConnection[] = connectionRecords.map((c: any) => ({
            id: c.id,
            name: c.name,
            url: c.url,
            db: c.db_name,
            user: c.username,
            apiKey: c.api_key,
            status: c.status as any,
            lastCheck: c.last_check,
            companies: c.companies_metadata || []
        }));

        setClients([mappedClient]);
        setConnections(mappedConnections);

        setSession({
            role: 'CLIENT',
            name: mappedClient.name,
            clientData: mappedClient
        });
        setCurrentView(ViewMode.DASHBOARD);

    } catch (e) {
        console.error(e);
        alert('Error inesperado al iniciar sesión.');
    } finally {
        setLoadingSession(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setConnections([]);
    setClients([]);
    setCurrentView(ViewMode.DASHBOARD);
  };

  const handleCreateClient = async (newClient: Omit<ClientAccess, 'id' | 'createdAt'>) => {
    try {
        const { data, error } = await supabase.from('client_profiles').insert({
            name: newClient.name,
            access_key: newClient.accessKey,
            allowed_connection_ids: newClient.assignedConnectionIds,
            allowed_company_ids: newClient.allowedCompanyIds,
            allowed_modules: newClient.allowedModules
        }).select();

        if (error) throw error;
        if (data) {
             const created = data[0];
             const mapped: ClientAccess = {
                id: created.id,
                name: created.name,
                accessKey: created.access_key,
                assignedConnectionIds: created.allowed_connection_ids,
                allowedCompanyIds: created.allowed_company_ids,
                allowedModules: created.allowed_modules,
                createdAt: created.created_at
             };
             setClients([...clients, mapped]);
        }
    } catch (e) {
        console.error("Error creating client", e);
        alert("Error al guardar cliente en base de datos.");
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
        const { error } = await supabase.from('client_profiles').delete().eq('id', id);
        if (error) throw error;
        setClients(clients.filter(c => c.id !== id));
    } catch (e) {
        console.error(e);
        alert("Error al eliminar cliente.");
    }
  };

  const handleAddConnection = async (conn: OdooConnection) => {
      try {
          const { data, error } = await supabase.from('odoo_connections').insert({
              name: conn.name,
              url: conn.url,
              db_name: conn.db,
              username: conn.user,
              api_key: conn.apiKey,
              companies_metadata: [],
              status: 'PENDING'
          }).select();
          
          if(error) throw error;

          if (data) {
              const created = data[0];
              const newConn = { ...conn, id: created.id };
              setConnections([...connections, newConn]);
          }
      } catch (e) {
          console.error(e);
          alert("Error al guardar conexión.");
      }
  };

  const handleRemoveConnection = async (id: string) => {
      try {
        const { error } = await supabase.from('odoo_connections').delete().eq('id', id);
        if (error) throw error;
        setConnections(connections.filter(c => c.id !== id));
      } catch(e) {
          console.error(e);
          alert("Error al eliminar conexión.");
      }
  };

  const handleUpdateConnectionStatus = async (id: string, status: 'CONNECTED' | 'ERROR', mode?: 'REAL' | 'MOCK', companies?: OdooCompany[]) => {
      setConnections(connections.map(c => 
          c.id === id 
          ? { 
              ...c, 
              status, 
              connectionMode: mode, 
              lastCheck: new Date().toLocaleString(),
              companies: companies || c.companies || [] // Update companies list if provided
            } 
          : c
      ));
      
      const updatePayload: any = {
          status: status,
          last_check: new Date().toISOString()
      };

      // Only update metadata if we actually got companies back
      if (companies && companies.length > 0) {
          updatePayload.companies_metadata = companies;
      }

      await supabase.from('odoo_connections').update(updatePayload).eq('id', id);
  };

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
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB]">
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
        <header className="h-16 flex items-center justify-between px-6 z-20 bg-white border-b border-gray-200">
          
          {/* Left: Search & Connection Context */}
          <div className="flex items-center space-x-6">
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-odoo-primary md:hidden">
                <Menu />
            </button>
            
            <div className="relative group">
               <button className="flex items-center space-x-3 text-gray-700 hover:text-odoo-primary transition-colors font-medium text-sm">
                   <div className="p-1.5 bg-gray-100 rounded-lg">
                     <Building size={16} className="text-odoo-primary" />
                   </div>
                   <div className="text-left">
                       <span className="block">{selectedConnection ? selectedConnection.name : 'Seleccionar Conexión'}</span>
                   </div>
                   <ChevronDown size={14} className="text-gray-400" />
               </button>
               {/* Dropdown */}
               <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl hidden group-hover:block z-20 p-1">
                   {availableConnections.length > 0 ? availableConnections.map(c => (
                       <div 
                        key={c.id} 
                        className={`p-2 hover:bg-gray-50 cursor-pointer rounded-md transition-colors ${selectedConnection?.id === c.id ? 'bg-odoo-primary/5 text-odoo-primary' : ''}`}
                        onClick={() => setSelectedConnection(c)}
                       >
                           <div className="font-medium text-sm">{c.name}</div>
                           <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                               <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                               {c.db}
                           </div>
                       </div>
                   )) : (
                     <div className="p-3 text-sm text-gray-400 text-center italic">No hay conexiones disponibles</div>
                   )}
               </div>
            </div>

            {/* DEMO MODE BANNER for active connection */}
            {selectedConnection?.connectionMode === 'MOCK' && (
                <div className="hidden md:flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 animate-pulse">
                    <AlertTriangle size={12} />
                    <span>MODO DEMO (Sin conexión Real)</span>
                </div>
            )}
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center space-x-4">
             <div className="relative">
                 <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3"
                 >
                     <div className={`w-8 h-8 rounded-full ${session.role === 'ADMIN' ? 'bg-odoo-secondary' : 'bg-odoo-primary'} text-white flex items-center justify-center font-bold text-xs`}>
                         {session.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div className="hidden md:block text-left">
                         <p className="text-sm font-bold text-gray-800 leading-none mb-0.5">{session.name}</p>
                         <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{session.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
                     </div>
                     <ChevronDown size={14} className="text-gray-400" />
                 </button>
                 
                 {isProfileOpen && (
                   <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
                        Cerrar Sesión
                      </button>
                   </div>
                 )}
             </div>
          </div>
        </header>

        {/* Dynamic Content View */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
           <div className="max-w-[1600px] mx-auto">
               {currentView === ViewMode.DASHBOARD && (
                   <Dashboard 
                       kpis={MOCK_KPIS} 
                       salesData={MOCK_SALES_DATA} 
                       topProducts={MOCK_TOP_PRODUCTS}
                       inventory={MOCK_INVENTORY}
                       activeConnection={selectedConnection} 
                   />
               )}
               {currentView === ViewMode.INVENTORY && (
                   <InventoryView items={MOCK_INVENTORY} />
               )}
               {currentView === ViewMode.PRODUCTS && (
                   <ProductAnalysis products={MOCK_TOP_PRODUCTS} />
               )}
               {currentView === ViewMode.AGENDA && (
                   <AgendaModule connection={selectedConnection} />
               )}
               {currentView === ViewMode.CUSTOMERS && (
                   <CustomerView customers={MOCK_CUSTOMERS} />
               )}
               {currentView === ViewMode.CLIENT_MANAGEMENT && session.role === 'ADMIN' && (
                  <ClientManagement 
                    clients={clients} 
                    connections={connections} 
                    onCreateClient={handleCreateClient}
                    onDeleteClient={handleDeleteClient}
                    onSimulateLogin={handleClientLogin}
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
               {currentView === ViewMode.REPORTS && (
                   <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                       <Building size={48} className="text-gray-300 mb-4" />
                       <h3 className="text-lg font-bold text-gray-600">Módulo de Reportes</h3>
                       <p>Seleccione un tipo de reporte para generar.</p>
                   </div>
               )}
           </div>
        </main>
      </div>
    </div>
  );
}
