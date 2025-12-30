
import { OdooConnection, CalendarEvent, OdooCompany } from '../types';

// ==========================================
// 1. CONFIGURACIÓN DE PROXIES (CORS BYPASS)
// ==========================================
const PROXIES = [
  // Opción 1: ThingProxy (Más estable para XML-RPC y POST bodies)
  'https://thingproxy.freeboard.io/fetch/',
  // Opción 2: CorsProxy (Rápido, buen respaldo)
  'https://corsproxy.io/?', 
  // Opción 3: CodeTabs (Alternativa final)
  'https://api.codetabs.com/v1/proxy?quest='
];

// NOTA: Se eliminó 'allorigins' porque borraba el cuerpo del mensaje XML causando el error "ExpatError" en Odoo.

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
      // Escapar caracteres XML básicos
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

  if (!type) return content; // Fallback string

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
  
  // Check for Fault (Error de Odoo)
  const fault = xmlDoc.querySelector('methodResponse > fault');
  if (fault) {
    const faultStruct = parseXmlValue(fault.querySelector('value')!);
    throw new Error(`Odoo XML-RPC Fault: ${faultStruct.faultString} (${faultStruct.faultCode})`);
  }

  // Success Params
  const param = xmlDoc.querySelector('methodResponse > params > param > value');
  if (!param) {
      // Si llegamos aquí y no hay params, puede ser un error HTML del proxy
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

  for (const proxy of PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
      console.log(`📡 Intentando conectar vía: ${proxy}`);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: body
      });

      if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
      }
      
      const text = await response.text();
      
      // Validación básica: Si devuelve HTML de error, es fallo del proxy
      if (text.startsWith('Error') || (text.includes('<title>') && text.includes('Error'))) {
          throw new Error("Proxy devolvió página de error.");
      }

      return text;

    } catch (e: any) {
      console.warn(`⚠️ Falló proxy ${proxy}:`, e.message);
      lastError = e;
      // Continuar al siguiente proxy en el loop
    }
  }
  throw new Error(`No se pudo conectar a Odoo. Verifica que la URL sea pública. Último error: ${lastError?.message}`);
};

/**
 * Función Maestra: Ejecuta una llamada XML-RPC completa
 */
const executeXmlRpc = async (url: string, endpoint: 'common' | 'object', method: string, params: any[]) => {
  // Limpiar URL
  const cleanUrl = url.replace(/\/+$/, '');
  const targetUrl = `${cleanUrl}/xmlrpc/2/${endpoint}`;
  
  // 1. Construir XML
  const xmlBody = buildXmlCall(method, params);
  
  // 2. Enviar Request (con Proxy)
  const xmlResponse = await fetchWithProxy(targetUrl, xmlBody);
  
  // 3. Parsear Resultado
  return parseXmlResponse(xmlResponse);
};

// ==========================================
// 4. FUNCIONES DE NEGOCIO (API)
// ==========================================

export const testOdooConnection = async (connection: OdooConnection): Promise<{ success: boolean; mode: 'REAL' | 'MOCK'; companies: OdooCompany[]; error?: string }> => {
  
  // BYPASS FOR MOCK MODE
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
    // Paso 1: Autenticar (common -> authenticate)
    const uid = await executeXmlRpc(connection.url, 'common', 'authenticate', [
      connection.db,
      connection.user,
      connection.apiKey, // Password o API Key
      {} // Empty struct for user_agent env
    ]);

    if (!uid || typeof uid !== 'number') {
      throw new Error("Autenticación fallida: UID inválido o credenciales incorrectas.");
    }

    console.log(`✅ Autenticado exitosamente. UID: ${uid}`);

    // Paso 2: Obtener TODAS las compañías disponibles (res.company)
    const companiesData = await executeXmlRpc(connection.url, 'object', 'execute_kw', [
      connection.db,
      uid,
      connection.apiKey,
      'res.company',
      'search_read',
      [[]], // Domain: All (traer todas)
      { fields: ['name', 'currency_id'] }
    ]);

    if(!Array.isArray(companiesData)) {
         throw new Error("No se pudo leer la lista de compañías.");
    }

    const companies: OdooCompany[] = companiesData.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        currency: Array.isArray(c.currency_id) ? c.currency_id[1] : 'PEN' // Odoo devuelve [id, "Nombre"]
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
