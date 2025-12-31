
import { OdooConnection, CalendarEvent, OdooCompany, SalesData, InventoryItem, BranchKPI } from '../types';
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

/**
 * Obtiene datos reales de Odoo (POS Order preferentemente, o Sale Order)
 * y los procesa para el Dashboard de Farmacia.
 */
export const fetchOdooRealTimeData = async (connection: OdooConnection): Promise<{
    salesData: SalesData[],
    branches: BranchKPI[],
    totalSales: number,
    totalMargin: number,
    totalItems: number
}> => {
  
  if (connection.connectionMode === 'MOCK') {
      // Mock para Demo
      return {
          salesData: [
              { date: '2025-01-20', sales: 1200, margin: 400, transactions: 15 },
              { date: '2025-01-21', sales: 1500, margin: 550, transactions: 20 },
              { date: '2025-01-22', sales: 900, margin: 300, transactions: 12 },
              { date: '2025-01-23', sales: 2100, margin: 800, transactions: 28 },
              { date: '2025-01-24', sales: 2830, margin: 950, transactions: 35 },
          ],
          branches: [
              { id: '1', name: 'Farmacia Central', sales: 5800, margin: 2100, target: 5000, profitability: 36.2, status: 'OPEN' },
              { id: '2', name: 'Sucursal Surco', sales: 2730, margin: 900, target: 3000, profitability: 32.9, status: 'CLOSED' }
          ],
          totalSales: 8530,
          totalMargin: 3000,
          totalItems: 110
      };
  }
  
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    // 1. Intentar obtener datos de POS (Punto de Venta)
    // Es lo más común en Farmacias
    let orders = [];
    let isPos = false;
    
    try {
        console.log("🛒 Intentando buscar pos.order...");
        orders = await client.searchRead(
            uid, connection.apiKey, 'pos.order',
            [['state', 'in', ['paid', 'done', 'invoiced']]], 
            ['amount_total', 'date_order', 'company_id', 'lines'],
            { limit: 200, order: 'date_order desc' }
        );
        isPos = true;
    } catch (e) {
        console.warn("⚠️ No se encontró pos.order, intentando sale.order...");
        // Fallback a Ventas normales
        orders = await client.searchRead(
            uid, connection.apiKey, 'sale.order',
            [['state', 'in', ['sale', 'done']]],
            ['amount_total', 'date_order', 'company_id'],
            { limit: 200, order: 'date_order desc' }
        );
    }

    // Procesamiento de Datos
    const salesByDate: Record<string, number> = {};
    const branchesMap: Record<string, BranchKPI> = {};
    let totalSales = 0;
    let totalItems = 0; // Aproximado por transacciones si no leemos lineas

    orders.forEach((order: any) => {
        const amt = order.amount_total || 0;
        const dateRaw = order.date_order || '';
        const dateKey = typeof dateRaw === 'string' ? dateRaw.split(' ')[0] : 'N/A';
        
        // Agregar a Ventas por Fecha
        if (!salesByDate[dateKey]) salesByDate[dateKey] = 0;
        salesByDate[dateKey] += amt;

        // Agregar a Sedes
        const companyId = Array.isArray(order.company_id) ? order.company_id[0] : '0';
        const companyName = Array.isArray(order.company_id) ? order.company_id[1] : 'Principal';
        
        if (!branchesMap[companyId]) {
            branchesMap[companyId] = {
                id: companyId.toString(),
                name: companyName,
                sales: 0,
                margin: 0,
                target: 10000, // Dummy target
                profitability: 0,
                status: 'OPEN' // Hardcoded for now
            };
        }
        branchesMap[companyId].sales += amt;

        totalSales += amt;
        totalItems += 1; // Contamos órdenes como items para simplificar si no traemos lineas
    });

    // Calcular márgenes simulados (En producción se leerían costos reales)
    // Farmacias suelen tener márgenes entre 25% y 40%
    Object.values(branchesMap).forEach(b => {
        b.margin = b.sales * 0.35; 
        b.profitability = 35.0;
    });

    const totalMargin = totalSales * 0.35;

    // Formatear para gráficas
    const salesData: SalesData[] = Object.entries(salesByDate).map(([date, sales]) => ({
        date,
        sales,
        margin: sales * 0.35,
        transactions: 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

export const fetchOdooInventory = async (connection: OdooConnection): Promise<InventoryItem[]> => {
  if (connection.connectionMode === 'MOCK') return [];
  
  try {
    const client = getClient(connection);
    const uid = await client.authenticate(connection.user, connection.apiKey);

    const products = await client.searchRead(
        uid,
        connection.apiKey,
        'product.product',
        [['type', '=', 'product'], ['qty_available', '<', 50]], 
        ['name', 'default_code', 'qty_available', 'categ_id', 'list_price'],
        { limit: 50, order: 'qty_available asc' }
    );
    
    return products.map((item: any) => {
        const stock = item.qty_available || 0;
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
            category: Array.isArray(item.categ_id) ? item.categ_id[1] : 'General'
        };
    });

  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

export const fetchOdooAppointments = async (connection: OdooConnection): Promise<CalendarEvent[]> => {
    // ... same as before
    return [];
};
