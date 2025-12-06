import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración Now Payments (poner como Secrets en Supabase)
const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY') || ''

// URL base de la API de Now Payments
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1'

// Función para crear un pago/invoice en Now Payments
async function crearPagoNowPayments(
  priceAmount: number,
  priceCurrency: string,
  orderId: string,
  payCurrency?: string,
  ipnCallbackUrl?: string
) {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('Falta configurar NOWPAYMENTS_API_KEY en Supabase')
  }

  const paymentData: any = {
    price_amount: priceAmount,
    price_currency: priceCurrency.toLowerCase(),
    order_id: orderId,
  }

  // Parámetros opcionales
  if (payCurrency) {
    paymentData.pay_currency = payCurrency.toLowerCase()
  }

  if (ipnCallbackUrl) {
    paymentData.ipn_callback_url = ipnCallbackUrl
  } else {
    // URL de callback por defecto
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    paymentData.ipn_callback_url = `${supabaseUrl}/functions/v1/nowpayments-callback`
  }

  // Headers requeridos
  const headers: any = {
    'x-api-key': NOWPAYMENTS_API_KEY,
    'Authorization': `Bearer ${NOWPAYMENTS_API_KEY}`,
    'Content-Type': 'application/json',
  }

  // Realizar petición POST
  const response = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al crear pago en Now Payments: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  
  // Log para debug - ver qué devuelve la API
  console.log('Respuesta de Now Payments /invoice:', JSON.stringify(result, null, 2))
  console.log('Campos disponibles en la respuesta:', Object.keys(result))
  
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
    const { action, amount, currency, orderId, payCurrency, userEmail, userId } = body

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

      const priceAmount = parseFloat(amount)
      if (isNaN(priceAmount) || priceAmount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: "amount debe ser un número positivo" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const ipnCallbackUrl = `${supabaseUrl}/functions/v1/nowpayments-callback`

      // Crear el pago en Now Payments
      const resultado = await crearPagoNowPayments(
        priceAmount,
        currency,
        orderId,
        payCurrency,
        ipnCallbackUrl
      )
      
      // Log para debug
      console.log('Resultado de crearPagoNowPayments:', JSON.stringify(resultado, null, 2))
      
      // Guardar el pago inicial en la base de datos si tenemos userEmail
      if (userEmail && resultado) {
        try {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          const supabase = createClient(supabaseUrl, supabaseKey)
          
          // IMPORTANTE: Cuando se crea un invoice con POST /invoice:
          // - El campo "id" devuelto es el invoice_id, NO el payment_id
          // - El payment_id solo existe cuando el usuario realmente inicia el pago
          // - Por lo tanto, NUNCA usar "id" como payment_id si no hay payment_id explícito
          const paymentId = resultado.payment_id || null // Solo usar payment_id si está explícitamente presente
          const invoiceId = resultado.invoice_id || resultado.invoiceId || resultado.id || null // El "id" es siempre el invoice_id
          
          console.log('IDs extraídos de la respuesta de creación:', {
            payment_id_explicito: resultado.payment_id,
            invoice_id_explicito: resultado.invoice_id || resultado.invoiceId,
            id_campo: resultado.id,
            paymentId_final: paymentId,
            invoiceId_final: invoiceId,
            todosLosCampos: Object.keys(resultado)
          })
          
          const invoiceUrl = resultado.invoice_url
          const payUrl = resultado.pay_url || resultado.payment_url
          
          const paymentData: any = {
            order_id: orderId,
            user_email: userEmail,
            price_amount: priceAmount,
            price_currency: currency.toLowerCase(),
            pay_currency: payCurrency?.toLowerCase(),
            invoice_url: invoiceUrl,
            pay_url: payUrl,
            payment_status: 'waiting', // Estado inicial
            payment_data: resultado
          }
          
          // Agregar payment_id e invoice_id solo si existen
          if (paymentId) paymentData.payment_id = paymentId
          if (invoiceId) paymentData.invoice_id = invoiceId
          
          if (userId) {
            paymentData.user_id = userId
          }
          
          // Usar order_id como clave de conflicto principal (siempre está presente y es único)
          console.log('Guardando pago inicial en BD con:', {
            conflictKey: 'order_id',
            paymentId,
            invoiceId,
            orderId,
            userEmail
          })
          
          const { error: dbError, data: dbData } = await supabase
            .from('pagos_nowpayments')
            .upsert(paymentData, {
              onConflict: 'order_id',
              ignoreDuplicates: false
            })
            .select()
          
          if (dbError) {
            console.error('Error guardando pago inicial en BD:', JSON.stringify(dbError, null, 2))
            console.error('Datos que intentamos guardar:', JSON.stringify(paymentData, null, 2))
            // No fallar la creación del pago si hay error en BD
          } else {
            console.log('Pago inicial guardado en BD exitosamente:', JSON.stringify(dbData, null, 2))
          }
        } catch (dbError) {
          console.error('Error al guardar pago en BD:', dbError)
          // No fallar la creación del pago si hay error en BD
        }
      }
      
      // Devolver la respuesta con todos los campos necesarios
      const responseData = {
        success: true,
        payment: resultado,
      }
      
      console.log('Enviando respuesta al cliente:', JSON.stringify(responseData, null, 2))
      
      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Acción no válida. Solo se permite 'create'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    console.error("Error en nowpayments-payment:", error)

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
