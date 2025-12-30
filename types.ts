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
  margin: number;
  profitability: number; // percentage
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
  REPORTS = 'REPORTS',
  CLIENT_MANAGEMENT = 'CLIENT_MANAGEMENT',
  CONNECTION_MANAGEMENT = 'CONNECTION_MANAGEMENT'
}

// Permissions Types
export type AppModule = 'DASHBOARD' | 'INVENTORY' | 'PRODUCTS' | 'SALES' | 'REPORTS';

// New Types for Toome Auth
export interface ClientAccess {
  id: string;
  name: string;
  accessKey: string;
  assignedConnectionIds: string[]; // IDs of OdooConnections they can access
  allowedModules: AppModule[]; // Features they can see (e.g. Sales, Inventory)
  createdAt: string;
}

export interface ConnectionConfig {
  url: string;
  db: string;
  user: string;
  apiKey: string;
  isConfigured: boolean;
}

export interface OdooConnection {
  id: string;
  name: string; // Friendly name (e.g. "Sucursal Norte")
  url: string;
  db: string;
  user: string;
  apiKey: string;
  status: 'CONNECTED' | 'ERROR' | 'PENDING';
  lastCheck: string | null;
}

export type UserRole = 'ADMIN' | 'CLIENT';

export interface UserSession {
  role: UserRole;
  name: string;
  clientData?: ClientAccess; // Only if role is CLIENT
}