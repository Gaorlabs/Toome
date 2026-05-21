
import { OdooConnection, CalendarEvent, OdooCompany, SalesData, InventoryItem, BranchKPI, PosConfig, SalesRegisterItem, CashClosingReport, PaymentMethodSummary, DateRange, PaymentSummary, DailyProductSummary, DocumentTypeSummary, Employee } from '../types';
import { OdooClient } from './OdooRpcClient';
import { MOCK_INVENTORY } from '../constants';

const getClient = (conn: OdooConnection): OdooClient => {
    return new OdooClient(conn.url, conn.db);
};

const parseIds = (ids?: string[] | number[]): number[] => {
    if (!ids || !Array.isArray(ids)) return [];
    return ids.map(id => parseInt(String(id))).filter(n => !isNaN(n) && n > 0);
};

export const testOdooConnection = async (connection: OdooConnection): Promise<{ success: boolean; mode: 'REAL' | 'MOCK'; companies: OdooCompany[]; error?: string }> => {
  if (connection.connectionMode === 'MOCK') {
      return { 
          success: true, 
          mode: 'MOCK', 
          companies: [ { id: '1', name: 'Farmacia Demo', currency: 'PEN' } ] 
      };
  }

  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    if (!uid) throw new Error("Credenciales inválidas (UID nulo).");

    const companiesData = await client.searchRead(
        uid,
        connection.apiKey,
        'res.company',
        [], 
        ['name', 'currency_id']
    );

    const companies: OdooCompany[] = Array.isArray(companiesData) ? companiesData.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        currency: Array.isArray(c.currency_id) ? c.currency_id[1] : 'PEN' 
    })) : [];

    return { success: true, mode: 'REAL', companies };

  } catch (e: any) {
    console.error("Connection Error:", e);
    return { success: false, mode: 'REAL', companies: [], error: e.message || "Error desconocido" };
  }
};

export const fetchPosConfigs = async (connection: OdooConnection, companyId?: string): Promise<PosConfig[] | null> => {
    if (connection.connectionMode === 'MOCK') return [];
    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        if (!uid) return null;
        
        const domain = companyId ? [['company_id', '=', parseInt(companyId)]] : [];
        const configs = await client.searchRead(uid, connection.apiKey, 'pos.config', domain, ['name', 'company_id'], { limit: 200 });
        return Array.isArray(configs) ? configs : [];
    } catch (e) {
        return []; 
    }
};

export const fetchOdooRealTimeData = async (
    connection: OdooConnection, 
    startDate: string,
    endDate: string,
    allowedCompanyIds?: string[],
    allowedPosIds?: number[]
): Promise<{
    salesData: SalesData[],
    branches: BranchKPI[],
    totalSales: number,
    totalMargin: number,
    totalItems: number,
    paymentMethods: PaymentSummary[],
    topProducts: DailyProductSummary[],
    documentTypes: DocumentTypeSummary[],
    error?: string
}> => {
  
  const result = { 
      salesData: [] as SalesData[], 
      branches: [] as BranchKPI[], 
      totalSales: 0, 
      totalMargin: 0, 
      totalItems: 0, 
      paymentMethods: [] as PaymentSummary[], 
      topProducts: [] as DailyProductSummary[], 
      documentTypes: [] as DocumentTypeSummary[] 
  };

  if (connection.connectionMode === 'MOCK') return result;
  
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);
    if (!uid) throw new Error("Error de Autenticación.");

    // Config Filters
    const isClientMode = Array.isArray(allowedCompanyIds); // If undefined, it's admin (full access)
    const targetCompanyIds = parseIds(allowedCompanyIds); 
    const targetPosIds = parseIds(allowedPosIds);
    
    // Dates need to be strings for Odoo Domains: 'YYYY-MM-DD HH:mm:ss'
    const dateStartStr = `${startDate} 00:00:00`;
    const dateEndStr = `${endDate} 23:59:59`;

    let dailyMap: Record<string, { sales: number, count: number }> = {};
    let branchesMap: Record<string, BranchKPI> = {};
    let allPosConfigIds: number[] = [];

    // --- 1. POS DATA ---
    try {
        let configDomain: any[] = [];
        
        if (isClientMode) {
            // Logic for Client Restrictions
            if (targetCompanyIds.length > 0 && targetPosIds.length > 0) {
                 configDomain = ['|', ['company_id', 'in', targetCompanyIds], ['id', 'in', targetPosIds]];
            } else if (targetCompanyIds.length > 0) {
                configDomain = [['company_id', 'in', targetCompanyIds]];
            } else if (targetPosIds.length > 0) {
                configDomain = [['id', 'in', targetPosIds]];
            }
        }

        const configs = await client.searchRead(uid, connection.apiKey, 'pos.config', configDomain, ['id', 'name', 'company_id'], { limit: 200 });
        
        if (Array.isArray(configs)) {
            allPosConfigIds = configs.map((c: any) => c.id);
            
            configs.forEach((c: any) => {
                branchesMap[`POS_${c.id}`] = {
                    id: `POS_${c.id}`, 
                    name: c.name, 
                    sales: 0, margin: 0, target: 0, profitability: 0, status: 'CLOSED', transactionCount: 0, cashier: '---',
                    topProducts: [], payments: []
                };
            });

            if (allPosConfigIds.length > 0) {
                const posOrderDomain: any[] = [
                    ['state', 'in', ['paid', 'done', 'invoiced']],
                    ['date_order', '>=', dateStartStr],
                    ['date_order', '<=', dateEndStr],
                    ['config_id', 'in', allPosConfigIds] 
                ];

                const posOrders = await client.searchRead(uid, connection.apiKey, 'pos.order', posOrderDomain, ['amount_total', 'date_order', 'config_id'], { limit: 5000 });
                
                if (Array.isArray(posOrders)) {
                    posOrders.forEach((o: any) => {
                        const cid = Array.isArray(o.config_id) ? o.config_id[0] : o.config_id;
                        const branchKey = `POS_${cid}`;
                        
                        if (branchesMap[branchKey]) {
                            result.totalSales += o.amount_total || 0;
                            result.totalItems += 1;
                            
                            const date = o.date_order ? o.date_order.split(' ')[0] : 'N/A';
                            if (!dailyMap[date]) dailyMap[date] = { sales: 0, count: 0 };
                            dailyMap[date].sales += o.amount_total || 0;
                            dailyMap[date].count += 1;

                            branchesMap[branchKey].sales += o.amount_total || 0;
                            branchesMap[branchKey].transactionCount += 1;
                            branchesMap[branchKey].status = 'OPEN'; 
                        }
                    });
                }
            }
        }
    } catch (posError) {
        console.warn("POS Fetch Error:", posError);
    }

    // --- 2. SALES ORDERS (CORPORATE) ---
    try {
        let saleDomain: any[] = [
            ['state', 'in', ['sale', 'done']],
            ['date_order', '>=', dateStartStr],
            ['date_order', '<=', dateEndStr]
        ];

        if (isClientMode && targetCompanyIds.length > 0) {
            saleDomain.push(['company_id', 'in', targetCompanyIds]);
        }

        const saleOrders = await client.searchRead(uid, connection.apiKey, 'sale.order', saleDomain, ['amount_total', 'date_order'], { limit: 2000 });

        if (Array.isArray(saleOrders) && saleOrders.length > 0) {
            const VIRTUAL_ID = 'VIRTUAL_SALES';
            if (!branchesMap[VIRTUAL_ID]) {
                branchesMap[VIRTUAL_ID] = {
                    id: VIRTUAL_ID, name: 'Ventas Web / Corporativo', sales: 0, margin: 0, target: 0, profitability: 0, status: 'OPEN', transactionCount: 0, cashier: 'Sistema', topProducts: [], payments: []
                };
            }

            saleOrders.forEach((o: any) => {
                result.totalSales += o.amount_total || 0;
                result.totalItems += 1;

                const date = o.date_order ? o.date_order.split(' ')[0] : 'N/A';
                if (!dailyMap[date]) dailyMap[date] = { sales: 0, count: 0 };
                dailyMap[date].sales += o.amount_total || 0;
                dailyMap[date].count += 1;

                branchesMap[VIRTUAL_ID].sales += o.amount_total || 0;
                branchesMap[VIRTUAL_ID].transactionCount += 1;
            });
        }
    } catch (saleError) {
        console.warn("Sale Order Fetch Error:", saleError);
    }

    // --- 3. INVOICES (SUMMARY) ---
    try {
        const invoiceDomain: any[] = [
            ['invoice_date', '>=', startDate], 
            ['invoice_date', '<=', endDate], 
            ['move_type', 'in', ['out_invoice', 'out_refund']], 
            ['state', '=', 'posted']
        ];
        
        if (isClientMode && targetCompanyIds.length > 0) {
             invoiceDomain.push(['company_id', 'in', targetCompanyIds]);
        }
        
        // Try read_group, fallback to search_read if group unsupported on model
        try {
            const docGroups = await client.readGroup(uid, connection.apiKey, 'account.move', invoiceDomain, ['amount_total', 'move_type'], ['move_type']);
            if (Array.isArray(docGroups)) {
                result.documentTypes = docGroups.map((dg: any) => ({
                    type: dg.move_type === 'out_refund' ? 'Nota Crédito' : 'Factura',
                    count: dg.move_type_count || 0,
                    total: dg.amount_total || 0
                }));
            }
        } catch (groupError) {
            // Fallback for older Odoo or permission issues on group
            const docs = await client.searchRead(uid, connection.apiKey, 'account.move', invoiceDomain, ['amount_total', 'move_type'], { limit: 1000 });
            // Manual aggregation would go here, simplified for now
        }
    } catch (invError) {
        console.warn("Invoice Fetch Error:", invError);
    }

    result.totalMargin = result.totalSales * 0.30; // Estimated
    result.salesData = Object.entries(dailyMap).map(([date, d]: any) => ({
        date, sales: d.sales, margin: d.sales * 0.3, transactions: d.count
    })).sort((a,b) => a.date.localeCompare(b.date));
    
    result.branches = Object.values(branchesMap);

    return result;

  } catch (error: any) {
    console.error("Critical Fetch Error:", error);
    return { ...result, error: error.message || "Error crítico de conexión" };
  }
};

export const fetchOdooAppointments = async (connection: OdooConnection) => [];

export const fetchSalesRegister = async (connection: OdooConnection, start: string, end: string, allowedCompanies?: string[]): Promise<SalesRegisterItem[]> => {
    if (connection.connectionMode === 'MOCK') return [];
    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
        const isClientMode = Array.isArray(allowedCompanies);
        const targetCompanies = parseIds(allowedCompanies);
        
        if (isClientMode && targetCompanies.length === 0) return [];

        const domain: any[] = [
            ['invoice_date', '>=', start], ['invoice_date', '<=', end],
            ['move_type', 'in', ['out_invoice', 'out_refund']], ['state', '!=', 'draft']
        ];
        
        if (targetCompanies.length > 0) {
            domain.push(['company_id', 'in', targetCompanies]);
        }

        const moves = await client.searchRead(uid, connection.apiKey, 'account.move', domain, 
            ['name', 'invoice_date', 'move_type', 'partner_id', 'amount_untaxed', 'amount_tax', 'amount_total', 'state'], 
            { limit: 500 }
        );
        
        if (!Array.isArray(moves)) return [];
        return moves.map((m: any) => ({
            id: m.id.toString(),
            date: m.invoice_date,
            documentType: (m.move_type === 'out_refund' ? 'Nota Crédito' : 'Factura') as any,
            series: m.name?.split('-')[0] || '000',
            number: m.name?.split('-')[1] || m.name,
            clientName: Array.isArray(m.partner_id) ? m.partner_id[1] : 'Cliente Varios',
            clientDocType: 'RUC',
            clientDocNum: '-', 
            currency: 'PEN',
            baseAmount: m.amount_untaxed || 0, 
            igvAmount: m.amount_tax || 0, 
            totalAmount: m.amount_total || 0,
            status: (m.state === 'posted' ? 'Emitido' : 'Anulado') as any,
            paymentState: 'Pagado'
        }));
    } catch(e) { return []; }
};

export const fetchInventoryWithAlerts = async (connection: OdooConnection, allowedCompanyIds?: string[]): Promise<InventoryItem[]> => {
    if (connection.connectionMode === 'MOCK') return MOCK_INVENTORY;
    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
        const isClientMode = Array.isArray(allowedCompanyIds);
        const targetCompanies = parseIds(allowedCompanyIds);

        if (isClientMode && targetCompanies.length === 0) return [];
        
        const domain: any[] = [['type', '=', 'product']];
        
        const products = await client.searchRead(uid, connection.apiKey, 'product.product', domain, ['name', 'default_code', 'categ_id', 'qty_available', 'standard_price'], { limit: 2000 });

        if (!Array.isArray(products)) return [];
        return products.map((p: any) => ({
            id: p.id.toString(), sku: p.default_code || 'S/N', name: p.name, category: Array.isArray(p.categ_id) ? String(p.categ_id[1]) : '-',
            stock: p.qty_available || 0, avgDailySales: 0, daysRemaining: 999, status: 'Healthy', cost: p.standard_price || 0, totalValue: (p.qty_available || 0) * (p.standard_price || 0)
        }));
    } catch (e) { return []; }
};

export const fetchEmployees = async (connection: OdooConnection, allowedCompanyIds?: string[]): Promise<Employee[]> => {
    if (connection.connectionMode === 'MOCK') return [];
    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
        const isClientMode = Array.isArray(allowedCompanyIds);
        const targetCompanyIds = parseIds(allowedCompanyIds);

        if (isClientMode && targetCompanyIds.length === 0) return [];

        const domain: any[] = [];
        if (targetCompanyIds.length > 0) {
            domain.push(['company_id', 'in', targetCompanyIds]);
        }

        const employees = await client.searchRead(uid, connection.apiKey, 'hr.employee', domain, 
            ['name', 'job_title', 'department_id', 'work_email', 'work_phone', 'identification_id', 'birthday', 'gender'], 
            { limit: 100 }
        );

        if (!Array.isArray(employees)) return [];
        return employees.map((emp: any) => ({
            id: emp.id.toString(), name: emp.name, jobTitle: emp.job_title || 'Sin Cargo', department: Array.isArray(emp.department_id) ? emp.department_id[1] : 'General',
            status: 'active', workEmail: emp.work_email, workPhone: emp.work_phone, identificationId: emp.identification_id, birthday: emp.birthday, gender: emp.gender
        }));
    } catch (e) { return []; }
};

export const fetchInventoryValuation = async (c:any, ids?: string[]) => [];
export const fetchAccountsReceivable = async (c:any, ids?: string[]) => [];
export const fetchCashClosingReport = async (c:any, start:string, end:string, ids?: string[]) => [];
export const fetchPaymentAnalysis = async (c:any, start:string, end:string, ids?: string[]) => [];
export const fetchProductProfitabilityReport = async (c:any, start:string, end:string, ids?: string[]) => [];
