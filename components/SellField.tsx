import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, Minus, ShoppingCart, User, MapPin, 
  Trash2, Send, CheckCircle2, ArrowLeft, Package, Edit3, X, Check, Save, UserPlus,
  CircleDollarSign, PiggyBank, Eye, HelpCircle, AlertTriangle, Truck, Kanban, List, Calendar, ChevronRight
} from 'lucide-react';
import { Product, ClientStore, Order, OrderItem, PaymentRecord, PaymentMethodType, DeliveryRoute } from '../types';
import { OrderWorkspace } from './OrderWorkspace';

interface SellFieldProps {
  products: Product[];
  clients: ClientStore[];
  orders?: Order[];
  routes?: DeliveryRoute[];
  session: { role: 'ADMIN' | 'SELLER'; name: string; sellerId?: string };
  onAddOrder: (order: Order) => void;
  onNavigate: any;
  onAddClient?: (newClient: ClientStore) => void;
  onUpdateClient?: (updatedClient: ClientStore) => void;
  onAddPayment?: (newPayment: PaymentRecord) => void;
  onClearBalance?: (clientId: string, amount: number) => void;
  onConfirmOrder?: (orderId: string, scheduledDate: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeliverOrder?: (orderId: string) => void;
  onAssignOrderToRoute?: (orderId: string, routeId: string | undefined) => void;
  onCreateRoute?: (newRoute: Omit<DeliveryRoute, 'id'>) => void;
}

export const SellField: React.FC<SellFieldProps> = ({ 
  products, 
  clients, 
  orders = [],
  routes = [],
  session, 
  onAddOrder,
  onNavigate,
  onAddClient,
  onUpdateClient,
  onAddPayment,
  onClearBalance,
  onConfirmOrder,
  onCancelOrder,
  onDeliverOrder,
  onAssignOrderToRoute,
  onCreateRoute
}) => {
  // Active Order State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientForDebt, setSelectedClientForDebt] = useState<ClientStore | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastGenId, setLastGenId] = useState('');

  // Workspace Tabs and filters for orders administration
  const [activeTab, setActiveTab] = useState<'REGISTRAR' | 'CONTROL'>('CONTROL');
  const [displayMode, setDisplayMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  
  // Logistics helpers
  const [adminShipDates, setAdminShipDates] = useState<Record<string, string>>({});
  const [showQuickRouteForm, setShowQuickRouteForm] = useState(false);
  const [quickRouteZone, setQuickRouteZone] = useState('Zona Norte');
  const [quickRouteDriver, setQuickRouteDriver] = useState('Felipe Sandoval (Camioneta Hino 4T)');
  const [quickRouteNameInput, setQuickRouteNameInput] = useState('');

  // Search state for products catalogue
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  // Search and creation states for clients
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);

  // Form Fields for Add/Edit Client
  const [formStoreName, setFormStoreName] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formDocType, setFormDocType] = useState<'DNI' | 'RUC' | 'Otro'>('RUC');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formZone, setFormZone] = useState('Zona Norte');
  const [formPhone, setFormPhone] = useState('');

  const zones = ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'];

  // Selected client details
  const activeClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [selectedClientId, clients]);

  // States for Collection / Cobros on the field
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Keep debt client reactive to database updates
  const currentDebtClient = useMemo(() => {
    if (!selectedClientForDebt) return null;
    return clients.find(c => c.id === selectedClientForDebt.id) || selectedClientForDebt;
  }, [selectedClientForDebt, clients]);

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDebtClient) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Por favor, ingrese un monto válido mayor a 0.");
      return;
    }

    if (amountNum > currentDebtClient.outstandingBalance) {
      if (!window.confirm(`El monto cobrado (S/ ${amountNum.toFixed(2)}) supera la deuda actual (S/ ${currentDebtClient.outstandingBalance.toFixed(2)}). ¿Desea proceder?`)) {
        return;
      }
    }

    const payId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: PaymentRecord = {
      id: payId,
      orderId: 'S/N (Cobranza en Campo)',
      storeName: currentDebtClient.name,
      amount: amountNum,
      paymentMethod,
      referenceNum: paymentRef.trim() ? paymentRef : undefined,
      date: new Date().toISOString().split('T')[0],
      remarks: paymentRemarks.trim() ? paymentRemarks : 'Cobranza registrada por vendedor en campo',
      approvedByAdmin: false // Field collections are unapproved (pending admin validation)
    };

    if (onAddPayment) {
      onAddPayment(newRecord);
    }
    if (onClearBalance) {
      onClearBalance(currentDebtClient.id, amountNum);
    }

    // Show success message
    setPaymentSuccessMsg(`¡Cobro registrado con éxito por S/ ${amountNum.toFixed(2)}!`);
    
    // Clear forms
    setPaymentAmount('');
    setPaymentRef('');
    setPaymentRemarks('');
    
    setTimeout(() => {
      setPaymentSuccessMsg('');
      setIsRegisteringPayment(false);
    }, 2200);
  };

  // Computations for advanced Order Management with list & Kanban togglers
  const availableSellers = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.sellerName))).filter(Boolean);
  }, [orders]);

  const availableZonesList = useMemo(() => {
    const zs = new Set(orders.map(o => o.storeZone));
    ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Zona Este', 'Zona Callao'].forEach(z => zs.add(z));
    return Array.from(zs).filter(Boolean);
  }, [orders]);

  const activeDetailOrder = useMemo(() => {
    if (!selectedOrderForDetail) return null;
    return orders.find(o => o.id === selectedOrderForDetail.id) || selectedOrderForDetail;
  }, [selectedOrderForDetail, orders]);

  const checkStockAvailability = useMemo(() => {
    return (order: Order) => {
      const issues: string[] = [];
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          if (prod.stock < item.qty) {
            issues.push(`${prod.name}: requerido ${item.qty}, stock actual ${prod.stock}`);
          }
        } else {
          issues.push(`Producto de ID ${item.productId} no encontrado en catálogo`);
        }
      });
      return issues;
    };
  }, [products]);

  const filteredOrdersList = useMemo(() => {
    let list = [...orders];
    
    // If SELLER, filter strictly to show only their orders
    if (session.role === 'SELLER') {
      list = list.filter(o => o.sellerName === session.name || o.sellerId === session.sellerId);
    } else {
      // Admin filters
      if (sellerFilter !== 'ALL') {
        list = list.filter(o => o.sellerName === sellerFilter);
      }
    }

    if (zoneFilter !== 'ALL') {
      list = list.filter(o => o.storeZone === zoneFilter);
    }

    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      list = list.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.storeName.toLowerCase().includes(query) ||
        o.storeAddress.toLowerCase().includes(query)
      );
    }

    return list;
  }, [orders, session, sellerFilter, zoneFilter, orderSearchQuery]);

  // Unique categories of products
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['TODOS', ...Array.from(list)];
  }, [products]);

  // Filtered clients list based on search word (checks name, owner, docNumber / ruc / dni)
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) {
      return clients.slice(0, 6); // show first few by default for convenience
    }
    const query = clientSearchQuery.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.ownerName.toLowerCase().includes(query) ||
      c.docNumber.includes(query) ||
      c.address.toLowerCase().includes(query)
    );
  }, [clients, clientSearchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle direct item quantity change
  const handleSetQty = (productId: string, qty: number, maxStock: number) => {
    const newQty = Math.max(0, Math.min(maxStock, qty));
    setQuantities(prev => ({
      ...prev,
      [productId]: newQty
    }));
  };

  // Build temporary cart based on quantities > 0
  const cartItems = useMemo<OrderItem[]>(() => {
    const list: OrderItem[] = [];
    Object.entries(quantities).forEach(([productId, qty]) => {
      if (qty > 0) {
        const prod = products.find(p => p.id === productId);
        if (prod) {
          list.push({
            productId: prod.id,
            productName: prod.name,
            qty,
            price: prod.salePrice,
            discount: 0,
            total: Number((qty * prod.salePrice).toFixed(2))
          });
        }
      }
    });
    return list;
  }, [quantities, products]);

  // Financial calculations
  const cartTotal = useMemo(() => {
    return Number(cartItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return Number((cartTotal / 1.18).toFixed(2));
  }, [cartTotal]);

  const cartIgv = useMemo(() => {
    return Number((cartTotal - cartSubtotal).toFixed(2));
  }, [cartTotal, cartSubtotal]);

  // Handle addition of a client from inline form
  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStoreName.trim() || !formOwnerName.trim() || !formDocNumber.trim()) {
      alert("Por favor rellene los campos obligatorios del cliente.");
      return;
    }

    const newId = `C${Math.floor(100 + Math.random() * 900)}`;
    const newClient: ClientStore = {
      id: newId,
      name: formStoreName,
      ownerName: formOwnerName,
      docType: formDocType,
      docNumber: formDocNumber,
      address: formAddress || 'Dirección no especificada',
      zone: formZone,
      phone: formPhone || '-',
      outstandingBalance: 0
    };

    if (onAddClient) {
      onAddClient(newClient);
    }
    
    // Automatically select the newly created client
    setSelectedClientId(newId);
    
    // Reset client form states
    setFormStoreName('');
    setFormOwnerName('');
    setFormDocNumber('');
    setFormAddress('');
    setFormPhone('');
    setIsAddingClient(false);
  };

  // Launch pre-filled editing wrapper
  const handleStartEdit = () => {
    if (!activeClient) return;
    setFormStoreName(activeClient.name);
    setFormOwnerName(activeClient.ownerName);
    setFormDocType(activeClient.docType as any);
    setFormDocNumber(activeClient.docNumber);
    setFormAddress(activeClient.address);
    setFormZone(activeClient.zone);
    setFormPhone(activeClient.phone);
    setIsEditingClient(true);
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;
    if (!formStoreName.trim() || !formOwnerName.trim() || !formDocNumber.trim()) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    const updatedClient: ClientStore = {
      ...activeClient,
      name: formStoreName,
      ownerName: formOwnerName,
      docType: formDocType,
      docNumber: formDocNumber,
      address: formAddress,
      zone: formZone,
      phone: formPhone
    };

    if (onUpdateClient) {
      onUpdateClient(updatedClient);
    }

    setIsEditingClient(false);
  };

  // Handle confirmation
  const handleConfirmOrder = () => {
    if (!selectedClientId) {
      alert("Por favor seleccione un cliente / tienda.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Por favor establezca la cantidad de al menos 1 producto.");
      return;
    }

    const orderId = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      storeId: selectedClientId,
      storeName: activeClient?.name || 'Tienda',
      storeZone: activeClient?.zone || 'Zona General',
      storeAddress: activeClient?.address || 'Dirección',
      sellerId: session.sellerId || 'S1',
      sellerName: session.name || 'Preventista',
      date: new Date().toISOString().split('T')[0],
      items: cartItems,
      total: cartTotal,
      baseAmount: cartSubtotal,
      igvAmount: cartIgv,
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'UNPAID',
      paymentMethod: 'CASH',
      paidAmount: 0,
      shippingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
      notes: notes
    };

    onAddOrder(newOrder);
    setLastGenId(orderId);
    setSuccess(true);
    
    // Clean states
    setQuantities({});
    setSelectedClientId('');
    setNotes('');
  };

  // COMPLETED VISIT SUCCESS SCREEN OR MAIN DUAL-WORKSPACE
  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* CENTRALIZED TAB SWITCHER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#017E84] tracking-widest uppercase">
            <ShoppingCart size={12} className="animate-pulse" /> Workspace Comercial
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Toma & Control de Pedidos
          </h1>
          <p className="text-xs text-slate-400">
            {session.role === 'ADMIN' 
              ? 'Consolide e inspeccione pedidos de preventistas, autorice stocks y despache furgones.' 
              : 'Gestione su cartera de clientes, registre preventas de hoy y consulte deudas vigentes.'}
          </p>
        </div>

        {/* Unified Tab Switcher */}
        <div className="flex p-0.5 bg-slate-100 rounded-2xl w-full md:w-auto shrink-0 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('CONTROL')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'CONTROL' 
                ? 'bg-[#017E84] text-white shadow' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List size={14} />
            <span>Control de Pedidos ({orders.length})</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTRAR');
              setSelectedClientId('');
              setQuantities({});
              setSuccess(false);
            }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'REGISTRAR' 
                ? 'bg-[#017E84] text-white shadow' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus size={14} />
            <span>Nueva Preventa</span>
          </button>
        </div>
      </div>

      {activeTab === 'CONTROL' ? (
        <OrderWorkspace
          products={products}
          clients={clients}
          orders={orders}
          routes={routes}
          session={session}
          onNavigate={onNavigate}
          onConfirmOrder={onConfirmOrder}
          onCancelOrder={onCancelOrder}
          onDeliverOrder={onDeliverOrder}
          onAssignOrderToRoute={onAssignOrderToRoute}
          onCreateRoute={onCreateRoute}
        />
      ) : success ? (
        <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 shadow-sm">
            <CheckCircle2 size={36} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">¡Pedido Enviado a Distribución!</h2>
            <p className="text-sm text-slate-500">
              Código registrado en cola: <span className="font-extrabold text-[#017E84]">{lastGenId}</span>
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              El pedido está listo para despacho según la zona correspondiente del furgón de reparto de mañana.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={() => {
                setSuccess(false);
              }}
              className="w-full bg-[#017E84] hover:bg-[#006064] text-white py-3 rounded-xl font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              Tomar Otro Pedido
            </button>
            <button
              onClick={() => setActiveTab('CONTROL')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Ver Panel de Control de Pedidos
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Toma de Pedido Móvil</h1>
          <p className="text-xs text-slate-500">Registra clientes y toma pedidos de forma directa y simplificada.</p>
        </div>
        <div className="bg-teal-50 text-[#017E84] text-xs font-bold px-3.5 py-1.5 rounded-lg border border-teal-100">
          Vendedor: <span className="font-extrabold">{session.name}</span>
        </div>
      </div>

      {/* STEP 1: CLIENT MANAGEMENT (SEARCH / CHOOSE / CREATE / EDIT) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet space-y-4">
        
        {/* COMPACT INTERACTIVE SELECTOR HEADLINE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm uppercase tracking-wide">
            <User size={16} className="text-[#017E84]" />
            <span>1. Selecciona o Crea el Cliente</span>
          </div>

          {!selectedClientId && !isAddingClient && (
            <button
              type="button"
              onClick={() => setIsAddingClient(true)}
              className="bg-teal-50 hover:bg-teal-100 text-[#017E84] px-4 py-2 rounded-xl text-xxs font-black transition-all border border-teal-100 flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              NUEVO CLIENTE
            </button>
          )}
        </div>

        {/* CASE A: ADDING CLIENT FORM (IN-LINE) */}
        {isAddingClient ? (
          <form onSubmit={handleSaveNewClient} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 animate-fade-in text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-extrabold text-[#017E84] uppercase text-[10px] tracking-wider">Crear Nuevo Cliente</span>
              <button 
                type="button" 
                onClick={() => setIsAddingClient(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Comercial *</label>
                <input
                  type="text"
                  placeholder="Ej. Bodega Rosita"
                  value={formStoreName}
                  onChange={(e) => setFormStoreName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Propietario / Dueño *</label>
                <input
                  type="text"
                  placeholder="Ej. Rosa Benitez"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo Doc.</label>
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="RUC">RUC</option>
                    <option value="DNI">DNI</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">RUC / DNI *</label>
                  <input
                    type="text"
                    placeholder="Ej. 10459381921"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dirección de Tienda</label>
                <input
                  type="text"
                  placeholder="Ej. Av. Larco 450"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Zona / Ruta despacho</label>
                <select
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono Celular</label>
                <input
                  type="text"
                  placeholder="Ej. 993881232"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddingClient(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-xxs transition-all text-slate-700"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xxs transition-all shadow-sm flex items-center gap-1"
              >
                <Check size={12} />
                REGISTRAR Y SELECCIONAR
              </button>
            </div>
          </form>
        ) : isEditingClient && activeClient ? (
          
          /* CASE B: EDITING ACTIVE CLIENT DETAILS */
          <form onSubmit={handleSaveEditClient} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 animate-fade-in text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-extrabold text-[#017E84] uppercase text-[10px] tracking-wider">Editar Ficha de {activeClient.name}</span>
              <button 
                type="button" 
                onClick={() => setIsEditingClient(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Comercial *</label>
                <input
                  type="text"
                  value={formStoreName}
                  onChange={(e) => setFormStoreName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Propietario / Dueño *</label>
                <input
                  type="text"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo Doc.</label>
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="RUC">RUC</option>
                    <option value="DNI">DNI</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">RUC / DNI *</label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dirección de Tienda</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Zona / Ruta despacho</label>
                <select
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono Celular</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditingClient(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-xxs transition-all text-slate-700"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-black text-xxs transition-all shadow-sm flex items-center gap-1"
              >
                <Save size={12} />
                GUARDAR CAMBIOS
              </button>
            </div>
          </form>
        ) : selectedClientId && activeClient ? (
          
          /* CASE C: BEAUTIFUL COMPACT SUMMARY FOR SELECTED CLIENT */
          <div className="bg-teal-50/40 border border-teal-100/80 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in text-xs font-medium">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-teal-500">
                {activeClient.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-teal-800 leading-tight block">{activeClient.name}</span>
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-100 uppercase tracking-wide px-1.5 py-0.5 rounded">
                    {activeClient.zone}
                  </span>
                  <span className="text-[9px] font-medium text-slate-500">
                    Doc: {activeClient.docType} {activeClient.docNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xxs text-slate-500 font-medium">
                  <MapPin size={12} className="text-[#017E84] shrink-0" />
                  <span>{activeClient.address} • Propietario: {activeClient.ownerName} • Telf: {activeClient.phone}</span>
                </div>
                {activeClient.outstandingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedClientForDebt(activeClient)}
                    className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-400 px-2.5 py-1 rounded-lg transition-all shadow-sm cursor-pointer select-none text-left"
                    title="Ver detalle de la deuda pendiente"
                  >
                    <span>⚠️ Deuda pendiente: S/ {activeClient.outstandingBalance.toFixed(2)}</span>
                    <span className="text-[9px] text-rose-500 font-extrabold underline ml-1.5 uppercase tracking-wide">VER DETALLE &rarr;</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex-1 md:flex-initial text-xxs font-bold text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Edit3 size={12} />
                Editar Datos
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cartItems.length > 0 && !window.confirm("¿Seguro que deseas cambiar de tienda? Perderás los productos preseleccionados en esta canasta.")) {
                    return;
                  }
                  setSelectedClientId('');
                  setQuantities({});
                  setClientSearchQuery('');
                }}
                className="flex-1 md:flex-initial text-xxs font-extrabold text-rose-600 bg-white hover:bg-rose-50 px-3.5 py-2 rounded-lg border border-rose-150 transition-all flex items-center justify-center gap-1.5"
              >
                Cambiar Cliente
              </button>
            </div>
          </div>
        ) : (
          
          /* CASE D: DYNAMIC INSTANT SEARCHING WITH RESULTS LIST */
          <div className="space-y-3 animate-fade-in text-xs">
            {/* Search client input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente por Nombre de tienda, Propietario, RUC o DNI..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#017E84] text-slate-800 font-bold"
              />
            </div>

            {/* Compact matched results list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {filteredClients.map(c => {
                const hasDebt = c.outstandingBalance > 0;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setQuantities({});
                    }}
                    className="p-3 bg-white hover:bg-slate-50/50 border border-slate-150 hover:border-teal-400 rounded-xl transition-all cursor-pointer flex justify-between items-center group shadow-sm"
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[#017E84] text-[13px]">{c.name}</span>
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                          {c.zone}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {c.docType}: {c.docNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Dueño: {c.ownerName} • <span className="text-slate-400">{c.address}</span>
                      </div>
                      {hasDebt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientForDebt(c);
                          }}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100/75 hover:border-rose-300 px-2 py-0.5 rounded-lg mt-1 select-none transition-all cursor-pointer"
                          title="Haga clic para ver el detalle de la deuda"
                        >
                          <span>⚠️ Deuda: S/ {c.outstandingBalance.toFixed(2)}</span>
                          <span className="underline ml-1 text-[8px] uppercase tracking-wider text-rose-600">Ver saldo &rarr;</span>
                        </button>
                      )}
                    </div>
                    <span className="text-xxs font-black bg-teal-50 text-[#017E84] px-3 py-1.5 rounded-lg border border-teal-100 group-hover:bg-[#017E84] group-hover:text-white group-hover:border-teal-600 transition-all shrink-0">
                      Seleccionar
                    </span>
                  </div>
                );
              })}

              {filteredClients.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 italic">
                  No se encontraron clientes registrados con ese nombre o RUC/DNI.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: PRODUCTS CATALOG + QUANTITY INPUT DIRECTLY IN LINE */}
      {selectedClientId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CATALOG PANEL */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet space-y-4">
            
            {/* SEARCH AND FILTERS IN ONE COMPACT BAR */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500/25 transition-all font-medium text-slate-700"
                />
              </div>

              {/* Quick Categories list */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-sm no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 text-[10px] font-black rounded-lg shrink-0 uppercase tracking-wide transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#017E84] text-white shadow-sm' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-150'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* HIGH-CONTRAST ERP PRODUCT LIST (COMPACT TAP-FRIENDLY ROWS) */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
              {filteredProducts.map(p => {
                const qtySelected = quantities[p.id] || 0;
                const lowStock = p.stock <= p.minStock;

                return (
                  <div 
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      qtySelected > 0 
                        ? 'border-[#017E84] bg-teal-50/20' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {/* Item Information */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.sku}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 leading-tight">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xxs font-extrabold">
                        <span className="text-[#017E84] text-sm font-black">S/ {p.salePrice.toFixed(2)}</span>
                        <span className={lowStock ? 'text-amber-600' : 'text-slate-400'}>
                          Stock: {p.stock} {lowStock ? '⚠️' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector Directly in the Row */}
                    {p.stock > 0 ? (
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleSetQty(p.id, qtySelected - 1, p.stock)}
                          className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-black text-sm active:scale-95 shadow-sm"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={qtySelected === 0 ? '' : qtySelected}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              handleSetQty(p.id, 0, p.stock);
                            } else {
                              const parsed = parseInt(val, 10);
                              if (!isNaN(parsed)) {
                                handleSetQty(p.id, parsed, p.stock);
                              }
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-10 text-center font-black text-sm text-slate-900 bg-white border border-slate-200 rounded-lg py-1 px-1 focus:outline-none focus:ring-2 focus:ring-[#017E84] focus:border-transparent select-all"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => handleSetQty(p.id, qtySelected + 1, p.stock)}
                          className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-black text-sm active:scale-95 shadow-sm"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 py-1.5 px-3 rounded-lg uppercase">
                        Sin Stock
                      </span>
                    )}
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  Ningún producto coincide con la búsqueda.
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: REALTIME BASKET & ONE-BUTTON TRANSMISSION CONFIRMATION */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet space-y-4">
              <div className="border-b border-slate-150 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart size={15} className="text-[#017E84]" />
                  <span>Resumen de Pedido</span>
                </h3>
                {cartItems.length > 0 && (
                  <span className="bg-teal-100 text-[#017E84] text-xxs font-black px-2.5 py-1 rounded-full">
                    {cartItems.length} ítems
                  </span>
                )}
              </div>

              {/* Selected List */}
              {cartItems.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map(item => (
                    <div key={item.productId} className="flex justify-between items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-800 block truncate">{item.productName}</span>
                        <span className="text-slate-400 text-xxs font-semibold">
                          {item.qty} un x S/ {item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">S/ {item.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleSetQty(item.productId, 0, 999)}
                          className="text-slate-400 hover:text-rose-500 rounded p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs italic space-y-1">
                  <Package size={20} className="mx-auto text-slate-300" />
                  <p className="text-[11px] leading-relaxed font-semibold max-w-xs mx-auto text-slate-400">
                    Sube la cantidad del producto deseado con los botones <span className="text-[#017E84] font-bold">[ + ]</span> de la izquierda para armar la canasta al instante.
                  </p>
                </div>
              )}

              {/* Calculations */}
              <div className="border-t border-slate-150 pt-3.5 space-y-1.5 text-xs text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>S/ {cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>S/ {cartIgv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-800 pt-1.5 border-t border-slate-100">
                  <span>Importe Total:</span>
                  <span className="text-[#017E84] text-base">S/ {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Direct comments input & Confirmation */}
              {cartItems.length > 0 && (
                <div className="space-y-3.5 pt-2 animate-slide-up">
                  <input
                    type="text"
                    placeholder="Instrucciones para despacho (opcional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xxs text-slate-800 focus:outline-none focus:bg-white animate-fade-in"
                  />

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold min-h-[46px] rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md active:scale-95"
                  >
                    <Send size={14} />
                    <span>Confirmar y Enviar Pedido a Distribución</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-100 rounded-2xl p-10 text-center border border-slate-200/50">
          <p className="text-slate-500 text-xs font-bold leading-normal max-w-sm mx-auto">
            Por favor, busca y selecciona una tienda o registra un cliente arriba para listar los precios de venta y stock disponible.
          </p>
        </div>
      )}
        </div>
      )}

      {/* DEBT DETAIL MODAL */}
      {selectedClientForDebt && currentDebtClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-150 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4.5 border-b border-slate-100 flex justify-between items-center bg-rose-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl flex items-center justify-center font-black shadow-sm">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-[13px] sm:text-sm uppercase tracking-wider">
                    ESTADO DE DEUDA Y SALDOS
                  </h3>
                  <p className="text-[10px] text-rose-600 font-extrabold uppercase mt-0.5 tracking-wider">
                    {currentDebtClient.name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSelectedClientForDebt(null);
                  setIsRegisteringPayment(false);
                }}
                className="p-1 px-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold text-xxs uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <X size={12} />
                <span>Cerrar</span>
              </button>
            </div>

            {/* Client Summary card within modal */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs">
              <div className="grid grid-cols-2 gap-y-1.5 text-slate-500 font-semibold">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contacto:</p>
                  <p className="text-slate-800 font-bold">{currentDebtClient.ownerName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono:</p>
                  <p className="text-slate-800 font-bold">{currentDebtClient.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección:</p>
                  <p className="text-slate-800 font-medium truncate">{currentDebtClient.address}</p>
                </div>
              </div>

              {/* Huge Balance Number */}
              <div className="mt-3.5 bg-rose-50/75 border border-rose-100 p-3 rounded-xl flex justify-between items-center">
                <span className="text-xs font-black text-rose-800 uppercase tracking-wide">Deuda Deudor Consolidada:</span>
                <span className="text-xl font-extrabold text-rose-600">S/ {currentDebtClient.outstandingBalance.toFixed(2)}</span>
              </div>

              {/* Cobrar en Campo Button / Form Toggle */}
              {currentDebtClient.outstandingBalance > 0 ? (
                !isRegisteringPayment ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisteringPayment(true);
                      setPaymentAmount(currentDebtClient.outstandingBalance.toFixed(2));
                    }}
                    className="mt-2.5 w-full bg-[#017E84] hover:bg-[#006064] text-white py-2 px-4 rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer"
                  >
                    <PiggyBank size={14} />
                    <span>COBRAR / REGISTRAR PAGO AHORA</span>
                  </button>
                ) : (
                  <form onSubmit={handleRegisterPaymentSubmit} className="mt-3 bg-white p-3.5 border border-slate-150 rounded-xl space-y-3 shadow-inner animate-slide-up">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-xxs font-black text-[#017E84] uppercase tracking-wider flex items-center gap-1">
                        <PiggyBank size={12} /> Registrar Cobro en Campo
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsRegisteringPayment(false)} 
                        className="text-[10px] text-rose-500 font-extrabold hover:text-rose-700 uppercase underline"
                      >
                        Cancelar
                      </button>
                    </div>

                    {paymentSuccessMsg ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-[#017E84] rounded-xl text-xxs font-bold text-center flex flex-col items-center justify-center gap-1 animate-pulse">
                        <span className="text-lg">✓</span>
                        <span>{paymentSuccessMsg}</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Monto Cobrado (S/)</label>
                            <input 
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={currentDebtClient.outstandingBalance}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#017E84]"
                              required
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Modalidad Pago</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#017E84]"
                            >
                              <option value="CASH">Efectivo Físico</option>
                              <option value="YAPE">Yape / Plin QR</option>
                              <option value="TRANSFER">Transf BCP/BBVA</option>
                              <option value="CREDIT_CARD">P.O.S. Tarjeta</option>
                            </select>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nro Operación / Referencia (Opcional)</label>
                            <input 
                              type="text"
                              value={paymentRef}
                              onChange={(e) => setPaymentRef(e.target.value)}
                              placeholder="Ej. YAP9120938"
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#017E84]"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Observación</label>
                            <input 
                              type="text"
                              value={paymentRemarks}
                              onChange={(e) => setPaymentRemarks(e.target.value)}
                              placeholder="Amortización parcial cobrada por preventista"
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#017E84]"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-[#017E84] hover:bg-[#006064] text-white py-2.5 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider mt-1 outline-none cursor-pointer"
                        >
                          CONFIRMAR RECIBO EN CAMPO
                        </button>
                      </>
                    )}
                  </form>
                )
              ) : (
                <div className="mt-2.5 p-2 bg-emerald-50 text-emerald-800 text-center font-bold text-xxs rounded-lg border border-emerald-100">
                  🎉 El cliente no posee deuda pendiente actual.
                </div>
              )}
            </div>

            {/* List of outstanding orders */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px] no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block">Desglose de Pedidos Unidades y Saldos</span>
              
              <div className="space-y-2">
                {(() => {
                  const clientUnpaidOrders = (orders || []).filter(
                    o => o.storeId === currentDebtClient.id && 
                    o.paymentStatus !== 'PAID' && 
                    o.status !== 'CANCELLED'
                  );

                  const ordersDebtSum = clientUnpaidOrders.reduce((sum, o) => sum + (o.total - o.paidAmount), 0);
                  const historicDiff = currentDebtClient.outstandingBalance - ordersDebtSum;

                  return (
                    <>
                      {clientUnpaidOrders.map((o) => {
                        const unpaidAmount = o.total - o.paidAmount;
                        return (
                          <div key={o.id} className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5 shadow-sm">
                            <div className="flex justify-between items-center bg-slate-50 p-1 px-2 rounded-lg text-xxs font-black text-slate-500">
                              <span className="text-[#017E84]">{o.id}</span>
                              <span>{o.date}</span>
                            </div>
                            <div className="grid grid-cols-2 text-xs font-semibold gap-y-1 text-slate-600">
                              <div className="text-slate-450">Importe Pedido:</div>
                              <div className="text-right text-slate-800">S/ {o.total.toFixed(2)}</div>
                              <div className="text-slate-450">Cobrado:</div>
                              <div className="text-right text-emerald-600">S/ {o.paidAmount.toFixed(2)}</div>
                              <div className="text-rose-600 font-extrabold">Saldo Pendiente:</div>
                              <div className="text-right text-rose-600 font-black">S/ {unpaidAmount.toFixed(2)}</div>
                            </div>
                            
                            {/* Collapse/list items */}
                            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                              <span className="font-bold">Productos:</span> {o.items.map(it => `${it.qty} x ${it.productName}`).join(', ')}
                            </div>
                          </div>
                        );
                      })}

                      {historicDiff > 0.05 && (
                        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 shadow-sm">
                          <div className="flex justify-between items-center text-xxs font-black text-amber-700 uppercase bg-amber-50 p-1 px-2 rounded">
                            <span>Saldo Inicial Histórico</span>
                            <span>Anterior</span>
                          </div>
                          <div className="grid grid-cols-2 text-xs font-semibold text-slate-700">
                            <div>Clasificación:</div>
                            <div className="text-right text-slate-650">Saldo por Cobrar Regularizado</div>
                            <div className="text-amber-700 font-bold">Monto Pendiente:</div>
                            <div className="text-right text-amber-700 font-black">S/ {historicDiff.toFixed(2)}</div>
                          </div>
                          <p className="text-[9.5px] italic text-slate-450 mt-1.5 leading-tight font-medium">
                            * Correspondiente a facturación precargada de preventas previas no integradas en el sistema principal.
                          </p>
                        </div>
                      )}

                      {clientUnpaidOrders.length === 0 && historicDiff <= 0.05 && (
                        <div className="py-8 text-center text-slate-400 italic text-xs font-semibold">
                          No existen pedidos registrados pendientes o vencidos para este cliente.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Custom Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-450 text-center font-bold">
              Las cobranzas de vendedores en campo se registran preventivamente y pasan a rendición para arqueo diario de administración.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
