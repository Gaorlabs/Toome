
import { OdooConnection, CalendarEvent, OdooCompany, SalesData, InventoryItem, BranchKPI, PosConfig, SalesRegisterItem, CashClosingReport, PaymentMethodSummary, DateRange } from '../types';
import { OdooClient } from './OdooRpcClient';

// ==========================================
// PUENTE DE NEGOCIO (LOGICA DE TOOME)
// ==========================================

const getClient = (conn: OdooConnection): OdooClient => {
    return new OdooClient(conn.url, conn.db, true);
};

export const testOdooConnection = async (connection: OdooConnection): Promise<{ success: boolean; mode: 'REAL' | 'MOCK'; companies: OdooCompany[]; error?: string }> => {
  if (connection.connectionMode === 'MOCK') {
      return { 
          success: true, 
          mode: 'MOCK', 
          companies: [
              { id: '1', name: 'Farmacia Central', currency: 'USD' },
              { id: '2', name: 'Sucursal Surco', currency: 'PEN' }
          ] 
      };
  }

  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    if (!uid) throw new Error("Autenticación fallida: UID inválido.");

    // Obtener Compañías
    const companiesData = await client.searchRead(
        uid,
        connection.apiKey,
        'res.company',
        [],
        ['name', 'currency_id']
    );

    if(!Array.isArray(companiesData)) throw new Error("No se pudo leer la lista de compañías.");

    const companies: OdooCompany[] = companiesData.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        currency: Array.isArray(c.currency_id) ? c.currency_id[1] : 'PEN' 
    }));

    return { success: true, mode: 'REAL', companies };

  } catch (e: any) {
    console.error("❌ Error de Conexión:", e.message);
    return { success: false, mode: 'REAL', companies: [], error: e.message };
  }
};

export const fetchPosConfigs = async (connection: OdooConnection): Promise<PosConfig[] | null> => {
    if (connection.connectionMode === 'MOCK') {
        return [
            { id: 101, name: 'Caja Principal', company_id: [1, 'Farmacia Central'] },
            { id: 102, name: 'Caja Secundaria', company_id: [1, 'Farmacia Central'] },
            { id: 201, name: 'Caja Surco 1', company_id: [2, 'Sucursal Surco'] }
        ];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
        // Fetch POS configs
        const posConfigs = await client.searchRead(
            uid,
            connection.apiKey,
            'pos.config',
            [], 
            ['name', 'company_id'],
            { limit: 1000 }
        );
        
        if (!Array.isArray(posConfigs)) return null;

        return posConfigs as PosConfig[];

    } catch (e) {
        console.error("Error fetching POS Configs:", e);
        return null; 
    }
};

/**
 * Genera las condiciones de fecha basadas en strings explícitos.
 * Recibe startDate (YYYY-MM-DD) y endDate (YYYY-MM-DD)
 */
const getDateConditions = (dateField: string, startDate: string, endDate: string, isDatetime: boolean): any[][] => {
    let start = startDate;
    let end = endDate;

    if (isDatetime) {
        // Asegurar cobertura completa del día
        if (!start.includes(' ')) start += ' 00:00:00';
        if (!end.includes(' ')) end += ' 23:59:59';
    }

    return [
        [dateField, '>=', start],
        [dateField, '<=', end]
    ];
};

/**
 * DATOS EN TIEMPO REAL - CORAZÓN DEL SISTEMA
 * Ahora acepta startDate y endDate explícitos para control total desde la UI.
 */
export const fetchOdooRealTimeData = async (
    connection: OdooConnection, 
    startDate: string, // YYYY-MM-DD
    endDate: string,   // YYYY-MM-DD
    allowedCompanyIds?: string[],
    allowedPosIds?: number[]
): Promise<{
    salesData: SalesData[],
    branches: BranchKPI[],
    totalSales: number,
    totalMargin: number,
    totalItems: number
}> => {
  
  // MOCK DATA
  if (connection.connectionMode === 'MOCK') {
      // Simular variaciones basadas en fecha
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      const multiplier = diffDays > 30 ? 12 : diffDays > 1 ? 4 : 1;
      
      return {
          salesData: [
              { date: startDate, sales: 1200 * multiplier, margin: 400 * multiplier, transactions: 15 },
              { date: endDate, sales: 2830 * multiplier, margin: 950 * multiplier, transactions: 35 },
          ],
          branches: [
              { id: '1', name: 'Farmacia Central', sales: 5800 * multiplier, margin: 2100 * multiplier, target: 5000, profitability: 36.2, status: 'OPEN', transactionCount: 45, cashier: 'Juan Pérez' },
              { id: '2', name: 'Sucursal Surco', sales: 2730 * multiplier, margin: 900 * multiplier, target: 3000, profitability: 32.9, status: 'CLOSED', transactionCount: 22, cashier: 'Ana Lopez' }
          ],
          totalSales: 8530 * multiplier,
          totalMargin: 3000 * multiplier,
          totalItems: 110 * multiplier
      };
  }
  
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    // --- PASO 1: DEFINIR EL ALCANCE (CAJAS A CONSULTAR) ---
    let configDomain: any[] = [];
    if (allowedPosIds && allowedPosIds.length > 0) {
        configDomain.push(['id', 'in', allowedPosIds]);
    } else if (allowedCompanyIds && allowedCompanyIds.length > 0) {
        const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
        configDomain.push(['company_id', 'in', compIdsInt]);
    }

    const configs = await client.searchRead(uid, connection.apiKey, 'pos.config', configDomain, ['id', 'name']);
    const branchesMap: Record<string, BranchKPI> = {};

    if (Array.isArray(configs)) {
        configs.forEach((cfg: any) => {
            branchesMap[cfg.id] = {
                id: cfg.id.toString(),
                name: cfg.name,
                sales: 0,
                margin: 0,
                target: 0,
                profitability: 0,
                status: 'CLOSED',
                transactionCount: 0,
                cashier: '---'
            };
        });
    }

    // --- PASO 2: OBTENER ESTADO ACTUAL (SESIONES) ---
    const sessionDomain = [
        ['state', '!=', 'closed'], 
        ['config_id', 'in', Object.keys(branchesMap).map(Number)]
    ];
    
    const activeSessions = await client.searchRead(
        uid, 
        connection.apiKey, 
        'pos.session', 
        sessionDomain, 
        ['config_id', 'user_id', 'state']
    );

    if (Array.isArray(activeSessions)) {
        activeSessions.forEach((sess: any) => {
             const configId = Array.isArray(sess.config_id) ? sess.config_id[0] : sess.config_id;
             if (branchesMap[configId]) {
                 const st = sess.state;
                 branchesMap[configId].status = (st === 'opened' || st === 'opening_control') ? 'OPEN' : 'CLOSING_CONTROL';
                 branchesMap[configId].cashier = Array.isArray(sess.user_id) ? sess.user_id[1] : 'Usuario';
             }
        });
    }

    // --- PASO 3: OBTENER VENTAS (AGREGACIÓN) ---
    // Usamos las fechas explícitas proporcionadas por la UI
    const dateConditions = getDateConditions('date_order', startDate, endDate, true);
    
    const orderDomain: any[] = [
        ['state', 'in', ['paid', 'done', 'invoiced']],
        ...dateConditions,
        ['config_id', 'in', Object.keys(branchesMap).map(Number)]
    ];

    const posGroups = await client.readGroup(
        uid, connection.apiKey, 
        'pos.order',
        orderDomain,
        ['amount_total', 'date_order', 'config_id'], 
        ['date_order:day', 'config_id'] 
    );

    const salesByDate: Record<string, number> = {};
    let totalSales = 0;
    let totalItems = 0;

    if (Array.isArray(posGroups)) {
        for (const group of posGroups) {
            const amt = group.amount_total || 0;
            const count = group.config_id_count || 0; 
            const dateKey = group['date_order:day'] || 'N/A';
            
            if (!salesByDate[dateKey]) salesByDate[dateKey] = 0;
            salesByDate[dateKey] += amt;

            if (group.config_id) {
                const bId = Array.isArray(group.config_id) ? group.config_id[0] : group.config_id;
                if (branchesMap[bId]) {
                    branchesMap[bId].sales += amt;
                    branchesMap[bId].transactionCount += count;
                }
            }

            totalSales += amt;
            totalItems += count;
        }
    }

    Object.values(branchesMap).forEach(b => {
        b.margin = b.sales * 0.30; 
        b.profitability = 30.0;
    });

    const totalMargin = totalSales * 0.30;
    const salesData: SalesData[] = Object.entries(salesByDate).map(([date, sales]) => ({
        date,
        sales,
        margin: sales * 0.30,
        transactions: 0
    })).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

    return {
        salesData,
        branches: Object.values(branchesMap),
        totalSales,
        totalMargin,
        totalItems
    };

  } catch (error) {
    console.error("Error fetching real time data:", error);
    return { salesData: [], branches: [], totalSales: 0, totalMargin: 0, totalItems: 0 };
  }
};

/**
 * REPORTE DE CIERRE Z / ARQUEO
 */
export const fetchCashClosingReport = async (connection: OdooConnection, allowedPosIds?: number[]): Promise<CashClosingReport[]> => {
    return [];
};


/**
 * REGISTRO DE VENTAS DETALLADAS (Facturas/Boletas)
 */
export const fetchSalesRegister = async (
    connection: OdooConnection, 
    startDate: string,
    endDate: string,
    allowedCompanyIds?: string[]
): Promise<SalesRegisterItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [
             { id: '1', date: startDate, documentType: 'Factura', series: 'F001', number: '000459', clientName: 'DISTRIBUIDORA DEL SUR SAC', clientDocType: 'RUC', clientDocNum: '20556789123', currency: 'PEN', baseAmount: 1000.00, igvAmount: 180.00, totalAmount: 1180.00, status: 'Emitido', paymentState: 'Pagado' },
            { id: '2', date: endDate, documentType: 'Boleta', series: 'B001', number: '002301', clientName: 'JUAN PEREZ', clientDocType: 'DNI', clientDocNum: '45678912', currency: 'PEN', baseAmount: 50.00, igvAmount: 9.00, totalAmount: 59.00, status: 'Emitido', paymentState: 'Pagado' },
        ];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);

        // invoice_date is Date type (not Datetime usually)
        const dateConditions = getDateConditions('invoice_date', startDate, endDate, false);
        
        const domain: any[] = [
            ['move_type', 'in', ['out_invoice', 'out_refund']], 
            ['state', '=', 'posted'],
            ...dateConditions
        ];

        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
            const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
            if (compIdsInt.length > 0) {
                domain.push(['company_id', 'in', compIdsInt]);
            }
        }

        const invoices = await client.searchRead(
            uid,
            connection.apiKey,
            'account.move',
            domain,
            ['name', 'invoice_date', 'partner_id', 'amount_untaxed', 'amount_tax', 'amount_total', 'move_type', 'payment_state', 'currency_id'],
            { limit: 100, order: 'invoice_date desc' }
        );

        return invoices.map((inv: any) => ({
            id: inv.id.toString(),
            date: inv.invoice_date,
            documentType: inv.move_type === 'out_refund' ? 'Nota Crédito' : inv.name.startsWith('B') ? 'Boleta' : 'Factura',
            series: inv.name.split('-')[0] || 'F001',
            number: inv.name.split('-')[1] || inv.name,
            clientName: Array.isArray(inv.partner_id) ? inv.partner_id[1] : 'Cliente General',
            clientDocType: 'RUC', 
            clientDocNum: '---', 
            currency: Array.isArray(inv.currency_id) ? inv.currency_id[1] : 'PEN',
            baseAmount: inv.amount_untaxed,
            igvAmount: inv.amount_tax,
            totalAmount: inv.amount_total,
            status: 'Emitido',
            paymentState: inv.payment_state === 'paid' ? 'Pagado' : 'No Pagado'
        }));

    } catch (e) {
        console.error("Error fetching detailed sales:", e);
        return [];
    }
};

export const fetchOdooInventory = async (connection: OdooConnection): Promise<InventoryItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [
            { id: '1', sku: 'PRD-001', name: 'Paracetamol 500mg', stock: 120, avgDailySales: 15, daysRemaining: 8, status: 'Healthy', category: 'Farmacia', cost: 0.5, totalValue: 60 },
            { id: '2', sku: 'PRD-002', name: 'Amoxicilina 250mg', stock: 5, avgDailySales: 2, daysRemaining: 2, status: 'Critical', category: 'Farmacia', cost: 1.2, totalValue: 6 },
        ]
    }
  
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    const products = await client.searchRead(
        uid,
        connection.apiKey,
        'product.product',
        [['type', '=', 'product']], 
        ['name', 'default_code', 'qty_available', 'categ_id', 'standard_price'], 
        { limit: 50, order: 'qty_available asc' }
    );
    
    return products.map((item: any) => {
        const stock = item.qty_available || 0;
        const cost = item.standard_price || 0;
        let status: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
        
        if (stock <= 5) status = 'Critical';
        else if (stock <= 15) status = 'Warning';

        return {
            id: item.id.toString(),
            sku: item.default_code || 'S/C',
            name: item.name,
            stock: stock,
            avgDailySales: 0,
            daysRemaining: 0,
            status: status,
            category: Array.isArray(item.categ_id) ? item.categ_id[1] : 'General',
            cost: cost,
            totalValue: stock * cost
        };
    });

  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

export const fetchOdooAppointments = async (connection: OdooConnection): Promise<CalendarEvent[]> => {
    return [];
};
