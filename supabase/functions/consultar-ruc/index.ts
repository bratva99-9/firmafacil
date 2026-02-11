import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Log para debugging
  const inicioTiempo = Date.now()
  console.log('=== Consultar RUC - Nueva petición ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  try {
    // Obtener RUC desde query params (GET) o body (POST) - Compatible con ManyChat
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
            // Si no es JSON válido, asumir que el texto es el RUC directamente
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
          error: 'RUC es requerido. Envía "ruc" en el body (POST) o como query param (GET)',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, // ManyChat necesita 200 para procesar JSON
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Limpiar RUC (solo números)
    const rucLimpio = ruc.trim().replace(/\D/g, '')
    
    console.log('RUC recibido:', ruc)
    console.log('RUC limpio:', rucLimpio)
    
    if (rucLimpio.length !== 13) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'RUC debe tener 13 dígitos',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, // ManyChat necesita 200 para procesar JSON
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Consultar API del SRI
    const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?&ruc=${rucLimpio}`
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
        
        const fetchResponse = await fetch(sriUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal,
          redirect: 'follow'
        })
        
        clearTimeout(timeoutId)
        
        if (fetchResponse.ok) {
          // Si la respuesta es exitosa, procesar
          let dataArray = null
          const responseText = await fetchResponse.text()
          
          // Si la respuesta está vacía, significa que no hay RUC
          if (!responseText || responseText.trim().length === 0) {
            console.log('Respuesta vacía - No hay RUC registrado para esta cédula')
            const respuestaNoEncontrado = {
              respuesta_final: `No se encontraron coincidencias para el RUC: ${rucLimpio}\n\nEl número de RUC ingresado no está registrado en el SRI o no existe.`
            }
            return new Response(
              JSON.stringify(respuestaNoEncontrado),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
          
          try {
            dataArray = JSON.parse(responseText) as any
            console.log('Datos recibidos del SRI:', JSON.stringify(dataArray, null, 2))
          } catch (parseError) {
            console.error('Error al parsear JSON del SRI:', parseError)
            // Si no es JSON válido y está vacío o parece indicar que no hay datos
            if (responseText.trim().length === 0 || 
                responseText.toLowerCase().includes('no se encontr') ||
                responseText.toLowerCase().includes('sin datos')) {
              console.log('Respuesta indica que no hay RUC')
              const respuestaNoEncontrado = {
                respuesta_final: `No se encontraron coincidencias para el RUC: ${rucLimpio}\n\nEl número de RUC ingresado no está registrado en el SRI o no existe.`
              }
              return new Response(
                JSON.stringify(respuestaNoEncontrado),
                { 
                  status: 200, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }
            throw parseError
          }
          
          // La API del SRI devuelve un array, tomamos el primer elemento
          const data = Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : (dataArray && typeof dataArray === 'object' ? dataArray : null)
          
          // Si el array está vacío o no hay datos, significa que no hay RUC
          if (!data || !data.numeroRuc) {
            console.log('No se encontró RUC en la respuesta del SRI')
            const respuestaNoEncontrado = {
              respuesta_final: `No se encontraron coincidencias para el RUC: ${rucLimpio}\n\nEl número de RUC ingresado no está registrado en el SRI o no existe.`
            }
            return new Response(
              JSON.stringify(respuestaNoEncontrado),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
          
          // Consultar datos adicionales de establecimientos
          let establecimientosDetalle: any[] = []
          try {
            console.log('Consultando datos de establecimientos...')
            const establecimientosUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/Establecimiento/consultarPorNumeroRuc?numeroRuc=${rucLimpio}`
            
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
          
          // Formatear respuesta SIMPLE y LIMPIA para ManyChat
          // Limpiar fechas (remover hora si existe)
          const fechaInicio = data.informacionFechasContribuyente?.fechaInicioActividades 
            ? data.informacionFechasContribuyente.fechaInicioActividades.split(' ')[0] 
            : null
          const fechaCese = data.informacionFechasContribuyente?.fechaCese 
            ? (data.informacionFechasContribuyente.fechaCese.trim() || null)
            : null
          const fechaActualizacion = data.informacionFechasContribuyente?.fechaActualizacion 
            ? data.informacionFechasContribuyente.fechaActualizacion.split(' ')[0]
            : null
          
          // Datos principales
          const datosRuc = {
            success: true,
            ruc: rucLimpio,
            numero_ruc: data.numeroRuc || '',
            razon_social: data.razonSocial || '',
            estado: data.estadoContribuyenteRuc || '',
            actividad: data.actividadEconomicaPrincipal || '',
            tipo: data.tipoContribuyente || '',
            regimen: data.regimen || '',
            categoria: data.categoria || '',
            obligado_contabilidad: data.obligadoLlevarContabilidad || 'NO',
            agente_retencion: data.agenteRetencion || 'NO',
            contribuyente_especial: data.contribuyenteEspecial || 'NO',
            fecha_inicio: fechaInicio || '',
            fecha_cese: fechaCese || '',
            fecha_actualizacion: fechaActualizacion || '',
            contribuyente_fantasma: data.contribuyenteFantasma || 'NO',
            transacciones_inexistente: data.transaccionesInexistente || 'NO',
            clasificacion_mipyme: data.clasificacionMiPyme || '',
            motivo_cancelacion: data.motivoCancelacionSuspension || ''
          }
          
          // Respuesta ULTRA SIMPLE para ManyChat - solo un campo string
          // ManyChat tiene problemas con objetos complejos, mejor enviar solo texto plano
          const tiempoTranscurrido = Date.now() - inicioTiempo
          console.log('⏱️ Tiempo de procesamiento:', tiempoTranscurrido, 'ms')
          
          if (tiempoTranscurrido > 10000) {
            console.warn('⚠️ ADVERTENCIA: La respuesta tardó más de 10 segundos. ManyChat puede no procesarla.')
          }
          
          // Respuesta SIMPLE - campos individuales para mapeo fácil en ManyChat
          const respuestaSimple = {
            respuesta_final: `RUC: ${data.numeroRuc || ''}\nRazón Social: ${data.razonSocial || ''}\nEstado: ${data.estadoContribuyenteRuc || ''}\nActividad: ${data.actividadEconomicaPrincipal || ''}\nTipo: ${data.tipoContribuyente || ''}\nRégimen: ${data.regimen || ''}\nCategoría: ${data.categoria || ''}`,
            razon_social: data.razonSocial || '',
            numero_ruc: data.numeroRuc || '',
            estado: data.estadoContribuyenteRuc || '',
            actividad: data.actividadEconomicaPrincipal || '',
            tipo: data.tipoContribuyente || '',
            regimen: data.regimen || '',
            categoria: data.categoria || ''
          }
          
          const respuestaJSON = JSON.stringify(respuestaSimple)
          console.log('✅ Respuesta SIMPLE preparada para ManyChat')
          console.log('📦 Tamaño respuesta:', respuestaJSON.length, 'caracteres')
          console.log('📄 Respuesta JSON:', respuestaJSON)
          
          // Crear respuesta con headers mínimos para ManyChat
          const response = new Response(
            respuestaJSON,
            { 
              status: 200, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json'
              } 
            }
          )
          
          console.log('📤 Enviando respuesta a ManyChat, status:', response.status)
          
          return response
        } else {
          // Si no es 200, intentar parsear el error
          try {
            const errorText = await fetchResponse.text()
            console.error(`Error del SRI (${fetchResponse.status}):`, errorText)
          } catch (e) {
            console.error(`Error del SRI (${fetchResponse.status})`)
          }
          
          if (attempt < maxRetries) {
            console.log(`Reintentando en 2 segundos...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          
          return new Response(
            JSON.stringify({ 
              success: false,
              ruc: rucLimpio,
              error: `Error del SRI: ${fetchResponse.status} ${fetchResponse.statusText}`,
              timestamp: new Date().toISOString()
            }),
            { 
              status: 200, // ManyChat necesita 200 para procesar JSON
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
        detalles: error.message || 'Error desconocido',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, // ManyChat necesita 200 para procesar JSON
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
