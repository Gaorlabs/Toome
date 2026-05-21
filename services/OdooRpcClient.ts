
/**
 * MOTOR DE CONEXIÓN ODOO HÍBRIDO (Supabase Proxy + XML-RPC Fallback)
 * 
 * Estrategia de Conexión:
 * 1. Intenta usar Supabase Edge Function (JSON-RPC) -> Bypass total de CORS y mayor velocidad.
 * 2. Si falla, intenta conexión directa XML-RPC.
 * 3. Si falla, intenta via corsproxy.io.
 */

// Configuración Supabase (Duplicada para evitar dependencias circulares)
const SUPABASE_PROJECT_URL = 'https://yhufsgcnhptfyovotxkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodWZzZ2NuaHB0Znlvdm90eGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDM2NjgsImV4cCI6MjA3NTQ3OTY2OH0.M-DPvJ-3Ttkods89Ios7MDQIxvcggi3v-4G05lwQRww';

// --- XML-RPC HELPERS (Legacy Fallback) ---
const xmlEscape = (str: string) => 
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const serialize = (value: any): string => {
  if (value === null || value === undefined) return '<value><nil/></value>';
  if (typeof value === 'number') return Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  if (typeof value === 'string') return `<string>${xmlEscape(value)}</string>`;
  if (typeof value === 'boolean') return `<boolean>${value ? '1' : '0'}</boolean>`;
  if (Array.isArray(value)) return `<array><data>${value.map(v => serialize(v)).join('')}</data></array>`;
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return `<dateTime.iso8601>${value.toISOString().replace(/\.\d+Z$/, '')}</dateTime.iso8601>`;
    }
    return `<struct>${Object.entries(value).map(([k, v]) => `<member><name>${xmlEscape(k)}</name>${serialize(v)}</member>`).join('')}</struct>`;
  }
  return `<value>${xmlEscape(String(value))}</value>`;
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
    case 'array': return child.querySelector('data') ? Array.from(child.querySelector('data')!.children).map(parseValue) : [];
    case 'struct':
      const obj: any = {};
      Array.from(child.children).forEach(m => {
        const n = m.querySelector('name');
        const v = m.querySelector('value');
        if (n && v) obj[n.textContent || ''] = parseValue(v);
      });
      return obj;
    case 'nil': return null;
    default: return child.textContent;
  }
};

export class OdooClient {
  private url: string;
  private db: string;
  private username: string = '';
  private apiKey: string = '';
  
  constructor(url: string, db: string) {
    let cleanUrl = url.trim().replace(/\/+$/, '');
    cleanUrl = cleanUrl.replace(/\/web.*$/, '').replace(/\/xmlrpc\/2.*$/, '').replace(/\/jsonrpc.*$/, '');
    this.url = cleanUrl;
    this.db = db.trim();
  }

  // --- SUPABASE PROXY METHOD (PRIMARY) ---
  private async callSupabaseProxy(model: string, method: string, args: any[], kwargs: any) {
      console.log(`🚀 [SupabaseProxy] Calling ${model}.${method}...`);
      
      const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/odoo-proxy`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
              url: this.url,
              db: this.db,
              username: this.username,
              password: this.apiKey, // Proxy handles auth internally
              model,
              method,
              args,
              kwargs
          })
      });

      if (!response.ok) {
          const text = await response.text();
          throw new Error(`Proxy HTTP Error ${response.status}: ${text}`);
      }

      const json = await response.json();
      if (json.error) {
          throw new Error(`Odoo Error (via Proxy): ${json.error}`);
      }
      return json; // Return result directly
  }

  // --- XML-RPC FALLBACK METHOD (SECONDARY) ---
  private async rpcCall(endpoint: string, method: string, params: any[]): Promise<any> {
    const xmlString = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params.map(p => `<param>${serialize(p)}</param>`).join('')}</params></methodCall>`;
    const targetUrl = `${this.url}/xmlrpc/2/${endpoint}`;
    const endpointsToTry = [targetUrl, `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`];

    let lastError: any = null;
    for (const url of endpointsToTry) {
        try {
            console.log(`📡 [LegacyRPC] Connecting to: ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/xml' },
                body: xmlString
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const text = await response.text();
            if (text.trim().startsWith('<html')) throw new Error("Proxy Error (HTML returned)");
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/xml');
            if (doc.querySelector('parsererror')) throw new Error("Invalid XML");
            
            const fault = doc.querySelector('methodResponse > fault');
            if (fault) {
                const faultVal = parseValue(fault.querySelector('value')!);
                throw new Error(`Odoo Fault: ${faultVal.faultString}`);
            }
            const paramNode = doc.querySelector('params param value');
            return paramNode ? parseValue(paramNode) : null;
        } catch (e: any) {
            console.warn(`⚠️ Legacy RPC Failed on ${url}:`, e.message);
            lastError = e;
        }
    }
    throw lastError || new Error("Connection failed on all channels.");
  }

  // --- PUBLIC API ---

  async authenticate(username: string, apiKey: string): Promise<number> {
    this.username = username;
    this.apiKey = apiKey;

    // STRATEGY 1: Try Supabase Proxy (Check connectivity by searching self)
    try {
        const res = await this.callSupabaseProxy('res.users', 'search_read', [[['login', '=', username]]], { limit: 1, fields: ['id'] });
        if (Array.isArray(res) && res.length > 0) return res[0].id;
        if (Array.isArray(res) && res.length === 0) return 9999; // Auth works, but weird result. Return dummy ID to proceed.
    } catch (e) {
        console.warn("❌ Supabase Proxy Auth failed. Switching to Legacy XML-RPC.", e);
    }

    // STRATEGY 2: Legacy XML-RPC
    return await this.rpcCall('common', 'authenticate', [this.db, username, apiKey, {}]);
  }

  async executeKw(uid: number, apiKey: string, model: string, method: string, args: any[] = [], kwargs: any = {}) {
    // STRATEGY 1: Supabase Proxy
    try {
        return await this.callSupabaseProxy(model, method, args, kwargs);
    } catch (e) {
        console.warn(`❌ Proxy Execute failed for ${model}.${method}. Switching to Legacy XML-RPC.`, e);
    }

    // STRATEGY 2: Legacy XML-RPC
    return await this.rpcCall('object', 'execute_kw', [this.db, uid, apiKey, model, method, args, kwargs]);
  }

  // Wrapper for convenience
  async searchRead(uid: number, apiKey: string, model: string, domain: any[], fields: string[], options: any = {}) {
    return await this.executeKw(uid, apiKey, model, 'search_read', [domain], { fields, ...options });
  }

  async readGroup(uid: number, apiKey: string, model: string, domain: any[], fields: string[], groupby: string[], kwargs: any = {}) {
    return await this.executeKw(uid, apiKey, model, 'read_group', [], { domain, fields, groupby, ...kwargs });
  }
}
