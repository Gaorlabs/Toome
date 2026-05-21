export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  cost: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string; // e.g., 'Unidad', 'Caja', 'Paquete'
  photoUrl?: string;
}

export interface ClientStore {
  id: string;
  name: string; // Nombre del negocio / Tienda
  ownerName: string; // Nombre del dueño
  docType: 'DNI' | 'RUC' | 'Otro';
  docNumber: string;
  address: string;
  zone: string; // Ruta / Zona (e.g., Zona Norte, Zona Sur, Miraflores, etc.)
  phone: string;
  lat?: number;
  lng?: number;
  outstandingBalance: number; // Balance de deudas
}

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  discount: number; // Percentage, e.g. 5 for 5%
  total: number;
}

export type OrderStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMethodType = 'CASH' | 'YAPE' | 'TRANSFER' | 'CREDIT_CARD';

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  storeZone: string;
  storeAddress: string;
  sellerId: string;
  sellerName: string;
  date: string; // YYYY-MM-DD
  items: OrderItem[];
  total: number;
  baseAmount: number; // calculated as total / 1.18
  igvAmount: number; // calculated as total - baseAmount
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;
  paidAmount: number;
  shippingDate: string; // scheduled shipping date
  shippingRouteId?: string; // route ID this order is assigned to
  notes?: string;
}

export interface DeliveryRoute {
  id: string;
  name: string; // e.g. "Ruta Norte - 22/05/2026"
  zone: string; // Zone associated
  scheduledDate: string; // YYYY-MM-DD
  driverName: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  orderIds: string[];
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  storeName: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  referenceNum?: string; // e.g., Nro Operación Yape
  date: string;
  remarks?: string;
  approvedByAdmin: boolean;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  WORKFLOW = 'WORKFLOW',             // Mapa / Flujo de Proceso Interactivo
  SELL_FIELD = 'SELL_FIELD',       // Toma de pedidos en campo
  ORDERS_CONFIRM = 'ORDERS_CONFIRM', // Confirmar y Generar/Programar despachos
  ROUTES = 'ROUTES',                 // Generación de Rutas por Zona
  INVENTORY = 'INVENTORY',           // Módulo de Inventario
  PAYMENTS = 'PAYMENTS',             // Gestión de Pagos/Cobros
  CLIENTS = 'CLIENTS',               // Clientes / Tiendas
  REPORTS = 'REPORTS'                // Reportes de Desempeño
}

export interface UserSession {
  role: 'ADMIN' | 'SELLER';
  name: string;
  sellerId?: string;
}
