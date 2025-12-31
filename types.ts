

export interface KPI {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  isDark?: boolean; // New for the Black Card style
}

export interface SalesData {
  date: string;
  sales: number;
  margin: number;
  transactions: number;
}

export interface BranchKPI {
  id: string;
  name: string;
  sales: number;
  margin: number;
  target: number; 
  profitability: number; // percentage
  status: 'OPEN' | 'CLOSED';
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
  PROFITABILITY = 'PROFITABILITY',
  BRANCHES = 'BRANCHES',
  INVENTORY = 'INVENTORY',
  PRODUCTS = 'PRODUCTS',
  CUSTOMERS = 'CUSTOMERS',
  REPORTS = 'REPORTS',
  CLIENT_MANAGEMENT = 'CLIENT_MANAGEMENT',
  CONNECTION_MANAGEMENT = 'CONNECTION_MANAGEMENT',
  AGENDA = 'AGENDA'
}

// Permissions Types
export type AppModule = 'DASHBOARD' | 'INVENTORY' | 'PRODUCTS' | 'SALES' | 'AGENDA' | 'REPORTS';

export interface ClientAccess {
  id: string;
  name: string;
  accessKey: string;
  assignedConnectionIds: string[]; 
  allowedCompanyIds: string[]; 
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
  name: string;
  url: string;
  db: string;
  user: string;
  apiKey: string;
  status: 'CONNECTED' | 'ERROR' | 'PENDING';
  connectionMode?: 'REAL' | 'MOCK';
  lastCheck: string | null;
  companies: OdooCompany[]; 
}

export type UserRole = 'ADMIN' | 'CLIENT';

export interface UserSession {
  role: UserRole;
  name: string;
  clientData?: ClientAccess; 
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  attendees?: string; 
  status: 'needsAction' | 'confirmed' | 'tentative' | 'cancelled';
}

export interface DashboardProps {
  kpis: KPI[];
  salesData: SalesData[];
  topProducts: ProductPerformance[];
  inventory: InventoryItem[];
  branchKPIs: BranchKPI[]; // New: Data for Branch Cards
  activeConnection: OdooConnection | null;
}