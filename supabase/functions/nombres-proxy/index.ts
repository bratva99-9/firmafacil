import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const q = url.searchParams.get('q')

    if (!q) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parámetro q es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const encoded = encodeURIComponent(q)
    const upstreamUrl = `https://tramitesbasicos.mx/api/consultas/nombres/${encoded}`

    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Origin': 'https://www.ecuadorlegalonline.com',
        'Referer': 'https://www.ecuadorlegalonline.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    })

    const text = await upstream.text()

    // Propagar status y content-type si existe
    const contentType = upstream.headers.get('content-type') || 'application/json'
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': contentType }
    })
  } catch (err) {
    console.error('Error en nombres-proxy:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


