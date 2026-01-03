
import React, { useState, useEffect, useRef } from 'react';
import { ClientAccess, OdooConnection, AppModule, PosConfig } from '../types';
import { Plus, Trash2, Copy, Shield, Database, RefreshCw, CheckSquare, Square, Package, TrendingUp, ShoppingCart, FileText, LayoutDashboard, Calendar, LogIn, Edit2, Store, AlertCircle, AlertTriangle, ArrowRight, Users, MoreHorizontal, Link } from 'lucide-react';
import { fetchPosConfigs } from '../services/odooBridge';

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
  
  const dataLoadedRef = useRef(false);

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CL-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };
  
  const [generatedKey, setGeneratedKey] = useState(generateKey());

  const loadPos = async (force = false) => {
      if (dataLoadedRef.current && !force) return;
      const connectedConns = connections.filter(c => c.status === 'CONNECTED');
      if (connectedConns.length === 0) return;

      setLoadingPos(true);
      setPosError(null);
      
      const newConfigs: Record<string, PosConfig[]> = {};
      let hasError = false;
      
      for (const conn of connectedConns) {
          try {
            const configs = await fetchPosConfigs(conn);
            if (configs !== null) {
                newConfigs[conn.id] = configs;
            } else {
                if (availablePos[conn.id]) {
                    newConfigs[conn.id] = availablePos[conn.id];
                }
                hasError = true;
            }
          } catch (e) {
              console.error("Failed to load POS for " + conn.name);
              hasError = true;
          }
      }

      setAvailablePos(prev => ({ ...prev, ...newConfigs }));
      setLoadingPos(false);
      dataLoadedRef.current = true;
      
      if (hasError) setPosError("Algunas cajas no pudieron sincronizarse. Verifica la conexión Odoo.");
  };

  useEffect(() => {
      if (connections.length > 0) {
          loadPos();
      }
  }, [connections.length]); 

  const resetForm = () => {
    setNewClientName('');
    setSelectedCompanyKeys([]);
    setSelectedPosKeys([]);
    setSelectedModules(['DASHBOARD']);
    setGeneratedKey(generateKey());
    setEditingClient(null);
    setShowForm(false);
  };

  // Helper to convert DB IDs (numbers/strings) to Composite Keys based on available connections
  const hydrateSelection = (client: ClientAccess) => {
      // Reconstruct composite keys. 
      // NOTE: This assumes collisions exist and selects ALL matches across connections.
      // This is unavoidable without changing DB schema, but prevents UI glitching during edit.
      const compKeys: string[] = [];
      const posKeys: string[] = [];

      connections.forEach(conn => {
          // Check Companies
          conn.companies.forEach(c => {
              if (client.allowedCompanyIds.includes(c.id)) {
                  compKeys.push(`${conn.id}-${c.id}`);
              }
          });
          // Check POS
          const connPos = availablePos[conn.id] || [];
          connPos.forEach(p => {
              if (client.allowedPosIds?.includes(p.id)) {
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
      hydrateSelection(client);
      setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Flatten Composite Keys back to simple IDs for DB
    const finalCompanyIds = [...new Set(selectedCompanyKeys.map(k => k.split('-')[1]))];
    // Filter connections: A connection is assigned if at least one of its companies is selected
    const assignedConnIds = connections
        .filter(conn => {
            return selectedCompanyKeys.some(k => k.startsWith(`${conn.id}-`));
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
    if (selectedCompanyKeys.includes(key)) {
        // Deselecting a company also deselects its POSs
        setSelectedCompanyKeys(selectedCompanyKeys.filter(k => k !== key));
        setSelectedPosKeys(selectedPosKeys.filter(k => !k.startsWith(`${connId}-`))); // Remove POS from this connection only?
        // Wait, if company is removed, we should remove its child POS. 
        // POS are mapped to company in UI.
    } else {
      setSelectedCompanyKeys([...selectedCompanyKeys, key]);
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

  const toggleAllCompaniesInConnection = (connection: OdooConnection) => {
      const allKeys = connection.companies.map(c => `${connection.id}-${c.id}`);
      const allSelected = allKeys.every(k => selectedCompanyKeys.includes(k));

      if (allSelected) {
          setSelectedCompanyKeys(selectedCompanyKeys.filter(k => !allKeys.includes(k)));
          // Should we remove POS too? Yes.
          setSelectedPosKeys(selectedPosKeys.filter(k => !k.startsWith(`${connection.id}-`)));
      } else {
          // Add missing
          const newSet = new Set([...selectedCompanyKeys, ...allKeys]);
          setSelectedCompanyKeys(Array.from(newSet));
      }
  };

  const toggleModule = (module: AppModule) => {
    if (selectedModules.includes(module)) {
      setSelectedModules(selectedModules.filter(m => m !== module));
    } else {
      setSelectedModules([...selectedModules, module]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
                    onClick={() => loadPos(true)} 
                    className="text-xs text-odoo-primary flex items-center gap-1 hover:underline"
                    disabled={loadingPos}
                  >
                    <RefreshCw size={12} className={loadingPos ? 'animate-spin' : ''} /> Actualizar Cajas
                  </button>
              </div>
              
              {loadingPos && <p className="text-xs text-gray-500 mb-2 animate-pulse">Sincronizando configuración de cajas...</p>}
              {posError && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertCircle size={12}/> {posError}</p>}

              {connections.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                      <Database size={32} className="mx-auto text-gray-300 mb-2"/>
                      <p className="text-sm text-gray-500">No tienes conexiones a Odoo configuradas.</p>
                      <p className="text-xs text-gray-400">Ve a "Conexiones Odoo" para agregar tu primera base de datos.</p>
                  </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    {connections.map(conn => (
                        <div key={conn.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            {/* Connection Header */}
                            <div className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${conn.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="font-bold text-sm text-gray-700">{conn.name}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => toggleAllCompaniesInConnection(conn)}
                                  className="text-xs text-odoo-secondary font-medium hover:underline"
                                  disabled={conn.companies.length === 0}
                                >
                                    Sel. Todas Cias.
                                </button>
                            </div>
                            
                            {/* Companies & POS List */}
                            <div className="p-3">
                                {conn.companies.length === 0 ? (
                                    <div className="flex items-center gap-3 bg-yellow-50 text-yellow-800 p-3 rounded-md border border-yellow-200">
                                        <AlertTriangle size={20} className="flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold">Sin información de compañías</p>
                                            <p className="text-[10px]">
                                                Debes probar la conexión en el módulo "Conexiones Odoo" para descargar la lista de sedes.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                    {conn.companies.map(comp => {
                                        const compKey = `${conn.id}-${comp.id}`;
                                        const isSelected = selectedCompanyKeys.includes(compKey);
                                        
                                        // Find POS for this company safely
                                        const companyPos = availablePos[conn.id]?.filter(p => {
                                          if (!p.company_id) return false;
                                          const pCompId = Array.isArray(p.company_id) ? p.company_id[0] : p.company_id;
                                          return String(pCompId) === String(comp.id);
                                        }) || [];

                                        return (
                                            <div key={compKey} className={`border rounded-md p-2 transition-colors ${isSelected ? 'bg-white border-odoo-primary/30 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
                                                {/* Company Checkbox */}
                                                <div 
                                                  onClick={() => toggleCompany(conn.id, comp.id)}
                                                  className={`cursor-pointer flex items-center mb-2`}
                                                >
                                                    <div className={`
                                                        w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors
                                                        ${isSelected ? 'bg-odoo-primary border-odoo-primary text-white' : 'border-gray-300 bg-white'}
                                                    `}>
                                                        {isSelected && <CheckSquare size={10} />}
                                                    </div>
                                                    <span className={`text-sm ${isSelected ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                                                        {comp.name}
                                                    </span>
                                                </div>

                                                {/* Nested POS List - Only show if company selected */}
                                                {isSelected && (
                                                    <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-1">
                                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Cajas Disponibles:</p>
                                                        {companyPos.length > 0 ? companyPos.map(pos => {
                                                            const posKey = `${conn.id}-${pos.id}`;
                                                            const isPosSelected = selectedPosKeys.includes(posKey);
                                                            return (
                                                                <div 
                                                                  key={posKey} 
                                                                  onClick={() => togglePos(conn.id, pos.id)}
                                                                  className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded group"
                                                                >
                                                                    <div className={`w-3 h-3 rounded-sm border mr-2 flex items-center justify-center transition-all ${isPosSelected ? 'bg-odoo-secondary border-odoo-secondary scale-110' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                        {isPosSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Store size={12} className={isPosSelected ? 'text-odoo-secondary' : 'text-gray-400'} />
                                                                        <span className={`text-xs ${isPosSelected ? 'text-gray-800 font-bold' : 'text-gray-600'}`}>{pos.name}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <p className="text-[10px] text-orange-400 italic">
                                                                {loadingPos ? 'Buscando...' : 'No se detectaron cajas.'}
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
                    ))}
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
                            onClick={() => toggleModule(mod.id)}
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
                disabled={!newClientName || selectedCompanyKeys.length === 0}
                className="px-6 py-2 bg-odoo-secondary hover:bg-teal-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List - Table for Desktop */}
      {/* ... (Existing table code remains unchanged) ... */}
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
                    <button onClick={() => copyToClipboard(client.accessKey)} className="text-gray-400 hover:text-odoo-primary">
                      <Copy size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {connections.map(conn => {
                        const clientCompaniesInThisConn = conn.companies.filter(c => client.allowedCompanyIds.includes(c.id));
                        if (clientCompaniesInThisConn.length === 0) return null;
                        
                        return (
                            <div key={conn.id} className="mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{conn.name}:</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {clientCompaniesInThisConn.map(c => (
                                        <span key={c.id} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5 ml-1">
                                    {client.allowedPosIds && client.allowedPosIds.length > 0 
                                      ? `${client.allowedPosIds.length} cajas permitidas` 
                                      : 'Todas las cajas'}
                                </div>
                            </div>
                        )
                    })}
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
                        onClick={() => startEdit(client)}
                        className="text-gray-500 hover:text-white hover:bg-gray-500 p-2 rounded-full transition-colors"
                        title="Editar Cliente"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onSimulateLogin(client.accessKey)}
                        className="text-odoo-primary hover:text-white hover:bg-odoo-primary p-2 rounded-full transition-colors"
                        title="Simular Sesión"
                      >
                        <LogIn size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteClient(client.id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={18} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                        No hay clientes configurados. Crea uno nuevo para empezar.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Clients List - Mobile (Card/Kanban Style) */}
      <div className="md:hidden space-y-4">
          {clients.map(client => (
              <div key={client.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 active:scale-[0.99] transition-transform">
                  
                  {/* Top Row: Avatar & Name */}
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-odoo-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-800 text-lg">{client.name}</h4>
                              <span className="text-xs text-gray-400">Cliente / Rol</span>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => startEdit(client)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full"
                          >
                              <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteClient(client.id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </div>

                  {/* Access Key Section */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100 flex items-center justify-between">
                      <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Clave de Acceso</span>
                          <code className="text-base font-mono font-bold text-odoo-secondary tracking-wide">{client.accessKey}</code>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(client.accessKey)} 
                        className="p-2 bg-white rounded-lg text-gray-400 shadow-sm border border-gray-100 active:bg-gray-50"
                      >
                          <Copy size={18} />
                      </button>
                  </div>

                  {/* Tags Sections */}
                  <div className="space-y-3 mb-4">
                      <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Conexiones & Sedes</span>
                          <div className="flex flex-wrap gap-1.5">
                              {connections.map(conn => {
                                  const clientCompanies = conn.companies.filter(c => client.allowedCompanyIds.includes(c.id));
                                  if (clientCompanies.length === 0) return null;
                                  return clientCompanies.map(c => (
                                      <span key={c.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200 font-medium">
                                          {c.name}
                                      </span>
                                  ));
                              })}
                              {client.allowedCompanyIds.length === 0 && <span className="text-xs text-gray-400 italic">Sin asignar</span>}
                          </div>
                      </div>
                      <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Módulos</span>
                          <div className="flex flex-wrap gap-1.5">
                              {client.allowedModules.map(mod => {
                                  const label = availableModules.find(m => m.id === mod)?.label.split(' / ')[0] || mod;
                                  return (
                                      <span key={mod} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md text-xs font-bold">
                                          {label}
                                      </span>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  {/* Primary Action */}
                  <button 
                    onClick={() => onSimulateLogin(client.accessKey)}
                    className="w-full bg-odoo-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-odoo-primary/20 active:scale-95 transition-transform"
                  >
                      <LogIn size={20} />
                      Simular Inicio de Sesión
                  </button>
              </div>
          ))}
          {clients.length === 0 && (
              <div className="text-center py-10 px-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-400">No hay clientes creados.</p>
                  <p className="text-xs text-gray-400 mt-1">Toca el botón "+" arriba para añadir uno.</p>
              </div>
          )}
      </div>
    </div>
  );
};
