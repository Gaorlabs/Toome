
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
    <div className="fixed inset-0 z-50 w-full bg-[#f3f4f6] overflow-y-auto overflow-x-hidden font-sans">
      
      {/* Background Decor - Subtle gradients to match the clean aesthetic */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-teal-100/50 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-purple-100/50 blur-[100px]"></div>
      </div>

      {/* Main Container */}
      <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        
        {/* Card Container */}
        <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] relative animate-fade-in ring-1 ring-black/5">
          
          {/* Left Section (Brand Visual) */}
          <div className="md:w-1/2 bg-[#0E5E6F] relative overflow-hidden flex flex-col justify-between p-8 md:p-12 text-white">
              {/* Gradient Overlay matching the reference image */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#017E84] to-[#2E1065] opacity-90"></div>
              {/* Texture/Noise overlay for premium feel */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
              
              {/* Logo & Headline */}
              <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-lg">
                      <BarChart2 className="text-white" size={28} />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight font-ubuntu">Toome</h1>
                  <p className="text-lg text-white/80 font-light leading-relaxed max-w-md">
                      Inteligencia de negocios unificada para tu ecosistema Odoo.
                  </p>
              </div>

              {/* Feature Cards (Glassmorphism) */}
              <div className="relative z-10 space-y-4 mt-12 md:mt-0">
                  <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-default">
                      <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                          <Database size={20} className="text-white" />
                      </div>
                      <div>
                          <h3 className="font-bold text-sm">Multi-Compañía</h3>
                          <p className="text-xs text-white/60">Gestión de datos centralizada</p>
                      </div>
                  </div>
                  <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-default">
                       <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck size={20} className="text-white" />
                      </div>
                      <div>
                          <h3 className="font-bold text-sm">Seguridad Avanzada</h3>
                          <p className="text-xs text-white/60">Control de acceso por roles</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Section (Login Form) */}
          <div className="md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center relative">
            
            {step === 'CLIENT' && (
              <div className="max-w-sm mx-auto w-full animate-slide-up">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 font-ubuntu">Bienvenido</h2>
                  <p className="text-gray-500 mb-10 text-sm">Accede a tu panel de control personalizado.</p>

                  <form onSubmit={handleClientSubmit} className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Clave de Acceso</label>
                          <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Key className="text-gray-400 group-focus-within:text-odoo-primary transition-colors" size={20} />
                              </div>
                              <input 
                                type="password"
                                value={clientKey}
                                onChange={(e) => setClientKey(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-odoo-primary/20 focus:border-odoo-primary transition-all font-medium text-lg"
                                placeholder="Ej: CL-8829-XP"
                                required
                              />
                          </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-[#017E84] hover:bg-[#006064] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                          <span>Ingresar al Dashboard</span>
                          <ArrowRight size={20} />
                      </button>
                  </form>

                  <div className="mt-12 text-center border-t border-gray-100 pt-8">
                      <button 
                        onClick={() => setStep('ADMIN_AUTH')}
                        className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors group"
                      >
                          <UserCog size={16} className="group-hover:scale-110 transition-transform"/>
                          <span>Soy Administrador</span>
                      </button>
                  </div>
              </div>
            )}

            {step === 'ADMIN_AUTH' && (
              <div className="max-w-sm mx-auto w-full animate-slide-up">
                   <button 
                    onClick={resetToClient}
                    className="absolute top-8 left-8 md:left-12 text-gray-400 hover:text-gray-900 transition-colors"
                   >
                       <ArrowLeft size={24} />
                   </button>

                  <div className="text-center mb-8 mt-4">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500 ring-4 ring-red-50">
                          <Lock size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Acceso Admin</h2>
                      <p className="text-gray-500 text-sm mt-1">Credenciales maestras requeridas.</p>
                  </div>

                  <form onSubmit={verifyAdminPassword} className="space-y-6">
                      <div>
                          <input 
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            placeholder="••••••••"
                            autoFocus
                            required
                          />
                          {authError && (
                              <p className="text-red-500 text-sm font-bold text-center mt-3 animate-pulse bg-red-50 py-1 px-3 rounded-full inline-block w-full">{authError}</p>
                          )}
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                          Desbloquear
                      </button>
                  </form>
              </div>
            )}

          </div>

        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 font-medium pb-4">
            <p>&copy; 2025 Toome Analytics. Secure Connection via Odoo XML-RPC.</p>
            <p className="mt-1 opacity-75">Desarrollado por <span className="text-odoo-primary font-bold">GaorSystem Perú</span></p>
        </div>

      </div>
    </div>
  );
};
