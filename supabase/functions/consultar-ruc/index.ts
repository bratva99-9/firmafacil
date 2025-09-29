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
    
    console.log(`Consultando SRI: ${sriUrl}`)
    
    const response = await fetch(sriUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
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

    const dataArray = await response.json()
    console.log('Datos recibidos del SRI:', dataArray)
    
    // La API del SRI devuelve un array, tomamos el primer elemento
    const data = Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : null
    
    if (data && data.numeroRuc && data.razonSocial) {
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
            establecimientos: data.establecimientos || []
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

  } catch (error) {
    console.error('Error en consultar-ruc:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
