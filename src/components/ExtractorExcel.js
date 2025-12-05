import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

export default function ExtractorExcel({ onDataExtracted, tipoDocumento = 'ruc' }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [datosExtraidos, setDatosExtraidos] = useState(null)
  const fileInputRef = useRef(null)

  const leerArchivoExcel = async (archivo) => {
    try {
      setCargando(true)
      setError('')
      setDatosExtraidos(null)

      console.group('📊 DEBUG - Lectura de Archivo Excel/ODS')
      console.log('📄 Archivo:', archivo.name)
      console.log('📄 Tipo:', archivo.type)
      console.log('📄 Tamaño:', (archivo.size / 1024).toFixed(2), 'KB')
      console.groupEnd()

      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await archivo.arrayBuffer()
      
      // Leer el workbook
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      })

      console.group('📊 DEBUG - Estructura del Workbook')
      console.log('📋 Nombre del archivo:', archivo.name)
      console.log('📋 Número de hojas:', workbook.SheetNames.length)
      console.log('📋 Nombres de hojas:', workbook.SheetNames)
      console.groupEnd()

      // Extraer datos de todas las hojas
      const datosPorHoja = {}
      let todosLosDatos = []

      workbook.SheetNames.forEach((nombreHoja, index) => {
        const worksheet = workbook.Sheets[nombreHoja]
        
        // Convertir a JSON (array de objetos)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // Usar primera fila como headers
          defval: '', // Valor por defecto para celdas vacías
          raw: false // Obtener valores formateados como texto
        })

        // También convertir a JSON con headers automáticos
        const jsonDataConHeaders = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        })

        datosPorHoja[nombreHoja] = {
          raw: jsonData,
          withHeaders: jsonDataConHeaders,
          rowCount: jsonData.length,
          colCount: jsonData[0] ? jsonData[0].length : 0
        }

        todosLosDatos = todosLosDatos.concat(jsonDataConHeaders)

        console.group(`📄 Hoja ${index + 1}: ${nombreHoja}`)
        console.log('  Filas:', jsonData.length)
        console.log('  Columnas:', jsonData[0] ? jsonData[0].length : 0)
        console.log('  Headers:', jsonData[0] || [])
        console.log('  Primeras 3 filas de datos:')
        console.table(jsonData.slice(0, 3))
        console.log('  Datos con headers (primeras 3 filas):')
        console.table(jsonDataConHeaders.slice(0, 3))
        console.groupEnd()
      })

      // Intentar extraer información estructurada según el tipo de documento
      let datosExtraidos = {}
      
      if (tipoDocumento === 'ruc' || tipoDocumento === 'supercias') {
        datosExtraidos = extraerDatosSupercias(todosLosDatos, datosPorHoja, workbook)
      }

      console.group('🔍 DEBUG - Datos Extraídos del Archivo')
      console.log('📋 Datos Extraídos:', datosExtraidos)
      console.log('📊 Resumen:')
      Object.keys(datosExtraidos).forEach(key => {
        if (datosExtraidos[key]) {
          console.log(`  ✓ ${key}:`, datosExtraidos[key])
        }
      })
      console.groupEnd()

      setDatosExtraidos(datosExtraidos)

      if (onDataExtracted) {
        onDataExtracted(datosExtraidos)
      }

      return datosExtraidos
    } catch (err) {
      console.error('Error al leer archivo Excel/ODS:', err)
      setError(`Error al procesar el archivo: ${err.message}`)
      throw err
    } finally {
      setCargando(false)
    }
  }

  const extraerDatosSupercias = (todosLosDatos, datosPorHoja, workbook) => {
    const datos = {}
    
    console.group('🔍 Extrayendo datos de Superintendencia de Compañías')
    
    // Buscar en todas las hojas
    workbook.SheetNames.forEach((nombreHoja, index) => {
      const hoja = datosPorHoja[nombreHoja]
      if (!hoja) return

      console.log(`\n📄 Procesando hoja: ${nombreHoja}`)
      
      // Buscar RUC en cualquier columna
      hoja.withHeaders.forEach((fila, filaIndex) => {
        Object.keys(fila).forEach(columna => {
          const valor = String(fila[columna] || '').trim()
          
          // Buscar RUC (13 dígitos)
          if (/^\d{13}$/.test(valor)) {
            if (!datos.ruc) {
              datos.ruc = valor
              console.log(`  ✓ RUC encontrado en fila ${filaIndex + 1}, columna "${columna}":`, valor)
            }
          }
          
          // Buscar nombre de compañía (texto largo en mayúsculas)
          if (valor.length > 5 && valor.length < 100 && /^[A-ZÁÉÍÓÚÑ\s&.,\-S\.A\.S\.]+$/.test(valor)) {
            if (!datos.nombreCompania || valor.length > datos.nombreCompania.length) {
              datos.nombreCompania = valor
              console.log(`  ✓ Nombre de compañía encontrado en fila ${filaIndex + 1}, columna "${columna}":`, valor)
            }
          }
          
          // Buscar representante legal (nombre completo)
          if (valor.length > 10 && valor.length < 80 && /^[A-ZÁÉÍÓÚÑ\s]+$/.test(valor)) {
            const palabras = valor.split(/\s+/)
            if (palabras.length >= 2 && palabras.length <= 5) {
              if (!datos.nombreGerente || (valor.includes('GERENTE') || valor.includes('REPRESENTANTE'))) {
                datos.nombreGerente = valor
                console.log(`  ✓ Representante/Gerente encontrado en fila ${filaIndex + 1}, columna "${columna}":`, valor)
              }
            }
          }
        })
      })
      
      // Buscar patrones específicos en los headers
      const headers = hoja.raw[0] || []
      headers.forEach((header, colIndex) => {
        const headerStr = String(header || '').toUpperCase()
        
        // Buscar columnas conocidas
        if (headerStr.includes('RUC') || headerStr.includes('NÚMERO')) {
          hoja.raw.slice(1).forEach((fila, filaIndex) => {
            const valor = String(fila[colIndex] || '').trim()
            if (/^\d{13}$/.test(valor) && !datos.ruc) {
              datos.ruc = valor
              console.log(`  ✓ RUC encontrado en columna "${header}":`, valor)
            }
          })
        }
        
        if (headerStr.includes('RAZÓN') || headerStr.includes('RAZON') || headerStr.includes('NOMBRE') || headerStr.includes('DENOMINACIÓN')) {
          hoja.raw.slice(1).forEach((fila, filaIndex) => {
            const valor = String(fila[colIndex] || '').trim()
            if (valor.length > 5 && !datos.nombreCompania) {
              datos.nombreCompania = valor
              console.log(`  ✓ Nombre de compañía encontrado en columna "${header}":`, valor)
            }
          })
        }
        
        if (headerStr.includes('REPRESENTANTE') || headerStr.includes('GERENTE') || headerStr.includes('ADMINISTRADOR')) {
          hoja.raw.slice(1).forEach((fila, filaIndex) => {
            const valor = String(fila[colIndex] || '').trim()
            if (valor.length > 5 && !datos.nombreGerente) {
              datos.nombreGerente = valor
              console.log(`  ✓ Representante/Gerente encontrado en columna "${header}":`, valor)
            }
          })
        }
        
        if (headerStr.includes('CIUDAD') || headerStr.includes('CANTÓN') || headerStr.includes('CANTON')) {
          hoja.raw.slice(1).forEach((fila, filaIndex) => {
            const valor = String(fila[colIndex] || '').trim()
            if (valor.length > 2 && !datos.ciudad) {
              datos.ciudad = valor
              console.log(`  ✓ Ciudad encontrada en columna "${header}":`, valor)
            }
          })
        }
        
        if (headerStr.includes('DIRECCIÓN') || headerStr.includes('DIRECCION') || headerStr.includes('DOMICILIO')) {
          hoja.raw.slice(1).forEach((fila, filaIndex) => {
            const valor = String(fila[colIndex] || '').trim()
            if (valor.length > 10 && !datos.direccion) {
              datos.direccion = valor
              console.log(`  ✓ Dirección encontrada en columna "${header}":`, valor)
            }
          })
        }
        
        if (headerStr.includes('OBJETO') || headerStr.includes('ACTIVIDAD')) {
          hoja.raw.slice(1).forEach((fila, filaIndex) => {
            const valor = String(fila[colIndex] || '').trim()
            if (valor.length > 20 && !datos.objetoSocial) {
              datos.objetoSocial = valor
              console.log(`  ✓ Objeto Social encontrado en columna "${header}":`, valor.substring(0, 50) + '...')
            }
          })
        }
      })
    })
    
    console.groupEnd()
    
    return datos
  }

  const handleFileChange = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    const extension = archivo.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'ods'].includes(extension)) {
      setError('Por favor seleccione un archivo Excel (.xlsx, .xls) u ODS (.ods)')
      return
    }

    try {
      await leerArchivoExcel(archivo)
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const archivo = e.dataTransfer.files[0]
    if (!archivo) {
      setError('Por favor arrastre un archivo Excel o ODS')
      return
    }

    const extension = archivo.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'ods'].includes(extension)) {
      setError('Por favor arrastre un archivo Excel (.xlsx, .xls) u ODS (.ods)')
      return
    }

    try {
      await leerArchivoExcel(archivo)
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <style>{`
        .excel-uploader {
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          background: #f8fafc;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .excel-uploader:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .excel-uploader.dragover {
          border-color: #2563eb;
          background: #dbeafe;
        }
        .excel-upload-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .excel-upload-text {
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
        }
        .excel-upload-subtext {
          font-size: 12px;
          color: #6b7280;
        }
        .excel-input {
          display: none;
        }
        .excel-btn {
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
        .excel-btn:hover {
          background: #2563eb;
        }
        .excel-loading {
          color: #3b82f6;
          font-size: 14px;
          margin-top: 12px;
        }
        .excel-error {
          color: #dc2626;
          font-size: 13px;
          margin-top: 12px;
          padding: 8px;
          background: #fef2f2;
          border-radius: 6px;
        }
        .excel-success {
          color: #059669;
          font-size: 13px;
          margin-top: 12px;
          padding: 8px;
          background: #d1fae5;
          border-radius: 6px;
        }
      `}</style>

      <div
        className="excel-uploader"
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
        <div className="excel-upload-icon">📊</div>
        <div className="excel-upload-text">
          {tipoDocumento === 'ruc' || tipoDocumento === 'supercias'
            ? 'Cargar Archivo Excel/ODS de Superintendencia de Compañías'
            : 'Cargar Archivo Excel/ODS'}
        </div>
        <div className="excel-upload-subtext">
          Arrastre el archivo aquí o haga clic para seleccionar (.xlsx, .xls, .ods)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"
          onChange={handleFileChange}
          className="excel-input"
        />
        <button
          type="button"
          className="excel-btn"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          Seleccionar Archivo
        </button>
      </div>

      {cargando && (
        <div className="excel-loading">
          ⏳ Extrayendo datos del archivo Excel/ODS...
        </div>
      )}

      {error && (
        <div className="excel-error">
          ❌ {error}
        </div>
      )}

      {datosExtraidos && !cargando && (
        <div className="excel-success">
          ✅ Datos extraídos exitosamente. Los campos del formulario se han completado automáticamente.
        </div>
      )}
    </div>
  )
}

