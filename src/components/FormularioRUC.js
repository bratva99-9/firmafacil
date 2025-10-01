import React, { useEffect, useState } from 'react';
import FileUpload from './FileUpload';
import { insertSolicitud, uploadFile, updateSolicitud, consultarCedula, consultarRUC } from '../lib/supabase';

const FormularioRUC = ({ onBack, user }) => {
  // Estilos minimalistas y neutros
  const localStyles = `
    .form-wrapper {
      max-width: 1000px;
      margin: -20px auto 0 auto;
      padding: 0 24px;
      background: #f6f7fb;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    
    @media (max-width: 768px) {
      .form-wrapper {
        padding: 20px 0px;
        margin: 20px 0 0 0;
        max-width: 100%;
      }
      
      .main-card {
        margin: 0;
        border-radius: 0;
        max-width: 100%;
      }
      
      .tipo-tramite-container {
        flex-direction: column !important;
        gap: 16px !important;
      }
      
      .servicios-complementarios-container {
        flex-direction: column !important;
        gap: 16px !important;
      }
      
      .tipo-tramite-container > div {
        width: 100% !important;
        min-height: 120px !important;
      }
      
      .servicios-complementarios-container > div {
        width: 100% !important;
        min-height: 140px !important;
      }
      
      .progress-container {
        padding: 20px 16px !important;
      }
      
      .progress-steps {
        max-width: 100% !important;
        gap: 8px !important;
      }
      
      .progress-step {
        width: 24px !important;
        height: 24px !important;
        font-size: 12px !important;
      }
      
      .progress-line {
        height: 4px !important;
      }
      
      .step1-section {
        padding: 8px 12px !important;
        margin-bottom: 4px !important;
      }
      
      .step1-container {
        padding: 12px !important;
        margin-bottom: 8px !important;
      }
      
      .step1-info-box {
        padding: 8px !important;
        margin-bottom: 8px !important;
      }
      
      .section {
        padding: 8px 12px !important;
        margin-bottom: 4px !important;
      }
      
      .section-header {
        margin-bottom: 8px !important;
        padding-bottom: 4px !important;
      }
      
      .form-header {
        padding: 12px 16px !important;
      }
      
      .submit-section {
        padding: 12px !important;
        margin: 8px -12px -8px -12px !important;
      }
      
      .grid {
        gap: 8px !important;
      }
      
      .form-group {
        margin-bottom: 8px !important;
      }
      
      .form-label {
        margin-bottom: 4px !important;
      }
      
      .error-message {
        margin-top: 4px !important;
      }
      
      .pricing-section {
        padding: 12px 12px 12px 40px !important;
        margin: 0 0 8px 0 !important;
      }
      
      .pricing-grid {
        gap: 4px !important;
        padding: 2px 0 4px 0 !important;
        margin-left: -20px !important;
      }
      
      .price-card {
        padding: 6px 4px !important;
        min-width: 60px !important;
        max-width: 80px !important;
      }
      
      /* Paso 2: apilar badge debajo del RUC */
      .ruc-display {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 6px !important;
      }
      .ruc-display .validation-valid {
        align-self: flex-start !important;
      }
      
      .options-grid {
        gap: 8px !important;
        margin-top: 4px !important;
      }
      
      .option-card {
        padding: 10px 12px !important;
        min-height: 40px !important;
      }
      
      /* Paso 6: Reordenar resumen de pago en móvil */
      .payment-summary {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .payment-summary .row-firma { order: 1; }
      .payment-summary .row-ruc { order: 2; }
      .payment-summary .row-declaraciones { order: 3; }
      .payment-summary .row-equifax { order: 4; }
      
      /* Paso 5: Documentos en columna */
      .docs-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      
      /* Paso 3: Dirección Comercial todo en columna */
      .direccion-comercial .grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      
      /* Paso 2: todos los casilleros del mismo tamaño */
      .step2-section .api-data-display {
        min-height: 48px !important;
        display: flex !important;
        align-items: center !important;
      }
      
      /* Paso 2: badge de RUC generado automáticamente mismo tamaño */
      .step2-section .ruc-display .validation-valid {
        min-height: 48px !important;
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
      }
      
      /* Paso 3: todos los casilleros del mismo tamaño */
      .step3-section .form-input,
      .step3-section .form-select,
      .step3-section .form-textarea {
        height: 48px !important;
        min-height: 48px !important;
      }
      
      /* Paso 4: todos los casilleros del mismo tamaño */
      .step4-section .form-input,
      .step4-section .form-select {
        height: 48px !important;
        min-height: 48px !important;
      }
    }

    .main-card {
      width: 100%;
      max-width: 960px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      overflow: hidden;
      margin: 0 auto;
    }

    .form-header {
      background: #ffffff;
      color: #111827;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }

    .form-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 6px 0;
    }

    .form-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    .form-content { padding: 0; }

    .section {
      border-bottom: 1px solid #f3f4f6;
      padding: 20px 24px;
    }
    .section:last-child { border-bottom: none; }
    .section.pricing-section-wrapper {
      padding: 20px 24px 20px 60px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-icon { width: 20px; height: 20px; color: #6b7280; }
    .section-title { font-size: 16px; font-weight: 700; margin: 0; color: #111827; }
    .section-description { color: #6b7280; font-size: 13px; margin: 2px 0 0 30px; }

    .grid { display: grid; gap: 16px; }
    .grid-1 { grid-template-columns: 1fr; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } .form-wrapper { padding: 12px; } }

    .form-group { display: flex; flex-direction: column; }
    .form-label { font-weight: 600; color: #111827; margin-bottom: 6px; font-size: 13px; }
    .required-asterisk { color: #ef4444; margin-left: 4px; }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      background: #ffffff;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #111827;
      box-shadow: 0 0 0 2px rgba(17,24,39,0.06);
    }
    .form-textarea { 
      min-height: 42px; 
      height: 42px;
      resize: none; 
      overflow-y: auto;
    }
    
    .form-input.readonly, .form-select.readonly {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #374151;
      cursor: default;
      font-weight: 500;
    }
    .form-input.readonly:focus, .form-select.readonly:focus {
      border-color: #e2e8f0;
      box-shadow: none;
    }
    
    .api-data-display {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 6px;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .api-data-display::before {
      content: '✓';
      background: #10b981;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .api-data-display.validation-valid::before {
      content: '✓';
      background: #10b981;
    }
    .api-data-display.validation-invalid::before {
      content: '⚠';
      background: #f59e0b;
    }
    .api-data-text {
      color: #000000;
      font-weight: 600;
      font-size: 14px;
    }

    .error-message { color: #b91c1c; font-size: 12px; margin-top: 6px; display: flex; align-items: center; }
    .error-icon { width: 14px; height: 14px; margin-right: 4px; }

    .pricing-section { 
      background: #fafbfc; 
      padding: 20px 20px 20px 60px; 
      margin: 0 0 12px 0; 
      border-bottom: 1px solid #e5e7eb; 
      border-radius: 8px;
    }
    .pricing-grid { 
      display: flex; 
      gap: 6px; 
      flex-wrap: wrap;
      padding: 4px 0 8px 0;
      justify-content: flex-start;
      margin-left: -40px;
    }
    .price-card { 
      background: #ffffff; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 10px 8px; 
      text-align: center; 
      cursor: pointer; 
      transition: all 0.15s ease; 
      position: relative; 
      min-width: 70px;
      flex: 1;
      max-width: 100px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .price-card:hover { 
      border-color: #3b82f6; 
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    .price-card.selected { 
      border-color: #1e40af; 
      background: #f0f9ff;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
      transform: translateY(-1px);
    }
    .price-title { 
      font-size: 10px; 
      font-weight: 600; 
      color: #6b7280; 
      margin-bottom: 4px; 
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      text-align: center;
      width: 100%;
    }
    .price-amount { 
      font-size: 14px; 
      font-weight: 700; 
      color: #1f2937; 
      line-height: 1.1;
      text-align: center;
      width: 100%;
      margin: 0;
    }
    .price-card.selected .price-amount {
      color: #1e40af;
    }
    .price-note { 
      font-size: 8px; 
      color: #9ca3af; 
      font-weight: 500;
      margin-top: 2px;
      text-align: center;
      width: 100%;
    }
    .badge { 
      position: absolute; 
      top: -4px; 
      right: -4px; 
      background: #f59e0b; 
      color: #fff; 
      border-radius: 8px; 
      padding: 2px 6px; 
      font-size: 9px; 
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
    }

    .options-grid { 
      display: flex; 
      gap: 12px; 
      margin-top: 8px; 
    }
    .option-card { 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 14px 16px; 
      cursor: pointer; 
      background: #ffffff; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 8px; 
      transition: all 0.15s ease; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      flex: 1;
      min-height: 48px;
    }
    .option-card:hover { 
      transform: translateY(-1px); 
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
    }
    .option-card.selected { 
      border-color: #1e40af; 
      background: #f0f9ff;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
      transform: translateY(-1px);
    }
    .option-label { 
      font-weight: 600; 
      color: #374151; 
      font-size: 14px;
      letter-spacing: 0.2px;
    }
    .option-card.selected .option-label {
      color: #1e40af;
      font-weight: 700;
    }

    .btn { padding: 10px 14px; border: 1px solid #d1d5db; background: #fff; color: #111827; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }

    .submit-section { background: #fafafa; padding: 20px; margin: 16px -24px -20px -24px; text-align: center; border-top: 1px solid #f3f4f6; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .submit-btn { width: 100%; max-width: 380px; padding: 14px 18px; font-size: 16px; font-weight: 700; }

    .loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.15); border-top: 2px solid #111827; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .success-card { text-align: center; padding: 36px 24px; background: #f0fdf4; color: #065f46; border-radius: 12px; margin: 20px; border: 1px solid #bbf7d0; }
    .success-icon { font-size: 56px; margin-bottom: 8px; }
    .success-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    .success-message { font-size: 14px; margin-bottom: 16px; line-height: 1.5; }

    .general-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px; border-radius: 8px; margin: 0 24px 16px 24px; display: flex; align-items: center; gap: 8px; }

    .input-wrapper { position: relative; }
    
    .validation-container {
      display: flex;
      gap: 16px;
      align-items: end;
    }
    
    .validation-field {
      flex: 1;
    }
    
    .validation-button {
      min-width: 140px;
    }
    
    @media (max-width: 768px) {
      .validation-container {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .validation-field {
        flex: none;
      }
      
      .validation-button {
        min-width: auto;
        width: 100%;
      }
    }
  `;

  const [formData, setFormData] = useState({
    numero_cedula: '',
    nombres: '',
    apellidos: '',
    edad: '',
    nacionalidad: '',
    genero: '',
    ruc: '',
    provincia: '',
    ciudad: '',
    parroquia: '',
    direccion: '',
    codigo_huella: '',
    celular: '',
    correo: '',
    fecha_inicio_actividades: '',
    actividad_economica: '',
    tipo_banco: '',
    tipo_ruc_antiguedad: '',
    complementos: [],
    // Nuevos campos para el paso 4
    codigo_cuen: '',
    direccion_completa: '',
    lugar_referencia: '',
    nombre_comercial: '',
    actividad_sri: '',
    antiguedad_solicitada: '12 meses'
  });

  const [archivos, setArchivos] = useState({
    cedula_frontal: null,
    cedula_atras: null,
    selfie: null,
    comprobante_pago: null
  });

  const [loading, setLoading] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [loadingRUC, setLoadingRUC] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [rucData, setRucData] = useState(null);
  const [seleccionAutomatica, setSeleccionAutomatica] = useState(false);

  // Wizard por pasos
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const goNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Validación ligera por paso para navegación
  const canGoNext = () => {
    if (step === 1) {
      // No permitir continuar si hay error de RUC activo
      if (errors.ruc_validation && errors.ruc_validation.includes('ACTIVO')) {
        return false;
      }
      return !!rucData && !!formData.tipo_ruc_antiguedad;
    }
    if (step === 2) {
      const huellaOk = !!formData.codigo_huella;
      const datosCargados = !!formData.nombres && !!formData.apellidos;
      return huellaOk && datosCargados;
    }
    if (step === 3) {
      return (
        !!formData.provincia &&
        !!formData.ciudad &&
        !!formData.parroquia &&
        !!formData.direccion &&
        /^\d{10}$/.test(formData.celular || '') &&
        (formData.correo || '').includes('@') &&
        !!formData.codigo_cuen
      );
    }
    if (step === 4) {
      return (
        !!formData.actividad_sri &&
        !!formData.antiguedad_solicitada
      );
    }
    if (step === 5) {
      return !!archivos.cedula_frontal && !!archivos.cedula_atras && !!archivos.selfie;
    }
    return true;
  };

  const handleBuscarCedula = async () => {
    const ced = formData.numero_cedula;
    if (ced && /^\d{10}$/.test(ced)) {
      setLoadingCedula(true);
      
      try {
        const resultado = await consultarCedula(ced);
        
        if (resultado.success) {
          // Cargar datos obtenidos de la API
          setFormData(prev => ({
            ...prev,
            nombres: resultado.data.nombres,
            apellidos: resultado.data.apellidos,
            nacionalidad: resultado.data.nacionalidad,
            provincia: resultado.data.provincia,
            ciudad: resultado.data.ciudad,
            parroquia: resultado.data.parroquia,
            direccion: resultado.data.direccion,
            edad: resultado.data.edad || '',
            genero: resultado.data.genero || '',
            ruc: ced + '001' // Generar RUC directamente
          }));
          
          console.log('📋 Datos cargados en formulario:', {
            provincia: resultado.data.provincia,
            ciudad: resultado.data.ciudad,
            parroquia: resultado.data.parroquia
          });
          
          // Limpiar errores
          setErrors(prev => ({
            ...prev,
            numero_cedula: ''
          }));
          
          console.log('✅ Datos de cédula cargados automáticamente');
        } else {
          // Mostrar error si no se encontró la cédula
          setErrors(prev => ({
            ...prev,
            numero_cedula: resultado.error || 'Cédula no encontrada en el sistema'
          }));
        }
      } catch (error) {
        console.error('Error al consultar cédula:', error);
        setErrors(prev => ({
          ...prev,
          numero_cedula: 'Error al consultar la cédula. Intenta nuevamente.'
        }));
      } finally {
        setLoadingCedula(false);
      }
    } else {
      // Mostrar error si la cédula no es válida
      setErrors(prev => ({
        ...prev,
        numero_cedula: 'La cédula debe tener 10 dígitos'
      }));
    }
  };


  const handleValidarRUC = async () => {
    const ced = formData.numero_cedula;
    if (ced && /^\d{10}$/.test(ced)) {
      const ruc = ced + '001';
      setLoadingRUC(true);
      
      try {
        // Consultar tanto RUC como cédula para obtener todos los datos
        const [resultadoRUC, resultadoCedula] = await Promise.all([
          consultarRUC(ruc),
          consultarCedula(ced)
        ]);
        
        if (resultadoRUC.success) {
          setRucData(resultadoRUC.data);
          
          // Cargar datos del RUC y cédula en el formulario
          setFormData(prev => ({
            ...prev,
            // Datos del RUC
            actividad_economica: resultadoRUC.data.actividad_economica_principal || '',
            fecha_inicio_actividades: resultadoRUC.data.fecha_inicio_actividades ? 
              resultadoRUC.data.fecha_inicio_actividades.split(' ')[0] : '',
            ruc: resultadoRUC.data.numero_ruc || ced + '001',
            // Datos de la cédula (priorizar datos de consultaCedula si están disponibles)
            nombres: resultadoCedula.success ? resultadoCedula.data.nombres : (resultadoRUC.data.nombres || ''),
            apellidos: resultadoCedula.success ? resultadoCedula.data.apellidos : (resultadoRUC.data.apellidos || ''),
            edad: resultadoCedula.success ? resultadoCedula.data.edad : (resultadoRUC.data.edad || ''),
            genero: resultadoCedula.success ? resultadoCedula.data.genero : (resultadoRUC.data.genero || ''),
            nacionalidad: resultadoCedula.success ? resultadoCedula.data.nacionalidad : (resultadoRUC.data.nacionalidad || ''),
            provincia: normalizarProvincia(resultadoCedula.success ? resultadoCedula.data.provincia : (resultadoRUC.data.provincia || '')),
            ciudad: resultadoCedula.success ? resultadoCedula.data.ciudad : (resultadoRUC.data.ciudad || ''),
            parroquia: resultadoCedula.success ? resultadoCedula.data.parroquia : (resultadoRUC.data.parroquia || ''),
            direccion: resultadoCedula.success ? resultadoCedula.data.direccion : (resultadoRUC.data.direccion || '')
          }));
          
          console.log('✅ Datos cargados en formulario:', {
            nombres: resultadoCedula.success ? resultadoCedula.data.nombres : (resultadoRUC.data.nombres || ''),
            apellidos: resultadoCedula.success ? resultadoCedula.data.apellidos : (resultadoRUC.data.apellidos || ''),
            edad: resultadoCedula.success ? resultadoCedula.data.edad : (resultadoRUC.data.edad || ''),
            genero: resultadoCedula.success ? resultadoCedula.data.genero : (resultadoRUC.data.genero || ''),
            nacionalidad: resultadoCedula.success ? resultadoCedula.data.nacionalidad : (resultadoRUC.data.nacionalidad || ''),
            provincia: normalizarProvincia(resultadoCedula.success ? resultadoCedula.data.provincia : (resultadoRUC.data.provincia || '')),
            ciudad: resultadoCedula.success ? resultadoCedula.data.ciudad : (resultadoRUC.data.ciudad || ''),
            parroquia: resultadoCedula.success ? resultadoCedula.data.parroquia : (resultadoRUC.data.parroquia || ''),
            direccion: resultadoCedula.success ? resultadoCedula.data.direccion : (resultadoRUC.data.direccion || '')
          });
          
          console.log('🏛️ Provincia normalizada:', {
            original: resultadoCedula.success ? resultadoCedula.data.provincia : (resultadoRUC.data.provincia || ''),
            normalizada: normalizarProvincia(resultadoCedula.success ? resultadoCedula.data.provincia : (resultadoRUC.data.provincia || ''))
          });
          
          console.log('📋 Servicios seleccionados automáticamente:', ['declaraciones']);
          
          // Limpiar errores
          setErrors(prev => ({
            ...prev,
            numero_cedula: '',
            ruc_validation: ''
          }));
          
          // Selección automática del tipo de RUC basado en el estado
          let tipoSeleccionado = '';
          let mensajeError = '';
          
          if (resultadoRUC.data.sin_ruc) {
            // Persona sin RUC - Primera vez
            tipoSeleccionado = 'primera_vez';
          } else {
            const estado = resultadoRUC.data.estado_contribuyente_ruc?.toUpperCase();
            
            if (estado === 'ACTIVO') {
              // RUC activo - No aplica para el servicio
              mensajeError = 'Este RUC está actualmente ACTIVO y no aplica para el servicio de RUC con antigüedad.';
            } else if (estado === 'SUSPENDIDO') {
              // Verificar motivo de suspensión
              const motivoCese = resultadoRUC.data.motivo_cancelacion_suspension?.toLowerCase();
              if (motivoCese && motivoCese.includes('cese')) {
                tipoSeleccionado = 'reactivacion_cese';
              } else if (motivoCese && motivoCese.includes('depuracion')) {
                tipoSeleccionado = 'reactivacion_depuracion';
              } else {
                // Por defecto, si está suspendido pero no sabemos el motivo
                tipoSeleccionado = 'reactivacion_cese';
              }
            } else {
              // Otros estados - Primera vez por defecto
              tipoSeleccionado = 'primera_vez';
            }
          }
          
          // Actualizar el tipo seleccionado y seleccionar declaraciones por defecto
          if (tipoSeleccionado) {
            setFormData(prev => ({
              ...prev,
              tipo_ruc_antiguedad: tipoSeleccionado,
              complementos: ['declaraciones'] // Seleccionar declaraciones por defecto
            }));
            setSeleccionAutomatica(true);
          }
          
          // Establecer mensaje de error si aplica
          if (mensajeError) {
            setErrors(prev => ({
              ...prev,
              ruc_validation: mensajeError
            }));
          }
          
          console.log('✅ RUC validado exitosamente:', resultadoRUC.data);
          console.log('🎯 Tipo seleccionado automáticamente:', tipoSeleccionado);
          console.log('⚠️ Mensaje de error:', mensajeError);
          console.log('👤 Nombres recibidos:', resultadoRUC.data.nombres);
          console.log('👤 Apellidos recibidos:', resultadoRUC.data.apellidos);
          console.log('👤 Razón social:', resultadoRUC.data.razon_social);
        } else {
          // Mostrar error si no se encontró el RUC
          setErrors(prev => ({
            ...prev,
            ruc_validation: resultadoRUC.error || 'RUC no encontrado en el sistema'
          }));
          setRucData(null);
        }
      } catch (error) {
        console.error('Error al consultar RUC:', error);
        setErrors(prev => ({
          ...prev,
          ruc_validation: 'Error al consultar el RUC. Intenta nuevamente.'
        }));
        setRucData(null);
      } finally {
        setLoadingRUC(false);
      }
    } else {
      // Mostrar error si la cédula no es válida
      setErrors(prev => ({
        ...prev,
        numero_cedula: 'La cédula debe tener 10 dígitos'
      }));
    }
  };

  const provincias = [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
    'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura',
    'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo',
    'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
    'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'
  ];

  // Función para normalizar nombres de provincias
  const normalizarProvincia = (provinciaAPI) => {
    if (!provinciaAPI) return '';
    
    const provinciaLower = provinciaAPI.toLowerCase().trim();
    
    // Mapeo de variaciones comunes de nombres de provincias
    const mapeoProvincias = {
      'guayaquil': 'Guayas',
      'quito': 'Pichincha',
      'cuenca': 'Azuay',
      'ambato': 'Tungurahua',
      'machala': 'El Oro',
      'portoviejo': 'Manabí',
      'loja': 'Loja',
      'ibarra': 'Imbabura',
      'tulcan': 'Carchi',
      'riobamba': 'Chimborazo',
      'latacunga': 'Cotopaxi',
      'babahoyo': 'Los Ríos',
      'esmeraldas': 'Esmeraldas',
      'milagro': 'Guayas',
      'santa elena': 'Santa Elena',
      'santo domingo': 'Santo Domingo de los Tsáchilas',
      'macas': 'Morona Santiago',
      'tena': 'Napo',
      'el coca': 'Orellana',
      'puyo': 'Pastaza',
      'nueva loja': 'Sucumbíos',
      'zamora': 'Zamora Chinchipe',
      'puerto baquerizo moreno': 'Galápagos',
      'guaranda': 'Bolívar',
      'azogues': 'Cañar'
    };
    
    // Buscar coincidencia exacta
    const coincidenciaExacta = provincias.find(p => 
      p.toLowerCase() === provinciaLower
    );
    if (coincidenciaExacta) return coincidenciaExacta;
    
    // Buscar coincidencia parcial
    const coincidenciaParcial = provincias.find(p => 
      p.toLowerCase().includes(provinciaLower) || 
      provinciaLower.includes(p.toLowerCase())
    );
    if (coincidenciaParcial) return coincidenciaParcial;
    
    // Buscar en el mapeo
    const mapeo = mapeoProvincias[provinciaLower];
    if (mapeo) return mapeo;
    
    // Si no encuentra coincidencia, devolver la provincia original
    return provinciaAPI;
  };

  const bancos = [
    'Banco Pichincha', 'Banco del Pacífico', 'Banco de Guayaquil',
    'Banco Internacional', 'Produbanco', 'Banco Bolivariano',
    'Banco General Rumiñahui', 'Banco ProCredit', 'Banco del Austro',
    'Banco Solidario', 'Banco Machala', 'Banco Capital',
    'Banco Comercial de Manabí', 'Banco Coopnacional'
  ];

  const actividadesSRI = [
    'Comercio al por mayor y por menor',
    'Servicios profesionales',
    'Construcción',
    'Manufactura',
    'Agricultura y ganadería',
    'Transporte y almacenamiento',
    'Alojamiento y servicios de comida',
    'Información y comunicaciones',
    'Actividades financieras y de seguros',
    'Actividades inmobiliarias',
    'Actividades de servicios administrativos',
    'Enseñanza',
    'Actividades de atención de la salud',
    'Actividades artísticas y de entretenimiento',
    'Otras actividades de servicios'
  ];

  const antiguedadesRUC = [
    '3 meses',
    '6 meses',
    '9 meses',
    '12 meses'
  ];

  // Precio fijo para RUC con antigüedad
  const precioRUC = 25.00;

  // Función para obtener el precio según el tipo de RUC seleccionado
  const obtenerPrecioRUC = () => {
    switch (formData.tipo_ruc_antiguedad) {
      case 'primera_vez':
        return 45.00;
      case 'reactivacion_cese':
        return 60.00;
      case 'reactivacion_depuracion':
        return 80.00;
      case 'retroactividad':
        return 300.00;
      default:
        return 0.00;
    }
  };

  // Función para obtener el precio de los complementos
  const obtenerPrecioComplementos = () => {
    const complementos = formData.complementos || [];
    let total = 0;
    
    if (complementos.includes('firma_electronica')) {
      total += 8.00; // Precio actualizado
    }
    
    if (complementos.includes('declaraciones')) {
      total += 15.00; // Precio promocional
    }
    
    if (complementos.includes('equifax')) {
      total += 5.00; // Precio promocional
    }
    
    return total;
  };

  // Función para obtener el precio total
  const obtenerPrecioTotal = () => {
    return obtenerPrecioRUC() + obtenerPrecioComplementos();
  };

  // Función para formatear fechas de manera legible
  const formatearFechaLegible = (fecha) => {
    if (!fecha) return '';
    
    const fechaObj = new Date(fecha);
    const opciones = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Guayaquil'
    };
    
    return fechaObj.toLocaleDateString('es-EC', opciones);
  };

  // Función para obtener el mensaje según el estado del RUC
  const obtenerMensajeEstado = () => {
    if (!rucData) return '';
    
    if (rucData.sin_ruc) {
      return 'Esta persona no tiene RUC (Registro Único de Contribuyentes) y es mayor de edad por lo que aplica para el servicio de RUC con antigüedad por primera vez.';
    }
    
    const estado = rucData.estado_contribuyente_ruc?.toUpperCase();
    
    if (estado === 'ACTIVO') {
      return 'Este RUC está actualmente ACTIVO y no aplica para el servicio de RUC con antigüedad.';
    }
    
    if (estado === 'SUSPENDIDO') {
      const motivoCese = rucData.motivo_cancelacion_suspension?.toLowerCase();
      if (motivoCese && motivoCese.includes('cese')) {
        return 'Este RUC está SUSPENDIDO por cese de actividades y aplica para el servicio de reactivación por cese.';
      } else if (motivoCese && motivoCese.includes('depuracion')) {
        return 'Este RUC está SUSPENDIDO por depuración y aplica para el servicio de reactivación por depuración.';
      } else {
        return 'Este RUC está SUSPENDIDO y aplica para el servicio de reactivación por cese.';
      }
    }
    
    return 'Este RUC aplica para el servicio de RUC con antigüedad.';
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si el usuario cambia manualmente el tipo de RUC, resetear la selección automática
    if (name === 'tipo_ruc_antiguedad') {
      setSeleccionAutomatica(false);
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Limpiar datos cuando se cambie la cédula
  useEffect(() => {
    const ced = formData.numero_cedula;
    if (ced && ced.length !== 10) {
      // Limpiar datos si la cédula no tiene 10 dígitos
      setRucData(null);
      setSeleccionAutomatica(false);
      setFormData(prev => ({
        ...prev,
        nombres: '',
        apellidos: '',
        edad: '',
        nacionalidad: '',
        provincia: '',
        ciudad: '',
        parroquia: '',
        direccion: '',
        ruc: '',
        tipo_ruc_antiguedad: ''
      }));
      setErrors(prev => ({
        ...prev,
        ruc_validation: ''
      }));
    }
  }, [formData.numero_cedula]);

  const handleFileChange = (tipo, file) => {
    setArchivos(prev => ({
      ...prev,
      [tipo]: file
    }));
    
    if (errors[tipo]) {
      setErrors(prev => ({
        ...prev,
        [tipo]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validación de RUC
    if (!rucData) {
      newErrors.ruc_validation = 'Debes validar tu RUC antes de continuar';
    }

    if (!formData.numero_cedula || formData.numero_cedula.length !== 10) {
      newErrors.numero_cedula = 'La cédula debe tener 10 dígitos';
    }

    if (!formData.provincia) {
      newErrors.provincia = 'Selecciona una provincia';
    }

    if (!formData.ciudad) {
      newErrors.ciudad = 'Ingresa la ciudad';
    }

    if (!formData.parroquia) {
      newErrors.parroquia = 'Ingresa la parroquia';
    }

    if (!formData.direccion) {
      newErrors.direccion = 'Ingresa la dirección';
    }

    if (!formData.codigo_huella) {
      newErrors.codigo_huella = 'Ingresa el código de huella';
    }

    if (!formData.celular || formData.celular.length !== 10) {
      newErrors.celular = 'El celular debe tener 10 dígitos';
    }

    if (!formData.correo || !formData.correo.includes('@')) {
      newErrors.correo = 'Ingresa un correo válido';
    }

    if (!formData.fecha_inicio_actividades) {
      newErrors.fecha_inicio_actividades = 'Ingresa la fecha de inicio de actividades';
    }

    if (!formData.actividad_economica) {
      newErrors.actividad_economica = 'Ingresa la actividad económica';
    }

    if (!archivos.cedula_frontal) {
      newErrors.cedula_frontal = 'Sube la foto frontal de la cédula';
    }

    if (!archivos.cedula_atras) {
      newErrors.cedula_atras = 'Sube la foto trasera de la cédula';
    }

    if (!archivos.selfie) {
      newErrors.selfie = 'Sube una selfie';
    }

    if (!archivos.comprobante_pago) {
      newErrors.comprobante_pago = 'Sube el comprobante de pago';
    }

    if (!formData.tipo_banco) {
      newErrors.tipo_banco = 'Selecciona un banco';
    }

    if (!formData.codigo_cuen) {
      newErrors.codigo_cuen = 'Ingresa el código CUEN de la planilla de luz';
    }

    if (!formData.actividad_sri) {
      newErrors.actividad_sri = 'Selecciona una actividad del SRI';
    }

    if (!formData.antiguedad_solicitada) {
      newErrors.antiguedad_solicitada = 'Selecciona la antigüedad solicitada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const solicitud = await insertSolicitud({
        numero_cedula: formData.numero_cedula,
        provincia: formData.provincia,
        ciudad: formData.ciudad,
        parroquia: formData.parroquia,
        direccion: formData.direccion,
        codigo_huella: formData.codigo_huella,
        celular: formData.celular,
        correo: formData.correo,
        tipo_banco: formData.tipo_banco,
        fecha_inicio_actividades: formData.fecha_inicio_actividades,
        actividad_economica: formData.actividad_economica,
        codigo_cuen: formData.codigo_cuen,
        direccion_completa: formData.direccion_completa,
        lugar_referencia: formData.lugar_referencia,
        nombre_comercial: formData.nombre_comercial,
        actividad_sri: formData.actividad_sri,
        antiguedad_solicitada: formData.antiguedad_solicitada,
        estado_tramite: 'pendiente',
        correo_distribuidor: user?.email || null
      });

      console.log('📤 Iniciando subida de archivos...')
      
      try {
        console.log('📄 Subiendo cédula frontal...')
        const cedulaFrontal = await uploadFile(archivos.cedula_frontal, formData.numero_cedula, 'cedula_frontal')
        
        console.log('📄 Subiendo cédula trasera...')
        const cedulaAtras = await uploadFile(archivos.cedula_atras, formData.numero_cedula, 'cedula_atras')
        
        console.log('🤳 Subiendo selfie...')
        const selfie = await uploadFile(archivos.selfie, formData.numero_cedula, 'selfie')
        
        console.log('💰 Subiendo comprobante de pago...')
        const comprobante = await uploadFile(archivos.comprobante_pago, formData.numero_cedula, 'comprobante_pago')
        
        console.log('✅ Todos los archivos subidos exitosamente')

        const updates = {
          foto_cedula_frontal: cedulaFrontal.path,
          foto_cedula_atras: cedulaAtras.path,
          foto_selfie: selfie.path,
          comprobante_pago: comprobante.path
        };

        await updateSolicitud(solicitud.id, updates);
        
      } catch (uploadError) {
        console.error('❌ Error al subir archivos:', uploadError)
        throw new Error(`Error al subir archivos: ${uploadError.message}`)
      }

      setSuccess(true);
      
      setFormData({
        numero_cedula: '',
        nombres: '',
        apellidos: '',
        edad: '',
        nacionalidad: '',
        provincia: '',
        ciudad: '',
        parroquia: '',
        direccion: '',
        codigo_huella: '',
        celular: '',
        correo: '',
        fecha_inicio_actividades: '',
        actividad_economica: '',
        tipo_banco: ''
      });
      
      setArchivos({
        cedula_frontal: null,
        cedula_atras: null,
        selfie: null,
        comprobante_pago: null
      });

    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setErrors({ general: 'Error al enviar la solicitud. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-wrapper">
        <style>{localStyles}</style>
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">¡Solicitud Enviada Exitosamente!</h2>
          <p className="success-message">
            Tu solicitud de RUC con antigüedad ha sido procesada correctamente. 
            Te contactaremos pronto para continuar con el proceso de verificación 
            y entrega de tu RUC con antigüedad.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSuccess(false);
              setStep(1);
            }}
          >
            Gestionar Otro RUC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <style>{localStyles}</style>
      
      <div className="main-card">
        <div className="form-header">
          <h1 className="form-title">Solicitud de RUC con Antigüedad</h1>
          <p className="form-subtitle">Completa todos los campos requeridos para procesar tu RUC con antigüedad</p>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          {/* Barra de progreso */}
          <div className="progress-container" style={{ padding: '20px 30px', display: 'flex', justifyContent: 'center' }}>
            <div className="progress-steps" style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: '400px', width: '100%' }}>
              {[1,2,3,4,5,6].map((n) => (
                <div key={n} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="progress-step" style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: n <= step ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                    color: n <= step ? '#fff' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>{n}</div>
                  {n < 6 && (
                    <div className="progress-line" style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: n < step ? 'linear-gradient(90deg, #667eea, #764ba2)' : '#e5e7eb'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          {errors.general && (
            <div className="general-error">
              <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {errors.general}
            </div>
          )}

          {/* Paso 1: Validación de RUC y Información de Actividad Económica */}
          {step === 1 && (
          <div className="section step1-section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Validación de RUC y Actividad Económica</h3>
                <p className="section-description">Primero valida tu RUC y luego proporciona los datos de tu actividad comercial</p>
              </div>
            </div>
            
            {/* Validación de RUC */}
            <div className="step1-container" style={{ 
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              marginBottom: '24px',
              border: '2px solid #3b82f6',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  🔍
              </div>
                <h4 style={{ margin: '0', color: '#1e40af', fontSize: '18px', fontWeight: '700' }}>
                  Validación de RUC
                </h4>
              </div>
              
              <div className="validation-container">
                <div className="validation-field">
                  <label className="form-label">
                    Número de Cédula
                    <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="numero_cedula"
                    value={formData.numero_cedula}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ej: 1234567890"
                  maxLength="10"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  />
                  {errors.numero_cedula && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.numero_cedula}
                    </div>
                  )}
                </div>
                
                <div className="validation-button">
                  <button
                    type="button"
                    onClick={handleValidarRUC}
                    disabled={!formData.numero_cedula || formData.numero_cedula.length !== 10 || loadingRUC}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '42px'
                    }}
                  >
                    {loadingRUC ? (
                      <>
                        <svg className="loading-spinner" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validando...
                      </>
                    ) : (
                      '🔍 Validar RUC'
                    )}
                  </button>
                  {errors.ruc_validation && (
                    <div className="error-message" style={{ marginTop: '8px' }}>
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.ruc_validation}
                    </div>
                  )}
                </div>
              </div>

              {/* Mostrar datos del RUC si está validado */}
              {rucData && (
                <div className="step1-info-box" style={{ 
                  background: rucData.sin_ruc ? '#dbeafe' : '#ffffff', 
                  padding: '16px', 
                  borderRadius: '12px',
                  border: rucData.sin_ruc ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  marginTop: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg className="success-icon" fill="currentColor" viewBox="0 0 20 20" style={{ 
                      color: rucData.sin_ruc ? '#3b82f6' : '#10b981', 
                      width: '20px', 
                      height: '20px' 
                    }}>
                      {rucData.sin_ruc ? (
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      )}
                </svg>
                    <span style={{ 
                      color: rucData.sin_ruc ? '#92400e' : '#10b981', 
                      fontSize: '14px', 
                      fontWeight: '600' 
                    }}>
                      {rucData.sin_ruc ? '⚠️ Persona Sin RUC - Datos de Cédula' : 'RUC Validado Exitosamente - Datos del SRI'}
                    </span>
                  </div>
                  
                  {rucData.sin_ruc ? (
                    <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '16px', height: '16px', color: '#1e40af' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          <span style={{ fontWeight: '600', color: '#1e40af' }}>Información Personal</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div><strong>Cédula:</strong> {rucData.numero_ruc.slice(0, -3)}</div>
                          <div><strong>Estado:</strong> 
                            <span style={{ color: '#3b82f6', fontWeight: '600', marginLeft: '4px' }}>
                              SIN RUC
                            </span>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong>Nombre Completo:</strong> {rucData.nombres} {rucData.apellidos}
                          </div>
                </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                    {/* Información Principal */}
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd"/>
                        </svg>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>Información Principal</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div><strong>RUC:</strong> {rucData.numero_ruc}</div>
                          <div style={{ marginTop: '4px', fontSize: '12px' }}>
                            <strong>Razón Social:</strong> {rucData.razon_social}
                          </div>
                        </div>
                        <div>
                          <div><strong>Estado:</strong> 
                            <span style={{ 
                              color: rucData.estado_contribuyente_ruc === 'ACTIVO' ? '#10b981' : '#ef4444',
                              fontWeight: '600',
                              marginLeft: '4px'
                            }}>
                              {rucData.estado_contribuyente_ruc}
                            </span>
                          </div>
                          {/* Mostrar motivo de suspensión si está suspendido */}
                          {rucData.estado_contribuyente_ruc?.toUpperCase() === 'SUSPENDIDO' && rucData.motivo_cancelacion_suspension && (
                            <div style={{ marginTop: '4px', fontSize: '12px' }}>
                              <strong>Motivo:</strong> 
                              <span style={{ 
                                color: (rucData.motivo_cancelacion_suspension.toLowerCase().includes('depuracion') || 
                                       rucData.motivo_cancelacion_suspension.toLowerCase().includes('cese')) ? '#ef4444' : '#d97706',
                                fontWeight: '600',
                                marginLeft: '4px'
                              }}>
                                {rucData.motivo_cancelacion_suspension}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información Tributaria */}
                    {(rucData.tipo_contribuyente || rucData.regimen || rucData.categoria) && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '16px', height: '16px', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                          </svg>
                          <span style={{ fontWeight: '600', color: '#92400e' }}>Información Tributaria</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {rucData.tipo_contribuyente && rucData.tipo_contribuyente !== 'N/A' && (
                            <div><strong>Tipo:</strong> {rucData.tipo_contribuyente}</div>
                          )}
                          {rucData.regimen && rucData.regimen !== 'N/A' && (
                            <div><strong>Régimen:</strong> {rucData.regimen}</div>
                          )}
                          {rucData.categoria && rucData.categoria !== 'N/A' && (
                            <div><strong>Categoría:</strong> {rucData.categoria}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fechas Importantes */}
                    {(rucData.fecha_inicio_actividades || rucData.fecha_cese || rucData.fecha_reinicio_actividades || rucData.fecha_actualizacion) && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '16px', height: '16px', color: '#0284c7' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          <span style={{ fontWeight: '600', color: '#0c4a6e' }}>Fechas Importantes</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {rucData.fecha_inicio_actividades && (
                            <div><strong>Inicio Actividades:</strong> {formatearFechaLegible(rucData.fecha_inicio_actividades)}</div>
                          )}
                          {rucData.fecha_cese && (
                            <div><strong>Fecha Cese:</strong> {formatearFechaLegible(rucData.fecha_cese)}</div>
                          )}
                          {rucData.fecha_reinicio_actividades && (
                            <div><strong>Fecha Reinicio:</strong> {formatearFechaLegible(rucData.fecha_reinicio_actividades)}</div>
                          )}
                          {rucData.fecha_actualizacion && (
                            <div><strong>Última Actualización:</strong> {formatearFechaLegible(rucData.fecha_actualizacion)}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actividad Económica */}
                    {rucData.actividad_economica_principal && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '16px', height: '16px', color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                          <span style={{ fontWeight: '600', color: '#14532d' }}>Actividad Económica Principal</span>
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#166534' }}>
                          {rucData.actividad_economica_principal}
                        </div>
                      </div>
                    )}

                    {/* Representantes Legales */}
                    {rucData.representantes_legales && rucData.representantes_legales.length > 0 && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #f87171' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '16px', height: '16px', color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                          </svg>
                          <span style={{ fontWeight: '600', color: '#991b1b' }}>Representantes Legales</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {rucData.representantes_legales.map((rep, index) => (
                            <div key={index} style={{ padding: '6px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #fecaca' }}>
                              <div style={{ fontWeight: '500', color: '#7f1d1d' }}>{rep.nombre}</div>
                              <div style={{ fontSize: '11px', color: '#991b1b' }}>ID: {rep.identificacion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Establecimientos */}
                    {rucData.establecimientos && rucData.establecimientos.length > 0 && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #c084fc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '16px', height: '16px', color: '#9333ea' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <span style={{ fontWeight: '600', color: '#581c87' }}>Establecimientos ({rucData.establecimientos.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {rucData.establecimientos.slice(0, 3).map((est, index) => (
                            <div key={index} style={{ padding: '6px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e9d5ff' }}>
                              <div style={{ fontWeight: '500', color: '#581c87' }}>{est.nombreFantasiaComercial}</div>
                              <div style={{ fontSize: '11px', color: '#7c3aed' }}>
                                {est.tipoEstablecimiento} • {est.estado}
                                {est.matriz === 'SI' && <span style={{ marginLeft: '8px', fontWeight: '600' }}>🏢 MATRIZ</span>}
                              </div>
                            </div>
                          ))}
                          {rucData.establecimientos.length > 3 && (
                            <div style={{ padding: '6px', backgroundColor: '#f3e8ff', borderRadius: '4px', textAlign: 'center', fontSize: '12px', color: '#7c3aed', fontStyle: 'italic' }}>
                              ... y {rucData.establecimientos.length - 3} establecimientos más
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
            </div>

            {/* Aviso Importante - Siempre visible */}
            {rucData && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: rucData.estado_contribuyente_ruc?.toUpperCase() === 'ACTIVO' ? '#fef2f2' : '#dbeafe', 
                borderRadius: '8px', 
                border: rucData.estado_contribuyente_ruc?.toUpperCase() === 'ACTIVO' ? '1px solid #f87171' : '1px solid #3b82f6',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg style={{ 
                    width: '16px', 
                    height: '16px', 
                    color: rucData.estado_contribuyente_ruc?.toUpperCase() === 'ACTIVO' ? '#dc2626' : '#3b82f6' 
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span style={{ 
                    fontWeight: '600', 
                    color: rucData.estado_contribuyente_ruc?.toUpperCase() === 'ACTIVO' ? '#991b1b' : '#1e40af' 
                  }}>Importante</span>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: rucData.estado_contribuyente_ruc?.toUpperCase() === 'ACTIVO' ? '#991b1b' : '#1e40af', 
                  lineHeight: '1.4' 
                }}>
                  {obtenerMensajeEstado()}
                </div>
              </div>
            )}

            {/* Selección de Tipo de RUC con Antigüedad */}
            <div className="step1-container" style={{ 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              marginBottom: '24px',
              border: '2px solid #bae6fd',
              boxShadow: '0 8px 25px rgba(14, 165, 233, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  📋
                </div>
                <h4 style={{ margin: '0', color: '#0369a1', fontSize: '18px', fontWeight: '700' }}>
                  Tipo de tramite
                </h4>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                  {rucData ? 'Tipo de trámite seleccionado automáticamente:' : 'Selecciona el tipo de trámite que necesitas realizar:'}
                </p>
              </div>

              <div className="tipo-tramite-container" style={{ 
                display: 'flex', 
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: '8px'
              }}>
                {/* Primera Vez */}
                <div 
                  style={{
                    background: formData.tipo_ruc_antiguedad === 'primera_vez' ? '#dbeafe' : '#ffffff',
                    border: formData.tipo_ruc_antiguedad === 'primera_vez' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: formData.tipo_ruc_antiguedad === 'primera_vez' ? '20px' : '16px',
                    cursor: rucData ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.tipo_ruc_antiguedad === 'primera_vez' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: formData.tipo_ruc_antiguedad === 'primera_vez' ? 'scale(1)' : 'scale(0.95)',
                    filter: formData.tipo_ruc_antiguedad === 'primera_vez' ? 'none' : 'grayscale(100%)',
                    opacity: rucData && formData.tipo_ruc_antiguedad !== 'primera_vez' ? '0.5' : (formData.tipo_ruc_antiguedad === 'primera_vez' ? '1' : '0.7'),
                    width: '180px',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={rucData ? undefined : () => handleInputChange({ target: { name: 'tipo_ruc_antiguedad', value: 'primera_vez' } })}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: formData.tipo_ruc_antiguedad === 'primera_vez' ? '#3b82f6' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    marginBottom: '12px'
                  }}>
                    🆕
                    </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: formData.tipo_ruc_antiguedad === 'primera_vez' ? '#1e40af' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Primera Vez
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                    Solicitud inicial de RUC con antigüedad para personas que nunca han tenido RUC.
                  </p>
                  <div style={{
                    background: formData.tipo_ruc_antiguedad === 'primera_vez' ? '#3b82f6' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    $45
                  </div>
                  <div style={{
                    marginTop: '6px',
                    background: '#10b981',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⏱</span>
                    <span>3 horas</span>
                  </div>
              </div>

                {/* Reactivación por Cese */}
                <div 
                  style={{
                    background: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '#dbeafe' : '#ffffff',
                    border: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '20px' : '16px',
                    cursor: rucData ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? 'scale(1)' : 'scale(0.95)',
                    filter: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? 'none' : 'grayscale(100%)',
                    opacity: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '1' : '0.7',
                    width: '180px',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={rucData ? undefined : () => handleInputChange({ target: { name: 'tipo_ruc_antiguedad', value: 'reactivacion_cese' } })}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '#3b82f6' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    marginBottom: '12px'
                  }}>
                    🔄
                  </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '#1e40af' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Reactivación por Cese
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                    Reactivación de RUC que fue dado de baja por cese de actividades.
                  </p>
                  <div style={{
                    background: formData.tipo_ruc_antiguedad === 'reactivacion_cese' ? '#3b82f6' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    $60
                  </div>
                  <div style={{
                    marginTop: '6px',
                    background: '#10b981',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⏱</span>
                    <span>3 horas</span>
                  </div>
                </div>

                {/* Reactivación por Depuración */}
                <div 
                  style={{
                    background: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '#dbeafe' : '#ffffff',
                    border: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '20px' : '16px',
                    cursor: rucData ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? 'scale(1)' : 'scale(0.95)',
                    filter: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? 'none' : 'grayscale(100%)',
                    opacity: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '1' : '0.7',
                    width: '180px',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={rucData ? undefined : () => handleInputChange({ target: { name: 'tipo_ruc_antiguedad', value: 'reactivacion_depuracion' } })}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '#3b82f6' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    marginBottom: '12px'
                  }}>
                    🧹
                  </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '#1e40af' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Reactivación por Depuración
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                    Reactivación de RUC que fue suspendido por procesos de depuración.
                  </p>
                  <div style={{
                    background: formData.tipo_ruc_antiguedad === 'reactivacion_depuracion' ? '#3b82f6' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    $80
                  </div>
                  <div style={{
                    marginTop: '6px',
                    background: '#10b981',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⏱</span>
                    <span>3 horas</span>
                  </div>
                </div>

                {/* Retroactividad para RUC Activo - NO DISPONIBLE */}
                <div 
                  style={{
                    background: '#f3f4f6',
                    border: '2px solid #d1d5db',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: 'scale(0.95)',
                    filter: 'grayscale(100%)',
                    opacity: '0.5',
                    width: '180px',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    marginBottom: '12px'
                  }}>
                    ⏰
                  </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Retroactividad para RUC Activo
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#9ca3af', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                    Solicitud de antigüedad para RUC que está actualmente activo.
                  </p>
                  <div style={{
                    background: '#9ca3af',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    $300
                  </div>
                  
                  {/* Badge NO DISPONIBLE */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    NO DISPONIBLE
                  </div>
                </div>
              </div>

              {errors.tipo_ruc_antiguedad && (
                <div className="error-message" style={{ marginTop: '12px' }}>
                  <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.tipo_ruc_antiguedad}
                </div>
              )}
            </div>

            {/* Promociones por Apertura de RUC */}
            <div className="step1-container" style={{ 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              marginBottom: '24px',
              border: '2px solid #f59e0b',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  🎉
                </div>
                <h4 style={{ margin: '0', color: '#92400e', fontSize: '18px', fontWeight: '700' }}>
                  Servicios complementarios con la apertura de tu RUC con antiguedad
                </h4>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0', color: '#92400e', fontSize: '14px', lineHeight: '1.5', fontWeight: '600' }}>
                  ¡Aprovecha estos servicios adicionales con precios especiales de apertura! escoge los servicios adiciconales que necesites.
                </p>
              </div>

              <div className="servicios-complementarios-container" style={{ 
                display: 'flex', 
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: '8px'
              }}>
                {/* Firma Electrónica */}
                <div 
                  style={{
                    background: formData.complementos?.includes('firma_electronica') ? '#fef3c7' : '#ffffff',
                    border: formData.complementos?.includes('firma_electronica') ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: formData.complementos?.includes('firma_electronica') ? '20px' : '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.complementos?.includes('firma_electronica') ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: formData.complementos?.includes('firma_electronica') ? 'scale(1)' : 'scale(0.95)',
                    filter: formData.complementos?.includes('firma_electronica') ? 'none' : 'grayscale(100%)',
                    opacity: formData.complementos?.includes('firma_electronica') ? '1' : '0.7',
                    width: '200px',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={() => {
                    const complementos = formData.complementos || [];
                    const nuevoComplementos = complementos.includes('firma_electronica') 
                      ? complementos.filter(c => c !== 'firma_electronica')
                      : [...complementos, 'firma_electronica'];
                    handleInputChange({ target: { name: 'complementos', value: nuevoComplementos } });
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: formData.complementos?.includes('firma_electronica') ? '#f59e0b' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: 'white', fontSize: '16px' }}>🔐</span>
                  </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: formData.complementos?.includes('firma_electronica') ? '#92400e' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Firma Electrónica
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                     Válida por 1 año con validez legal y autorizada para facturacion electronica
                  </p>
                  <div style={{
                    background: formData.complementos?.includes('firma_electronica') ? '#f59e0b' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>
                    $8.00
                  </div>
                  <div style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⏱</span>
                    <span>30 minutos</span>
                  </div>
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '2px'
                  }}>
                    PROMO
                  </div>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '10px',
                    textDecoration: 'line-through'
                  }}>
                    Normal: $18.50
                  </div>
                </div>

                {/* Declaraciones */}
                <div 
                  style={{
                    background: formData.complementos?.includes('declaraciones') ? '#fef3c7' : '#ffffff',
                    border: formData.complementos?.includes('declaraciones') ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: formData.complementos?.includes('declaraciones') ? '20px' : '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.complementos?.includes('declaraciones') ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: formData.complementos?.includes('declaraciones') ? 'scale(1)' : 'scale(0.95)',
                    filter: formData.complementos?.includes('declaraciones') ? 'none' : 'grayscale(100%)',
                    opacity: formData.complementos?.includes('declaraciones') ? '1' : '0.7',
                    width: '200px',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={() => {
                    const complementos = formData.complementos || [];
                    const nuevoComplementos = complementos.includes('declaraciones') 
                      ? complementos.filter(c => c !== 'declaraciones')
                      : [...complementos, 'declaraciones'];
                    handleInputChange({ target: { name: 'complementos', value: nuevoComplementos } });
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: formData.complementos?.includes('declaraciones') ? '#f59e0b' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: 'white', fontSize: '16px' }}>📄</span>
                  </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: formData.complementos?.includes('declaraciones') ? '#92400e' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Declaraciones
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                    Último impuesto a la renta y 3 últimas declaraciones de IVA para trámites bancarios
                  </p>
                  <div style={{
                    background: formData.complementos?.includes('declaraciones') ? '#f59e0b' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>
                    $15.00
                  </div>
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '2px'
                  }}>
                    PROMO
                  </div>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '10px',
                    textDecoration: 'line-through'
                  }}>
                    Normal: $30.00
                  </div>
                </div>

                {/* Reporte Equifax 360 */}
                <div 
                  style={{
                    background: formData.complementos?.includes('equifax') ? '#fef3c7' : '#ffffff',
                    border: formData.complementos?.includes('equifax') ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: formData.complementos?.includes('equifax') ? '20px' : '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: formData.complementos?.includes('equifax') ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: formData.complementos?.includes('equifax') ? 'scale(1)' : 'scale(0.95)',
                    filter: formData.complementos?.includes('equifax') ? 'none' : 'grayscale(100%)',
                    opacity: formData.complementos?.includes('equifax') ? '1' : '0.7',
                    width: '200px',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onClick={() => {
                    const complementos = formData.complementos || [];
                    const nuevoComplementos = complementos.includes('equifax') 
                      ? complementos.filter(c => c !== 'equifax')
                      : [...complementos, 'equifax'];
                    handleInputChange({ target: { name: 'complementos', value: nuevoComplementos } });
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: formData.complementos?.includes('equifax') ? '#f59e0b' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: 'white', fontSize: '16px' }}>📊</span>
                  </div>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: formData.complementos?.includes('equifax') ? '#92400e' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Reporte Equifax 360
                  </h5>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '11px', 
                    lineHeight: '1.3' 
                  }}>
                    Reporte crediticio completo para evaluación financiera y trámites bancarios
                  </p>
                  <div style={{
                    background: formData.complementos?.includes('equifax') ? '#f59e0b' : '#6b7280',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>
                    $5.00
                  </div>
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '2px'
                  }}>
                    PROMO
                  </div>
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '10px',
                    textDecoration: 'line-through'
                  }}>
                    Normal: $8.00
                  </div>
                </div>
              </div>
            </div>

            {/* Información de precio */}
            <div className="step1-container" style={{ 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              marginTop: '24px',
              border: '2px solid #bae6fd',
              boxShadow: '0 8px 25px rgba(14, 165, 233, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  💰
                </div>
                <h4 style={{ margin: '0', color: '#0369a1', fontSize: '18px', fontWeight: '700' }}>
                  Costo del Servicio
                </h4>
              </div>
              <div style={{ 
                background: '#ffffff', 
                padding: '16px', 
                borderRadius: '12px',
                border: '1px solid #e0f2fe'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#374151', fontSize: '15px', fontWeight: '500' }}>
                    Servicio de RUC con Antigüedad
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1' }}>
                    ${obtenerPrecioRUC().toFixed(2)}
                  </span>
                </div>
                
                {/* Complementos seleccionados */}
                {formData.complementos && formData.complementos.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {formData.complementos.includes('firma_electronica') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                          + Firma Electrónica (1 año)
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          $8.00
                        </span>
                      </div>
                    )}
                    {formData.complementos.includes('declaraciones') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                          + Declaraciones (IVA + Renta)
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          $15.00
                        </span>
                      </div>
                    )}
                    {formData.complementos.includes('equifax') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                          + Reporte Equifax 360
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          $5.00
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Total */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#111827', fontSize: '16px', fontWeight: '700' }}>
                    Total
                  </span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#0369a1' }}>
                    ${obtenerPrecioTotal().toFixed(2)}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  textAlign: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid #e5e7eb',
                  marginTop: '8px'
                }}>
                  <div style={{ marginBottom: '4px', fontWeight: '600' }}>Incluye:</div>
                  <div>• Certificado de RUC</div>
                  <div>• Certificado de establecimiento registrado</div>
                  <div>• Usuario y clave del SRI</div>
                  <div>• Gestión y soporte completo</div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Paso 2: Datos del Solicitante - Ya cargados */}
          {step === 2 && (
          <div className="section step2-section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Datos del Solicitante</h3>
                <p className="section-description">Verifica y completa los datos obtenidos</p>
              </div>
            </div>

            {/* Información de la cédula consultada */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>
                  📋
                </div>
                <h4 style={{ margin: '0', color: '#1e40af', fontSize: '16px', fontWeight: '700' }}>
                  Datos Consultados
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                  Cédula consultada:
                </span>
                <span style={{ 
                  background: '#3b82f6', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  {formData.numero_cedula}
                </span>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nombres</label>
                <div className="api-data-display">
                  <span className="api-data-text">{formData.nombres || 'No disponible'}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Apellidos</label>
                <div className="api-data-display">
                  <span className="api-data-text">{formData.apellidos || 'No disponible'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Edad</label>
                <div className="api-data-display">
                  <span className="api-data-text">{formData.edad ? `${formData.edad} años` : 'No disponible'}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Género</label>
                <div className="api-data-display">
                  <span className="api-data-text">{formData.genero || 'No disponible'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nacionalidad</label>
                <div className="api-data-display">
                  <span className="api-data-text">{formData.nacionalidad || 'No disponible'}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">RUC</label>
                <div className="ruc-display" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                   <div className="api-data-display" style={{ flex: 1 }}>
                     <span className="api-data-text">{formData.ruc || 'No disponible'}</span>
                   </div>
                   {formData.ruc && (
                     <div className="api-data-display validation-valid" style={{ flex: 'none', minWidth: 'fit-content' }}>
                       <span className="api-data-text" style={{ fontSize: '13px', fontWeight: '600' }}>
                         RUC generado automáticamente
                       </span>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {/* Campo de código de huella */}
            <div className="grid grid-1" style={{ marginTop: '24px' }}>
              <div className="form-group">
                <label className="form-label">
                  Código de Huella
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="codigo_huella"
                  value={formData.codigo_huella}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    handleInputChange({ target: { name: 'codigo_huella', value } });
                  }}
                  className="form-input"
                  placeholder="Código de huella dactilar"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.codigo_huella && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.codigo_huella}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Paso 3: Contacto */}
          {step === 3 && (
          <div className="section step3-section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              <div>
                <h3 className="section-title">Información de Contacto</h3>
                <p className="section-description">Datos donde llegaran las notificaciones y actualizaciones de tu tramite</p>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Celular
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ingresa tu número de celular"
                  maxLength="10"
                />
                {errors.celular && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.celular}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Correo Electrónico
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ingresa tu correo electrónico"
                />
                {errors.correo && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.correo}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Paso 3: Dirección */}
          {step === 3 && (
          <div className="section step3-section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Dirección de Residencia</h3>
                <p className="section-description">Información de tu direccion domiciliaria, datos cargados del Registro Civil.</p>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Provincia
                  <span className="required-asterisk">*</span>
                </label>
                <select
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Selecciona una provincia</option>
                  {provincias.map(provincia => (
                    <option key={provincia} value={provincia}>{provincia.toUpperCase()}</option>
                  ))}
                </select>
                {errors.provincia && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.provincia}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Ciudad
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ingresa tu ciudad"
                />
                {errors.ciudad && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.ciudad}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Parroquia
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="parroquia"
                  value={formData.parroquia}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ingresa tu parroquia"
                />
                {errors.parroquia && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.parroquia}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Dirección Completa
                  <span className="required-asterisk">*</span>
                </label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Ingresa tu dirección completa (calle, número, referencias)"
                  rows="1"
                />
                {errors.direccion && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.direccion}
                  </div>
                )}
              </div>
            </div>

            {/* Dirección Comercial que Reflejará en el SRI */}
            <div className="section direccion-comercial" style={{ marginLeft: '-10px' }}>
              <div className="section-header">
                <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                </svg>
                <div>
                  <h3 className="section-title">Dirección Comercial que Reflejará en el SRI</h3>
                  <p className="section-description">Información comercial para el registro en el SRI</p>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Código CUEN de Planilla de Luz
                    <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="codigo_cuen"
                    value={formData.codigo_cuen}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleInputChange({ target: { name: 'codigo_cuen', value } });
                    }}
                    className="form-input"
                    placeholder="Código CUEN (10 dígitos)"
                    maxLength="10"
                    style={{ width: '200px' }}
                  />
                  {errors.codigo_cuen && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.codigo_cuen}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Nombre Comercial de tu Negocio (Opcional)
                  </label>
                  <input
                    type="text"
                    name="nombre_comercial"
                    value={formData.nombre_comercial}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      handleInputChange({ target: { name: 'nombre_comercial', value } });
                    }}
                    className="form-input"
                    placeholder="Ej: Supermercado El Ahorro"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.nombre_comercial && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.nombre_comercial}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Dirección Completa del Establecimiento (Opcional)
                  </label>
                  <textarea
                    name="direccion_completa"
                    value={formData.direccion_completa}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      handleInputChange({ target: { name: 'direccion_completa', value } });
                    }}
                    className="form-textarea"
                    placeholder="Ej: Av. Principal 123, Centro"
                    rows="2"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.direccion_completa && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.direccion_completa}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Lugar de Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    name="lugar_referencia"
                    value={formData.lugar_referencia}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      handleInputChange({ target: { name: 'lugar_referencia', value } });
                    }}
                    className="form-input"
                    placeholder="Ej: Frente al parque"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.lugar_referencia && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.lugar_referencia}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Paso 4: Información del Negocio */}
          {step === 4 && (
          <div className="section step4-section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Información del Negocio</h3>
                <p className="section-description">Datos específicos de tu actividad comercial</p>
              </div>
            </div>


            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Actividad Económica del SRI
                  <span className="required-asterisk">*</span>
                </label>
                <select
                  name="actividad_sri"
                  value={formData.actividad_sri}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Selecciona una actividad</option>
                  {actividadesSRI.map(actividad => (
                    <option key={actividad} value={actividad}>{actividad}</option>
                  ))}
                </select>
                {errors.actividad_sri && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.actividad_sri}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Antigüedad Solicitada del RUC
                  <span className="required-asterisk">*</span>
                </label>
                <select
                  name="antiguedad_solicitada"
                  value={formData.antiguedad_solicitada}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Selecciona la antigüedad</option>
                  {antiguedadesRUC.map(antiguedad => (
                    <option key={antiguedad} value={antiguedad}>{antiguedad}</option>
                  ))}
                </select>
                {errors.antiguedad_solicitada && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.antiguedad_solicitada}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Paso 5: Documentos */}
          {step === 5 && (
          <div className="section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Documentos Requeridos</h3>
                <p className="section-description">Sube los documentos necesarios para la verificación</p>
              </div>
            </div>

            <div className="grid docs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Cédula Frontal <span className="required-asterisk">*</span></label>
                <FileUpload
                  onFileSelect={(file) => handleFileChange('cedula_frontal', file)}
                  selectedFile={archivos.cedula_frontal}
                  accept="image/*"
                  placeholder="Sube la foto frontal de tu cédula"
                />
                {errors.cedula_frontal && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.cedula_frontal}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Cédula Trasera <span className="required-asterisk">*</span></label>
                <FileUpload
                  onFileSelect={(file) => handleFileChange('cedula_atras', file)}
                  selectedFile={archivos.cedula_atras}
                  accept="image/*"
                  placeholder="Sube la foto trasera de tu cédula"
                />
                {errors.cedula_atras && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.cedula_atras}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Selfie con Cédula <span className="required-asterisk">*</span></label>
                <FileUpload
                  onFileSelect={(file) => handleFileChange('selfie', file)}
                  selectedFile={archivos.selfie}
                  accept="image/*"
                  placeholder="Sube una selfie sosteniendo tu cédula"
                />
                {errors.selfie && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.selfie}
                  </div>
                )}
              </div>
            </div>

            {/* Información del Solicitante */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              padding: '20px', 
              borderRadius: '12px', 
              marginTop: '24px',
              border: '2px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  👤
                </div>
                <h4 style={{ margin: '0', color: '#065f46', fontSize: '18px', fontWeight: '700' }}>
                  Información del Solicitante
                </h4>
              </div>
              <div style={{ 
                background: '#ffffff', 
                padding: '16px', 
                borderRadius: '12px',
                border: '1px solid #d1fae5'
              }}>
                <div style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                    <strong style={{ color: '#065f46' }}>{formData.apellidos} {formData.nombres}</strong>
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <strong>Cédula:</strong> {formData.numero_cedula} | <strong>RUC:</strong> {formData.ruc} | <strong>Edad:</strong> {formData.edad} años | <strong>Género:</strong> {formData.genero}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Paso 6: Pago y Envío */}
          {step === 6 && (
          <div className="section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Información de Pago</h3>
                <p className="section-description">Selecciona tu banco y sube el comprobante</p>
              </div>
            </div>

            <div className="grid grid-2">
              {/* Lado izquierdo - Campos del usuario */}
              <div>
                <div className="form-group">
                  <label className="form-label">
                    Banco
                    <span className="required-asterisk">*</span>
                  </label>
                  <select
                    name="tipo_banco"
                    value={formData.tipo_banco}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Selecciona tu banco</option>
                    {bancos.map(banco => (
                      <option key={banco} value={banco}>{banco}</option>
                    ))}
                  </select>
                  {errors.tipo_banco && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.tipo_banco}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Comprobante de Pago
                    <span className="required-asterisk">*</span>
                  </label>
                  <FileUpload
                    onFileSelect={(file) => handleFileChange('comprobante_pago', file)}
                    selectedFile={archivos.comprobante_pago}
                    accept=".pdf,.jpg,.jpeg,.png"
                    placeholder="Sube el comprobante de pago"
                  />
                  {errors.comprobante_pago && (
                    <div className="error-message">
                      <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.comprobante_pago}
                    </div>
                  )}
                </div>
              </div>

              {/* Lado derecho - Datos bancarios de la empresa */}
              <div>
                <div style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                  borderRadius: '12px', 
                  border: '1px solid #bae6fd',
                  height: 'fit-content'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '18px' }}>🏦</div>
                    <h4 style={{ margin: '0', color: '#0369a1', fontSize: '16px', fontWeight: '700' }}>
                      Datos Bancarios para el Pago
                    </h4>
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#1e40af', fontSize: '16px' }}>PRODUBANCO</strong>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>CUENTA:</strong> 27059110924
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>TITULAR:</strong> FIRMAFACIL SAS
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>RUC:</strong> 0993391174001
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0f2fe' }}>
                      <strong>CORREO:</strong> contabilidad.ecucontable@gmail.com
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {formData.fecha_inicio_actividades && formData.actividad_economica && (
              <div style={{ 
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                padding: '24px', 
                borderRadius: '16px', 
                marginTop: '24px',
                border: '2px solid #bae6fd',
                boxShadow: '0 8px 25px rgba(14, 165, 233, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: '700'
                  }}>
                    💳
                  </div>
                  <h4 style={{ margin: '0', color: '#0369a1', fontSize: '18px', fontWeight: '700' }}>
                    Resumen de Pago
                  </h4>
                </div>
                <div className="payment-summary" style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  borderRadius: '12px',
                  border: '1px solid #e0f2fe'
                }}>
                  <div className="row-ruc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#374151', fontSize: '15px', fontWeight: '500' }}>
                      Servicio de RUC con Antigüedad
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1' }}>
                      ${obtenerPrecioRUC().toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Complementos seleccionados */}
                  {formData.complementos && formData.complementos.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      {formData.complementos.includes('firma_electronica') && (
                        <div className="row-firma" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                            + Firma Electrónica (1 año)
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                            $8.00
                          </span>
                        </div>
                      )}
                      {formData.complementos.includes('declaraciones') && (
                        <div className="row-declaraciones" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                            + Declaraciones (IVA + Renta)
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                            $15.00
                          </span>
                        </div>
                      )}
                      {formData.complementos.includes('equifax') && (
                        <div className="row-equifax" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}>
                            + Reporte Equifax 360
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                            $5.00
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Total */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb',
                    marginTop: '8px'
                  }}>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: '700' }}>
                      Total
                    </span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#0369a1' }}>
                      ${obtenerPrecioTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b', 
                    textAlign: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb',
                    marginTop: '8px'
                  }}>
                    <div style={{ marginBottom: '4px', fontWeight: '600' }}>Incluye:</div>
                    <div>• Certificado de RUC</div>
                    <div>• Certificado de establecimiento registrado</div>
                    <div>• Usuario y clave del SRI</div>
                    <div>• Gestión y soporte completo</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Navegación y envío */}
          <div className="submit-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <button type="button" className="btn" onClick={goBack} disabled={step === 1 || loading}>
                Anterior
              </button>
              {step < totalSteps ? (
                <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canGoNext() || loading}>
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={loading || !formData.tipo_banco || !archivos.comprobante_pago}
                >
                  {loading ? (
                    <div className="loading">
                      <div className="spinner"></div>
                      Procesando Solicitud...
                    </div>
                  ) : (
                    <>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Enviar Solicitud
                    </>
                  )}
                </button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
              {step < totalSteps ? 'Completa los campos para continuar al siguiente paso' : 'Al enviar confirmas que la información es correcta'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioRUC;