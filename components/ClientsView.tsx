import React, { useState } from 'react';
import { 
  Store, Plus, Search, MapPin, Phone, User, Trash2, 
  CircleDollarSign, AlertTriangle, FileText, Check
} from 'lucide-react';
import { ClientStore } from '../types';

interface ClientsViewProps {
  clients: ClientStore[];
  onAddClient: (newClient: ClientStore) => void;
  onDeleteClient: (clientId: string) => void;
  session: { role: 'ADMIN' | 'SELLER'; name: string };
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onAddClient,
  onDeleteClient,
  session
}) => {
  const isAdmin = session.role === 'ADMIN';

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // New Client Fields
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [docType, setDocType] = useState<'DNI' | 'RUC'>('RUC');
  const [docNumber, setDocNumber] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('Zona Norte');
  const [phone, setPhone] = useState('');

  const zones = ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'];

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.docNumber.includes(searchTerm);
    const matchesZone = selectedZone === 'ALL' || c.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim() || !docNumber.trim()) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    const newClient: ClientStore = {
      id: `C${Math.floor(100 + Math.random() * 900)}`,
      name: storeName,
      ownerName,
      docType,
      docNumber,
      address,
      zone,
      phone,
      outstandingBalance: 0
    };

    onAddClient(newClient);

    // reset Form fields
    setStoreName('');
    setOwnerName('');
    setDocNumber('');
    setAddress('');
    setPhone('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <Store size={13} /> GESTIÓN DE CARTERAS COMERCIALES
          </h5>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Clientes y Tiendas Afiliadas
          </h1>
          <p className="text-xs text-slate-400">Administre el padrón integral de bodegas, minimarkets y boticas que comercializan sus marcas a nivel provincial.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#017E84] hover:bg-[#006064] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <Plus size={15} />
          <span>Filiar Bodega / Tienda</span>
        </button>
      </div>

      {/* Manual additions Form wrapper */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-spreadsheet space-y-5 animate-slide-up max-w-2xl">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Ficha de Filiation de Nuevo Cliente</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase">Nombre Comercial (Nombre de Tienda)</label>
              <input
                type="text"
                placeholder="Ej. Bodega San Fernando"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase">Propietario / Dueño de Tienda</label>
              <input
                type="text"
                placeholder="Ej. Jorge Mendoza"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500 uppercase">Tipo Doc.</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'DNI' | 'RUC')}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="RUC">RUC</option>
                  <option value="DNI">DNI</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xxs font-bold text-slate-500 uppercase">Número Identidad</label>
                <input
                  type="text"
                  placeholder="Ej. 10442381921"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase">Celular / Teléfono</label>
              <input
                type="text"
                placeholder="987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase">Dirección de Despacho Completa</label>
              <input
                type="text"
                placeholder="Av. Universitaria 450, Los Olivos"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase">Zona / Ruta Asociada de Envío</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white"
              >
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-400 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#017E84] text-white hover:bg-[#006064] font-bold rounded-xl text-xs transition-all shadow-md"
            >
              Filiar Cliente
            </button>
          </div>
        </form>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-spreadsheet flex flex-col md:flex-row justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por RUC, nombre de tienda o dueño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:outline-none focus:bg-white block w-full pl-10 p-2.5 font-medium"
          />
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xxs font-bold text-slate-400 uppercase tracking-wide">Distrito / Zona:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-3 py-2 outline-none text-slate-700 cursor-pointer"
          >
            <option value="ALL">Todas las Zonas</option>
            {zones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Directory Cards layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const hasDebt = client.outstandingBalance > 0;

          return (
            <div 
              key={client.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-spreadsheet flex flex-col justify-between h-56 hover:border-teal-300 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                      {client.zone}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-sm mt-1.5 leading-tight group-hover:text-[#017E84] transition-colors">
                      {client.name}
                    </h3>
                  </div>

                  <span className="font-mono text-xxs font-black text-slate-300">
                    {client.id}
                  </span>
                </div>

                {/* Sub features */}
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-400" />
                    <span>Contacto: <span className="font-bold text-slate-700">{client.ownerName}</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-slate-400" />
                    <span>{client.docType}: {client.docNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>Telf: {client.phone || 'S/N'}</span>
                  </div>

                  <div className="flex gap-2 items-start">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-snug truncate max-w-[220px]" title={client.address}>{client.address}</span>
                  </div>
                </div>
              </div>

              {/* Outstanding debt display bar */}
              <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-xs">
                {hasDebt ? (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-rose-500 font-bold flex items-center gap-1.5 text-xxs">
                      <AlertTriangle size={13} className="animate-bounce" /> Deuda pendiente:
                    </span>
                    <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 font-black rounded text-xxs">
                      S/ {client.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full text-slate-400 text-xxs">
                    <span className="flex items-center gap-1">
                      <Check size={13} className="text-emerald-500" /> Cuenta al día
                    </span>
                    <span className="font-bold text-[10px] text-slate-350 bg-slate-50 px-2 py-0.5 rounded">
                      SOLVENTE
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-white max-w-lg mx-auto flex flex-col items-center justify-center gap-1.5">
             <Store size={40} className="text-slate-300" />
             <h3 className="text-sm font-extrabold text-slate-700">Sin coincidencias</h3>
             <p className="text-xs text-slate-400">Ninguna tienda afiliada coincide con sus criterios de búsqueda.</p>
          </div>
        )}
      </div>

    </div>
  );
};
