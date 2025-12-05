import React, { useState, useRef } from 'react'
import { buscarEmpresaPorRUC, buscarEmpresaPorExpediente, obtenerDescripcionActividadCIIU, consultarRUCDesdeEdge } from '../lib/supabase'

export default function InformeSuperCompanias() {
  // Estado para todos los datos de los informes
  const [actaData, setActaData] = useState({
    nombreCompania: '',
    ruc: '',
    ciudad: '',
    dia: '16',
    mes: 'Marzo',
    anio: '2025',
    hora: '10:00',
    direccion: '',
    modalidad: 'presencial', // presencial, virtual, mixta
    fechaConvocatoria: '',
    porcentajeQuorum: '100',
    nombrePresidente: '',
    cedulaPresidente: '',
    nombreSecretario: 'CENTENO HOLGUIN KEVIN JULIAN',
    cedulaSecretario: '0958398984',
    nombreGerente: '',
    cedulaGerente: '',
    nombreComisario: 'LAINEZ TUMBACO ROBERT DANIEL',
    cedulaComisario: '0930070552',
    ejercicioFiscal: '2024',
    distribucionUtilidades: '',
    otrosAsuntos: '',
    horaCierre: '12:00',
    // Campos para Notas Explicativas
    objetoSocial: '',
    fechaConstitucion: '',
    capitalSuscrito: '',
    // Campos adicionales del formato real
    formaLegal: '',
    estructuraOrganizacional: '',
    accionistas: [], // Array de { cedula, nombres, porcentaje, capital }
    tipoNIIF: 'NIIF para PYMES',
    tasaImpuestoRenta: '25',
    sancionesSCVS: '',
    sancionesOtrasAutoridades: '',
    inflacionAnual: '',
    lineaNegocio: '',
    // Campos para Informe del Gerente
    cumplimientoObjetivos: '',
    cumplimientoDisposiciones: '',
    hechosExtraordinarios: '',
    situacionFinanciera: '',
    recomendaciones: '',
    cumplimientoNormas: '',
    // Campos para Informe del Comisario
    evaluacionFinanciera: '',
    observacionesGestion: '',
    observacionesEstadosFinancieros: '',
    observacionesCumplimiento: '',
    recomendacionesComisario: '',
    conclusionComisario: '',
  })

  const [informesGenerados, setInformesGenerados] = useState({
    actaJunta: null,
    informeGerente: null,
    notasExplicativas: null,
    informeComisario: null
  })
  const cacheActividadesRef = useRef({})
  const consultasEnCursoRef = useRef(new Set())
  const representantesCacheRef = useRef({})
  const representantesEnCursoRef = useRef(new Set())

  const handleActaChange = (e) => {
    const { name, value } = e.target
    setActaData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const agregarAccionista = () => {
    setActaData(prev => ({
      ...prev,
      accionistas: [...prev.accionistas, { cedula: '', nombres: '', porcentaje: '', capital: '' }]
    }))
  }

  const eliminarAccionista = (index) => {
    setActaData(prev => ({
      ...prev,
      accionistas: prev.accionistas.filter((_, i) => i !== index)
    }))
  }

  // Función para normalizar valores numéricos (maneja puntos y comas como separadores)
  const normalizarNumero = (valor) => {
    if (!valor || valor === '') return 0
    // Remover espacios y caracteres no numéricos excepto punto y coma
    let limpio = String(valor).trim().replace(/[^\d.,]/g, '')
    
    // Si tiene coma y punto, determinar cuál es decimal
    if (limpio.includes(',') && limpio.includes('.')) {
      // El último separador es el decimal
      const ultimoComa = limpio.lastIndexOf(',')
      const ultimoPunto = limpio.lastIndexOf('.')
      if (ultimoComa > ultimoPunto) {
        // Coma es decimal, punto es miles: 1.500,50 -> 1500.50
        limpio = limpio.replace(/\./g, '').replace(',', '.')
      } else {
        // Punto es decimal, coma es miles: 1,500.50 -> 1500.50
        limpio = limpio.replace(/,/g, '')
      }
    } else if (limpio.includes(',')) {
      // Solo coma: puede ser decimal o miles
      // Si hay más de una coma, son miles, si hay una puede ser decimal
      const comas = (limpio.match(/,/g) || []).length
      if (comas > 1) {
        // Múltiples comas = separador de miles: 1,500,000 -> 1500000
        limpio = limpio.replace(/,/g, '')
      } else {
        // Una coma: verificar si hay 2-3 dígitos después (probable decimal)
        const partes = limpio.split(',')
        if (partes[1] && partes[1].length <= 3) {
          // Probable decimal: 1500,50 -> 1500.50
          limpio = limpio.replace(',', '.')
        } else {
          // Probable miles: 1,500 -> 1500
          limpio = limpio.replace(',', '')
        }
      }
    } else if (limpio.includes('.')) {
      // Solo punto: puede ser decimal o miles
      const puntos = (limpio.match(/\./g) || []).length
      if (puntos > 1) {
        // Múltiples puntos = separador de miles: 1.500.000 -> 1500000
        limpio = limpio.replace(/\./g, '')
      } else {
        // Un punto: verificar si hay 2-3 dígitos después (probable decimal)
        const partes = limpio.split('.')
        if (partes[1] && partes[1].length <= 3) {
          // Probable decimal: 1500.50 -> 1500.50 (mantener)
          // Ya está bien
        } else {
          // Probable miles: 1.500 -> 1500
          limpio = limpio.replace('.', '')
        }
      }
    }
    
    return parseFloat(limpio) || 0
  }

  const actualizarAccionista = (index, field, value) => {
    setActaData(prev => {
      const nuevosAccionistas = [...prev.accionistas]
      nuevosAccionistas[index] = { ...nuevosAccionistas[index], [field]: value }
      
      // Si se actualiza el capital, calcular automáticamente el porcentaje
      if (field === 'capital') {
        const capitalTotal = nuevosAccionistas.reduce((sum, acc) => {
          return sum + normalizarNumero(acc.capital)
        }, 0)
        
        const capitalSuscrito = normalizarNumero(prev.capitalSuscrito)
        
        if (capitalTotal > 0 && capitalSuscrito > 0) {
          const capitalAccionista = normalizarNumero(value)
          const porcentaje = (capitalAccionista / capitalSuscrito) * 100
          nuevosAccionistas[index].porcentaje = porcentaje.toFixed(2)
        } else {
          nuevosAccionistas[index].porcentaje = ''
        }
      }
      
      return { ...prev, accionistas: nuevosAccionistas }
    })
  }

  const calcularCapitalTotal = () => {
    return actaData.accionistas.reduce((total, acc) => {
      return total + normalizarNumero(acc.capital)
    }, 0)
  }

  const capitalTotal = calcularCapitalTotal()
  const capitalSuscritoNum = normalizarNumero(actaData.capitalSuscrito)
  const capitalValido = Math.abs(capitalTotal - capitalSuscritoNum) < 0.01 // Tolerancia de 0.01 para decimales

  const handleDatosExtraidos = (datos) => {
    // DEBUG: Mostrar datos recibidos
    console.group('🔄 DEBUG - Aplicando Datos al Formulario')
    console.log('📥 Datos Recibidos:', datos)
    console.log('📊 Estado Actual del Formulario:', actaData)
    console.groupEnd()

    // Aplicar datos extraídos del PDF al formulario
    // Solo actualizar campos que estén vacíos o si el nuevo dato es más completo
    setActaData(prev => {
      const nuevo = { ...prev }
      
      // DEBUG: Rastrear cambios
      const cambios = []
      
      // RUC: siempre actualizar si hay nuevo dato
      if (datos.ruc && datos.ruc.length === 13) {
        if (prev.ruc !== datos.ruc) {
          cambios.push(`RUC: "${prev.ruc}" → "${datos.ruc}"`)
          nuevo.ruc = datos.ruc
        }
      }
      
      // Nombre de la compañía: actualizar si está vacío o si el nuevo es más largo (más completo)
      if (datos.nombreCompania) {
        if (!prev.nombreCompania || datos.nombreCompania.length > prev.nombreCompania.length) {
          if (prev.nombreCompania !== datos.nombreCompania) {
            cambios.push(`Nombre Compañía: "${prev.nombreCompania || '(vacío)'}" → "${datos.nombreCompania}"`)
            nuevo.nombreCompania = datos.nombreCompania
          }
        }
      }
      
      // Ciudad: actualizar si está vacío
      if (datos.ciudad && !prev.ciudad) {
        cambios.push(`Ciudad: "(vacío)" → "${datos.ciudad}"`)
        nuevo.ciudad = datos.ciudad
      }
      
      // Dirección: actualizar si está vacío o si el nuevo es más completo
      if (datos.direccion) {
        if (!prev.direccion || datos.direccion.length > prev.direccion.length) {
          if (prev.direccion !== datos.direccion) {
            cambios.push(`Dirección: "${prev.direccion || '(vacío)'}" → "${datos.direccion}"`)
            nuevo.direccion = datos.direccion
          }
        }
      }
      
      // Lugar: usar dirección si no hay lugar específico
      if (datos.direccion && !prev.lugar) {
        cambios.push(`Lugar: "(vacío)" → "${datos.direccion}"`)
        nuevo.lugar = datos.direccion
      }
      
      // Gerente: actualizar si está vacío
      if (datos.nombreGerente && !prev.nombreGerente) {
        cambios.push(`Gerente: "(vacío)" → "${datos.nombreGerente}"`)
        nuevo.nombreGerente = datos.nombreGerente
      }
      
      // Comisario: actualizar si está vacío
      if (datos.nombreComisario && !prev.nombreComisario) {
        cambios.push(`Comisario: "(vacío)" → "${datos.nombreComisario}"`)
        nuevo.nombreComisario = datos.nombreComisario
      }
      
      // Fecha de constitución: actualizar si está vacío
      if (datos.fechaConstitucion && !prev.fechaConstitucion) {
        cambios.push(`Fecha Constitución: "(vacío)" → "${datos.fechaConstitucion}"`)
        nuevo.fechaConstitucion = datos.fechaConstitucion
      }
      
      // Objeto Social: actualizar si está vacío o si el nuevo es más completo
      if (datos.objetoSocial) {
        if (!prev.objetoSocial || datos.objetoSocial.length > prev.objetoSocial.length) {
          if (prev.objetoSocial !== datos.objetoSocial) {
            cambios.push(`Objeto Social: "${prev.objetoSocial ? prev.objetoSocial.substring(0, 50) + '...' : '(vacío)'}" → "${datos.objetoSocial.substring(0, 50)}..."`)
            nuevo.objetoSocial = datos.objetoSocial
          }
        }
      }
      
      // Capital: actualizar si está disponible
      if (datos.capital) {
        if (!prev.capitalSuscrito) {
          cambios.push(`Capital Suscrito: "(vacío)" → "${datos.capital}"`)
          nuevo.capitalSuscrito = datos.capital
        }
      }
      
      // Domicilio completo: actualizar si está disponible
      if (datos.domicilioCompleto && !prev.direccion) {
        cambios.push(`Dirección: "(vacío)" → "${datos.domicilioCompleto}"`)
        nuevo.direccion = datos.domicilioCompleto
      } else if (datos.direccion && !prev.direccion) {
        cambios.push(`Dirección: "(vacío)" → "${datos.direccion}"`)
        nuevo.direccion = datos.direccion
      }
      
      // Forma Legal: actualizar si está disponible
      if (datos.formaLegal && !prev.formaLegal) {
        cambios.push(`Forma Legal: "(vacío)" → "${datos.formaLegal}"`)
        nuevo.formaLegal = datos.formaLegal
      }
      
      // DEBUG: Mostrar cambios aplicados
      if (cambios.length > 0) {
        console.group('✅ DEBUG - Cambios Aplicados al Formulario')
        cambios.forEach(cambio => console.log('  ✓', cambio))
        console.log('📊 Nuevo Estado:', nuevo)
        console.groupEnd()
      } else {
        console.log('ℹ️ No se aplicaron cambios (los campos ya estaban completos o los datos no eran mejores)')
      }
      
      // Número de escritura: actualizar si está vacío
      if (datos.numeroEscritura && !prev.numeroEscritura) {
        nuevo.numeroEscritura = datos.numeroEscritura
      }
      
      // Notaría: actualizar si está vacío
      if (datos.notaria && !prev.notaria) {
        nuevo.notaria = datos.notaria
      }
      
      // Fecha de inscripción: actualizar si está vacío
      if (datos.fechaInscripcion && !prev.fechaInscripcion) {
        nuevo.fechaInscripcion = datos.fechaInscripcion
      }
      
      // Objeto social: actualizar si está vacío o si el nuevo es más completo
      if (datos.objetoSocial) {
        if (!prev.objetoSocial || datos.objetoSocial.length > prev.objetoSocial.length) {
          nuevo.objetoSocial = datos.objetoSocial
        }
      }
      
      // Capital: actualizar si está vacío
      if (datos.capital && !prev.capital) {
        nuevo.capital = datos.capital
      }
      
      return nuevo
    })
  }

  const buscarYCargarEmpresa = async (valor, tipo = 'ruc') => {
    try {
      console.group(`🔍 DEBUG - Búsqueda de Empresa (${tipo})`)
      console.log(`🔎 Buscando por ${tipo}:`, valor)
      console.groupEnd()

      let empresa = null
      
      if (tipo === 'ruc') {
        empresa = await buscarEmpresaPorRUC(valor)
      } else if (tipo === 'expediente') {
        empresa = await buscarEmpresaPorExpediente(valor)
      }

      if (!empresa) {
        alert(`No se encontró empresa con ${tipo === 'ruc' ? 'RUC' : 'expediente'}: ${valor}`)
        return
      }

      console.group('✅ DEBUG - Empresa Encontrada en Base de Datos')
      console.log('📋 Datos de la empresa:', empresa)
      console.groupEnd()

      // Aplicar los datos al formulario
      setActaData(prev => {
        const nuevo = { ...prev }
        const cambios = []

        if (empresa.ruc && empresa.ruc !== prev.ruc) {
          cambios.push(`RUC: "${prev.ruc || '(vacío)'}" → "${empresa.ruc}"`)
          nuevo.ruc = empresa.ruc
        }

        if (empresa.nombre && (!prev.nombreCompania || empresa.nombre.length > prev.nombreCompania.length)) {
          cambios.push(`Nombre: "${prev.nombreCompania || '(vacío)'}" → "${empresa.nombre}"`)
          nuevo.nombreCompania = empresa.nombre
        }

        if (empresa.ciudad && !prev.ciudad) {
          cambios.push(`Ciudad: "(vacío)" → "${empresa.ciudad}"`)
          nuevo.ciudad = empresa.ciudad
        }

        if (empresa.provincia && !prev.ciudad) {
          if (!nuevo.ciudad) {
            nuevo.ciudad = empresa.provincia
          }
        }

        // Construir dirección completa en formato SRI: PROVINCIA / CIUDAD / PARROQUIA / DIRECCIÓN
        const partesDomicilio = []
        if (empresa.provincia) partesDomicilio.push(empresa.provincia.toUpperCase())
        if (empresa.ciudad) partesDomicilio.push(empresa.ciudad.toUpperCase())
        if (empresa.canton) partesDomicilio.push(empresa.canton.toUpperCase())
        
        // Construir dirección (calle, intersección, número, barrio)
        let direccionDetalle = ''
        if (empresa.calle) direccionDetalle += empresa.calle
        if (empresa.interseccion) direccionDetalle += (direccionDetalle ? ' Y ' : '') + empresa.interseccion
        if (empresa.numero) direccionDetalle += (direccionDetalle ? ' ' : '') + empresa.numero
        if (empresa.barrio) direccionDetalle += (direccionDetalle ? ' ' : '') + empresa.barrio
        
        if (direccionDetalle) partesDomicilio.push(direccionDetalle.toUpperCase())
        
        const domicilioCompletoSRI = partesDomicilio.join(' / ')
        
        if (domicilioCompletoSRI && (!prev.direccion || domicilioCompletoSRI.length > prev.direccion.length)) {
          cambios.push(`Dirección: "${prev.direccion || '(vacío)'}" → "${domicilioCompletoSRI}"`)
          nuevo.direccion = domicilioCompletoSRI
        }

        if (empresa.representante && !prev.nombreGerente) {
          cambios.push(`Gerente: "(vacío)" → "${empresa.representante}"`)
          nuevo.nombreGerente = empresa.representante
        }

        if (empresa.fecha_constitucion && !prev.fechaConstitucion) {
          cambios.push(`Fecha Constitución: "(vacío)" → "${empresa.fecha_constitucion}"`)
          nuevo.fechaConstitucion = empresa.fecha_constitucion
        }

        if (empresa.tipo_compania && !prev.formaLegal) {
          cambios.push(`Forma Legal: "(vacío)" → "${empresa.tipo_compania}"`)
          nuevo.formaLegal = empresa.tipo_compania
        }

        if (empresa.capital_suscrito && !prev.capitalSuscrito) {
          cambios.push(`Capital Suscrito: "(vacío)" → "${empresa.capital_suscrito}"`)
          nuevo.capitalSuscrito = empresa.capital_suscrito
        }

        if (empresa.ciiu_nivel_6 && !prev.objetoSocial) {
          // Cargar el código de actividad; luego se resolverá a descripción (una sola llamada)
          nuevo.objetoSocial = empresa.ciiu_nivel_6
          cambios.push(`Objeto Social: "(vacío)" → "${empresa.ciiu_nivel_6.substring(0, 50)}..."`)
        }

        if (cambios.length > 0) {
          console.group('✅ DEBUG - Cambios Aplicados desde Base de Datos')
          cambios.forEach(cambio => console.log('  ✓', cambio))
          console.log('📊 Nuevo Estado:', nuevo)
          console.groupEnd()
        } else {
          console.log('ℹ️ No se aplicaron cambios (los campos ya estaban completos)')
        }

        return nuevo
      })

      // Consultar descripción de actividad automáticamente cuando se carga el código
      if (empresa.ciiu_nivel_6) {
        const codigo = empresa.ciiu_nivel_6.trim()
        const cache = cacheActividadesRef.current
        const consultasEnCurso = consultasEnCursoRef.current
        
        console.log(`🔍 Procesando código CIIU: ${codigo}`)
        
        // Si ya está en caché (resuelto), usar directamente
        if (cache[codigo] && typeof cache[codigo] === 'string' && cache[codigo] !== '__NOT_FOUND__' && cache[codigo] !== '__ERROR__' && cache[codigo] !== '__PENDING__') {
          console.log(`✅ Usando descripción de caché para ${codigo}`)
          setActaData(prev => {
            if (prev.objetoSocial === empresa.ciiu_nivel_6 || prev.objetoSocial === codigo || !prev.objetoSocial) {
              return { ...prev, objetoSocial: cache[codigo] }
            }
            return prev
          })
        }
        // Si NO está en caché y NO hay consulta en curso, hacer UNA SOLA consulta
        else if (!cache[codigo] && !consultasEnCurso.has(codigo)) {
          console.log(`📡 Consultando descripción para código: ${codigo}`)
          consultasEnCurso.add(codigo)
          cache[codigo] = '__PENDING__'
          
          obtenerDescripcionActividadCIIU(codigo)
            .then(descripcion => {
              consultasEnCurso.delete(codigo)
              if (descripcion) {
                console.log(`✅ Descripción obtenida para ${codigo}: ${descripcion.substring(0, 60)}...`)
                cache[codigo] = descripcion
                setActaData(prev => {
                  // Actualizar si el objeto social aún tiene el código o está vacío
                  if (prev.objetoSocial === empresa.ciiu_nivel_6 || prev.objetoSocial === codigo || !prev.objetoSocial) {
                    console.log(`✅ Actualizando objeto social con descripción`)
                    return { ...prev, objetoSocial: descripcion }
                  }
                  return prev
                })
              } else {
                console.log(`⚠️ No se encontró descripción para código: ${codigo}`)
                cache[codigo] = '__NOT_FOUND__'
              }
            })
            .catch(err => {
              consultasEnCurso.delete(codigo)
              console.error('❌ Error al obtener descripción de actividad:', err)
              cache[codigo] = '__ERROR__'
            })
        } else {
          console.log(`ℹ️ Ya hay una consulta en curso para ${codigo} o está en caché como pendiente`)
        }
      }

      // Consultar representantes legales vía Edge Function (una vez por RUC)
      if (empresa.ruc) {
        const ruc = empresa.ruc.trim()
        const repCache = representantesCacheRef.current
        const repEnCurso = representantesEnCursoRef.current

        if (repCache[ruc] && repCache[ruc] !== '__NOT_FOUND__' && repCache[ruc] !== '__ERROR__' && repCache[ruc] !== '__PENDING__') {
          const rep = repCache[ruc]
          setActaData(prev => {
            const nuevo = { ...prev }
            if (!prev.nombreGerente && rep.nombre) nuevo.nombreGerente = rep.nombre
            if (!prev.cedulaGerente && rep.cedula) nuevo.cedulaGerente = rep.cedula
            return nuevo
          })
        } else if (!repCache[ruc] && !repEnCurso.has(ruc)) {
          repEnCurso.add(ruc)
          repCache[ruc] = '__PENDING__'
          consultarRUCDesdeEdge(ruc)
            .then(res => {
              repEnCurso.delete(ruc)
              console.log('📡 Respuesta de consultar-ruc (edge):', res)
              
              // Obtener representante legal
              if (res?.data?.representantes_legales && res.data.representantes_legales.length > 0) {
                const rep = res.data.representantes_legales[0] || {}
                const nombre = rep.nombre || rep.nombres || rep.representanteLegal || rep.representante || ''
                const cedula = rep.identificacion || rep.cedula || rep.numeroIdentificacion || rep.numero_id || ''
                repCache[ruc] = { nombre, cedula }
                setActaData(prev => {
                  const nuevo = { ...prev }
                  if (!prev.nombreGerente && nombre) nuevo.nombreGerente = nombre
                  if (!prev.cedulaGerente && cedula) nuevo.cedulaGerente = cedula
                  return nuevo
                })
              } else {
                console.log('⚠️ No se encontró representante en la respuesta')
                repCache[ruc] = '__NOT_FOUND__'
              }
              
              // Construir domicilio completo desde establecimientos (formato SRI: PROVINCIA / CIUDAD / PARROQUIA / DIRECCIÓN)
              if (res?.data?.establecimientos_detalle && res.data.establecimientos_detalle.length > 0) {
                const establecimiento = res.data.establecimientos_detalle[0]
                const provincia = establecimiento.provincia || establecimiento.nombreProvincia || ''
                const ciudad = establecimiento.canton || establecimiento.nombreCanton || establecimiento.ciudad || ''
                const parroquia = establecimiento.parroquia || establecimiento.nombreParroquia || ''
                const direccion = establecimiento.direccion || establecimiento.direccionCompleta || establecimiento.calle || ''
                
                if (provincia || ciudad || parroquia || direccion) {
                  const partesDomicilio = []
                  if (provincia) partesDomicilio.push(provincia.toUpperCase())
                  if (ciudad) partesDomicilio.push(ciudad.toUpperCase())
                  if (parroquia) partesDomicilio.push(parroquia.toUpperCase())
                  if (direccion) partesDomicilio.push(direccion.toUpperCase())
                  
                  const domicilioCompletoSRI = partesDomicilio.join(' / ')
                  console.log('📍 Domicilio completo desde SRI:', domicilioCompletoSRI)
                  
                  setActaData(prev => {
                    if (!prev.direccion || domicilioCompletoSRI.length > prev.direccion.length) {
                      return { ...prev, direccion: domicilioCompletoSRI }
                    }
                    return prev
                  })
                }
              } else if (res?.data?.establecimientos && res.data.establecimientos.length > 0) {
                // Intentar con establecimientos básicos
                const establecimiento = res.data.establecimientos[0]
                const provincia = establecimiento.provincia || ''
                const ciudad = establecimiento.canton || establecimiento.ciudad || ''
                const parroquia = establecimiento.parroquia || ''
                const direccion = establecimiento.direccion || ''
                
                if (provincia || ciudad || parroquia || direccion) {
                  const partesDomicilio = []
                  if (provincia) partesDomicilio.push(provincia.toUpperCase())
                  if (ciudad) partesDomicilio.push(ciudad.toUpperCase())
                  if (parroquia) partesDomicilio.push(parroquia.toUpperCase())
                  if (direccion) partesDomicilio.push(direccion.toUpperCase())
                  
                  const domicilioCompletoSRI = partesDomicilio.join(' / ')
                  console.log('📍 Domicilio completo desde SRI (establecimientos básicos):', domicilioCompletoSRI)
                  
                  setActaData(prev => {
                    if (!prev.direccion || domicilioCompletoSRI.length > prev.direccion.length) {
                      return { ...prev, direccion: domicilioCompletoSRI }
                    }
                    return prev
                  })
                }
              }
            })
            .catch(err => {
              repEnCurso.delete(ruc)
              repCache[ruc] = '__ERROR__'
              console.error('❌ Error al consultar representantes legales:', err)
            })
        }
      }

      alert(`✅ Empresa encontrada: ${empresa.nombre}\nLos datos se han cargado automáticamente en el formulario.`)
    } catch (error) {
      console.error('❌ Error al buscar empresa:', error)
      alert(`Error al buscar empresa: ${error.message}`)
    }
  }

  const generarActaFormal = () => {
    const lugarTexto = actaData.modalidad === 'presencial' 
      ? `en el domicilio principal de la compañía, ubicado en ${actaData.direccion || 'el domicilio de la compañía'}`
      : actaData.modalidad === 'virtual'
      ? `de manera virtual mediante plataforma digital`
      : `de manera presencial en ${actaData.direccion || 'el domicilio de la compañía'} y de manera virtual mediante plataforma digital`

    const fechaCompleta = `${actaData.dia} de ${actaData.mes} de ${actaData.anio}`
    const horaCompleta = actaData.hora

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acta de Junta General - ${actaData.nombreCompania}</title>
  <style>
    @page {
      size: letter;
      margin: 3cm 2.5cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.9;
      color: #1a1a1a;
      max-width: 21cm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 3px double #000;
      position: relative;
      padding-top: 0;
      margin-top: 0;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 1px;
      background: #000;
    }
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #000;
    }
    .header h2 {
      font-size: 15pt;
      font-weight: bold;
      margin: 12px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1a1a1a;
    }
    .header .ruc {
      margin-top: 10px;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .intro {
      text-align: justify;
      margin-bottom: 30px;
      text-indent: 1.2cm;
      line-height: 2;
    }
    .intro p {
      margin-bottom: 10px;
    }
    .referencia-legal {
      background: #f0f0f0;
      border-left: 4px solid #333;
      padding: 10px 15px;
      margin: 15px 0;
      font-size: 10.5pt;
      font-style: italic;
      text-align: justify;
    }
    .referencia-legal strong {
      font-weight: bold;
      font-style: normal;
    }
    .orden-dia {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .orden-dia h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      color: #000;
    }
    .orden-dia ol {
      margin: 0;
      padding-left: 30px;
    }
    .orden-dia li {
      margin-bottom: 10px;
      text-align: justify;
      line-height: 1.9;
    }
    .orden-dia li strong {
      font-weight: bold;
    }
    .desarrollo {
      margin: 30px 0;
    }
    .desarrollo h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      color: #000;
    }
    .desarrollo-item {
      margin-bottom: 25px;
      text-align: justify;
      page-break-inside: avoid;
    }
    .desarrollo-item p:first-child {
      margin-bottom: 8px;
      text-indent: 0;
    }
    .desarrollo-item p:first-child strong {
      font-weight: bold;
      font-size: 12.5pt;
    }
    .desarrollo-item p:not(:first-child) {
      margin: 8px 0;
      text-indent: 1.2cm;
      line-height: 2;
    }
    .desarrollo-item strong {
      font-weight: bold;
    }
    .cita-legal {
      font-size: 10pt;
      color: #444;
      margin-top: 8px;
      margin-bottom: 5px;
      text-indent: 0;
      padding-left: 1.5cm;
      font-style: normal;
      border-left: 3px solid #666;
      padding-left: 12px;
      margin-left: 1.5cm;
    }
    .cita-legal::before {
      content: "Referencia: ";
      font-weight: bold;
      color: #333;
    }
    .firma-box {
      text-align: center;
      width: 45%;
      min-width: 220px;
      display: flex;
      flex-direction: column;
    }
    .firma-line {
      border-top: 2px solid #000;
      margin-top: 80px;
      margin-bottom: 0;
      padding: 0;
      width: 100%;
      display: block;
      height: 2px;
    }
    .firma-nombre {
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 0;
      padding: 0;
      font-size: 12.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
      display: block;
      line-height: 1.2;
    }
    .firma-cargo {
      font-size: 11pt;
      margin-top: 4px;
      margin-bottom: 0;
      padding: 0;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #333;
      line-height: 1.2;
    }
    .firma-cedula {
      font-size: 10pt;
      margin-top: 3px;
      margin-bottom: 0;
      padding: 0;
      color: #555;
      line-height: 1.2;
    }
    .nota-modalidad {
      background: #f8f8f8;
      border-left: 4px solid #000;
      padding: 12px 15px;
      margin: 25px 0;
      font-size: 11pt;
      font-style: italic;
      text-align: justify;
      border-radius: 2px;
    }
    .nota-modalidad strong {
      font-weight: bold;
      font-style: normal;
    }
    .clausura {
      margin-top: 40px;
      text-align: justify;
      text-indent: 1.2cm;
      line-height: 2;
      margin-bottom: 50px;
    }
    .firmas {
      margin-top: 50px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 50px;
      font-size: 9.5pt;
      text-align: center;
      color: #555;
      font-style: italic;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .footer p {
      margin: 5px 0;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
      .firmas {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ACTA DE LA JUNTA GENERAL ORDINARIA DE ACCIONISTAS</h1>
    <h2>${actaData.nombreCompania.toUpperCase()}</h2>
    <p class="ruc">RUC: ${actaData.ruc}</p>
  </div>

  <div class="intro">
    <p>
      En ${actaData.ciudad}, a los ${actaData.dia} días del mes de ${actaData.mes} del año ${actaData.anio}, siendo las ${horaCompleta} horas, se reunieron ${lugarTexto} los accionistas de la compañía <strong>${actaData.nombreCompania}</strong>, identificada con RUC No. ${actaData.ruc}, conforme a la convocatoria realizada el ${actaData.fechaConvocatoria || fechaCompleta}, para celebrar la Junta General Ordinaria de Accionistas correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, en cumplimiento de lo dispuesto en el <strong>Artículo 177 de la Ley de Compañías del Ecuador</strong>.
    </p>
  </div>

  <div class="referencia-legal">
    <strong>Fundamento Legal:</strong> La presente junta se convoca y celebra conforme a lo establecido en los Artículos 177, 178, 179 y 180 de la Ley de Compañías del Ecuador, y en cumplimiento de las disposiciones contenidas en la Resolución No. SCVS-INC-DNCDN-2025-0001 de la Superintendencia de Compañías, Valores y Seguros del Ecuador.
  </div>

  ${actaData.modalidad !== 'presencial' ? `
  <div class="nota-modalidad">
    <strong>Nota:</strong> Esta junta se realizó de manera ${actaData.modalidad === 'virtual' ? 'virtual' : 'mixta (presencial y virtual)'}, conforme a lo establecido en la Resolución No. SCVS-INC-DNCDN-2025-0001 de la Superintendencia de Compañías, Valores y Seguros del Ecuador, que regula las juntas generales de accionistas mediante medios tecnológicos.
  </div>
  ` : ''}

  <div class="orden-dia">
    <h3>ORDEN DEL DÍA:</h3>
    <ol>
      <li><strong>Constatación del quórum y apertura de la sesión.</strong></li>
      <li><strong>Lectura y aprobación del acta de la junta anterior.</strong></li>
      <li><strong>Presentación y aprobación del Informe del Gerente General correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}.</strong></li>
      <li><strong>Presentación y aprobación de los Estados Financieros del ejercicio fiscal ${actaData.ejercicioFiscal}.</strong></li>
      <li><strong>Presentación y aprobación del Informe del Comisario correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}.</strong></li>
      <li><strong>Resolución sobre la distribución de utilidades del ejercicio fiscal ${actaData.ejercicioFiscal}.</strong></li>
      <li><strong>Designación o ratificación de administradores y comisarios, según corresponda.</strong></li>
      <li><strong>Lectura y aprobación de las notas explicativas a los estados financieros del ejercicio fiscal ${actaData.ejercicioFiscal}.</strong></li>
      <li><strong>Varios.</strong></li>
    </ol>
  </div>

  <div class="desarrollo">
    <h3>DESARROLLO DE LA SESIÓN:</h3>
    
    <div class="desarrollo-item">
      <p><strong>1. Constatación del quórum y apertura de la sesión:</strong></p>
      <p>Se constató la presencia de accionistas que representan el <strong>${actaData.porcentajeQuorum}%</strong> del capital social de la compañía, porcentaje que supera el quórum legal requerido conforme al <strong>Artículo 179 de la Ley de Compañías del Ecuador</strong>, por lo que se declaró legalmente instalada la sesión.</p>
      <p class="cita-legal">Artículo 179 de la Ley de Compañías del Ecuador - Quórum para juntas ordinarias: mayoría absoluta del capital suscrito.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>2. Lectura y aprobación del acta de la junta anterior:</strong></p>
      <p>Se procedió a la lectura del acta de la junta general anterior, la cual fue revisada, discutida y aprobada por unanimidad por los accionistas presentes.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>3. Presentación y aprobación del Informe del Gerente General:</strong></p>
      <p>El Gerente General de la compañía, <strong>${actaData.nombreGerente}</strong>, presentó su informe de gestión correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, en el cual se detallaron las actividades realizadas, los resultados obtenidos, la situación económica y financiera de la compañía, así como las perspectivas para el próximo ejercicio, conforme a lo dispuesto en el <strong>Artículo 195 de la Ley de Compañías del Ecuador</strong>. Después de la presentación y análisis del informe, el mismo fue aprobado por unanimidad por los accionistas presentes.</p>
      <p class="cita-legal">Artículo 195 de la Ley de Compañías del Ecuador - Informe del Gerente General a la junta ordinaria.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>4. Presentación y aprobación de los Estados Financieros:</strong></p>
      <p>Se presentaron los Estados Financieros del ejercicio fiscal ${actaData.ejercicioFiscal}, consistentes en el Balance General, Estado de Resultados Integral, Estado de Flujos de Efectivo y Estado de Cambios en el Patrimonio, preparados conforme a las Normas Internacionales de Información Financiera (NIIF) y las disposiciones del <strong>Artículo 196 de la Ley de Compañías del Ecuador</strong>. Los Estados Financieros fueron analizados y discutidos por los accionistas. Después de la correspondiente deliberación, los Estados Financieros fueron aprobados por unanimidad.</p>
      <p class="cita-legal">Artículo 196 de la Ley de Compañías del Ecuador - Aprobación de estados financieros en junta ordinaria.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>5. Presentación y aprobación del Informe del Comisario:</strong></p>
      <p>El Comisario de la compañía, <strong>${actaData.nombreComisario || '[Nombre del Comisario]'}</strong>, presentó su informe correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, en el cual se expusieron las observaciones y recomendaciones pertinentes, conforme a lo establecido en el <strong>Artículo 197 de la Ley de Compañías del Ecuador</strong>. El informe fue analizado y aprobado por unanimidad por los accionistas presentes.</p>
      <p class="cita-legal">Artículo 197 de la Ley de Compañías del Ecuador - Informe del Comisario a la junta ordinaria.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>6. Resolución sobre la distribución de utilidades:</strong></p>
      <p>${actaData.distribucionUtilidades || 'Se resolvió distribuir las utilidades del ejercicio fiscal ' + actaData.ejercicioFiscal + ' conforme a lo establecido en los estatutos sociales de la compañía y las disposiciones del Artículo 198 de la Ley de Compañías del Ecuador. La distribución se realizará de acuerdo con la participación accionaria de cada accionista, previa deducción de las reservas legales y estatutarias que correspondan.'}</p>
      <p class="cita-legal">Artículos 198 y 199 de la Ley de Compañías del Ecuador - Distribución de utilidades y reservas legales.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>7. Designación o ratificación de administradores y comisarios:</strong></p>
      <p>Se procedió a la designación y ratificación de los siguientes cargos para el ejercicio fiscal ${parseInt(actaData.ejercicioFiscal) + 1}, conforme a lo dispuesto en los Artículos 200 y 201 de la Ley de Compañías del Ecuador:</p>
      <p style="text-indent: 1.5cm; margin-top: 10px;">- <strong>Gerente General:</strong> ${actaData.nombreGerente}</p>
      ${actaData.nombreComisario ? `<p style="text-indent: 1.5cm;">- <strong>Comisario:</strong> ${actaData.nombreComisario}</p>` : ''}
      <p style="margin-top: 10px;">Las designaciones fueron aprobadas por unanimidad por los accionistas presentes.</p>
      <p class="cita-legal">Artículos 200 y 201 de la Ley de Compañías del Ecuador - Designación de administradores y comisarios.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>8. Lectura y aprobación de las notas explicativas a los estados financieros:</strong></p>
      <p>Se leyeron y analizaron las notas explicativas correspondientes a los estados financieros del ejercicio fiscal ${actaData.ejercicioFiscal}, las cuales contienen información relevante sobre las políticas contables, métodos de valuación, información sobre operaciones relacionadas y otros aspectos significativos, conforme a lo establecido en las Normas Internacionales de Información Financiera (NIIF). Las notas explicativas fueron aprobadas por unanimidad.</p>
      <p class="cita-legal">Normas Internacionales de Información Financiera (NIIF) - Notas a los estados financieros.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>9. Varios:</strong></p>
      <p>${actaData.otrosAsuntos || 'No se trataron otros asuntos adicionales a los incluidos en el orden del día.'}</p>
    </div>
  </div>

  <div class="clausura">
    <p>No habiendo más asuntos que tratar, y habiéndose cumplido con todos los puntos del orden del día, se levantó la sesión a las <strong>${actaData.horaCierre || horaCompleta}</strong> horas del mismo día.</p>
  </div>

  <div class="firmas">
    <div class="firma-box">
      <div class="firma-line"></div>
      <div class="firma-nombre">${actaData.nombreGerente}</div>
      <div class="firma-cargo">GERENTE GENERAL</div>
      ${actaData.cedulaGerente ? `<div class="firma-cedula">C.I. ${actaData.cedulaGerente}</div>` : ''}
    </div>
    <div class="firma-box">
      <div class="firma-line"></div>
      <div class="firma-nombre">${actaData.nombreSecretario}</div>
      <div class="firma-cargo">SECRETARIO</div>
      ${actaData.cedulaSecretario ? `<div class="firma-cedula">C.I. ${actaData.cedulaSecretario}</div>` : ''}
    </div>
  </div>

  <div class="footer">
    <p>Documento generado conforme a las disposiciones de la Superintendencia de Compañías, Valores y Seguros del Ecuador</p>
    <p>Ley de Compañías del Ecuador - Registro Oficial Suplemento 312 de 10 de mayo de 2021</p>
    <p>Resolución No. SCVS-INC-DNCDN-2025-0001 - Regulación de Juntas Generales mediante medios tecnológicos</p>
  </div>
</body>
</html>
    `
  }

  const generarInformeGerente = () => {
    const fechaCierre = `31 de Diciembre de ${actaData.ejercicioFiscal}`
    const fechaActual = `${actaData.dia} de ${actaData.mes} de ${actaData.anio}`
    const nombreGerente = actaData.nombreGerente || '[NOMBRE DEL GERENTE]'
    const cedulaGerente = actaData.cedulaGerente || ''
    const capitalSuscritoFormateado = formatearCapitalUSD(actaData.capitalSuscrito)
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe del Gerente General - ${actaData.nombreCompania || 'Compañía'}</title>
  <style>
    @page {
      size: letter;
      margin: 2.5cm 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 8px 0;
      text-transform: uppercase;
    }
    .header .ruc {
      font-size: 11pt;
      margin: 5px 0;
    }
    .intro {
      text-align: justify;
      margin-bottom: 30px;
      text-indent: 1.2cm;
    }
    .seccion {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .seccion h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .seccion p {
      text-align: justify;
      text-indent: 1.2cm;
      margin-bottom: 12px;
    }
    .seccion ul {
      margin: 15px 0;
      padding-left: 2cm;
    }
    .seccion li {
      margin-bottom: 10px;
      text-align: justify;
    }
    .firmas {
      margin-top: 120px;
      text-align: center;
      page-break-inside: avoid;
    }
    .firma-box {
      display: inline-block;
      margin: 0 40px;
      min-width: 200px;
    }
    .firma-line {
      border-top: 1px solid #000;
      width: 200px;
      margin: 0 auto 10px;
    }
    .firma-nombre {
      font-weight: bold;
      font-size: 11pt;
      margin-top: 5px;
    }
    .firma-cedula {
      font-size: 10pt;
      margin-top: 3px;
      color: #555;
    }
    .referencia-legal {
      background: #f8f8f8;
      border-left: 4px solid #000;
      padding: 12px 15px;
      margin: 25px 0;
      font-size: 10pt;
      font-style: italic;
      text-align: justify;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
      .firmas {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>INFORME DEL GERENTE GENERAL</h1>
    <h2>${actaData.nombreCompania.toUpperCase()}</h2>
    <p class="ruc">RUC: ${actaData.ruc}</p>
    <p class="ruc">Ejercicio Fiscal: ${actaData.ejercicioFiscal}</p>
  </div>

  <div class="intro">
    <p>
      Señores Accionistas de ${actaData.nombreCompania.toUpperCase()}
    </p>
    <p>
      En cumplimiento de lo dispuesto en el <strong>Artículo 195 de la Ley de Compañías del Ecuador</strong>, 
      me dirijo a ustedes para presentar el informe de gestión correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, 
      que comprende el período del 1 de Enero al 31 de Diciembre de ${actaData.ejercicioFiscal}.
    </p>
  </div>

  <div class="referencia-legal">
    <strong>Fundamento Legal:</strong> El presente informe se presenta conforme a lo establecido en el Artículo 195 de la Ley de Compañías del Ecuador, 
    que establece la obligación del Gerente General de presentar anualmente a la Junta General de Accionistas un informe detallado sobre la gestión 
    de la compañía durante el ejercicio económico correspondiente.
  </div>

  <div class="seccion">
    <h3>1. CUMPLIMIENTO DE OBJETIVOS PREVISTOS</h3>
    ${actaData.cumplimientoObjetivos ? `
      <p>${actaData.cumplimientoObjetivos}</p>
    ` : `
      <p>
        Durante el ejercicio fiscal ${actaData.ejercicioFiscal}, la compañía ${actaData.nombreCompania.toUpperCase()} 
        ha trabajado en el cumplimiento de los objetivos estratégicos establecidos para el período. Se han realizado 
        las actividades operativas planificadas, manteniendo el enfoque en la sostenibilidad del negocio y el 
        crecimiento ordenado de las operaciones.
      </p>
      <p>
        Los objetivos principales del ejercicio se centraron en mantener la operatividad de la compañía, 
        cumplir con las obligaciones legales y fiscales, y preservar la estructura organizacional necesaria 
        para el desarrollo de las actividades comerciales.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>2. CUMPLIMIENTO DE DISPOSICIONES</h3>
    ${actaData.cumplimientoDisposiciones ? `
      <p>${actaData.cumplimientoDisposiciones}</p>
    ` : `
      <p>
        La compañía ha dado cumplimiento a las resoluciones y disposiciones emanadas de la Junta General de Accionistas 
        y del Directorio durante el ejercicio fiscal ${actaData.ejercicioFiscal}. Todas las decisiones adoptadas por 
        estos órganos de gobierno han sido ejecutadas conforme a lo establecido, manteniendo la transparencia y el 
        cumplimiento de las normativas aplicables.
      </p>
      <p>
        Se ha mantenido un registro adecuado de todas las resoluciones y se ha dado seguimiento a su implementación, 
        asegurando que las decisiones corporativas se ejecuten de manera oportuna y eficiente.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>3. HECHOS EXTRAORDINARIOS</h3>
    ${actaData.hechosExtraordinarios ? `
      <p>${actaData.hechosExtraordinarios}</p>
    ` : `
      <p>
        Durante el ejercicio fiscal ${actaData.ejercicioFiscal}, no se han registrado hechos extraordinarios de 
        naturaleza administrativa, laboral o legal que requieran mención especial en el presente informe.
      </p>
      <p>
        La compañía ha operado de manera regular, cumpliendo con todas sus obligaciones contractuales, laborales y 
        legales, sin que se hayan presentado contingencias significativas que afecten la operación normal del negocio.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>4. SITUACIÓN FINANCIERA</h3>
    ${actaData.situacionFinanciera ? `
      <p>${actaData.situacionFinanciera}</p>
    ` : `
      <p>
        Al cierre del ejercicio fiscal ${actaData.ejercicioFiscal}, la situación financiera de ${actaData.nombreCompania.toUpperCase()} 
        se presenta estable. Los estados financieros han sido preparados de conformidad con las Normas Internacionales de 
        Información Financiera (${actaData.tipoNIIF || 'NIIF para PYMES'}), reflejando de manera fiel la situación económica 
        y financiera de la compañía al ${fechaCierre}.
      </p>
      <p>
        El capital suscrito de la compañía asciende a ${capitalSuscritoFormateado}, el cual se encuentra 
        debidamente registrado y documentado. La estructura patrimonial de la compañía se mantiene sólida, permitiendo el 
        desarrollo normal de las operaciones.
      </p>
      <p>
        Se recomienda a los accionistas revisar en detalle los estados financieros y las notas explicativas que acompañan 
        este informe, los cuales proporcionan información completa y detallada sobre la situación financiera, los resultados 
        de las operaciones y los flujos de efectivo de la compañía.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>5. DESTINO DE UTILIDADES</h3>
    ${actaData.distribucionUtilidades ? `
      <p>${actaData.distribucionUtilidades}</p>
    ` : `
      <p>
        Respecto al destino de las utilidades obtenidas durante el ejercicio fiscal ${actaData.ejercicioFiscal}, 
        se propone a la consideración de la Junta General de Accionistas la distribución conforme a lo establecido 
        en los estatutos sociales de la compañía y las disposiciones del Artículo 198 de la Ley de Compañías del Ecuador.
      </p>
      <p>
        La distribución se realizará de acuerdo con la participación accionaria de cada accionista, previa deducción 
        de las reservas legales y estatutarias que correspondan, garantizando el cumplimiento de todas las obligaciones 
        legales y contractuales de la compañía.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>6. RECOMENDACIONES</h3>
    ${actaData.recomendaciones ? `
      <p>${actaData.recomendaciones}</p>
    ` : `
      <p>
        Para el ejercicio fiscal ${parseInt(actaData.ejercicioFiscal) + 1}, se recomienda a la Junta General de Accionistas 
        mantener el enfoque en la sostenibilidad del negocio y el cumplimiento estricto de todas las normativas aplicables.
      </p>
      <p>
        Se sugiere continuar con las políticas de gestión implementadas, mantener la estructura organizacional actual, 
        y asegurar el cumplimiento oportuno de todas las obligaciones legales, fiscales y comerciales de la compañía.
      </p>
      <p>
        Asimismo, se recomienda mantener una comunicación fluida con los accionistas y proporcionar información oportuna 
        sobre el desarrollo de las operaciones y la situación financiera de la compañía.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>7. CUMPLIMIENTO DE NORMAS</h3>
    ${actaData.cumplimientoNormas ? `
      <p>${actaData.cumplimientoNormas}</p>
    ` : `
      <p>
        La compañía ${actaData.nombreCompania.toUpperCase()} ha cumplido con todas las normativas aplicables durante el 
        ejercicio fiscal ${actaData.ejercicioFiscal}, incluyendo las disposiciones de la Ley de Compañías del Ecuador, 
        las Normas Internacionales de Información Financiera (${actaData.tipoNIIF || 'NIIF para PYMES'}), y las regulaciones 
        emitidas por la Superintendencia de Compañías, Valores y Seguros del Ecuador.
      </p>
      <p>
        En cuanto al cumplimiento de normas sobre propiedad intelectual y derechos de autor, la compañía ha mantenido 
        el respeto a los derechos de terceros y ha utilizado únicamente materiales y recursos para los cuales cuenta con 
        las autorizaciones y licencias correspondientes.
      </p>
      ${actaData.sancionesSCVS || actaData.sancionesOtrasAutoridades ? `
        <p>
          <strong>Nota:</strong> ${actaData.sancionesSCVS ? `Sanciones SCVS: ${actaData.sancionesSCVS}. ` : ''}
          ${actaData.sancionesOtrasAutoridades ? `Sanciones de otras autoridades: ${actaData.sancionesOtrasAutoridades}.` : ''}
        </p>
      ` : `
        <p>
          No se han aplicado sanciones a la compañía, a sus Directores o Administradores, emitidas por parte de la 
          Superintendencia de Compañías, Valores y Seguros del Ecuador o de otras autoridades administrativas durante 
          el ejercicio terminado el ${fechaCierre}.
        </p>
      `}
    `}
  </div>

  <div class="seccion">
    <h3>CONCLUSIÓN</h3>
    <p>
      En conclusión, durante el ejercicio fiscal ${actaData.ejercicioFiscal}, la compañía ${actaData.nombreCompania.toUpperCase()} 
      ha operado de manera regular, cumpliendo con sus objetivos estratégicos y manteniendo el cumplimiento de todas las 
      normativas aplicables. La situación financiera se presenta estable y se han ejecutado las disposiciones de los órganos 
      de gobierno corporativo.
    </p>
    <p>
      Agradezco la confianza depositada en la gestión y me pongo a disposición para cualquier consulta o aclaración que 
      los señores accionistas consideren necesaria.
    </p>
  </div>

  <div class="firmas">
    <div class="firma-box">
      <div class="firma-line"></div>
      <div class="firma-nombre">${nombreGerente.toUpperCase()}</div>
      ${cedulaGerente ? `<div class="firma-cedula">C.I. ${cedulaGerente}</div>` : ''}
      <div class="firma-cedula">GERENTE GENERAL</div>
    </div>
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #555;">
    <p>${actaData.ciudad}, ${fechaActual}</p>
  </div>
</body>
</html>
    `
  }

  const generarInformeComisario = () => {
    const fechaCierre = `31 de Diciembre de ${actaData.ejercicioFiscal}`
    const fechaActual = `${actaData.dia} de ${actaData.mes} de ${actaData.anio}`
    const nombreComisario = actaData.nombreComisario || '[NOMBRE DEL COMISARIO]'
    const cedulaComisario = actaData.cedulaComisario || ''
    const capitalSuscritoFormateado = formatearCapitalUSD(actaData.capitalSuscrito)
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe del Comisario - ${actaData.nombreCompania || 'Compañía'}</title>
  <style>
    @page {
      size: letter;
      margin: 2.5cm 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 8px 0;
      text-transform: uppercase;
    }
    .header .ruc {
      font-size: 11pt;
      margin: 5px 0;
    }
    .intro {
      text-align: justify;
      margin-bottom: 30px;
      text-indent: 1.2cm;
    }
    .seccion {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .seccion h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .seccion p {
      text-align: justify;
      text-indent: 1.2cm;
      margin-bottom: 12px;
    }
    .seccion ul {
      margin: 15px 0;
      padding-left: 2cm;
    }
    .seccion li {
      margin-bottom: 10px;
      text-align: justify;
    }
    .firmas {
      margin-top: 180px;
      text-align: center;
      page-break-inside: avoid;
    }
    .firma-box {
      display: inline-block;
      margin: 0 40px;
      min-width: 200px;
    }
    .firma-line {
      border-top: 1px solid #000;
      width: 200px;
      margin: 0 auto 10px;
    }
    .firma-nombre {
      font-weight: bold;
      font-size: 11pt;
      margin-top: 5px;
    }
    .firma-cedula {
      font-size: 10pt;
      margin-top: 3px;
      color: #555;
    }
    .referencia-legal {
      background: #f8f8f8;
      border-left: 4px solid #000;
      padding: 12px 15px;
      margin: 25px 0;
      font-size: 10pt;
      font-style: italic;
      text-align: justify;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
      .firmas {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>INFORME DEL COMISARIO</h1>
    <h2>${actaData.nombreCompania.toUpperCase()}</h2>
    <p class="ruc">RUC: ${actaData.ruc}</p>
    <p class="ruc">Ejercicio Fiscal: ${actaData.ejercicioFiscal}</p>
  </div>

  <div class="intro">
    <p>
      Señores Accionistas de ${actaData.nombreCompania.toUpperCase()}
    </p>
    <p>
      En cumplimiento de lo dispuesto en el <strong>Artículo 197 de la Ley de Compañías del Ecuador</strong>, 
      me dirijo a ustedes para presentar el informe correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, 
      que comprende el período del 1 de Enero al 31 de Diciembre de ${actaData.ejercicioFiscal}.
    </p>
    <p>
      Como Comisario de la compañía, he realizado la revisión y evaluación de la gestión administrativa, 
      la situación económica y financiera, así como el cumplimiento de las disposiciones legales y estatutarias 
      durante el ejercicio económico correspondiente.
    </p>
  </div>

  <div class="referencia-legal">
    <strong>Fundamento Legal:</strong> El presente informe se presenta conforme a lo establecido en el Artículo 197 de la Ley de Compañías del Ecuador, 
    que establece la obligación del Comisario de presentar anualmente a la Junta General de Accionistas un informe detallado sobre la evaluación 
    de la gestión administrativa, la situación económica y financiera de la compañía, así como las observaciones y recomendaciones pertinentes.
  </div>

  <div class="seccion">
    <h3>1. EVALUACIÓN DE LA SITUACIÓN FINANCIERA</h3>
    ${actaData.evaluacionFinanciera ? `
      <p>${actaData.evaluacionFinanciera}</p>
    ` : `
      <p>
        He realizado la revisión de los estados financieros de ${actaData.nombreCompania.toUpperCase()} 
        correspondientes al ejercicio fiscal ${actaData.ejercicioFiscal}, preparados de conformidad con las 
        Normas Internacionales de Información Financiera (${actaData.tipoNIIF || 'NIIF para PYMES'}), 
        los cuales reflejan la situación económica y financiera de la compañía al ${fechaCierre}.
      </p>
      <p>
        Los estados financieros han sido preparados bajo la responsabilidad de la administración de la compañía, 
        y mi función como Comisario ha consistido en revisar y evaluar la información financiera presentada, 
        verificando su razonabilidad y coherencia con la documentación contable disponible.
      </p>
      <p>
        El capital suscrito de la compañía asciende a ${capitalSuscritoFormateado}, 
        el cual se encuentra debidamente registrado y documentado. La estructura patrimonial de la compañía 
        se presenta estable, permitiendo el desarrollo normal de las operaciones.
      </p>
      ${actaData.observacionesEstadosFinancieros ? `
        <p><strong>Observaciones sobre los Estados Financieros:</strong></p>
        <p>${actaData.observacionesEstadosFinancieros}</p>
      ` : `
        <p>
          No se han identificado irregularidades significativas en la preparación de los estados financieros 
          que requieran mención especial en el presente informe.
        </p>
      `}
    `}
  </div>

  <div class="seccion">
    <h3>2. EVALUACIÓN DEL CUMPLIMIENTO DE OBJETIVOS</h3>
    <p>
      He verificado el cumplimiento de los objetivos establecidos para el ejercicio fiscal ${actaData.ejercicioFiscal}. 
      La administración de la compañía ha trabajado en el desarrollo de las actividades operativas planificadas, 
      manteniendo el enfoque en la sostenibilidad del negocio y el cumplimiento de las obligaciones legales y fiscales.
    </p>
    ${actaData.cumplimientoObjetivos ? `
      <p><strong>Observaciones sobre el Cumplimiento de Objetivos:</strong></p>
      <p>${actaData.cumplimientoObjetivos}</p>
    ` : `
      <p>
        Los objetivos principales del ejercicio se centraron en mantener la operatividad de la compañía, 
        cumplir con las obligaciones legales y fiscales, y preservar la estructura organizacional necesaria 
        para el desarrollo de las actividades comerciales, objetivos que han sido cumplidos satisfactoriamente.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>3. EVALUACIÓN DEL CUMPLIMIENTO DE DISPOSICIONES</h3>
    ${actaData.observacionesCumplimiento ? `
      <p>${actaData.observacionesCumplimiento}</p>
    ` : `
      <p>
        He verificado que la compañía ha dado cumplimiento a las resoluciones y disposiciones emanadas de la 
        Junta General de Accionistas y del Directorio durante el ejercicio fiscal ${actaData.ejercicioFiscal}. 
        Todas las decisiones adoptadas por estos órganos de gobierno han sido ejecutadas conforme a lo establecido, 
        manteniendo la transparencia y el cumplimiento de las normativas aplicables.
      </p>
      <p>
        Se ha mantenido un registro adecuado de todas las resoluciones y se ha dado seguimiento a su implementación, 
        asegurando que las decisiones corporativas se ejecuten de manera oportuna y eficiente.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>4. EVALUACIÓN DE LA GESTIÓN ADMINISTRATIVA</h3>
    ${actaData.observacionesGestion ? `
      <p>${actaData.observacionesGestion}</p>
    ` : `
      <p>
        He realizado la evaluación de la gestión administrativa de la compañía durante el ejercicio fiscal ${actaData.ejercicioFiscal}. 
        La administración ha cumplido con sus responsabilidades de manera adecuada, manteniendo la operatividad de la compañía 
        y el cumplimiento de las obligaciones legales, contractuales y fiscales.
      </p>
      <p>
        La gestión del Gerente General, ${actaData.nombreGerente ? actaData.nombreGerente.toUpperCase() : '[NOMBRE DEL GERENTE]'}, 
        ha sido evaluada positivamente, observándose el cumplimiento de las funciones asignadas y la ejecución adecuada de las 
        decisiones adoptadas por los órganos de gobierno corporativo.
      </p>
      <p>
        No se han identificado irregularidades significativas en la gestión administrativa que requieran mención especial 
        o que afecten de manera material la situación de la compañía.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>5. HECHOS EXTRAORDINARIOS</h3>
    ${actaData.hechosExtraordinarios ? `
      <p>${actaData.hechosExtraordinarios}</p>
    ` : `
      <p>
        Durante el ejercicio fiscal ${actaData.ejercicioFiscal}, no se han registrado hechos extraordinarios de 
        naturaleza administrativa, laboral o legal que requieran mención especial en el presente informe.
      </p>
      <p>
        La compañía ha operado de manera regular, cumpliendo con todas sus obligaciones contractuales, laborales y 
        legales, sin que se hayan presentado contingencias significativas que afecten la operación normal del negocio.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>6. CUMPLIMIENTO DE NORMATIVAS</h3>
    <p>
      He verificado el cumplimiento de las normativas aplicables durante el ejercicio fiscal ${actaData.ejercicioFiscal}, 
      incluyendo las disposiciones de la Ley de Compañías del Ecuador, las Normas Internacionales de Información Financiera 
      (${actaData.tipoNIIF || 'NIIF para PYMES'}), y las regulaciones emitidas por la Superintendencia de Compañías, 
      Valores y Seguros del Ecuador.
    </p>
    ${actaData.sancionesSCVS || actaData.sancionesOtrasAutoridades ? `
      <p>
        <strong>Nota sobre Sanciones:</strong> ${actaData.sancionesSCVS ? `Sanciones SCVS: ${actaData.sancionesSCVS}. ` : ''}
        ${actaData.sancionesOtrasAutoridades ? `Sanciones de otras autoridades: ${actaData.sancionesOtrasAutoridades}.` : ''}
      </p>
    ` : `
      <p>
        No se han aplicado sanciones a la compañía, a sus Directores o Administradores, emitidas por parte de la 
        Superintendencia de Compañías, Valores y Seguros del Ecuador o de otras autoridades administrativas durante 
        el ejercicio terminado el ${fechaCierre}.
      </p>
    `}
  </div>

  <div class="seccion">
    <h3>7. RECOMENDACIONES</h3>
    ${actaData.recomendacionesComisario ? `
      <p>${actaData.recomendacionesComisario}</p>
    ` : `
      <p>
        Para el ejercicio fiscal ${parseInt(actaData.ejercicioFiscal) + 1}, recomiendo a la Junta General de Accionistas 
        y a la administración de la compañía:
      </p>
      <ul>
        <li>
          Mantener el enfoque en la sostenibilidad del negocio y el cumplimiento estricto de todas las normativas aplicables.
        </li>
        <li>
          Continuar con las políticas de gestión implementadas y mantener la estructura organizacional actual.
        </li>
        <li>
          Asegurar el cumplimiento oportuno de todas las obligaciones legales, fiscales y comerciales de la compañía.
        </li>
        <li>
          Mantener una comunicación fluida con los accionistas y proporcionar información oportuna sobre el desarrollo 
          de las operaciones y la situación financiera de la compañía.
        </li>
        <li>
          Continuar con la preparación de los estados financieros conforme a las Normas Internacionales de Información 
          Financiera aplicables, asegurando la transparencia y la calidad de la información financiera.
        </li>
      </ul>
    `}
  </div>

  <div class="seccion">
    <h3>CONCLUSIÓN</h3>
    ${actaData.conclusionComisario ? `
      <p>${actaData.conclusionComisario}</p>
    ` : `
      <p>
        En conclusión, durante el ejercicio fiscal ${actaData.ejercicioFiscal}, la compañía ${actaData.nombreCompania.toUpperCase()} 
        ha operado de manera regular, cumpliendo con sus objetivos estratégicos y manteniendo el cumplimiento de todas las 
        normativas aplicables. La situación financiera se presenta estable y se han ejecutado las disposiciones de los órganos 
        de gobierno corporativo de manera adecuada.
      </p>
      <p>
        La gestión administrativa ha sido evaluada positivamente, no habiéndose identificado irregularidades significativas 
        que afecten de manera material la situación de la compañía. Los estados financieros reflejan razonablemente la situación 
        económica y financiera de la compañía al ${fechaCierre}.
      </p>
      <p>
        Me pongo a disposición para cualquier consulta o aclaración que los señores accionistas consideren necesaria.
      </p>
    `}
  </div>

  <div class="firmas">
    <div class="firma-box">
      <div class="firma-line"></div>
      <div class="firma-nombre">${nombreComisario.toUpperCase()}</div>
      ${cedulaComisario ? `<div class="firma-cedula">C.I. ${cedulaComisario}</div>` : ''}
      <div class="firma-cedula">COMISARIO</div>
    </div>
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #555;">
    <p>${actaData.ciudad}, ${fechaActual}</p>
  </div>
</body>
</html>
    `
  }

  // Función para formatear capital como USD
  const formatearCapitalUSD = (capital) => {
    if (!capital || capital === '') return 'NO ESPECIFICADO'
    const capitalNum = normalizarNumero(capital)
    if (capitalNum === 0) return 'USD 0.00'
    return `USD ${capitalNum.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const generarNotasExplicativas = () => {
    const fechaCierre = `31 de Diciembre de ${actaData.ejercicioFiscal}`
    const monedaTexto = 'DOLARES'
    const tipoNIIF = actaData.tipoNIIF || 'NIIF para PYMES'
    const domicilioCompleto = actaData.direccion || 'NO ESPECIFICADO'
    const capitalSuscritoFormateado = formatearCapitalUSD(actaData.capitalSuscrito)
    // Normalizar forma legal: si contiene "ANON" o "ANÓNIMA" mostrar como "SOCIEDAD ANÓNIMA"
    let formaLegal = actaData.formaLegal || 'SOCIEDAD POR ACCIONES SIMPLIFICADA'
    const formaLegalUpper = formaLegal.toUpperCase().trim()
    if (formaLegalUpper.includes('ANON') || formaLegalUpper.includes('ANÓNIMA') || formaLegalUpper === 'ANONIMA' || formaLegalUpper === 'ANÓNIMA') {
      formaLegal = 'SOCIEDAD ANÓNIMA'
    }
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notas Explicativas - ${actaData.nombreCompania}</title>
  <style>
    @page {
      size: letter;
      margin: 3cm 2.5cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1a1a1a;
      max-width: 21cm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }
    .caratula-container {
      min-height: calc(100vh - 6cm);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      page-break-after: always;
    }
    .header {
      text-align: center;
      margin-bottom: 0;
      padding: 40px 20px 30px 20px;
      border-bottom: 3px double #000;
      position: relative;
      width: 100%;
      max-width: 16cm;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 1px;
      background: #000;
    }
    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 0 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: #000;
      line-height: 1.3;
    }
    .header h2 {
      font-size: 16pt;
      font-weight: bold;
      margin: 20px 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #1a1a1a;
      line-height: 1.4;
    }
    .header .ruc {
      margin-top: 10px;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .intro {
      text-align: justify;
      margin-bottom: 30px;
      text-indent: 1.2cm;
      line-height: 2;
    }
    .intro p {
      margin-bottom: 10px;
    }
    .referencia-legal {
      background: #f0f0f0;
      border-left: 4px solid #333;
      padding: 10px 15px;
      margin: 15px 0;
      font-size: 10.5pt;
      font-style: italic;
      text-align: justify;
    }
    .referencia-legal strong {
      font-weight: bold;
      font-style: normal;
    }
    .nota-seccion {
      margin: 30px 0;
      page-break-inside: avoid;
      text-align: left;
    }
    .nota-seccion h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      color: #000;
    }
    .nota-item {
      margin-bottom: 18px;
      text-align: left;
      page-break-inside: avoid;
    }
    .nota-item p:first-child {
      margin-bottom: 8px;
      text-indent: 0;
    }
    .nota-item p:first-child strong {
      font-weight: bold;
      font-size: 12.5pt;
    }
    .nota-item p:not(:first-child) {
      margin: 6px 0;
      text-indent: 0;
      text-align: left;
      line-height: 1.6;
    }
    .nota-item strong {
      font-weight: bold;
    }
    .cita-legal {
      font-size: 10pt;
      color: #444;
      margin-top: 8px;
      margin-bottom: 5px;
      text-indent: 0;
      padding-left: 1.5cm;
      font-style: normal;
      border-left: 3px solid #666;
      padding-left: 12px;
      margin-left: 1.5cm;
    }
    .cita-legal::before {
      content: "Referencia: ";
      font-weight: bold;
      color: #333;
    }
    .tabla-info {
      width: 100%;
      margin: 15px 0;
      border-collapse: collapse;
      font-size: 11pt;
    }
    .tabla-info td {
      padding: 8px 12px;
      border-bottom: 1px solid #ddd;
    }
    .tabla-info td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .firma-box {
      text-align: center;
      width: 45%;
      min-width: 220px;
      display: flex;
      flex-direction: column;
    }
    .firma-line {
      border-top: 2px solid #000;
      margin-top: 80px;
      margin-bottom: 0;
      padding: 0;
      width: 100%;
      display: block;
      height: 2px;
    }
    .firma-nombre {
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 0;
      padding: 0;
      font-size: 12.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
      display: block;
      line-height: 1.2;
    }
    .firma-cargo {
      font-size: 11pt;
      margin-top: 4px;
      margin-bottom: 0;
      padding: 0;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #333;
      line-height: 1.2;
    }
    .firma-cedula {
      font-size: 10pt;
      margin-top: 3px;
      margin-bottom: 0;
      padding: 0;
      color: #555;
      line-height: 1.2;
    }
    .firmas {
      margin-top: 50px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 50px;
      font-size: 9.5pt;
      text-align: center;
      color: #555;
      font-style: italic;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .footer p {
      margin: 5px 0;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
      .firmas {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="caratula-container">
    <div class="header">
      <h1>Notas a los Estados Financieros al ${fechaCierre}</h1>
      <h2>${actaData.nombreCompania.toUpperCase()}</h2>
      <p style="margin-top: 20px; font-size: 14pt; font-weight: bold; letter-spacing: 0.5px;">Notas a los Estados Financieros</p>
      <p style="margin-top: 8px; font-size: 12pt; font-weight: bold; letter-spacing: 1px;">(${monedaTexto})</p>
    </div>
  </div>

  <div class="nota-seccion">
    <h3>1. IDENTIFICACIÓN DE LA EMPRESA Y ACTIVIDAD ECONÓMICA.</h3>
    
    <div class="nota-item">
      <p><strong>Nombre de la entidad:</strong></p>
      <p>${actaData.nombreCompania.toUpperCase()}</p>
    </div>

    <div class="nota-item">
      <p><strong>RUC de la entidad:</strong></p>
      <p>${actaData.ruc}</p>
    </div>

    <div class="nota-item">
      <p><strong>Domicilio de la entidad:</strong></p>
      <p>${domicilioCompleto}</p>
    </div>

    <div class="nota-item">
      <p><strong>Forma legal de la entidad:</strong></p>
      <p>${formaLegal}</p>
    </div>

    <div class="nota-item">
      <p><strong>País de incorporación:</strong></p>
      <p>ECUADOR</p>
    </div>

    ${actaData.fechaConstitucion ? `
    <div class="nota-item">
      <p><strong>Fecha de constitución:</strong></p>
      <p>${actaData.fechaConstitucion}</p>
    </div>
    ` : ''}

    ${actaData.objetoSocial ? `
    <div class="nota-item">
      <p><strong>Descripción:</strong></p>
      <p style="text-align: justify; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${actaData.objetoSocial}</p>
    </div>
    ` : ''}

    ${actaData.estructuraOrganizacional ? `
    <div class="nota-item">
      <p><strong>Estructura organizacional y societaria:</strong></p>
      <p>${actaData.estructuraOrganizacional}</p>
    </div>
    ` : `
    <div class="nota-item">
      <p><strong>Estructura organizacional y societaria:</strong></p>
      <p>${actaData.nombreCompania.toUpperCase()}, cuenta con personería jurídica, patrimonio y autonomía administrativa y operativa propia. La Compañía tiene una estructura de tipo funcional, contando con áreas operativas - funcionales interrelacionadas.</p>
    </div>
    `}

    <div class="nota-item">
      <p><strong>Representante legal:</strong></p>
      <p>${actaData.nombreGerente ? actaData.nombreGerente.toUpperCase() : '[NOMBRE DEL GERENTE]'}, quién representa a la Compañía, está facultado para dirigir y administrar los negocios sociales, celebrar y ejecutar a nombre de la Compañía y representar a ésta en toda clase de actos y contratos, mantener el cuidado de los bienes y fondos de la Compañía, suscribir y firmar a nombre de la Compañía todas las escrituras públicas e instrumentos privados en los que consten actos y contratos que celebre la compañía; entre otros.</p>
    </div>

    ${actaData.lineaNegocio ? `
    <div class="nota-item">
      <p><strong>Línea de negocio:</strong></p>
      <p>${actaData.lineaNegocio}</p>
    </div>
    ` : ''}

    ${actaData.accionistas && actaData.accionistas.length > 0 ? `
    <div class="nota-item">
      <p><strong>Composición empresarial</strong></p>
      <p>Las participaciones de ${actaData.nombreCompania.toUpperCase()} se encuentran distribuidas de la siguiente manera:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Cédula</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Nombres</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600;">% Acciones</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600;">Capital</th>
          </tr>
        </thead>
        <tbody>
          ${actaData.accionistas.map(acc => {
            const capitalFormateado = acc.capital ? formatearCapitalUSD(acc.capital) : '-'
            return `
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${acc.cedula || '-'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${acc.nombres || '-'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${acc.porcentaje ? acc.porcentaje + '%' : '-'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${capitalFormateado}</td>
            </tr>
          `
          }).join('')}
          <tr style="background-color: #f9fafb; font-weight: 600;">
            <td colspan="3" style="border: 1px solid #d1d5db; padding: 8px; text-align: right;"><strong>TOTAL:</strong></td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
              <strong>${(() => {
                // Función inline para normalizar números (misma lógica que normalizarNumero)
                const normalizar = (valor) => {
                  if (!valor || valor === '') return 0
                  let limpio = String(valor).trim().replace(/[^\d.,]/g, '')
                  if (limpio.includes(',') && limpio.includes('.')) {
                    const ultimoComa = limpio.lastIndexOf(',')
                    const ultimoPunto = limpio.lastIndexOf('.')
                    if (ultimoComa > ultimoPunto) {
                      limpio = limpio.replace(/\./g, '').replace(',', '.')
                    } else {
                      limpio = limpio.replace(/,/g, '')
                    }
                  } else if (limpio.includes(',')) {
                    const comas = (limpio.match(/,/g) || []).length
                    if (comas > 1) {
                      limpio = limpio.replace(/,/g, '')
                    } else {
                      const partes = limpio.split(',')
                      if (partes[1] && partes[1].length <= 3) {
                        limpio = limpio.replace(',', '.')
                      } else {
                        limpio = limpio.replace(',', '')
                      }
                    }
                  } else if (limpio.includes('.')) {
                    const puntos = (limpio.match(/\./g) || []).length
                    if (puntos > 1) {
                      limpio = limpio.replace(/\./g, '')
                    } else {
                      const partes = limpio.split('.')
                      if (partes[1] && partes[1].length <= 3) {
                        // Mantener como decimal
                      } else {
                        limpio = limpio.replace('.', '')
                      }
                    }
                  }
                  return parseFloat(limpio) || 0
                }
                const total = actaData.accionistas.reduce((sum, acc) => {
                  return sum + normalizar(acc.capital)
                }, 0)
                return `USD ${total.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              })()}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>

  <div class="nota-seccion">
    <h3>RESUMEN DE LAS PRINCIPALES POLÍTICAS CONTABLES</h3>
    <p style="margin-bottom: 15px; text-align: justify; text-indent: 1.2cm;">Una descripción de las principales políticas contables adoptadas en la preparación de sus estados financieros se presenta a continuación:</p>
    
    <div class="nota-item">
      <p><strong>1.1. Período contable.</strong></p>
      <p>• Los Estados de Situación Financiera clasificados al ${fechaCierre}, incluyen saldos contables con base en Normas Internacionales de Información Financiera (${tipoNIIF}).</p>
      <p>• Los Estados de Resultados por Función reflejan los movimientos acumulados al ${fechaCierre}, con base en Normas internacionales de Información Financiera (${tipoNIIF}).</p>
      <p>• Los Estados de Cambios en el Patrimonio Neto reflejan los movimientos ocurridos entre el 31 de Diciembre del año ${parseInt(actaData.ejercicioFiscal) - 1} y ${fechaCierre}, con base EN Normas Internacionales de Información Financiera (${tipoNIIF}).</p>
      <p>• Los Estados de Flujo de Efectivo - Método Directo reflejan los movimientos ocurridos entre el 31 de Diciembre del año ${parseInt(actaData.ejercicioFiscal) - 1} y ${fechaCierre} con base en Normas Internacionales de Información Financiera (${tipoNIIF}).</p>
    </div>

    <div class="nota-item">
      <p><strong>1.2. Bases de preparación.</strong></p>
      <p>El juego completo de estados financieros de ${actaData.nombreCompania.toUpperCase()} han sido preparados de acuerdo con Normas Internacionales de Información Financiera para pequeñas y medianas entidades (${tipoNIIF}), y considerando en el caso de ser necesario, las NIIF COMPLETAS emitidas por el Internacional Accounting Standards Board (IASB), así como los requerimientos y opciones informadas por la Superintendencia de Compañías del Ecuador.</p>
      <p>La preparación de los estados financieros conforme a las ${tipoNIIF}, requiere el uso de ciertas estimaciones contables críticas. También exige a la Administración que ejerza su juicio en el proceso de aplicación de las políticas contables.</p>
      <p>La Administración de la Compañía declara que las ${tipoNIIF} han sido aplicadas integralmente y sin reservas en la preparación del presente juego de estados financieros.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.3. Moneda funcional y su presentación.</strong></p>
      <p>Las cifras incluidas en estos estados financieros y en sus notas se valoran utilizando la moneda del entorno económico principal en que la Compañía opera. La moneda funcional y de presentación de ${actaData.nombreCompania.toUpperCase()} es el Dólar de los Estados Unidos de América.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.4. Clasificación de saldos en corrientes y no corrientes.</strong></p>
      <p>En el Estado de Situación Financiera Clasificado, los saldos se clasifican en función de sus vencimientos, como corriente con vencimiento igual o inferior a doce meses, contados desde la fecha de cierre de los estados financieros y como no corriente, los mayores a ese período.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.5. Efectivo y equivalentes de efectivo.</strong></p>
      <p>La Compañía considera como efectivo y equivalente al efectivo a los saldos en caja y bancos sin restricciones y todas las inversiones financieras de fácil liquidación pactadas a un máximo de noventa días, incluyendo depósitos a plazo. En el Estado de Situación Financiera Clasificado los sobregiros, de existir, se clasifican como obligaciones con instituciones financieras en el "Pasivo corriente".</p>
    </div>

    <div class="nota-item">
      <p><strong>1.6. Activos financieros.</strong></p>
      <p>Los activos financieros son clasificados en las siguientes categorías: préstamos y partidas por cobrar y su correspondiente pérdida por deterioro. La Compañía ha definido y valoriza sus activos financieros de la siguiente forma:</p>
      <p><strong>1.6.1. Préstamos y partidas por cobrar.</strong></p>
      <p>Los préstamos y partidas por cobrar, incluyen principalmente a cuentas por cobrar clientes relacionados y no relacionados.</p>
      <p>Las otras cuentas por cobrar clientes relacionados y no relacionados son valorizadas a valor nominal.</p>
      <p>Ambos grupos de cuentas corresponden a activos financieros no derivados con pagos fijos o determinables que no son cotizados en un mercado activo. Se incluyen en activos corrientes, excepto para vencimientos superiores a 12 meses desde de la fecha del balance que se clasifican como activos no corrientes.</p>
      <p><strong>1.6.2. Deterioro de cuentas incobrables.</strong></p>
      <p>Las pérdidas por deterioro relacionadas a cuentas incobrables se registran como gastos en el estado de resultados integrales por función, la determinación de este deterioro se lo registra en base a disposiciones legales y tributarias vigentes.</p>
      <p>En el caso de los activos financieros valorizados al costo amortizado, la pérdida por deterioro corresponde a las diferencias entre el valor en libros del activo y el valor presente de los flujos futuros de efectivo estimados descontados a la tasa de interés original del activo financiero.</p>
      <p>El criterio que utiliza la Compañía para determinar si existe evidencia objetiva de una pérdida por deterioro incluye:</p>
      <p>• Dificultad financiera significativa del emisor u obligado;</p>
      <p>• Incumplimiento del contrato, como el incumplimiento de pagos o mora en el pago del principal;</p>
      <p>• Es probable que el prestatario entrará en la bancarrota u otras reorganizaciones financieras</p>
      <p>• La desaparición de un mercado activo para ese activo financiero debido a dificultades financieras o</p>
      <p>• Información disponible que indica que hay una reducción medible en los flujos de efectivo estimados de una cartera de activos financieros desde su reconocimiento inicial, aunque la reducción aún no se pueda identificar con los activos financieros individuales en la cartera.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.7. Servicios y otros pagos anticipados.</strong></p>
      <p>Corresponden principalmente a seguros pagados por anticipado y otros anticipos entregados a terceros para servicios o compra de bienes, los cuales se encuentran valorizados a su valor nominal y no cuentan con derivados implícitos significativos que generen la necesidad de presentarlos por separado.</p>
      <p>Los seguros pagados por anticipado son amortizados mensualmente considerando el período para el cual generan beneficios económicos futuros.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.8. Activos por impuestos corrientes.</strong></p>
      <p>Corresponden principalmente a: anticipos de impuesto a la renta, crédito tributario (IVA) y retenciones en la fuente, los cuales se encuentran valorizados a su valor nominal y no cuentan con derivados implícitos significativos que generen la necesidad de presentarlos por separado.</p>
      <p>Las pérdidas por deterioro de impuestos a no recuperar se registran como gastos en el estado de resultados integrales por función, en base al análisis de recuperación o compensación de cada una de las cuentas por cobrar.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.9. Cuentas por pagar comerciales y otras cuentas por pagar.</strong></p>
      <p>Las cuentas por pagar comerciales y otras cuentas por pagar corrientes se reconocen a su valor nominal, ya que su plazo medio de pago es reducido y no existe diferencia material con su valor razonable, además que a un porcentaje importante de las compras realizadas, son pagadas de forma anticipada a sus proveedores.</p>
      <p>Las cuentas por pagar comerciales incluyen aquellas obligaciones de pago con proveedores locales y del exterior de bienes y servicios adquiridos en el curso normal de negocio.</p>
      <p>Las otras cuentas por pagar corresponden principalmente a cuentas por pagar propias del giro del negocio, tales como: anticipos de clientes, obligaciones patronales y tributarias, que son reconocidas inicial y posteriormente a su valor nominal.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.10. Préstamos y otros pasivos financieros.</strong></p>
      <p>Los préstamos y otros pasivos financieros corresponden a las obligaciones con instituciones financieras, las cuales se reconocen inicialmente al valor razonable de la transacción y posteriormente se valoran a su costo amortizado y cualquier diferencia entre los fondos obtenidos (netos de los costos necesarios para su obtención) y el valor de reembolso, se reconoce en el estado de resultados durante el período de vigencia de la deuda de acuerdo con el método de la tasa de interés efectiva, de igual manera corresponden a pasivos financieros no derivados con pagos fijos o determinables que no son cotizados en un mercado activo.</p>
      <p>Estos pasivos financieros son presentados en el estado de situación financiera como corrientes o no corrientes considerando las fechas de vencimiento de sus pagos, es decir, cuando sea inferior a 12 meses (corriente) y mayores a 12 meses (no corriente).</p>
      <p><strong>Baja de activos y pasivos financieros.</strong></p>
      <p>• Activos financieros: Un activo financiero (o, cuando sea aplicable una parte de un activo financiero o una parte de un grupo de activos financieros similares) es dado de baja cuando:</p>
      <p>• Los derechos de recibir flujos de efectivo del activo han terminado; o</p>
      <p>• La Compañía ha transferido sus derechos a recibir flujos de efectivo del activo o ha asumido una obligación de pagar la totalidad de los flujos de efectivo recibidos inmediatamente a una tercera parte bajo un acuerdo de traspaso ("pass through"); y</p>
      <p>• La Compañía ha transferido sustancialmente todos los riesgos y beneficios del activo o, de no haber transferido ni retenido sustancialmente todos los riesgos y beneficios del activo, si ha transferido su control.</p>
      <p>• Pasivos financieros: Un pasivo financiero es dado de baja cuando la obligación de pago se termina, se cancela o vence. Cuando un pasivo financiero existente es reemplazado por otro del mismo prestatario en condiciones significativamente diferentes, o las condiciones son modificadas en forma importante, dicho reemplazo o modificación se trata como una baja del pasivo original y el reconocimiento de un nuevo pasivo, reconociéndose a diferencia entre ambos en los resultados del período.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.11. Provisiones.</strong></p>
      <p>La Compañía considera que las provisiones se reconocen cuando:</p>
      <p>• La Compañía tiene una obligación futura, ya sea legal o implícita, como resultado de sucesos presentes.</p>
      <p>• Es probable que vaya a ser necesaria una salida de recursos para liquidar la obligación.</p>
      <p>• El importe se ha estimado de forma fiable.</p>
      <p>Las provisiones son evaluadas periódicamente y se cuantifican teniendo en consideración la mejor información disponible a la fecha de cada cierre de los estados financieros.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.12. Beneficios a los empleados.</strong></p>
      <p>Los importes de beneficios a empleados a largo plazo y post empleo serán estimados por un perito independiente, inscrito y calificados en la Superintendencia de Compañías cuando la administración considere oportuno.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.13. Impuesto a las ganancias e impuestos diferidos.</strong></p>
      <p>El gasto por impuesto a la renta del período comprende al impuesto a la renta corriente y al impuesto diferido, las tasas de impuesto a las ganancias para el año ${actaData.ejercicioFiscal} ascienden a ${actaData.tasaImpuestoRenta || '25'}%.</p>
      <p>El gasto por impuesto a la renta corriente se determina sobre la base imponible y se calcula de acuerdo con las disposiciones legales y tributarias vigentes para cada período contable.</p>
      <p>Los activos y pasivos por impuesto diferido, para el ejercicio actual son medidos al monto que se estima recuperar o pagar a las autoridades tributarias. Las tasas impositivas y regulaciones fiscales empleadas en el cálculo de dichos importes son las que están vigentes a la fecha de cierre de cada ejercicio, siendo de un ${actaData.tasaImpuestoRenta || '25'}% para los años ${actaData.ejercicioFiscal}.</p>
      <p>La Compañía registra los impuestos diferidos sobre la base de las diferencias temporales imponibles o deducibles que existen entre la base tributaria de activos y pasivos y su base financiera.</p>
      <p>El resultado por impuesto a las ganancias se determina por la provisión de impuestos a las ganancias del ejercicio, más la variación de los activos y pasivos por impuestos diferidos.</p>
      <p>En cada cierre contable se revisan los impuestos registrados tanto activos como pasivos con el objeto de comprobar que se mantienen vigentes, efectuándose las oportunas correcciones a los mismos de acuerdo con el resultado del citado análisis.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.14. Capital suscrito.</strong></p>
      <p>Las participaciones se registran a su valor nominal y se clasifican como patrimonio neto.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.15. Ingresos de actividades ordinarias.</strong></p>
      <p>Se reconocerá ingresos de actividades ordinarias procedentes de la venta de bienes cuando se satisfagan todas y cada una de las siguientes condiciones:</p>
      <p>• La entidad ha transferido al comprador los riesgos y ventajas, de tipo significativo, derivados de la propiedad de los bienes;</p>
      <p>• La entidad no conserva para sí ninguna implicación en la gestión corriente de los bienes vendidos, en el grado usualmente asociado con la propiedad, ni retiene el control efectivo sobre los mismos;</p>
      <p>• El importe de los ingresos de actividades ordinarias pueda medirse con fiabilidad;</p>
      <p>• Sea probable que la entidad obtenga los beneficios económicos asociados con la transacción; y</p>
      <p>• los costos incurridos, o por incurrir, en relación con la transacción pueden ser medidos con fiabilidad.</p>
      <p>Cuando el resultado de una transacción que involucre la prestación de servicios pueda ser estimado con fiabilidad, una entidad reconocerá los ingresos de actividades ordinarias asociados con la transacción, por referencia al grado de terminación de la transacción al final del periodo sobre el que se informa (a veces conocido como el método del porcentaje de terminación). El resultado de una transacción puede ser estimado con fiabilidad cuando se cumplen todas y cada una de las siguientes condiciones:</p>
      <p>• el importe de los ingresos de actividades ordinarias pueda medirse con fiabilidad;</p>
      <p>• sea probable que la entidad reciba los beneficios económicos asociados con la transacción;</p>
      <p>• el grado de realización de la transacción, al final del periodo sobre el que se informa, pueda ser medido con fiabilidad; y</p>
      <p>• los costos incurridos en la transacción, y los costos para completarla, puedan medirse con fiabilidad.</p>
      <p>Los ingresos por actividades ordinarias se presentan netos de devoluciones, rebajas y descuentos.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.16. Costo de ventas.</strong></p>
      <p>El costo de venta incluye todos aquellos costos relacionados con la venta del software de administración de la planificación de proyectos.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.17. Gastos de administración y ventas.</strong></p>
      <p>Los gastos de administración y ventas corresponden principalmente a las erogaciones relacionadas con: remuneraciones del personal, pago de servicios básicos, publicidad, depreciación de equipos y otros gastos generales asociados a la actividad administrativa y de ventas de la Compañía.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.18. Medio ambiente.</strong></p>
      <p>La actividad de la Compañía no se encuentra dentro de las que pudieren afectar el medio ambiente, por lo tanto, a la fecha de cierre de los presentes estados financieros no tiene comprometidos recursos ni se han efectuado pagos derivados de incumplimiento de ordenanzas municipales u otros organismos fiscalizadores.</p>
    </div>

    <div class="nota-item">
      <p><strong>1.19. Estado de Flujos de Efectivo.</strong></p>
      <p>Bajo flujos originados por actividades de la operación, se incluyen todos aquellos flujos de efectivo relacionados con el giro del negocio, incluyendo además los intereses pagados, los ingresos financieros y en general, todos aquellos flujos que no están definidos como de inversión o financiamiento. Cabe destacar que el concepto operacional utilizado en este estado, es más amplio que el considerado en el estado de resultados.</p>
    </div>
  </div>

  <div class="nota-seccion">
    <h3>2. POLÍTICA DE GESTIÓN DE RIESGOS</h3>
    
    <div class="nota-item">
      <p><strong>2.1. Factores de riesgo.</strong></p>
      <p>La Gerencia General y Gerencia Administrativa y Financiera de la Compañía son las responsables de monitorear periódicamente los factores de riesgo más relevantes de ${actaData.nombreCompania.toUpperCase()}, en base a una metodología de evaluación continua. La Compañía administra una serie de procedimientos y políticas desarrolladas para disminuir su exposición al riesgo frente a variaciones de inflación.</p>
    </div>

    <div class="nota-item">
      <p><strong>2.2. Riesgo financiero.</strong></p>
      <p><strong>2.2.1 Riesgo operacional.</strong></p>
      <p>El riesgo operacional que administra ${actaData.nombreCompania.toUpperCase()}, gira en torno a la fijación de precios.</p>
      <p><strong>2.2.2 Riesgo de liquidez.</strong></p>
      <p>El riesgo de liquidez de ${actaData.nombreCompania.toUpperCase()}, es administrado mediante una adecuada gestión de los activos y pasivos, optimizando de esta forma los excedentes de caja y de esta manera asegurar el cumplimiento de los compromisos de deudas al momento de su vencimiento.</p>
      <p>${actaData.nombreCompania.toUpperCase()}, realiza periódicamente proyecciones de flujo de caja, análisis de la situación financiera, el entorno económico con el propósito de obtener los recursos de liquidez necesarios para que la empresa cumpla con sus obligaciones.</p>
      <p><strong>2.2.3 Riesgo de inflación.</strong></p>
      <p>El riesgo de inflación proviene del proceso de la elevación continuada de los precios con un descenso discontinuado del valor del dinero. El dinero pierde valor cuando con él no se puede comprar la misma cantidad de inventarios o activos fijos que anteriormente se compraba.</p>
      <p>De acuerdo al Banco Central del Ecuador la inflación acumulada para cada año fue la siguiente:</p>
      ${actaData.inflacionAnual ? `<p>${actaData.inflacionAnual}</p>` : `
      <p>• Año ${actaData.ejercicioFiscal}: ${parseFloat(actaData.ejercicioFiscal) >= 2024 ? '0.53%' : 'N/D'}</p>
      <p>• Año ${parseInt(actaData.ejercicioFiscal) - 1}: ${parseFloat(actaData.ejercicioFiscal) >= 2024 ? '2.85%' : 'N/D'}</p>
      <p>• Año ${parseInt(actaData.ejercicioFiscal) - 2}: ${parseFloat(actaData.ejercicioFiscal) >= 2024 ? '3.74%' : 'N/D'}</p>
      `}
    </div>

    <div class="nota-item">
      <p><strong>2.3. Riesgo crediticio.</strong></p>
      <p>El riesgo de crédito es el riesgo de que una contraparte no pueda cumplir con sus obligaciones en relación con un instrumento financiero o contrato de venta, generando una pérdida financiera. La Compañía está expuesta a un riesgo de crédito por sus actividades operativas.</p>
      <p>El riesgo de crédito surge del efectivo y equivalentes de efectivo, depósitos en bancos e instituciones financieras, así como la exposición al crédito de clientes, que incluyen a los saldos pendientes de las cuentas por cobrar y a las transacciones comprometidas.</p>
      <p>Los principales activos financieros de ${actaData.nombreCompania.toUpperCase()}, son los saldos de caja y efectivo, deudores comerciales y otras cuentas por cobrar, e inversiones, que representan la exposición máxima de la Compañía al riesgo de crédito en relación con los activos financieros.</p>
      <p>El riesgo del crédito de la Compañía es atribuible principalmente a sus deudas comerciales. Los importes se reflejan en el balance de situación netos de provisiones para insolvencias, estimadas por la Administración de la Compañía en función de la experiencia de ejercicios anteriores y su valoración del entorno económico actual</p>
    </div>

    <div class="nota-item">
      <p><strong>2.4. Riesgo de tasa de interés.</strong></p>
      <p>El principal objetivo en la gestión de riesgo de la tasa de interés es obtener un equilibrio a la estructura de financiamiento, lo cual, permite a ${actaData.nombreCompania.toUpperCase()} minimizar el costo de la deuda con una volatilidad reducida en el estado de resultados. Este descenso en las tasas de interés se debe una política de gobierno, que mediante decretos presidenciales organizo el manejo y la fijación de las tasas.</p>
    </div>
  </div>

  <div class="nota-seccion">
    <h3>3. ESTIMACIONES Y JUICIOS O CRITERIOS CRÍTICOS DE LA ADMINISTRACIÓN</h3>
    
    <div class="nota-item">
      <p>Las estimaciones y criterios usados son continuamente evaluados y se basan en la experiencia histórica y otros factores, incluyendo la expectativa de ocurrencia de eventos futuros que se consideran razonables de acuerdo a las circunstancias.</p>
      <p>La Compañía efectúa estimaciones y supuestos respecto del futuro. Las estimaciones contables resultantes, por definición, muy pocas veces serán iguales a los resultados reales. Las estimaciones y supuestos efectuados por la Administración se presentan a continuación:</p>
    </div>

    <div class="nota-item">
      <p><strong>3.1. Vidas útiles y de deterioro de activos.</strong></p>
      <p>La Administración es quien determina las vidas útiles estimadas y los correspondientes cargos por depreciación para su propiedades, planta y equipos, ésta estimación se basa en los ciclos de vida de los activos en función del uso esperado por la Compañía, considerando como base depreciable al valor resultante entre el costo de adquisición del bien menos su valor de recuperación estimado.</p>
      <p>Adicionalmente, de acuerdo a lo dispuesto por la Sección 27 "Deterioro de valor de activos", la Compañía evalúa al cierre de cada ejercicio anual o antes, si existe algún indicio de deterioro, el valor recuperable de los activos de largo plazo, para comprobar si hay pérdida de deterioro en el valor de los activos.</p>
    </div>

    <div class="nota-item">
      <p><strong>3.2. Estimación de valores razonables de existencias para consumo.</strong></p>
      <p>Las existencias a ser consumidas o utilizadas en la prestación de servicios se valorizan al costo.</p>
      <p>Los costos de las existencias incluye; todos los costos derivados de la compra y otros costos incurridos en dicho proceso, los cuales son considerados como costo de ventas.</p>
      <p>Todos los costos indirectos de Administración que no hayan contribuido a dar a la existencia su condición y ubicación actual como los costos de comercialización son reconocidos como gastos en el período en que se incurra.</p>
    </div>

    <div class="nota-item">
      <p><strong>3.3. Otras estimaciones.</strong></p>
      <p>La Compañía ha utilizado estimaciones para valorar y registrar algunos de los activos, pasivos, ingresos, gastos y compromisos. Básicamente estas estimaciones se refieren a:</p>
      <p>• La evaluación de posibles pérdidas por deterioro de determinados activos.</p>
      <p>• La vida útil de los activos materiales e intangibles.</p>
      <p>• Los criterios empleados en la valoración de determinados activos.</p>
      <p>• La necesidad de constituir provisiones y, en el caso de ser requeridas, el valor de las mismas.</p>
      <p>• La recuperabilidad de los activos por impuestos diferidos.</p>
      <p>• Valor actuarial de indemnizaciones por años de servicio.</p>
      <p>La determinación de estas estimaciones está basada en la mejor estimación de los desembolsos que será necesario pagar por la correspondiente obligación, tomando en consideración toda la información disponible a la fecha del período, incluyendo la opinión de expertos independientes tales como asesores legales y consultores.</p>
      <p>En el caso que las estimaciones deban ser modificadas por cambios del entorno económico y financiero de las mismas, dichas modificaciones afectarán al período contable en el que se generen, y su registro contable se lo realizaría de forma prospectiva.</p>
    </div>
  </div>

  <div class="nota-seccion">
    <h3>Otra Información Relevante</h3>
    
    <div class="nota-item">
      <p><strong>SANCIONES</strong></p>
      <p><strong>De la Superintendencia de Compañías.</strong></p>
      ${actaData.sancionesSCVS ? `<p>${actaData.sancionesSCVS}</p>` : `<p>No se han aplicado sanciones a ${actaData.nombreCompania.toUpperCase()}, a sus Directores o Administradores, emitidas por parte de la Superintendencia de Compañías durante el ejercicio terminado el ${fechaCierre}.</p>`}
      <p><strong>De otras autoridades administrativas.</strong></p>
      ${actaData.sancionesOtrasAutoridades ? `<p>${actaData.sancionesOtrasAutoridades}</p>` : `<p>No se han aplicado sanciones significativas a ${actaData.nombreCompania.toUpperCase()}, a sus Directores o Administradores, emitidas por parte de otras autoridades administrativas al ${fechaCierre}.</p>`}
    </div>

    <div class="nota-item">
      <p><strong>Hechos posteriores a la fecha de balance.</strong></p>
      <p>Con posterioridad al ${fechaCierre} y hasta la fecha de emisión de estos estados financieros, no se tiene conocimiento de otros hechos de carácter financiero o de otra índole, que afecten en forma significativa los saldos o interpretación de los mismos.</p>
    </div>
  </div>

      <div class="firmas">
        <div class="firma-box">
          <div class="firma-line"></div>
          <div class="firma-nombre">${actaData.nombreGerente || '[Nombre del Gerente]'}</div>
          <div class="firma-cargo">GERENTE GENERAL</div>
          ${actaData.cedulaGerente ? `<div class="firma-cedula">C.I. ${actaData.cedulaGerente}</div>` : ''}
        </div>
      </div>

  <div style="margin-top: 50px; text-align: right;">
    <p style="margin-top: 30px;"><strong>Atentamente.</strong></p>
  </div>
</body>
</html>
    `
  }

  const generarActaJunta = (e) => {
    e.preventDefault()
    
    // Validar campos requeridos
    if (!actaData.nombreCompania || !actaData.ruc || !actaData.ciudad || 
        !actaData.dia || !actaData.mes || !actaData.hora || !actaData.direccion ||
        !actaData.porcentajeQuorum || !actaData.nombreGerente || !actaData.nombreSecretario) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    const lugarTexto = actaData.modalidad === 'presencial' 
      ? `en el domicilio principal de la compañía, ubicado en ${actaData.direccion || 'el domicilio de la compañía'}`
      : actaData.modalidad === 'virtual'
      ? `de manera virtual mediante plataforma digital`
      : `de manera presencial en ${actaData.direccion || 'el domicilio de la compañía'} y de manera virtual mediante plataforma digital`

    const fechaCompleta = `${actaData.dia} de ${actaData.mes} de ${actaData.anio}`
    const horaCompleta = actaData.hora

    // Generar todos los informes
    const actaHTML = generarActaFormal()
    const notasHTML = generarNotasExplicativas()
    const informeGerenteHTML = generarInformeGerente()
    const informeComisarioHTML = generarInformeComisario()
    
    setInformesGenerados({
      actaJunta: actaHTML,
      informeGerente: informeGerenteHTML,
      notasExplicativas: notasHTML,
      informeComisario: informeComisarioHTML
    })
  }

  const descargarPDF = (tipoInforme, contenido) => {
    if (!contenido) return

    const titulos = {
      actaJunta: `Acta de Junta General - ${actaData.nombreCompania || 'Compañía'}`,
      informeGerente: `Informe del Gerente - ${actaData.nombreCompania || 'Compañía'}`,
      notasExplicativas: `Notas Explicativas - ${actaData.nombreCompania || 'Compañía'}`,
      informeComisario: `Informe del Comisario - ${actaData.nombreCompania || 'Compañía'}`
    }

    const titulo = titulos[tipoInforme] || 'Documento'
    const ventana = window.open('', '_blank')
    
    // Establecer título antes de escribir el contenido
    ventana.document.title = titulo
    
    // Modificar el HTML para incluir el título correcto
    const htmlConTitulo = contenido.replace(
      /<title>.*?<\/title>/,
      `<title>${titulo}</title>`
    )
    
    ventana.document.write(htmlConTitulo)
    ventana.document.close()
    
    setTimeout(() => {
      ventana.print()
    }, 250)
  }

  const descargarHTML = (tipoInforme, contenido) => {
    if (!contenido) return

    const nombresArchivo = {
      actaJunta: `Acta_Junta_General_${actaData.nombreCompania.replace(/\s+/g, '_')}_${actaData.ruc}.html`,
      informeGerente: `Informe_Gerente_${actaData.nombreCompania.replace(/\s+/g, '_')}_${actaData.ruc}.html`,
      notasExplicativas: `Notas_Explicativas_${actaData.nombreCompania.replace(/\s+/g, '_')}_${actaData.ruc}.html`,
      informeComisario: `Informe_Comisario_${actaData.nombreCompania.replace(/\s+/g, '_')}_${actaData.ruc}.html`
    }

    const blob = new Blob([contenido], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const nombreArchivo = nombresArchivo[tipoInforme] || `Informe_SCVS_${Date.now()}.html`
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const limpiarFormulario = () => {
    setActaData({
      nombreCompania: '',
      ruc: '',
      ciudad: '',
      dia: '16',
      mes: 'Marzo',
      anio: '2025',
      hora: '10:00',
      direccion: '',
      modalidad: 'presencial',
      fechaConvocatoria: '',
      porcentajeQuorum: '100',
      nombrePresidente: '',
      cedulaPresidente: '',
      nombreSecretario: 'CENTENO HOLGUIN KEVIN JULIAN',
      cedulaSecretario: '0958398984',
      nombreGerente: '',
      cedulaGerente: '',
      nombreComisario: 'LAINEZ TUMBACO ROBERT DANIEL',
      cedulaComisario: '0930070552',
      ejercicioFiscal: '2024',
      distribucionUtilidades: '',
      otrosAsuntos: '',
      horaCierre: '12:00',
      objetoSocial: '',
      fechaConstitucion: '',
      capitalSuscrito: '',
      formaLegal: '',
      estructuraOrganizacional: '',
      accionistas: [],
      tipoNIIF: 'NIIF para PYMES',
      tasaImpuestoRenta: '25',
      sancionesSCVS: '',
      sancionesOtrasAutoridades: '',
      inflacionAnual: '',
      lineaNegocio: '',
      // Campos para Informe del Gerente
      cumplimientoObjetivos: '',
      cumplimientoDisposiciones: '',
      hechosExtraordinarios: '',
      situacionFinanciera: '',
      recomendaciones: '',
      cumplimientoNormas: '',
      // Campos para Informe del Comisario
      evaluacionFinanciera: '',
      observacionesGestion: '',
      observacionesEstadosFinancieros: '',
      observacionesCumplimiento: '',
      recomendacionesComisario: '',
      conclusionComisario: '',
    })
    setInformesGenerados({
      actaJunta: null,
      informeGerente: null,
      notasExplicativas: null,
      informeComisario: null
    })
  }

  // Formulario único para generar todos los informes
  return (
    <div style={{ padding: 8 }}>
        <style>{`
          .isc-form {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          }
          .isc-title {
            font-size: 16px;
            font-weight: 800;
            margin: 0 0 12px;
            color: #111827;
          }
          .isc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 12px;
            margin-bottom: 12px;
          }
          .isc-field {
            display: flex;
            flex-direction: column;
          }
          .isc-label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
          }
          .isc-label.required::after {
            content: ' *';
            color: #dc2626;
          }
          .isc-input, .isc-select, .isc-textarea {
            padding: 8px 10px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
          }
          .isc-input:focus, .isc-select:focus, .isc-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .isc-textarea {
            resize: vertical;
            min-height: 80px;
          }
          .isc-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 16px;
          }
          .isc-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .isc-btn-primary {
            background: #3b82f6;
            color: white;
          }
          .isc-btn-primary:hover {
            background: #2563eb;
          }
          .isc-btn-secondary {
            background: #10b981;
            color: white;
          }
          .isc-btn-secondary:hover {
            background: #059669;
          }
          .isc-btn-tertiary {
            background: #6b7280;
            color: white;
          }
          .isc-btn-tertiary:hover {
            background: #4b5563;
          }
          .isc-btn-back {
            background: #e5e7eb;
            color: #374151;
          }
          .isc-btn-back:hover {
            background: #d1d5db;
          }
          .isc-preview {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
          }
          .isc-preview-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #111827;
          }
          .isc-preview-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }
          .isc-info {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 12px;
            font-size: 12px;
            color: #1e40af;
          }
          @media (max-width: 768px) {
            .isc-grid {
              grid-template-columns: 1fr;
            }
            .isc-buttons, .isc-preview-actions {
              flex-direction: column;
            }
            .isc-btn {
              width: 100%;
            }
          }
        `}</style>

        <div style={{ marginBottom: '16px' }}>
          <h3 className="isc-title">Informes Anuales - Superintendencia de Compañías</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            Complete el formulario para generar todos los informes requeridos por la SCVS
          </p>
        </div>
        
        <div className="isc-info">
          Complete los campos requeridos (*) para generar todos los informes. Los documentos se generarán listos para imprimir y firmar, conforme a las disposiciones de la SCVS para 2025-2026.
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                🔍 Buscar por RUC
              </label>
              <input
                type="text"
                placeholder="Ingrese RUC (13 dígitos)"
                maxLength="13"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
                onKeyPress={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const ruc = e.target.value.replace(/\D/g, '')
                    if (ruc.length === 13) {
                      await buscarYCargarEmpresa(ruc, 'ruc')
                    } else {
                      alert('El RUC debe tener 13 dígitos')
                    }
                  }
                }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                🔍 Buscar por Expediente
              </label>
              <input
                type="text"
                placeholder="Ingrese número de expediente"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
                onKeyPress={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const expediente = e.target.value.trim()
                    if (expediente) {
                      await buscarYCargarEmpresa(expediente, 'expediente')
                    }
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                const rucInput = document.querySelector('input[placeholder*="RUC"]')
                const expedienteInput = document.querySelector('input[placeholder*="Expediente"]')
                const ruc = rucInput?.value.replace(/\D/g, '')
                const expediente = expedienteInput?.value.trim()
                
                if (ruc && ruc.length === 13) {
                  await buscarYCargarEmpresa(ruc, 'ruc')
                } else if (expediente) {
                  await buscarYCargarEmpresa(expediente, 'expediente')
                } else {
                  alert('Ingrese un RUC o Expediente para buscar')
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Buscar
            </button>
          </div>
        </div>

        <form className="isc-form" onSubmit={generarActaJunta}>
          <div className="isc-grid">
            <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
              <label className="isc-label required">Nombre de la Compañía</label>
              <input
                type="text"
                name="nombreCompania"
                value={actaData.nombreCompania}
                onChange={handleActaChange}
                className="isc-input"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">RUC</label>
              <input
                type="text"
                name="ruc"
                value={actaData.ruc}
                onChange={handleActaChange}
                className="isc-input"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={actaData.ciudad}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: Quito"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Día</label>
              <input
                type="text"
                name="dia"
                value={actaData.dia}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: 15"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Mes</label>
              <input
                type="text"
                name="mes"
                value={actaData.mes}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: enero"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Año</label>
              <input
                type="text"
                name="anio"
                value={actaData.anio}
                onChange={handleActaChange}
                className="isc-input"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Hora de inicio</label>
              <input
                type="text"
                name="hora"
                value={actaData.hora}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: 10:00"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label">Hora de cierre</label>
              <input
                type="text"
                name="horaCierre"
                value={actaData.horaCierre}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: 12:00"
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Modalidad</label>
              <select
                name="modalidad"
                value={actaData.modalidad}
                onChange={handleActaChange}
                className="isc-select"
                required
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="mixta">Mixta (Presencial y Virtual)</option>
              </select>
            </div>

            <div className="isc-field">
              <label className="isc-label required">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={actaData.direccion}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: CHIMBORAZO / RIOBAMBA / VELOZ / POLONIA 7 Y PASAJE"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label">Fecha de convocatoria</label>
              <input
                type="text"
                name="fechaConvocatoria"
                value={actaData.fechaConvocatoria}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: 1 de enero de 2025"
              />
            </div>

            <div className="isc-field">
              <label className="isc-label required">Porcentaje de quórum (%)</label>
              <input
                type="text"
                name="porcentajeQuorum"
                value={actaData.porcentajeQuorum}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: 75"
                required
              />
            </div>

            <details className="isc-details" style={{ gridColumn: '1 / -1' }}>
              <summary className="isc-summary">Representantes y autoridades (expandir/contraer)</summary>
              <div className="isc-details-content">
                <div className="isc-field">
                  <label className="isc-label">Nombre del Presidente</label>
                  <input
                    type="text"
                    name="nombrePresidente"
                    value={actaData.nombrePresidente}
                    onChange={handleActaChange}
                    className="isc-input"
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label">Cédula del Presidente</label>
                  <input
                    type="text"
                    name="cedulaPresidente"
                    value={actaData.cedulaPresidente}
                    onChange={handleActaChange}
                    className="isc-input"
                    placeholder="Ej: 1234567890"
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label required">Nombre del Secretario</label>
                  <input
                    type="text"
                    name="nombreSecretario"
                    value={actaData.nombreSecretario}
                    onChange={handleActaChange}
                    className="isc-input"
                    required
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label">Cédula del Secretario</label>
                  <input
                    type="text"
                    name="cedulaSecretario"
                    value={actaData.cedulaSecretario}
                    onChange={handleActaChange}
                    className="isc-input"
                    placeholder="Ej: 1234567890"
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label required">Nombre del Gerente General</label>
                  <input
                    type="text"
                    name="nombreGerente"
                    value={actaData.nombreGerente}
                    onChange={handleActaChange}
                    className="isc-input"
                    required
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label">Cédula del Gerente General</label>
                  <input
                    type="text"
                    name="cedulaGerente"
                    value={actaData.cedulaGerente}
                    onChange={handleActaChange}
                    className="isc-input"
                    placeholder="Ej: 1234567890"
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label">Nombre del Comisario</label>
                  <input
                    type="text"
                    name="nombreComisario"
                    value={actaData.nombreComisario}
                    onChange={handleActaChange}
                    className="isc-input"
                  />
                </div>

                <div className="isc-field">
                  <label className="isc-label">Cédula del Comisario</label>
                  <input
                    type="text"
                    name="cedulaComisario"
                    value={actaData.cedulaComisario}
                    onChange={handleActaChange}
                    className="isc-input"
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>
            </details>

            <div className="isc-field">
              <label className="isc-label">Ejercicio Fiscal</label>
              <input
                type="text"
                name="ejercicioFiscal"
                value={actaData.ejercicioFiscal}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: 2024"
              />
            </div>

          </div>

          <details className="isc-details" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
            <summary className="isc-summary">Distribución de Utilidades y Otros Asuntos (expandir/contraer)</summary>
            <div className="isc-details-content">
              <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                <label className="isc-label">Distribución de Utilidades</label>
                <textarea
                  name="distribucionUtilidades"
                  value={actaData.distribucionUtilidades}
                  onChange={handleActaChange}
                  className="isc-textarea"
                  placeholder="Ejemplo: Se resolvió distribuir las utilidades del ejercicio fiscal 2024 de la siguiente manera: (i) el 10% para la reserva legal conforme al Artículo 199 de la Ley de Compañías; (ii) el 5% para reservas estatutarias; y (iii) el 85% restante se distribuirá entre los accionistas de acuerdo con su participación accionaria. Dejar vacío para usar texto predeterminado."
                />
              </div>

              <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                <label className="isc-label">Otros Asuntos</label>
                <textarea
                  name="otrosAsuntos"
                  value={actaData.otrosAsuntos}
                  onChange={handleActaChange}
                  className="isc-textarea"
                  placeholder="Otros asuntos tratados en la junta (dejar vacío si no hay)"
                />
              </div>
            </div>
          </details>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              📝 Información para Notas Explicativas (Opcional)
            </h4>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Complete estos campos para enriquecer las notas explicativas. Si se dejan vacíos, se usarán valores predeterminados.
            </p>

            <div className="isc-grid">
              <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                <label className="isc-label">Objeto Social</label>
                <textarea
                  name="objetoSocial"
                  value={actaData.objetoSocial}
                  onChange={handleActaChange}
                  className="isc-textarea"
                  placeholder="Descripción del objeto social de la compañía"
                  style={{ 
                    minHeight: '120px',
                    width: '100%',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    padding: '12px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}
                />
              </div>

              <div className="isc-field">
                <label className="isc-label">Fecha de Constitución</label>
                <input
                  type="text"
                  name="fechaConstitucion"
                  value={actaData.fechaConstitucion}
                  onChange={handleActaChange}
                  className="isc-input"
                  placeholder="Ej: 15 de marzo de 2020"
                />
              </div>

              <div className="isc-field">
                <label className="isc-label">Capital Suscrito</label>
                <input
                  type="text"
                  name="capitalSuscrito"
                  value={actaData.capitalSuscrito}
                  onChange={handleActaChange}
                  className="isc-input"
                  placeholder="Ej: USD 80,000.00"
                />
              </div>

              <div className="isc-field" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="isc-label" style={{ marginBottom: 0 }}>Composición Accionaria</label>
                  <button
                    type="button"
                    onClick={agregarAccionista}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>+</span> Añadir Accionista
                  </button>
                </div>
                
                {actaData.accionistas.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 3fr 1fr 1.5fr auto',
                      gap: '8px',
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <div>Cédula</div>
                      <div>Nombres</div>
                      <div>% Acciones</div>
                      <div>Capital</div>
                      <div></div>
                    </div>
                    {actaData.accionistas.map((accionista, index) => (
                      <div key={index} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 3fr 1fr 1.5fr auto',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        alignItems: 'center'
                      }}>
                        <input
                          type="text"
                          value={accionista.cedula}
                          onChange={(e) => actualizarAccionista(index, 'cedula', e.target.value)}
                          className="isc-input"
                          placeholder="Cédula"
                          style={{ fontSize: '13px', padding: '6px 8px' }}
                        />
                        <input
                          type="text"
                          value={accionista.nombres}
                          onChange={(e) => actualizarAccionista(index, 'nombres', e.target.value)}
                          className="isc-input"
                          placeholder="Nombres completos"
                          style={{ fontSize: '13px', padding: '6px 8px' }}
                        />
                        <input
                          type="text"
                          value={accionista.porcentaje}
                          readOnly
                          className="isc-input"
                          placeholder="%"
                          style={{ 
                            fontSize: '13px', 
                            padding: '6px 8px',
                            backgroundColor: '#f9fafb',
                            cursor: 'not-allowed'
                          }}
                          title="Se calcula automáticamente basado en el capital"
                        />
                        <input
                          type="text"
                          value={accionista.capital}
                          onChange={(e) => actualizarAccionista(index, 'capital', e.target.value)}
                          className="isc-input"
                          placeholder="Capital"
                          style={{ fontSize: '13px', padding: '6px 8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => eliminarAccionista(index)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div style={{ 
                      marginTop: '12px',
                      padding: '10px',
                      backgroundColor: capitalValido ? '#d1fae5' : '#fee2e2',
                      borderRadius: '6px',
                      border: `1px solid ${capitalValido ? '#10b981' : '#ef4444'}`,
                      fontSize: '13px',
                      fontWeight: '500',
                      color: capitalValido ? '#065f46' : '#991b1b'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Capital Total de Accionistas:</span>
                        <span>{capitalTotal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>Capital Suscrito:</span>
                        <span>{capitalSuscritoNum.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {!capitalValido && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          ⚠️ El capital total de los accionistas debe ser igual al capital suscrito
                        </div>
                      )}
                      {capitalValido && capitalTotal > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          ✓ El capital total coincide con el capital suscrito
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              🔍 Información para Informe del Comisario (Opcional)
            </h4>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Complete estos campos para personalizar el informe del comisario. Si se dejan vacíos, se usarán valores predeterminados conforme al Artículo 197 de la Ley de Compañías.
            </p>

            <details className="isc-details" style={{ gridColumn: '1 / -1' }}>
              <summary className="isc-summary">Información del Informe del Comisario (expandir/contraer)</summary>
              <div className="isc-details-content">
                <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="isc-label">Evaluación de la Situación Financiera</label>
                  <textarea
                    name="evaluacionFinanciera"
                    value={actaData.evaluacionFinanciera}
                    onChange={handleActaChange}
                    className="isc-textarea"
                    placeholder="Descripción de la evaluación de la situación financiera de la compañía"
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="isc-label">Observaciones sobre los Estados Financieros</label>
                  <textarea
                    name="observacionesEstadosFinancieros"
                    value={actaData.observacionesEstadosFinancieros}
                    onChange={handleActaChange}
                    className="isc-textarea"
                    placeholder="Observaciones específicas sobre los estados financieros (dejar vacío si no hay observaciones)"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="isc-label">Observaciones sobre la Gestión Administrativa</label>
                  <textarea
                    name="observacionesGestion"
                    value={actaData.observacionesGestion}
                    onChange={handleActaChange}
                    className="isc-textarea"
                    placeholder="Evaluación y observaciones sobre la gestión administrativa de la compañía"
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="isc-label">Observaciones sobre el Cumplimiento de Disposiciones</label>
                  <textarea
                    name="observacionesCumplimiento"
                    value={actaData.observacionesCumplimiento}
                    onChange={handleActaChange}
                    className="isc-textarea"
                    placeholder="Observaciones sobre el cumplimiento de resoluciones y disposiciones"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="isc-label">Recomendaciones del Comisario</label>
                  <textarea
                    name="recomendacionesComisario"
                    value={actaData.recomendacionesComisario}
                    onChange={handleActaChange}
                    className="isc-textarea"
                    placeholder="Recomendaciones específicas del comisario para la Junta General de Accionistas"
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div className="isc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="isc-label">Conclusión del Informe</label>
                  <textarea
                    name="conclusionComisario"
                    value={actaData.conclusionComisario}
                    onChange={handleActaChange}
                    className="isc-textarea"
                    placeholder="Conclusión personalizada del informe del comisario"
                    style={{ minHeight: '100px' }}
                  />
                </div>
              </div>
            </details>
          </div>

          <div className="isc-buttons">
            <button type="submit" className="isc-btn isc-btn-primary">
              Generar Informes
            </button>
            <button 
              type="button" 
              className="isc-btn isc-btn-tertiary"
              onClick={limpiarFormulario}
            >
              Limpiar Formulario
            </button>
          </div>
        </form>

        {(informesGenerados.actaJunta || informesGenerados.informeGerente || informesGenerados.notasExplicativas || informesGenerados.informeComisario) && (
          <div className="isc-preview">
            <div className="isc-preview-title">✓ Informes generados exitosamente</div>
            <div className="isc-info">
              Los informes están listos. Puede descargarlos como HTML o imprimirlos directamente.
            </div>
            
            {informesGenerados.actaJunta && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>📋 Acta de Junta General</div>
                <div className="isc-preview-actions">
                  <button 
                    className="isc-btn isc-btn-secondary"
                    onClick={() => descargarPDF('actaJunta', informesGenerados.actaJunta)}
                  >
                    📄 Imprimir/PDF
                  </button>
                  <button 
                    className="isc-btn isc-btn-primary"
                    onClick={() => descargarHTML('actaJunta', informesGenerados.actaJunta)}
                  >
                    💾 Descargar HTML
                  </button>
                  <button 
                    className="isc-btn isc-btn-tertiary"
                    onClick={() => {
                      const titulo = `Acta de Junta General - ${actaData.nombreCompania || 'Compañía'}`
                      const ventana = window.open('', '_blank')
                      ventana.document.title = titulo
                      const htmlConTitulo = informesGenerados.actaJunta.replace(
                        /<title>.*?<\/title>/,
                        `<title>${titulo}</title>`
                      )
                      ventana.document.write(htmlConTitulo)
                      ventana.document.close()
                    }}
                  >
                    👁️ Vista Previa
                  </button>
                </div>
              </div>
            )}

            {informesGenerados.informeGerente && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>📊 Informe del Gerente</div>
                <div className="isc-preview-actions">
                  <button 
                    className="isc-btn isc-btn-secondary"
                    onClick={() => descargarPDF('informeGerente', informesGenerados.informeGerente)}
                  >
                    📄 Imprimir/PDF
                  </button>
                  <button 
                    className="isc-btn isc-btn-primary"
                    onClick={() => descargarHTML('informeGerente', informesGenerados.informeGerente)}
                  >
                    💾 Descargar HTML
                  </button>
                </div>
              </div>
            )}

            {informesGenerados.notasExplicativas && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>📝 Notas Explicativas</div>
                <div className="isc-preview-actions">
                  <button 
                    className="isc-btn isc-btn-secondary"
                    onClick={() => descargarPDF('notasExplicativas', informesGenerados.notasExplicativas)}
                  >
                    📄 Imprimir/PDF
                  </button>
                  <button 
                    className="isc-btn isc-btn-primary"
                    onClick={() => descargarHTML('notasExplicativas', informesGenerados.notasExplicativas)}
                  >
                    💾 Descargar HTML
                  </button>
                </div>
              </div>
            )}

            {informesGenerados.informeComisario && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>🔍 Informe del Comisario</div>
                <div className="isc-preview-actions">
                  <button 
                    className="isc-btn isc-btn-secondary"
                    onClick={() => descargarPDF('informeComisario', informesGenerados.informeComisario)}
                  >
                    📄 Imprimir/PDF
                  </button>
                  <button 
                    className="isc-btn isc-btn-primary"
                    onClick={() => descargarHTML('informeComisario', informesGenerados.informeComisario)}
                  >
                    💾 Descargar HTML
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
