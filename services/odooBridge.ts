
import { OdooConnection, CalendarEvent, OdooCompany, SalesData, InventoryItem, BranchKPI, PosConfig, SalesRegisterItem, CashClosingReport, PaymentMethodSummary } from '../types';
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
 * Genera el filtro de fecha corregido para evitar problemas de zona horaria.
 */
const getDateDomain = (period: 'HOY' | 'MES' | 'AÑO', dateField: string, isDatetime: boolean) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    let dateStr = '';

    if (period === 'HOY') {
        // Enviar formato Datetime explícito para inicio de día.
        // Odoo interpretará esto en su contexto, pero ayuda a filtrar.
        dateStr = `${y}-${m}-${d} 00:00:00`;
    } else if (period === 'MES') {
        dateStr = `${y}-${m}-01 00:00:00`;
    } else if (period === 'AÑO') {
        dateStr = `${y}-01-01 00:00:00`;
    }

    return [dateField, '>=', dateStr];
};

/**
 * DATOS EN TIEMPO REAL - CORAZÓN DEL SISTEMA
 * 1. Obtiene las cajas permitidas.
 * 2. Consulta pos.session para saber estado REAL (Abierto/Cerrado) y cajero actual.
 * 3. Consulta pos.order para sumar ventas.
 */
export const fetchOdooRealTimeData = async (
    connection: OdooConnection, 
    allowedCompanyIds?: string[],
    allowedPosIds?: number[],
    period: 'HOY' | 'MES' | 'AÑO' = 'MES'
): Promise<{
    salesData: SalesData[],
    branches: BranchKPI[],
    totalSales: number,
    totalMargin: number,
    totalItems: number
}> => {
  
  // MOCK DATA
  if (connection.connectionMode === 'MOCK') {
      const multiplier = period === 'AÑO' ? 12 : period === 'MES' ? 4 : 1;
      return {
          salesData: [
              { date: '2025-01-20', sales: 1200 * multiplier, margin: 400 * multiplier, transactions: 15 },
              { date: '2025-01-24', sales: 2830 * multiplier, margin: 950 * multiplier, transactions: 35 },
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
    // Si no hay filtro de ID, traer todas las cajas activas.
    let configDomain: any[] = [];
    if (allowedPosIds && allowedPosIds.length > 0) {
        configDomain.push(['id', 'in', allowedPosIds]);
    } else if (allowedCompanyIds && allowedCompanyIds.length > 0) {
        const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
        configDomain.push(['company_id', 'in', compIdsInt]);
    }

    // Obtenemos los nombres de las cajas primero para inicializar el mapa
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
    // Consultamos pos.session para ver quién está logueado y si está abierto
    const sessionDomain = [
        ['state', '!=', 'closed'], // Solo sesiones activas o cerrando
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
    const dateDomain = getDateDomain(period, 'date_order', true);
    const orderDomain: any[] = [
        ['state', 'in', ['paid', 'done', 'invoiced']],
        dateDomain,
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

    // Calcular márgenes estimados
    Object.values(branchesMap).forEach(b => {
        b.margin = b.sales * 0.30; // Estimado 30%
        b.profitability = 30.0;
    });

    const totalMargin = totalSales * 0.30;
    const salesData: SalesData[] = Object.entries(salesByDate).map(([date, sales]) => ({
        date,
        sales,
        margin: sales * 0.30,
        transactions: 0
    }));

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
 * Se conecta a account.move para obtener el detalle contable
 */
export const fetchSalesRegister = async (
    connection: OdooConnection, 
    period: 'HOY' | 'MES' | 'AÑO' = 'MES',
    allowedCompanyIds?: string[]
): Promise<SalesRegisterItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        const multiplier = period === 'AÑO' ? 10 : 1;
        // Mock simple data array logic...
        return [
             { id: '1', date: '2025-01-25', documentType: 'Factura', series: 'F001', number: '000459', clientName: 'DISTRIBUIDORA DEL SUR SAC', clientDocType: 'RUC', clientDocNum: '20556789123', currency: 'PEN', baseAmount: 1000.00, igvAmount: 180.00, totalAmount: 1180.00, status: 'Emitido', paymentState: 'Pagado' },
            { id: '2', date: '2025-01-25', documentType: 'Boleta', series: 'B001', number: '002301', clientName: 'JUAN PEREZ', clientDocType: 'DNI', clientDocNum: '45678912', currency: 'PEN', baseAmount: 50.00, igvAmount: 9.00, totalAmount: 59.00, status: 'Emitido', paymentState: 'Pagado' },
        ];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);

        // Build Domain (invoice_date is Date, NOT Datetime)
        const dateDomain = getDateDomain(period, 'invoice_date', false);
        const domain: any[] = [
            ['move_type', 'in', ['out_invoice', 'out_refund']], // Facturas y Notas de Crédito de Cliente
            ['state', '=', 'posted'],
            dateDomain
        ];

        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
            const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
            if (compIdsInt.length > 0) {
                domain.push(['company_id', 'in', compIdsInt]);
            }
        }

        // Fetch Invoices
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
        ['name', 'default_code', 'qty_available', 'categ_id', 'standard_price'], // standard_price is Cost
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
