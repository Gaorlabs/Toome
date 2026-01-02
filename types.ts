
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

export interface DailyProductSummary {
  id: string;
  name: string;
  qty: number;
  total: number;
}

export interface PaymentSummary {
  name: string;
  amount: number;
  count: number;
}

export interface BranchKPI {
  id: string;
  name: string;
  sales: number;
  margin: number;
  target: number; 
  profitability: number; // percentage
  status: 'OPEN' | 'CLOSED' | 'OPENING_CONTROL' | 'CLOSING_CONTROL';
  cashier?: string; // Nombre del cajero/usuario actual
  transactionCount: number;
  // New specific details per box
  topProducts?: DailyProductSummary[];
  payments?: PaymentSummary[];
}

// Nuevas interfaces para el detalle del dashboard (Globales)
export interface DocumentTypeSummary {
  type: 'Boleta' | 'Factura' | 'Nota Crédito' | 'Ticket/Int';
  count: number;
  total: number;
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
  location?: string;
  cost: number;
  totalValue: number; // Stock * Cost (Kardex Valorizado)
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
  AGENDA = 'AGENDA',
  STAFF = 'STAFF'
}

// Permissions Types
export type AppModule = 'DASHBOARD' | 'INVENTORY' | 'PRODUCTS' | 'SALES' | 'AGENDA' | 'REPORTS' | 'STAFF';

export interface ClientAccess {
  id: string;
  name: string;
  accessKey: string;
  assignedConnectionIds: string[]; 
  allowedCompanyIds: string[]; 
  allowedPosIds?: number[]; 
  allowedModules: AppModule[]; 
  createdAt: string;
}

export interface PosConfig {
    id: number;
    name: string;
    company_id: any[]; // [id, name]
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

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// --- STAFF / EMPLOYEES TYPES ---

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  status: 'active' | 'inactive';
  workEmail?: string;
  workPhone?: string; // Odoo work phone
  image?: string; 
  
  // Odoo User Link
  odooUserId?: number; // Para vincular con pos.session

  // Live Status (Calculated)
  currentPos?: string; // Nombre del POS si está logueado

  // --- Extended Fields (Stored in Supabase 'employee_profiles') ---
  identificationId?: string; // DNI
  personalEmail?: string;
  personalPhone?: string; // Teléfono personal/celular
  address?: string;
  birthDate?: string;
  photoUrl?: string; // Foto personalizada
  publicToken?: string; // Token para vista pública
  
  // Normativa Peruana
  pensionSystem?: string; // AFP / ONP
  bankName?: string;
  bankAccount?: string; // CCI
  emergencyContactName?: string;
  emergencyContactPhone?: string; // Teléfono familiar emergencia

  // Compensación
  salaryBase?: number;
  salaryCommission?: number; // Monto o porcentaje estimado
  hasFamilyAllowance?: boolean; // Asignación Familiar
}

export interface PayrollRow {
    employeeId: string;
    employeeName: string;
    dni: string;
    system: string; // ONP/AFP
    baseSalary: number;
    familyAllowance: number; // 102.50 or 0
    commissions: number; // Editable
    totalIncome: number; // Bruto
    deductionPension: number; // ~13% or 11.7%
    netPay: number; // Neto
    employerEssalud: number; // 9%
}

export interface WorkShift {
  id?: string; // Supabase ID
  employeeId: string;
  employeeName: string;
  day: string; // YYYY-MM-DD
  shift: 'MORNING' | 'AFTERNOON' | 'FULL' | 'REST';
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string; // Store/Branch name
}

// --- PERUVIAN SPECIFIC TYPES ---

export interface SalesRegisterItem {
  id: string;
  date: string;
  documentType: 'Factura' | 'Boleta' | 'Nota Crédito' | 'Nota Débito';
  series: string;
  number: string;
  clientName: string;
  clientDocType: 'RUC' | 'DNI' | 'Otro';
  clientDocNum: string;
  currency: string;
  baseAmount: number; // Valor Venta (Sin IGV)
  igvAmount: number; // IGV
  totalAmount: number; // Precio Venta
  status: 'Emitido' | 'Anulado';
  paymentState: 'Pagado' | 'No Pagado';
}

export interface PaymentMethodSummary {
  method: string; // Yape, Plin, Efectivo, Visa
  amount: number;
  count: number;
}

export interface CashClosingReport {
  sessionId: string;
  posName: string;
  cashierName: string;
  openingDate: string;
  closingDate: string | null;
  openingBalance: number;
  totalSales: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  state: 'Abierto' | 'Cerrando' | 'Cerrado';
  payments: PaymentMethodSummary[];
}

export interface DashboardProps {
  kpis: KPI[];
  salesData: SalesData[];
  topProducts: ProductPerformance[];
  inventory: InventoryItem[];
  branchKPIs: BranchKPI[]; 
  activeConnection: OdooConnection | null;
  userSession?: UserSession | null; 
}
