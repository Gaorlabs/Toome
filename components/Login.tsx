
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Database, Key, Lock, ArrowLeft, BarChart2, UserCog } from 'lucide-react';
import { ConnectionConfig } from '../types';

interface LoginProps {
  onAdminLogin: () => void;
  onClientLogin: (accessKey: string) => void;
  savedConfig: ConnectionConfig | null;
}

type LoginStep = 'CLIENT' | 'ADMIN_AUTH';

export const Login: React.FC<LoginProps> = ({ onAdminLogin, onClientLogin }) => {
  const [step, setStep] = useState<LoginStep>('CLIENT');
  
  // Admin Auth State
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Client Form State
  const [clientKey, setClientKey] = useState('');

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
    setAdminPassword('');
    setAuthError('');
  };

  return (
    // FIX: 'fixed inset-0' creates a dedicated layer that sits on top of everything
    // 'overflow-y-auto' enables native scrolling within this layer, fixing the mobile keyboard issue.
    <div className="fixed inset-0 z-50 w-full bg-[#F9FAFB] overflow-y-auto overflow-x-hidden">
      
      {/* Background Decor (Fixed so they don't scroll with content) */}
      <div className="fixed top-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-odoo-primary/20 blur-[80px] md:blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-odoo-secondary/20 blur-[100px] md:blur-[120px] animate-pulse-slow delay-300 pointer-events-none"></div>

      {/* Main Container: min-h-full allows centering when content is small, but expansion when content is tall */}
      <div className="min-h-full flex flex-col items-center justify-center p-4 py-8 md:py-12 relative z-10">
        
        {/* Card: Flex-col on mobile (stack), Flex-row on desktop (side-by-side) */}
        <div className="glass rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-slide-up ring-1 ring-white/50 mb-8 bg-white">
          
          {/* Brand Section */}
          <div 
            className="md:w-1/2 bg-gradient-to-br from-odoo-primary to-[#5a3a52] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden select-none"
          >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative z-10 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm mb-4 md:mb-6 shadow-inner border border-white/10">
                      <BarChart2 className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight font-ubuntu">Toome</h1>
                  <p className="text-odoo-light/90 text-sm md:text-lg font-light leading-relaxed">
                      Inteligencia de negocios unificada para tu ecosistema Odoo.
                  </p>
              </div>

              {/* Features hidden on very small screens to save space */}
              <div className="relative z-10 mt-8 md:mt-12 space-y-4 md:space-y-6 hidden sm:block">
                  <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
                          <Database size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-sm tracking-wide">Multi-Compañía</p>
                          <p className="text-xs opacity-75 font-light">Gestión de datos centralizada</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Form Section */}
          <div className="md:w-1/2 p-6 md:p-12 bg-white relative flex flex-col justify-center min-h-[400px] md:min-h-auto">
            
            {/* STEP 1: CLIENT LOGIN */}
            {step === 'CLIENT' && (
              <div className="animate-fade-in w-full max-w-sm mx-auto flex flex-col h-full justify-center">
                <div className="mb-6 md:mb-8 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight">Bienvenido</h2>
                    <p className="text-gray-500 font-light text-sm md:text-base">Accede a tu panel de control personalizado.</p>
                </div>
                
                <form onSubmit={handleClientSubmit} className="space-y-5 md:space-y-6">
                  <div className="group text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Clave de Acceso</label>
                    <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Key size={20} className="text-gray-400 group-focus-within:text-odoo-primary transition-colors" />
                      </div>
                      <input 
                        type="password"
                        value={clientKey}
                        onChange={(e) => setClientKey(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-odoo-primary/50 focus:border-odoo-primary focus:bg-white outline-none transition-all shadow-sm text-base md:text-lg"
                        placeholder="Ej: CL-8829-XP"
                        required
                        autoComplete="off" // Helps on mobile
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 bg-odoo-primary hover:bg-odoo-primaryDark text-white py-3 md:py-4 rounded-xl font-bold text-sm md:text-base tracking-wide shadow-lg shadow-odoo-primary/30 hover:shadow-odoo-primary/50 transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    <span>Ingresar al Dashboard</span>
                    <ArrowRight size={18} />
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <button 
                    onClick={() => setStep('ADMIN_AUTH')}
                    className="text-gray-400 hover:text-odoo-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors mx-auto p-2"
                  >
                    <UserCog size={16} />
                    <span>Soy Administrador</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ADMIN LOGIN */}
            {step === 'ADMIN_AUTH' && (
              <div className="animate-fade-in w-full max-w-sm mx-auto relative">
                <button 
                  onClick={resetToClient} 
                  className="absolute -top-12 right-0 md:top-0 md:right-0 text-gray-400 hover:text-odoo-dark flex items-center text-sm transition-colors font-medium p-2"
                >
                  <ArrowLeft size={16} className="mr-1" /> Volver
                </button>
                
                <div className="mb-6 md:mb-8 flex justify-center animate-slide-up">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-inner border border-red-100">
                    <Lock size={28} />
                  </div>
                </div>
                
                <div className="text-center mb-6 md:mb-8 animate-slide-up delay-100">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Acceso Administrativo</h2>
                    <p className="text-gray-500 font-light mt-1">Ingresa credenciales maestras</p>
                </div>

                <form onSubmit={verifyAdminPassword} className="space-y-6 animate-slide-up delay-200">
                  <div className="group">
                    <input 
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="block w-full px-6 py-3 md:py-4 text-center text-lg md:text-xl tracking-[0.5em] bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all shadow-sm"
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
                    className="w-full bg-gray-900 hover:bg-black text-white py-3 md:py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    Acceder al Panel
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center w-full text-xs text-gray-400 font-medium flex flex-col items-center gap-1 pb-4">
          <span>&copy; 2025 Toome Analytics. Secure Connection via Odoo XML-RPC.</span>
          <span>
            Desarrollado por <a href="#" className="text-odoo-primary hover:underline font-bold transition-colors">GaorSystem Perú</a>
          </span>
        </div>
      </div>
    </div>
  );
};
