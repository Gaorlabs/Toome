
import { KPI, SalesData, InventoryItem, ProductPerformance, CompanyContext, CustomerSegment } from './types';

export const MOCK_COMPANIES: CompanyContext[] = [
  {
    id: 'c1',
    name: 'Vida Group S.A.C.',
    branches: [
      { id: 'b1', name: 'Sede Principal - Lima' },
      { id: 'b2', name: 'Almacén Central' },
    ]
  }
];

export const MOCK_KPIS: KPI[] = [
  { label: 'Ventas Totales', value: 'S/. 124,592.00', change: 12.5, trend: 'up', icon: 'DollarSign' },
  { label: 'Margen Global', value: '38.2%', change: -1.2, trend: 'down', icon: 'PieChart' },
  { label: 'Ticket Promedio', value: 'S/. 45.20', change: 4.8, trend: 'up', icon: 'CreditCard' },
  { label: 'Alertas Stock', value: '5 Críticos', change: 2, trend: 'down', icon: 'AlertTriangle' }, 
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
  { id: '1', sku: 'ELEC-LPT-X1', name: 'Laptop Ultrabook X1', stock: 4, avgDailySales: 1.5, daysRemaining: 2.6, status: 'Critical', category: 'Electrónica' },
  { id: '2', sku: 'ACC-MSE-WL', name: 'Mouse Inalámbrico Pro', stock: 12, avgDailySales: 3.0, daysRemaining: 4.0, status: 'Warning', category: 'Accesorios' },
  { id: '3', sku: 'ELEC-MON-4K', name: 'Monitor 4K 27"', stock: 45, avgDailySales: 0.8, daysRemaining: 56.2, status: 'Healthy', category: 'Electrónica' },
  { id: '4', sku: 'ACC-KBD-RGB', name: 'Teclado Mecánico RGB', stock: 5, avgDailySales: 1.2, daysRemaining: 4.1, status: 'Critical', category: 'Accesorios' },
  { id: '5', sku: 'ACC-STND-AL', name: 'Soporte Laptop Aluminio', stock: 18, avgDailySales: 1.5, daysRemaining: 12.0, status: 'Warning', category: 'Accesorios' },
  { id: '6', sku: 'ELEC-CAM-HD', name: 'Webcam HD 1080p', stock: 150, avgDailySales: 4.2, daysRemaining: 35.7, status: 'Healthy', category: 'Electrónica' },
  { id: '7', sku: 'MOB-CHR-ERG', name: 'Silla Ergonómica V2', stock: 2, avgDailySales: 0.5, daysRemaining: 4.0, status: 'Critical', category: 'Mobiliario' },
];

export const MOCK_TOP_PRODUCTS: ProductPerformance[] = [
  { id: 'p1', name: 'Laptop Ultrabook X1', category: 'Electrónica', sales: 45000, cost: 33000, margin: 12000, marginPercent: 26.6, profitability: 26.6, abcClass: 'A', rotation: 'High' },
  { id: 'p2', name: 'Smartphone Gen 14', category: 'Electrónica', sales: 38000, cost: 30000, margin: 8000, marginPercent: 21.0, profitability: 21.0, abcClass: 'A', rotation: 'High' },
  { id: 'p3', name: 'Monitor 4K 27"', category: 'Electrónica', sales: 22000, cost: 16000, margin: 6000, marginPercent: 27.2, profitability: 27.2, abcClass: 'B', rotation: 'Medium' },
  { id: 'p4', name: 'Silla Ergonómica V2', category: 'Mobiliario', sales: 15000, cost: 7500, margin: 7500, marginPercent: 50.0, profitability: 50.0, abcClass: 'B', rotation: 'Low' },
  { id: 'p5', name: 'Auriculares Noise Cancel', category: 'Audio', sales: 12000, cost: 8000, margin: 4000, marginPercent: 33.3, profitability: 33.3, abcClass: 'C', rotation: 'Medium' },
  { id: 'p6', name: 'Cable HDMI 2m', category: 'Accesorios', sales: 1500, cost: 300, margin: 1200, marginPercent: 80.0, profitability: 80.0, abcClass: 'C', rotation: 'High' },
];

export const MOCK_CUSTOMERS: CustomerSegment[] = [
  { id: 'c1', name: 'Juan Pérez', segment: 'VIP', ltv: 12500, lastPurchaseDate: '2025-01-20', frequency: 15, totalSpent: 12500 },
  { id: 'c2', name: 'Empresa ABC S.A.C.', segment: 'VIP', ltv: 45000, lastPurchaseDate: '2025-01-18', frequency: 24, totalSpent: 45000 },
  { id: 'c3', name: 'María Garcia', segment: 'Regular', ltv: 3200, lastPurchaseDate: '2025-01-10', frequency: 5, totalSpent: 3200 },
  { id: 'c4', name: 'Carlos López', segment: 'Risk', ltv: 800, lastPurchaseDate: '2024-10-15', frequency: 2, totalSpent: 800 },
  { id: 'c5', name: 'Tech Solutions Ltd', segment: 'VIP', ltv: 28000, lastPurchaseDate: '2025-01-21', frequency: 12, totalSpent: 28000 },
  { id: 'c6', name: 'Ana Martinez', segment: 'Occasional', ltv: 150, lastPurchaseDate: '2024-12-24', frequency: 1, totalSpent: 150 },
];
