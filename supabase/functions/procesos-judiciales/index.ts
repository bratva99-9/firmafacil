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
    const { cedula, tipo, nombreCompleto } = await req.json()
    
    // Validar según el tipo de consulta
    if (tipo === 'denunciante') {
      if (!nombreCompleto || nombreCompleto.trim().length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Nombre completo es requerido para consulta como denunciante' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      if (!cedula || !/^\d{10}$/.test(cedula)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cédula inválida. Debe tener 10 dígitos' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    if (!tipo || (tipo !== 'actor' && tipo !== 'demandado' && tipo !== 'denunciante')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tipo inválido. Debe ser "actor", "demandado" o "denunciante"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = 'https://api.funcionjudicial.gob.ec/EXPEL-CONSULTA-CAUSAS-SERVICE/api/consulta-causas/informacion/buscarCausas?page=1&size=10'
    
    // Construir payload según el tipo
    let payload: any = {
      page: 1,
      size: 10,
      numeroCausa: '',
      first: 1,
      numeroFiscalia: '',
      pageSize: 10,
      provincia: '',
      recaptcha: 'verdad'
    }

    if (tipo === 'denunciante') {
      // Consulta por nombre completo (denunciante/afectado)
      payload.actor = {
        cedulaActor: '',
        nombreActor: nombreCompleto.trim()
      }
      payload.demandado = {
        cedulaDemandado: '',
        nombreDemandado: ''
      }
      console.log(`Consultando procesos judiciales para nombre: ${nombreCompleto} como ${tipo}`)
    } else if (tipo === 'actor') {
      payload.actor = {
        cedulaActor: cedula,
        nombreActor: ''
      }
      payload.demandado = {
        cedulaDemandado: '',
        nombreDemandado: ''
      }
      console.log(`Consultando procesos judiciales para cédula: ${cedula} como ${tipo}`)
    } else if (tipo === 'demandado') {
      payload.actor = {
        cedulaActor: '',
        nombreActor: ''
      }
      payload.demandado = {
        cedulaDemandado: cedula,
        nombreDemandado: ''
      }
      console.log(`Consultando procesos judiciales para cédula: ${cedula} como ${tipo}`)
    }

    console.log('Payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://procesosjudiciales.funcionjudicial.gob.ec',
        'Referer': 'https://procesosjudiciales.funcionjudicial.gob.ec/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload)
    })

    console.log('Respuesta de API:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error en respuesta:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error de la API: ${response.status} ${response.statusText}`,
          detalles: errorText.substring(0, 200)
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('Datos recibidos (tipo):', typeof data, Array.isArray(data))
    console.log('Cantidad de procesos:', Array.isArray(data) ? data.length : 'N/A')

    // Si hay procesos, consultar información detallada de cada uno
    if (Array.isArray(data) && data.length > 0) {
      console.log('🔍 Consultando información detallada de cada proceso...')
      
      const procesosConDetalle = await Promise.all(
        data.map(async (proceso) => {
          if (!proceso.idJuicio) {
            return proceso
          }

          try {
            const urlDetalle = `https://api.funcionjudicial.gob.ec/EXPEL-CONSULTA-CAUSAS-CLEX-SERVICE/api/consulta-causas-clex/informacion/getIncidenteJudicatura/${proceso.idJuicio}`
            
            console.log(`Consultando detalle para idJuicio: ${proceso.idJuicio}`)
            
            const responseDetalle = await fetch(urlDetalle, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://procesosjudiciales.funcionjudicial.gob.ec',
                'Referer': 'https://procesosjudiciales.funcionjudicial.gob.ec/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
              }
            })

            if (responseDetalle.ok) {
              const detalleData = await responseDetalle.json()
              console.log(`✅ Detalle obtenido para ${proceso.idJuicio}:`, detalleData)
              
              // Consultar actuaciones judiciales para cada incidente
              let actuacionesCompletas: Array<{idMovimientoJuicioIncidente: number, idIncidenteJudicatura: number, actuaciones: any}> = []
              
              if (Array.isArray(detalleData) && detalleData.length > 0) {
                for (const detalleItem of detalleData) {
                  if (detalleItem.lstIncidenteJudicatura && Array.isArray(detalleItem.lstIncidenteJudicatura)) {
                    for (const incidente of detalleItem.lstIncidenteJudicatura) {
                      if (incidente.idMovimientoJuicioIncidente && proceso.idJuicio && detalleItem.idJudicatura) {
                        try {
                          const urlActuaciones = 'https://api.funcionjudicial.gob.ec/EXPEL-CONSULTA-CAUSAS-SERVICE/api/consulta-causas/informacion/actuacionesJudiciales'
                          
                          const payloadActuaciones = {
                            idMovimientoJuicioIncidente: incidente.idMovimientoJuicioIncidente,
                            idJuicio: proceso.idJuicio,
                            idJudicatura: detalleItem.idJudicatura,
                            aplicativo: 'web',
                            idIncidenteJudicatura: incidente.idIncidenteJudicatura,
                            incidente: incidente.incidente || 1,
                            nombreJudicatura: detalleItem.nombreJudicatura || ''
                          }
                          
                          console.log(`Consultando actuaciones para idMovimiento: ${incidente.idMovimientoJuicioIncidente}`)
                          
                          const responseActuaciones = await fetch(urlActuaciones, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Accept': 'application/json, text/plain, */*',
                              'Origin': 'https://procesosjudiciales.funcionjudicial.gob.ec',
                              'Referer': 'https://procesosjudiciales.funcionjudicial.gob.ec/',
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
                            },
                            body: JSON.stringify(payloadActuaciones)
                          })
                          
                          if (responseActuaciones.ok) {
                            const actuacionesData = await responseActuaciones.json()
                            console.log(`✅ Actuaciones obtenidas para movimiento ${incidente.idMovimientoJuicioIncidente}:`, actuacionesData)
                            
                            actuacionesCompletas.push({
                              idMovimientoJuicioIncidente: incidente.idMovimientoJuicioIncidente,
                              idIncidenteJudicatura: incidente.idIncidenteJudicatura,
                              actuaciones: actuacionesData
                            })
                          } else {
                            console.warn(`⚠️ No se pudieron obtener actuaciones para movimiento ${incidente.idMovimientoJuicioIncidente}: ${responseActuaciones.status}`)
                          }
                        } catch (error) {
                          console.error(`❌ Error obteniendo actuaciones para movimiento ${incidente.idMovimientoJuicioIncidente}:`, error)
                        }
                      }
                    }
                  }
                }
              }
              
              // Combinar información detallada con el proceso base y actuaciones
              return {
                ...proceso,
                detalle: detalleData,
                actuaciones: actuacionesCompletas
              }
            } else {
              console.warn(`⚠️ No se pudo obtener detalle para ${proceso.idJuicio}: ${responseDetalle.status}`)
              return proceso
            }
          } catch (error) {
            console.error(`❌ Error obteniendo detalle para ${proceso.idJuicio}:`, error)
            return proceso
          }
        })
      )

      console.log(`✅ Procesos con detalle completados: ${procesosConDetalle.length}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: procesosConDetalle,
          tipo: tipo
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        tipo: tipo
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en procesos-judiciales:', error)
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

