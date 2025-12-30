
export interface KPI {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface SalesData {
  date: string;
  sales: number;
  margin: number;
  transactions: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  sales: number;
  cost: number;
  margin: number;
  marginPercent: number;
  profitability: number; // percentage
  abcClass: 'A' | 'B' | 'C';
  rotation: 'High' | 'Medium' | 'Low';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  avgDailySales: number;
  daysRemaining: number;
  status: 'Critical' | 'Warning' | 'Healthy';
  category: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  segment: 'VIP' | 'Regular' | 'Occasional' | 'Risk';
  ltv: number; // Lifetime Value
  lastPurchaseDate: string;
  frequency: number;
  totalSpent: number;
}

export interface CompanyContext {
  id: string;
  name: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  PRODUCTS = 'PRODUCTS',
  CUSTOMERS = 'CUSTOMERS',
  AGENDA = 'AGENDA', // New View Mode
  REPORTS = 'REPORTS',
  CLIENT_MANAGEMENT = 'CLIENT_MANAGEMENT',
  CONNECTION_MANAGEMENT = 'CONNECTION_MANAGEMENT'
}

// Permissions Types
export type AppModule = 'DASHBOARD' | 'INVENTORY' | 'PRODUCTS' | 'SALES' | 'AGENDA' | 'REPORTS';

// New Types for Toome Auth
export interface ClientAccess {
  id: string;
  name: string;
  accessKey: string;
  assignedConnectionIds: string[]; // IDs of OdooConnections they have access to (derived)
  allowedCompanyIds: string[]; // NEW: Specific Company IDs (e.g. 'c1', 'c2')
  allowedModules: AppModule[]; 
  createdAt: string;
}

export interface ConnectionConfig {
  url: string;
  db: string;
  user: string;
  apiKey: string;
  isConfigured: boolean;
}

export interface OdooCompany {
  id: string;
  name: string;
  currency: string;
}

export interface OdooConnection {
  id: string;
  name: string; // Friendly name (e.g. "Sucursal Norte")
  url: string;
  db: string;
  user: string;
  apiKey: string;
  status: 'CONNECTED' | 'ERROR' | 'PENDING';
  connectionMode?: 'REAL' | 'MOCK'; // NEW: To distinguish Proxy vs Fallback
  lastCheck: string | null;
  companies: OdooCompany[]; // NEW: List of companies inside this DB
}

export type UserRole = 'ADMIN' | 'CLIENT';

export interface UserSession {
  role: UserRole;
  name: string;
  clientData?: ClientAccess; // Only if role is CLIENT
}

// Calendar Types for Agenda Module
export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  attendees?: string; // stringified list for display
  status: 'needsAction' | 'confirmed' | 'tentative' | 'cancelled';
}

// Props interface moved here to avoid circular dependencies
export interface DashboardProps {
  kpis: KPI[];
  salesData: SalesData[];
  topProducts: ProductPerformance[];
  inventory: InventoryItem[];
  activeConnection: OdooConnection | null; // Added for real-time fetching
}
