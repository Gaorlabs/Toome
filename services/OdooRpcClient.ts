
/**
 * MOTOR DE CONEXIÓN ODOO XML-RPC (Standalone)
 * Basado en el kit proporcionado. Maneja la serialización XML y el transporte.
 */

const xmlEscape = (str: string) => 
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;');

const serialize = (value: any): string => {
  if (value === null || value === undefined) return '<value><nil/></value>';
  let content = '';
  if (typeof value === 'number') {
    content = Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  } else if (typeof value === 'string') {
    content = `<string>${xmlEscape(value)}</string>`;
  } else if (typeof value === 'boolean') {
    content = `<boolean>${value ? '1' : '0'}</boolean>`;
  } else if (Array.isArray(value)) {
    content = `<array><data>${value.map(v => serialize(v)).join('')}</data></array>`;
  } else if (typeof value === 'object') {
    if (value instanceof Date) {
      // Formato ISO8601 estricto para Odoo
      const iso = value.toISOString().replace(/\.\d+Z$/, ''); 
      content = `<dateTime.iso8601>${iso}</dateTime.iso8601>`;
    } else {
      content = `<struct>${Object.entries(value).map(([k, v]) => 
        `<member><name>${xmlEscape(k)}</name>${serialize(v)}</member>`
      ).join('')}</struct>`;
    }
  }
  return `<value>${content}</value>`;
};

const parseValue = (node: Element): any => {
  const child = node.firstElementChild;
  if (!child) return node.textContent?.trim(); 
  const tag = child.tagName.toLowerCase();
  switch (tag) {
    case 'string': return child.textContent;
    case 'int': case 'i4': return parseInt(child.textContent || '0', 10);
    case 'double': return parseFloat(child.textContent || '0');
    case 'boolean': return child.textContent === '1' || child.textContent === 'true';
    case 'datetime.iso8601': return new Date(child.textContent || '');
    case 'array': 
      const dataNode = child.querySelector('data');
      return dataNode ? Array.from(dataNode.children).map(parseValue) : [];
    case 'struct':
      const obj: any = {};
      Array.from(child.children).forEach(member => {
        const nameNode = member.querySelector('name');
        const valNode = member.querySelector('value');
        if (nameNode && valNode) obj[nameNode.textContent || ''] = parseValue(valNode);
      });
      return obj;
    case 'nil': return null;
    default: return child.textContent;
  }
};

// Lista de proxies rotativos para evitar bloqueos CORS
// Se prueban en orden. Si uno falla, se usa el siguiente.
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
];

export class OdooClient {
  private url: string;
  private db: string;
  private useProxy: boolean;
  
  constructor(url: string, db: string, useProxy: boolean = true) {
    this.url = url.replace(/\/+$/, ''); 
    this.db = db;
    this.useProxy = useProxy;
  }

  /**
   * Ejecuta una llamada XML-RPC genérica
   */
  async rpcCall(endpoint: string, method: string, params: any[]): Promise<any> {
    const xmlString = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params.map(p => `<param>${serialize(p)}</param>`).join('')}</params></methodCall>`;
    const targetUrl = `${this.url}/xmlrpc/2/${endpoint}`;
    
    // Intentar con proxies secuencialmente
    let lastError;
    
    // Si usamos proxy, intentamos la lista. Si no, directo.
    const urlGenerators = this.useProxy ? PROXIES : [(u: string) => u];
    let success = false;
    let result = null;

    for (const generateUrl of urlGenerators) {
        if (success) break;
        try {
            const fetchUrl = generateUrl(targetUrl);
            console.log(`📡 Intentando conectar vía: ${fetchUrl}`);

            // Usamos Promise.race para timeout de 10 segundos por proxy
            const response = await Promise.race([
                fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/xml' },
                    body: xmlString
                }),
                new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión (10s)")), 10000))
            ]);

            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

            const text = await response.text();
            
            // Validación básica de respuesta HTML (error de proxy)
            if (text.includes('<html') || text.includes('<!DOCTYPE html')) {
                throw new Error("El proxy devolvió una página HTML en lugar de XML (posiblemente bloqueado).");
            }

            const doc = new DOMParser().parseFromString(text, 'text/xml');
            
            // Verificar errores de Odoo (Faults)
            const fault = doc.querySelector('methodResponse > fault');
            if (fault) {
                const faultStruct = parseValue(fault.querySelector('value')!);
                throw new Error(`Odoo Fault: ${faultStruct.faultString} (${faultStruct.faultCode})`);
            }

            const paramNode = doc.querySelector('methodResponse > params > param > value');
            if (!paramNode) throw new Error("Respuesta XML inválida o vacía.");

            result = parseValue(paramNode);
            success = true;
            console.log("✅ Conexión XML-RPC exitosa.");

        } catch (e: any) {
            console.warn(`⚠️ Falló intento: ${e.message}`);
            lastError = e;
        }
    }
    
    if (!success) {
        throw lastError || new Error("No se pudo conectar con Odoo tras varios intentos. Verifique URL y CORS.");
    }

    return result;
  }

  /**
   * Autentica y devuelve el UID del usuario
   */
  async authenticate(username: string, apiKey: string): Promise<number> {
    return await this.rpcCall('common', 'authenticate', [this.db, username, apiKey, {}]);
  }

  /**
   * Wrapper para execute_kw (Llamadas a modelos)
   */
  async executeKw(uid: number, apiKey: string, model: string, method: string, args: any[] = [], kwargs: any = {}) {
    return await this.rpcCall('object', 'execute_kw', [
        this.db, uid, apiKey, model, method, args, kwargs
    ]);
  }

  /**
   * Helper común: Search & Read
   */
  async searchRead(uid: number, apiKey: string, model: string, domain: any[], fields: string[], options: any = {}) {
    return await this.executeKw(uid, apiKey, model, 'search_read', [domain], { fields, ...options });
  }
}
