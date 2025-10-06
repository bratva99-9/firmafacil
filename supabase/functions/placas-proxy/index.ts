import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const placa = url.searchParams.get('placa')?.trim()
    if (!placa) {
      return new Response(JSON.stringify({ error: 'Parámetro placa es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const upstreamUrl = `https://www.ecuadorlegalonline.com/modulo/sri/matriculacion/consultar-vehiculo-detalle.php?placa=${encodeURIComponent(placa)}`

    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Referer': 'https://www.ecuadorlegalonline.com/consultas/consultar-dueno-de-vehiculo/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'text/html; charset=utf-8'

    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': contentType },
    })
  } catch (err) {
    console.error('Error en placas-proxy:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


