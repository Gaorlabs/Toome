
import React, { useEffect, useState } from 'react';
import { Calendar, User, Phone, MapPin, CreditCard, Heart, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getPublicEmployeeByToken, fetchPublicShifts } from '../services/supabaseClient';
import { Employee, WorkShift } from '../types';

interface PublicEmployeeViewProps {
    token: string;
}

export const PublicEmployeeView: React.FC<PublicEmployeeViewProps> = ({ token }) => {
    const [employee, setEmployee] = useState<Partial<Employee> | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'CARD' | 'SHIFTS'>('CARD');

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        setLoading(true);
        const empData = await getPublicEmployeeByToken(token);
        if (empData && empData.id) {
            setEmployee(empData);
            const shiftData = await fetchPublicShifts(empData.id);
            setShifts(shiftData.sort((a,b) => a.day.localeCompare(b.day)));
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odoo-primary"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle size={48} className="text-red-400 mb-4" />
                <h1 className="text-xl font-bold text-gray-800">Enlace Inválido o Expirado</h1>
                <p className="text-gray-500 mt-2">No pudimos encontrar la información del colaborador. Solicita un nuevo link a administración.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
            {/* Header / Cover */}
            <div className="bg-odoo-primary h-40 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
                <div className="absolute top-4 left-4 text-white/80 text-xs font-bold tracking-widest flex items-center gap-1">
                    <ShieldCheck size={12}/> TOOME STAFF
                </div>
            </div>

            {/* Profile Card */}
            <div className="px-6 relative -mt-16">
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-white p-1 mx-auto -mt-16 shadow-md relative">
                        {employee.photoUrl ? (
                            <img src={employee.photoUrl} className="w-full h-full rounded-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-2xl">
                                {employee.personalEmail?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-xl font-bold text-gray-800 mt-4">{employee.personalEmail?.split('@')[0] || 'Colaborador'}</h1>
                    <p className="text-sm text-gray-500 mb-4 font-medium">DNI: {employee.identificationId}</p>

                    <div className="flex justify-center gap-2 border-t border-gray-100 pt-4">
                        <button 
                            onClick={() => setActiveTab('CARD')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'CARD' ? 'bg-odoo-primary/10 text-odoo-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            Ficha
                        </button>
                        <button 
                            onClick={() => setActiveTab('SHIFTS')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'SHIFTS' ? 'bg-odoo-primary/10 text-odoo-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            Turnos
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 pb-12">
                {activeTab === 'CARD' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Emergency Contact */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <Heart size={14} className="text-red-400" /> Emergencia
                            </h3>
                            {employee.emergencyContactName ? (
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-50 p-2 rounded-full text-red-500"><Phone size={18} /></div>
                                    <div>
                                        <p className="font-bold text-gray-800">{employee.emergencyContactName}</p>
                                        <p className="text-sm text-gray-500">{employee.emergencyContactPhone}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No registrado</p>
                            )}
                        </div>

                        {/* Financial Info */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <CreditCard size={14} className="text-blue-400" /> Datos Bancarios
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-sm text-gray-600">Banco</span>
                                    <span className="text-sm font-bold text-gray-800">{employee.bankName || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-sm text-gray-600">Cuenta</span>
                                    <span className="text-sm font-bold text-gray-800 font-mono">{employee.bankAccount || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Pensión</span>
                                    <span className="text-sm font-bold text-gray-800">{employee.pensionSystem || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Personal Info */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <User size={14} className="text-gray-400" /> Personal
                            </h3>
                            <div className="space-y-2">
                                {employee.birthDate && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar size={14} /> 
                                        <span>Nacimiento: {employee.birthDate}</span>
                                    </div>
                                )}
                                {employee.address && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={14} /> 
                                        <span>{employee.address}</span>
                                    </div>
                                )}
                                {employee.personalPhone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone size={14} /> 
                                        <span>{employee.personalPhone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SHIFTS' && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Próximos Turnos</h3>
                            <span className="text-xs text-odoo-primary bg-odoo-primary/10 px-2 py-1 rounded">Este Mes</span>
                        </div>
                        
                        {shifts.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No hay turnos programados.</p>
                            </div>
                        ) : (
                            shifts.map((shift, idx) => {
                                const date = new Date(shift.day + 'T00:00:00');
                                const isRest = shift.shift === 'REST';
                                return (
                                    <div key={idx} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-center ${isRest ? 'border-red-400' : 'border-odoo-primary'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="text-center w-10">
                                                <span className="block text-xs font-bold text-gray-400 uppercase">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                <span className="block text-xl font-bold text-gray-800 leading-none">{date.getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 capitalize">{date.toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                                                <p className="text-xs text-gray-500">
                                                    {isRest ? 'Día de Descanso' : 
                                                     shift.shift === 'MORNING' ? 'Turno Mañana' :
                                                     shift.shift === 'AFTERNOON' ? 'Turno Tarde' : 'Turno Completo'}
                                                </p>
                                            </div>
                                        </div>
                                        {!isRest && (
                                            <div className="text-right">
                                                <div className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-700 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {shift.startTime} - {shift.endTime}
                                                </div>
                                            </div>
                                        )}
                                        {isRest && (
                                            <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">OFF</span>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
            
            <div className="text-center pb-6 text-xs text-gray-300">
                Toome Staff Portal
            </div>
        </div>
    );
};
