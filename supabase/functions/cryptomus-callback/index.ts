import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración Cryptomus (poner como Secrets en Supabase)
const CRYPTOMUS_API_KEY = Deno.env.get('CRYPTOMUS_API_KEY') || ''

// Helper para verificar la firma del callback de Cryptomus
function verificarFirmaCallback(data: any, sign: string, apiKey: string): boolean {
  const jsonData = JSON.stringify(data)
  const base64Data = btoa(jsonData)
  const concatenado = base64Data + apiKey
  
  const hash = createHash('md5')
  hash.update(concatenado)
  const hashCalculado = hash.digest('hex')
  
  return hashCalculado === sign
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

    // Obtener la firma del header
    const signHeader = req.headers.get('sign') || ''
    
    // Leer el body
    const body = await req.json()
    
    // Verificar la firma
    if (!verificarFirmaCallback(body, signHeader, CRYPTOMUS_API_KEY)) {
      console.error('Firma de callback inválida')
      return new Response(
        JSON.stringify({ success: false, error: "Firma inválida" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Procesar el callback
    const orderId = body.order_id
    const paymentStatus = body.payment_status
    const paymentAmount = body.amount
    
    console.log(`Callback recibido - Order ID: ${orderId}, Status: ${paymentStatus}, Amount: ${paymentAmount}`)

    // Aquí puedes guardar el estado del pago en la base de datos si es necesario
    // Por ejemplo, actualizar una tabla de pagos con el estado
    
    // Responder a Cryptomus que recibimos el callback
    return new Response(
      JSON.stringify({ success: true, message: "Callback recibido" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error en cryptomus-callback:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error interno procesando callback",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
