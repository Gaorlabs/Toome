import { KPI, SalesData, InventoryItem, ProductPerformance, CompanyContext } from './types';

export const MOCK_COMPANIES: CompanyContext[] = [
  {
    id: 'c1',
    name: 'TechSolutions Global',
    branches: [
      { id: 'b1', name: 'Sede Central - Madrid' },
      { id: 'b2', name: 'Sucursal Norte - Barcelona' },
      { id: 'b3', name: 'Sucursal Sur - Sevilla' },
    ]
  },
  {
    id: 'c2',
    name: 'Retail Masters S.A.',
    branches: [
      { id: 'b4', name: 'Tienda Flagship' },
      { id: 'b5', name: 'Outlet Center' },
    ]
  }
];

export const MOCK_KPIS: KPI[] = [
  { label: 'Ventas Totales', value: '€124,592.00', change: 12.5, trend: 'up', icon: 'DollarSign' },
  { label: 'Margen Global', value: '38.2%', change: -1.2, trend: 'down', icon: 'PieChart' },
  { label: 'Ticket Promedio', value: '€45.20', change: 4.8, trend: 'up', icon: 'CreditCard' },
  { label: 'Transacciones', value: '2,756', change: 8.4, trend: 'up', icon: 'ShoppingBag' },
];

export const MOCK_SALES_DATA: SalesData[] = [
  { date: '01/01', sales: 4000, margin: 1200, transactions: 85 },
  { date: '02/01', sales: 3000, margin: 900, transactions: 60 },
  { date: '03/01', sales: 5000, margin: 1600, transactions: 110 },
  { date: '04/01', sales: 2780, margin: 890, transactions: 55 },
  { date: '05/01', sales: 1890, margin: 600, transactions: 40 },
  { date: '06/01', sales: 6390, margin: 2100, transactions: 130 },
  { date: '07/01', sales: 8490, margin: 3200, transactions: 180 },
  { date: '08/01', sales: 4000, margin: 1200, transactions: 85 },
  { date: '09/01', sales: 3000, margin: 900, transactions: 60 },
  { date: '10/01', sales: 5000, margin: 1600, transactions: 110 },
  { date: '11/01', sales: 6780, margin: 2300, transactions: 140 },
  { date: '12/01', sales: 7890, margin: 2800, transactions: 160 },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', sku: 'PRD-001', name: 'Laptop Ultrabook X1', stock: 5, avgDailySales: 2, daysRemaining: 2.5, status: 'Critical', category: 'Electrónica' },
  { id: '2', sku: 'PRD-045', name: 'Mouse Inalámbrico Pro', stock: 12, avgDailySales: 4, daysRemaining: 3, status: 'Warning', category: 'Accesorios' },
  { id: '3', sku: 'PRD-089', name: 'Monitor 4K 27"', stock: 45, avgDailySales: 1, daysRemaining: 45, status: 'Healthy', category: 'Electrónica' },
  { id: '4', sku: 'PRD-102', name: 'Teclado Mecánico RGB', stock: 8, avgDailySales: 1.5, daysRemaining: 5.3, status: 'Critical', category: 'Accesorios' },
  { id: '5', sku: 'PRD-201', name: 'Soporte Laptop Aluminio', stock: 18, avgDailySales: 2, daysRemaining: 9, status: 'Warning', category: 'Accesorios' },
  { id: '6', sku: 'PRD-305', name: 'Webcam HD 1080p', stock: 150, avgDailySales: 5, daysRemaining: 30, status: 'Healthy', category: 'Electrónica' },
];

export const MOCK_TOP_PRODUCTS: ProductPerformance[] = [
  { id: 'p1', name: 'Laptop Ultrabook X1', category: 'Electrónica', sales: 45000, margin: 12000, profitability: 26.6 },
  { id: 'p2', name: 'Smartphone Pro Max', category: 'Electrónica', sales: 38000, margin: 8000, profitability: 21.0 },
  { id: 'p3', name: 'Monitor 4K 27"', category: 'Electrónica', sales: 22000, margin: 6000, profitability: 27.2 },
  { id: 'p4', name: 'Silla Ergonómica', category: 'Mobiliario', sales: 15000, margin: 7500, profitability: 50.0 },
  { id: 'p5', name: 'Auriculares Noise Cancel', category: 'Audio', sales: 12000, margin: 4000, profitability: 33.3 },
];