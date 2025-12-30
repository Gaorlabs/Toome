
import React, { useState } from 'react';
import { ClientAccess, OdooConnection, AppModule } from '../types';
import { Plus, Trash2, Copy, Shield, Database, RefreshCw, CheckSquare, Square, Package, TrendingUp, ShoppingCart, FileText, LayoutDashboard, Building2, ChevronRight, ChevronDown, Calendar } from 'lucide-react';

interface ClientManagementProps {
  clients: ClientAccess[];
  connections: OdooConnection[]; // Now receiving real Odoo Connections with Companies
  onCreateClient: (client: Omit<ClientAccess, 'id' | 'createdAt'>) => void;
  onDeleteClient: (id: string) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, connections, onCreateClient, onDeleteClient }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]); // Tracking selected Company IDs
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(['DASHBOARD']);
  
  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CL-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };
  
  const [generatedKey, setGeneratedKey] = useState(generateKey());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Derived: Find which connection IDs are relevant based on selected companies
    const assignedConnIds = connections
        .filter(conn => conn.companies.some(comp => selectedCompanyIds.includes(comp.id)))
        .map(conn => conn.id);

    onCreateClient({
      name: newClientName,
      accessKey: generatedKey,
      assignedConnectionIds: assignedConnIds,
      allowedCompanyIds: selectedCompanyIds,
      allowedModules: selectedModules
    });
    // Reset Form
    setNewClientName('');
    setSelectedCompanyIds([]);
    setSelectedModules(['DASHBOARD']);
    setGeneratedKey(generateKey());
    setShowForm(false);
  };

  const toggleCompany = (companyId: string) => {
    if (selectedCompanyIds.includes(companyId)) {
      setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== companyId));
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, companyId]);
    }
  };

  const toggleAllCompaniesInConnection = (connection: OdooConnection) => {
      const allIds = connection.companies.map(c => c.id);
      const allSelected = allIds.every(id => selectedCompanyIds.includes(id));

      if (allSelected) {
          // Deselect all
          setSelectedCompanyIds(selectedCompanyIds.filter(id => !allIds.includes(id)));
      } else {
          // Select all (merge uniquely)
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
          <p className="text-gray-500 text-sm">Crea perfiles con acceso limitado a compañías específicas.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-odoo-primary hover:bg-odoo-dark text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-odoo-primary/20 mb-6">
          <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-2">Configurar Perfil Multi-Compañía</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave de Acceso (Auto-generada)</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={generatedKey}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2.5 font-mono text-odoo-secondary font-bold"
                  />
                  <button 
                    type="button"
                    onClick={() => setGeneratedKey(generateKey())}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-300"
                    title="Regenerar clave"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Assignment Tree */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                 <Database size={16} /> 
                 Selección de Compañías (Scope de Datos)
              </label>
              
              <div className="grid grid-cols-1 gap-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  {connections.map(conn => (
                      <div key={conn.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          {/* Connection Header */}
                          <div className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${conn.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className="font-bold text-sm text-gray-700">{conn.name}</span>
                                  <span className="text-xs text-gray-400">({conn.db})</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => toggleAllCompaniesInConnection(conn)}
                                className="text-xs text-odoo-secondary font-medium hover:underline"
                              >
                                  Seleccionar Todo
                              </button>
                          </div>
                          
                          {/* Companies List */}
                          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {conn.companies.map(comp => {
                                  const isSelected = selectedCompanyIds.includes(comp.id);
                                  return (
                                      <div 
                                        key={comp.id}
                                        onClick={() => toggleCompany(comp.id)}
                                        className={`
                                            cursor-pointer flex items-center p-2 rounded-md transition-all border
                                            ${isSelected ? 'bg-odoo-primary/5 border-odoo-primary/30' : 'hover:bg-gray-50 border-transparent'}
                                        `}
                                      >
                                          <div className={`
                                              w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors
                                              ${isSelected ? 'bg-odoo-primary border-odoo-primary text-white' : 'border-gray-300 bg-white'}
                                          `}>
                                              {isSelected && <CheckSquare size={10} />}
                                          </div>
                                          <div>
                                              <span className={`text-sm ${isSelected ? 'font-semibold text-odoo-primary' : 'text-gray-600'}`}>{comp.name}</span>
                                          </div>
                                      </div>
                                  )
                              })}
                              {conn.companies.length === 0 && (
                                  <div className="p-2 text-xs text-gray-400 italic">No se detectaron compañías en esta base de datos.</div>
                              )}
                          </div>
                      </div>
                  ))}
                  {connections.length === 0 && (
                      <div className="text-center p-4 text-gray-400 italic">No hay bases de datos conectadas.</div>
                  )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                  * El usuario solo podrá ver datos de las compañías seleccionadas. Si selecciona compañías de diferentes bases de datos, podrá alternar entre ellas en el Dashboard.
              </p>
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
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={!newClientName || selectedCompanyIds.length === 0}
                className="px-6 py-2 bg-odoo-secondary hover:bg-teal-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Cliente
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
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente / Rol</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Clave</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Compañías Asignadas</th>
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
                    {/* Helper to show companies grouped by DB */}
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
                            </div>
                        )
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1 max-w-xs">
                         {client.allowedModules.map(mod => {
                             // Map ID to Label for display
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
                  <button 
                    onClick={() => onDeleteClient(client.id)}
                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No hay clientes configurados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
