
import { KPI, SalesData, InventoryItem, ProductPerformance, BranchKPI, CustomerSegment } from './types';

// KPIs inicializados en Cero
export const MOCK_KPIS: KPI[] = [
  { label: 'Total Venta', value: 'S/ 0.00', change: 0, trend: 'neutral', icon: 'DollarSign', isDark: true },
  { label: 'Utilidad Bruta', value: 'S/ 0.00', change: 0, trend: 'neutral', icon: 'Target', isDark: false },
  { label: 'Items Vendidos', value: '0', change: 0, trend: 'neutral', icon: 'Package', isDark: false },
  { label: 'Margen Real %', value: '0.0%', change: 0, trend: 'neutral', icon: 'Calculator', isDark: false }, 
];

export const MOCK_BRANCHES: BranchKPI[] = [
  { id: '1', name: 'Farmacia Central', sales: 0, margin: 0, target: 1000, profitability: 0, status: 'OPEN' },
  { id: '2', name: 'Sucursal Norte', sales: 0, margin: 0, target: 1000, profitability: 0, status: 'CLOSED' }
];

export const MOCK_SALES_DATA: SalesData[] = [];
export const MOCK_INVENTORY: InventoryItem[] = [];
export const MOCK_TOP_PRODUCTS: ProductPerformance[] = [];
export const MOCK_CUSTOMERS: CustomerSegment[] = [];
