import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Database, Key, Lock, ArrowLeft } from 'lucide-react';
import { ConnectionConfig } from '../types';

interface LoginProps {
  onAdminLogin: () => void; // Changed: No config required to login
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
      // Direct login on success, configuration happens inside the app
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
    <div className="min-h-screen bg-gradient-to-br from-odoo-dark to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Brand Section - Hidden Trigger Area */}
        <div 
          onClick={handleLogoClick}
          className="md:w-1/2 bg-odoo-primary p-12 text-white flex flex-col justify-between relative overflow-hidden cursor-pointer select-none active:bg-odoo-dark transition-colors"
          title="Toome Platform"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Toome</h1>
            <p className="text-odoo-light opacity-90 text-lg">Plataforma inteligente de análisis de datos conectada a tu ecosistema Odoo.</p>
          </div>
          <div className="relative z-10 mt-8 pointer-events-none">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Database size={20} />
              </div>
              <div>
                <p className="font-bold">Multi-Compañía</p>
                <p className="text-xs opacity-75">Gestión centralizada</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-bold">Acceso Seguro</p>
                <p className="text-xs opacity-75">Roles personalizados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:w-1/2 p-12 bg-gray-50 relative">
          
          {/* STEP 1: CLIENT LOGIN (DEFAULT) */}
          {step === 'CLIENT' && (
            <div className="animate-fade-in h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
              <p className="text-gray-500 mb-8">Ingresa tu clave de acceso de cliente.</p>
              
              <form onSubmit={handleClientSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clave de Acceso</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={18} className="text-gray-400" />
                    </div>
                    <input 
                      type="password"
                      value={clientKey}
                      onChange={(e) => setClientKey(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-odoo-primary focus:border-odoo-primary transition-all"
                      placeholder="Ej: CL-8829-XP"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-odoo-primary hover:bg-odoo-dark text-white py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02]"
                >
                  <span>Ingresar al Dashboard</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ADMIN PASSWORD CHECK */}
          {step === 'ADMIN_AUTH' && (
            <div className="animate-fade-in h-full flex flex-col justify-center">
              <button onClick={resetToClient} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 flex items-center text-sm">
                <ArrowLeft size={16} className="mr-1" /> Volver
              </button>
              
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <Lock size={32} />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Acceso Administrativo</h2>
              <p className="text-gray-500 text-center mb-8">Ingresa la contraseña maestra para continuar.</p>

              <form onSubmit={verifyAdminPassword} className="space-y-4">
                <div>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="block w-full px-4 py-3 text-center text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                    autoFocus
                    required
                  />
                  {authError && <p className="text-red-500 text-sm text-center mt-2">{authError}</p>}
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-black text-white py-3 rounded-lg font-bold transition-all"
                >
                  Acceder al Panel
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};