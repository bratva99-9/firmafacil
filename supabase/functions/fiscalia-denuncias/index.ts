import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API Keys para servicios de scraping (configurar en Supabase Secrets)
const SCRAPER_API_KEY = Deno.env.get('SCRAPER_API_KEY') || ''
const SCRAPINGBEE_API_KEY = Deno.env.get('SCRAPINGBEE_API_KEY') || ''

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

    const businfo = `a:1:{i:0;s:10:"${cedula}";}`
    const urlFiscalia = `https://www.gestiondefiscalias.gob.ec/siaf/comunes/noticiasdelito/info_mod.php?businfo=${encodeURIComponent(businfo)}`
    
    console.log(`Consultando fiscalía para cédula: ${cedula}`)

    // ESTRATEGIA 1: ScraperAPI (si está configurado)
    if (SCRAPER_API_KEY) {
      try {
        console.log('🔄 Intentando con ScraperAPI...')
        const scraperUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(urlFiscalia)}&render=true&premium=false&country_code=ec`
        
        const response = await fetch(scraperUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
        })
        
        if (response.ok) {
          const html = await response.text()
          if (!html.includes('Incapsula') && !html.includes('incident ID')) {
            console.log('✅ ScraperAPI exitoso')
            return new Response(
              JSON.stringify({ success: true, html }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } catch (e) {
        console.log('⚠️ ScraperAPI falló:', e.message)
      }
    }

    // ESTRATEGIA 2: ScrapingBee (si está configurado)
    if (SCRAPINGBEE_API_KEY) {
      try {
        console.log('🔄 Intentando con ScrapingBee...')
        const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(urlFiscalia)}&render_js=true&premium_proxy=true&country_code=ec`
        
        const response = await fetch(scrapingBeeUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
        })
        
        if (response.ok) {
          const html = await response.text()
          if (!html.includes('Incapsula') && !html.includes('incident ID')) {
            console.log('✅ ScrapingBee exitoso')
            return new Response(
              JSON.stringify({ success: true, html }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } catch (e) {
        console.log('⚠️ ScrapingBee falló:', e.message)
      }
    }

    // ESTRATEGIA 3: Proxy público con headers mejorados
    try {
      console.log('🔄 Intentando con proxy público y headers mejorados...')
      
      // Primero visitar la página principal para obtener cookies
      const baseUrl = 'https://www.gestiondefiscalias.gob.ec/siaf/informacion/web/noticiasdelito/index.php'
      let cookieHeader = ''
      
      try {
        const sessionResponse = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
          },
          redirect: 'follow'
        })
        
        // Extraer cookies
        const setCookieHeaders: string[] = []
        for (const [key, value] of sessionResponse.headers.entries()) {
          if (key.toLowerCase() === 'set-cookie') {
            setCookieHeaders.push(value)
          }
        }
        
        if (setCookieHeaders.length > 0) {
          const cookies = setCookieHeaders.map(c => c.trim().split(';')[0])
          cookieHeader = cookies.join('; ')
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.log('⚠️ No se pudieron obtener cookies:', e.message)
      }
      
      // Hacer la petición real con cookies y headers completos
      const headers: Record<string, string> = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': baseUrl,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'no-cache',
        'Origin': 'https://www.gestiondefiscalias.gob.ec'
      }
      
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)
      
      try {
        const response = await fetch(urlFiscalia, {
          method: 'GET',
          headers: headers,
          redirect: 'follow',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const html = await response.text()
          
          const bloqueoIncapsula = html.includes('Incapsula') || 
                                   html.includes('incident ID') || 
                                   html.includes('_Incapsula_Resource') ||
                                   html.includes('Request unsuccessful')
          
          if (!bloqueoIncapsula && html.length > 500) {
            console.log('✅ Petición directa exitosa')
            return new Response(
              JSON.stringify({ success: true, html }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (e) {
      console.log('⚠️ Estrategia 3 falló:', e.message)
    }

    // Si todas las estrategias fallan, retornar error con instrucciones
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'BLOQUEO_INCAPSULA',
        mensaje: 'No se pudo acceder a la información. El sistema está protegido y requiere acceso directo desde el navegador.',
        instrucciones: 'Para obtener los datos, configura un servicio de scraping (ScraperAPI o ScrapingBee) o usa el iframe embebido en la aplicación.'
      }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en fiscalia-denuncias:', error)
    
    const errorMessage = error.message || 'Error interno del servidor'
    const isConnectionError = errorMessage.includes('broken pipe') || 
                             errorMessage.includes('connection') ||
                             errorMessage.includes('stream closed') ||
                             errorMessage.includes('AbortError')
    
    if (isConnectionError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'BLOQUEO_INCAPSULA',
          mensaje: 'El servidor está cerrando la conexión. Configura un servicio de scraping para resolver esto.'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

