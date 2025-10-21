import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/api-proxy/', '')
    
    // Construir URL de destino
    const targetUrl = `https://api.zamplisoft.com/${path}${url.search}`
    
    console.log(`Proxying request to: ${targetUrl}`)
    
    // Realizar la petición al servicio externo
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: req.method !== 'GET' ? await req.text() : undefined
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error del servicio externo: ${response.status} ${response.statusText}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.text()
    
    return new Response(data, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': response.headers.get('content-type') || 'application/json'
      }
    })

  } catch (error) {
    console.error('Error en api-proxy:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
