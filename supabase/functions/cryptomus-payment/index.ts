import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración Cryptomus (poner como Secrets en Supabase)
const CRYPTOMUS_MERCHANT_ID = Deno.env.get('CRYPTOMUS_MERCHANT_ID') || ''
const CRYPTOMUS_API_KEY = Deno.env.get('CRYPTOMUS_API_KEY') || ''

// URL base de la API de Cryptomus
const CRYPTOMUS_API_URL = 'https://api.cryptomus.com/v1'

// Helper para generar la firma MD5 requerida por Cryptomus
function generarFirma(data: any, apiKey: string): string {
  const jsonData = JSON.stringify(data)
  const base64Data = btoa(jsonData)
  const concatenado = base64Data + apiKey
  
  // Usar createHash de Node.js crypto (compatible con Deno)
  const hash = createHash('md5')
  hash.update(concatenado)
  const hashHex = hash.digest('hex')
  
  return hashHex
}

// Función para crear un pago/invoice en Cryptomus
async function crearPagoCryptomus(amount: string, currency: string, orderId: string, lifetime: number = 3600) {
  if (!CRYPTOMUS_MERCHANT_ID || !CRYPTOMUS_API_KEY) {
    throw new Error('Falta configurar CRYPTOMUS_MERCHANT_ID o CRYPTOMUS_API_KEY en Supabase')
  }

  const paymentData = {
    amount,
    currency,
    order_id: orderId,
    lifetime,
    url_return: `${Deno.env.get('SITE_URL') || 'https://tu-dominio.com'}/pago-exitoso`,
    url_callback: `${Deno.env.get('SUPABASE_URL') || ''}/functions/v1/cryptomus-callback`,
    is_payment_multiple: false,
    to_currency: null,
    subtract: 0,
    accuracy: null,
    additional_data: null,
    currencies: [],
    network: null,
    address: null,
    from: null,
    source: 'api',
  }

  // Generar firma
  const sign = generarFirma(paymentData, CRYPTOMUS_API_KEY)

  // Headers requeridos
  const headers = {
    'merchant': CRYPTOMUS_MERCHANT_ID,
    'sign': sign,
    'Content-Type': 'application/json',
  }

  // Realizar petición POST
  const response = await fetch(`${CRYPTOMUS_API_URL}/payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al crear pago en Cryptomus: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result
}

// Función para verificar el estado de un pago
async function verificarEstadoPago(orderId: string) {
  if (!CRYPTOMUS_MERCHANT_ID || !CRYPTOMUS_API_KEY) {
    throw new Error('Falta configurar CRYPTOMUS_MERCHANT_ID o CRYPTOMUS_API_KEY en Supabase')
  }

  const checkData = {
    order_id: orderId,
  }

  // Generar firma
  const sign = generarFirma(checkData, CRYPTOMUS_API_KEY)

  // Headers requeridos
  const headers = {
    'merchant': CRYPTOMUS_MERCHANT_ID,
    'sign': sign,
    'Content-Type': 'application/json',
  }

  // Realizar petición POST
  const response = await fetch(`${CRYPTOMUS_API_URL}/payment/info`, {
    method: 'POST',
    headers,
    body: JSON.stringify(checkData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al verificar pago en Cryptomus: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result
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
    const { action, amount, currency, orderId } = body

    if (action === 'create') {
      // Crear un nuevo pago
      if (!amount || !currency || !orderId) {
        return new Response(
          JSON.stringify({ success: false, error: "amount, currency y orderId son requeridos" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }

      const resultado = await crearPagoCryptomus(amount, currency, orderId)
      
      return new Response(
        JSON.stringify({
          success: true,
          payment: resultado,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    } else if (action === 'check') {
      // Verificar estado de un pago
      if (!orderId) {
        return new Response(
          JSON.stringify({ success: false, error: "orderId es requerido" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }

      const resultado = await verificarEstadoPago(orderId)
      
      return new Response(
        JSON.stringify({
          success: true,
          payment: resultado,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Acción no válida. Usa 'create' o 'check'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    console.error("Error en cryptomus-payment:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error interno procesando pago",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
