
import { KPI, SalesData, InventoryItem, ProductPerformance, BranchKPI, CustomerSegment } from './types';

// KPIs inicializados en neutral (Placeholder visual limpio)
export const MOCK_KPIS: KPI[] = [
  { label: 'Total Venta (Neto)', value: '---', change: 0, trend: 'neutral', icon: 'DollarSign', isDark: true },
  { label: 'Utilidad Bruta', value: '---', change: 0, trend: 'neutral', icon: 'Target', isDark: false },
  { label: 'Transacciones', value: '0', change: 0, trend: 'neutral', icon: 'Package', isDark: false },
  { label: 'Rentabilidad', value: '0.0%', change: 0, trend: 'neutral', icon: 'Calculator', isDark: false }, 
];

// Arrays vacíos obligatorios para evitar datos demo
export const MOCK_BRANCHES: BranchKPI[] = [];
export const MOCK_SALES_DATA: SalesData[] = [];
export const MOCK_INVENTORY: InventoryItem[] = [];
export const MOCK_TOP_PRODUCTS: ProductPerformance[] = [];
export const MOCK_CUSTOMERS: CustomerSegment[] = [];
