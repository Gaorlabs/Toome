
import { OdooConnection, CalendarEvent, OdooCompany } from '../types';

// ==========================================
// 1. CONFIGURACIÓN DE PROXIES (CORS BYPASS)
// ==========================================
const PROXIES = [
  // Opción 1: CorsProxy.io (Suele ser el más rápido y fiable para HTTPS)
  'https://corsproxy.io/?', 
  // Opción 2: ThingProxy (Buen respaldo para XML-RPC)
  'https://thingproxy.freeboard.io/fetch/',
  // Opción 3: CodeTabs (Alternativa final)
  'https://api.codetabs.com/v1/proxy?quest='
];

// ==========================================
// 2. UTILIDADES XML-RPC (SERIALIZADOR Y PARSER)
// ==========================================

/** Convierte Tipos JS a XML de Odoo */
const toXmlValue = (value: any): string => {
  if (value === null || value === undefined) return '<nil/>';
  if (typeof value === 'boolean') return `<boolean>${value ? 1 : 0}</boolean>`;
  if (typeof value === 'number') {
      return Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  }
  if (typeof value === 'string') {
      const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<string>${escaped}</string>`;
  }
  if (Array.isArray(value)) {
    return `
      <array>
        <data>
          ${value.map(v => `<value>${toXmlValue(v)}</value>`).join('')}
        </data>
      </array>
    `;
  }
  if (typeof value === 'object') {
    return `
      <struct>
        ${Object.keys(value).map(key => `
          <member>
            <name>${key}</name>
            <value>${toXmlValue(value[key])}</value>
          </member>
        `).join('')}
      </struct>
    `;
  }
  return `<string>${value}</string>`;
};

const buildXmlCall = (methodName: string, params: any[]) => {
  return `<?xml version="1.0"?>
    <methodCall>
      <methodName>${methodName}</methodName>
      <params>
        ${params.map(p => `<param><value>${toXmlValue(p)}</value></param>`).join('')}
      </params>
    </methodCall>
  `;
};

/** Parsea XML de Odoo a Tipos JS */
const parseXmlValue = (node: Element): any => {
  const type = node.firstElementChild?.tagName;
  const content = node.textContent;

  if (!type) return content;

  switch (type) {
    case 'boolean': return content === '1';
    case 'int': 
    case 'i4': return parseInt(content || '0', 10);
    case 'double': return parseFloat(content || '0');
    case 'string': return content || '';
    case 'array':
      const dataNode = node.querySelector('data');
      if (!dataNode) return [];
      return Array.from(dataNode.children).map(valNode => parseXmlValue(valNode));
    case 'struct':
      const struct: any = {};
      Array.from(node.querySelectorAll('member')).forEach(member => {
        const name = member.querySelector('name')?.textContent || '';
        const valueNode = member.querySelector('value');
        if (name && valueNode) {
          struct[name] = parseXmlValue(valueNode);
        }
      });
      return struct;
    default: return content;
  }
};

const parseXmlResponse = (xmlText: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  const fault = xmlDoc.querySelector('methodResponse > fault');
  if (fault) {
    const faultStruct = parseXmlValue(fault.querySelector('value')!);
    throw new Error(`Odoo XML-RPC Fault: ${faultStruct.faultString} (${faultStruct.faultCode})`);
  }

  const param = xmlDoc.querySelector('methodResponse > params > param > value');
  if (!param) {
      if (xmlText.includes('<html>') || xmlText.trim() === '') {
          throw new Error("Respuesta inválida del servidor (posible bloqueo de proxy).");
      }
      throw new Error("Respuesta XML incompleta.");
  }
  
  return parseXmlValue(param);
};

// ==========================================
// 3. CORE DE CONEXIÓN CON ROTACIÓN DE PROXY
// ==========================================

const fetchWithProxy = async (targetUrl: string, body: string) => {
  let lastError;
  const errors = [];

  // 1. Intento con Proxies
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
      console.log(`📡 Intentando conectar vía: ${proxy}`);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml'
          // 'X-Requested-With' removido para evitar preflight complex en algunos proxies
        },
        body: body
      });

      if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
      }
      
      const text = await response.text();
      
      if (text.startsWith('Error') || (text.includes('<title>') && text.includes('Error'))) {
          throw new Error("Proxy devolvió página de error.");
      }

      return text;

    } catch (e: any) {
      console.warn(`⚠️ Falló proxy ${proxy}:`, e.message);
      errors.push(`${proxy}: ${e.message}`);
      lastError = e;
    }
  }

  // 2. Intento Directo (Hail Mary - Por si el usuario tiene plugin CORS o el server permite)
  try {
      console.log(`📡 Intentando conexión DIRECTA (Sin Proxy)...`);
      const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/xml' },
          body: body
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text;
  } catch (e: any) {
      console.warn("⚠️ Falló conexión directa:", e.message);
      errors.push(`Direct: ${e.message}`);
  }

  throw new Error(`Conexión fallida. Detalles: ${errors.join(' | ')}`);
};

const executeXmlRpc = async (url: string, endpoint: 'common' | 'object', method: string, params: any[]) => {
  const cleanUrl = url.replace(/\/+$/, '');
  const targetUrl = `${cleanUrl}/xmlrpc/2/${endpoint}`;
  
  const xmlBody = buildXmlCall(method, params);
  const xmlResponse = await fetchWithProxy(targetUrl, xmlBody);
  return parseXmlResponse(xmlResponse);
};

// ==========================================
// 4. FUNCIONES DE NEGOCIO (API)
// ==========================================

export const testOdooConnection = async (connection: OdooConnection): Promise<{ success: boolean; mode: 'REAL' | 'MOCK'; companies: OdooCompany[]; error?: string }> => {
  
  if (connection.connectionMode === 'MOCK') {
      return { 
          success: true, 
          mode: 'MOCK', 
          companies: [
              { id: '1', name: 'Compañía Demo 1', currency: 'USD' },
              { id: '2', name: 'Sucursal Demo Norte', currency: 'PEN' }
          ] 
      };
  }

  try {
    console.log("🔐 Autenticando...");
    const uid = await executeXmlRpc(connection.url, 'common', 'authenticate', [
      connection.db,
      connection.user,
      connection.apiKey,
      {} 
    ]);

    if (!uid || typeof uid !== 'number') {
      throw new Error("Autenticación fallida: UID inválido o credenciales incorrectas.");
    }

    console.log(`✅ Autenticado exitosamente. UID: ${uid}`);

    const companiesData = await executeXmlRpc(connection.url, 'object', 'execute_kw', [
      connection.db,
      uid,
      connection.apiKey,
      'res.company',
      'search_read',
      [[]], 
      { fields: ['name', 'currency_id'] }
    ]);

    if(!Array.isArray(companiesData)) {
         throw new Error("No se pudo leer la lista de compañías.");
    }

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

const callModel = async (conn: OdooConnection, model: string, method: string, args: any[], kwargs: any = {}) => {
  const uid = await executeXmlRpc(conn.url, 'common', 'authenticate', [
    conn.db,
    conn.user,
    conn.apiKey,
    {}
  ]);

  if (!uid) throw new Error("No se pudo obtener UID");

  return await executeXmlRpc(conn.url, 'object', 'execute_kw', [
    conn.db,
    uid,
    conn.apiKey,
    model,
    method,
    args,
    kwargs
  ]);
};

export const fetchOdooRealTimeData = async (connection: OdooConnection) => {
  if (connection.connectionMode === 'MOCK') return [];
  try {
    const sales = await callModel(connection, 'sale.order', 'search_read', [[]], {
      fields: ['name', 'amount_total', 'date_order', 'state', 'company_id'], 
      limit: 50,
      order: 'date_order desc'
    });
    return sales;
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const fetchOdooInventory = async (connection: OdooConnection) => {
  if (connection.connectionMode === 'MOCK') return [];
  try {
    const products = await callModel(connection, 'product.product', 'search_read', [[['type', '=', 'product']]], {
      fields: ['name', 'default_code', 'qty_available', 'categ_id', 'list_price', 'standard_price'],
      limit: 50
    });
    return products;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

export const fetchOdooAppointments = async (connection: OdooConnection): Promise<CalendarEvent[]> => {
  if (connection.connectionMode === 'MOCK') return [];
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    
    const events = await callModel(connection, 'calendar.event', 'search_read', [[['start', '>=', startOfMonth]]], {
      fields: ['name', 'start', 'stop', 'location', 'description', 'partner_ids'],
      limit: 50,
      order: 'start asc'
    });

    return events.map((ev: any) => ({
      id: ev.id,
      title: ev.name || 'Sin Título',
      start: ev.start,
      end: ev.stop,
      location: ev.location || '',
      description: ev.description || '',
      attendees: Array.isArray(ev.partner_ids) ? `${ev.partner_ids.length} pax` : '',
      status: 'confirmed'
    }));

  } catch (error) {
    console.error("Error fetching agenda:", error);
    return [];
  }
};
