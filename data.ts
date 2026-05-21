import { Product, ClientStore, Order, DeliveryRoute, PaymentRecord } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'P1', sku: 'AL-9081', name: 'Aceite de Soya Primor Premium 1L', category: 'Abarrotes', cost: 7.20, salePrice: 9.50, stock: 120, minStock: 20, unit: 'Botella' },
  { id: 'P2', sku: 'AL-4432', name: 'Arroz Extra Costeño Saco 5kg', category: 'Abarrotes', cost: 18.50, salePrice: 24.00, stock: 75, minStock: 15, unit: 'Saco' },
  { id: 'P3', sku: 'BE-8812', name: 'Gaseosa Inca Kola Botella 2.25L', category: 'Bebidas', cost: 4.80, salePrice: 6.80, stock: 210, minStock: 30, unit: 'Paquete x6' },
  { id: 'P4', sku: 'BE-9231', name: 'Agua San Luis Sin Gas 1L', category: 'Bebidas', cost: 1.10, salePrice: 1.80, stock: 180, minStock: 25, unit: 'Caja x12' },
  { id: 'P5', sku: 'LA-1029', name: 'Leche Evaporada Gloria Azul 400g', category: 'Lácteos', cost: 3.10, salePrice: 4.20, stock: 350, minStock: 50, unit: 'Plancha x24' },
  { id: 'P6', sku: 'LI-5521', name: 'Detergente Opal Fuerza Ultra 1.5kg', category: 'Limpieza', cost: 11.00, salePrice: 14.90, stock: 60, minStock: 10, unit: 'Unidad' },
  { id: 'P7', sku: 'PF-2041', name: 'Panadol Forte 500mg Caja x100', category: 'Farmacia', cost: 14.00, salePrice: 22.00, stock: 45, minStock: 8, unit: 'Caja' },
  { id: 'P8', sku: 'PF-7731', name: 'Mascarillas Quirúrgicas 3 pliegues x50', category: 'Farmacia', cost: 4.50, salePrice: 8.00, stock: 90, minStock: 15, unit: 'Caja' }
];

export const INITIAL_CLIENTS: ClientStore[] = [
  { id: 'C1', name: 'Bodega El Sol de Carabayllo', ownerName: 'María Esther Quispe', docType: 'RUC', docNumber: '10443219811', address: 'Av. Tupac Amaru 1205, Carabayllo', zone: 'Zona Norte', phone: '987654321', outstandingBalance: 150.00 },
  { id: 'C2', name: 'Farmacia Salud y Ahorro', ownerName: 'Dr. Jorge Mendoza', docType: 'RUC', docNumber: '20556102931', address: 'Calle Las Orquídeas 442, Lince', zone: 'Zona Centro', phone: '944332211', outstandingBalance: 0.00 },
  { id: 'C3', name: 'Minimarket Don Pepe', ownerName: 'José Lizárraga', docType: 'DNI', docNumber: '08871234', address: 'Av. El Corregidor 881, La Molina', zone: 'Zona Este', phone: '991223344', outstandingBalance: 420.50 },
  { id: 'C4', name: 'Comercial La Bendición', ownerName: 'Martha Chumpitaz', docType: 'RUC', docNumber: '10087712392', address: 'Jr. Vigil 553, Bellavista', zone: 'Zona Callao', phone: '933221122', outstandingBalance: 280.00 },
  { id: 'C5', name: 'Inversiones Surco Sur', ownerName: 'Raúl Belaúnde', docType: 'RUC', docNumber: '20129381711', address: 'Av. Caminos del Inca 2510, Surco', zone: 'Zona Sur', phone: '915667788', outstandingBalance: 0.00 },
  { id: 'C6', name: 'Bodega Santa Rosa Ventanilla', ownerName: 'Rosa Elvira Medina', docType: 'DNI', docNumber: '44558833', address: 'Calle 14 Mz B Lote 5, Ventanilla', zone: 'Zona Norte', phone: '955112233', outstandingBalance: 75.00 }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PED-001',
    storeId: 'C1',
    storeName: 'Bodega El Sol de Carabayllo',
    storeZone: 'Zona Norte',
    storeAddress: 'Av. Tupac Amaru 1205, Carabayllo',
    sellerId: 'S1',
    sellerName: 'Luis Preventista - Norte',
    date: '2026-05-20',
    items: [
      { productId: 'P1', productName: 'Aceite de Soya Primor Premium 1L', qty: 10, price: 9.50, discount: 0, total: 95.00 },
      { productId: 'P3', productName: 'Gaseosa Inca Kola Botella 2.25L', qty: 5, price: 6.80, discount: 5, total: 32.30 }
    ],
    total: 127.30,
    baseAmount: 107.88,
    igvAmount: 19.42,
    status: 'CONFIRMED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    paidAmount: 0,
    shippingDate: '2026-05-22',
  },
  {
    id: 'PED-002',
    storeId: 'C3',
    storeName: 'Minimarket Don Pepe',
    storeZone: 'Zona Este',
    storeAddress: 'Av. El Corregidor 881, La Molina',
    sellerId: 'S3',
    sellerName: 'Carlos Preventista - Centro',
    date: '2026-05-21',
    items: [
      { productId: 'P5', productName: 'Leche Evaporada Gloria Azul 400g', qty: 24, price: 4.20, discount: 10, total: 90.72 }
    ],
    total: 90.72,
    baseAmount: 76.88,
    igvAmount: 13.84,
    status: 'PENDING_CONFIRMATION',
    paymentStatus: 'UNPAID',
    paymentMethod: 'YAPE',
    paidAmount: 0,
    shippingDate: '2026-05-22',
  },
  {
    id: 'PED-003',
    storeId: 'C4',
    storeName: 'Comercial La Bendición',
    storeZone: 'Zona Callao',
    storeAddress: 'Jr. Vigil 553, Bellavista',
    sellerId: 'S4',
    sellerName: 'Diana Preventista - Callao',
    date: '2026-05-19',
    items: [
      { productId: 'P2', productName: 'Arroz Extra Costeño Saco 5kg', qty: 5, price: 24.00, discount: 0, total: 120.00 },
      { productId: 'P6', productName: 'Detergente Opal Fuerza Ultra 1.5kg', qty: 4, price: 14.90, discount: 0, total: 59.60 }
    ],
    total: 179.60,
    baseAmount: 152.20,
    igvAmount: 27.40,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'TRANSFER',
    paidAmount: 179.60,
    shippingDate: '2026-05-20',
  }
];

export const INITIAL_ROUTES: DeliveryRoute[] = [
  {
    id: 'RUT-101',
    name: 'Despacho Norte Especial',
    zone: 'Zona Norte',
    scheduledDate: '2026-05-22',
    driverName: 'Felipe Sandoval (Camión Hino)',
    status: 'DRAFT',
    orderIds: ['PED-001']
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-001',
    orderId: 'PED-003',
    storeName: 'Comercial La Bendición',
    amount: 179.60,
    paymentMethod: 'TRANSFER',
    referenceNum: 'TRX-10292019',
    date: '2026-05-19',
    remarks: 'Pago completo de pedido entregado',
    approvedByAdmin: true
  }
];

// Helper to initialize and retrieve localStorage states
export const loadLocalStorage = () => {
  const products = localStorage.getItem('toome_products');
  const clients = localStorage.getItem('toome_clients');
  const orders = localStorage.getItem('toome_orders');
  const routes = localStorage.getItem('toome_routes');
  const payments = localStorage.getItem('toome_payments');

  if (!products) {
    localStorage.setItem('toome_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('toome_clients', JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem('toome_orders', JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem('toome_routes', JSON.stringify(INITIAL_ROUTES));
    localStorage.setItem('toome_payments', JSON.stringify(INITIAL_PAYMENTS));
    return {
      products: INITIAL_PRODUCTS,
      clients: INITIAL_CLIENTS,
      orders: INITIAL_ORDERS,
      routes: INITIAL_ROUTES,
      payments: INITIAL_PAYMENTS
    };
  }

  return {
    products: JSON.parse(products),
    clients: JSON.parse(clients),
    orders: JSON.parse(orders),
    routes: JSON.parse(routes),
    payments: JSON.parse(payments)
  };
};

export const saveLocalStorage = (data: {
  products: Product[];
  clients: ClientStore[];
  orders: Order[];
  routes: DeliveryRoute[];
  payments: PaymentRecord[];
}) => {
  localStorage.setItem('toome_products', JSON.stringify(data.products));
  localStorage.setItem('toome_clients', JSON.stringify(data.clients));
  localStorage.setItem('toome_orders', JSON.stringify(data.orders));
  localStorage.setItem('toome_routes', JSON.stringify(data.routes));
  localStorage.setItem('toome_payments', JSON.stringify(data.payments));
};
