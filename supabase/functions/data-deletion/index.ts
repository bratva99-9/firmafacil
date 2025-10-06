import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar que sea una solicitud POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obtener datos del cuerpo de la solicitud
    const { signed_request } = await req.json()
    
    if (!signed_request) {
      return new Response(
        JSON.stringify({ error: 'signed_request requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Decodificar el signed_request de Facebook
    const [encodedSig, payload] = signed_request.split('.', 2)
    
    // Decodificar el payload (base64url)
    const decodedPayload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
      )
    )

    const userId = decodedPayload.user_id

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id no encontrado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Inicializar cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar usuario por Facebook ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, facebook_id')
      .eq('facebook_id', userId)
      .single()

    if (userError || !userData) {
      console.log(`Usuario con Facebook ID ${userId} no encontrado`)
      return new Response(
        JSON.stringify({ 
          url: 'https://ecucontable.com/data-deletion-confirmation',
          confirmation_code: `delete_${userId}_${Date.now()}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Eliminar datos del usuario
    const deletionPromises = []

    // 1. Eliminar solicitudes del usuario
    deletionPromises.push(
      supabase
        .from('solicitudes')
        .delete()
        .eq('user_id', userData.id)
    )

    // 2. Eliminar perfil del usuario
    deletionPromises.push(
      supabase
        .from('profiles')
        .delete()
        .eq('id', userData.id)
    )

    // 3. Eliminar usuario de auth (esto eliminará también el usuario de auth.users)
    deletionPromises.push(
      supabase.auth.admin.deleteUser(userData.id)
    )

    // Ejecutar todas las eliminaciones
    const results = await Promise.allSettled(deletionPromises)
    
    // Verificar si hubo errores
    const errors = results.filter(result => result.status === 'rejected')
    
    if (errors.length > 0) {
      console.error('Errores al eliminar datos:', errors)
      return new Response(
        JSON.stringify({ error: 'Error al eliminar datos del usuario' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generar código de confirmación
    const confirmationCode = `delete_${userId}_${Date.now()}`

    // Respuesta exitosa para Facebook
    return new Response(
      JSON.stringify({ 
        url: 'https://ecucontable.com/data-deletion-confirmation',
        confirmation_code: confirmationCode
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en data-deletion:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})



