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
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Método no permitido. Usa POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const body = await req.json()
    const { subscriber_id, user_id, mensaje, tipo = 'usuario', metadata = {} } = body

    if (!subscriber_id || !mensaje) {
      return new Response(
        JSON.stringify({ success: false, error: "subscriber_id y mensaje son requeridos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (!['usuario', 'bot', 'sistema'].includes(tipo)) {
      return new Response(
        JSON.stringify({ success: false, error: "tipo debe ser: usuario, bot o sistema" }),
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

    // Guardar mensaje
    const { data, error } = await supabase
      .from('conversaciones')
      .insert({
        manychat_subscriber_id: subscriber_id,
        manychat_user_id: user_id || null,
        mensaje: mensaje,
        tipo: tipo,
        metadata: metadata,
      })
      .select()
      .single()

    if (error) {
      console.error("Error guardando mensaje:", error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (err: any) {
    console.error("Error en guardar-mensaje:", err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})

