import { KPI, SalesData, InventoryItem, ProductPerformance, CompanyContext } from './types';

export const MOCK_COMPANIES: CompanyContext[] = [
  {
    id: 'c1',
    name: 'Vida Group S.A.C.',
    branches: [
      { id: 'b1', name: 'Sede Principal - Lima' },
      { id: 'b2', name: 'Almacén Central' },
    ]
  },
  {
    id: 'c2',
    name: 'Vida Retail',
    branches: [
      { id: 'b3', name: 'Tienda Miraflores' },
      { id: 'b4', name: 'Tienda San Isidro' },
    ]
  },
  {
    id: 'c3',
    name: 'IGP Corp',
    branches: [
      { id: 'b5', name: 'Oficinas IGP' },
      { id: 'b6', name: 'Planta de Producción' },
    ]
  },
  {
    id: 'c4',
    name: 'IGP Logistics',
    branches: [
      { id: 'b7', name: 'Centro de Distribución' },
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
  { id: '8', sku: 'ELEC-PHN-14', name: 'Smartphone Gen 14', stock: 8, avgDailySales: 2.0, daysRemaining: 4.0, status: 'Critical', category: 'Electrónica' },
  { id: '9', sku: 'ACC-HUB-USBC', name: 'Hub USB-C 7-in-1', stock: 25, avgDailySales: 1.1, daysRemaining: 22.7, status: 'Healthy', category: 'Accesorios' },
  { id: '10', sku: 'MOB-DSK-STD', name: 'Escritorio Elevable', stock: 15, avgDailySales: 0.3, daysRemaining: 50.0, status: 'Healthy', category: 'Mobiliario' },
  { id: '11', sku: 'ELEC-TAB-PRO', name: 'Tablet Pro 11"', stock: 6, avgDailySales: 0.9, daysRemaining: 6.6, status: 'Warning', category: 'Electrónica' },
  { id: '12', sku: 'ACC-CBL-HDMI', name: 'Cable HDMI 2.1', stock: 3, avgDailySales: 2.5, daysRemaining: 1.2, status: 'Critical', category: 'Accesorios' },
];

export const MOCK_TOP_PRODUCTS: ProductPerformance[] = [
  { id: 'p1', name: 'Laptop Ultrabook X1', category: 'Electrónica', sales: 45000, margin: 12000, profitability: 26.6 },
  { id: 'p2', name: 'Smartphone Gen 14', category: 'Electrónica', sales: 38000, margin: 8000, profitability: 21.0 },
  { id: 'p3', name: 'Monitor 4K 27"', category: 'Electrónica', sales: 22000, margin: 6000, profitability: 27.2 },
  { id: 'p4', name: 'Silla Ergonómica V2', category: 'Mobiliario', sales: 15000, margin: 7500, profitability: 50.0 },
  { id: 'p5', name: 'Auriculares Noise Cancel', category: 'Audio', sales: 12000, margin: 4000, profitability: 33.3 },
];