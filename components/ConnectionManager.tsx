
import React, { useState } from 'react';
import { OdooConnection, OdooCompany } from '../types';
import { Plus, Database, Globe, User, Key, CheckCircle, XCircle, Loader2, Trash2, Power, AlertTriangle, AlertOctagon, PlayCircle, ShieldCheck, ShoppingBag } from 'lucide-react';
import { testOdooConnection } from '../services/odooBridge';

interface ConnectionManagerProps {
  connections: OdooConnection[];
  onAddConnection: (conn: OdooConnection) => void;
  onRemoveConnection: (id: string) => void;
  onUpdateStatus: (id: string, status: 'CONNECTED' | 'ERROR', mode?: 'REAL' | 'MOCK', companies?: OdooCompany[]) => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({ connections, onAddConnection, onRemoveConnection, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(connections.length === 0);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    url: '',
    db: '',
    user: '',
    apiKey: ''
  });

  const isMixedContent = (url: string) => {
      return window.location.protocol === 'https:' && url.startsWith('http:');
  };

  const isLocalhost = (url: string) => {
      return url.includes('localhost') || url.includes('127.0.0.1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addConnection(form);
  };

  const addConnection = (data: typeof form, isDemo = false) => {
    const newConn: OdooConnection = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: isDemo ? 'CONNECTED' : 'PENDING',
      connectionMode: isDemo ? 'MOCK' : 'REAL',
      lastCheck: isDemo ? new Date().toLocaleString() : null,
      companies: isDemo ? [
          { id: '1', name: 'Compañía Demo 1', currency: 'USD' },
          { id: '2', name: 'Sucursal Demo Norte', currency: 'PEN' }
      ] : []
    };
    onAddConnection(newConn);
    setForm({ name: '', url: '', db: '', user: '', apiKey: '' });
    setShowForm(false);
  };

  const createDemoConnection = () => {
      addConnection({
          name: 'Demo Odoo (Datos Prueba)',
          url: 'https://demo.odoo.com',
          db: 'demo_db',
          user: 'demo@demo.com',
          apiKey: 'demo123'
      }, true);
  };

  const createFacturaClicConnection = () => {
      addConnection({
          name: 'Mi Tienda (FacturaClic)',
          url: 'https://mitienda.facturaclic.pe/',
          db: 'mitienda_base_ac',
          user: 'soporte@facturaclic.pe',
          apiKey: '3e77f817d6cc51db9ba2c503f8e86a8c0650329e'
      }, false);
  };

  const createVidaConnection = () => {
      addConnection({
          name: 'Vida (FacturaClic)',
          url: 'https://vida.facturaclic.pe/',
          db: 'vida_master',
          user: 'soporte@facturaclic.pe',
          apiKey: '7a823daf061832dd8f01876a714da94f7e9c9355'
      }, false);
  };

  const testConnection = async (connection: OdooConnection) => {
    setTesting(connection.id);
    setLastError(null);
    setLastSuccess(null);
    
    // Llamada real al puente XML-RPC directo
    const { success, mode, companies, error } = await testOdooConnection(connection);
    
    if (!success) {
        setLastError(error || "Falló la conexión. Verifica URL, DB y Credenciales.");
    } else {
        setLastSuccess(`Conexión exitosa. Se detectaron ${companies.length} compañías.`);
    }

    onUpdateStatus(connection.id, success ? 'CONNECTED' : 'ERROR', mode, companies);
    setTesting(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Conexiones Odoo</h2>
          <p className="text-gray-500 text-sm">Gestiona tus instancias ERP para alimentar el dashboard.</p>
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <button 
                onClick={createFacturaClicConnection}
                className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-colors text-xs"
            >
                <ShoppingBag size={14} />
                <span>FacturaClic</span>
            </button>
            <button 
                onClick={createVidaConnection}
                className="bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-colors text-xs"
            >
                <ShoppingBag size={14} />
                <span>Vida</span>
            </button>
            <button 
                onClick={createDemoConnection}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-xs hidden sm:flex"
            >
                <PlayCircle size={14} className="text-gray-400" />
                <span>Crear Demo</span>
            </button>
            <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-odoo-secondary hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
            <Plus size={18} />
            <span>Nueva Conexión</span>
            </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-odoo-secondary/20 mb-6 animate-slide-up">
          <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
            <Database size={20} className="text-odoo-secondary"/>
            Configurar Nueva Instancia
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Identificativo</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-odoo-secondary focus:border-odoo-secondary"
                  placeholder="Ej: Farmacia Principal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Instancia (XML-RPC)</label>
                <div className="relative">
                    <Globe size={16} className="absolute top-3 left-3 text-gray-400" />
                    <input 
                    type="url" 
                    value={form.url}
                    onChange={(e) => setForm({...form, url: e.target.value})}
                    className={`w-full border rounded-lg pl-9 p-2.5 focus:ring-odoo-secondary focus:border-odoo-secondary ${isMixedContent(form.url) || isLocalhost(form.url) ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="https://mi-farmacia.odoo.com"
                    required
                    />
                </div>
                {isMixedContent(form.url) && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold flex items-center gap-1">
                        <AlertTriangle size={10} /> Error: No puedes conectar un Odoo HTTP desde una web HTTPS.
                    </p>
                )}
                {isLocalhost(form.url) && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold flex items-center gap-1">
                        <AlertTriangle size={10} /> Localhost no es accesible desde internet (necesitas Ngrok).
                    </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base de Datos</label>
                <div className="relative">
                    <Database size={16} className="absolute top-3 left-3 text-gray-400" />
                    <input 
                    type="text" 
                    value={form.db}
                    onChange={(e) => setForm({...form, db: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 focus:ring-odoo-secondary focus:border-odoo-secondary"
                    placeholder="nombre_db"
                    required
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Email)</label>
                <div className="relative">
                    <User size={16} className="absolute top-3 left-3 text-gray-400" />
                    <input 
                    type="text" 
                    value={form.user}
                    onChange={(e) => setForm({...form, user: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 focus:ring-odoo-secondary focus:border-odoo-secondary"
                    placeholder="admin@farmacia.com"
                    required
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Contraseña</label>
                <div className="relative">
                    <Key size={16} className="absolute top-3 left-3 text-gray-400" />
                    <input 
                    type="password" 
                    value={form.apiKey}
                    onChange={(e) => setForm({...form, apiKey: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 focus:ring-odoo-secondary focus:border-odoo-secondary"
                    placeholder="••••••••••••"
                    required
                    />
                </div>
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
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-bold transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Messages */}
      {lastError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in shadow-sm">
              <AlertOctagon size={24} className="flex-shrink-0" />
              <div className="flex-1">
                  <p className="text-sm font-bold">Error de Conexión</p>
                  <p className="text-xs break-all">{lastError}</p>
              </div>
              <button onClick={() => setLastError(null)} className="text-red-400 hover:text-red-700"><XCircle size={18} /></button>
          </div>
      )}
      {lastSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in shadow-sm">
              <CheckCircle size={24} className="flex-shrink-0" />
              <div className="flex-1">
                  <p className="text-sm font-bold">¡Conexión Exitosa!</p>
                  <p className="text-xs">{lastSuccess}</p>
              </div>
              <button onClick={() => setLastSuccess(null)} className="text-green-400 hover:text-green-700"><XCircle size={18} /></button>
          </div>
      )}

      {/* Connection List */}
      <div className="grid grid-cols-1 gap-6">
        {connections.map(conn => (
            <div key={conn.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                <div className={`w-2 md:w-auto md:min-w-[8px] ${conn.status === 'CONNECTED' ? 'bg-green-500' : conn.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {conn.name}
                                {conn.status === 'CONNECTED' && <CheckCircle size={18} className="text-green-500" />}
                                {conn.status === 'ERROR' && <XCircle size={18} className="text-red-500" />}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Globe size={12}/> {conn.url}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                conn.status === 'CONNECTED' ? 'bg-green-100 text-green-700 border-green-200' :
                                conn.status === 'ERROR' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                                {conn.connectionMode === 'MOCK' ? 'MODO DEMO' : conn.status === 'CONNECTED' ? 'ONLINE' : conn.status === 'ERROR' ? 'OFFLINE' : 'PENDIENTE'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Base de Datos</p>
                            <p className="font-medium text-gray-700 truncate" title={conn.db}>{conn.db}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Usuario</p>
                            <p className="font-medium text-gray-700 truncate" title={conn.user}>{conn.user}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">API Key</p>
                            <p className="font-medium text-gray-700 font-mono">••••{conn.apiKey.slice(-3)}</p>
                        </div>
                         <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Compañías</p>
                            <p className="font-medium text-gray-700">
                                {conn.companies?.length > 0 ? `${conn.companies.length} disp.` : '-'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 flex md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-200">
                    <button 
                        onClick={() => testConnection(conn)}
                        disabled={testing === conn.id}
                        className={`flex-1 flex items-center justify-center gap-2 border px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-sm
                            ${testing === conn.id ? 'bg-gray-100 text-gray-500 cursor-wait' : 'bg-white text-gray-700 hover:text-odoo-primary hover:border-odoo-primary'}
                        `}
                    >
                        {testing === conn.id ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                        <span>{testing === conn.id ? 'Probando...' : 'Conectar'}</span>
                    </button>
                    <button 
                        onClick={() => onRemoveConnection(conn.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-red-500 hover:text-red-500 text-gray-700 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                        <Trash2 size={16} />
                        <span>Borrar</span>
                    </button>
                </div>
            </div>
        ))}

        {connections.length === 0 && !showForm && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <Database size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No hay conexiones configuradas</h3>
                <p className="text-sm text-gray-400 mt-2">Agrega tu primera instancia Odoo para comenzar.</p>
                <div className="flex justify-center gap-4 mt-6">
                    <button 
                        onClick={createFacturaClicConnection}
                        className="text-indigo-600 font-bold hover:underline text-sm"
                    >
                        + Demo FacturaClic
                    </button>
                    <button 
                        onClick={() => setShowForm(true)}
                        className="text-odoo-secondary font-bold hover:underline text-sm"
                    >
                        + Conexión Personalizada
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
