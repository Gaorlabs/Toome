
import { OdooConnection, CalendarEvent, OdooCompany, SalesData, InventoryItem, BranchKPI, PosConfig, SalesRegisterItem, CashClosingReport, PaymentMethodSummary, DateRange, PaymentSummary, DailyProductSummary, DocumentTypeSummary } from '../types';
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
 * Helper para generar condiciones de fecha SQL-like para Odoo
 */
const getDateConditions = (dateField: string, startDate: string, endDate: string, isDatetime: boolean): any[][] => {
    let start = startDate;
    let end = endDate;

    if (isDatetime) {
        if (!start.includes(' ')) start += ' 00:00:00';
        if (!end.includes(' ')) end += ' 23:59:59';
    }

    return [
        [dateField, '>=', start],
        [dateField, '<=', end]
    ];
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
    documentTypes: DocumentTypeSummary[]
}> => {
  
  // ==================================================================================
  // MOCK DATA (Simulación para pruebas)
  // ==================================================================================
  if (connection.connectionMode === 'MOCK') {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const baseDailySales = 1500; 
      const totalSalesCalc = baseDailySales * diffDays;
      const totalItemsCalc = Math.floor(totalSalesCalc / 45); 

      const salesData: SalesData[] = [];
      if (startDate === endDate) {
          salesData.push(
            { date: '09:00', sales: baseDailySales * 0.1, margin: baseDailySales * 0.03, transactions: 2 },
            { date: '13:00', sales: baseDailySales * 0.3, margin: baseDailySales * 0.09, transactions: 6 },
            { date: '18:00', sales: baseDailySales * 0.6, margin: baseDailySales * 0.18, transactions: 12 },
          );
      } else {
           salesData.push(
              { date: startDate, sales: baseDailySales, margin: baseDailySales * 0.3, transactions: Math.floor(baseDailySales/45) },
              { date: endDate, sales: baseDailySales * 0.9, margin: (baseDailySales*0.9) * 0.3, transactions: Math.floor((baseDailySales*0.9)/45) },
           );
      }

      const mockProducts = [
          { id: '1', name: 'Paracetamol 500mg', qty: 20 * diffDays, total: 40 * diffDays },
          { id: '2', name: 'Ibuprofeno 400mg', qty: 15 * diffDays, total: 60 * diffDays }
      ];

      return {
          salesData,
          branches: [
              { 
                  id: '1', name: 'Caja Principal (Mock)', sales: totalSalesCalc, margin: totalSalesCalc * 0.3, target: 5000 * diffDays, profitability: 30.0, status: 'OPEN', transactionCount: totalItemsCalc, cashier: 'Demo User',
                  topProducts: mockProducts,
                  payments: [{ name: 'Efectivo', amount: totalSalesCalc * 0.6, count: 10 }, { name: 'Visa', amount: totalSalesCalc * 0.4, count: 5 }]
              }
          ],
          totalSales: totalSalesCalc,
          totalMargin: totalSalesCalc * 0.3,
          totalItems: totalItemsCalc,
          paymentMethods: [{ name: 'Efectivo', amount: totalSalesCalc * 0.6, count: 10 }, { name: 'Yape', amount: totalSalesCalc * 0.4, count: 8 }],
          topProducts: mockProducts,
          documentTypes: [{ type: 'Boleta', count: totalItemsCalc, total: totalSalesCalc }]
      };
  }
  
  // ==================================================================================
  // REAL DATA FETCHING
  // ==================================================================================
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);
    
    // BUILD CONTEXT
    const context: any = {};
    if (allowedCompanyIds && allowedCompanyIds.length > 0) {
        const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
        context.allowed_company_ids = compIdsInt;
    }

    // --- 1. CONFIGURACIÓN INICIAL ---
    let branchesMap: Record<string, BranchKPI> = {};
    let configIds: number[] = [];

    // Filtros de Cajas
    let configDomain: any[] = [];
    if (allowedPosIds && allowedPosIds.length > 0) {
        configDomain.push(['id', 'in', allowedPosIds] as any);
    } else if (allowedCompanyIds && allowedCompanyIds.length > 0) {
        const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
        configDomain.push(['company_id', 'in', compIdsInt] as any);
    }
    
    try {
        const configs = await client.searchRead(uid, connection.apiKey, 'pos.config', configDomain, ['id', 'name'], { context });
        if (Array.isArray(configs)) {
            configIds = configs.map((c: any) => c.id);
            configs.forEach((cfg: any) => {
                branchesMap[cfg.id] = {
                    id: cfg.id.toString(),
                    name: cfg.name,
                    sales: 0, margin: 0, target: 0, profitability: 0, status: 'CLOSED', transactionCount: 0, cashier: '---',
                    topProducts: [],
                    payments: []
                };
            });
        }
    } catch (e) {
        console.error("Critical: Failed to load POS Configs", e);
    }

    const dateStartStr = startDate + ' 00:00:00';
    const dateEndStr = endDate + ' 23:59:59';
    const validStates = ['paid', 'done', 'invoiced'];

    // --- 2. GLOBAL PAYMENTS ---
    let globalPayments: PaymentSummary[] = [];
    try {
        const paymentDomain: any[] = [
            ['payment_date', '>=', dateStartStr],
            ['payment_date', '<=', dateEndStr],
            ['pos_order_id.state', 'in', validStates]
        ];
        
        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
             const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
             paymentDomain.push(['pos_order_id.company_id', 'in', compIdsInt] as any);
        } else if (configIds.length > 0) {
            paymentDomain.push(['pos_order_id.config_id', 'in', configIds] as any);
        }

        const paymentGroups = await client.readGroup(
            uid, connection.apiKey,
            'pos.payment',
            paymentDomain,
            ['amount', 'payment_method_id'],
            ['payment_method_id'],
            { context }
        );

        if (Array.isArray(paymentGroups)) {
             globalPayments = paymentGroups.map((pg: any) => ({
                name: Array.isArray(pg.payment_method_id) ? pg.payment_method_id[1] : 'Otros',
                amount: pg.amount || 0,
                count: pg.payment_method_id_count || 0
             })).sort((a: any, b: any) => b.amount - a.amount);
        }
    } catch (e) {
        console.warn("Error loading global payments:", e);
    }

    // --- 3. CHART & TOTALS ---
    let totalSales = 0;
    let totalItems = 0;
    let salesData: SalesData[] = [];

    try {
        const orderDomain: any[] = [
            ['state', 'in', validStates],
            ['date_order', '>=', dateStartStr],
            ['date_order', '<=', dateEndStr]
        ];
        
        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
             const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
             orderDomain.push(['company_id', 'in', compIdsInt] as any);
        } else if (configIds.length > 0) {
            orderDomain.push(['config_id', 'in', configIds] as any);
        }

        // B. Timeline Data for Chart
        const salesByDateGroups = await client.readGroup(
            uid, connection.apiKey, 
            'pos.order',
            orderDomain,
            ['amount_total', 'date_order'], 
            ['date_order:day'], // Standard Odoo grouping
            { context } 
        );
        
        if (Array.isArray(salesByDateGroups)) {
            salesData = salesByDateGroups.map((group: any) => ({
                date: group['date_order:day'] || group['date_order'] || 'N/A', // Fallback key
                sales: group.amount_total || 0,
                margin: (group.amount_total || 0) * 0.3,
                transactions: group.date_order_count || 0
            })).sort((a: any, b: any) => a.date.localeCompare(b.date));
        }

        // Recalculate global totals from timeline to ensure consistency
        totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
        totalItems = salesData.reduce((sum, d) => sum + d.transactions, 0);

    } catch (e) {
        console.warn("Partial Error: Failed to load sales timeline", e);
    }

    // --- 4. GLOBAL TOP PRODUCTS ---
    let globalTopProducts: DailyProductSummary[] = [];
    try {
        const productDomain: any[] = [
             ['order_id.date_order', '>=', dateStartStr],
             ['order_id.date_order', '<=', dateEndStr],
             ['order_id.state', 'in', validStates]
        ];
        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
             const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
             productDomain.push(['order_id.company_id', 'in', compIdsInt] as any);
        } else if (configIds.length > 0) {
             productDomain.push(['order_id.config_id', 'in', configIds] as any);
        }

        const productGroups = await client.readGroup(
            uid, connection.apiKey,
            'pos.order.line',
            productDomain,
            ['price_subtotal_incl', 'qty', 'product_id'], 
            ['product_id'], 
            { limit: 5, orderby: 'price_subtotal_incl desc', context } 
        );

        if (Array.isArray(productGroups)) {
             globalTopProducts = productGroups.map((pg: any) => ({
                id: Array.isArray(pg.product_id) ? pg.product_id[0] : '0',
                name: Array.isArray(pg.product_id) ? pg.product_id[1] : 'Producto Desconocido',
                qty: pg.qty || 0,
                total: pg.price_subtotal_incl || 0
             })).sort((a: any, b: any) => b.total - a.total);
        }

    } catch (e) {
        console.warn("Error loading global products:", e);
    }

    // --- 5. DETAILED BOX INFO (Loop Infalible) ---
    // Here we fetch total sales specifically for each box to fix "S/ 0" issue
    const detailPromises = configIds.map(async (confId: number) => {
         if (!branchesMap[confId]) return;

         try {
             // 5.1 FETCH BOX SALES TOTAL (The Fix)
             const boxTotalDomain = [
                 ['date_order', '>=', dateStartStr],
                 ['date_order', '<=', dateEndStr],
                 ['state', 'in', validStates],
                 ['config_id', '=', confId]
             ];
             
             const boxStats = await client.readGroup(
                uid, connection.apiKey, 'pos.order',
                boxTotalDomain,
                ['amount_total'],
                [], // No grouping, just sum
                { context }
             );

             if (boxStats && boxStats.length > 0) {
                 branchesMap[confId].sales = boxStats[0].amount_total || 0;
                 branchesMap[confId].transactionCount = boxStats[0].amount_total_count || boxStats[0].__count || 0;
                 branchesMap[confId].margin = branchesMap[confId].sales * 0.30; 
                 branchesMap[confId].profitability = branchesMap[confId].sales > 0 ? 30.0 : 0;
             }

             // 5.2 Top Products per Box
             const boxProductDomain = [
                 ['order_id.date_order', '>=', dateStartStr],
                 ['order_id.date_order', '<=', dateEndStr],
                 ['order_id.state', 'in', validStates],
                 ['order_id.config_id', '=', confId]
             ];
             
             const productGroups = await client.readGroup(
                uid, connection.apiKey,
                'pos.order.line',
                boxProductDomain,
                ['price_subtotal_incl', 'qty', 'product_id'], 
                ['product_id'], 
                { limit: 5, orderby: 'price_subtotal_incl desc', context } 
             );
             
             if (Array.isArray(productGroups)) {
                 branchesMap[confId].topProducts = productGroups.map((pg: any) => ({
                    id: Array.isArray(pg.product_id) ? pg.product_id[0] : '0',
                    name: Array.isArray(pg.product_id) ? pg.product_id[1] : 'Producto Desconocido',
                    qty: pg.qty || 0,
                    total: pg.price_subtotal_incl || 0
                 })).sort((a: any, b: any) => b.total - a.total);
             }
             
             // 5.3 Box Specific Payments
             const boxPaymentDomain = [
                ['payment_date', '>=', dateStartStr],
                ['payment_date', '<=', dateEndStr],
                ['pos_order_id.config_id', '=', confId],
                ['pos_order_id.state', 'in', validStates]
             ];

             const paymentGroups = await client.readGroup(
                uid, connection.apiKey,
                'pos.payment',
                boxPaymentDomain,
                ['amount', 'payment_method_id'],
                ['payment_method_id'],
                { context }
             );

             if (Array.isArray(paymentGroups)) {
                 branchesMap[confId].payments = paymentGroups.map((pg: any) => ({
                    name: Array.isArray(pg.payment_method_id) ? pg.payment_method_id[1] : 'Otros',
                    amount: pg.amount || 0,
                    count: pg.payment_method_id_count || 0
                 })).sort((a: any, b: any) => b.amount - a.amount);
             }

         } catch (e) {
             console.warn(`Error loading details for box ${confId}`, e);
         }
         
         // 5.4 Status Check
         try {
             const activeSession = await client.searchRead(
                 uid, connection.apiKey, 'pos.session',
                 [['config_id', '=', confId], ['state', '!=', 'closed']],
                 ['user_id', 'state'],
                 { limit: 1, context }
             );
             
             if (activeSession && activeSession.length > 0) {
                 const sess = activeSession[0];
                 branchesMap[confId].status = (sess.state === 'opened' || sess.state === 'opening_control') ? 'OPEN' : 'CLOSING_CONTROL';
                 branchesMap[confId].cashier = Array.isArray(sess.user_id) ? sess.user_id[1] : 'Usuario';
             }
         } catch (e) { /* ignore */ }
    });

    await Promise.all(detailPromises);


    // --- 6. DOCUMENT TYPES (Invoices) ---
    let documentTypes: DocumentTypeSummary[] = [];
    try {
        const invoiceDomain: any[] = [
            ['invoice_date', '>=', startDate],
            ['invoice_date', '<=', endDate],
            ['move_type', 'in', ['out_invoice', 'out_refund']], 
            ['state', '=', 'posted']
        ];
        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
             const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
             invoiceDomain.push(['company_id', 'in', compIdsInt] as any);
        }

        const docGroups = await client.readGroup(uid, connection.apiKey, 'account.move', invoiceDomain, ['amount_total', 'move_type'], ['move_type'], { context });
        
        if (Array.isArray(docGroups)) {
            documentTypes = docGroups.map((dg: any) => {
                let type: any = 'Factura';
                if (dg.move_type === 'out_refund') type = 'Nota Crédito';
                return { type: type, count: dg.move_type_count || 0, total: dg.amount_total || 0 };
            });
        }
    } catch (e) {
        console.warn("Failed to load invoices", e);
    }

    const totalInvoiced = documentTypes.reduce((acc, curr) => acc + curr.total, 0);
    const totalReceipts = Math.max(0, totalSales - totalInvoiced);
    
    if (totalReceipts > 0) {
        documentTypes.push({
            type: 'Ticket/Int',
            count: Math.max(0, totalItems - documentTypes.reduce((acc, curr) => acc + curr.count, 0)),
            total: totalReceipts
        });
    }

    return {
        salesData,
        branches: Object.values(branchesMap),
        totalSales,
        totalMargin: totalSales * 0.3,
        totalItems,
        paymentMethods: globalPayments, // Use the directly queried global payments
        topProducts: globalTopProducts, // Use the directly queried global products
        documentTypes
    };

  } catch (error) {
    console.error("Fatal Error fetching real time data:", error);
    return { salesData: [], branches: [], totalSales: 0, totalMargin: 0, totalItems: 0, paymentMethods: [], topProducts: [], documentTypes: [] };
  }
};

// ADDED MISSING EXPORT
export const fetchOdooAppointments = async (connection: OdooConnection): Promise<CalendarEvent[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);

        const events = await client.searchRead(
            uid,
            connection.apiKey,
            'calendar.event',
            [], 
            ['name', 'start', 'stop', 'location', 'description', 'state', 'partner_ids'],
            { limit: 100, order: 'start desc' }
        );

        if (!Array.isArray(events)) return [];

        return events.map((ev: any) => ({
            id: ev.id,
            title: ev.name || 'Sin título',
            start: ev.start,
            end: ev.stop,
            location: ev.location || '',
            description: ev.description || '',
            attendees: Array.isArray(ev.partner_ids) ? `${ev.partner_ids.length} asistentes` : undefined,
            status: 'confirmed'
        }));

    } catch (e) {
        console.error("Error fetching appointments:", e);
        return [];
    }
};

// ADDED MISSING EXPORT
export const fetchSalesRegister = async (
    connection: OdooConnection,
    startDate: string,
    endDate: string,
    allowedCompanyIds?: string[]
): Promise<SalesRegisterItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [
            {
                id: '1', date: startDate, documentType: 'Factura', series: 'F001', number: '0000123',
                clientName: 'Cliente Mock', clientDocType: 'RUC', clientDocNum: '20123456789',
                currency: 'PEN', baseAmount: 100, igvAmount: 18, totalAmount: 118,
                status: 'Emitido', paymentState: 'Pagado'
            }
        ];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
        // BUILD CONTEXT: Ensure we can read data from all allowed companies
        const context: any = {};
        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
            const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
            context.allowed_company_ids = compIdsInt;
        }

        const domain: any[] = [
            ['invoice_date', '>=', startDate],
            ['invoice_date', '<=', endDate],
            ['move_type', 'in', ['out_invoice', 'out_refund']], 
            ['state', '!=', 'draft'] 
        ];

        if (allowedCompanyIds && allowedCompanyIds.length > 0) {
            const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
            domain.push(['company_id', 'in', compIdsInt] as any);
        }

        const moves = await client.searchRead(
            uid,
            connection.apiKey,
            'account.move',
            domain,
            ['id', 'invoice_date', 'move_type', 'name', 'partner_id', 'currency_id', 'amount_untaxed', 'amount_tax', 'amount_total', 'state', 'payment_state'],
            { limit: 500, order: 'invoice_date desc', context }
        );

        if (!Array.isArray(moves)) return [];

        return moves.map((m: any) => {
            let docType: any = 'Factura';
            if (m.move_type === 'out_refund') docType = 'Nota Crédito';
            else if (m.name && m.name.startsWith('B')) docType = 'Boleta'; 

            const nameParts = m.name ? m.name.split('-') : ['000', '000'];
            const series = nameParts.length > 1 ? nameParts[0] : '000';
            const number = nameParts.length > 1 ? nameParts[1] : m.name;

            return {
                id: m.id.toString(),
                date: m.invoice_date,
                documentType: docType,
                series: series,
                number: number,
                clientName: Array.isArray(m.partner_id) ? m.partner_id[1] : 'Cliente Varios',
                clientDocType: 'RUC', 
                clientDocNum: '---', 
                currency: Array.isArray(m.currency_id) ? m.currency_id[1] : 'PEN',
                baseAmount: m.amount_untaxed || 0,
                igvAmount: m.amount_tax || 0,
                totalAmount: m.amount_total || 0,
                status: m.state === 'posted' ? 'Emitido' : 'Anulado',
                paymentState: m.payment_state === 'paid' ? 'Pagado' : 'No Pagado'
            };
        });

    } catch (e) {
        console.error("Error fetching sales register:", e);
        return [];
    }
}
