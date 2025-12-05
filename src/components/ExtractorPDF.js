import React, { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Configurar el worker de PDF.js
// Intentar usar el archivo local primero, luego jsdelivr como fallback
if (typeof window !== 'undefined') {
  const localWorker = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`
  const cdnWorker = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  
  // Usar jsdelivr directamente (más confiable que cdnjs)
  pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker
}

export default function ExtractorPDF({ onDataExtracted, tipoDocumento = 'ruc' }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [textoExtraido, setTextoExtraido] = useState('')
  const fileInputRef = useRef(null)

  const extraerTextoPDF = async (archivo) => {
    try {
      setCargando(true)
      setError('')
      setTextoExtraido('')

      const arrayBuffer = await archivo.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      console.log('📄 Total de páginas del PDF:', pdf.numPages)
      
      let textoCompleto = ''
      const paginasTexto = []
      
      // Extraer texto de todas las páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`📄 Procesando página ${i} de ${pdf.numPages}...`)
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        // Mejorar la extracción de texto considerando posiciones y saltos de línea
        // Usar un método más robusto que capture todo el texto
        let pageText = ''
        let lastY = null
        let lastX = null
        
        textContent.items.forEach((item, index) => {
          if (!item.str) return
          
          const transform = item.transform || []
          const currentY = transform[5] || null
          const currentX = transform[4] || null
          
          // Determinar si necesitamos un salto de línea o espacio
          if (lastY !== null && currentY !== null) {
            const diffY = Math.abs(lastY - currentY)
            
            // Si hay un cambio significativo en Y (más de 3 píxeles), es una nueva línea
            if (diffY > 3) {
              pageText += '\n'
            }
            // Si estamos en la misma línea pero X retrocedió mucho, probablemente es nueva línea
            else if (diffY <= 3 && lastX !== null && currentX !== null && currentX < lastX - 50) {
              pageText += '\n'
            }
            // Si estamos en la misma línea, verificar si necesitamos espacio
            else if (diffY <= 3 && index > 0) {
              const prevItem = textContent.items[index - 1]
              if (prevItem && prevItem.str) {
                // Calcular distancia horizontal
                if (lastX !== null && currentX !== null) {
                  const diffX = currentX - lastX
                  // Si hay espacio significativo (> 5 píxeles) y el item anterior no termina con espacio
                  if (diffX > 5 && !prevItem.str.endsWith(' ') && !item.str.startsWith(' ')) {
                    pageText += ' '
                  }
                } else if (!prevItem.str.endsWith(' ') && !item.str.startsWith(' ')) {
                  // Si no tenemos coordenadas, agregar espacio si no hay uno
                  pageText += ' '
                }
              }
            }
          }
          
          // Agregar el texto del item
          pageText += item.str
          lastY = currentY
          lastX = currentX
        })
        
        // Verificar que capturamos todo
        const totalChars = textContent.items.reduce((sum, item) => sum + (item.str ? item.str.length : 0), 0)
        console.log(`  📊 Página ${i} - Items procesados: ${textContent.items.length}, Caracteres en items: ${totalChars}, Caracteres en texto: ${pageText.length}`)
        
        paginasTexto.push({
          numero: i,
          texto: pageText,
          longitud: pageText.length,
          items: textContent.items.length
        })
        
        console.log(`  ✓ Página ${i}: ${pageText.length} caracteres, ${textContent.items.length} items`)
        
        // Verificar que no se perdió texto
        if (pageText.length < totalChars * 0.8) {
          console.warn(`  ⚠️ Advertencia: El texto extraído (${pageText.length}) es significativamente menor que los caracteres en items (${totalChars})`)
        }
        
        // Mostrar muestra del texto extraído
        if (pageText.length > 0) {
          console.log(`  📝 Muestra (primeros 150 chars):`, pageText.substring(0, 150))
          if (pageText.length > 150) {
            console.log(`  📝 Muestra (últimos 150 chars):`, pageText.substring(pageText.length - 150))
          }
        }
        
        textoCompleto += `\n=== PÁGINA ${i} ===\n${pageText}\n`
      }

      console.log('📊 Resumen de extracción:')
      paginasTexto.forEach(pag => {
        console.log(`  Página ${pag.numero}: ${pag.longitud} caracteres, ${pag.items} items`)
      })
      console.log(`📏 Total extraído: ${textoCompleto.length} caracteres`)

      setTextoExtraido(textoCompleto)
      
      // Extraer datos según el tipo de documento
      const datosExtraidos = tipoDocumento === 'ruc' 
        ? extraerDatosRUC(textoCompleto)
        : extraerDatosCCO(textoCompleto)

      // DEBUG: Mostrar texto completo extraído
      console.group('📄 DEBUG - Extracción de PDF')
      console.log('📄 Archivo:', archivo.name)
      console.log('📄 Tipo:', tipoDocumento)
      console.log('📄 Total de páginas procesadas:', pdf.numPages)
      console.log('📏 Longitud total del texto:', textoCompleto.length, 'caracteres')
      console.log('📝 Texto Extraído Completo (primeros 2000 caracteres):')
      console.log(textoCompleto.substring(0, 2000))
      if (textoCompleto.length > 2000) {
        console.log('... (texto truncado para visualización, ver completo abajo)')
      }
      console.log('📝 Texto Extraído Completo (últimos 1000 caracteres):')
      console.log(textoCompleto.substring(Math.max(0, textoCompleto.length - 1000)))
      console.log('📋 Texto Completo (para copiar):')
      console.log(textoCompleto)
      console.groupEnd()

      if (onDataExtracted) {
        onDataExtracted(datosExtraidos)
      }

      return datosExtraidos
    } catch (err) {
      console.error('Error al extraer PDF:', err)
      setError(`Error al procesar el PDF: ${err.message}`)
      throw err
    } finally {
      setCargando(false)
    }
  }

  const extraerDatosRUC = (texto) => {
    const datos = {}
    const textoUpper = texto.toUpperCase()
    
    // Normalizar espacios múltiples pero preservar saltos de línea importantes
    // Primero reemplazar múltiples saltos de línea por uno solo
    let textoNormalizado = texto.replace(/\n{3,}/g, '\n\n')
    // Luego normalizar espacios múltiples en la misma línea
    textoNormalizado = textoNormalizado.replace(/[ \t]+/g, ' ').trim()
    
    console.log('🔍 Buscando datos en texto de', texto.length, 'caracteres')
    
    // 1. Extraer RUC (13 dígitos) - Buscar "Número RUC" o "RUC" seguido de 13 dígitos
    // Usar flag multiline para buscar en todo el texto
    const rucMatch = texto.match(/(?:N[ÚU]MERO\s+)?RUC[\s:]*(\d{13})/im)
    if (rucMatch) {
      datos.ruc = rucMatch[1]
      console.log('  ✓ RUC encontrado:', datos.ruc)
    } else {
      // Fallback: buscar cualquier secuencia de 13 dígitos después de "RUC"
      const rucFallback = texto.match(/RUC[\s\w\n]*?(\d{13})/im)
      if (rucFallback) {
        datos.ruc = rucFallback[1]
        console.log('  ✓ RUC encontrado (fallback):', datos.ruc)
      } else {
        console.log('  ✗ RUC no encontrado')
      }
    }

    // 2. Extraer Razón Social / Nombre de la Compañía
    // Buscar después de "Certificado Registro Único" o antes de "Número RUC"
    let nombreCompania = ''
    
    // Patrón 1: Buscar entre "Certificado" y "Número RUC" (multiline)
    const nombreMatch1 = texto.match(/CERTIFICADO[\s\w\n]*?([A-ZÁÉÍÓÚÑ\s&.,\-S\.A\.S\.]{5,120}?)\s*(?:N[ÚU]MERO|RUC)/im)
    if (nombreMatch1) {
      nombreCompania = nombreMatch1[1].trim()
      console.log('  ✓ Nombre encontrado (patrón 1):', nombreCompania.substring(0, 50))
    }
    
    // Patrón 2: Buscar después de "Razón Social" (si existe) - multiline
    if (!nombreCompania) {
      const razonMatch = texto.match(/RAZ[ÓO]N\s+SOCIAL[\s:\n]*([A-ZÁÉÍÓÚÑ\s&.,\-]{5,120})/im)
      if (razonMatch && razonMatch[1].trim() && !razonMatch[1].includes('REPRESENTANTE')) {
        nombreCompania = razonMatch[1].trim()
        console.log('  ✓ Nombre encontrado (patrón 2):', nombreCompania.substring(0, 50))
      }
    }
    
    // Patrón 3: Buscar texto en mayúsculas antes de "Número RUC" que no sea "CERTIFICADO REGISTRO" - multiline
    if (!nombreCompania) {
      const nombreMatch2 = texto.match(/([A-ZÁÉÍÓÚÑ\s&.,\-S\.A\.S\.]{5,120})\s+N[ÚU]MERO\s+RUC/im)
      if (nombreMatch2 && !nombreMatch2[1].includes('CERTIFICADO') && !nombreMatch2[1].includes('REGISTRO')) {
        nombreCompania = nombreMatch2[1].trim()
        console.log('  ✓ Nombre encontrado (patrón 3):', nombreCompania.substring(0, 50))
      }
    }
    
    if (nombreCompania) {
      datos.nombreCompania = nombreCompania.replace(/\s+/g, ' ').trim()
    } else {
      console.log('  ✗ Nombre de compañía no encontrado')
    }

    // 3. Extraer Representante Legal - multiline
    const representanteMatch = texto.match(/REPRESENTANTE\s+LEGAL[\s•:\n]*([A-ZÁÉÍÓÚÑ\s]{5,100})/im)
    if (representanteMatch) {
      datos.nombreGerente = representanteMatch[1].trim().replace(/^[•\s]+/, '').replace(/\s+/g, ' ')
      console.log('  ✓ Representante Legal encontrado:', datos.nombreGerente)
    } else {
      // Buscar patrón alternativo con bullet point - multiline
      const repMatch2 = texto.match(/REPRESENTANTE[\s\w\n]*?[•\s]+([A-ZÁÉÍÓÚÑ\s]{5,100})/im)
      if (repMatch2) {
        datos.nombreGerente = repMatch2[1].trim().replace(/\s+/g, ' ')
        console.log('  ✓ Representante Legal encontrado (alternativo):', datos.nombreGerente)
      } else {
        console.log('  ✗ Representante Legal no encontrado')
      }
    }

    // 4. Extraer Fecha de Constitución
    const fechaConstMatch = texto.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})[\s]*FECHA\s+DE\s+CONSTITUCI[ÓO]N/i)
    if (fechaConstMatch) {
      datos.fechaConstitucion = fechaConstMatch[1]
    } else {
      // Buscar patrón inverso
      const fechaConstMatch2 = texto.match(/FECHA\s+DE\s+CONSTITUCI[ÓO]N[\s:]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i)
      if (fechaConstMatch2) {
        datos.fechaConstitucion = fechaConstMatch2[1]
      }
    }

    // 5. Extraer Dirección completa - puede estar en múltiples líneas
    let direccionCompleta = ''
    
    // Buscar patrón: Calle: X Intersección: Y Número de piso: Z Referencia: W (multiline)
    const direccionMatch = texto.match(/CALLE[\s:]*([^\nI]+?)\s*INTERSECCI[ÓO]N[\s:]*([^\nN]+?)\s*N[ÚU]MERO\s+DE\s+PISO[\s:]*([^\nR]+?)\s*REFERENCIA[\s:]*([^\n]+)/im)
    if (direccionMatch) {
      const calle = direccionMatch[1].trim()
      const interseccion = direccionMatch[2].trim()
      const numero = direccionMatch[3].trim()
      const referencia = direccionMatch[4].trim()
      direccionCompleta = `Calle: ${calle} Intersección: ${interseccion} Número de piso: ${numero} Referencia: ${referencia}`
      console.log('  ✓ Dirección encontrada (formato completo):', direccionCompleta.substring(0, 80))
    } else {
      // Buscar después de "Dirección" o "Domicilio" - puede estar en múltiples líneas
      const direccionMatch2 = texto.match(/(?:DIRECCI[ÓO]N|DOMICILIO)[\s:\n]*([\s\S]{10,200}?)(?:\n\s*(?:PROVINCIA|CANT[ÓO]N|CIUDAD|RUC|REPRESENTANTE|$))/im)
      if (direccionMatch2) {
        direccionCompleta = direccionMatch2[1].trim()
        // Normalizar saltos de línea
        direccionCompleta = direccionCompleta.replace(/\n+/g, ' ').replace(/\s+/g, ' ')
        console.log('  ✓ Dirección encontrada (formato simple):', direccionCompleta.substring(0, 80))
      } else {
        console.log('  ✗ Dirección no encontrada')
      }
    }
    
    if (direccionCompleta) {
      datos.direccion = direccionCompleta.trim()
      // También guardar como domicilio completo si no existe
      if (!datos.domicilioCompleto) {
        datos.domicilioCompleto = direccionCompleta.trim()
      }
    }

    // 6. Extraer Ciudad/Provincia/Cantón
    const provinciaMatch = texto.match(/PROVINCIA[\s:]*([A-ZÁÉÍÓÚÑ\s]+?)(?:\s+CANT[ÓO]N|$)/i)
    if (provinciaMatch) {
      const provincia = provinciaMatch[1].trim()
      
      const cantonMatch = texto.match(/CANT[ÓO]N[\s:]*([A-ZÁÉÍÓÚÑ\s0-9\/]+?)(?:\s+PARROQUIA|$)/i)
      if (cantonMatch) {
        const canton = cantonMatch[1].trim().split('/')[0].trim() // Tomar solo el primer nombre si hay "/"
        datos.ciudad = canton || provincia
      } else {
        datos.ciudad = provincia
      }
    } else {
      // Buscar ciudades conocidas
      const ciudades = ['QUITO', 'GUAYAQUIL', 'CUENCA', 'AMBATO', 'RIOBAMBA', 'MACHALA', 'LOJA', 'MANTA', 'SALINAS', 'ESMERALDAS']
      for (const ciudad of ciudades) {
        if (textoUpper.includes(ciudad)) {
          datos.ciudad = ciudad
          break
        }
      }
    }

    // 7. Extraer Teléfono
    const telefonoMatch = texto.match(/(?:TEL[ÉE]FONO|TEL\.)[\s:]*([0-9\s\-\(\)]{8,15})/i)
    if (telefonoMatch) {
      datos.telefono = telefonoMatch[1].trim()
    }

    // 8. Extraer Email
    const emailMatch = texto.match(/(?:EMAIL|CORREO|E-MAIL)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (emailMatch) {
      datos.email = emailMatch[1].trim()
    }

    // 9. Extraer Objeto Social / Actividades Económicas - multiline, buscar en múltiples líneas
    // Buscar desde "ACTIVIDADES ECONÓMICAS" hasta el siguiente campo importante o fin de texto
    // Usar un patrón más flexible que capture todo hasta encontrar un delimitador claro
    let actividadMatch = texto.match(/ACTIVIDADES\s+ECON[ÓO]MICAS[\s•:\n]*([\s\S]*?)(?:\n\s*(?:REPRESENTANTE|DOMICILIO|PROVINCIA|CANT[ÓO]N|PARROQUIA|RUC|UBICACI[ÓO]N|JURISDICCI[ÓO]N|TIPO|AGENTE|CONTRIBUYENTE|MEDIOS|DIRECCI[ÓO]N|OBLIGADO|$))/im)
    
    if (!actividadMatch) {
      // Si no encuentra delimitador, buscar hasta encontrar otro campo en mayúsculas seguido de dos puntos
      actividadMatch = texto.match(/ACTIVIDADES\s+ECON[ÓO]MICAS[\s•:\n]*([\s\S]*?)(?:\n\s*[A-ZÁÉÍÓÚÑ]{3,}\s*:|$)/im)
    }
    
    if (!actividadMatch) {
      // Último intento: capturar todo desde ACTIVIDADES ECONÓMICAS hasta el final del texto
      // pero limitar a un máximo razonable (5000 caracteres) para evitar capturar demasiado
      const indiceInicio = texto.toUpperCase().indexOf('ACTIVIDADES ECONÓMICAS')
      if (indiceInicio !== -1) {
        // Buscar el siguiente campo importante después de un salto de línea
        const textoRestante = texto.substring(indiceInicio)
        const finMatch = textoRestante.match(/ACTIVIDADES\s+ECON[ÓO]MICAS[\s•:\n]*([\s\S]{0,5000}?)(?:\n\s*(?:[A-ZÁÉÍÓÚÑ]{2,}\s*[:\n]|$))/im)
        if (finMatch) {
          actividadMatch = finMatch
        } else {
          // Si no encuentra fin, tomar los siguientes 5000 caracteres
          const contenido = textoRestante.replace(/^[\s\S]*?ACTIVIDADES\s+ECON[ÓO]MICAS[\s•:\n]*/im, '').substring(0, 5000)
          if (contenido.trim().length > 20) {
            actividadMatch = { 1: contenido }
          }
        }
      }
    }
    
    if (actividadMatch) {
      let actividad = actividadMatch[1].trim()
      // Limpiar código de actividad si existe al inicio
      actividad = actividad.replace(/^[•\s]*[A-Z]\d+\s*-\s*/, '')
      // Limpiar espacios y saltos de línea excesivos pero preservar el contenido
      actividad = actividad.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
      // No limitar a 500, capturar todo
      datos.objetoSocial = actividad.trim()
      console.log('  ✓ Objeto Social encontrado:', datos.objetoSocial.length, 'caracteres')
      console.log('    Contenido:', datos.objetoSocial.substring(0, 100) + (datos.objetoSocial.length > 100 ? '...' : ''))
    } else {
      // Buscar patrón alternativo "OBJETO SOCIAL" - multiline
      let objetoMatch = texto.match(/OBJETO\s+SOCIAL[\s:\n]*([\s\S]*?)(?:\n\s*(?:REPRESENTANTE|DOMICILIO|PROVINCIA|CANT[ÓO]N|PARROQUIA|RUC|UBICACI[ÓO]N|JURISDICCI[ÓO]N|TIPO|AGENTE|CONTRIBUYENTE|MEDIOS|$))/im)
      
      if (!objetoMatch) {
        objetoMatch = texto.match(/OBJETO\s+SOCIAL[\s:\n]*([\s\S]*?)(?:\n\s*[A-ZÁÉÍÓÚÑ]{3,}\s*:|$)/im)
      }
      
      if (objetoMatch) {
        let objeto = objetoMatch[1].trim()
        objeto = objeto.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
        datos.objetoSocial = objeto.trim()
        console.log('  ✓ Objeto Social encontrado (alternativo):', datos.objetoSocial.length, 'caracteres')
        console.log('    Contenido:', datos.objetoSocial.substring(0, 100) + (datos.objetoSocial.length > 100 ? '...' : ''))
      } else {
        console.log('  ✗ Objeto Social no encontrado')
        // Intentar buscar cualquier texto después de "ACTIVIDADES ECONÓMICAS" hasta el final
        const ultimoIntento = texto.match(/ACTIVIDADES\s+ECON[ÓO]MICAS[\s•:\n]*([\s\S]+)/im)
        if (ultimoIntento) {
          let ultimo = ultimoIntento[1].trim()
          // Buscar hasta encontrar un patrón que indique fin (línea en mayúsculas sola o campo conocido)
          const finMatch = ultimo.match(/^([\s\S]*?)(?:\n\s*[A-ZÁÉÍÓÚÑ]{2,}\s*[:\n]|$)/m)
          if (finMatch) {
            datos.objetoSocial = finMatch[1].trim().replace(/^[•\s]*[A-Z]\d+\s*-\s*/, '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
            console.log('  ✓ Objeto Social encontrado (último intento):', datos.objetoSocial.length, 'caracteres')
          }
        }
      }
    }

    // 10. Extraer Capital (si está disponible)
    const capitalMatch = texto.match(/(?:CAPITAL\s+(?:AUTORIZADO|SUSCRITO|PAGADO))[\s:]*([USD\$]?\s*[0-9,]+\.?[0-9]*)/i)
    if (capitalMatch) {
      datos.capital = capitalMatch[1].trim()
    }

    // 11. Extraer Estado
    const estadoMatch = texto.match(/ESTADO[\s:]*([A-ZÁÉÍÓÚÑ\s]+?)(?:\s+R[ÉE]GIMEN|$)/i)
    if (estadoMatch) {
      datos.estado = estadoMatch[1].trim()
    }

    // Limpiar todos los valores de espacios múltiples
    Object.keys(datos).forEach(key => {
      if (typeof datos[key] === 'string') {
        datos[key] = datos[key].replace(/\s+/g, ' ').trim()
      }
    })

    // DEBUG: Mostrar datos parseados del RUC
    console.group('🔍 DEBUG - Datos Extraídos del Certificado RUC')
    console.log('📄 Tipo de Documento:', 'Certificado RUC')
    console.log('📋 Datos Parseados:', datos)
    console.log('📊 Resumen:')
    Object.keys(datos).forEach(key => {
      if (datos[key]) {
        console.log(`  ✓ ${key}:`, datos[key])
      }
    })
    console.log('📝 Texto Original (primeros 500 caracteres):', texto.substring(0, 500))
    console.groupEnd()

    return datos
  }

  const extraerDatosCCO = (texto) => {
    const datos = {}
    
    // Extraer RUC
    const rucMatch = texto.match(/(?:RUC|R\.U\.C\.?)[\s:]*(\d{13})/i)
    if (rucMatch) {
      datos.ruc = rucMatch[1]
    }

    // Extraer Razón Social
    const razonSocialMatch = texto.match(/(?:RAZ[ÓO]N\s+SOCIAL|DENOMINACI[ÓO]N|NOMBRE)[\s:]*([^\n]{5,100})/i)
    if (razonSocialMatch) {
      datos.nombreCompania = razonSocialMatch[1].trim()
    }

    // Extraer Número de Escritura
    const escrituraMatch = texto.match(/(?:ESCRITURA|N[ÚU]MERO\s+DE\s+ESCRITURA)[\s:]*([0-9]+)/i)
    if (escrituraMatch) {
      datos.numeroEscritura = escrituraMatch[1]
    }

    // Extraer Notaría
    const notariaMatch = texto.match(/(?:NOTAR[ÍI]A|NOT\.)[\s:]*([A-ZÁÉÍÓÚÑ0-9\s]{5,80})/i)
    if (notariaMatch) {
      datos.notaria = notariaMatch[1].trim()
    }

    // Extraer Fecha de Inscripción
    const fechaInscMatch = texto.match(/(?:FECHA\s+DE\s+INSCRIPCI[ÓO]N|INSCRITA\s+EL)[\s:]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i)
    if (fechaInscMatch) {
      datos.fechaInscripcion = fechaInscMatch[1]
    }

    // Extraer Fecha de Constitución
    const fechaConstMatch = texto.match(/(?:FECHA\s+DE\s+CONSTITUCI[ÓO]N|CONSTITUIDA\s+EL)[\s:]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i)
    if (fechaConstMatch) {
      datos.fechaConstitucion = fechaConstMatch[1]
    }

    // Extraer Capital
    const capitalMatch = texto.match(/(?:CAPITAL)[\s:]*([USD\$]?\s*[0-9,]+\.?[0-9]*)/i)
    if (capitalMatch) {
      datos.capital = capitalMatch[1].trim()
    }

    // Extraer Objeto Social
    const objetoMatch = texto.match(/(?:OBJETO\s+SOCIAL|ACTIVIDAD)[\s:]*([^\n]{20,500})/i)
    if (objetoMatch) {
      datos.objetoSocial = objetoMatch[1].trim().substring(0, 500)
    }

    // Extraer Gerente/Representante Legal
    const gerenteMatch = texto.match(/(?:GERENTE|REPRESENTANTE|ADMINISTRADOR)[\s:]*([A-ZÁÉÍÓÚÑ\s]{5,60})/i)
    if (gerenteMatch) {
      datos.nombreGerente = gerenteMatch[1].trim()
    }

    // Extraer Comisario
    const comisarioMatch = texto.match(/(?:COMISARIO)[\s:]*([A-ZÁÉÍÓÚÑ\s]{5,60})/i)
    if (comisarioMatch) {
      datos.nombreComisario = comisarioMatch[1].trim()
    }

    // Extraer Dirección
    const direccionMatch = texto.match(/(?:DIRECCI[ÓO]N|DOMICILIO)[\s:]*([^\n]{10,100})/i)
    if (direccionMatch) {
      datos.direccion = direccionMatch[1].trim()
    }

    // Extraer Ciudad
    const ciudadMatch = texto.match(/(?:CIUDAD|CANT[ÓO]N)[\s:]*([A-ZÁÉÍÓÚÑ\s]{3,50})/i)
    if (ciudadMatch) {
      datos.ciudad = ciudadMatch[1].trim()
    }

    // DEBUG: Mostrar datos parseados del CCO
    console.group('🔍 DEBUG - Datos Extraídos del CCO (Superintendencia)')
    console.log('📄 Tipo de Documento:', 'CCO - Superintendencia de Compañías')
    console.log('📋 Datos Parseados:', datos)
    console.log('📊 Resumen:')
    Object.keys(datos).forEach(key => {
      if (datos[key]) {
        console.log(`  ✓ ${key}:`, datos[key])
      }
    })
    console.log('📝 Texto Original (primeros 500 caracteres):', texto.substring(0, 500))
    console.groupEnd()

    return datos
  }

  const handleFileChange = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    if (archivo.type !== 'application/pdf') {
      setError('Por favor seleccione un archivo PDF')
      return
    }

    try {
      await extraerTextoPDF(archivo)
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const archivo = e.dataTransfer.files[0]
    if (!archivo || archivo.type !== 'application/pdf') {
      setError('Por favor arrastre un archivo PDF')
      return
    }

    try {
      await extraerTextoPDF(archivo)
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <style>{`
        .pdf-uploader {
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          background: #f8fafc;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .pdf-uploader:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .pdf-uploader.dragover {
          border-color: #2563eb;
          background: #dbeafe;
        }
        .pdf-upload-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .pdf-upload-text {
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
        }
        .pdf-upload-subtext {
          font-size: 12px;
          color: #6b7280;
        }
        .pdf-input {
          display: none;
        }
        .pdf-btn {
          margin-top: 12px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .pdf-btn:hover {
          background: #2563eb;
        }
        .pdf-loading {
          color: #3b82f6;
          font-size: 14px;
          margin-top: 12px;
        }
        .pdf-error {
          color: #dc2626;
          font-size: 13px;
          margin-top: 12px;
          padding: 8px;
          background: #fef2f2;
          border-radius: 6px;
        }
        .pdf-success {
          color: #059669;
          font-size: 13px;
          margin-top: 12px;
          padding: 8px;
          background: #d1fae5;
          border-radius: 6px;
        }
        .pdf-text-preview {
          max-height: 150px;
          overflow-y: auto;
          margin-top: 12px;
          padding: 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 11px;
          text-align: left;
          font-family: monospace;
        }
      `}</style>

      <div
        className="pdf-uploader"
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('dragover')
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('dragover')
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="pdf-upload-icon">📄</div>
        <div className="pdf-upload-text">
          {tipoDocumento === 'ruc' 
            ? 'Cargar Certificado de RUC'
            : 'Cargar CCO de Superintendencia de Compañías'}
        </div>
        <div className="pdf-upload-subtext">
          Arrastre el PDF aquí o haga clic para seleccionar
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="pdf-input"
        />
        <button
          type="button"
          className="pdf-btn"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          Seleccionar Archivo
        </button>
      </div>

      {cargando && (
        <div className="pdf-loading">
          ⏳ Extrayendo datos del PDF...
        </div>
      )}

      {error && (
        <div className="pdf-error">
          ❌ {error}
        </div>
      )}

      {textoExtraido && !cargando && (
        <div className="pdf-success">
          ✅ Datos extraídos exitosamente. Los campos del formulario se han completado automáticamente.
        </div>
      )}

      {textoExtraido && process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>
            Ver texto extraído (solo desarrollo)
          </summary>
          <div className="pdf-text-preview">
            {textoExtraido.substring(0, 1000)}...
          </div>
        </details>
      )}
    </div>
  )
}

