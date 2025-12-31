
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

export const fetchPosConfigs = async (connection: OdooConnection): Promise<PosConfig[]> => {
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
            ['name', 'company_id']
        );
        
        return posConfigs as PosConfig[];

    } catch (e) {
        console.error("Error fetching POS Configs:", e);
        return [];
    }
};

/**
 * DATOS EN TIEMPO REAL
 * Soporta filtros temporales (HOY, MES, AÑO) usando Agregación nativa de Odoo
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
  
  if (connection.connectionMode === 'MOCK') {
      const multiplier = period === 'AÑO' ? 12 : period === 'MES' ? 4 : 1;
      return {
          salesData: [
              { date: '2025-01-20', sales: 1200 * multiplier, margin: 400 * multiplier, transactions: 15 },
              { date: '2025-01-21', sales: 1500 * multiplier, margin: 550 * multiplier, transactions: 20 },
              { date: '2025-01-22', sales: 900 * multiplier, margin: 300 * multiplier, transactions: 12 },
              { date: '2025-01-23', sales: 2100 * multiplier, margin: 800 * multiplier, transactions: 28 },
              { date: '2025-01-24', sales: 2830 * multiplier, margin: 950 * multiplier, transactions: 35 },
          ],
          branches: [
              { id: '1', name: 'Farmacia Central', sales: 5800 * multiplier, margin: 2100 * multiplier, target: 5000, profitability: 36.2, status: 'OPEN' },
              { id: '2', name: 'Sucursal Surco', sales: 2730 * multiplier, margin: 900 * multiplier, target: 3000, profitability: 32.9, status: 'CLOSED' }
          ],
          totalSales: 8530 * multiplier,
          totalMargin: 3000 * multiplier,
          totalItems: 110 * multiplier
      };
  }
  
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    // 1. Construir Dominio de Fecha
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'HOY') {
        startDate.setHours(0,0,0,0); // Inicio del día
    } else if (period === 'MES') {
        startDate.setDate(1); 
        startDate.setHours(0,0,0,0); // Inicio del mes
    } else if (period === 'AÑO') {
        startDate.setMonth(0, 1);
        startDate.setHours(0,0,0,0); // Inicio del año
    }

    const dateStr = startDate.toISOString().split('T')[0] + ' 00:00:00';
    
    // Dominio Base
    const domain: any[] = [
        ['state', 'in', ['paid', 'done', 'invoiced']],
        ['date_order', '>=', dateStr]
    ];
    
    // Filtros de Seguridad
    if (allowedCompanyIds && allowedCompanyIds.length > 0) {
        const compIdsInt = allowedCompanyIds.map(id => parseInt(id)).filter(n => !isNaN(n));
        if (compIdsInt.length > 0) domain.push(['company_id', 'in', compIdsInt]);
    }
    if (allowedPosIds && allowedPosIds.length > 0) {
        domain.push(['config_id', 'in', allowedPosIds]);
    }

    // 2. Ejecutar Agregación (READ_GROUP)
    // Esto es mucho más rápido que descargar miles de registros
    const posGroups = await client.readGroup(
        uid, connection.apiKey, 
        'pos.order',
        domain,
        ['amount_total', 'date_order', 'config_id'], // Campos a sumar/agrupar
        ['date_order:day', 'config_id'] // Agrupar por día y por caja
    );

    // Procesar resultados agregados
    const salesByDate: Record<string, number> = {};
    const branchesMap: Record<string, BranchKPI> = {};
    let totalSales = 0;
    let totalItems = 0;

    // Si Odoo devuelve error o vacío en read_group, intentar fallback
    if (Array.isArray(posGroups)) {
        for (const group of posGroups) {
            // Group example: { config_id: [1, 'Caja 1'], amount_total: 500, date_order: '2023-01-01', __count: 5 }
            const amt = group.amount_total || 0;
            const count = group.config_id_count || 0; // Odoo count field varies
            
            // Handle Dates (Odoo returns grouped dates differently depending on version)
            // Usually group['date_order:day'] is "01 Jan 2025" or similar
            const dateKey = group['date_order:day'] || 'N/A';
            
            if (!salesByDate[dateKey]) salesByDate[dateKey] = 0;
            salesByDate[dateKey] += amt;

            // Handle Branch
            if (group.config_id) {
                const bId = Array.isArray(group.config_id) ? group.config_id[0] : group.config_id;
                const bName = Array.isArray(group.config_id) ? group.config_id[1] : 'Unknown';
                
                if (!branchesMap[bId]) {
                    branchesMap[bId] = {
                        id: bId.toString(),
                        name: bName,
                        sales: 0,
                        margin: 0,
                        target: 0,
                        profitability: 0,
                        status: 'OPEN'
                    };
                }
                branchesMap[bId].sales += amt;
            }

            totalSales += amt;
            totalItems += count;
        }
    }

    // Calcular márgenes (Simulado 35% por falta de campo costo directo en pos.order group)
    Object.values(branchesMap).forEach(b => {
        b.margin = b.sales * 0.35; 
        b.profitability = 35.0;
    });

    const totalMargin = totalSales * 0.35;

    // Convertir salesByDate a Array para el gráfico
    const salesData: SalesData[] = Object.entries(salesByDate).map(([date, sales]) => ({
        date,
        sales,
        margin: sales * 0.35,
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
 * Agrupado por método de pago (Yape, Plin, Efectivo, Visa)
 */
export const fetchCashClosingReport = async (connection: OdooConnection, allowedPosIds?: number[]): Promise<CashClosingReport[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [
            {
                sessionId: 'POS/2025/001',
                posName: 'Caja Principal',
                cashierName: 'Juan Pérez',
                openingDate: '2025-01-25 08:00:00',
                closingDate: null,
                openingBalance: 200.00,
                totalSales: 1540.50,
                expectedCash: 1740.50,
                countedCash: 0,
                difference: 0,
                state: 'Abierto',
                payments: [
                    { method: 'Efectivo', amount: 540.50, count: 12 },
                    { method: 'Yape', amount: 350.00, count: 8 },
                    { method: 'Plin', amount: 150.00, count: 3 },
                    { method: 'Visa / Niubiz', amount: 500.00, count: 5 }
                ]
            }
        ];
    }

    // Logic for Odoo: fetch pos.session and pos.payment
    // Simplified for now returning empty array if fail
    return [];
};


/**
 * REGISTRO DE VENTAS SUNAT
 * Formato detallado con IGV y Tipo de Comprobante
 */
export const fetchSalesRegister = async (connection: OdooConnection): Promise<SalesRegisterItem[]> => {
    if (connection.connectionMode === 'MOCK') {
        return [
            { id: '1', date: '2025-01-25', documentType: 'Factura', series: 'F001', number: '000459', clientName: 'DISTRIBUIDORA DEL SUR SAC', clientDocType: 'RUC', clientDocNum: '20556789123', currency: 'PEN', baseAmount: 1000.00, igvAmount: 180.00, totalAmount: 1180.00, status: 'Emitido', paymentState: 'Pagado' },
            { id: '2', date: '2025-01-25', documentType: 'Boleta', series: 'B001', number: '002301', clientName: 'JUAN PEREZ', clientDocType: 'DNI', clientDocNum: '45678912', currency: 'PEN', baseAmount: 50.00, igvAmount: 9.00, totalAmount: 59.00, status: 'Emitido', paymentState: 'Pagado' },
            { id: '3', date: '2025-01-25', documentType: 'Boleta', series: 'B001', number: '002302', clientName: 'MARIA LOPEZ', clientDocType: 'DNI', clientDocNum: '41234567', currency: 'PEN', baseAmount: 20.00, igvAmount: 3.60, totalAmount: 23.60, status: 'Emitido', paymentState: 'Pagado' },
        ];
    }

    // Fetch from account.move (Invoices)
    return [];
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
