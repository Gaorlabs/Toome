
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, db, username, password, model, method, args, kwargs } = await req.json()

    if (!url || !db || !username || !password) {
        throw new Error("Faltan parámetros de conexión (URL, DB, User, Password)")
    }

    // Clean URL and construct JSON-RPC endpoint
    const cleanUrl = url.replace(/\/+$/, '');
    const odooEndpoint = `${cleanUrl}/jsonrpc`;

    console.log(`Proxying to Odoo: ${odooEndpoint}`);

    // 3. AUTHENTICATE
    const authPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [db, username, password, {}]
      },
      id: Math.floor(Math.random() * 1000000)
    }

    const authReq = await fetch(odooEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authPayload)
    });

    if (!authReq.ok) {
        throw new Error(`Odoo Server Error: ${authReq.status} ${authReq.statusText}`);
    }

    const authRes = await authReq.json();

    if (authRes.error) {
        return new Response(JSON.stringify({ error: authRes.error.data?.message || authRes.error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        });
    }

    const uid = authRes.result;
    if (!uid) {
        return new Response(JSON.stringify({ error: "Autenticación fallida. Verifique credenciales." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    // 4. EXECUTE METHOD
    const execPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            args: [
                db, 
                uid, 
                password, 
                model, 
                method, 
                args || [], 
                kwargs || {} 
            ]
        },
        id: Math.floor(Math.random() * 1000000)
    }

    const execReq = await fetch(odooEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execPayload)
    });

    const execRes = await execReq.json();

    if (execRes.error) {
         return new Response(JSON.stringify({ error: execRes.error.data?.message || execRes.error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    return new Response(JSON.stringify(execRes.result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Client error or Internal error handled gracefully
    })
  }
})
