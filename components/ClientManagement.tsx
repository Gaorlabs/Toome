
import React, { useState, useEffect, useRef } from 'react';
import { ClientAccess, OdooConnection, AppModule, PosConfig } from '../types';
import { Plus, Trash2, Copy, Shield, Database, RefreshCw, CheckSquare, Square, Package, TrendingUp, ShoppingCart, FileText, LayoutDashboard, Calendar, LogIn, Edit2, Store, AlertCircle, AlertTriangle, ArrowRight, Users, MoreHorizontal, Link, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchPosConfigs, testOdooConnection } from '../services/odooBridge';

interface ClientManagementProps {
  clients: ClientAccess[];
  connections: OdooConnection[]; 
  onCreateClient: (client: Omit<ClientAccess, 'id' | 'createdAt'>) => void;
  onDeleteClient: (id: string) => void;
  onSimulateLogin: (key: string) => void;
  onUpdateClient?: (id: string, updates: Partial<ClientAccess>) => void; 
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, connections, onCreateClient, onDeleteClient, onSimulateLogin, onUpdateClient }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientAccess | null>(null);
  
  // Form State
  const [newClientName, setNewClientName] = useState('');
  
  // Use Composite Keys internally: "connId-itemId" to prevent collision
  const [selectedCompanyKeys, setSelectedCompanyKeys] = useState<string[]>([]);
  const [selectedPosKeys, setSelectedPosKeys] = useState<string[]>([]); 
  
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(['DASHBOARD']);
  
  const [availablePos, setAvailablePos] = useState<Record<string, PosConfig[]>>({}); 
  const [loadingPos, setLoadingPos] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);
  
  const [generatedKey, setGeneratedKey] = useState('');

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CL-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  useEffect(() => {
    if (!editingClient) setGeneratedKey(generateKey());
  }, [showForm]);

  const loadPos = async (specificConnId?: string) => {
      setLoadingPos(true);
      setPosError(null);
      
      const connsToLoad = specificConnId 
        ? connections.filter(c => c.id === specificConnId)
        : connections;

      if (connsToLoad.length === 0) {
          setLoadingPos(false);
          return;
      }

      const newConfigs: Record<string, PosConfig[]> = { ...availablePos };
      let errors = 0;
      
      for (const conn of connsToLoad) {
          try {
            console.log(`Intentando cargar POS para: ${conn.name}`);
            const configs = await fetchPosConfigs(conn);
            
            if (configs !== null && configs.length > 0) {
                newConfigs[conn.id] = configs;
            } else if (configs !== null && configs.length === 0) {
                 // Conexión exitosa pero sin cajas (posiblemente usuario sin permisos o base vacía)
                 newConfigs[conn.id] = []; 
            } else {
                 // Error de conexión (null)
                 errors++;
            }
          } catch (e) {
              console.error("Failed to load POS for " + conn.name, e);
              errors++;
          }
      }

      setAvailablePos(newConfigs);
      setLoadingPos(false);
      
      if (errors > 0 && !specificConnId) {
          setPosError(`No se pudo conectar con ${errors} instancia(s). Revisa las credenciales.`);
      }
  };

  // Cargar POS automáticamente al abrir formulario si no se han cargado
  useEffect(() => {
      if (showForm && connections.length > 0) {
          // Solo cargar si no tenemos datos de ninguna conexión
          const hasData = Object.keys(availablePos).length > 0;
          if (!hasData) loadPos();
      }
  }, [showForm, connections.length]); 

  const resetForm = () => {
    setNewClientName('');
    setSelectedCompanyKeys([]);
    setSelectedPosKeys([]);
    setSelectedModules(['DASHBOARD']);
    setGeneratedKey(generateKey());
    setEditingClient(null);
    setShowForm(false);
    setPosError(null);
  };

  const hydrateSelection = (client: ClientAccess) => {
      const compKeys: string[] = [];
      const posKeys: string[] = [];

      connections.forEach(conn => {
          // Check Companies
          if (conn.companies) {
              conn.companies.forEach(c => {
                  // Comparación robusta string/number
                  if (client.allowedCompanyIds && client.allowedCompanyIds.some(id => String(id) === String(c.id))) {
                      compKeys.push(`${conn.id}-${c.id}`);
                  }
              });
          }
          
          // Check POS (Intenta usar lo que hay en memoria, o pre-carga visualmente)
          const connPos = availablePos[conn.id] || [];
          connPos.forEach(p => {
              if (client.allowedPosIds?.some(id => String(id) === String(p.id))) {
                  posKeys.push(`${conn.id}-${p.id}`);
              }
          });
      });

      setSelectedCompanyKeys(compKeys);
      setSelectedPosKeys(posKeys);
  };

  const startEdit = (client: ClientAccess) => {
      setEditingClient(client);
      setNewClientName(client.name);
      setGeneratedKey(client.accessKey); 
      setSelectedModules(client.allowedModules || []);
      // Pre-load POS then hydrate
      loadPos().then(() => hydrateSelection(client));
      setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Flatten Composite Keys back to simple IDs for DB
    const finalCompanyIds = [...new Set(selectedCompanyKeys.map(k => k.split('-')[1]))];
    
    // Asignar conexión si se seleccionó alguna compañía o caja de ella
    const assignedConnIds = connections
        .filter(conn => {
            const hasCompany = selectedCompanyKeys.some(k => k.startsWith(`${conn.id}-`));
            const hasPos = selectedPosKeys.some(k => k.startsWith(`${conn.id}-`));
            return hasCompany || hasPos;
        })
        .map(conn => conn.id);

    const finalPosIds = [...new Set(selectedPosKeys.map(k => parseInt(k.split('-')[1])))];

    if (editingClient && onUpdateClient) {
        onUpdateClient(editingClient.id, {
            name: newClientName,
            assignedConnectionIds: assignedConnIds,
            allowedCompanyIds: finalCompanyIds,
            allowedPosIds: finalPosIds,
            allowedModules: selectedModules
        });
    } else {
        onCreateClient({
            name: newClientName,
            accessKey: generatedKey,
            assignedConnectionIds: assignedConnIds,
            allowedCompanyIds: finalCompanyIds,
            allowedPosIds: finalPosIds,
            allowedModules: selectedModules
        });
    }
    resetForm();
  };

  const toggleCompany = (connId: string, companyId: string) => {
    const key = `${connId}-${companyId}`;
    const isCurrentlySelected = selectedCompanyKeys.includes(key);

    if (isCurrentlySelected) {
        // LÓGICA DE LIMPIEZA: Si deselecciono la compañía, borro todos sus POS seleccionados
        setSelectedCompanyKeys(prev => prev.filter(k => k !== key));
        
        // Buscar POS de esta compañía para removerlos
        const posList = availablePos[connId] || [];
        const posToRemove: string[] = [];
        
        posList.forEach(p => {
            const pCompId = Array.isArray(p.company_id) ? p.company_id[0] : p.company_id;
            if (String(pCompId) === String(companyId)) {
                posToRemove.push(`${connId}-${p.id}`);
            }
        });
        
        if (posToRemove.length > 0) {
            setSelectedPosKeys(prev => prev.filter(k => !posToRemove.includes(k)));
        }

    } else {
      setSelectedCompanyKeys(prev => [...prev, key]);
    }
  };

  const togglePos = (connId: string, posId: number) => {
      const key = `${connId}-${posId}`;
      if (selectedPosKeys.includes(key)) {
          setSelectedPosKeys(selectedPosKeys.filter(k => k !== key));
      } else {
          setSelectedPosKeys([...selectedPosKeys, key]);
      }
  };

  const availableModules: {id: AppModule, label: string, icon: any}[] = [
    { id: 'DASHBOARD', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
    { id: 'INVENTORY', label: 'Inventario / Stock', icon: Package },
    { id: 'AGENDA', label: 'Agenda Profesional', icon: Calendar },
    { id: 'SALES', label: 'Ventas / Cajas', icon: ShoppingCart },
    { id: 'PRODUCTS', label: 'Análisis Productos', icon: TrendingUp },
    { id: 'REPORTS', label: 'Reportes Avanzados', icon: FileText },
    { id: 'STAFF', label: 'Gestión Personal', icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Accesos</h2>
          <p className="text-gray-500 text-sm">Crea y edita perfiles con acceso limitado a compañías y cajas específicas.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-odoo-primary hover:bg-odoo-dark text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-lg"
        >
          <Plus size={18} />
          <span className="hidden md:inline">Nuevo Cliente</span>
          <span className="md:hidden">Nuevo</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-odoo-primary/20 mb-6 animate-slide-up">
          <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-2">
              {editingClient ? 'Editar Perfil de Cliente' : 'Configurar Nuevo Perfil'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente / Rol</label>
                <input 
                  type="text" 
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-odoo-primary focus:border-odoo-primary"
                  placeholder="Ej: Gerente Tienda Norte"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave de Acceso</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={generatedKey}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2.5 font-mono text-odoo-secondary font-bold"
                  />
                  {!editingClient && (
                      <button 
                        type="button"
                        onClick={() => setGeneratedKey(generateKey())}
                        className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-300"
                        title="Regenerar clave"
                      >
                        <RefreshCw size={20} />
                      </button>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Assignment Tree */}
            <div>
              <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                     <Database size={16} /> 
                     Selección de Sedes y Cajas (POS)
                  </label>
                  <button 
                    type="button" 
                    onClick={() => loadPos()} 
                    className="text-xs text-odoo-primary flex items-center gap-1 hover:underline"
                    disabled={loadingPos}
                  >
                    <RefreshCw size={12} className={loadingPos ? 'animate-spin' : ''} /> 
                    {loadingPos ? 'Sincronizando...' : 'Recargar Lista Odoo'}
                  </button>
              </div>
              
              {posError && <p className="text-xs text-red-500 mb-2 flex items-center gap-1 bg-red-50 p-2 rounded"><AlertCircle size={12}/> {posError}</p>}

              {connections.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                      <Database size={32} className="mx-auto text-gray-300 mb-2"/>
                      <p className="text-sm text-gray-500">No tienes conexiones a Odoo configuradas.</p>
                  </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    {connections.map(conn => {
                        const posList = availablePos[conn.id] || [];
                        const isLoadingThis = loadingPos && !posList.length;
                        
                        return (
                        <div key={conn.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            {/* Connection Header */}
                            <div className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${conn.status === 'CONNECTED' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    <span className="font-bold text-sm text-gray-700">{conn.name}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => loadPos(conn.id)}
                                  className="text-xs text-odoo-secondary font-medium hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw size={10} /> Sync
                                </button>
                            </div>
                            
                            {/* Companies & POS List */}
                            <div className="p-3">
                                {(!conn.companies || conn.companies.length === 0) ? (
                                    <div className="flex items-center gap-3 bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-200">
                                        <AlertTriangle size={20} className="flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold">Metadatos pendientes</p>
                                            <p className="text-[10px]">
                                                No se han detectado compañías. Asegúrate de que la conexión Odoo está activa.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                    {conn.companies.map(comp => {
                                        const compKey = `${conn.id}-${comp.id}`;
                                        const isCompSelected = selectedCompanyKeys.includes(compKey);
                                        
                                        // Filtrar POS de esta compañía
                                        const companyPosList = posList.filter(p => {
                                          if (!p.company_id) return false;
                                          const pCompId = Array.isArray(p.company_id) ? p.company_id[0] : p.company_id;
                                          return String(pCompId) === String(comp.id);
                                        });

                                        return (
                                            <div key={compKey} className={`border rounded-md p-2 transition-all ${isCompSelected ? 'bg-white border-odoo-primary/30 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-90'}`}>
                                                {/* Company Checkbox */}
                                                <div 
                                                  onClick={() => toggleCompany(conn.id, comp.id)}
                                                  className={`cursor-pointer flex items-center justify-between mb-2 select-none`}
                                                >
                                                    <div className="flex items-center">
                                                        <div className={`
                                                            w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors
                                                            ${isCompSelected ? 'bg-odoo-primary border-odoo-primary text-white' : 'border-gray-300 bg-white'}
                                                        `}>
                                                            {isCompSelected && <CheckSquare size={10} />}
                                                        </div>
                                                        <span className={`text-sm ${isCompSelected ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                                                            {comp.name}
                                                        </span>
                                                        
                                                        {isCompSelected && (
                                                            <span className="ml-2 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                                                                Incluye todas las cajas ({companyPosList.length})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isCompSelected ? <ChevronDown size={14} className="text-odoo-primary"/> : <ChevronRight size={14} className="text-gray-400"/>}
                                                    </div>
                                                </div>

                                                {/* Nested POS List - SOLO VISIBLE SI LA COMPAÑÍA ESTÁ SELECCIONADA */}
                                                {isCompSelected && (
                                                    <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-1 animate-slide-up">
                                                        {isLoadingThis ? (
                                                            <div className="flex items-center gap-2 text-gray-400 py-1">
                                                                <RefreshCw size={10} className="animate-spin" /> <span className="text-[10px]">Cargando cajas...</span>
                                                            </div>
                                                        ) : companyPosList.length > 0 ? (
                                                            <>
                                                                <p className="text-[10px] text-gray-400 italic mb-1">
                                                                    (Opcional) Desmarca para excluir cajas específicas:
                                                                </p>
                                                                {companyPosList.map(pos => {
                                                                    const posKey = `${conn.id}-${pos.id}`;
                                                                    const isPosExcluded = selectedPosKeys.includes(posKey); 
                                                                    
                                                                    return (
                                                                        <div 
                                                                        key={posKey} 
                                                                        className="flex items-center p-1 rounded group select-none opacity-50 cursor-not-allowed"
                                                                        title="Al seleccionar la compañía, se incluyen todas sus cajas automáticamente."
                                                                        >
                                                                            <div className={`w-3 h-3 rounded-sm border mr-2 flex items-center justify-center bg-gray-200 border-gray-300`}>
                                                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-sm"></div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Store size={12} className="text-gray-400" />
                                                                                <span className="text-xs text-gray-500">{pos.name}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </>
                                                        ) : (
                                                            <p className="text-[10px] text-gray-400 italic">
                                                                Sin cajas disponibles o no sincronizadas.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
              )}
            </div>

            {/* Module Permissions */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                 <Shield size={16} /> 
                 Permisos de Visualización (Módulos)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {availableModules.map(mod => {
                    const Icon = mod.icon;
                    const isSelected = selectedModules.includes(mod.id);
                    return (
                        <div 
                            key={mod.id}
                            onClick={() => {
                                if (isSelected) setSelectedModules(selectedModules.filter(m => m !== mod.id));
                                else setSelectedModules([...selectedModules, mod.id]);
                            }}
                            className={`
                                cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all gap-2
                                ${isSelected 
                                    ? 'border-odoo-secondary bg-odoo-secondary/5 ring-1 ring-odoo-secondary shadow-sm' 
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 opacity-60 grayscale'
                                }
                            `}
                        >
                            <Icon size={24} className={isSelected ? 'text-odoo-secondary' : 'text-gray-400'} />
                            <span className={`text-xs font-medium ${isSelected ? 'text-odoo-secondary' : 'text-gray-600'}`}>{mod.label}</span>
                        </div>
                    );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={!newClientName}
                className="px-6 py-2 bg-odoo-secondary hover:bg-teal-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Clave</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Scope (Cajas)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Módulos</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-odoo-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{client.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded px-2 py-1 w-fit">
                    <code className="text-sm font-mono text-gray-600">{client.accessKey}</code>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {/* Visualización robusta incluso si no hay metadatos cargados en 'connections' */}
                    {client.assignedConnectionIds && client.assignedConnectionIds.length > 0 ? (
                         client.assignedConnectionIds.map(connId => {
                             const conn = connections.find(c => c.id === connId);
                             if (!conn) return null;
                             
                             // Si hay metadatos, mostramos nombres. Si no, mostramos IDs genéricos
                             // SAFEGUARD: Validar que companies exista y sea un array
                             const companies = conn.companies || [];
                             const compNames = companies
                                .filter(c => client.allowedCompanyIds && client.allowedCompanyIds.some(id => String(id) === String(c.id)))
                                .map(c => c.name);
                             
                             return (
                                 <div key={conn.id} className="mb-1">
                                     <span className="text-[10px] font-bold text-gray-400 uppercase">{conn.name}:</span>
                                     <div className="flex flex-wrap gap-1 mt-0.5">
                                         {compNames.length > 0 ? compNames.map((name, i) => (
                                             <span key={i} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">{name}</span>
                                         )) : (
                                            <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                                {client.allowedCompanyIds ? client.allowedCompanyIds.length : 0} Cias
                                            </span>
                                         )}
                                     </div>
                                     <div className="text-[10px] text-gray-400 mt-0.5 ml-1 flex items-center gap-1">
                                         <Store size={10} />
                                         {client.allowedPosIds && client.allowedPosIds.length > 0 
                                           ? `${client.allowedPosIds.length} cajas específicas` 
                                           : 'Todas las cajas'}
                                     </div>
                                 </div>
                             )
                         })
                    ) : (
                        <span className="text-xs text-gray-400 italic">Sin asignación</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1 max-w-xs">
                         {client.allowedModules.map(mod => {
                             const label = availableModules.find(m => m.id === mod)?.label.split(' / ')[0] || mod;
                             return (
                                <span key={mod} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {label}
                                </span>
                             );
                         })}
                     </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onSimulateLogin(client.accessKey)} 
                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                        title="Ingresar como cliente"
                      >
                        <LogIn size={18} />
                      </button>
                      <button onClick={() => startEdit(client)} className="text-gray-500 hover:text-odoo-primary p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDeleteClient(client.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={18} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile View omitted for brevity, assumes standard implementation similar to desktop logic */}
      <div className="md:hidden space-y-4">
        {clients.map(client => (
            <div key={client.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{client.name}</h4>
                    <div className="flex gap-1">
                        <button onClick={() => onSimulateLogin(client.accessKey)} className="p-2 text-blue-500"><LogIn size={16}/></button>
                        <button onClick={() => startEdit(client)} className="p-2 text-gray-500"><Edit2 size={16}/></button>
                    </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{client.accessKey}</span>
                </div>
                <div className="text-xs text-gray-400">
                    {client.allowedCompanyIds ? client.allowedCompanyIds.length : 0} Compañías &bull; {client.allowedPosIds?.length || 'Todas'} Cajas
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
