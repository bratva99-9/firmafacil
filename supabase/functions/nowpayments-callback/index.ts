import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración Now Payments (poner como Secrets en Supabase)
const NOWPAYMENTS_IPN_SECRET_KEY = Deno.env.get('NOWPAYMENTS_IPN_SECRET_KEY') || ''

// Helper para verificar la firma del callback de Now Payments
function verificarFirmaCallback(data: any, signature: string, secretKey: string): boolean {
  if (!secretKey) {
    console.warn('NOWPAYMENTS_IPN_SECRET_KEY no configurado, saltando verificación de firma')
    return true // En desarrollo, permitir sin verificación si no hay secret key
  }

  // Now Payments usa HMAC SHA512 para firmar los callbacks
  // Necesitamos crear un string ordenado de los datos
  const sortedKeys = Object.keys(data).sort()
  const dataString = sortedKeys.map(key => `${key}=${data[key]}`).join('&')
  
  // Calcular HMAC SHA512
  const hmac = createHmac('sha512', secretKey)
  hmac.update(dataString)
  const hashCalculado = hmac.digest('hex')
  
  return hashCalculado === signature
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

    // Obtener la firma del header (Now Payments puede enviarla en diferentes headers)
    const signature = req.headers.get('x-nowpayments-sig') || 
                     req.headers.get('signature') || 
                     req.headers.get('x-signature') || 
                     ''
    
    // Leer el body
    const body = await req.json()
    
    // Verificar la firma si está configurada
    if (NOWPAYMENTS_IPN_SECRET_KEY && signature) {
      if (!verificarFirmaCallback(body, signature, NOWPAYMENTS_IPN_SECRET_KEY)) {
        console.error('Firma de callback inválida')
        return new Response(
          JSON.stringify({ success: false, error: "Firma inválida" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }
    }

    // Procesar el callback
    const paymentId = body.payment_id
    const orderId = body.order_id
    const paymentStatus = body.payment_status || body.status
    // Normalizar estados: convertir "pending" a "waiting" si es necesario
    const normalizedStatus = paymentStatus === 'pending' ? 'waiting' : paymentStatus
    const priceAmount = body.price_amount
    const priceCurrency = body.price_currency
    const payCurrency = body.pay_currency
    const payAmount = body.pay_amount
    const invoiceId = body.invoice_id
    const invoiceUrl = body.invoice_url
    const payUrl = body.pay_url
    
    console.log(`Callback recibido - Payment ID: ${paymentId}, Order ID: ${orderId}, Status: ${paymentStatus} (normalizado: ${normalizedStatus}), Amount: ${priceAmount} ${priceCurrency}`)

    // Guardar el estado del pago en la base de datos
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Intentar obtener el email del usuario desde el order_id
    // El order_id puede contener información del usuario o podemos buscarlo en la tabla
    let userEmail = body.customer_email || body.email || null
    let userId = null
    
    // Si no hay email en el callback, intentar obtenerlo de la tabla existente
    if (!userEmail && orderId) {
      const { data: existingPayment } = await supabase
        .from('pagos_nowpayments')
        .select('user_email, user_id')
        .eq('order_id', orderId)
        .single()
      
      if (existingPayment) {
        userEmail = existingPayment.user_email
        userId = existingPayment.user_id
      }
    }
    
    // Preparar datos del pago
    const paymentData: any = {
      payment_id: paymentId,
      invoice_id: invoiceId,
      order_id: orderId,
      payment_status: normalizedStatus, // Usar estado normalizado
      price_amount: priceAmount,
      price_currency: priceCurrency,
      pay_currency: payCurrency,
      pay_amount: payAmount,
      invoice_url: invoiceUrl,
      pay_url: payUrl,
      payment_data: body, // Guardar toda la respuesta del callback
      updated_at: new Date().toISOString()
    }
    
    // Si tenemos email o user_id, agregarlos
    if (userEmail) {
      paymentData.user_email = userEmail
    }
    if (userId) {
      paymentData.user_id = userId
    }
    
    // Si el estado es finished, partially_paid o cancelled, actualizar paid_at
    if (normalizedStatus === 'finished' || normalizedStatus === 'partially_paid' || normalizedStatus === 'cancelled') {
      paymentData.paid_at = new Date().toISOString()
    }
    
    // Upsert (insertar o actualizar) el pago
    // Estrategia: Intentar primero por payment_id, luego por invoice_id, luego por order_id
    let dbError = null
    let actualizado = false
    
    console.log('Intentando guardar/actualizar pago en BD:', {
      paymentId,
      invoiceId,
      orderId,
      paymentStatus: normalizedStatus
    })
    
    if (paymentId) {
      // Intentar actualizar por payment_id (más confiable cuando existe)
      const { error, data } = await supabase
        .from('pagos_nowpayments')
        .upsert(paymentData, {
          onConflict: 'payment_id',
          ignoreDuplicates: false
        })
        .select()
      
      if (!error && data && data.length > 0) {
        actualizado = true
        console.log('✅ Pago actualizado por payment_id:', paymentId, 'Filas afectadas:', data.length)
      } else if (error) {
        dbError = error
        console.warn('⚠️ Error actualizando por payment_id, intentando por invoice_id:', error)
      }
    }
    
    // Si no se actualizó por payment_id y tenemos invoice_id, intentar por invoice_id
    if (!actualizado && invoiceId) {
      const { error, data } = await supabase
        .from('pagos_nowpayments')
        .update(paymentData)
        .eq('invoice_id', invoiceId)
        .select()
      
      if (!error && data && data.length > 0) {
        actualizado = true
        console.log('✅ Pago actualizado por invoice_id:', invoiceId, 'Filas afectadas:', data.length)
      } else if (error) {
        dbError = error
        console.warn('⚠️ Error actualizando por invoice_id, intentando por order_id:', error)
      } else if (!data || data.length === 0) {
        console.warn('⚠️ No se encontró pago con invoice_id, intentando por order_id')
      }
    }
    
    // Si aún no se actualizó, intentar por order_id
    if (!actualizado && orderId) {
      const { error, data } = await supabase
        .from('pagos_nowpayments')
        .upsert(paymentData, {
          onConflict: 'order_id',
          ignoreDuplicates: false
        })
        .select()
      
      if (!error && data && data.length > 0) {
        actualizado = true
        console.log('✅ Pago actualizado por order_id:', orderId, 'Filas afectadas:', data.length)
      } else {
        dbError = error || new Error('No se encontró pago con order_id')
        console.error('❌ Error actualizando por order_id:', dbError)
      }
    }
    
    if (!actualizado && !paymentId && !invoiceId && !orderId) {
      console.error('❌ No hay payment_id, invoice_id ni order_id para actualizar el pago')
      dbError = { message: 'Falta payment_id, invoice_id y order_id' }
    }
    
    if (dbError && !actualizado) {
      console.error('❌ Error guardando pago en BD:', JSON.stringify(dbError, null, 2))
      console.error('Datos que intentamos guardar:', JSON.stringify(paymentData, null, 2))
      // No fallar el callback si hay error en BD, solo loguear
    } else if (actualizado) {
      console.log('✅ Pago guardado/actualizado exitosamente en BD')
      console.log('Estado actualizado a:', normalizedStatus)
    }
    
    // Responder a Now Payments que recibimos el callback
    return new Response(
      JSON.stringify({ success: true, message: "Callback recibido" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error en nowpayments-callback:", error)

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
