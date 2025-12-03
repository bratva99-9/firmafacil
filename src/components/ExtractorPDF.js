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
      
      let textoCompleto = ''
      
      // Extraer texto de todas las páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        textoCompleto += pageText + '\n'
      }

      setTextoExtraido(textoCompleto)
      
      // Extraer datos según el tipo de documento
      const datosExtraidos = tipoDocumento === 'ruc' 
        ? extraerDatosRUC(textoCompleto)
        : extraerDatosCCO(textoCompleto)

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
    
    // Normalizar espacios múltiples
    const textoNormalizado = texto.replace(/\s+/g, ' ').trim()
    
    // 1. Extraer RUC (13 dígitos) - Buscar "Número RUC" o "RUC" seguido de 13 dígitos
    const rucMatch = texto.match(/(?:N[ÚU]MERO\s+)?RUC[\s:]*(\d{13})/i)
    if (rucMatch) {
      datos.ruc = rucMatch[1]
    } else {
      // Fallback: buscar cualquier secuencia de 13 dígitos después de "RUC"
      const rucFallback = texto.match(/RUC[\s\w]*?(\d{13})/i)
      if (rucFallback) {
        datos.ruc = rucFallback[1]
      }
    }

    // 2. Extraer Razón Social / Nombre de la Compañía
    // Buscar después de "Certificado Registro Único" o antes de "Número RUC"
    let nombreCompania = ''
    
    // Patrón 1: Buscar entre "Certificado" y "Número RUC"
    const nombreMatch1 = texto.match(/CERTIFICADO[\s\w]*?([A-ZÁÉÍÓÚÑ\s&.,\-S\.A\.S\.]{5,80}?)\s*(?:N[ÚU]MERO|RUC)/i)
    if (nombreMatch1) {
      nombreCompania = nombreMatch1[1].trim()
    }
    
    // Patrón 2: Buscar después de "Razón Social" (si existe)
    if (!nombreCompania) {
      const razonMatch = texto.match(/RAZ[ÓO]N\s+SOCIAL[\s:]*([A-ZÁÉÍÓÚÑ\s&.,\-]{5,80})/i)
      if (razonMatch && razonMatch[1].trim() && !razonMatch[1].includes('REPRESENTANTE')) {
        nombreCompania = razonMatch[1].trim()
      }
    }
    
    // Patrón 3: Buscar texto en mayúsculas antes de "Número RUC" que no sea "CERTIFICADO REGISTRO"
    if (!nombreCompania) {
      const nombreMatch2 = texto.match(/([A-ZÁÉÍÓÚÑ\s&.,\-S\.A\.S\.]{5,80})\s+N[ÚU]MERO\s+RUC/i)
      if (nombreMatch2 && !nombreMatch2[1].includes('CERTIFICADO') && !nombreMatch2[1].includes('REGISTRO')) {
        nombreCompania = nombreMatch2[1].trim()
      }
    }
    
    if (nombreCompania) {
      datos.nombreCompania = nombreCompania.replace(/\s+/g, ' ').trim()
    }

    // 3. Extraer Representante Legal
    const representanteMatch = texto.match(/REPRESENTANTE\s+LEGAL[\s•:]*([A-ZÁÉÍÓÚÑ\s]{5,80})/i)
    if (representanteMatch) {
      datos.nombreGerente = representanteMatch[1].trim().replace(/^[•\s]+/, '').replace(/\s+/g, ' ')
    } else {
      // Buscar patrón alternativo con bullet point
      const repMatch2 = texto.match(/REPRESENTANTE[\s\w]*?[•\s]+([A-ZÁÉÍÓÚÑ\s]{5,80})/i)
      if (repMatch2) {
        datos.nombreGerente = repMatch2[1].trim().replace(/\s+/g, ' ')
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

    // 5. Extraer Dirección completa
    let direccionCompleta = ''
    
    // Buscar patrón: Calle: X Intersección: Y Número de piso: Z Referencia: W
    const direccionMatch = texto.match(/CALLE[\s:]*([^I]+?)\s*INTERSECCI[ÓO]N[\s:]*([^N]+?)\s*N[ÚU]MERO\s+DE\s+PISO[\s:]*([^R]+?)\s*REFERENCIA[\s:]*([^\n]+)/i)
    if (direccionMatch) {
      const calle = direccionMatch[1].trim()
      const interseccion = direccionMatch[2].trim()
      const numero = direccionMatch[3].trim()
      const referencia = direccionMatch[4].trim()
      direccionCompleta = `${calle} y ${interseccion}, ${numero}. ${referencia}`
    } else {
      // Buscar después de "Dirección" o "Domicilio"
      const direccionMatch2 = texto.match(/(?:DIRECCI[ÓO]N|DOMICILIO)[\s:]*([^\n]{10,150})/i)
      if (direccionMatch2) {
        direccionCompleta = direccionMatch2[1].trim()
      }
    }
    
    if (direccionCompleta) {
      datos.direccion = direccionCompleta.replace(/\s+/g, ' ').trim()
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

    // 9. Extraer Objeto Social / Actividades Económicas
    const actividadMatch = texto.match(/ACTIVIDADES\s+ECON[ÓO]MICAS[\s•:]*([^\n]{20,500})/i)
    if (actividadMatch) {
      let actividad = actividadMatch[1].trim()
      // Limpiar código de actividad si existe
      actividad = actividad.replace(/^[•\s]*[A-Z]\d+\s*-\s*/, '')
      datos.objetoSocial = actividad.substring(0, 500).replace(/\s+/g, ' ').trim()
    } else {
      // Buscar patrón alternativo
      const objetoMatch = texto.match(/OBJETO\s+SOCIAL[\s:]*([^\n]{20,500})/i)
      if (objetoMatch) {
        datos.objetoSocial = objetoMatch[1].trim().substring(0, 500).replace(/\s+/g, ' ').trim()
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

