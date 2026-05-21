import React, { useState } from 'react';
import { UserCog, Truck, ClipboardList, Package, CircleDollarSign, Compass, LogIn } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const sellers = [
    { id: 'S1', name: 'Luis Preventista - Zona Norte' },
    { id: 'S2', name: 'Ana Preventista - Zona Sur' },
    { id: 'S3', name: 'Carlos Preventista - Zona Centro' },
    { id: 'S4', name: 'Diana Preventista - Zona Callao' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    const lowerUser = username.trim().toLowerCase();

    if (lowerUser === 'admin' || lowerUser.includes('administrador')) {
      onLogin({
        role: 'ADMIN',
        name: 'Administrador Principal'
      });
    } else {
      // Map existing profiles if they match, otherwise use the typed name
      let mappedName = username.trim();
      let sellerId = 'S_CUSTOM';

      if (lowerUser.includes('luis')) {
        mappedName = 'Luis Preventista - Zona Norte';
        sellerId = 'S1';
      } else if (lowerUser.includes('ana')) {
        mappedName = 'Ana Preventista - Zona Sur';
        sellerId = 'S2';
      } else if (lowerUser.includes('carlos')) {
        mappedName = 'Carlos Preventista - Zona Centro';
        sellerId = 'S3';
      } else if (lowerUser.includes('diana')) {
        mappedName = 'Diana Preventista - Zona Callao';
        sellerId = 'S4';
      }

      onLogin({
        role: 'SELLER',
        name: mappedName,
        sellerId: sellerId
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f3e7f3] via-[#f7f0f6] to-[#e0f5f4] font-sans relative flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#E3F8F8]/40 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#F0E5F4]/40 blur-[130px]" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 overflow-hidden flex flex-col md:flex-row min-h-[550px]">
          
          {/* Brand Presentation Panel (Left Side) */}
          <div className="md:w-[42%] bg-gradient-to-br from-[#0b5762] to-[#1a1f4c] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400/10 via-transparent to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-white/10 mb-6 backdrop-blur-md shadow-lg">
                <Truck size={28} className="text-white animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Toome</h1>
              <p className="text-sm font-semibold text-teal-100/80 mt-1 uppercase tracking-wider">Ventas & Distribución</p>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed font-light">
                Plataforma integrada de preventa en campo, control de stock listo para envío y distribución inteligente por rutas de despacho.
              </p>
            </div>

            {/* Micro value statements */}
            <div className="relative z-10 space-y-3.5 mt-8 md:mt-0">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-1.5 bg-white/10 rounded-lg text-white/80">
                  <ClipboardList size={16} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold leading-tight">Pedidos en Campo</h4>
                  <p className="text-[10px] text-white/60">Toma de pedidos en la tienda del cliente</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-1.5 bg-white/10 rounded-lg text-white/80">
                  <Compass size={16} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold leading-tight">Distribución & Zonas</h4>
                  <p className="text-[10px] text-white/60">Rutas ordenadas el día siguiente</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-1.5 bg-white/10 rounded-lg text-white/80">
                  <Package size={16} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold leading-tight">Kardex de Inventario</h4>
                  <p className="text-[10px] text-white/60">Sincronizado con almacén de despacho</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Form Panel (Right Side) */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-sm mx-auto">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Ingreso al Sistema</h2>
              <p className="text-sm text-slate-500 mb-8">Por favor, ingrese sus credenciales para continuar.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-150 text-rose-600 rounded-xl text-xs font-bold">
                    ⚠️ {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Ej. admin o luis"
                      className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm text-[#007678] focus:outline-none focus:ring-2 focus:ring-[#007678]/20 focus:border-[#007678] font-bold placeholder-slate-400 shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••"
                      className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm text-[#007678] focus:outline-none focus:ring-2 focus:ring-[#007678]/20 focus:border-[#007678] font-bold placeholder-slate-400 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  💡 Ingrese <strong className="text-[#007678]">admin</strong> para iniciar como Administrador, o el nombre de un preventista (ej: <strong className="text-[#007678]">luis</strong>) para ingresar como Vendedor en Campo.
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-[#007678] hover:bg-[#005e60] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <span className="uppercase tracking-wider text-xs font-black">Iniciar Sesión</span>
                  <LogIn size={16} />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Credential Signoff */}
      <div className="p-4 text-center text-[11px] text-slate-400 border-none bg-transparent font-medium">
        Distribución & Despacho Toome Campo • Versión 3.0 • Desarrollado por <span className="text-[#007678] font-bold">GaorSystem Perú</span>
      </div>
    </div>
  );
};
