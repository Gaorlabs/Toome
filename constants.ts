
import { KPI, SalesData, InventoryItem, ProductPerformance, CompanyContext, CustomerSegment } from './types';

export const MOCK_COMPANIES: CompanyContext[] = [];

// KPIs inicializados en Cero
export const MOCK_KPIS: KPI[] = [
  { label: 'Ventas Totales', value: 'S/. 0.00', change: 0, trend: 'neutral', icon: 'DollarSign' },
  { label: 'Margen Global', value: '0.0%', change: 0, trend: 'neutral', icon: 'PieChart' },
  { label: 'Ticket Promedio', value: 'S/. 0.00', change: 0, trend: 'neutral', icon: 'CreditCard' },
  { label: 'Alertas Stock', value: '0', change: 0, trend: 'neutral', icon: 'AlertTriangle' }, 
];

// Listas vacías para que no aparezcan productos de ejemplo
export const MOCK_SALES_DATA: SalesData[] = [];
export const MOCK_INVENTORY: InventoryItem[] = [];
export const MOCK_TOP_PRODUCTS: ProductPerformance[] = [];
export const MOCK_CUSTOMERS: CustomerSegment[] = [];
