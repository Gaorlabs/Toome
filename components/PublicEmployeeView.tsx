
import React, { useEffect, useState } from 'react';
import { Calendar, User, Phone, MapPin, CreditCard, Heart, Clock, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { getPublicEmployeeByToken, fetchPublicShifts } from '../services/supabaseClient';
import { Employee, WorkShift } from '../types';

interface PublicEmployeeViewProps {
    token: string;
}

export const PublicEmployeeView: React.FC<PublicEmployeeViewProps> = ({ token }) => {
    const [employee, setEmployee] = useState<Partial<Employee> | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'SHIFTS' | 'CARD'>('SHIFTS'); // Default to SHIFTS for quick access

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

    const getShiftStatus = (shift: WorkShift) => {
        const today = new Date().toISOString().split('T')[0];
        if (shift.day === today) return 'HOY';
        if (shift.day < today) return 'PASADO';
        return 'FUTURO';
    };

    // Helper to get current week's shifts
    const getCurrentWeekShifts = () => {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay() + 1; // Monday
        const last = first + 6; // Sunday

        const firstday = new Date(curr.setDate(first)).toISOString().split('T')[0];
        const lastday = new Date(curr.setDate(last)).toISOString().split('T')[0];

        return shifts.filter(s => s.day >= firstday && s.day <= lastday);
    };

    const upcomingShifts = shifts.filter(s => {
        const today = new Date().toISOString().split('T')[0];
        return s.day >= today;
    });

    const currentWeekShifts = getCurrentWeekShifts();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-odoo-primary mb-4"></div>
                    <p className="text-gray-400 text-sm font-bold animate-pulse">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm">
                    <AlertTriangle size={48} className="text-red-400 mb-4 mx-auto" />
                    <h1 className="text-xl font-bold text-gray-800">Enlace Expirado</h1>
                    <p className="text-gray-500 mt-2 text-sm">Este enlace ya no es válido o el perfil ha sido eliminado. Contacta con RRHH.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Top Navigation / Brand */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-2 text-odoo-primary font-bold tracking-tight">
                    <ShieldCheck size={18} />
                    <span>TOOME STAFF</span>
                </div>
                <div className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full font-bold border border-green-100">
                    ACTIVO
                </div>
            </div>

            {/* Employee Mini Header */}
            <div className="bg-odoo-primary p-6 pb-8 text-white relative">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 p-1 backdrop-blur-sm">
                        {employee.photoUrl ? (
                            <img src={employee.photoUrl} className="w-full h-full rounded-full object-cover bg-white" alt="Profile" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-odoo-primary font-bold text-xl">
                                {employee.personalEmail?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">{employee.name?.split(' ')[0]}</h1>
                        <p className="text-white/80 text-sm">{employee.jobTitle}</p>
                        <p className="text-xs text-white/60 mt-1 font-mono">{employee.identificationId}</p>
                    </div>
                </div>
                
                {/* Floating Tabs */}
                <div className="absolute -bottom-5 left-6 right-6 bg-white rounded-xl shadow-lg p-1 flex">
                    <button 
                        onClick={() => setActiveTab('SHIFTS')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'SHIFTS' ? 'bg-odoo-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Mis Turnos
                    </button>
                    <button 
                        onClick={() => setActiveTab('CARD')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'CARD' ? 'bg-odoo-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Mi Ficha
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-6 pt-10 overflow-y-auto">
                
                {activeTab === 'SHIFTS' && (
                    <div className="space-y-6 animate-slide-up">
                        
                        {/* Weekly Highlight */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Calendar size={16} className="text-odoo-primary"/> Esta Semana
                            </h3>
                            
                            {currentWeekShifts.length > 0 ? (
                                <div className="space-y-3">
                                    {currentWeekShifts.map((shift, idx) => {
                                        const date = new Date(shift.day + 'T00:00:00');
                                        const isToday = getShiftStatus(shift) === 'HOY';
                                        const isRest = shift.shift === 'REST';

                                        return (
                                            <div key={idx} className={`relative overflow-hidden rounded-xl border p-4 flex items-center justify-between shadow-sm transition-transform active:scale-95
                                                ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}
                                            `}>
                                                {isToday && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>}
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${isToday ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        <span className="text-xs font-bold uppercase">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                                        <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">
                                                            {isRest ? 'Día Libre' : 
                                                             shift.shift === 'MORNING' ? 'Mañana' : 
                                                             shift.shift === 'AFTERNOON' ? 'Tarde' : 'Completo'}
                                                        </p>
                                                        {!isRest && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <Clock size={10} /> {shift.startTime} - {shift.endTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {isRest ? (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Descanso</span>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-400 text-sm">Sin turnos esta semana.</p>
                                </div>
                            )}
                        </div>

                        {/* Future List */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 mt-6">Próximos Días</h3>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                                {upcomingShifts.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400 text-sm">No hay más turnos programados.</div>
                                ) : (
                                    upcomingShifts.map((shift, idx) => {
                                        // Skip current week shifts already shown
                                        if (currentWeekShifts.some(c => c.id === shift.id)) return null;
                                        
                                        const date = new Date(shift.day + 'T00:00:00');
                                        const isRest = shift.shift === 'REST';
                                        
                                        return (
                                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div className="flex gap-3">
                                                    <span className="font-bold text-gray-600 text-sm w-8">{date.getDate()}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-800 capitalize">
                                                            {date.toLocaleDateString('es-ES', { weekday: 'long', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isRest ? (
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">LIBRE</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                            {shift.startTime}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'CARD' && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Emergency Contact */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Heart size={14} className="text-red-400" /> En caso de emergencia
                            </h3>
                            {employee.emergencyContactName ? (
                                <div className="flex items-center gap-4">
                                    <a href={`tel:${employee.emergencyContactPhone}`} className="bg-red-50 w-10 h-10 flex items-center justify-center rounded-full text-red-500 shadow-sm active:scale-90 transition-transform">
                                        <Phone size={20} />
                                    </a>
                                    <div>
                                        <p className="font-bold text-gray-800">{employee.emergencyContactName}</p>
                                        <p className="text-sm text-gray-500">{employee.emergencyContactPhone}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No hay contacto registrado.</p>
                            )}
                        </div>

                        {/* Financial Info */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <CreditCard size={14} className="text-odoo-primary" /> Datos de Pago
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-sm text-gray-500">Banco</span>
                                    <span className="text-sm font-bold text-gray-800">{employee.bankName || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-sm text-gray-500">Cuenta / CCI</span>
                                    <span className="text-sm font-bold text-gray-800 font-mono tracking-wide">{employee.bankAccount || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Fondo Pensión</span>
                                    <span className="text-sm font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{employee.pensionSystem || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Personal Info */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <User size={14} className="text-gray-400" /> Info Personal
                            </h3>
                            <div className="space-y-3">
                                {employee.birthDate && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><Calendar size={14} /></div> 
                                        <div>
                                            <p className="text-xs text-gray-400">Cumpleaños</p>
                                            <p className="font-medium text-gray-800">{new Date(employee.birthDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                )}
                                {employee.address && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><MapPin size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400">Dirección</p>
                                            <p className="font-medium text-gray-800">{employee.address}</p>
                                        </div>
                                    </div>
                                )}
                                {employee.personalPhone && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><Phone size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400">Celular</p>
                                            <p className="font-medium text-gray-800">{employee.personalPhone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 text-center text-[10px] text-gray-300 bg-white border-t border-gray-100">
                Toome Staff Portal &bull; {new Date().getFullYear()}
            </div>
        </div>
    );
};
