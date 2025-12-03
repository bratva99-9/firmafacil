import React, { useState } from 'react'
import ExtractorPDF from './ExtractorPDF'

export default function InformeSuperCompanias() {
  const [tipoInforme, setTipoInforme] = useState(null) // null, 'acta-junta', 'informe-gerente', 'notas-explicativas', 'informe-comisario'
  
  // Estado para Acta de Junta General
  const [actaData, setActaData] = useState({
    nombreCompania: '',
    ruc: '',
    ciudad: '',
    dia: '',
    mes: '',
    anio: '2025',
    hora: '',
    lugar: '',
    direccion: '',
    modalidad: 'presencial', // presencial, virtual, mixta
    fechaConvocatoria: '',
    porcentajeQuorum: '',
    nombrePresidente: '',
    nombreSecretario: '',
    nombreGerente: '',
    nombreComisario: '',
    ejercicioFiscal: '2024',
    distribucionUtilidades: '',
    nombreFirmaAuditora: '',
    otrosAsuntos: '',
    horaCierre: ''
  })

  const [informeGenerado, setInformeGenerado] = useState(null)

  const handleActaChange = (e) => {
    const { name, value } = e.target
    setActaData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDatosExtraidos = (datos) => {
    // Aplicar datos extraídos del PDF al formulario
    // Solo actualizar campos que estén vacíos o si el nuevo dato es más completo
    setActaData(prev => {
      const nuevo = { ...prev }
      
      // RUC: siempre actualizar si hay nuevo dato
      if (datos.ruc && datos.ruc.length === 13) {
        nuevo.ruc = datos.ruc
      }
      
      // Nombre de la compañía: actualizar si está vacío o si el nuevo es más largo (más completo)
      if (datos.nombreCompania) {
        if (!prev.nombreCompania || datos.nombreCompania.length > prev.nombreCompania.length) {
          nuevo.nombreCompania = datos.nombreCompania
        }
      }
      
      // Ciudad: actualizar si está vacío
      if (datos.ciudad && !prev.ciudad) {
        nuevo.ciudad = datos.ciudad
      }
      
      // Dirección: actualizar si está vacío o si el nuevo es más completo
      if (datos.direccion) {
        if (!prev.direccion || datos.direccion.length > prev.direccion.length) {
          nuevo.direccion = datos.direccion
        }
      }
      
      // Lugar: usar dirección si no hay lugar específico
      if (datos.direccion && !prev.lugar) {
        nuevo.lugar = datos.direccion
      }
      
      // Gerente: actualizar si está vacío
      if (datos.nombreGerente && !prev.nombreGerente) {
        nuevo.nombreGerente = datos.nombreGerente
      }
      
      // Comisario: actualizar si está vacío
      if (datos.nombreComisario && !prev.nombreComisario) {
        nuevo.nombreComisario = datos.nombreComisario
      }
      
      // Fecha de constitución: actualizar si está vacío
      if (datos.fechaConstitucion && !prev.fechaConstitucion) {
        nuevo.fechaConstitucion = datos.fechaConstitucion
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

  const generarActaJunta = (e) => {
    e.preventDefault()
    
    // Validar campos requeridos
    if (!actaData.nombreCompania || !actaData.ruc || !actaData.ciudad || 
        !actaData.dia || !actaData.mes || !actaData.hora || !actaData.lugar ||
        !actaData.porcentajeQuorum || !actaData.nombrePresidente || !actaData.nombreSecretario) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    const lugarTexto = actaData.modalidad === 'presencial' 
      ? `en el domicilio principal de la compañía, ubicado en ${actaData.direccion || actaData.lugar}`
      : actaData.modalidad === 'virtual'
      ? `de manera virtual mediante plataforma digital`
      : `de manera presencial en ${actaData.direccion || actaData.lugar} y de manera virtual mediante plataforma digital`

    const fechaCompleta = `${actaData.dia} de ${actaData.mes} de ${actaData.anio}`
    const horaCompleta = actaData.hora

    const actaHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acta de Junta General - ${actaData.nombreCompania}</title>
  <style>
    @page {
      size: letter;
      margin: 2.5cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 10px 0 0;
    }
    .intro {
      text-align: justify;
      margin-bottom: 25px;
      text-indent: 1cm;
    }
    .orden-dia {
      margin: 25px 0;
    }
    .orden-dia h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .orden-dia ol {
      margin: 0;
      padding-left: 25px;
    }
    .orden-dia li {
      margin-bottom: 8px;
      text-align: justify;
    }
    .desarrollo {
      margin: 25px 0;
    }
    .desarrollo h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .desarrollo-item {
      margin-bottom: 20px;
      text-align: justify;
    }
    .desarrollo-item strong {
      font-weight: bold;
    }
    .desarrollo-item p {
      margin: 5px 0;
      text-indent: 1cm;
    }
    .firmas {
      margin-top: 60px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
    }
    .firma-box {
      text-align: center;
      width: 40%;
    }
    .firma-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
      min-height: 50px;
    }
    .firma-nombre {
      font-weight: bold;
      margin-top: 5px;
    }
    .firma-cargo {
      font-size: 11pt;
      margin-top: 3px;
    }
    .nota-modalidad {
      background: #f5f5f5;
      border-left: 4px solid #000;
      padding: 10px;
      margin: 20px 0;
      font-size: 11pt;
      font-style: italic;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ACTA DE LA JUNTA GENERAL ORDINARIA DE ACCIONISTAS</h1>
    <h2>${actaData.nombreCompania.toUpperCase()}</h2>
    <p style="margin-top: 10px; font-size: 11pt;"><strong>RUC: ${actaData.ruc}</strong></p>
  </div>

  <div class="intro">
    <p>
      En ${actaData.ciudad}, a ${fechaCompleta}, siendo las ${horaCompleta}, se reunieron ${lugarTexto} los accionistas de <strong>${actaData.nombreCompania}</strong>, conforme a la convocatoria realizada el ${actaData.fechaConvocatoria || fechaCompleta}, para celebrar la Junta General Ordinaria de Accionistas.
    </p>
  </div>

  ${actaData.modalidad !== 'presencial' ? `
  <div class="nota-modalidad">
    <strong>Nota:</strong> Esta junta se realizó de manera ${actaData.modalidad === 'virtual' ? 'virtual' : 'mixta (presencial y virtual)'}, conforme a lo establecido en la Resolución No. SCVS-INC-DNCDN-2025-0001 de la Superintendencia de Compañías, Valores y Seguros.
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
      <li><strong>Resolución sobre la distribución de utilidades.</strong></li>
      <li><strong>Designación o ratificación de administradores y comisarios, según corresponda.</strong></li>
      <li><strong>Lectura y aprobación de las notas explicativas a los estados financieros.</strong></li>
      <li><strong>Varios.</strong></li>
    </ol>
  </div>

  <div class="desarrollo">
    <h3>DESARROLLO DE LA SESIÓN:</h3>
    
    <div class="desarrollo-item">
      <p><strong>1. Constatación del quórum y apertura de la sesión:</strong></p>
      <p>Se constató la presencia de accionistas que representan el <strong>${actaData.porcentajeQuorum}%</strong> del capital social, por lo que se declaró instalada la sesión.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>2. Lectura y aprobación del acta de la junta anterior:</strong></p>
      <p>Se procedió a la lectura del acta de la junta anterior, la cual fue aprobada por unanimidad.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>3. Presentación y aprobación del Informe del Gerente General:</strong></p>
      <p>El Gerente General, <strong>${actaData.nombreGerente || '[Nombre del Gerente]'}</strong>, presentó el informe de gestión correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, destacando las actividades realizadas y los resultados obtenidos durante el período. El informe fue aprobado por unanimidad.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>4. Presentación y aprobación de los Estados Financieros:</strong></p>
      <p>Se presentaron los Estados Financieros del ejercicio fiscal ${actaData.ejercicioFiscal}, los cuales fueron aprobados por unanimidad.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>5. Presentación y aprobación del Informe del Comisario:</strong></p>
      <p>El Comisario, <strong>${actaData.nombreComisario || '[Nombre del Comisario]'}</strong>, presentó su informe correspondiente al ejercicio fiscal ${actaData.ejercicioFiscal}, el cual fue aprobado por unanimidad.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>6. Resolución sobre la distribución de utilidades:</strong></p>
      <p>${actaData.distribucionUtilidades || 'Se resolvió distribuir las utilidades del ejercicio fiscal ' + actaData.ejercicioFiscal + ' conforme a lo establecido en los estatutos de la compañía y la Ley de Compañías.'}</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>7. Designación o ratificación de administradores y comisarios:</strong></p>
      <p>Se procedió a la designación/ratificación de los siguientes cargos:</p>
      <p>- Gerente General: <strong>${actaData.nombreGerente || '[Nombre del Gerente]'}</strong></p>
      <p>- Comisario: <strong>${actaData.nombreComisario || '[Nombre del Comisario]'}</strong></p>
      ${actaData.nombreFirmaAuditora ? `<p>- Auditores Externos para el ejercicio fiscal ${parseInt(actaData.ejercicioFiscal) + 1}: <strong>${actaData.nombreFirmaAuditora}</strong></p>` : ''}
    </div>

    <div class="desarrollo-item">
      <p><strong>8. Lectura y aprobación de las notas explicativas a los estados financieros:</strong></p>
      <p>Se leyeron y aprobaron las notas explicativas correspondientes a los estados financieros del ejercicio fiscal ${actaData.ejercicioFiscal}.</p>
    </div>

    <div class="desarrollo-item">
      <p><strong>9. Varios:</strong></p>
      <p>${actaData.otrosAsuntos || 'No se trataron otros asuntos.'}</p>
    </div>
  </div>

  <div class="intro" style="margin-top: 30px;">
    <p>No habiendo más asuntos que tratar, se levantó la sesión a las <strong>${actaData.horaCierre || horaCompleta}</strong> del mismo día.</p>
  </div>

  <div class="firmas">
    <div class="firma-box">
      <div class="firma-line"></div>
      <div class="firma-nombre">${actaData.nombrePresidente}</div>
      <div class="firma-cargo">PRESIDENTE</div>
    </div>
    <div class="firma-box">
      <div class="firma-line"></div>
      <div class="firma-nombre">${actaData.nombreSecretario}</div>
      <div class="firma-cargo">SECRETARIO</div>
    </div>
  </div>

  <div style="margin-top: 40px; font-size: 10pt; text-align: center; color: #666; font-style: italic;">
    <p>Documento generado conforme a las disposiciones de la Superintendencia de Compañías, Valores y Seguros</p>
    <p>Resolución No. SCVS-INC-DNCDN-2025-0001</p>
  </div>
</body>
</html>
    `

    setInformeGenerado(actaHTML)
  }

  const descargarPDF = () => {
    if (!informeGenerado) return

    const ventana = window.open('', '_blank')
    ventana.document.write(informeGenerado)
    ventana.document.close()
    
    setTimeout(() => {
      ventana.print()
    }, 250)
  }

  const descargarHTML = () => {
    if (!informeGenerado) return

    const blob = new Blob([informeGenerado], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const nombreArchivo = tipoInforme === 'acta-junta' 
      ? `Acta_Junta_General_${actaData.nombreCompania.replace(/\s+/g, '_')}_${actaData.ruc}.html`
      : `Informe_SCVS_${Date.now()}.html`
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
      dia: '',
      mes: '',
      anio: '2025',
      hora: '',
      lugar: '',
      direccion: '',
      modalidad: 'presencial',
      fechaConvocatoria: '',
      porcentajeQuorum: '',
      nombrePresidente: '',
      nombreSecretario: '',
      nombreGerente: '',
      nombreComisario: '',
      ejercicioFiscal: '2024',
      distribucionUtilidades: '',
      nombreFirmaAuditora: '',
      otrosAsuntos: '',
      horaCierre: ''
    })
    setInformeGenerado(null)
  }

  const volverMenu = () => {
    setTipoInforme(null)
    setInformeGenerado(null)
    limpiarFormulario()
  }

  // Vista de selección de tipo de informe
  if (!tipoInforme) {
    return (
      <div style={{ padding: 8 }}>
        <style>{`
          .isc-menu {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 16px;
          }
          .isc-menu-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
            text-align: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          .isc-menu-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          }
          .isc-menu-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }
          .isc-menu-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .isc-menu-desc {
            font-size: 12px;
            opacity: 0.9;
          }
          .isc-title {
            font-size: 18px;
            font-weight: 800;
            margin: 0 0 8px;
            color: #111827;
          }
          .isc-subtitle {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 20px;
          }
        `}</style>

        <h3 className="isc-title">Informes Anuales - Superintendencia de Compañías</h3>
        <p className="isc-subtitle">Seleccione el tipo de informe que desea generar:</p>

        <div className="isc-menu">
          <div className="isc-menu-card" onClick={() => setTipoInforme('acta-junta')}>
            <div className="isc-menu-icon">📋</div>
            <div className="isc-menu-title">Acta de Junta General</div>
            <div className="isc-menu-desc">Acta de la Junta General Ordinaria de Accionistas</div>
          </div>

          <div className="isc-menu-card" onClick={() => setTipoInforme('informe-gerente')} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="isc-menu-icon">📊</div>
            <div className="isc-menu-title">Informe de Gerente</div>
            <div className="isc-menu-desc">Informe del Gerente General</div>
          </div>

          <div className="isc-menu-card" onClick={() => setTipoInforme('notas-explicativas')} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="isc-menu-icon">📝</div>
            <div className="isc-menu-title">Notas Explicativas</div>
            <div className="isc-menu-desc">Notas explicativas a los estados financieros</div>
          </div>

          <div className="isc-menu-card" onClick={() => setTipoInforme('informe-comisario')} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="isc-menu-icon">🔍</div>
            <div className="isc-menu-title">Informe de Comisario</div>
            <div className="isc-menu-desc">Informe del Comisario de la compañía</div>
          </div>
        </div>
      </div>
    )
  }

  // Formulario para Acta de Junta General
  if (tipoInforme === 'acta-junta') {
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
          .pdf-extractors {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
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
            .pdf-extractors {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button className="isc-btn isc-btn-back" onClick={volverMenu}>
            ← Volver
          </button>
          <h3 className="isc-title">Acta de Junta General Ordinaria de Accionistas</h3>
        </div>
        
        <div className="isc-info">
          Complete los campos requeridos (*) para generar el acta. El documento se generará listo para imprimir y firmar, conforme a las disposiciones de la SCVS para 2025-2026.
        </div>

        <div className="pdf-extractors">
          <ExtractorPDF 
            tipoDocumento="ruc" 
            onDataExtracted={handleDatosExtraidos}
          />
          <ExtractorPDF 
            tipoDocumento="cco" 
            onDataExtracted={handleDatosExtraidos}
          />
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
              <label className="isc-label required">Lugar / Dirección</label>
              <input
                type="text"
                name="lugar"
                value={actaData.lugar}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: Domicilio principal"
                required
              />
            </div>

            <div className="isc-field">
              <label className="isc-label">Dirección completa</label>
              <input
                type="text"
                name="direccion"
                value={actaData.direccion}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: Av. Amazonas N12-34, Quito"
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

            <div className="isc-field">
              <label className="isc-label required">Nombre del Presidente</label>
              <input
                type="text"
                name="nombrePresidente"
                value={actaData.nombrePresidente}
                onChange={handleActaChange}
                className="isc-input"
                required
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
              <label className="isc-label">Nombre del Gerente General</label>
              <input
                type="text"
                name="nombreGerente"
                value={actaData.nombreGerente}
                onChange={handleActaChange}
                className="isc-input"
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

            <div className="isc-field">
              <label className="isc-label">Firma Auditora Externa</label>
              <input
                type="text"
                name="nombreFirmaAuditora"
                value={actaData.nombreFirmaAuditora}
                onChange={handleActaChange}
                className="isc-input"
                placeholder="Ej: Deloitte & Touche"
              />
            </div>
          </div>

          <div className="isc-field" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
            <label className="isc-label">Distribución de Utilidades</label>
            <textarea
              name="distribucionUtilidades"
              value={actaData.distribucionUtilidades}
              onChange={handleActaChange}
              className="isc-textarea"
              placeholder="Detalle de cómo se distribuirán las utilidades..."
            />
          </div>

          <div className="isc-field" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
            <label className="isc-label">Otros Asuntos</label>
            <textarea
              name="otrosAsuntos"
              value={actaData.otrosAsuntos}
              onChange={handleActaChange}
              className="isc-textarea"
              placeholder="Otros asuntos tratados en la junta (dejar vacío si no hay)"
            />
          </div>

          <div className="isc-buttons">
            <button type="submit" className="isc-btn isc-btn-primary">
              Generar Acta
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

        {informeGenerado && (
          <div className="isc-preview">
            <div className="isc-preview-title">✓ Acta generada exitosamente</div>
            <div className="isc-info">
              El acta está lista. Puede descargarla como HTML o imprimirla directamente.
            </div>
            <div className="isc-preview-actions">
              <button 
                className="isc-btn isc-btn-secondary"
                onClick={descargarPDF}
              >
                📄 Imprimir/PDF
              </button>
              <button 
                className="isc-btn isc-btn-primary"
                onClick={descargarHTML}
              >
                💾 Descargar HTML
              </button>
              <button 
                className="isc-btn isc-btn-tertiary"
                onClick={() => {
                  const ventana = window.open('', '_blank')
                  ventana.document.write(informeGenerado)
                  ventana.document.close()
                }}
              >
                👁️ Vista Previa
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Placeholder para otros informes (se implementarán después)
  return (
    <div style={{ padding: 8 }}>
      <button className="isc-btn isc-btn-back" onClick={volverMenu} style={{ marginBottom: '16px' }}>
        ← Volver
      </button>
      <div style={{ padding: '40px', textAlign: 'center', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>Próximamente</h3>
        <p style={{ color: '#6b7280' }}>
          El formulario para {tipoInforme === 'informe-gerente' ? 'Informe de Gerente' : 
                           tipoInforme === 'notas-explicativas' ? 'Notas Explicativas' : 
                           'Informe de Comisario'} estará disponible próximamente.
        </p>
      </div>
    </div>
  )
}
