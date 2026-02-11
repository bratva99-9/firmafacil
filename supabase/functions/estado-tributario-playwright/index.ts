import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Usar ScrapingBee o ScraperAPI con navegador real (más compatible con Supabase)
const SCRAPINGBEE_API_KEY = Deno.env.get('SCRAPINGBEE_API_KEY') || ''
const SCRAPER_API_KEY = Deno.env.get('SCRAPER_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URLs del SRI
const RECAPTCHA_PAGE_URL =
  "https://srienlinea.sri.gob.ec/sri-en-linea/SriDeclaracionesWeb/EstadoTributario/Consultas/consultaEstadoTributario"
const SRI_CAPTCHA_BASE = "https://srienlinea.sri.gob.ec"
const SRI_CAPTCHA_VALIDATE_PATH =
  "/sri-captcha-servicio-internet/rest/ValidacionCaptcha/validarGoogleReCaptcha"
const SRI_ESTADO_TRIBUTARIO_BASE =
  "https://srienlinea.sri.gob.ec/sri-estado-tributario-internet/rest/estado-tributario/consulta"
const SRI_PERSONA_POR_IDENT_URL =
  "https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/Persona/obtenerPorTipoIdentificacion"

// Helper: esperar X ms
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function resolverRecaptchaConPlaywright() {
  console.log("🚀 Usando servicio de scraping con navegador real...")
  
  // Intentar con ScrapingBee primero (tiene mejor soporte para navegadores)
  if (SCRAPINGBEE_API_KEY) {
    return await resolverConScrapingBee()
  }
  
  // Si no, intentar con ScraperAPI
  if (SCRAPER_API_KEY) {
    return await resolverConScraperAPI()
  }
  
  throw new Error("Se requiere configurar SCRAPINGBEE_API_KEY o SCRAPER_API_KEY en Supabase Secrets")
}

async function resolverConScrapingBee() {
  console.log("📡 Consultando con ScrapingBee...")
  
  // ScrapingBee con opción de navegador real, JavaScript y esperar al captcha
  // Usar render_js=true para ejecutar JavaScript
  // Usar wait para dar tiempo a que se cargue el captcha
  const params = new URLSearchParams({
    api_key: SCRAPINGBEE_API_KEY,
    url: RECAPTCHA_PAGE_URL,
    render_js: 'true',
    wait: '10000', // Esperar 10 segundos para que se cargue y resuelva el captcha
    wait_for: 'textarea[name="g-recaptcha-response"]', // Esperar a que aparezca el textarea del captcha
    premium_proxy: 'true', // Usar proxy premium para mejor éxito
    country_code: 'ec', // Proxy desde Ecuador
  })
  
  const url = `https://app.scrapingbee.com/api/v1/?${params.toString()}`
  console.log("URL ScrapingBee (sin API key):", url.replace(SCRAPINGBEE_API_KEY, '***'))
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error("❌ Error en ScrapingBee:", response.status, errorText.substring(0, 500))
    throw new Error(`Error en ScrapingBee: ${response.status} - ${errorText.substring(0, 200)}`)
  }
  
  const html = await response.text()
  console.log("📄 HTML recibido (longitud):", html.length)
  
  // Extraer el token del captcha del HTML
  // El token está en un textarea oculto: <textarea name="g-recaptcha-response">TOKEN_AQUI</textarea>
  // También puede estar en formato: <textarea id="g-recaptcha-response" name="g-recaptcha-response">TOKEN</textarea>
  let tokenMatch = html.match(/<textarea[^>]*name=["']g-recaptcha-response["'][^>]*>([^<]+)<\/textarea>/i)
  
  // Si no se encuentra, intentar buscar en el HTML renderizado
  if (!tokenMatch || !tokenMatch[1] || tokenMatch[1].trim().length < 100) {
    // Buscar en el código JavaScript de la página
    const jsTokenMatch = html.match(/g-recaptcha-response["']?\s*[=:]\s*["']([^"']{100,})["']/i)
    if (jsTokenMatch && jsTokenMatch[1]) {
      tokenMatch = jsTokenMatch
    }
  }
  
  if (!tokenMatch || !tokenMatch[1] || tokenMatch[1].trim().length < 100) {
    console.error("❌ No se encontró token en el HTML")
    console.log("HTML (primeros 2000 chars):", html.substring(0, 2000))
    throw new Error("No se pudo extraer el token del captcha del HTML. El captcha puede requerir resolución manual.")
  }
  
  const captchaToken = tokenMatch[1].trim()
  console.log("✅ Token obtenido (longitud):", captchaToken.length)
  console.log("Token (primeros 50 chars):", captchaToken.substring(0, 50))
  
  // Obtener cookies de la respuesta (ScrapingBee puede devolverlas en headers)
  const cookies = response.headers.get('set-cookie') || ''
  const cookieHeader = cookies
  
  return {
    captchaToken,
    cookieHeader,
  }
}

async function resolverConScraperAPI() {
  // ScraperAPI con opción de render JavaScript
  const url = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(RECAPTCHA_PAGE_URL)}&render=true&wait=5000`
  
  console.log("📡 Consultando con ScraperAPI...")
  const response = await fetch(url, {
    method: 'GET',
  })
  
  if (!response.ok) {
    throw new Error(`Error en ScraperAPI: ${response.status}`)
  }
  
  const html = await response.text()
  
  // Extraer el token del captcha
  const tokenMatch = html.match(/<textarea[^>]*name=["']g-recaptcha-response["'][^>]*>([^<]+)<\/textarea>/i)
  
  if (!tokenMatch || !tokenMatch[1] || tokenMatch[1].length < 100) {
    throw new Error("No se pudo extraer el token del captcha del HTML")
  }
  
  const captchaToken = tokenMatch[1].trim()
  console.log("✅ Token obtenido (longitud):", captchaToken.length)
  
  return {
    captchaToken,
    cookieHeader: '',
  }
}

async function obtenerJwtDesdeSRI(captchaToken: string, cookieHeader: string) {
  const url = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}?googleCaptchaResponse=${encodeURIComponent(captchaToken)}&emitirToken=true`

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Referer": RECAPTCHA_PAGE_URL,
    "Origin": SRI_CAPTCHA_BASE,
    "Connection": "keep-alive",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Cookie": cookieHeader,
  }

  console.log("🔐 Validando captcha con SRI...")
  const resp = await fetch(url, {
    method: "GET",
    headers,
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Error HTTP al validar captcha en SRI: ${resp.status} - ${txt.substring(0, 500)}`)
  }

  const json = await resp.json()
  const jwt = json.jwt || json.token || json.idToken || json.jws || null

  if (!jwt) {
    throw new Error("El SRI no devolvió un token JWT válido")
  }

  return jwt
}

async function obtenerCodigoPersonaDesdeRuc(ruc: string) {
  const limpio = (ruc || "").trim()
  if (!/^\d{13}$/.test(limpio)) {
    throw new Error("RUC inválido. Debe tener 13 dígitos")
  }

  const params = new URLSearchParams({
    numeroIdentificacion: limpio,
    tipoIdentificacion: "R",
  })

  const url = `${SRI_PERSONA_POR_IDENT_URL}?${params.toString()}`
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "application/json",
    },
  })

  if (!resp.ok) {
    throw new Error(`Error al obtener código de persona: ${resp.status}`)
  }

  const data = await resp.json()
  return { codigoPersona: data?.codigoPersona || null }
}

async function consultarEstadoTributarioPersona(codigoPersona: string, jwt: string) {
  const url = `${SRI_ESTADO_TRIBUTARIO_BASE}/persona/${codigoPersona}`

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Connection": "keep-alive",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Referer": RECAPTCHA_PAGE_URL,
    "Origin": SRI_CAPTCHA_BASE,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Authorization": jwt,
  }

  const resp = await fetch(url, {
    method: "GET",
    headers,
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Error HTTP al consultar estado tributario: ${resp.status} - ${txt.substring(0, 500)}`)
  }

  return await resp.json()
}

serve(async (req) => {
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

    let ruc: string | undefined
    try {
      const body = await req.json()
      if (body && typeof body.ruc === "string") {
        ruc = body.ruc.trim()
      }
    } catch {
      // si no hay body o es inválido, lo manejamos abajo
    }

    if (!ruc) {
      return new Response(
        JSON.stringify({ success: false, error: "RUC es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // 1) Resolver reCAPTCHA con Playwright
    const { captchaToken, cookieHeader } = await resolverRecaptchaConPlaywright()

    // 2) Obtener JWT desde el SRI
    const jwt = await obtenerJwtDesdeSRI(captchaToken, cookieHeader)

    // 3) Obtener código de persona
    const personaData = await obtenerCodigoPersonaDesdeRuc(ruc)
    const codigoPersona = personaData.codigoPersona

    if (!codigoPersona) {
      return new Response(
        JSON.stringify({ success: false, error: "No se encontró código de persona para el RUC proporcionado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // 4) Consultar estado tributario
    const estadoTributario = await consultarEstadoTributarioPersona(codigoPersona, jwt)

    return new Response(
      JSON.stringify({
        success: true,
        ruc,
        codigoPersona,
        estadoTributario,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error en estado-tributario-playwright:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error interno resolviendo reCAPTCHA con Playwright",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})

