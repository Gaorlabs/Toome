
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MapPin, Plus, Check, X, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { OdooConnection, CalendarEvent } from '../types';
import { fetchOdooAppointments } from '../services/odooBridge';

interface AgendaModuleProps {
    connection: OdooConnection | null;
}

export const AgendaModule: React.FC<AgendaModuleProps> = ({ connection }) => {
  // Estado inicial VACÍO (Sin datos falsos)
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (connection) {
        loadRealData();
    }
  }, [connection]);

  const loadRealData = async () => {
      if (!connection) return;
      setLoading(true);
      setError(null);
      
      try {
        const realEvents = await fetchOdooAppointments(connection);
        setAppointments(realEvents);
        
        if (realEvents.length === 0) {
            // Optional: Podríamos setear un estado de "No se encontraron datos" específico
        }
      } catch (err) {
          setError("Error al cargar datos reales. Verifica la consola.");
      } finally {
          setLoading(false);
      }
  };

  const getStatusColor = (status: string) => {
    // Colores ajustados al tema Odoo (Teal/Purple/Gray)
    const colors: Record<string, string> = {
      needsAction: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      tentative: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      needsAction: 'Pendiente',
      confirmed: 'Confirmada',
      tentative: 'Tentativa',
      cancelled: 'Cancelada'
    };
    return texts[status] || status;
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = apt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (apt.location && apt.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
        
        {/* Header Spreadsheet Style */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-odoo-primary" size={28} />
                    Agenda Profesional
                </h1>
                <div className="flex items-center gap-2 mt-1">
                     <p className="text-gray-500 text-sm">Gestión de citas sincronizada con Odoo Calendar.</p>
                     {connection ? (
                         <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                             En línea: {connection.name}
                         </span>
                     ) : (
                         <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                             Sin conexión activa
                         </span>
                     )}
                </div>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={loadRealData}
                    disabled={loading || !connection}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:text-odoo-primary hover:border-odoo-primary rounded-lg shadow-sm transition-all text-sm font-medium"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Cargando...' : 'Sincronizar'}
                </button>
                <button className="flex items-center gap-2 bg-odoo-primary hover:bg-odoo-primaryDark text-white px-4 py-2 rounded-lg shadow-sm transition-all text-sm font-medium">
                    <Plus size={18} />
                    Nueva Cita
                </button>
            </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-odoo-primary focus:border-odoo-primary block w-full pl-10 p-2.5" 
                    placeholder="Buscar evento, doctor o ubicación..." 
                />
            </div>
            <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">Estado:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                     {['all', 'confirmed', 'needsAction'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === f ? 'bg-white text-odoo-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          {f === 'all' ? 'Todos' : f === 'confirmed' ? 'Confirmados' : 'Pendientes'}
                      </button>
                  ))}
                </div>
            </div>
        </div>

        {/* Error State */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        )}

        {/* Appointments Grid */}
        <div className="grid grid-cols-1 gap-4">
            {filteredAppointments.map((apt) => (
                <div key={apt.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    {/* Time Column */}
                    <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-gray-100 pr-4">
                        <span className="text-2xl font-bold text-odoo-dark">
                            {new Date(apt.start).getDate()}
                        </span>
                        <span className="text-xs uppercase font-bold text-gray-400">
                            {new Date(apt.start).toLocaleString('es-ES', { month: 'short' })}
                        </span>
                        <div className="mt-2 text-sm font-medium text-odoo-primary bg-odoo-primary/10 px-2 py-1 rounded">
                             {new Date(apt.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <h3 className="text-lg font-bold text-gray-800">{apt.title}</h3>
                             <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase border ${getStatusColor(apt.status)}`}>
                                 {getStatusText(apt.status)}
                             </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mt-2">
                             <div className="flex items-center gap-2">
                                 <Clock size={14} className="text-gray-400" />
                                 <span>Duración: {Math.round((new Date(apt.end).getTime() - new Date(apt.start).getTime()) / 60000)} min</span>
                             </div>
                             {apt.location && (
                                 <div className="flex items-center gap-2">
                                     <MapPin size={14} className="text-gray-400" />
                                     <span>{apt.location}</span>
                                 </div>
                             )}
                             {apt.attendees && (
                                  <div className="flex items-center gap-2">
                                     <User size={14} className="text-gray-400" />
                                     <span>{apt.attendees}</span>
                                 </div>
                             )}
                        </div>
                        {apt.description && (
                            <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                                {apt.description}
                            </p>
                        )}
                    </div>

                    {/* Actions Column */}
                    <div className="flex gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                        <button className="p-2 text-gray-400 hover:text-odoo-primary hover:bg-odoo-primary/5 rounded-full transition-colors" title="Ver detalle">
                             <Search size={18} />
                        </button>
                    </div>
                </div>
            ))}
            
            {!loading && filteredAppointments.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <Calendar className="text-gray-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-600">No hay citas</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        {connection 
                            ? "No se encontraron eventos en Odoo para este mes." 
                            : "Conecta una instancia de Odoo para ver tu agenda."}
                    </p>
                </div>
            )}
        </div>
    </div>
  );
}
