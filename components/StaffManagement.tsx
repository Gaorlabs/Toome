
import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, Clock, Plus, Filter, Search, MoreHorizontal, UserCheck, UserX, Briefcase, RefreshCw, Smartphone, Mail, CreditCard, ChevronRight, X, Coffee, Sun, Monitor, AlertCircle, Save, Trash2, Landmark, Heart, Phone, DollarSign, Calculator, Download, Table, Baby, Share2, Camera, Link as LinkIcon, Copy, Eye, UploadCloud } from 'lucide-react';
import { OdooConnection, UserSession, Employee, WorkShift, PayrollRow } from '../types';
import { fetchEmployees } from '../services/odooBridge';
import { fetchStaffShifts, createStaffShift, deleteStaffShift, fetchEmployeeProfiles, upsertEmployeeProfile, updateStaffShift, uploadEmployeePhoto } from '../services/supabaseClient';
import * as XLSX from 'xlsx';

interface StaffManagementProps {
  connection?: OdooConnection | null;
  userSession?: UserSession | null;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ connection, userSession }) => {
  const [activeTab, setActiveTab] = useState<'TEAM' | 'SCHEDULE' | 'PAYROLL'>('TEAM');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Shifts from Supabase
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  
  // Payroll State
  const [payrollPeriod, setPayrollPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payrollData, setPayrollData] = useState<PayrollRow[]>([]);
  
  // State for "Ficha" Modal
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<Employee>>({});
  
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // State for Shift Modal
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Partial<WorkShift>>({});
  const [isNewShift, setIsNewShift] = useState(true);

  // State for Date Navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    if (connection) {
        loadEmployees();
    }
  }, [connection]);

  // Load shifts whenever tab changes to SCHEDULE or employee list updates
  useEffect(() => {
      if (activeTab === 'SCHEDULE' && employees.length > 0) {
          loadShifts();
      }
      if (activeTab === 'PAYROLL' && employees.length > 0) {
          calculatePayrollEstimate();
      }
  }, [activeTab, employees.length, currentDate]);

  const loadEmployees = async () => {
    setLoading(true);
    const allowedCompanies = userSession?.clientData?.allowedCompanyIds;
    
    // 1. Fetch Basic from Odoo
    const odooData = await fetchEmployees(connection!, allowedCompanies);
    
    // 2. Fetch Extended from Supabase
    const profiles = await fetchEmployeeProfiles();

    // 3. Merge
    const mergedData = odooData.map(emp => ({
        ...emp,
        ...(profiles[emp.id] || {})
    }));

    setEmployees(mergedData);
    setLoading(false);
  };

  const loadShifts = async () => {
      setLoadingShifts(true);
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startStr = startOfWeek.toISOString().split('T')[0];
      const endStr = endOfWeek.toISOString().split('T')[0];

      const data = await fetchStaffShifts(startStr, endStr);
      setShifts(data);
      setLoadingShifts(false);
  };

  // --- PAYROLL LOGIC ---

  const calculatePayrollEstimate = () => {
      // Normativa Peruana Básica (2025)
      const RMV = 1025;
      const ASIG_FAMILIAR_AMOUNT = 102.50; // 10% RMV
      
      const rows: PayrollRow[] = employees.map(emp => {
          const base = emp.salaryBase || 0;
          const family = emp.hasFamilyAllowance ? ASIG_FAMILIAR_AMOUNT : 0;
          const comms = emp.salaryCommission || 0;
          
          const totalIncome = base + family + comms;
          
          // Deductions Logic (Simplified)
          let pensionRate = 0;
          if (emp.pensionSystem === 'ONP') pensionRate = 0.13;
          else if (emp.pensionSystem?.startsWith('AFP')) pensionRate = 0.117; // Promedio aprox (10% + 1.7% seguro/comision)
          
          const pensionAmount = totalIncome * pensionRate;
          const essaludAmount = totalIncome * 0.09; // Aporte empleador

          return {
              employeeId: emp.id,
              employeeName: emp.name,
              dni: emp.identificationId || '-',
              system: emp.pensionSystem || 'Sin Reg.',
              baseSalary: base,
              familyAllowance: family,
              commissions: comms,
              totalIncome: totalIncome,
              deductionPension: pensionAmount,
              netPay: totalIncome - pensionAmount,
              employerEssalud: essaludAmount
          };
      });
      setPayrollData(rows);
  };

  const handleCommissionChange = (empId: string, val: number) => {
      setPayrollData(prev => prev.map(row => {
          if (row.employeeId === empId) {
              const newIncome = row.baseSalary + row.familyAllowance + val;
              const newPension = row.system === 'ONP' ? newIncome * 0.13 : (row.system?.startsWith('AFP') ? newIncome * 0.117 : 0);
              return {
                  ...row,
                  commissions: val,
                  totalIncome: newIncome,
                  deductionPension: newPension,
                  netPay: newIncome - newPension,
                  employerEssalud: newIncome * 0.09
              };
          }
          return row;
      }));
  };

  const exportPayrollToExcel = () => {
      const exportData = payrollData.map(row => ({
          'Empleado': row.employeeName,
          'DNI': row.dni,
          'Sueldo Básico': row.baseSalary,
          'Asig. Familiar': row.familyAllowance,
          'Comisiones/Bonos': row.commissions,
          'Total Bruto': row.totalIncome,
          'Sistema Pensión': row.system,
          'Descuento Pensión': row.deductionPension,
          'Neto a Pagar': row.netPay,
          'Aporte Essalud (9%)': row.employerEssalud
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilla_Estimada");
      XLSX.writeFile(wb, `Planilla_${payrollPeriod}.xlsx`);
  };

  // --- SHIFT HANDLERS ---

  const openShiftModal = (employeeId: string, employeeName: string, date: Date, existingShift?: WorkShift) => {
      if (existingShift) {
          setSelectedShift(existingShift);
          setIsNewShift(false);
      } else {
          const dateStr = date.toISOString().split('T')[0];
          setSelectedShift({
              employeeId,
              employeeName,
              day: dateStr,
              shift: 'MORNING',
              startTime: '08:00',
              endTime: '14:00'
          });
          setIsNewShift(true);
      }
      setShiftModalOpen(true);
  };

  const handleSaveShift = async () => {
      if (!selectedShift.employeeId || !selectedShift.day) return;

      let success = false;
      if (isNewShift) {
          success = await createStaffShift(selectedShift as any);
      } else {
          if (selectedShift.id) {
              success = await updateStaffShift(selectedShift.id, selectedShift);
          }
      }

      if (success) {
          setShiftModalOpen(false);
          loadShifts();
      } else {
          alert("Error al guardar turno");
      }
  };

  const handleDeleteShift = async () => {
      if (selectedShift.id) {
          const success = await deleteStaffShift(selectedShift.id);
          if (success) {
              setShiftModalOpen(false);
              loadShifts();
          }
      }
  };

  // --- PROFILE HANDLERS & IMAGE UPLOAD ---

  const handleOpenProfile = (emp: Employee) => {
      setSelectedEmployee(emp);
      setProfileForm(emp);
      setIsEditingProfile(false);
  };

  const handleImageClick = () => {
      if (isEditingProfile && fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingPhoto(true);
      try {
          const publicUrl = await uploadEmployeePhoto(file);
          if (publicUrl) {
              setProfileForm(prev => ({ ...prev, photoUrl: publicUrl }));
          } else {
              alert("Error al subir la imagen. Verifica permisos en Supabase Storage (bucket 'employee-photos').");
          }
      } catch (error) {
          console.error(error);
          alert("Error crítico al subir imagen.");
      } finally {
          setUploadingPhoto(false);
      }
  };

  const handleSaveProfile = async () => {
      if (!selectedEmployee) return;
      
      const success = await upsertEmployeeProfile(selectedEmployee.id, profileForm);
      if (success) {
          setIsEditingProfile(false);
          // Update local state immediately
          setEmployees(employees.map(e => e.id === selectedEmployee.id ? { ...e, ...profileForm } : e));
          setSelectedEmployee({ ...selectedEmployee, ...profileForm });
      } else {
          alert("Error al guardar ficha");
      }
  };

  // --- SHARING UTILS (LINK MAGICO) ---

  const generatePublicLink = (emp: Employee) => {
      // Create base URL assuming current host
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}?token=${emp.publicToken || 'undefined'}`;
  };

  const shareProfileWhatsApp = (emp: Employee) => {
      if (!emp.publicToken) {
          alert("Guarda la ficha primero para generar un enlace público.");
          return;
      }
      
      const link = generatePublicLink(emp);
      // Updated message to be specific about Weekly Shifts
      const text = `Hola ${emp.name?.split(' ')[0]}, aquí tienes tu *Rol de Turnos Semanal* y Ficha Digital 📅.\n\nRevisa tu horario actualizado aquí:\n🔗 ${link}`;
      
      const url = `https://wa.me/${emp.personalPhone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const openPublicView = (emp: Employee) => {
      if (!emp.publicToken) return;
      const link = generatePublicLink(emp);
      window.open(link, '_blank');
  };

  const getWeekDays = () => {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
      start.setDate(diff);
      
      const week = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          week.push(d);
      }
      return week;
  };

  const weekDates = getWeekDays();

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Users className="text-odoo-primary" /> Gestión de Personal
          </h2>
          <p className="text-gray-500 text-sm">Monitor de estado en vivo, Ficha Técnica y Nómina.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button 
                    onClick={() => setActiveTab('TEAM')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'TEAM' ? 'bg-white text-odoo-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     Equipo
                 </button>
                 <button 
                    onClick={() => setActiveTab('SCHEDULE')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'SCHEDULE' ? 'bg-white text-odoo-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     Planificación
                 </button>
                 <button 
                    onClick={() => setActiveTab('PAYROLL')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'PAYROLL' ? 'bg-white text-odoo-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     Nómina
                 </button>
             </div>
        </div>
      </div>

      {/* KPI Cards (Shared) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Empleados</p>
                  <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-green-600 uppercase">En Turno (Caja)</p>
                  <p className="text-2xl font-bold text-gray-800">{employees.filter(e => e.currentPos).length}</p>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Monitor size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Turnos Semanales</p>
                  <p className="text-2xl font-bold text-gray-800">{shifts.length}</p>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Planilla (Est.)</p>
                  <p className="text-2xl font-bold text-gray-800">
                      S/ {payrollData.reduce((acc, r) => acc + r.netPay, 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                  </p>
              </div>
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><DollarSign size={20} /></div>
          </div>
      </div>

      {/* VIEW: TEAM LIST */}
      {activeTab === 'TEAM' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
               {/* Toolbar */}
               <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                          type="text" 
                          placeholder="Buscar empleado..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-odoo-primary outline-none"
                      />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={loadEmployees}
                            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sincronizar
                        </button>
                  </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                          <tr>
                              <th className="px-6 py-4">Nombre</th>
                              <th className="px-6 py-4">Cargo / Puesto</th>
                              <th className="px-6 py-4">Datos Clave</th>
                              <th className="px-6 py-4 text-center">Estado Actual</th>
                              <th className="px-6 py-4 text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredEmployees.map((emp) => (
                              <tr key={emp.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleOpenProfile(emp)}>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          {emp.photoUrl ? (
                                              <img src={emp.photoUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                          ) : (
                                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-300">
                                                  {emp.name.substring(0, 2).toUpperCase()}
                                              </div>
                                          )}
                                          <div>
                                              <span className="font-bold text-gray-800 block">{emp.name}</span>
                                              <span className="text-[10px] text-gray-400">{emp.workEmail || 'Sin email'}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="text-xs">
                                          <p className="font-bold">{emp.jobTitle}</p>
                                          <p className="text-gray-400">{emp.department}</p>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="text-[10px] space-y-1">
                                          {emp.identificationId ? (
                                              <p className="text-gray-600"><span className="font-bold">DNI:</span> {emp.identificationId}</p>
                                          ) : <span className="text-red-300">Falta DNI</span>}
                                          {emp.personalPhone ? (
                                              <p className="text-gray-600"><span className="font-bold">Cel:</span> {emp.personalPhone}</p>
                                          ) : null}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      {emp.currentPos ? (
                                          <div className="flex items-center justify-center gap-1.5 animate-pulse">
                                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                              <span className="text-green-700 font-bold text-xs bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                                  {emp.currentPos}
                                              </span>
                                          </div>
                                      ) : (
                                          <span className="text-gray-400 text-xs">Desconectado</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                        className="text-gray-400 hover:text-odoo-primary flex items-center justify-end w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenProfile(emp);
                                        }}
                                      >
                                          <span className="text-xs mr-1 font-bold">Ficha</span>
                                          <ChevronRight size={16} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* VIEW: SCHEDULE PLANNER */}
      {activeTab === 'SCHEDULE' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
              
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-bold text-lg text-gray-800">Planificación Semanal</h3>
                      <p className="text-xs text-gray-500">Gestión de Turnos y Descansos (Datos en Nube)</p>
                  </div>
                  <div className="flex items-center gap-2">
                       <button 
                        onClick={loadShifts} 
                        className="p-1 hover:bg-gray-100 rounded mr-2" 
                        title="Recargar Turnos"
                       >
                           <RefreshCw size={14} className={loadingShifts ? 'animate-spin' : ''}/>
                       </button>
                       <div className="flex items-center gap-1 text-xs">
                           <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                           <span>Mañana</span>
                       </div>
                       <div className="flex items-center gap-1 text-xs">
                           <div className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded"></div>
                           <span>Tarde</span>
                       </div>
                  </div>
              </div>

              {/* Schedule Grid */}
              <div className="grid grid-cols-8 border border-gray-200 rounded-lg overflow-hidden">
                   {/* Header Row */}
                   <div className="bg-gray-50 p-4 border-b border-r border-gray-200 font-bold text-xs text-gray-500 text-center flex items-center justify-center">
                       EMPLEADO
                   </div>
                   {weekDates.map((date, i) => (
                       <div key={i} className="bg-gray-50 p-2 border-b border-gray-200 font-bold text-xs text-gray-500 text-center">
                           <div className="uppercase">{daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]}</div>
                           <div className="text-gray-400 font-normal">{date.getDate()}</div>
                       </div>
                   ))}

                   {/* Employee Rows */}
                   {filteredEmployees.map(emp => (
                       <React.Fragment key={emp.id}>
                           <div className="p-3 border-r border-b border-gray-200 flex items-center gap-2 bg-white">
                               {emp.photoUrl ? (
                                   <img src={emp.photoUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                               ) : (
                                   <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                       {emp.name.substring(0, 1)}
                                   </div>
                               )}
                               <span className="text-xs font-bold text-gray-700 truncate max-w-[80px]">{emp.name.split(' ')[0]}</span>
                           </div>
                           
                           {/* Days Cells */}
                           {weekDates.map((date, idx) => {
                               const dateStr = date.toISOString().split('T')[0];
                               const empShift = shifts.find(s => s.employeeId === emp.id && s.day === dateStr);
                               
                               return (
                                   <div 
                                    key={idx} 
                                    onClick={() => openShiftModal(emp.id, emp.name, date, empShift)}
                                    className="border-b border-gray-100 bg-white p-1 min-h-[50px] relative hover:bg-gray-50 transition-colors cursor-pointer group"
                                   >
                                       {empShift ? (
                                           <div className={`
                                                text-[10px] p-1 rounded font-bold text-center h-full flex flex-col justify-center
                                                ${empShift.shift === 'MORNING' ? 'bg-yellow-100 border border-yellow-200 text-yellow-800' : ''}
                                                ${empShift.shift === 'AFTERNOON' ? 'bg-indigo-100 border border-indigo-200 text-indigo-800' : ''}
                                                ${empShift.shift === 'REST' ? 'bg-red-50 border border-red-200 text-red-600' : ''}
                                                ${empShift.shift === 'FULL' ? 'bg-blue-100 border border-blue-200 text-blue-800' : ''}
                                           `}>
                                               <span>{empShift.startTime} - {empShift.endTime}</span>
                                               {empShift.shift === 'REST' && <span>(Descanso)</span>}
                                           </div>
                                       ) : (
                                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-300">
                                               <Plus size={16} />
                                           </div>
                                       )}
                                   </div>
                               );
                           })}
                       </React.Fragment>
                   ))}
              </div>
          </div>
      )}

      {/* VIEW: PAYROLL CALCULATOR (UNCHANGED) */}
      {activeTab === 'PAYROLL' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                          <Calculator size={20} className="text-odoo-primary"/> 
                          Estimador de Planilla Mensual
                      </h3>
                      <p className="text-xs text-gray-500">Cálculo de 5ta categoría, AFP/ONP y Aportes (Referencial)</p>
                  </div>
                  <div className="flex gap-2 items-center">
                      <input 
                        type="month" 
                        value={payrollPeriod}
                        onChange={(e) => setPayrollPeriod(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-odoo-primary focus:border-odoo-primary"
                      />
                      <button 
                        onClick={calculatePayrollEstimate}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-gray-200"
                        title="Recalcular"
                      >
                          <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={exportPayrollToExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2"
                      >
                          <Download size={16} /> Exportar
                      </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                          <tr>
                              <th className="px-4 py-3">Colaborador</th>
                              <th className="px-4 py-3">Sistema</th>
                              <th className="px-4 py-3 text-right text-green-700 bg-green-50">Sueldo Base</th>
                              <th className="px-4 py-3 text-right text-green-700 bg-green-50">Asig. Fam.</th>
                              <th className="px-4 py-3 text-right text-blue-700 bg-blue-50">Comisiones</th>
                              <th className="px-4 py-3 text-right font-bold bg-gray-100">Total Bruto</th>
                              <th className="px-4 py-3 text-right text-red-700 bg-red-50">AFP / ONP</th>
                              <th className="px-4 py-3 text-right font-black text-gray-900 text-sm bg-yellow-50">NETO A PAGAR</th>
                              <th className="px-4 py-3 text-right text-gray-400">Essalud (9%)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {payrollData.map((row) => (
                              <tr key={row.employeeId} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                      <p className="font-bold text-gray-800">{row.employeeName}</p>
                                      <p className="text-[10px] text-gray-400">DNI: {row.dni}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.system === 'ONP' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                          {row.system}
                                      </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                      {row.baseSalary.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-600">
                                      {row.familyAllowance > 0 ? row.familyAllowance.toFixed(2) : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <input 
                                        type="number" 
                                        value={row.commissions} 
                                        onChange={(e) => handleCommissionChange(row.employeeId, parseFloat(e.target.value) || 0)}
                                        className="w-20 text-right border border-blue-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 bg-blue-50"
                                      />
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold bg-gray-50">
                                      {row.totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-red-600">
                                      -{row.deductionPension.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-gray-800 bg-yellow-50 border-l border-yellow-100">
                                      {row.netPay.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-400 text-[10px]">
                                      {row.employerEssalud.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                              </tr>
                          ))}
                          {payrollData.length > 0 && (
                              <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                  <td colSpan={2} className="px-4 py-3 text-right uppercase text-xs">Totales Generales</td>
                                  <td className="px-4 py-3 text-right">
                                      {payrollData.reduce((acc, r) => acc + r.baseSalary, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      {payrollData.reduce((acc, r) => acc + r.familyAllowance, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      {payrollData.reduce((acc, r) => acc + r.commissions, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-900">
                                      {payrollData.reduce((acc, r) => acc + r.totalIncome, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-red-600">
                                      -{payrollData.reduce((acc, r) => acc + r.deductionPension, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-lg bg-yellow-100 text-gray-900">
                                      {payrollData.reduce((acc, r) => acc + r.netPay, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-500">
                                      {payrollData.reduce((acc, r) => acc + r.employerEssalud, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* MODAL: SHIFT MANAGER */}
      {shiftModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-slide-up">
                  <div className="bg-odoo-primary p-4 text-white flex justify-between items-center">
                      <h3 className="font-bold">{isNewShift ? 'Asignar Turno' : 'Editar Turno'}</h3>
                      <button onClick={() => setShiftModalOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      {/* ... Shift Inputs ... */}
                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-1">Empleado</label>
                          <p className="text-sm font-bold">{selectedShift.employeeName}</p>
                          <p className="text-xs text-gray-400">{selectedShift.day}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Inicio</label>
                              <input 
                                type="time" 
                                value={selectedShift.startTime}
                                onChange={(e) => setSelectedShift({...selectedShift, startTime: e.target.value})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Fin</label>
                              <input 
                                type="time" 
                                value={selectedShift.endTime}
                                onChange={(e) => setSelectedShift({...selectedShift, endTime: e.target.value})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-2">Tipo de Turno</label>
                          <div className="grid grid-cols-2 gap-2">
                              {['MORNING', 'AFTERNOON', 'FULL', 'REST'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setSelectedShift({...selectedShift, shift: type as any})}
                                    className={`text-xs py-2 rounded font-bold border ${selectedShift.shift === type ? 'bg-odoo-primary text-white border-odoo-primary' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                  >
                                      {type === 'MORNING' ? 'Mañana' : type === 'AFTERNOON' ? 'Tarde' : type === 'FULL' ? 'Día Completo' : 'Descanso'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                          {!isNewShift && (
                              <button onClick={handleDeleteShift} className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100">
                                  <Trash2 size={20} />
                              </button>
                          )}
                          <button onClick={handleSaveShift} className="flex-1 bg-odoo-primary text-white font-bold py-2 rounded hover:bg-odoo-primaryDark">
                              Guardar Cambios
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: EMPLOYEE PROFILE (FICHA) */}
      {selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
              <div className="bg-white w-full md:w-[500px] h-full shadow-2xl animate-slide-up md:animate-none md:transition-transform p-0 overflow-y-auto">
                  
                  {/* Modal Header */}
                  <div className="bg-odoo-primary h-32 relative">
                      <button 
                        onClick={() => setSelectedEmployee(null)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-20"
                      >
                          <X size={20} />
                      </button>
                      
                      {/* Avatar Upload Container */}
                      <div className="absolute -bottom-10 left-8 flex items-end group z-10">
                          {/* Hidden File Input */}
                          <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileChange}
                          />
                          
                          <div 
                            onClick={handleImageClick}
                            className={`w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden bg-gray-100 relative ${isEditingProfile ? 'cursor-pointer hover:opacity-90' : ''}`}
                          >
                              {uploadingPhoto ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                      <RefreshCw className="animate-spin text-white" size={24} />
                                  </div>
                              ) : profileForm.photoUrl ? (
                                  <img src={profileForm.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                              ) : (
                                  <span className="text-odoo-primary text-3xl font-bold">
                                      {selectedEmployee.name.substring(0, 2).toUpperCase()}
                                  </span>
                              )}
                          </div>
                          
                          {isEditingProfile && (
                              <div 
                                onClick={handleImageClick}
                                className="absolute bottom-0 right-0 bg-white shadow-md p-1.5 rounded-full text-gray-500 cursor-pointer hover:text-odoo-primary hover:bg-gray-50 transition-colors"
                              >
                                  <Camera size={14} />
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Profile Content */}
                  <div className="pt-14 px-8 pb-8">
                      <div className="flex justify-between items-start">
                          <div>
                              <h2 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h2>
                              <p className="text-gray-500 font-medium">{selectedEmployee.jobTitle}</p>
                          </div>
                          <button 
                            onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                            disabled={uploadingPhoto}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isEditingProfile ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                              {isEditingProfile ? <Save size={16} /> : <Briefcase size={16} />}
                              {isEditingProfile ? 'Guardar' : 'Editar'}
                          </button>
                      </div>
                      
                      {/* Share Buttons (INTERACTIVE LINKS) */}
                      {!isEditingProfile && (
                          <div className="flex gap-2 mt-4 mb-2">
                              <button 
                                onClick={() => shareProfileWhatsApp(selectedEmployee)}
                                className="flex-1 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                              >
                                  <Share2 size={14} /> Enviar Link (WhatsApp)
                              </button>
                              <button 
                                onClick={() => openPublicView(selectedEmployee)}
                                className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                title="Ver tarjeta digital"
                              >
                                  <Eye size={14} />
                              </button>
                          </div>
                      )}

                      <hr className="my-6 border-gray-100" />

                      {/* --- FORMULARIO DE DATOS --- */}
                      
                      <div className="space-y-6">
                          
                          {/* Datos Personales (DNI, Nacimiento) */}
                          <section>
                              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                                  <CreditCard size={16} className="text-odoo-primary" /> Datos Personales
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">DNI</label>
                                      {isEditingProfile ? (
                                          <input 
                                            type="text" 
                                            value={profileForm.identificationId || ''} 
                                            onChange={(e) => setProfileForm({...profileForm, identificationId: e.target.value})}
                                            className="w-full border border-gray-300 rounded p-1 text-sm"
                                          />
                                      ) : <p className="text-sm font-bold">{selectedEmployee.identificationId || '---'}</p>}
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">F. Nacimiento</label>
                                      {isEditingProfile ? (
                                          <input 
                                            type="date" 
                                            value={profileForm.birthDate || ''} 
                                            onChange={(e) => setProfileForm({...profileForm, birthDate: e.target.value})}
                                            className="w-full border border-gray-300 rounded p-1 text-sm"
                                          />
                                      ) : <p className="text-sm font-bold">{selectedEmployee.birthDate || '---'}</p>}
                                  </div>
                              </div>
                          </section>

                          {/* Contacto */}
                          <section>
                              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                                  <Phone size={16} className="text-odoo-primary" /> Teléfonos de Contacto
                              </h4>
                              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                          <Smartphone size={10} /> Personal / Celular
                                      </label>
                                      {isEditingProfile ? (
                                          <input 
                                            type="text" 
                                            value={profileForm.personalPhone || ''}
                                            onChange={(e) => setProfileForm({...profileForm, personalPhone: e.target.value})}
                                            className="w-full border border-gray-300 rounded p-1 text-sm mt-1"
                                            placeholder="999-999-999"
                                          />
                                      ) : (
                                          <p className="text-sm font-medium mt-1">{selectedEmployee.personalPhone || 'No registrado'}</p>
                                      )}
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                          <Heart size={10} className="text-red-400" /> Emergencia Familiar
                                      </label>
                                      {isEditingProfile ? (
                                          <input 
                                            type="text" 
                                            value={profileForm.emergencyContactPhone || ''}
                                            onChange={(e) => setProfileForm({...profileForm, emergencyContactPhone: e.target.value})}
                                            className="w-full border border-gray-300 rounded p-1 text-sm mt-1"
                                            placeholder="Nombre: Número"
                                          />
                                      ) : (
                                          <p className="text-sm font-medium mt-1 text-red-600">{selectedEmployee.emergencyContactPhone || 'No registrado'}</p>
                                      )}
                                  </div>
                              </div>
                          </section>

                          {/* Datos Financieros & Salario */}
                          <section>
                              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                                  <Landmark size={16} className="text-odoo-primary" /> Información Financiera
                              </h4>
                              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                  {/* Salario */}
                                  <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                                      <div>
                                          <label className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                                              <DollarSign size={10} /> Sueldo Base
                                          </label>
                                          {isEditingProfile ? (
                                              <input 
                                                type="number" 
                                                value={profileForm.salaryBase || ''}
                                                onChange={(e) => setProfileForm({...profileForm, salaryBase: parseFloat(e.target.value)})}
                                                className="w-full border border-gray-300 rounded p-1 text-sm font-bold mt-1"
                                                placeholder="0.00"
                                              />
                                          ) : (
                                              <p className="text-sm font-bold text-gray-800 mt-1">S/ {selectedEmployee.salaryBase ? selectedEmployee.salaryBase.toLocaleString() : '0.00'}</p>
                                          )}
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                              <Briefcase size={10} /> Comisiones Mensuales
                                          </label>
                                          {isEditingProfile ? (
                                              <input 
                                                type="number" 
                                                value={profileForm.salaryCommission || ''}
                                                onChange={(e) => setProfileForm({...profileForm, salaryCommission: parseFloat(e.target.value)})}
                                                className="w-full border border-gray-300 rounded p-1 text-sm font-bold mt-1"
                                                placeholder="Monto estimado"
                                              />
                                          ) : (
                                              <p className="text-sm font-bold text-gray-800 mt-1">S/ {selectedEmployee.salaryCommission ? selectedEmployee.salaryCommission.toLocaleString() : '0.00'}</p>
                                          )}
                                      </div>
                                  </div>
                                  
                                  {/* Asignación Familiar Check */}
                                  <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
                                      {isEditingProfile ? (
                                          <input 
                                            type="checkbox" 
                                            checked={profileForm.hasFamilyAllowance || false}
                                            onChange={(e) => setProfileForm({...profileForm, hasFamilyAllowance: e.target.checked})}
                                            className="w-4 h-4 text-odoo-primary border-gray-300 rounded"
                                          />
                                      ) : (
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEmployee.hasFamilyAllowance ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                                              {selectedEmployee.hasFamilyAllowance && <UserCheck size={10}/>}
                                          </div>
                                      )}
                                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                          <Baby size={12} /> Recibe Asignación Familiar (+102.50)
                                      </label>
                                  </div>

                                  {/* Banco y Pensiones */}
                                  <div className="space-y-3">
                                      <div>
                                          <label className="text-[10px] font-bold text-gray-400 uppercase">Sistema Pensiones</label>
                                          {isEditingProfile ? (
                                              <select 
                                                value={profileForm.pensionSystem || ''}
                                                onChange={(e) => setProfileForm({...profileForm, pensionSystem: e.target.value})}
                                                className="w-full border border-gray-300 rounded p-1 text-sm bg-white"
                                              >
                                                  <option value="">Seleccionar</option>
                                                  <option value="ONP">ONP (13%)</option>
                                                  <option value="AFP Integra">AFP Integra (~11.7%)</option>
                                                  <option value="AFP Prima">AFP Prima (~11.7%)</option>
                                                  <option value="AFP Profuturo">AFP Profuturo (~11.7%)</option>
                                                  <option value="AFP Habitat">AFP Habitat (~11.7%)</option>
                                              </select>
                                          ) : <p className="text-sm font-medium">{selectedEmployee.pensionSystem || 'No registrado'}</p>}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          <div>
                                              <label className="text-[10px] font-bold text-gray-400 uppercase">Banco</label>
                                              {isEditingProfile ? (
                                                  <input type="text" value={profileForm.bankName || ''} onChange={e => setProfileForm({...profileForm, bankName: e.target.value})} className="w-full border border-gray-300 rounded p-1 text-sm"/>
                                              ) : <p className="text-sm">{selectedEmployee.bankName || '-'}</p>}
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-gray-400 uppercase">Cuenta / CCI</label>
                                              {isEditingProfile ? (
                                                  <input type="text" value={profileForm.bankAccount || ''} onChange={e => setProfileForm({...profileForm, bankAccount: e.target.value})} className="w-full border border-gray-300 rounded p-1 text-sm"/>
                                              ) : <p className="text-sm font-mono">{selectedEmployee.bankAccount || '-'}</p>}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </section>
                      </div>

                      {!isEditingProfile && (
                          <div className="mt-8">
                              <button onClick={() => { setActiveTab('SCHEDULE'); setSelectedEmployee(null); }} className="w-full bg-odoo-primary text-white py-3 rounded-lg font-bold hover:bg-odoo-primaryDark transition-colors shadow-lg">
                                  Gestionar Turnos de {selectedEmployee.name.split(' ')[0]}
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
