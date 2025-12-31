
import React, { useState, useEffect } from 'react';
import { ClientAccess, OdooConnection, AppModule, PosConfig } from '../types';
import { Plus, Trash2, Copy, Shield, Database, RefreshCw, CheckSquare, Square, Package, TrendingUp, ShoppingCart, FileText, LayoutDashboard, Calendar, LogIn, Edit2, Store } from 'lucide-react';
import { fetchPosConfigs } from '../services/odooBridge';

interface ClientManagementProps {
  clients: ClientAccess[];
  connections: OdooConnection[]; 
  onCreateClient: (client: Omit<ClientAccess, 'id' | 'createdAt'>) => void;
  onDeleteClient: (id: string) => void;
  onSimulateLogin: (key: string) => void;
  onUpdateClient?: (id: string, updates: Partial<ClientAccess>) => void; // New prop for updating
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, connections, onCreateClient, onDeleteClient, onSimulateLogin, onUpdateClient }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientAccess | null>(null);
  
  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedPosIds, setSelectedPosIds] = useState<number[]>([]); // New: Specific POS selection
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(['DASHBOARD']);
  
  // Available POS fetched from connections
  const [availablePos, setAvailablePos] = useState<Record<string, PosConfig[]>>({}); // Map connectionId -> POS[]
  const [loadingPos, setLoadingPos] = useState(false);

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CL-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };
  
  const [generatedKey, setGeneratedKey] = useState(generateKey());

  // Load POS configurations when connections change or component mounts
  useEffect(() => {
      const loadPos = async () => {
          setLoadingPos(true);
          const posMap: Record<string, PosConfig[]> = {};
          
          for (const conn of connections) {
              if (conn.status === 'CONNECTED') {
                  const configs = await fetchPosConfigs(conn);
                  posMap[conn.id] = configs;
              }
          }
          setAvailablePos(posMap);
          setLoadingPos(false);
      };
      
      if (connections.length > 0) {
          loadPos();
      }
  }, [connections]);

  const resetForm = () => {
    setNewClientName('');
    setSelectedCompanyIds([]);
    setSelectedPosIds([]);
    setSelectedModules(['DASHBOARD']);
    setGeneratedKey(generateKey());
    setEditingClient(null);
    setShowForm(false);
  };

  const startEdit = (client: ClientAccess) => {
      setEditingClient(client);
      setNewClientName(client.name);
      setGeneratedKey(client.accessKey); // Preserve key
      setSelectedCompanyIds(client.allowedCompanyIds || []);
      setSelectedPosIds(client.allowedPosIds || []);
      setSelectedModules(client.allowedModules || []);
      setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find relevant connection IDs based on companies selected
    const assignedConnIds = connections
        .filter(conn => conn.companies.some(comp => selectedCompanyIds.includes(comp.id)))
        .map(conn => conn.id);

    if (editingClient && onUpdateClient) {
        // Update existing
        onUpdateClient(editingClient.id, {
            name: newClientName,
            assignedConnectionIds: assignedConnIds,
            allowedCompanyIds: selectedCompanyIds,
            allowedPosIds: selectedPosIds,
            allowedModules: selectedModules
        });
    } else {
        // Create new
        onCreateClient({
            name: newClientName,
            accessKey: generatedKey,
            assignedConnectionIds: assignedConnIds,
            allowedCompanyIds: selectedCompanyIds,
            allowedPosIds: selectedPosIds,
            allowedModules: selectedModules
        });
    }
    resetForm();
  };

  const toggleCompany = (companyId: string) => {
    if (selectedCompanyIds.includes(companyId)) {
      setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== companyId));
      // Optionally deselect POS belonging to this company? For now, keep simple.
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, companyId]);
    }
  };

  const togglePos = (posId: number) => {
      if (selectedPosIds.includes(posId)) {
          setSelectedPosIds(selectedPosIds.filter(id => id !== posId));
      } else {
          setSelectedPosIds([...selectedPosIds, posId]);
      }
  };

  const toggleAllCompaniesInConnection = (connection: OdooConnection) => {
      const allIds = connection.companies.map(c => c.id);
      const allSelected = allIds.every(id => selectedCompanyIds.includes(id));

      if (allSelected) {
          setSelectedCompanyIds(selectedCompanyIds.filter(id => !allIds.includes(id)));
      } else {
          const newSet = new Set([...selectedCompanyIds, ...allIds]);
          setSelectedCompanyIds(Array.from(newSet));
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
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Accesos</h2>
          <p className="text-gray-500 text-sm">Crea y edita perfiles con acceso limitado a compañías y cajas específicas.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-odoo-primary hover:bg-odoo-dark text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-odoo-primary/20 mb-6">
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
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                 <Database size={16} /> 
                 Selección de Sedes y Cajas (POS)
              </label>
              
              {loadingPos && <p className="text-xs text-gray-500 mb-2 animate-pulse">Cargando cajas disponibles...</p>}

              <div className="grid grid-cols-1 gap-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  {connections.map(conn => (
                      <div key={conn.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                              >
                                  Sel. Todas Cias.
                              </button>
                          </div>
                          
                          {/* Companies & POS List */}
                          <div className="p-3 grid grid-cols-1 gap-4">
                              {conn.companies.map(comp => {
                                  const isSelected = selectedCompanyIds.includes(comp.id);
                                  // Find POS for this company
                                  const companyPos = availablePos[conn.id]?.filter(p => 
                                    Array.isArray(p.company_id) && p.company_id[0].toString() === comp.id
                                  ) || [];

                                  return (
                                      <div key={comp.id} className="border rounded-md p-2">
                                          {/* Company Checkbox */}
                                          <div 
                                            onClick={() => toggleCompany(comp.id)}
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

                                          {/* Nested POS List */}
                                          {isSelected && companyPos.length > 0 && (
                                              <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-1">
                                                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Cajas Disponibles:</p>
                                                  {companyPos.map(pos => {
                                                      const isPosSelected = selectedPosIds.includes(pos.id);
                                                      return (
                                                          <div 
                                                            key={pos.id}
                                                            onClick={() => togglePos(pos.id)}
                                                            className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                                                          >
                                                              <div className={`w-3 h-3 rounded-sm border mr-2 flex items-center justify-center ${isPosSelected ? 'bg-odoo-secondary border-odoo-secondary' : 'border-gray-300'}`}>
                                                                  {isPosSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>}
                                                              </div>
                                                              <div className="flex items-center gap-1">
                                                                  <Store size={12} className="text-gray-400" />
                                                                  <span className="text-xs text-gray-700">{pos.name}</span>
                                                              </div>
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          )}
                                          {isSelected && companyPos.length === 0 && (
                                              <p className="ml-7 text-xs text-gray-400 italic">No se encontraron cajas configuradas.</p>
                                          )}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  ))}
              </div>
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
                                    ? 'border-odoo-secondary bg-odoo-secondary/5 ring-1 ring-odoo-secondary' 
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                disabled={!newClientName || selectedCompanyIds.length === 0}
                className="px-6 py-2 bg-odoo-secondary hover:bg-teal-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
          </tbody>
        </table>
      </div>
    </div>
  );
};
