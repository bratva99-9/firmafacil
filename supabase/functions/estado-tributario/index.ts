import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración AntiCaptcha (poner la API key como Secret en Supabase)
const ANTICAPTCHA_API_KEY = Deno.env.get('ANTICAPTCHA_API_KEY') || ''
// Configuración 2Captcha (alternativa a AntiCaptcha, a veces funciona mejor)
const TWOCAPTCHA_API_KEY = Deno.env.get('TWOCAPTCHA_API_KEY') || ''
// Configuración CapSolver (otra alternativa, a veces más efectiva)
const CAPSOLVER_API_KEY = Deno.env.get('CAPSOLVER_API_KEY') || ''
// Configuración ScrapingBee (alternativa con navegador real)
const SCRAPINGBEE_API_KEY = Deno.env.get('SCRAPINGBEE_API_KEY') || ''
// Configuración ScraperAPI (alternativa con mejor soporte de captcha)
const SCRAPER_API_KEY = Deno.env.get('SCRAPER_API_KEY') || ''

// Datos fijos del reCAPTCHA de Estado Tributario
const RECAPTCHA_SITE_KEY = "6LemEY4UAAAAAHVQd7ZyoCoqBKNoWrcUO4b5H-SP"
const RECAPTCHA_PAGE_URL =
  "https://srienlinea.sri.gob.ec/sri-en-linea/SriDeclaracionesWeb/EstadoTributario/Consultas/consultaEstadoTributario"

// Base URL SRI para captcha, catastro, estado tributario y detalle de deudas
const SRI_CAPTCHA_BASE = "https://srienlinea.sri.gob.ec"
const SRI_CAPTCHA_VALIDATE_PATH =
  "/sri-captcha-servicio-internet/rest/ValidacionCaptcha/validarGoogleReCaptcha"
const SRI_ESTADO_TRIBUTARIO_BASE =
  "https://srienlinea.sri.gob.ec/sri-estado-tributario-internet/rest/estado-tributario/consulta"
const SRI_PERSONA_POR_IDENT_URL =
  "https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/Persona/obtenerPorTipoIdentificacion"
const SRI_DEUDAS_DETALLE_URL =
  "https://srienlinea.sri.gob.ec/sri-deudas-servicio-internet/rest/ResumenDeudor/obtenerDetalleDeudas"

// Helper: esperar X ms
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function resolverRecaptcha() {
  // Si solo tenemos ScrapingBee, intentar usarlo para todo el proceso
  if (SCRAPINGBEE_API_KEY && !ANTICAPTCHA_API_KEY && !TWOCAPTCHA_API_KEY && !CAPSOLVER_API_KEY) {
    console.log("🌐 Usando SOLO ScrapingBee para todo el proceso...")
    return await resolverRecaptchaSoloScrapingBee()
  }
  
  // Prioridad 1: Intentar con 2Captcha primero (recomendado por el usuario)
  if (TWOCAPTCHA_API_KEY) {
    console.log("🤖 Intentando con 2Captcha (prioridad)...")
    try {
      const resultado = await resolverRecaptchaCon2Captcha()
      
      // Si tenemos ScrapingBee, usarlo para validar el captcha con cookies legítimas
      if (SCRAPINGBEE_API_KEY) {
        console.log("🌐 Usando ScrapingBee para validar captcha con cookies legítimas...")
        try {
          const resultadoScrapingBee = await validarCaptchaConScrapingBee(resultado.captchaToken)
          return resultadoScrapingBee
        } catch (e: any) {
          // Si el error es que el SRI rechazó el token, no intentar método normal (fallará igual)
          if (e.message && e.message.includes('SRI rechazó el token')) {
            console.error("❌ ScrapingBee no pudo validar el captcha - SRI rechazó el token")
            throw e // Propagar el error en lugar de intentar método normal
          }
          
          console.warn("⚠️ ScrapingBee falló en validación, usando método normal:", e.message)
          return resultado
        }
      }
      
      return resultado
    } catch (e: any) {
      console.warn("⚠️ 2Captcha falló:", e.message)
      console.log("🔄 Intentando con método alternativo...")
    }
  }
  
  // Prioridad 2: Intentar primero con ScrapingBee si está configurado (mejor para evitar detección)
  if (SCRAPINGBEE_API_KEY) {
    console.log("🌐 Usando ScrapingBee para resolver captcha...")
    try {
      return await resolverRecaptchaConScrapingBee()
    } catch (e: any) {
      console.warn("⚠️ ScrapingBee falló:", e.message)
      console.log("🔄 Intentando con método alternativo...")
    }
  }
  
  // Prioridad 3: Intentar con CapSolver
  if (CAPSOLVER_API_KEY) {
    console.log("🤖 Intentando con CapSolver...")
    try {
      return await resolverRecaptchaConCapSolver()
    } catch (e: any) {
      console.warn("⚠️ CapSolver falló:", e.message)
      console.log("🔄 Intentando con AntiCaptcha...")
    }
  }
  
  // Fallback a AntiCaptcha si está configurado
  if (!ANTICAPTCHA_API_KEY) {
    throw new Error("Falta configurar al menos uno: TWOCAPTCHA_API_KEY, SCRAPINGBEE_API_KEY, CAPSOLVER_API_KEY o ANTICAPTCHA_API_KEY en Supabase")
  }
  
  console.log("🤖 Usando AntiCaptcha para resolver captcha...")
  
  // 1) Crear tarea en AntiCaptcha (equivalente a createTask del script PowerShell)
  const createTaskBody = {
    clientKey: ANTICAPTCHA_API_KEY,
    task: {
      type: "NoCaptchaTaskProxyless",
      websiteURL: RECAPTCHA_PAGE_URL,
      websiteKey: RECAPTCHA_SITE_KEY,
    },
  }

  const createResp = await fetch("https://api.anti-captcha.com/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createTaskBody),
  })

  if (!createResp.ok) {
    const text = await createResp.text()
    throw new Error(`Error HTTP al crear tarea AntiCaptcha: ${createResp.status} - ${text}`)
  }

  const createJson: any = await createResp.json()

  if (createJson.errorId && createJson.errorId !== 0) {
    throw new Error(
      `AntiCaptcha createTask error: ${createJson.errorCode || ""} ${createJson.errorDescription || ""}`,
    )
  }

  const taskId = createJson.taskId
  if (!taskId) {
    throw new Error("AntiCaptcha no devolvió taskId")
  }

  // 2) Esperar resultado (equivalente al bucle getTaskResult del PowerShell)
  const maxWaitMs = 2 * 60 * 1000 // 2 minutos máximo
  const start = Date.now()

  while (true) {
    if (Date.now() - start > maxWaitMs) {
      throw new Error("Timeout esperando resolución de reCAPTCHA en AntiCaptcha")
    }

    await delay(5000) // igual que Start-Sleep -Seconds 5

    const statusBody = {
      clientKey: ANTICAPTCHA_API_KEY,
      taskId,
    }

    const statusResp = await fetch("https://api.anti-captcha.com/getTaskResult", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(statusBody),
    })

    if (!statusResp.ok) {
      const text = await statusResp.text()
      throw new Error(`Error HTTP en getTaskResult: ${statusResp.status} - ${text}`)
    }

    const statusJson: any = await statusResp.json()

    if (statusJson.errorId && statusJson.errorId !== 0) {
      throw new Error(
        `AntiCaptcha getTaskResult error: ${statusJson.errorCode || ""} ${statusJson.errorDescription || ""}`,
      )
    }

    if (statusJson.status === "processing") {
      continue
    }

    if (statusJson.status === "ready") {
      const captchaToken = statusJson.solution?.gRecaptchaResponse
      if (!captchaToken) {
        throw new Error("AntiCaptcha devolvió status=ready pero sin gRecaptchaResponse")
      }

      console.log("✅ Captcha resuelto exitosamente")
      console.log("Token obtenido (longitud):", captchaToken.length)
      console.log("Token (primeros 100 chars):", captchaToken.substring(0, 100))
      console.log("Token (últimos 50 chars):", captchaToken.substring(captchaToken.length - 50))
      
      // Verificar que el token tenga el formato correcto (debe empezar con caracteres específicos)
      if (!captchaToken.startsWith("03") && !captchaToken.startsWith("04")) {
        console.warn("⚠️ Token del captcha puede tener formato inusual")
      }
      
      // Usar el token inmediatamente, sin delay adicional
      return { taskId, captchaToken, cookieHeader: '' }
    }

    // Estado inesperado
    throw new Error(`Estado desconocido en AntiCaptcha: ${statusJson.status}`)
  }
}

// Función para resolver captcha SOLO con ScrapingBee (sin servicios de captcha)
// IMPORTANTE: ScrapingBee NO puede resolver reCAPTCHA automáticamente
// Esta función intentará extraer el token del HTML si ya está resuelto
async function resolverRecaptchaSoloScrapingBee() {
  console.log("🌐 Usando SOLO ScrapingBee (sin servicios de captcha)...")
  console.log("⚠️ ADVERTENCIA: ScrapingBee no puede resolver reCAPTCHA automáticamente")
  console.log("⚠️ Esta función solo funcionará si el captcha ya está resuelto en la página")
  
  if (!SCRAPINGBEE_API_KEY) {
    throw new Error("SCRAPINGBEE_API_KEY es requerido")
  }
  
  // Intentar visitar la página y extraer el token si está disponible
  const params = new URLSearchParams({
    api_key: SCRAPINGBEE_API_KEY,
    url: RECAPTCHA_PAGE_URL,
    render_js: 'true',
    wait: '10000',
    wait_for: 'textarea[name="g-recaptcha-response"]',
    premium_proxy: 'true',
    country_code: 'ec',
  })
  
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`
  
  try {
    const response = await fetch(scrapingBeeUrl, {
      method: 'GET',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error en ScrapingBee: ${response.status} - ${errorText.substring(0, 200)}`)
    }
    
    const html = await response.text()
    console.log("✅ HTML recibido (longitud):", html.length)
    
    // Intentar extraer el token del captcha del HTML
    let captchaToken: string | null = null
    const textareaMatch = html.match(/<textarea[^>]*name=["']g-recaptcha-response["'][^>]*>([^<]+)<\/textarea>/i)
    
    if (textareaMatch && textareaMatch[1] && textareaMatch[1].trim().length > 100) {
      captchaToken = textareaMatch[1].trim()
      console.log("✅ Token encontrado en HTML (longitud):", captchaToken.length)
    }
    
    if (!captchaToken) {
      throw new Error(`ScrapingBee no puede resolver reCAPTCHA automáticamente. El captcha requiere resolución manual o un servicio especializado.

SOLUCIONES:
1. Configura ANTICAPTCHA_API_KEY para resolver el captcha automáticamente
2. O configura TWOCAPTCHA_API_KEY como alternativa
3. ScrapingBee se usará para obtener cookies legítimas y hacer peticiones desde Ecuador

Sin un servicio de resolución de captcha, esta función no puede continuar.`)
    }
    
    const cookies = response.headers.get('set-cookie') || ''
    
    // Usar ScrapingBee para validar el captcha directamente
    const validateUrl = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}?googleCaptchaResponse=${encodeURIComponent(captchaToken)}&emitirToken=true`
    
    const params2 = new URLSearchParams({
      api_key: SCRAPINGBEE_API_KEY,
      url: validateUrl,
      render_js: 'false',
      premium_proxy: 'true',
      country_code: 'ec',
    })
    
    const scrapingBeeUrl2 = `https://app.scrapingbee.com/api/v1/?${params2.toString()}`
    const response2 = await fetch(scrapingBeeUrl2, {
      method: 'GET',
    })
    
    if (response2.ok) {
      const responseText = await response2.text()
      try {
        const json = JSON.parse(responseText)
        const jwt = json.jwt || json.token || json.idToken || json.jws || null
        
        if (jwt) {
          console.log("✅ JWT obtenido directamente de ScrapingBee")
          return {
            taskId: 'scrapingbee-solo-' + Date.now(),
            captchaToken: captchaToken,
            cookieHeader: cookies,
            jwtFromScrapingBee: jwt,
            rawResponse: json,
          }
        }
      } catch (e) {
        // Continuar con método normal
      }
    }
    
    return {
      taskId: 'scrapingbee-solo-' + Date.now(),
      captchaToken: captchaToken,
      cookieHeader: cookies,
    }
    
  } catch (e: any) {
    throw new Error(`Error en resolverRecaptchaSoloScrapingBee: ${e.message}`)
  }
}

// Nueva función para resolver captcha con ScrapingBee + AntiCaptcha
// Estrategia mejorada: 
// 1. Resolver el captcha con AntiCaptcha
// 2. Usar ScrapingBee para hacer la petición de validación del captcha directamente al SRI
//    Esto mantiene la misma IP/sesión y hace que el SRI acepte el token
async function resolverRecaptchaConScrapingBee() {
  console.log("🌐 Usando combinación ScrapingBee + AntiCaptcha...")
  
  if (!ANTICAPTCHA_API_KEY) {
    throw new Error("ScrapingBee requiere ANTICAPTCHA_API_KEY para resolver el captcha")
  }
  
  // 1) Resolver el captcha con AntiCaptcha primero
  console.log("🤖 Resolviendo captcha con AntiCaptcha...")
  const anticaptchaResult = await resolverRecaptchaConAntiCaptcha()
  const captchaToken = anticaptchaResult.captchaToken
  
  // 2) Usar ScrapingBee para hacer la petición de validación del captcha directamente al SRI
  // Esto mantiene la misma IP (Ecuador) y hace que el SRI acepte el token
  console.log("🌐 Usando ScrapingBee para validar captcha en SRI (misma IP/sesión)...")
  
  const validateUrl = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}?googleCaptchaResponse=${encodeURIComponent(captchaToken)}&emitirToken=true`
  
  const params = new URLSearchParams({
    api_key: SCRAPINGBEE_API_KEY,
    url: validateUrl,
    render_js: 'false', // No necesitamos JS para esta petición API
    premium_proxy: 'true',
    country_code: 'ec', // Proxy desde Ecuador
  })
  
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`
  
  try {
    const response = await fetch(scrapingBeeUrl, {
      method: 'GET',
    })
    
    if (response.ok) {
      const responseText = await response.text()
      console.log("✅ Respuesta recibida de ScrapingBee (longitud):", responseText.length)
      
      // Intentar parsear como JSON
      try {
        const json = JSON.parse(responseText)
        console.log("✅ Respuesta JSON del SRI obtenida vía ScrapingBee")
        
        // Si el SRI devolvió un JWT, lo retornamos directamente
        const jwt = json.jwt || json.token || json.idToken || json.jws || null
        
        if (jwt) {
          console.log("✅ JWT obtenido directamente de ScrapingBee")
          // Retornar con un flag especial para indicar que ya tenemos el JWT
          return {
            taskId: anticaptchaResult.taskId,
            captchaToken: captchaToken,
            cookieHeader: '',
            jwtFromScrapingBee: jwt,
            rawResponse: json,
          }
        } else {
          console.log("⚠️ SRI no devolvió JWT en la respuesta")
          // Si no hay JWT pero la respuesta fue exitosa, continuar con el método normal
          const cookies = response.headers.get('set-cookie') || ''
          return {
            taskId: anticaptchaResult.taskId,
            captchaToken: captchaToken,
            cookieHeader: cookies,
          }
        }
      } catch (e) {
        console.log("⚠️ Respuesta no es JSON válido, continuando con método normal")
        const cookies = response.headers.get('set-cookie') || ''
        return {
          taskId: anticaptchaResult.taskId,
          captchaToken: captchaToken,
          cookieHeader: cookies,
        }
      }
    } else {
      const errorText = await response.text()
      console.warn("⚠️ ScrapingBee falló (status:", response.status, "), usando método normal")
      console.warn("Error:", errorText.substring(0, 200))
      // Si ScrapingBee falla, usar método normal
      return anticaptchaResult
    }
  } catch (e: any) {
    console.warn("⚠️ Error usando ScrapingBee:", e.message)
    console.warn("Continuando con método normal...")
    return anticaptchaResult
  }
}

// Función auxiliar para resolver con CapSolver (alternativa moderna y efectiva)
async function resolverRecaptchaConCapSolver() {
  if (!CAPSOLVER_API_KEY) {
    throw new Error("Falta configurar CAPSOLVER_API_KEY")
  }

  console.log("🤖 Resolviendo captcha con CapSolver...")
  
  // 1) Crear tarea en CapSolver
  const createTaskBody = {
    clientKey: CAPSOLVER_API_KEY,
    task: {
      type: "ReCaptchaV2TaskProxyLess",
      websiteURL: RECAPTCHA_PAGE_URL,
      websiteKey: RECAPTCHA_SITE_KEY,
    },
  }

  const createResp = await fetch("https://api.capsolver.com/createTask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createTaskBody),
  })

  if (!createResp.ok) {
    const text = await createResp.text()
    throw new Error(`Error HTTP al crear tarea CapSolver: ${createResp.status} - ${text}`)
  }

  const createJson: any = await createResp.json()

  if (createJson.errorId && createJson.errorId !== 0) {
    throw new Error(`CapSolver createTask error: ${createJson.errorCode || ""} ${createJson.errorDescription || ""}`)
  }

  const taskId = createJson.taskId
  if (!taskId) {
    throw new Error("CapSolver no devolvió taskId")
  }

  // 2) Esperar resultado
  const maxWaitMs = 2 * 60 * 1000
  const start = Date.now()

  while (true) {
    if (Date.now() - start > maxWaitMs) {
      throw new Error("Timeout esperando resolución de reCAPTCHA en CapSolver")
    }

    await delay(5000)

    const statusBody = {
      clientKey: CAPSOLVER_API_KEY,
      taskId,
    }

    const statusResp = await fetch("https://api.capsolver.com/getTaskResult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statusBody),
    })

    if (!statusResp.ok) {
      const text = await statusResp.text()
      throw new Error(`Error HTTP en getTaskResult: ${statusResp.status} - ${text}`)
    }

    const statusJson: any = await statusResp.json()

    if (statusJson.errorId && statusJson.errorId !== 0) {
      throw new Error(`CapSolver getTaskResult error: ${statusJson.errorCode || ""} ${statusJson.errorDescription || ""}`)
    }

    if (statusJson.status === "processing") {
      continue
    }

    if (statusJson.status === "ready") {
      const captchaToken = statusJson.solution?.gRecaptchaResponse
      if (!captchaToken) {
        throw new Error("CapSolver devolvió status=ready pero sin gRecaptchaResponse")
      }

      console.log("✅ Captcha resuelto con CapSolver")
      console.log("Token obtenido (longitud):", captchaToken.length)
      
      return { taskId, captchaToken, cookieHeader: '' }
    }

    throw new Error(`Estado desconocido en CapSolver: ${statusJson.status}`)
  }
}

// Función auxiliar para resolver con 2Captcha (alternativa a AntiCaptcha)
async function resolverRecaptchaCon2Captcha() {
  if (!TWOCAPTCHA_API_KEY) {
    throw new Error("Falta configurar TWOCAPTCHA_API_KEY")
  }

  console.log("🤖 Resolviendo captcha con 2Captcha...")
  
  // 1) Enviar captcha a 2Captcha
  const inParams = new URLSearchParams({
    key: TWOCAPTCHA_API_KEY,
    method: 'userrecaptcha',
    googlekey: RECAPTCHA_SITE_KEY,
    pageurl: RECAPTCHA_PAGE_URL,
    json: '1'
  })

  const inResp = await fetch(`http://2captcha.com/in.php?${inParams.toString()}`, {
    method: 'POST',
  })

  if (!inResp.ok) {
    throw new Error(`Error HTTP al enviar captcha a 2Captcha: ${inResp.status}`)
  }

  const inJson: any = await inResp.json()
  
  if (inJson.status !== 1) {
    throw new Error(`2Captcha in.php error: ${inJson.request || 'Unknown error'}`)
  }

  const taskId = inJson.request
  console.log("✅ Captcha enviado a 2Captcha, taskId:", taskId)

  // 2) Esperar resultado
  const maxWaitMs = 2 * 60 * 1000
  const start = Date.now()

  while (true) {
    if (Date.now() - start > maxWaitMs) {
      throw new Error("Timeout esperando resolución de reCAPTCHA en 2Captcha")
    }

    // Reducir delay a 3 segundos para usar el token más rápido
    await delay(3000)

    const resParams = new URLSearchParams({
      key: TWOCAPTCHA_API_KEY,
      action: 'get',
      id: taskId,
      json: '1'
    })

    const resResp = await fetch(`http://2captcha.com/res.php?${resParams.toString()}`)
    
    if (!resResp.ok) {
      const text = await resResp.text()
      throw new Error(`Error HTTP en res.php: ${resResp.status} - ${text}`)
    }

    const resJson: any = await resResp.json()

    if (resJson.status === 0) {
      if (resJson.request === 'CAPCHA_NOT_READY') {
        continue
      }
      throw new Error(`2Captcha res.php error: ${resJson.request || 'Unknown error'}`)
    }

    if (resJson.status === 1) {
      const captchaToken = resJson.request
      if (!captchaToken) {
        throw new Error("2Captcha devolvió status=1 pero sin token")
      }

      console.log("✅ Captcha resuelto con 2Captcha")
      console.log("Token obtenido (longitud):", captchaToken.length)
      console.log("⏱️ Timestamp de obtención:", Date.now())
      console.log("⚠️ IMPORTANTE: Usar token INMEDIATAMENTE (expira en ~2 minutos)")
      
      return { taskId, captchaToken, cookieHeader: '', timestamp: Date.now() }
    }

    throw new Error(`Estado desconocido en 2Captcha: ${resJson.status}`)
  }
}

// Función auxiliar para validar captcha con ScrapingBee (usar después de resolver con 2Captcha)
// IMPORTANTE: Usar el token inmediatamente después de obtenerlo (expira en ~2 minutos)
async function validarCaptchaConScrapingBee(captchaToken: string) {
  if (!SCRAPINGBEE_API_KEY) {
    throw new Error("SCRAPINGBEE_API_KEY es requerido")
  }
  
  console.log("🌐 Usando ScrapingBee para validar captcha con cookies legítimas desde Ecuador...")
  const tokenTimestamp = Date.now()
  console.log("⏱️ Iniciando validación INMEDIATAMENTE (timestamp:", tokenTimestamp, ")")
  
  // IMPORTANTE: Validar el token inmediatamente, sin delays adicionales
  // El token de reCAPTCHA expira en ~2 minutos, cada segundo cuenta
  console.log("🌐 Validando captcha directamente con ScrapingBee (sin obtener cookies primero para ahorrar tiempo)...")
  const validateUrl = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}?googleCaptchaResponse=${encodeURIComponent(captchaToken)}&emitirToken=true`
  
  const params2 = new URLSearchParams({
    api_key: SCRAPINGBEE_API_KEY,
    url: validateUrl,
    render_js: 'false',
    premium_proxy: 'true',
    country_code: 'ec',
  })
  
  const scrapingBeeUrl2 = `https://app.scrapingbee.com/api/v1/?${params2.toString()}`
  
  const tiempoAntesValidacion = Date.now()
  const tiempoTranscurrido = tiempoAntesValidacion - tokenTimestamp
  console.log("⏱️ Tiempo transcurrido desde obtención del token:", tiempoTranscurrido, "ms")
  
  if (tiempoTranscurrido > 30000) {
    console.warn("⚠️ ADVERTENCIA: Han pasado más de 30 segundos desde obtener el token")
    console.warn("⚠️ El token puede estar expirando (expira en ~2 minutos)")
  }
  
  const response2 = await fetch(scrapingBeeUrl2, {
    method: 'GET',
  })
  
  const tiempoDespuesValidacion = Date.now()
  const tiempoTotalValidacion = tiempoDespuesValidacion - tiempoAntesValidacion
  const tiempoTotalDesdeToken = tiempoDespuesValidacion - tokenTimestamp
  console.log("⏱️ Tiempo de validación con ScrapingBee:", tiempoTotalValidacion, "ms")
  console.log("⏱️ Tiempo total desde obtener token:", tiempoTotalDesdeToken, "ms")
  
  if (response2.ok) {
    const responseText = await response2.text()
    console.log("✅ Respuesta recibida de ScrapingBee (longitud):", responseText.length)
    console.log("📄 Respuesta completa:", responseText.substring(0, 500))
    
    try {
      const json = JSON.parse(responseText)
      console.log("✅ Respuesta JSON parseada correctamente")
      
      // Verificar si hay error en la respuesta
      if (json.mensaje) {
        const mensajeStr = typeof json.mensaje === 'string' ? json.mensaje : JSON.stringify(json.mensaje)
        if (mensajeStr.includes('INVALID_REASON_UNSPECIFIED')) {
          console.error("❌ SRI rechazó el token incluso usando ScrapingBee")
          console.error("⏱️ Tiempo total desde obtener token:", tiempoDespuesValidacion - tokenTimestamp, "ms")
          console.error("💡 Posibles causas:")
          console.error("   1. Token expirado (aunque debería ser válido)")
          console.error("   2. SRI detectó automatización (token de 2Captcha)")
          console.error("   3. Cookies de sesión no sincronizadas")
          console.error("   4. IP de ScrapingBee está en lista negra del SRI")
        }
      }
      
      const jwt = json.jwt || json.token || json.idToken || json.jws || null
      
      if (jwt) {
        console.log("✅ JWT obtenido directamente de ScrapingBee")
        const cookies = response2.headers.get('set-cookie') || ''
        return {
          taskId: '2captcha-scrapingbee-' + Date.now(),
          captchaToken: captchaToken,
          cookieHeader: cookies,
          jwtFromScrapingBee: jwt,
          rawResponse: json,
        }
      } else {
        // Si el SRI rechazó el token, lanzar error en lugar de retornar resultado normal
        // porque si retornamos resultado normal, se intentará validar desde Supabase y fallará
        if (json.mensaje) {
          const mensajeStr = typeof json.mensaje === 'string' ? json.mensaje : JSON.stringify(json.mensaje)
          if (mensajeStr.includes('INVALID_REASON_UNSPECIFIED')) {
            throw new Error(`El SRI rechazó el token del captcha incluso usando ScrapingBee desde Ecuador. 
            
Esto puede significar que:
1. El SRI detectó que el token viene de un servicio automatizado (2Captcha)
2. El token está expirado (aunque debería ser válido)
3. El SRI cambió su validación y ahora rechaza tokens de servicios automatizados

Respuesta del SRI: ${mensajeStr}`)
          }
        }
        
        console.warn("⚠️ SRI no devolvió JWT en la respuesta")
        console.warn("Respuesta completa:", JSON.stringify(json, null, 2))
        
        // Si no hay JWT pero tampoco hay error explícito, retornar resultado para intentar método normal
        const cookies = response2.headers.get('set-cookie') || ''
        return {
          taskId: '2captcha-scrapingbee-' + Date.now(),
          captchaToken: captchaToken,
          cookieHeader: cookies,
        }
      }
    } catch (e: any) {
      // Si es un error que lanzamos nosotros (INVALID_REASON_UNSPECIFIED), propagarlo
      if (e.message && e.message.includes('SRI rechazó el token')) {
        throw e
      }
      
      console.warn("⚠️ Error parseando respuesta JSON:", e.message)
      console.warn("Respuesta raw:", responseText.substring(0, 500))
      
      // Si no podemos parsear, retornar resultado para intentar método normal
      const cookies = response2.headers.get('set-cookie') || ''
      return {
        taskId: '2captcha-scrapingbee-' + Date.now(),
        captchaToken: captchaToken,
        cookieHeader: cookies,
      }
    }
  }
  
  // Si ScrapingBee devuelve error HTTP, lanzar error
  const errorText = await response2.text()
  throw new Error(`ScrapingBee falló al validar captcha: ${response2.status} - ${errorText.substring(0, 200)}`)
}

// Función auxiliar para resolver con AntiCaptcha (extraída de la función original)
async function resolverRecaptchaConAntiCaptcha() {
  if (!ANTICAPTCHA_API_KEY) {
    throw new Error("Falta configurar ANTICAPTCHA_API_KEY")
  }

  const createTaskBody = {
    clientKey: ANTICAPTCHA_API_KEY,
    task: {
      type: "NoCaptchaTaskProxyless",
      websiteURL: RECAPTCHA_PAGE_URL,
      websiteKey: RECAPTCHA_SITE_KEY,
    },
  }

  const createResp = await fetch("https://api.anti-captcha.com/createTask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createTaskBody),
  })

  if (!createResp.ok) {
    const text = await createResp.text()
    throw new Error(`Error HTTP al crear tarea AntiCaptcha: ${createResp.status} - ${text}`)
  }

  const createJson: any = await createResp.json()

  if (createJson.errorId && createJson.errorId !== 0) {
    throw new Error(`AntiCaptcha createTask error: ${createJson.errorCode || ""} ${createJson.errorDescription || ""}`)
  }

  const taskId = createJson.taskId
  if (!taskId) {
    throw new Error("AntiCaptcha no devolvió taskId")
  }

  const maxWaitMs = 2 * 60 * 1000
  const start = Date.now()

  while (true) {
    if (Date.now() - start > maxWaitMs) {
      throw new Error("Timeout esperando resolución de reCAPTCHA en AntiCaptcha")
    }

    await delay(5000)

    const statusBody = {
      clientKey: ANTICAPTCHA_API_KEY,
      taskId,
    }

    const statusResp = await fetch("https://api.anti-captcha.com/getTaskResult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statusBody),
    })

    if (!statusResp.ok) {
      const text = await statusResp.text()
      throw new Error(`Error HTTP en getTaskResult: ${statusResp.status} - ${text}`)
    }

    const statusJson: any = await statusResp.json()

    if (statusJson.errorId && statusJson.errorId !== 0) {
      throw new Error(`AntiCaptcha getTaskResult error: ${statusJson.errorCode || ""} ${statusJson.errorDescription || ""}`)
    }

    if (statusJson.status === "processing") {
      continue
    }

    if (statusJson.status === "ready") {
      const captchaToken = statusJson.solution?.gRecaptchaResponse
      if (!captchaToken) {
        throw new Error("AntiCaptcha devolvió status=ready pero sin gRecaptchaResponse")
      }

      console.log("✅ Captcha resuelto con AntiCaptcha")
      console.log("Token obtenido (longitud):", captchaToken.length)
      
      return { taskId, captchaToken, cookieHeader: '' }
    }

    throw new Error(`Estado desconocido en AntiCaptcha: ${statusJson.status}`)
  }
}

// 2) Validar el captcha en el SRI y obtener el JWT/JWS (segunda parte de tu script PowerShell)
async function obtenerJwtDesdeSRI(captchaToken: string, cookieHeaderFromScraping?: string) {
  // 1) Visitar primero el sitio del SRI para obtener cookies de sesión (equivalente a copiar las cookies del navegador)
  const baseHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  }

  let cookieHeader = cookieHeaderFromScraping || ""

  // Si ya tenemos cookies de ScrapingBee, usarlas directamente
  if (cookieHeaderFromScraping) {
    cookieHeader = cookieHeaderFromScraping
    console.log("✅ Usando cookies de ScrapingBee")
  } else {
    // Si no, obtener cookies visitando el SRI
    try {
      const sessionResp = await fetch(SRI_CAPTCHA_BASE, {
        method: "GET",
        headers: {
          ...baseHeaders,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      })

      const setCookieHeaders: string[] = []
      for (const [key, value] of sessionResp.headers.entries()) {
        if (key.toLowerCase() === "set-cookie") {
          setCookieHeaders.push(value)
        }
      }

      if (setCookieHeaders.length > 0) {
        const cookies = setCookieHeaders.map((c) => c.trim().split(";")[0])
        cookieHeader = cookies.join("; ")
        console.log("Cookies SRI captcha obtenidas:", setCookieHeaders.length, "cookies")
        console.log("Cookies (primeros 150 chars):", cookieHeader.substring(0, 150) + "...")
      }

      // Delay mínimo solo si no hay cookies (para dar tiempo de establecer sesión)
      if (!cookieHeader) {
        await delay(500)
      }
    } catch (e: any) {
      console.log("⚠️ No se pudieron obtener cookies iniciales del SRI (captcha):", e.message)
      // seguimos sin cookies; a veces igual funciona
    }
  }

  // 2) Validar captcha con SRI - Intentar múltiples métodos
  // IMPORTANTE: El token debe ser usado inmediatamente y codificado correctamente
  // El SRI espera el token exactamente como viene de Google reCAPTCHA
  
  // Estrategia: Intentar primero con GET, luego con POST si falla
  const urlGet = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}?googleCaptchaResponse=${encodeURIComponent(captchaToken)}&emitirToken=true`
  const urlPost = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}`
  
  console.log("URL GET (primeros 200 chars):", urlGet.substring(0, 200) + "...")
  console.log("Token completo (para debug):", captchaToken)
  console.log("Token codificado (primeros 100 chars):", encodeURIComponent(captchaToken).substring(0, 100))
  
  // Headers para GET - Simular EXACTAMENTE un navegador Chrome (basado en petición real exitosa)
  const headersGet: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Referer": RECAPTCHA_PAGE_URL,
    "Origin": SRI_CAPTCHA_BASE,
    "Connection": "keep-alive",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "Sat, 01 Jan 2000 00:00:00 GMT",
    "If-Modified-Since": "0",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
  }

  // Headers para POST
  const headersPost: Record<string, string> = {
    ...headersGet,
    "Content-Type": "application/json",
  }

  if (cookieHeader) {
    headersGet["Cookie"] = cookieHeader
    headersPost["Cookie"] = cookieHeader
  }
  
  // Usar el token inmediatamente después de obtenerlo
  console.log("Validando captcha con SRI (intentando múltiples métodos)...")
  console.log("Token captcha (longitud):", captchaToken.length)
  console.log("Token captcha (primeros 50 chars):", captchaToken.substring(0, 50) + "...")
  console.log("Cookies incluidas:", cookieHeader ? "Sí" : "No")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    // Método 1: Intentar con GET primero
    console.log("🔄 Intentando validación con GET...")
    let resp = await fetch(urlGet, {
      method: "GET",
      headers: headersGet,
      signal: controller.signal,
      redirect: "manual",
    })
    
    console.log("GET response status:", resp.status)
    console.log("GET response headers:", Object.fromEntries(resp.headers.entries()))
    
    // Si hay redirect, seguirlo manualmente
    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get("location")
      if (location) {
        console.log("Redirect detectado a:", location)
        const redirectUrl = location.startsWith("http") ? location : `${SRI_CAPTCHA_BASE}${location}`
        const redirectResp = await fetch(redirectUrl, {
          method: "GET",
          headers: headersGet,
          signal: controller.signal,
          redirect: "follow",
        })
        clearTimeout(timeoutId)
        const newController = new AbortController()
        const newTimeoutId = setTimeout(() => newController.abort(), 30000)
        
        if (!redirectResp.ok) {
          const txt = await redirectResp.text()
          console.error("❌ Error después de redirect:", redirectResp.status, txt.substring(0, 500))
          throw new Error(`Error HTTP después de redirect: ${redirectResp.status} - ${txt.substring(0, 500)}`)
        }
        
        const json = await redirectResp.json()
        clearTimeout(newTimeoutId)
        return procesarRespuestaJWT(json)
      }
    }

    clearTimeout(timeoutId)

    // Leer el body una sola vez
    let responseText = ""
    let responseJson: any = null
    
    try {
      responseText = await resp.text()
      // Intentar parsear como JSON si es posible
      try {
        responseJson = JSON.parse(responseText)
      } catch {
        // No es JSON, está bien
      }
    } catch (e) {
      console.warn("⚠️ No se pudo leer el body de la respuesta")
    }

    // Si GET falla con 400 (INVALID_REASON_UNSPECIFIED), intentar con POST
    if (!resp.ok && resp.status === 400) {
      console.warn("⚠️ GET falló con 400, intentando con POST...")
      console.warn("Error GET:", responseText.substring(0, 200))
      
      // Intentar con POST
      try {
        const postBody = JSON.stringify({
          googleCaptchaResponse: captchaToken,
          emitirToken: true
        })
        
        const postResp = await fetch(urlPost, {
          method: "POST",
          headers: headersPost,
          body: postBody,
          signal: controller.signal,
          redirect: "follow",
        })
        
        console.log("POST response status:", postResp.status)
        
        if (postResp.ok) {
          const postJson = await postResp.json()
          console.log("✅ POST exitoso, JWT obtenido")
          return procesarRespuestaJWT(postJson)
        } else {
          const postTxt = await postResp.text()
          console.warn("⚠️ POST también falló:", postResp.status, postTxt.substring(0, 200))
        }
      } catch (postErr: any) {
        console.warn("⚠️ Error en POST:", postErr.message)
      }
    }

    if (!resp.ok) {
      console.error("❌ Error del SRI al validar captcha:")
      console.error("Status:", resp.status)
      console.error("Status Text:", resp.statusText)
      console.error("Response:", responseText.substring(0, 1000))
      console.error("Headers recibidos:", Object.fromEntries(resp.headers.entries()))
      console.error("Token usado (primeros 100 chars):", captchaToken.substring(0, 100))
      
      // Si es 405, el método HTTP es incorrecto
      if (resp.status === 405) {
        throw new Error(`Error HTTP 405: Método no permitido. El endpoint puede haber cambiado. Response: ${responseText.substring(0, 500)}`)
      }
      
      // Si es 400 con INVALID_REASON_UNSPECIFIED, dar más información
      if (resp.status === 400 && responseText.includes('INVALID_REASON_UNSPECIFIED')) {
        const errorMsg = `Error HTTP 400: El SRI está rechazando el token del captcha. Esto generalmente significa que:
1. El token está expirado (los tokens de reCAPTCHA expiran en ~2 minutos)
2. El SRI está detectando que el token viene de un servicio automatizado
3. El token no está siendo usado desde la misma IP/sesión que lo generó

SOLUCIONES RECOMENDADAS (en orden de efectividad):
1. CapSolver (más moderno y efectivo): configura CAPSOLVER_API_KEY
   - Registro: https://capsolver.com
   - A veces funciona mejor que AntiCaptcha con el SRI

2. 2Captcha (alternativa probada): configura TWOCAPTCHA_API_KEY
   - Registro: https://2captcha.com
   - A veces funciona mejor que AntiCaptcha

3. Usar ScrapingBee + AntiCaptcha (ya implementado)
   - ScrapingBee obtiene cookies legítimas desde Ecuador
   - AntiCaptcha resuelve el captcha
   - La combinación reduce la detección

4. Proxy residencial de Ecuador
   - Bright Data, Oxylabs, Smartproxy
   - Más difícil de detectar que proxies de datacenter

Response: ${responseText.substring(0, 500)}`
        throw new Error(errorMsg)
      }
      
      throw new Error(`Error HTTP al validar captcha en SRI: ${resp.status} - ${responseText.substring(0, 500)}`)
    }

    // Si tenemos JSON parseado, usarlo; si no, intentar parsear de nuevo
    if (responseJson) {
      return procesarRespuestaJWT(responseJson)
    } else {
      // Si no se pudo parsear antes, intentar de nuevo (aunque esto no debería pasar)
      try {
        const json = JSON.parse(responseText)
        return procesarRespuestaJWT(json)
      } catch {
        throw new Error(`Error: No se pudo parsear la respuesta del SRI como JSON. Response: ${responseText.substring(0, 500)}`)
      }
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("Timeout al validar el captcha en el SRI")
    }
    throw err
  }
}

// Función auxiliar para procesar la respuesta JWT del SRI
function procesarRespuestaJWT(json: any) {
  console.log("✅ Respuesta del SRI al validar captcha:", JSON.stringify(json).substring(0, 500))
  
  // Normalmente el JWT viene en una propiedad tipo "token" o "jwt". Ajustamos de forma flexible.
  const jwt =
    json.jwt ||
    json.token ||
    json.idToken ||
    json.jws ||
    json?.respuesta || // por si lo devuelven así
    json?.mensaje?.jwt || // por si viene anidado en mensaje
    json?.mensaje?.token ||
    null

  if (!jwt) {
    // No consideramos esto como error fatal para poder ver el JSON completo en el frontend
    console.log("⚠️ SRI no devolvió JWT/JWS reconocible. Respuesta completa:", JSON.stringify(json, null, 2))
    return {
      jwt: null,
      raw: json,
      warning: "El SRI no devolvió un token JWT/JWS reconocible al validar el captcha",
    }
  }

  return { jwt, raw: json }
}

// 3) Consultar el estado tributario usando el código de persona + JWT (tercera parte PowerShell)
async function consultarEstadoTributarioPersona(codigoPersona: string, jwt: string | null) {
  if (!codigoPersona || !/^\d+$/.test(codigoPersona)) {
    throw new Error("Código de persona inválido. Debe ser numérico.")
  }

  if (!jwt) {
    throw new Error("No se recibió un token JWT válido para consultar el estado tributario")
  }

  const url = `${SRI_ESTADO_TRIBUTARIO_BASE}/persona/${codigoPersona}`

  // Headers exactos de la petición exitosa del navegador
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-US,es-419;q=0.9,es;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Connection": "keep-alive",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "Sat, 01 Jan 2000 00:00:00 GMT",
    "If-Modified-Since": "0",
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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeoutId)

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(
        `Error HTTP al consultar estado tributario: ${resp.status} - ${txt.substring(0, 500)}`,
      )
    }

    const json = await resp.json()
    return json
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("Timeout al consultar el estado tributario en el SRI")
    }
    throw err
  }
}

// 4) Obtener código de persona a partir del RUC
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

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeoutId)

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(
        `Error HTTP al obtener código de persona: ${resp.status} - ${txt.substring(0, 500)}`,
      )
    }

    const json: any = await resp.json()

    // Intentar campo directo esperado
    let codigo: string | null =
      json?.codigoPersona ||
      json?.codigo ||
      null

    // Si no está claro, intentar buscar una propiedad que parezca código de persona
    if (!codigo && json && typeof json === "object") {
      for (const [k, v] of Object.entries(json)) {
        if (
          typeof v === "string" &&
          /codigo.*persona/i.test(k) &&
          /^\d+$/.test(v.trim())
        ) {
          codigo = v.trim()
          break
        }
      }
    }

    if (!codigo) {
      console.log("Respuesta completa Persona/obtenerPorTipoIdentificacion:", JSON.stringify(json, null, 2))
      throw new Error("No se pudo determinar el código de persona a partir del RUC")
    }

    return { codigoPersona: codigo, raw: json }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("Timeout al obtener código de persona desde el SRI")
    }
    throw err
  }
}

// 5) Consultar detalle de deudas tributarias (deudas firmes) para la persona
async function consultarDetalleDeudas(
  codigoPersona: string,
  jwt: string | null,
  tipoDeuda: string = "FIR",
  tipoConsulta: string = "C",
) {
  const limpio = String(codigoPersona ?? "").trim()
  if (!/^\d+$/.test(limpio)) {
    throw new Error("Código de persona inválido para detalle de deudas")
  }

  if (!jwt) {
    throw new Error("No se recibió un token JWT válido para consultar detalle de deudas")
  }

  const params = new URLSearchParams({
    codigoPersona: limpio,
    tipoDeuda,
    tipoConsulta,
  })

  const url = `${SRI_DEUDAS_DETALLE_URL}?${params.toString()}`

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    Accept: "application/json, text/plain, */*",
    Authorization: jwt,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeoutId)

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(
        `Error HTTP al consultar detalle de deudas: ${resp.status} - ${txt.substring(0, 500)}`,
      )
    }

    // La API suele devolver un objeto JSON (puede incluir arreglos de deudas)
    const json = await resp.json()
    return json
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("Timeout al consultar detalle de deudas en el SRI")
    }
    throw err
  }
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

    // Cuerpo: { ruc: string }
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

    // 0) Obtener código de persona desde el RUC
    const personaData = await obtenerCodigoPersonaDesdeRuc(ruc)
    const codigoPersona = personaData.codigoPersona

    // 1) Resolver reCAPTCHA y obtener token
    const resultado = await resolverRecaptcha()

    // 2) Obtener JWT/JWS desde el SRI (validar captcha)
    // Si ScrapingBee ya obtuvo el JWT directamente, usarlo
    let jwtFinal: string | null = null
    let jwtRaw: any = null
    
    if ((resultado as any).jwtFromScrapingBee) {
      console.log("✅ Usando JWT obtenido directamente de ScrapingBee")
      jwtFinal = (resultado as any).jwtFromScrapingBee
      jwtRaw = (resultado as any).rawResponse || null
    } else {
      // Si no, obtener JWT del SRI normalmente
      const jwtData = await obtenerJwtDesdeSRI(resultado.captchaToken, resultado.cookieHeader)
      jwtRaw = jwtData.raw
      
      // Tomar el JWT final: o bien el campo directo, o el que viene en jwtRaw.mensaje
      jwtFinal =
        jwtData.jwt ||
        (jwtData.raw && (jwtData.raw.jwt || jwtData.raw.token || jwtData.raw.mensaje)) ||
        null
    }

    // 3) Si tenemos códigoPersona, consultar estado tributario
    let estadoTributario: any = null
    let detalleDeudas: any = null
    if (codigoPersona) {
      try {
        estadoTributario = await consultarEstadoTributarioPersona(codigoPersona, jwtFinal)
      } catch (e: any) {
        console.error("Error consultando estado tributario persona:", e)
        estadoTributario = {
          success: false,
          error: e?.message || "Error consultando estado tributario",
        }
      }

      // 4) Consultar detalle de deudas firmes (FIR) en la misma llamada
      try {
        detalleDeudas = await consultarDetalleDeudas(codigoPersona, jwtFinal, "FIR", "C")
      } catch (e: any) {
        console.error("Error consultando detalle de deudas:", e)
        detalleDeudas = {
          success: false,
          error: e?.message || "Error consultando detalle de deudas",
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId: resultado.taskId,
        captchaToken: resultado.captchaToken,
        jwt: jwtFinal,
        jwtRaw: jwtRaw,
        estadoTributario,
        detalleDeudas,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error en estado-tributario (reCAPTCHA):", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error interno resolviendo reCAPTCHA",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})


