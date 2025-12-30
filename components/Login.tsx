import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Database, Key, Lock, ArrowLeft, BarChart2 } from 'lucide-react';
import { ConnectionConfig } from '../types';

interface LoginProps {
  onAdminLogin: () => void;
  onClientLogin: (accessKey: string) => void;
  savedConfig: ConnectionConfig | null;
}

type LoginStep = 'CLIENT' | 'ADMIN_AUTH';

export const Login: React.FC<LoginProps> = ({ onAdminLogin, onClientLogin }) => {
  const [step, setStep] = useState<LoginStep>('CLIENT');
  const [clickCount, setClickCount] = useState(0);
  
  // Admin Auth State
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Client Form State
  const [clientKey, setClientKey] = useState('');

  // Hidden Trigger Logic
  const handleLogoClick = () => {
    if (step !== 'CLIENT') return;
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 4) {
      setStep('ADMIN_AUTH');
      setClickCount(0);
      setAdminPassword('');
      setAuthError('');
    }
  };

  const verifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Luis2021.') {
      onAdminLogin();
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta');
      setAdminPassword('');
    }
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClientLogin(clientKey);
  };

  const resetToClient = () => {
    setStep('CLIENT');
    setClickCount(0);
    setAdminPassword('');
    setAuthError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-odoo-primary/20 blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-odoo-secondary/20 blur-[120px] animate-pulse-slow delay-300 pointer-events-none"></div>

      <div className="glass rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-slide-up ring-1 ring-white/50">
        
        {/* Brand Section */}
        <div 
          onClick={handleLogoClick}
          className="md:w-1/2 bg-gradient-to-br from-odoo-primary to-[#5a3a52] p-12 text-white flex flex-col justify-between relative overflow-hidden cursor-pointer select-none group"
        >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div className="relative z-10 group-hover:scale-105 transition-transform duration-500">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm mb-6 shadow-inner border border-white/10">
                    <BarChart2 className="text-white" />
                </div>
                <h1 className="text-5xl font-bold mb-4 tracking-tight">Toome</h1>
                <p className="text-odoo-light/90 text-lg font-light leading-relaxed">
                    Inteligencia de negocios unificada para tu ecosistema Odoo.
                </p>
            </div>

            <div className="relative z-10 mt-12 space-y-6">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transform transition-transform hover:translate-x-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
                        <Database size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm tracking-wide">Multi-Compañía</p>
                        <p className="text-xs opacity-75 font-light">Gestión de datos centralizada</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transform transition-transform hover:translate-x-2 delay-100">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm tracking-wide">Seguridad Avanzada</p>
                        <p className="text-xs opacity-75 font-light">Control de acceso por roles</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Form Section */}
        <div className="md:w-1/2 p-12 bg-white/60 relative flex flex-col justify-center">
          
          {/* STEP 1: CLIENT LOGIN */}
          {step === 'CLIENT' && (
            <div className="animate-fade-in w-full max-w-sm mx-auto">
              <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Bienvenido</h2>
                  <p className="text-gray-500 font-light">Accede a tu panel de control personalizado.</p>
              </div>
              
              <form onSubmit={handleClientSubmit} className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Clave de Acceso</label>
                  <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key size={20} className="text-gray-400 group-focus-within:text-odoo-primary transition-colors" />
                    </div>
                    <input 
                      type="password"
                      value={clientKey}
                      onChange={(e) => setClientKey(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-white/80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-odoo-primary/50 focus:border-odoo-primary focus:bg-white outline-none transition-all shadow-sm"
                      placeholder="Ej: CL-8829-XP"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-odoo-primary hover:bg-odoo-primary/90 text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-odoo-primary/30 hover:shadow-odoo-primary/50 transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  <span>Ingresar al Dashboard</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ADMIN LOGIN */}
          {step === 'ADMIN_AUTH' && (
            <div className="animate-fade-in w-full max-w-sm mx-auto">
              <button onClick={resetToClient} className="absolute top-8 right-8 text-gray-400 hover:text-odoo-dark flex items-center text-sm transition-colors font-medium">
                <ArrowLeft size={16} className="mr-1" /> Volver
              </button>
              
              <div className="mb-8 flex justify-center animate-slide-up">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-inner border border-red-100">
                  <Lock size={32} />
                </div>
              </div>
              
              <div className="text-center mb-8 animate-slide-up delay-100">
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Acceso Administrativo</h2>
                  <p className="text-gray-500 font-light mt-1">Ingresa credenciales maestras</p>
              </div>

              <form onSubmit={verifyAdminPassword} className="space-y-6 animate-slide-up delay-200">
                <div className="group">
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="block w-full px-6 py-4 text-center text-xl tracking-[0.5em] bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all shadow-sm group-focus-within:shadow-md"
                    placeholder="••••••••"
                    autoFocus
                    required
                  />
                  {authError && (
                    <div className="flex items-center justify-center mt-3 text-red-500 text-sm font-medium animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {authError}
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  Acceder al Panel
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center w-full text-xs text-gray-400 font-medium">
        &copy; 2025 Toome Analytics. Secure Connection via Odoo XML-RPC.
      </div>
    </div>
  );
};