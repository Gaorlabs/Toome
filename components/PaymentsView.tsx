import React, { useState } from 'react';
import { 
  PiggyBank, CircleDollarSign, Plus, CheckCircle2, User, FileText, 
  MapPin, ClipboardCheck, ArrowUpRight, Search, Landmark
} from 'lucide-react';
import { PaymentRecord, ClientStore, PaymentMethodType } from '../types';

interface PaymentsViewProps {
  payments: PaymentRecord[];
  clients: ClientStore[];
  onAddPayment: (newPayment: PaymentRecord) => void;
  onClearBalance: (clientId: string, amount: number) => void;
  session: { role: 'ADMIN' | 'SELLER'; name: string };
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  clients,
  onAddPayment,
  onClearBalance,
  session
}) => {
  const isAdmin = session.role === 'ADMIN';

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amountVal, setAmountVal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [referenceNum, setReferenceNum] = useState('');
  const [remarks, setRemarks] = useState('');

  // Selected client record
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Por favor seleccione el cliente de origen.");
      return;
    }
    if (amountVal <= 0) {
      alert("Por favor ingrese un monto superior a 0.");
      return;
    }

    const payId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: PaymentRecord = {
      id: payId,
      orderId: 'S/N (Pago Manual)',
      storeName: selectedClient?.name || 'Cliente Genérico',
      amount: Number(amountVal),
      paymentMethod,
      referenceNum: referenceNum.trim() ? referenceNum : undefined,
      date: new Date().toISOString().split('T')[0],
      remarks,
      approvedByAdmin: isAdmin // Auto approve if admin, else pending
    };

    onAddPayment(newRecord);
    onClearBalance(selectedClientId, Number(amountVal));

    // Reset Form
    setSelectedClientId('');
    setAmountVal(0);
    setReferenceNum('');
    setRemarks('');
    setShowAddForm(false);
  };

  // KPI Calculations
  const calculatedTotalRevenue = payments
    .filter(p => p.approvedByAdmin)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingApprovalTotal = payments
    .filter(p => !p.approvedByAdmin)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <PiggyBank size={13} /> TESORERÍA / CAJA RECAUDACIÓN
          </h5>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Gestión de Pagos y Recaudación
          </h1>
          <p className="text-xs text-slate-400">Verifique arqueos de caja diaria, amortizaciones y amortizaciones de deudas de las tiendas de su cartera peruana.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#017E84] hover:bg-[#006064] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <Plus size={15} />
          <span>Registrar Cobro</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center h-24">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Recaudación Aprobada</p>
            <h3 className="text-2xl font-black text-emerald-600">S/ {calculatedTotalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ClipboardCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center h-24">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cobros en Rendición</p>
            <h3 className="text-2xl font-black text-amber-500">S/ {pendingApprovalTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <Landmark size={22} className={pendingApprovalTotal > 0 ? 'animate-pulse' : ''} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center h-24">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Deuda Total de Clientes</p>
            <h3 className="text-2xl font-black text-rose-500">
              S/ {clients.reduce((sum, c) => sum + c.outstandingBalance, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
            <CircleDollarSign size={22} />
          </div>
        </div>

      </div>

      {/* Show Add Manual Payment form */}
      {showAddForm && (
        <form onSubmit={handlePaymentSubmit} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-spreadsheet space-y-5 animate-slide-up max-w-2xl">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Registrar Cobro Realizado a Tienda</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase">Seleccione Tienda / Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              >
                <option value="">-- SELECCIONAR CLIENTE --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (S/ {c.outstandingBalance.toFixed(2)} saldo)
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && selectedClient.outstandingBalance > 0 && (
              <div className="sm:col-span-1 bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-100/60 text-xxs flex flex-col justify-center">
                <p className="font-bold">Deuda Pendiente de esta Bodega:</p>
                <p className="text-base font-black mt-1">S/ {selectedClient.outstandingBalance.toFixed(2)}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase">Monto Recaudado (S/)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountVal || ''}
                onChange={(e) => setAmountVal(Number(e.target.value))}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none bg-slate-50 font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase">Vía de Recepción (Canal)</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white font-medium"
              >
                <option value="CASH">Efectivo Físico</option>
                <option value="YAPE">Yape / Plin QR</option>
                <option value="TRANSFER">Transferencia BCP/BBVA</option>
                <option value="CREDIT_CARD">P.O.S. Tarjeta</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase">Nro. de Operación / Transferencia (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. YAPE392019"
                value={referenceNum}
                onChange={(e) => setReferenceNum(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xxs font-bold text-slate-400 uppercase">Observaciones del Cobro</label>
              <input
                type="text"
                placeholder="Amortización de deuda por factura..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50"
              />
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
              Ingresar Recibo
            </button>
          </div>
        </form>
      )}

      {/* Payments History Register Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-spreadsheet overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Registro Cronológico de Cobros</h3>
          <p className="text-xs text-slate-400">Historial continuo de todo el efectivo y dinero electrónico ingresado al sistema.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">ID Pago</th>
                <th className="py-3 px-6">Tienda / Cliente</th>
                <th className="py-3 px-6">Operación/Pedido</th>
                <th className="py-3 px-6">Fecha Registro</th>
                <th className="py-3 px-6 text-center">Método Real</th>
                <th className="py-3 px-6 text-center">Operación Nro.</th>
                <th className="py-3 px-6">Observación</th>
                <th className="py-3 px-6 text-right">Monto Recaudado</th>
                <th className="py-3 px-6 text-center">Estado Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-xs font-black text-slate-400">{p.id}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-800 text-xs">{p.storeName}</td>
                  <td className="py-3.5 px-6 font-medium text-slate-400 text-[10px]">{p.orderId}</td>
                  <td className="py-3.5 px-6 text-slate-500 font-medium text-xs">{p.date}</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[9px] uppercase">
                      {p.paymentMethod === 'CASH' ? 'EFECTIVO' : p.paymentMethod === 'YAPE' ? 'QR YAPE/PLIN' : p.paymentMethod === 'TRANSFER' ? 'TRANSFERENCIA' : 'TARJETA'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono text-slate-400 font-semibold text-xxs">{p.referenceNum || 'S/N'}</td>
                  <td className="py-3.5 px-6 text-xs text-slate-500 max-w-[150px] truncate" title={p.remarks}>{p.remarks || '---'}</td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-[#017E84] text-xs">S/ {p.amount.toFixed(2)}</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      p.approvedByAdmin 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                    }`}>
                      {p.approvedByAdmin ? 'Recaudado' : 'Pendiente Arqueo'}
                    </span>
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                     Sin movimientos registrados para el cuadre contable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
