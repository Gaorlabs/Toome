import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { Dashboard } from './components/Dashboard';
import { SellField } from './components/SellField';
import { RoutesView } from './components/RoutesView';
import { InventoryView } from './components/InventoryView';
import { PaymentsView } from './components/PaymentsView';
import { ClientsView } from './components/ClientsView';
import { ReportsView } from './components/ReportsView';
import { Login } from './components/Login';
import { InteractiveFlow } from './components/InteractiveFlow';

import { Product, ClientStore, Order, DeliveryRoute, PaymentRecord, ViewMode, UserSession } from './types';
import { loadLocalStorage, saveLocalStorage } from './data';
import { ChevronDown, Lock, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);

  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<ClientStore[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // On Mounting - Load from Local Storage Seeding
  useEffect(() => {
    const loaded = loadLocalStorage();
    setProducts(loaded.products);
    setClients(loaded.clients);
    setOrders(loaded.orders);
    setRoutes(loaded.routes);
    setPayments(loaded.payments);

    // Get active session if persisted
    const savedSession = localStorage.getItem('toome_active_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  // Sync to local storage on state change
  const syncState = (
    updatedProducts: Product[],
    updatedClients: ClientStore[],
    updatedOrders: Order[],
    updatedRoutes: DeliveryRoute[],
    updatedPayments: PaymentRecord[]
  ) => {
    saveLocalStorage({
      products: updatedProducts,
      clients: updatedClients,
      orders: updatedOrders,
      routes: updatedRoutes,
      payments: updatedPayments
    });
  };

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    localStorage.setItem('toome_active_session', JSON.stringify(userSession));
    setCurrentView(ViewMode.DASHBOARD);
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('toome_active_session');
    setCurrentView(ViewMode.DASHBOARD);
  };

  // State update handlers
  const handleAddOrder = (newOrder: Order) => {
    const nextOrders = [...orders, newOrder];
    setOrders(nextOrders);
    syncState(products, clients, nextOrders, routes, payments);
  };

  const handleConfirmOrder = (orderId: string, scheduledDate: string) => {
    // 1. Confirm order status
    // 2. Decrease inventory stock for each item
    // 3. Increment Client's outstandingBalance if not fully paid yet
    let nextProducts = [...products];
    let nextClients = [...clients];

    const nextOrders = orders.map(o => {
      if (o.id === orderId) {
        // Decrease stock
        o.items.forEach(item => {
          nextProducts = nextProducts.map(p => 
            p.id === item.productId 
              ? { ...p, stock: Math.max(0, p.stock - item.qty) } 
              : p
          );
        });

        // Add unpaid total to outstanding balance
        const unpaidAmount = Math.max(0, o.total - o.paidAmount);
        if (unpaidAmount > 0) {
          nextClients = nextClients.map(c => 
            c.id === o.storeId 
              ? { ...c, outstandingBalance: Number((c.outstandingBalance + unpaidAmount).toFixed(2)) } 
              : c
          );
        }

        return { ...o, status: 'CONFIRMED' as const, shippingDate: scheduledDate };
      }
      return o;
    });

    setProducts(nextProducts);
    setClients(nextClients);
    setOrders(nextOrders);
    syncState(nextProducts, nextClients, nextOrders, routes, payments);
  };

  const handleCancelOrder = (orderId: string) => {
    const nextOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
    );
    setOrders(nextOrders);
    syncState(products, clients, nextOrders, routes, payments);
  };

  const handleDeliverOrder = (orderId: string) => {
    const nextOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'DELIVERED' as const } : o
    );
    setOrders(nextOrders);
    syncState(products, clients, nextOrders, routes, payments);
  };

  const handleCreateRoute = (newRouteData: Omit<DeliveryRoute, 'id'>) => {
    const newRoute: DeliveryRoute = {
      ...newRouteData,
      id: `RUT-${Math.floor(100 + Math.random() * 900)}`,
      orderIds: []
    };
    const nextRoutes = [...routes, newRoute];
    setRoutes(nextRoutes);
    syncState(products, clients, orders, nextRoutes, payments);
  };

  const handleAssignOrderToRoute = (orderId: string, routeId: string | undefined) => {
    // 1. Update order reference
    const nextOrders = orders.map(o => 
      o.id === orderId ? { ...o, shippingRouteId: routeId } : o
    );

    // 2. Update route assignments
    const nextRoutes = routes.map(r => {
      // Remove order from previous route if belonged
      let orderIds = r.orderIds.filter(id => id !== orderId);
      // Add to this route if target matches
      if (r.id === routeId) {
        orderIds = [...orderIds, orderId];
      }
      return { ...r, orderIds };
    });

    setOrders(nextOrders);
    setRoutes(nextRoutes);
    syncState(products, clients, nextOrders, nextRoutes, payments);
  };

  const handleCompleteRoute = (routeId: string) => {
    const targetRoute = routes.find(r => r.id === routeId);
    if (!targetRoute) return;

    // 1. Mark route as completed
    const nextRoutes = routes.map(r => 
      r.id === routeId ? { ...r, status: 'COMPLETED' as const } : r
    );

    // 2. Mark all assigned orders as DELIVERED
    const nextOrders = orders.map(o => 
      targetRoute.orderIds.includes(o.id) ? { ...o, status: 'DELIVERED' as const } : o
    );

    setRoutes(nextRoutes);
    setOrders(nextOrders);
    syncState(products, clients, nextOrders, nextRoutes, payments);
  };

  const handleUpdateStock = (productId: string, newStock: number, cost: number, price: number) => {
    const nextProducts = products.map(p => 
      p.id === productId ? { ...p, stock: newStock, cost, salePrice: price } : p
    );
    setProducts(nextProducts);
    syncState(nextProducts, clients, orders, routes, payments);
  };

  const handleAddProduct = (newProduct: Product) => {
    const nextProducts = [...products, newProduct];
    setProducts(nextProducts);
    syncState(nextProducts, clients, orders, routes, payments);
  };

  const handleAddPayment = (newPayment: PaymentRecord) => {
    const nextPayments = [...payments, newPayment];
    setPayments(nextPayments);
    syncState(products, clients, orders, routes, nextPayments);
  };

  // Reduce client's outstanding debt balance on pay
  const handleClearBalance = (clientId: string, amount: number) => {
    const nextClients = clients.map(c => 
      c.id === clientId 
        ? { ...c, outstandingBalance: Math.max(0, Number((c.outstandingBalance - amount).toFixed(2))) } 
        : c
    );
    setClients(nextClients);
    syncState(products, nextClients, orders, routes, payments);
  };

  const handleAddClient = (newClient: ClientStore) => {
    const nextClients = [...clients, newClient];
    setClients(nextClients);
    syncState(products, nextClients, orders, routes, payments);
  };

  const handleUpdateClient = (updatedClient: ClientStore) => {
    const nextClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(nextClients);
    syncState(products, nextClients, orders, routes, payments);
  };

  const handleDeleteClient = (clientId: string) => {
    const nextClients = clients.filter(c => c.id !== clientId);
    setClients(nextClients);
    syncState(products, nextClients, orders, routes, payments);
  };

  // Authentication barrier Check
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAF9]">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        collapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        session={session}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 z-20 bg-white border-b border-slate-100 shadow-sm flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-black text-[#017E84] bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 tracking-wide">
              TOOME PREVENTAS
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="flex items-center space-x-3 text-left outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[#017E84] text-white flex items-center justify-center font-bold text-xs ring-2 ring-teal-50">
                  {session.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-extrabold text-slate-800 leading-none mb-1">{session.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {session.role === 'ADMIN' ? 'Administrador' : 'Vendedor Campo'}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden md:block" />
              </button>
              
              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1.5 animate-slide-up">
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-50 font-bold flex items-center gap-2"
                  >
                    <LogOut size={14} /> Close Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAF9] flex flex-col pb-20 md:pb-0">
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              
              {currentView === ViewMode.DASHBOARD && (
                <Dashboard 
                  orders={orders} 
                  products={products} 
                  clients={clients} 
                  routes={routes}
                  session={session} 
                  onNavigate={setCurrentView}
                  onConfirmOrder={handleConfirmOrder}
                  onCancelOrder={handleCancelOrder}
                  onAssignOrderToRoute={handleAssignOrderToRoute}
                  onCreateRoute={handleCreateRoute}
                />
              )}

              {currentView === ViewMode.SELL_FIELD && (
                <SellField
                  products={products}
                  clients={clients}
                  orders={orders}
                  routes={routes}
                  session={session}
                  onAddOrder={handleAddOrder}
                  onNavigate={setCurrentView}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onAddPayment={handleAddPayment}
                  onClearBalance={handleClearBalance}
                  onConfirmOrder={handleConfirmOrder}
                  onCancelOrder={handleCancelOrder}
                  onDeliverOrder={handleDeliverOrder}
                  onAssignOrderToRoute={handleAssignOrderToRoute}
                  onCreateRoute={handleCreateRoute}
                />
              )}

              {currentView === ViewMode.ROUTES && (
                <RoutesView
                  routes={routes}
                  orders={orders}
                  onCreateRoute={handleCreateRoute}
                  onAssignOrderToRoute={handleAssignOrderToRoute}
                  onCompleteRoute={handleCompleteRoute}
                />
              )}

              {currentView === ViewMode.INVENTORY && (
                <InventoryView
                  products={products}
                  session={session}
                  onUpdateStock={handleUpdateStock}
                  onAddProduct={handleAddProduct}
                />
              )}

              {currentView === ViewMode.PAYMENTS && (
                <PaymentsView
                  payments={payments}
                  clients={clients}
                  onAddPayment={handleAddPayment}
                  onClearBalance={handleClearBalance}
                  session={session}
                />
              )}

              {currentView === ViewMode.CLIENTS && (
                <ClientsView
                  clients={clients}
                  onAddClient={handleAddClient}
                  onDeleteClient={handleDeleteClient}
                  session={session}
                />
              )}

              {currentView === ViewMode.REPORTS && (
                <ReportsView
                  orders={orders}
                  payments={payments}
                  clients={clients}
                  products={products}
                  session={session}
                />
              )}

            </div>
          </div>
        </main>

        <MobileNavigation 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          session={session}
          onLogout={handleLogout} 
        />
      </div>
    </div>
  );
}
