import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración AntiCaptcha (poner la API key como Secret en Supabase)
const ANTICAPTCHA_API_KEY = Deno.env.get('ANTICAPTCHA_API_KEY') || ''

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
  if (!ANTICAPTCHA_API_KEY) {
    throw new Error("Falta configurar la variable ANTICAPTCHA_API_KEY en Supabase")
  }

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

      return { taskId, captchaToken }
    }

    // Estado inesperado
    throw new Error(`Estado desconocido en AntiCaptcha: ${statusJson.status}`)
  }
}

// 2) Validar el captcha en el SRI y obtener el JWT/JWS (segunda parte de tu script PowerShell)
async function obtenerJwtDesdeSRI(captchaToken: string) {
  // 1) Visitar primero el sitio del SRI para obtener cookies de sesión (equivalente a copiar las cookies del navegador)
  const baseHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  }

  let cookieHeader = ""

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
      console.log("Cookies SRI captcha:", cookieHeader.substring(0, 150) + "...")
    }

    await delay(500)
  } catch (e: any) {
    console.log("⚠️ No se pudieron obtener cookies iniciales del SRI (captcha):", e.message)
    // seguimos sin cookies; a veces igual funciona
  }

  // 2) Construir URL como en tu script PowerShell:
  // ValidacionCaptcha/validarGoogleReCaptcha?googleCaptchaResponse=$captcha&emitirToken=true
  const params = new URLSearchParams({
    googleCaptchaResponse: captchaToken,
    emitirToken: "true",
  })

  const url = `${SRI_CAPTCHA_BASE}${SRI_CAPTCHA_VALIDATE_PATH}?${params.toString()}`

  const headers: Record<string, string> = {
    ...baseHeaders,
    Accept: "application/json, text/plain, */*",
    Referer: RECAPTCHA_PAGE_URL,
  }

  if (cookieHeader) {
    headers["Cookie"] = cookieHeader
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
      throw new Error(`Error HTTP al validar captcha en SRI: ${resp.status} - ${txt.substring(0, 500)}`)
    }

    const json = await resp.json()
    // Normalmente el JWT viene en una propiedad tipo "token" o "jwt". Ajustamos de forma flexible.
    const jwt =
      json.jwt ||
      json.token ||
      json.idToken ||
      json.jws ||
      json?.respuesta || // por si lo devuelven así
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
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("Timeout al validar el captcha en el SRI")
    }
    throw err
  }
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

  const headers: Record<string, string> = {
    Accept: "application/json",
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
    const jwtData = await obtenerJwtDesdeSRI(resultado.captchaToken)

    // Tomar el JWT final: o bien el campo directo, o el que viene en jwtRaw.mensaje
    const jwtFinal =
      jwtData.jwt ||
      (jwtData.raw && (jwtData.raw.jwt || jwtData.raw.token || jwtData.raw.mensaje)) ||
      null

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
        jwtRaw: jwtData.raw,
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


