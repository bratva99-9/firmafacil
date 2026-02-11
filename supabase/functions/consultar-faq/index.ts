import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

  console.log('=== Consultar FAQ - Nueva petición ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)

  try {
    // Inicializar cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obtener pregunta desde query params (GET) o body (POST) - Compatible con ManyChat
    let pregunta: string | undefined

    if (req.method === "GET") {
      const url = new URL(req.url)
      pregunta = url.searchParams.get("pregunta") || url.searchParams.get("q") || undefined
    } else if (req.method === "POST") {
      try {
        const text = await req.text()
        if (text) {
          try {
            const body = JSON.parse(text)
            pregunta = body.pregunta || body.q || body.text || body.mensaje || body.message || undefined
          } catch {
            // Si no es JSON válido, asumir que el texto es la pregunta directamente
            pregunta = text.trim() || undefined
          }
        }
      } catch (error) {
        console.error("Error leyendo body:", error)
        pregunta = undefined
      }
    }
    
    if (!pregunta || pregunta.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Pregunta es requerida. Envía "pregunta" o "q" en el body (POST) o como query param (GET)',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, // ManyChat necesita 200 para procesar JSON
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const preguntaLimpia = pregunta.trim().toLowerCase()
    console.log('Pregunta recibida:', pregunta)
    console.log('Pregunta limpia:', preguntaLimpia)

    // Buscar FAQs que coincidan
    // Estrategia: buscar en palabras_clave, pregunta y respuesta
    
    // 1. Buscar por palabras clave (coincidencia exacta en array)
    const { data: faqsPorPalabras, error: errorPalabras } = await supabase
      .from('faqs')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (errorPalabras) {
      console.error('Error consultando FAQs:', errorPalabras)
      throw errorPalabras
    }

    console.log(`Total FAQs activos encontrados: ${faqsPorPalabras?.length || 0}`)

    // Filtrar y puntuar FAQs según relevancia
    const faqsConPuntuacion = (faqsPorPalabras || []).map(faq => {
      let puntuacion = 0
      const palabrasPregunta = preguntaLimpia.split(/\s+/)
      
      // Puntuar por palabras clave
      if (faq.palabras_clave && Array.isArray(faq.palabras_clave)) {
        faq.palabras_clave.forEach((palabra: string) => {
          const palabraLimpia = palabra.toLowerCase()
          if (palabrasPregunta.some(p => p.includes(palabraLimpia) || palabraLimpia.includes(p))) {
            puntuacion += 10
          }
        })
      }
      
      // Puntuar por coincidencia en pregunta
      const preguntaFaq = (faq.pregunta || '').toLowerCase()
      palabrasPregunta.forEach(palabra => {
        if (preguntaFaq.includes(palabra)) {
          puntuacion += 5
        }
      })
      
      // Puntuar por coincidencia en respuesta (menos peso)
      const respuestaFaq = (faq.respuesta || '').toLowerCase()
      palabrasPregunta.forEach(palabra => {
        if (respuestaFaq.includes(palabra)) {
          puntuacion += 2
        }
      })
      
      // Bonus si la pregunta contiene palabras clave importantes
      const palabrasImportantes = ['costo', 'precio', 'cuanto', 'tiempo', 'tarda', 'documentos', 'necesito']
      palabrasImportantes.forEach(palabra => {
        if (preguntaLimpia.includes(palabra) && preguntaFaq.includes(palabra)) {
          puntuacion += 15
        }
      })
      
      return {
        ...faq,
        puntuacion
      }
    })

    // Filtrar solo los que tienen puntuación > 0 y ordenar por puntuación
    const faqsRelevantes = faqsConPuntuacion
      .filter(faq => faq.puntuacion > 0)
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, 5) // Top 5 más relevantes

    console.log(`FAQs relevantes encontrados: ${faqsRelevantes.length}`)
    faqsRelevantes.forEach((faq, index) => {
      console.log(`${index + 1}. "${faq.pregunta}" - Puntuación: ${faq.puntuacion}`)
    })

    // Formatear respuesta COMPLETA para ManyChat (todos los FAQs como texto formateado)
    // ManyChat solo puede mapear strings simples, así que incluimos toda la info en un solo campo
    let respuesta_final = ''
    
    if (faqsRelevantes.length > 0) {
      respuesta_final = `Se encontraron ${faqsRelevantes.length} respuesta(s) relevante(s) para tu consulta:\n\n`
      
      // Incluir todos los FAQs encontrados, ordenados por relevancia
      faqsRelevantes.forEach((faq, index) => {
        respuesta_final += `--- Respuesta ${index + 1} (Relevancia: ${faq.puntuacion}%) ---\n`
        respuesta_final += `Pregunta: ${faq.pregunta}\n`
        respuesta_final += `Respuesta: ${faq.respuesta}\n`
        respuesta_final += `Categoría: ${faq.categoria}\n\n`
      })
      
      // Agregar información adicional útil
      respuesta_final += `--- Información adicional ---\n`
      respuesta_final += `Consulta original: "${pregunta}"\n`
      respuesta_final += `Total de respuestas encontradas: ${faqsRelevantes.length}\n`
    } else {
      respuesta_final = 'No encontré información específica sobre tu consulta. Por favor, contáctanos directamente para más información sobre nuestros servicios.'
    }
    
    // Respuesta simple - solo campos string para ManyChat
    const respuesta = {
      respuesta_final: respuesta_final,
      encontrados: faqsRelevantes.length.toString(),
      pregunta_buscada: pregunta
    }

    const respuestaJSON = JSON.stringify(respuesta)
    console.log('✅ Respuesta preparada para ManyChat')
    console.log('📦 Tamaño respuesta:', respuestaJSON.length, 'caracteres')

    return new Response(
      respuestaJSON,
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en consultar-faq:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor',
        detalles: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, // ManyChat necesita 200 para procesar JSON
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

