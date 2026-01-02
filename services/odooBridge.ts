
import { OdooConnection, CalendarEvent, OdooCompany, SalesData, InventoryItem, BranchKPI, PosConfig, SalesRegisterItem, CashClosingReport, PaymentMethodSummary, DateRange, PaymentSummary, DailyProductSummary, DocumentTypeSummary, Employee } from '../types';
import { OdooClient } from './OdooRpcClient';
import { MOCK_INVENTORY } from '../constants';

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
  
  if (connection.connectionMode === 'MOCK') {
      // ... (Mock data logic remains same as before)
      return {
          salesData: [],
          branches: [],
          totalSales: 0,
          totalMargin: 0,
          totalItems: 0,
          paymentMethods: [],
          topProducts: [],
          documentTypes: []
      };
  }
  
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

    // --- 3. CHART & TOTALS (Robust Manual Aggregation) ---
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

        const rawOrders = await client.searchRead(
            uid, connection.apiKey,
            'pos.order',
            orderDomain,
            ['amount_total', 'date_order'],
            { context, limit: 5000 }
        );
        
        if (Array.isArray(rawOrders)) {
            const dailyMap: Record<string, { sales: number, count: number }> = {};
            
            rawOrders.forEach((order: any) => {
                const date = order.date_order ? order.date_order.split(' ')[0] : 'Unknown';
                if (!dailyMap[date]) dailyMap[date] = { sales: 0, count: 0 };
                
                dailyMap[date].sales += (order.amount_total || 0);
                dailyMap[date].count += 1;
                
                totalSales += (order.amount_total || 0);
                totalItems += 1;
            });

            salesData = Object.entries(dailyMap).map(([date, stats]) => ({
                date: date,
                sales: stats.sales,
                margin: stats.sales * 0.3, 
                transactions: stats.count
            })).sort((a, b) => a.date.localeCompare(b.date));
        }

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
    const detailPromises = configIds.map(async (confId: number) => {
         if (!branchesMap[confId]) return;

         try {
             // 5.1 FETCH BOX SALES TOTAL (MANUAL SUM FIX)
             const boxTotalDomain = [
                 ['date_order', '>=', dateStartStr],
                 ['date_order', '<=', dateEndStr],
                 ['state', 'in', validStates],
                 ['config_id', '=', confId]
             ];
             
             const boxOrders = await client.searchRead(
                uid, connection.apiKey, 'pos.order',
                boxTotalDomain,
                ['amount_total'], 
                { context }
             );

             if (Array.isArray(boxOrders)) {
                 const boxSum = boxOrders.reduce((sum, order: any) => sum + (order.amount_total || 0), 0);
                 const boxCount = boxOrders.length;
                 
                 branchesMap[confId].sales = boxSum;
                 branchesMap[confId].transactionCount = boxCount;
                 branchesMap[confId].margin = boxSum * 0.30; 
                 branchesMap[confId].profitability = boxSum > 0 ? 30.0 : 0;
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

export const fetchSalesRegister = async (
    connection: OdooConnection,
    startDate: string,
    endDate: string,
    allowedCompanyIds?: string[]
): Promise<SalesRegisterItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
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

// ==========================================
// REPORT FETCHERS
// ==========================================

export const fetchInventoryValuation = async (connection: OdooConnection, allowedCompanyIds?: string[]) => {
    if (connection.connectionMode === 'MOCK') return [];
    
    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        
        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);
        
        const products = await client.searchRead(
            uid, connection.apiKey, 
            'product.product', 
            [['type', '=', 'product']], 
            ['name', 'default_code', 'qty_available', 'standard_price', 'categ_id'],
            { context, limit: 1000 }
        );
        
        if (!Array.isArray(products)) return [];
        
        return products.map((p: any) => ({
            name: p.name,
            sku: p.default_code || '-',
            category: Array.isArray(p.categ_id) ? p.categ_id[1] : '-',
            qty: p.qty_available || 0,
            cost: p.standard_price || 0,
            totalValue: (p.qty_available || 0) * (p.standard_price || 0)
        }));
    } catch (e) {
        console.error("Fetch Inventory Error", e);
        return [];
    }
};

export const fetchAccountsReceivable = async (connection: OdooConnection, allowedCompanyIds?: string[]) => {
    if (connection.connectionMode === 'MOCK') return [];

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);

        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);

        const domain: any[] = [
            ['move_type', '=', 'out_invoice'],
            ['state', '=', 'posted'],
            ['payment_state', 'in', ['not_paid', 'partial']]
        ];

        if (allowedCompanyIds) domain.push(['company_id', 'in', allowedCompanyIds.map(Number)]);

        const invoices = await client.searchRead(
            uid, connection.apiKey,
            'account.move',
            domain,
            ['name', 'invoice_date', 'invoice_date_due', 'partner_id', 'amount_residual', 'currency_id'],
            { context, limit: 500 }
        );

        if (!Array.isArray(invoices)) return [];

        return invoices.map((inv: any) => ({
            number: inv.name,
            date: inv.invoice_date,
            dueDate: inv.invoice_date_due,
            client: Array.isArray(inv.partner_id) ? inv.partner_id[1] : '-',
            amountDue: inv.amount_residual || 0,
            currency: Array.isArray(inv.currency_id) ? inv.currency_id[1] : ''
        }));
    } catch (e) {
        console.error("Fetch Receivables Error", e);
        return [];
    }
};

export const fetchCashClosingReport = async (connection: OdooConnection, startDate: string, endDate: string, allowedCompanyIds?: string[]) => {
    if (connection.connectionMode === 'MOCK') return [];

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);

        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);

        const domain: any[] = [
            ['stop_at', '>=', startDate + ' 00:00:00'],
            ['stop_at', '<=', endDate + ' 23:59:59'],
            ['state', '=', 'closed']
        ];
        if (allowedCompanyIds) domain.push(['config_id.company_id', 'in', allowedCompanyIds.map(Number)]);

        const sessions = await client.searchRead(
            uid, connection.apiKey,
            'pos.session',
            domain,
            ['name', 'config_id', 'user_id', 'start_at', 'stop_at', 'cash_register_balance_start', 'cash_register_balance_end_real', 'cash_register_difference'],
            { context, limit: 500 }
        );

        if (!Array.isArray(sessions)) return [];

        return sessions.map((sess: any) => ({
            session: sess.name,
            pos: Array.isArray(sess.config_id) ? sess.config_id[1] : '-',
            cashier: Array.isArray(sess.user_id) ? sess.user_id[1] : '-',
            openedAt: sess.start_at,
            closedAt: sess.stop_at,
            startBalance: sess.cash_register_balance_start || 0,
            endBalance: sess.cash_register_balance_end_real || 0,
            difference: sess.cash_register_difference || 0
        }));

    } catch (e) {
        console.error("Fetch Cash Closing Error", e);
        return [];
    }
};

export const fetchPaymentAnalysis = async (connection: OdooConnection, startDate: string, endDate: string, allowedCompanyIds?: string[]) => {
    if (connection.connectionMode === 'MOCK') return [];

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);

        const domain: any[] = [
             ['payment_date', '>=', startDate],
             ['payment_date', '<=', endDate]
        ];
        if (allowedCompanyIds) domain.push(['pos_order_id.company_id', 'in', allowedCompanyIds.map(Number)]);

        const payments = await client.searchRead(
            uid, connection.apiKey,
            'pos.payment',
            domain,
            ['payment_date', 'pos_order_id', 'payment_method_id', 'amount'],
            { context, limit: 1000 }
        );

        if (!Array.isArray(payments)) return [];

        return payments.map((p: any) => ({
            date: p.payment_date,
            order: Array.isArray(p.pos_order_id) ? p.pos_order_id[1] : '-',
            method: Array.isArray(p.payment_method_id) ? p.payment_method_id[1] : '-',
            amount: p.amount || 0
        }));
    } catch (e) {
        console.error("Fetch Payment Analysis Error", e);
        return [];
    }
};

export const fetchProductProfitabilityReport = async (connection: OdooConnection, startDate: string, endDate: string, allowedCompanyIds?: string[]) => {
    if (connection.connectionMode === 'MOCK') return [];

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);

        // 1. Fetch Sales Lines aggregated by Product
        const domain: any[] = [
            ['order_id.date_order', '>=', startDate + ' 00:00:00'],
            ['order_id.date_order', '<=', endDate + ' 23:59:59'],
            ['order_id.state', 'in', ['paid', 'done', 'invoiced']]
        ];
        if (allowedCompanyIds) domain.push(['order_id.company_id', 'in', allowedCompanyIds.map(Number)]);

        const groups = await client.readGroup(
            uid, connection.apiKey,
            'pos.order.line',
            domain,
            ['product_id', 'price_subtotal', 'qty'],
            ['product_id'],
            { context }
        );

        if (!Array.isArray(groups)) return [];

        // 2. Extract Product IDs to fetch costs
        const productIds = groups.map((g: any) => Array.isArray(g.product_id) ? g.product_id[0] : null).filter(Boolean);
        
        if (productIds.length === 0) return [];

        // 3. Fetch Product Costs
        const products = await client.searchRead(
            uid, connection.apiKey,
            'product.product',
            [['id', 'in', productIds as any]],
            ['standard_price'],
            { context }
        );
        
        const costMap: Record<number, number> = {};
        if (Array.isArray(products)) {
            products.forEach((p: any) => costMap[p.id] = p.standard_price || 0);
        }

        // 4. Merge
        return groups.map((g: any) => {
            const prodId = Array.isArray(g.product_id) ? g.product_id[0] : 0;
            const prodName = Array.isArray(g.product_id) ? g.product_id[1] : 'Unknown';
            const qty = g.qty || 0;
            const sales = g.price_subtotal || 0;
            const unitCost = costMap[prodId] || 0;
            const totalCost = unitCost * qty;
            const margin = sales - totalCost;
            const marginPct = sales > 0 ? (margin / sales) * 100 : 0;

            return {
                product: prodName,
                qty: qty,
                sales: sales,
                totalCost: totalCost,
                margin: margin,
                marginPct: marginPct.toFixed(2) + '%'
            };
        });

    } catch (e) {
        console.error("Fetch Product Profitability Error", e);
        return [];
    }
};

export const fetchInventoryWithAlerts = async (connection: OdooConnection, allowedCompanyIds?: string[]): Promise<InventoryItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        return MOCK_INVENTORY;
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);

        // 1. Fetch Products (Storable only)
        const products = await client.searchRead(
            uid, connection.apiKey,
            'product.product',
            [['type', '=', 'product']], // Storable products
            ['name', 'default_code', 'categ_id', 'qty_available', 'standard_price'],
            { context, limit: 2000 }
        );

        if (!Array.isArray(products)) return [];

        // 2. Fetch Sales stats (Last 30 days) to calculate run rate
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const salesDomain: any[] = [
            ['order_id.date_order', '>=', dateStr],
            ['order_id.state', 'in', ['paid', 'done', 'invoiced']]
        ];
        if (allowedCompanyIds) salesDomain.push(['order_id.company_id', 'in', allowedCompanyIds.map(Number)] as any);

        // Try reading sales stats. Use simple loop if read_group fails or just skip sales info if not possible
        let salesMap: Record<number, number> = {};
        try {
            const salesStats = await client.readGroup(
                uid, connection.apiKey,
                'pos.order.line',
                salesDomain,
                ['product_id', 'qty'],
                ['product_id'],
                { context }
            );

            if (Array.isArray(salesStats)) {
                salesStats.forEach((stat: any) => {
                    const pid = Array.isArray(stat.product_id) ? stat.product_id[0] : 0;
                    if (pid) salesMap[pid] = stat.qty || 0;
                });
            }
        } catch (e) {
            console.warn("Failed to fetch POS sales for inventory forecast, skipping logic...", e);
        }

        // 3. Merge and Transform with DAYS OF INVENTORY LOGIC
        return products.map((p: any) => {
            const stock = p.qty_available || 0;
            const sold30 = salesMap[p.id] || 0;
            const avgDailySales = sold30 / 30; // Promedio diario
            
            let daysRemaining = 999;
            if (avgDailySales > 0) {
                daysRemaining = stock / avgDailySales;
            }

            // --- LÓGICA AUTOMATIZADA POR ROTACIÓN ---
            // Si rota mucho (vende mucho), el día de inventario es más crítico.
            // Critical: Stock cubre menos de 5 días.
            // Warning: Stock cubre menos de 15 días.
            
            let status: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
            
            if (daysRemaining <= 5 && avgDailySales > 0) {
                status = 'Critical';
            } else if (daysRemaining <= 15 && avgDailySales > 0) {
                status = 'Warning';
            }

            // Edge Case: Si stock es 0 y se ha vendido en el pasado reciente
            if (stock <= 0 && avgDailySales > 0) status = 'Critical';

            return {
                id: p.id.toString(),
                sku: p.default_code || 'S/N',
                name: p.name,
                category: Array.isArray(p.categ_id) ? String(p.categ_id[1]) : '-',
                stock: stock,
                avgDailySales: parseFloat(avgDailySales.toFixed(2)),
                daysRemaining: parseFloat(daysRemaining.toFixed(1)),
                status: status,
                cost: p.standard_price || 0,
                totalValue: stock * (p.standard_price || 0)
            };
        }).sort((a, b) => {
            // Ordenar por prioridad: Critical -> Warning -> Healthy
            const scoreA = a.status === 'Critical' ? 3 : a.status === 'Warning' ? 2 : 1;
            const scoreB = b.status === 'Critical' ? 3 : b.status === 'Warning' ? 2 : 1;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.daysRemaining - b.daysRemaining; // Luego por menos días restantes
        });

    } catch (e) {
        console.error("Fetch Inventory Alerts Alert", e);
        return [];
    }
};

export const fetchEmployees = async (connection: OdooConnection, allowedCompanyIds?: string[]): Promise<Employee[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [
            { id: '1', name: 'Juan Perez', jobTitle: 'Cajero Principal', department: 'Ventas', status: 'active', workEmail: 'juan@toome.com', identificationId: '12345678', workPhone: '999888777', currentPos: 'Caja Principal' },
            { id: '2', name: 'Maria Gomez', jobTitle: 'Vendedora', department: 'Piso', status: 'active', workEmail: 'maria@toome.com', identificationId: '87654321' },
            { id: '3', name: 'Carlos Ruiz', jobTitle: 'Almacenero', department: 'Logística', status: 'active' },
            { id: '4', name: 'Ana Lopez', jobTitle: 'Supervisora', department: 'Administración', status: 'active' }
        ];
    }

    try {
        const client = getClient(connection);
        const uid = await client.authenticate(connection.user, connection.apiKey);
        const context: any = {};
        if (allowedCompanyIds) context.allowed_company_ids = allowedCompanyIds.map(Number);

        // 1. Fetch Employees
        const employees = await client.searchRead(
            uid, connection.apiKey,
            'hr.employee',
            [],
            ['name', 'job_title', 'department_id', 'work_email', 'work_phone', 'identification_id', 'birthday', 'gender', 'user_id'],
            { context, limit: 100 }
        );

        if (!Array.isArray(employees)) return [];

        // 2. Fetch Active POS Sessions to check Live Status
        let activeSessions: any[] = [];
        try {
            activeSessions = await client.searchRead(
                uid, connection.apiKey,
                'pos.session',
                [['state', 'in', ['opened', 'opening_control']]], // Only active sessions
                ['user_id', 'config_id'],
                { context }
            );
        } catch (e) {
            console.warn("Could not fetch active POS sessions for status check", e);
        }

        // Map session user_id to config name
        const userPosMap: Record<number, string> = {};
        if (Array.isArray(activeSessions)) {
            activeSessions.forEach((sess: any) => {
                // user_id is [id, "Name"]
                if (sess.user_id && Array.isArray(sess.user_id)) {
                    const userId = sess.user_id[0];
                    const posName = Array.isArray(sess.config_id) ? sess.config_id[1] : 'POS';
                    userPosMap[userId] = posName;
                }
            });
        }

        return employees.map((emp: any) => {
            // Check if employee's related user is in the active map
            let currentPos: string | undefined = undefined;
            if (emp.user_id && Array.isArray(emp.user_id)) {
                const userId = emp.user_id[0];
                if (userPosMap[userId]) {
                    currentPos = userPosMap[userId];
                }
            }

            return {
                id: emp.id.toString(),
                name: emp.name,
                jobTitle: emp.job_title || 'Sin Cargo',
                department: Array.isArray(emp.department_id) ? emp.department_id[1] : 'General',
                status: 'active',
                workEmail: emp.work_email,
                workPhone: emp.work_phone,
                identificationId: emp.identification_id,
                birthday: emp.birthday,
                gender: emp.gender === 'male' ? 'Masculino' : emp.gender === 'female' ? 'Femenino' : emp.gender,
                odooUserId: Array.isArray(emp.user_id) ? emp.user_id[0] : undefined,
                currentPos: currentPos // Attached live status
            };
        });

    } catch (e) {
        console.error("Error fetching employees:", e);
        return [];
    }
};
