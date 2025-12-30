import React, { useState } from 'react';
import { OdooConnection } from '../types';
import { Plus, Database, Globe, User, Key, CheckCircle, XCircle, Loader2, Trash2, RefreshCw, Power } from 'lucide-react';

interface ConnectionManagerProps {
  connections: OdooConnection[];
  onAddConnection: (conn: OdooConnection) => void;
  onRemoveConnection: (id: string) => void;
  onUpdateStatus: (id: string, status: 'CONNECTED' | 'ERROR') => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({ connections, onAddConnection, onRemoveConnection, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null); // ID of connection being tested
  
  const [form, setForm] = useState({
    name: '',
    url: '',
    db: '',
    user: '',
    apiKey: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConn: OdooConnection = {
      id: Math.random().toString(36).substr(2, 9),
      ...form,
      status: 'PENDING',
      lastCheck: null
    };
    onAddConnection(newConn);
    setForm({ name: '', url: '', db: '', user: '', apiKey: '' });
    setShowForm(false);
  };

  const testConnection = async (id: string) => {
    setTesting(id);
    
    // SIMULATION OF XML-RPC CALL
    // In a real app, this would call your backend which talks to Odoo via xmlrpc
    setTimeout(() => {
      // Random success/fail for demo purposes
      const success = Math.random() > 0.3; 
      onUpdateStatus(id, success ? 'CONNECTED' : 'ERROR');
      setTesting(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Conexiones Odoo</h2>
          <p className="text-gray-500 text-sm">Gestiona las instancias y bases de datos conectadas a la plataforma.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-odoo-secondary hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Nueva Conexión</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-odoo-secondary/20 mb-6">
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
                  placeholder="Ej: ERP Producción Europa"
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
                    className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 focus:ring-odoo-secondary focus:border-odoo-secondary"
                    placeholder="https://mi-empresa.odoo.com"
                    required
                    />
                </div>
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
                    placeholder="production_db"
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
                    placeholder="admin@empresa.com"
                    required
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
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

      {/* Connection List */}
      <div className="grid grid-cols-1 gap-6">
        {connections.map(conn => (
            <div key={conn.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                <div className={`w-2 md:w-auto md:min-w-[8px] ${conn.status === 'CONNECTED' ? 'bg-green-500' : conn.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {conn.name}
                                {conn.status === 'CONNECTED' && <CheckCircle size={18} className="text-green-500" />}
                                {conn.status === 'ERROR' && <XCircle size={18} className="text-red-500" />}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{conn.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                conn.status === 'CONNECTED' ? 'bg-green-100 text-green-700' :
                                conn.status === 'ERROR' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {conn.status === 'CONNECTED' ? 'CONECTADO' : conn.status === 'ERROR' ? 'ERROR CONEXIÓN' : 'SIN VERIFICAR'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Base de Datos</p>
                            <p className="font-medium text-gray-700">{conn.db}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Usuario</p>
                            <p className="font-medium text-gray-700">{conn.user}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">API Key</p>
                            <p className="font-medium text-gray-700 font-mono">••••••{conn.apiKey.slice(-4)}</p>
                        </div>
                         <div>
                            <p className="text-gray-400 text-xs uppercase font-bold">Última Verificación</p>
                            <p className="font-medium text-gray-700">{conn.lastCheck || 'Nunca'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 flex md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-200">
                    <button 
                        onClick={() => testConnection(conn.id)}
                        disabled={testing === conn.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-odoo-secondary hover:text-odoo-secondary text-gray-700 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                        {testing === conn.id ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                        <span>{testing === conn.id ? 'Probando...' : 'Probar'}</span>
                    </button>
                    <button 
                        onClick={() => onRemoveConnection(conn.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-red-500 hover:text-red-500 text-gray-700 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm"
                    >
                        <Trash2 size={16} />
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        ))}

        {connections.length === 0 && !showForm && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <Database size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No hay conexiones configuradas</h3>
                <p className="text-sm text-gray-400 mt-2">Agrega tu primera instancia Odoo para comenzar a extraer datos.</p>
                <button 
                    onClick={() => setShowForm(true)}
                    className="mt-6 text-odoo-secondary font-bold hover:underline"
                >
                    + Agregar Conexión
                </button>
            </div>
        )}
      </div>
    </div>
  );
};