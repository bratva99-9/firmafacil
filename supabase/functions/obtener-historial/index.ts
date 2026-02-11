import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Soporta GET y POST
    let subscriber_id: string | undefined
    let limite = 10

    if (req.method === "GET") {
      const url = new URL(req.url)
      subscriber_id = url.searchParams.get('subscriber_id') || undefined
      limite = parseInt(url.searchParams.get('limite') || '10')
    } else if (req.method === "POST") {
      const body = await req.json()
      subscriber_id = body.subscriber_id
      limite = body.limite || 10
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Método no permitido. Usa GET o POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (!subscriber_id) {
      return new Response(
        JSON.stringify({ success: false, error: "subscriber_id es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obtener últimos mensajes usando la función SQL
    const { data, error } = await supabase.rpc('obtener_ultimos_mensajes', {
      p_subscriber_id: subscriber_id,
      p_limite: limite,
    })

    if (error) {
      console.error("Error obteniendo historial:", error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Ordenar por fecha ascendente (más antiguo primero) para contexto
    const mensajesOrdenados = (data || []).reverse()

    // Formatear para ChatGPT (contexto de conversación)
    const contexto = mensajesOrdenados.map((msg: any) => {
      if (msg.tipo === 'usuario') {
        return `Usuario: ${msg.mensaje}`
      } else if (msg.tipo === 'bot') {
        return `Bot: ${msg.mensaje}`
      } else {
        return `Sistema: ${msg.mensaje}`
      }
    }).join('\n')

    return new Response(
      JSON.stringify({
        success: true,
        mensajes: mensajesOrdenados,
        contexto: contexto,
        total: mensajesOrdenados.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (err: any) {
    console.error("Error en obtener-historial:", err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})

