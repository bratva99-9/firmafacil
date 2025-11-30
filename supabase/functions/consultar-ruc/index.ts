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
    const { ruc } = await req.json()
    
    if (!ruc) {
      return new Response(
        JSON.stringify({ success: false, error: 'RUC es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Consultar API del SRI
    const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?&ruc=${ruc}`
    const sriBaseUrl = 'https://srienlinea.sri.gob.ec'
    
    console.log(`Consultando SRI: ${sriUrl}`)
    
    // Headers base para simular un navegador real
    const baseHeaders = {
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
    
    // Headers para la petición de datos
    const headers = {
      ...baseHeaders,
      'Accept': 'application/json, text/plain, */*',
      'Origin': sriBaseUrl,
      'Referer': `${sriBaseUrl}/`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    }
    
    // Intentar con timeout y reintentos
    let lastError = null
    const maxRetries = 3
    let cookieHeader = ''
    
    // ESTRATEGIA: Primero visitar la página principal para obtener cookies (como hace un navegador)
    try {
      console.log('Obteniendo cookies de sesión del SRI...')
      const sessionResponse = await fetch(sriBaseUrl, {
        method: 'GET',
        headers: {
          ...baseHeaders,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Upgrade-Insecure-Requests': '1'
        }
      })
      
      // Extraer cookies de la respuesta
      const setCookieHeaders: string[] = []
      for (const [key, value] of sessionResponse.headers.entries()) {
        if (key.toLowerCase() === 'set-cookie') {
          setCookieHeaders.push(value)
        }
      }
      
      if (setCookieHeaders.length > 0) {
        const cookies = setCookieHeaders.map(c => c.trim().split(';')[0])
        cookieHeader = cookies.join('; ')
        console.log('Cookies obtenidas del SRI:', cookieHeader.substring(0, 100) + '...')
      }
      
      // Esperar un momento antes de hacer la petición real
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (sessionError) {
      console.log('⚠️ No se pudieron obtener cookies (continuando sin ellas):', sessionError.message)
    }
    
    // Agregar cookies a los headers si las tenemos
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt} de ${maxRetries} para consultar SRI`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout
        
        const response = await fetch(sriUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal,
          redirect: 'follow'
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          // Si la respuesta es exitosa, procesar
          const dataArray = await response.json()
          console.log('Datos recibidos del SRI:', JSON.stringify(dataArray, null, 2))
          
          // La API del SRI devuelve un array, tomamos el primer elemento
          const data = Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : (dataArray && typeof dataArray === 'object' ? dataArray : null)
          
          if (data && data.numeroRuc) {
            // Consultar datos adicionales de establecimientos
            let establecimientosDetalle: any[] = []
            try {
              console.log('Consultando datos de establecimientos...')
              const establecimientosUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/Establecimiento/consultarPorNumeroRuc?numeroRuc=${ruc}`
              
              const establecimientosController = new AbortController()
              const establecimientosTimeoutId = setTimeout(() => establecimientosController.abort(), 20000)
              
              const establecimientosResponse = await fetch(establecimientosUrl, {
                method: 'GET',
                headers: {
                  ...headers,
                  'Accept': 'application/json, text/plain, */*'
                },
                signal: establecimientosController.signal,
                redirect: 'follow'
              })
              
              clearTimeout(establecimientosTimeoutId)
              
              if (establecimientosResponse.ok) {
                const establecimientosData = await establecimientosResponse.json()
                console.log('Datos de establecimientos recibidos:', JSON.stringify(establecimientosData, null, 2))
                
                // La API devuelve un array de establecimientos
                if (Array.isArray(establecimientosData)) {
                  establecimientosDetalle = establecimientosData
                } else if (establecimientosData && typeof establecimientosData === 'object') {
                  establecimientosDetalle = [establecimientosData]
                }
              } else {
                console.warn('⚠️ No se pudieron obtener datos de establecimientos:', establecimientosResponse.status)
              }
            } catch (establecimientosError: any) {
              console.warn('⚠️ Error al consultar establecimientos (no crítico):', establecimientosError.message)
              // No fallar si no se pueden obtener los establecimientos
            }
            
            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  numero_ruc: data.numeroRuc,
                  razon_social: data.razonSocial,
                  estado_contribuyente_ruc: data.estadoContribuyenteRuc,
                  actividad_economica_principal: data.actividadEconomicaPrincipal,
                  tipo_contribuyente: data.tipoContribuyente,
                  regimen: data.regimen,
                  categoria: data.categoria,
                  obligado_llevar_contabilidad: data.obligadoLlevarContabilidad,
                  agente_retencion: data.agenteRetencion,
                  contribuyente_especial: data.contribuyenteEspecial,
                  fecha_inicio_actividades: data.informacionFechasContribuyente?.fechaInicioActividades,
                  fecha_cese: data.informacionFechasContribuyente?.fechaCese,
                  fecha_reinicio_actividades: data.informacionFechasContribuyente?.fechaReinicioActividades,
                  fecha_actualizacion: data.informacionFechasContribuyente?.fechaActualizacion,
                  contribuyente_fantasma: data.contribuyenteFantasma,
                  transacciones_inexistente: data.transaccionesInexistente,
                  clasificacion_mipyme: data.clasificacionMiPyme,
                  motivo_cancelacion_suspension: data.motivoCancelacionSuspension,
                  representantes_legales: data.representantesLegales || [],
                  establecimientos: data.establecimientos || [],
                  establecimientos_detalle: establecimientosDetalle // Datos adicionales de establecimientos
                }
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          } else {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'RUC no encontrado en el sistema del SRI' 
              }),
              { 
                status: 404, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        } else {
          // Si no es 200, intentar parsear el error
          try {
            const errorText = await response.text()
            console.error(`Error del SRI (${response.status}):`, errorText)
          } catch (e) {
            console.error(`Error del SRI (${response.status})`)
          }
          
          if (attempt < maxRetries) {
            console.log(`Reintentando en 2 segundos...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Error del SRI: ${response.status} ${response.statusText}` 
            }),
            { 
              status: response.status, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (fetchError) {
        lastError = fetchError
        console.error(`Error en intento ${attempt}:`, fetchError.message)
        
        // Si es error de conexión y no es el último intento, reintentar
        if (attempt < maxRetries && (
          fetchError.message.includes('Connection reset') ||
          fetchError.message.includes('connection error') ||
          fetchError.message.includes('AbortError') ||
          fetchError.name === 'AbortError'
        )) {
          const waitTime = attempt * 2000 // Esperar más tiempo en cada reintento
          console.log(`Error de conexión. Reintentando en ${waitTime/1000} segundos...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        // Si es el último intento o no es error de conexión, lanzar el error
        if (attempt === maxRetries) {
          throw fetchError
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('Todos los intentos de conexión fallaron')

  } catch (error) {
    console.error('Error en consultar-ruc:', error)
    
    // Determinar el tipo de error
    let errorMessage = 'Error interno del servidor'
    let statusCode = 500
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Error de conexión con el SRI. Por favor, intenta nuevamente.'
      statusCode = 503
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        detalles: error.message || 'Error desconocido'
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
