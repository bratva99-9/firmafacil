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
    const { cedula } = await req.json()
    
    if (!cedula || !/^\d{10}$/.test(cedula)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cédula inválida. Debe tener 10 dígitos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // URLs de la API de ANT
    const originUrl = "https://www.ecuadorlegalonline.com/consultas/agencia-nacional-de-transito/consultar-puntos-de-licencia/"
    const postUrl = "https://www.ecuadorlegalonline.com/apijson/ant.api.puntos.php"

    // User agent real del navegador
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"

    console.log(`Consultando puntos de licencia ANT para cédula: ${cedula}`)

    // 1) GET inicial para obtener cookies de sesión
    console.log('Obteniendo cookies iniciales...')
    let cookieHeader = ''
    
    try {
      const getResponse = await fetch(originUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9',
        }
      })

      // Extraer cookies de la respuesta
      const setCookieHeaders: string[] = []
      for (const [key, value] of getResponse.headers.entries()) {
        if (key.toLowerCase() === 'set-cookie') {
          setCookieHeaders.push(value)
        }
      }

      if (setCookieHeaders.length > 0) {
        const cookies = setCookieHeaders.map(c => c.trim().split(';')[0])
        cookieHeader = cookies.join('; ')
        console.log('Cookies obtenidas:', cookieHeader.substring(0, 100) + '...')
      }
    } catch (e) {
      console.log('⚠️ No se pudieron obtener cookies iniciales:', e.message)
      // Continuar sin cookies, puede funcionar igual
    }

    // 2) Preparar headers del POST
    const headers: Record<string, string> = {
      'Accept': '*/*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'User-Agent': userAgent,
      'Origin': 'https://www.ecuadorlegalonline.com',
      'Referer': originUrl,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    // 3) Body como form-urlencoded
    const bodyString = `ci=${cedula}`

    console.log(`Enviando POST a ${postUrl} con ci=${cedula}...`)

    // 4) Hacer POST usando las cookies
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: headers,
        body: bodyString,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Respuesta POST:', postResponse.status, postResponse.statusText)

      if (!postResponse.ok) {
        const errorText = await postResponse.text()
        console.error('Error en respuesta POST:', errorText)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error de la API: ${postResponse.status} ${postResponse.statusText}`,
            detalles: errorText.substring(0, 200)
          }),
          { 
            status: postResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // 5) Parsear JSON
      const content = await postResponse.text()
      console.log('Contenido recibido (primeros 500 chars):', content.substring(0, 500))

      // Si el contenido está vacío o solo tiene espacios, significa que no hay datos
      if (!content || content.trim().length === 0) {
        console.log('Respuesta vacía - No hay datos de licencia para esta cédula')
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              puntos: 0,
              licencias: [],
              detallePuntos: { rows: [], records: 0 },
              detalleCitacionesPendientes: { rows: [], records: 0 },
              resumenCitaciones: null,
              mensaje: 'No se encontraron datos de licencia de conducir para esta cédula'
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      try {
        const json = JSON.parse(content)
        console.log('JSON parseado exitosamente')
        
        // Verificar si el JSON indica que no hay datos
        if (json && typeof json === 'object') {
          // Si el JSON está vacío o no tiene datos relevantes, devolver estructura vacía
          const hasData = json.puntos !== undefined || 
                         (json.licencias && Array.isArray(json.licencias) && json.licencias.length > 0) ||
                         (json.detallePuntos && json.detallePuntos.rows && json.detallePuntos.rows.length > 0)
          
          if (!hasData && Object.keys(json).length === 0) {
            console.log('JSON vacío - No hay datos de licencia')
            return new Response(
              JSON.stringify({ 
                success: true, 
                data: {
                  puntos: 0,
                  licencias: [],
                  detallePuntos: { rows: [], records: 0 },
                  detalleCitacionesPendientes: { rows: [], records: 0 },
                  resumenCitaciones: null,
                  mensaje: 'No se encontraron datos de licencia de conducir para esta cédula'
                }
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: json
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError)
        console.error('Contenido completo:', content)
        
        // Si el contenido parece ser HTML o un mensaje de error, asumir que no hay datos
        const contentLower = content.toLowerCase().trim()
        if (contentLower.length === 0 || 
            contentLower.includes('<html') || 
            contentLower.includes('no se encontraron') ||
            contentLower.includes('sin datos') ||
            contentLower.includes('no existe')) {
          console.log('Respuesta indica que no hay datos de licencia')
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                puntos: 0,
                licencias: [],
                detallePuntos: { rows: [], records: 0 },
                detalleCitacionesPendientes: { rows: [], records: 0 },
                resumenCitaciones: null,
                mensaje: 'No se encontraron datos de licencia de conducir para esta cédula'
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        // Si no es JSON válido y no parece ser un caso de "sin datos", devolver error
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'La respuesta no es un JSON válido',
            contenido: content.substring(0, 500)
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Timeout: La consulta tardó demasiado tiempo'
          }),
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('Error en ant-puntos:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor',
        detalles: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

