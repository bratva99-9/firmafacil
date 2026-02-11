import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// API Key opcional para seguridad (configurar como Secret en Supabase)
const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY') || ''

// URL de la función interna de estado tributario
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

// Construir URL de la función interna
function getInternalFunctionUrl() {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL no está configurada')
  }
  return `${SUPABASE_URL}/functions/v1/estado-tributario`
}

// Función para formatear datos en JSON simple
function formatearRespuestaJSON(data: any, ruc: string) {
  const estado = data.estadoTributario
  const deudas = data.detalleDeudas

  // Respuesta simple y directa
  const respuesta: any = {
    success: data.success || false,
    ruc: ruc,
    timestamp: new Date().toISOString()
  }

  // Estado tributario
  if (estado && !estado.error) {
    respuesta.estado_tributario = {
      tiene_estado: true,
      estado: estado.estado || null,
      datos_completos: estado
    }
  } else {
    respuesta.estado_tributario = {
      tiene_estado: false,
      error: estado?.error || 'No se pudo obtener el estado tributario'
    }
  }

  // Deudas
  if (deudas && !deudas.error && Array.isArray(deudas) && deudas.length > 0) {
    const total = deudas.reduce((sum: number, deuda: any) => {
      return sum + (parseFloat(deuda.monto || deuda.valor || 0))
    }, 0)

    respuesta.deudas = {
      tiene_deudas: true,
      total: parseFloat(total.toFixed(2)),
      cantidad: deudas.length,
      lista: deudas.map((d: any) => ({
        concepto: d.concepto || d.descripcion || 'Sin concepto',
        monto: parseFloat(d.monto || d.valor || 0).toFixed(2),
        periodo: d.periodo || d.anio || 'N/A',
        fecha_vencimiento: d.fechaVencimiento || d.fecha || 'N/A'
      }))
    }
  } else if (deudas && Array.isArray(deudas) && deudas.length === 0) {
    respuesta.deudas = {
      tiene_deudas: false,
      total: 0,
      cantidad: 0,
      mensaje: 'No tiene deudas registradas'
    }
  } else {
    respuesta.deudas = {
      tiene_deudas: false,
      error: deudas?.error || 'No se pudo consultar las deudas'
    }
  }

  return respuesta
}

// Función para llamar a la función interna
async function consultarEstadoTributarioInterno(ruc: string) {
  try {
    const internalUrl = getInternalFunctionUrl()
    
    if (!SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY no está configurada')
    }

    console.log('Llamando a función interna:', internalUrl)
    console.log('RUC a consultar:', ruc)

    const response = await fetch(internalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ ruc: ruc })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en respuesta de función interna: ${response.status}`, errorText)
      throw new Error(`Error en consulta interna: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Respuesta de función interna recibida exitosamente')
    return data
  } catch (error: any) {
    console.error('Error consultando estado tributario interno:', error)
    console.error('Stack:', error.stack)
    throw error
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Verificar API key si está configurada
    if (MANYCHAT_API_KEY) {
      const apiKey = req.headers.get('x-api-key') || 
                     req.headers.get('authorization')?.replace('Bearer ', '')
      
      if (apiKey !== MANYCHAT_API_KEY) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "API key inválida o no proporcionada" 
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
    }

    // Obtener RUC desde query params (GET) o body (POST)
    let ruc: string | undefined

    if (req.method === "GET") {
      const url = new URL(req.url)
      ruc = url.searchParams.get("ruc") || undefined
    } else if (req.method === "POST") {
      try {
        const text = await req.text()
        if (text) {
          try {
            const body = JSON.parse(text)
            ruc = body.ruc || body.RUC || body.numero_ruc || undefined
          } catch {
            // Si no es JSON válido, asumir que el texto es el RUC
            ruc = text.trim() || undefined
          }
        }
      } catch (error) {
        console.error("Error leyendo body:", error)
        ruc = undefined
      }
    }

    if (!ruc) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RUC es requerido. Envía 'ruc' en el body (POST) o como query param (GET)" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Validar formato de RUC (13 dígitos)
    const rucLimpio = ruc.trim().replace(/\D/g, '')
    if (rucLimpio.length !== 13) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RUC debe tener 13 dígitos" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Consultar estado tributario usando la función interna
    let resultado
    try {
      resultado = await consultarEstadoTributarioInterno(rucLimpio)
    } catch (error: any) {
      console.error('Error al consultar estado tributario:', error)
      
      // Extraer el mensaje de error
      let errorMessage = error.message || 'Error al consultar el estado tributario'
      
      // Si el error es del captcha o validación con SRI
      if (errorMessage.includes('captcha') || errorMessage.includes('INVALID_REASON') || errorMessage.includes('validar captcha')) {
        return new Response(
          JSON.stringify({
            success: false,
            ruc: rucLimpio,
            error: 'El SRI rechazó la validación del captcha. Esto puede ser temporal. Intenta nuevamente en unos minutos.',
            tipo_error: 'validacion_captcha_sri',
            detalle: errorMessage,
            timestamp: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
      
      // Otros errores
      return new Response(
        JSON.stringify({
          success: false,
          ruc: rucLimpio,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200, // Cambiar a 200 para que ManyChat pueda leer el JSON
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Formatear respuesta en JSON simple
    const respuestaFormateada = formatearRespuestaJSON(resultado, rucLimpio)

    return new Response(
      JSON.stringify(respuestaFormateada),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error en manychat-estado-tributario:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error interno en la consulta",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

