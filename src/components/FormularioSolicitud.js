import React, { useEffect, useState } from 'react';
import FileUpload from './FileUpload';
import { insertSolicitud, uploadFile, updateSolicitud, consultarCedula } from '../lib/supabase';

const FormularioSolicitud = ({ onBack, user, onServiceSelect }) => {
  // Estilos minimalistas y neutros
  const localStyles = `
    .form-wrapper {
      max-width: 1000px;
      margin: 8px auto 0 auto;
      padding: 0 24px;
      background: #f6f7fb;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    
    @media (max-width: 768px) {
      .form-wrapper {
        padding: 0 8px;
        margin: 8px auto 0 auto;
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
    
    @media (max-width: 768px) {
      .main-card {
        border-radius: 12px;
        margin: 0;
      }
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
    
    @media (max-width: 768px) {
      .section {
        padding: 16px 20px;
      }
      .section.pricing-section-wrapper {
        padding: 16px 20px 16px 8px;
      }
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
    @media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } .form-wrapper { padding: 0; } }

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
    
    @media (max-width: 768px) {
      .pricing-grid {
        justify-content: flex-start;
        margin-left: -32px;
        gap: 8px;
      }
      
  .pricing-section .section-header {
    margin-left: -48px;
  }
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
    @media (max-width: 768px) {
      .options-grid {
        justify-content: flex-start;
        margin-left: -32px;
      }
      
      .documents-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      
      .form-group {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.03);
        transition: all 0.2s ease;
      }
      
      .form-group:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border-color: #d1d5db;
      }
      
      .form-label {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
        display: block;
      }
      
      .document-info {
        font-size: 11px;
        color: #6b7280;
        margin-top: 6px;
        line-height: 1.4;
        font-style: italic;
      }
      
      .solicitante-info {
        padding: 16px !important;
        margin-top: 20px !important;
        border-radius: 16px !important;
      }
      
      .solicitante-info h4 {
        font-size: 16px !important;
      }
      
      .solicitante-info div {
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
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

    .submit-section { 
      background: #fafafa; 
      padding: 20px; 
      margin: 16px -24px -20px -24px; 
      text-align: center; 
      border-top: 1px solid #f3f4f6; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 10px; 
    }
    
    @media (max-width: 768px) {
      .submit-section {
        padding: 16px 20px;
        margin: 16px -20px -16px -20px;
      }
    }
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
    tipo_firma: 'natural',
    duracion_firma: '',
    tipo_banco: '',
    clave_firma: '',
    clave_firma_confirmacion: ''
  });

  const [archivos, setArchivos] = useState({
    cedula_frontal: null,
    cedula_atras: null,
    selfie: null,
    comprobante_pago: null
  });

  const [loading, setLoading] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Wizard por pasos
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const goNext = () => {
    setStep((s) => Math.min(totalSteps, s + 1));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };
  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Validación ligera por paso para navegación
  const canGoNext = () => {
    if (step === 1) {
      return !!formData.duracion_firma && !!formData.tipo_firma;
    }
    if (step === 2) {
      const cedulaOk = formData.numero_cedula && /^\d{10}$/.test(formData.numero_cedula);
      const huellaOk = !!formData.codigo_huella;
      const datosCargados = !!formData.nombres && !!formData.apellidos;
      return cedulaOk && huellaOk && datosCargados;
    }
    if (step === 3) {
      const provinciaOk = !!formData.provincia;
      const ciudadOk = !!formData.ciudad;
      const parroquiaOk = !!formData.parroquia;
      const direccionOk = !!formData.direccion;
      const celularOk = /^\d{10}$/.test(formData.celular || '');
      const correoOk = (formData.correo || '').includes('@') && (formData.correo || '').endsWith('.com');
      
      console.log('🔍 Validación paso 3:', {
        provincia: formData.provincia,
        ciudad: formData.ciudad,
        parroquia: formData.parroquia,
        direccion: formData.direccion,
        celular: formData.celular,
        correo: formData.correo,
        provinciaOk,
        ciudadOk,
        parroquiaOk,
        direccionOk,
        celularOk,
        correoOk,
        puedeContinuar: provinciaOk && ciudadOk && parroquiaOk && direccionOk && celularOk && correoOk
      });
      
      return provinciaOk && ciudadOk && parroquiaOk && direccionOk && celularOk && correoOk;
    }
    if (step === 4) {
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
            provincia: normalizarProvincia(resultado.data.provincia),
            ciudad: resultado.data.ciudad,
            parroquia: resultado.data.parroquia,
            direccion: resultado.data.direccion,
            edad: resultado.data.edad || '',
            genero: resultado.data.genero || '',
            ruc: ced + '001' // Generar RUC directamente
          }));
          
          console.log('📋 Datos cargados en formulario:', {
            provinciaOriginal: resultado.data.provincia,
            provinciaNormalizada: normalizarProvincia(resultado.data.provincia),
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

  const provincias = [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
    'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura',
    'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo',
    'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
    'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'
  ];

  const bancos = [
    'Banco Pichincha', 'Banco del Pacífico', 'Banco de Guayaquil',
    'Banco Internacional', 'Produbanco', 'Banco Bolivariano',
    'Banco General Rumiñahui', 'Banco ProCredit', 'Banco del Austro',
    'Banco Solidario', 'Banco Machala', 'Banco Capital',
    'Banco Comercial de Manabí', 'Banco Coopnacional'
  ];

  const opcionesPrecio = [
    { label: '7 DÍAS', value: '7 dias', price: 7.50, popular: false },
    { label: '15 DÍAS', value: '15 dias', price: 10.00, popular: false },
    { label: '30 DÍAS', value: '30 dias', price: 13.50, popular: false },
    { label: '6 MESES', value: '6 meses', price: 16.00, popular: false },
    { label: '1 AÑO', value: '1 año', price: 18.50, popular: true },
    { label: '2 AÑOS', value: '2 años', price: 27.50, popular: false },
    { label: '3 AÑOS', value: '3 años', price: 36.50, popular: false },
    { label: '4 AÑOS', value: '4 años', price: 46.50, popular: false },
    { label: '5 AÑOS', value: '5 años', price: 56.50, popular: false }
  ];

  // Función para determinar si la firma es válida para facturación electrónica
  const normalizarProvincia = (provinciaAPI) => {
    if (!provinciaAPI) return '';
    
    // Mapeo de nombres de provincias de la API a los nombres del select
    const mapeoProvincias = {
      'PICHINCHA': 'Pichincha',
      'GUAYAS': 'Guayas',
      'AZUAY': 'Azuay',
      'MANABI': 'Manabí',
      'EL ORO': 'El Oro',
      'LOJA': 'Loja',
      'TUNGURAHUA': 'Tungurahua',
      'CHIMBORAZO': 'Chimborazo',
      'COTOPAXI': 'Cotopaxi',
      'IMBABURA': 'Imbabura',
      'CARCHI': 'Carchi',
      'ESMERALDAS': 'Esmeraldas',
      'LOS RIOS': 'Los Ríos',
      'SANTA ELENA': 'Santa Elena',
      'SANTO DOMINGO': 'Santo Domingo de los Tsáchilas',
      'SANTO DOMINGO DE LOS TSACHILAS': 'Santo Domingo de los Tsáchilas',
      'MORONA SANTIAGO': 'Morona Santiago',
      'NAPO': 'Napo',
      'ORELLANA': 'Orellana',
      'PASTAZA': 'Pastaza',
      'SUCUMBIOS': 'Sucumbíos',
      'ZAMORA CHINCHIPE': 'Zamora Chinchipe',
      'GALAPAGOS': 'Galápagos',
      'CANAR': 'Cañar',
      'BOLIVAR': 'Bolívar'
    };
    
    const provinciaNormalizada = provinciaAPI.toUpperCase().trim();
    return mapeoProvincias[provinciaNormalizada] || provinciaAPI;
  };

  const esValidaParaFacturacion = () => {
    const duracionesValidas = ['1 año', '2 años', '3 años', '4 años', '5 años'];
    return duracionesValidas.includes(formData.duracion_firma);
  };

  const validarCorreo = (correo) => {
    if (!correo) return '';
    if (!correo.includes('@')) return 'El correo debe contener @';
    if (!correo.endsWith('.com')) return 'El correo debe terminar en .com';
    if (correo.length < 5) return 'El correo es muy corto';
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
    if (ced && ced.length !== 10 && !loadingCedula) {
      // Solo limpiar datos si la cédula no tiene 10 dígitos Y no se está cargando
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
        ruc: ''
      }));
    }
  }, [formData.numero_cedula, loadingCedula]);

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

    if (!formData.correo || !formData.correo.includes('@') || !formData.correo.endsWith('.com')) {
      newErrors.correo = 'Ingresa un correo válido que termine en .com';
    }

    if (!formData.tipo_firma) {
      newErrors.tipo_firma = 'Selecciona el tipo de firma';
    }

    if (!formData.duracion_firma) {
      newErrors.duracion_firma = 'Selecciona la duración';
    }

    // Se elimina validación de claves del flujo anterior

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
        tipo_firma: formData.tipo_firma,
        duracion_firma: formData.duracion_firma,
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
      
      // Scroll hacia arriba en móviles después del envío exitoso
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
      
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
        tipo_firma: '',
        duracion_firma: '',
        tipo_banco: '',
        clave_firma: '',
        clave_firma_confirmacion: ''
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
            Tu solicitud de firma electrónica ha sido procesada correctamente. 
            Te contactaremos pronto para continuar con el proceso de verificación 
            y entrega de tu certificado digital.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              style={{ 
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                minWidth: '140px'
              }}
              onClick={() => {
                setSuccess(false);
                setStep(1);
              }}
            >
              Nueva Firma
            </button>
            <button 
              className="btn"
              style={{ 
                background: '#059669', 
                color: '#ffffff', 
                border: '1px solid #047857',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                minWidth: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onClick={() => {
                // Navegar a la sección de consultar estado
                if (onServiceSelect) {
                  onServiceSelect('consultar-estado');
                } else {
                  // Fallback si no está disponible
                  setSuccess(false);
                  setStep(1);
                }
              }}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              Consultar Firma
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <style>{localStyles}</style>
      
      <div className="main-card">
        <div className="form-header">
          <h1 className="form-title">Solicitud de Firma Electrónica</h1>
          <p className="form-subtitle">Completa todos los campos requeridos para procesar tu certificado digital</p>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          {/* Barra de progreso */}
          <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: '400px', width: '100%' }}>
              {[1,2,3,4,5].map((n) => (
                <div key={n} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
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
                  {n < 5 && (
                    <div style={{
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

          {/* Paso 1: Tipo de firma y Precio */}
          {step === 1 && (
          <div className="section pricing-section-wrapper">
            {/* Tipo de Firma primero */}
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Tipo de Firma</h3>
                <p className="section-description">Selecciona el tipo de certificado que necesitas</p>
              </div>
            </div>
            
            <div className="options-grid" style={{ marginLeft: 0 }}>
              <div
                className={`option-card ${formData.tipo_firma === 'natural' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, tipo_firma: 'natural' }))}
              >
                <span className="option-label">Persona Natural</span>
              </div>
              <div
                className={`option-card ${formData.tipo_firma === 'juridica' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, tipo_firma: 'juridica' }))}
              >
                <span className="option-label">Persona Jurídica</span>
              </div>
            </div>
            {errors.tipo_firma && (
              <div className="error-message" style={{ marginTop: 6 }}>
                <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {errors.tipo_firma}
              </div>
            )}

            {/* Duración y Precio después */}
            <div className="pricing-section" style={{ marginTop: 24, marginLeft: 0 }}>
              <div className="section-header">
                <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
                </svg>
                <div>
                  <h3 className="section-title">Duración y Precio</h3>
                  <p className="section-description">Selecciona el periodo de validez de tu firma electrónica</p>
                </div>
              </div>
              
              <div className="pricing-grid">
                {opcionesPrecio.map(opcion => (
                  <div
                    key={opcion.value}
                    className={`price-card ${formData.duracion_firma === opcion.value ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, duracion_firma: opcion.value }))}
                  >
                    {opcion.popular && <span className="badge">Popular</span>}
                    <div className="price-title">{opcion.label}</div>
                    <div className="price-amount">${opcion.price}</div>
                    <div className="price-note">
                      {opcion.popular ? 'Mejor relación precio/valor' : 'Incluye soporte'}
                    </div>
                  </div>
                ))}
              </div>
              {errors.duracion_firma && (
                <div className="error-message">
                  <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {errors.duracion_firma}
                </div>
              )}
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

            {/* Consulta de cédula */}
            <div className="grid grid-1" style={{ marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">
                  Número de Cédula
                  <span className="required-asterisk">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="numero_cedula"
                    value={formData.numero_cedula}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="1234567890"
                    maxLength="10"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ marginTop: 8, alignSelf: 'flex-start' }} 
                  onClick={handleBuscarCedula}
                  disabled={loadingCedula}
                >
                  {loadingCedula ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(0,0,0,0.15)',
                        borderTop: '2px solid #111827',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Consultando...
                    </div>
                  ) : (
                    'Buscar'
                  )}
                </button>
                {errors.numero_cedula && (
                  <div className="error-message">
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {errors.numero_cedula}
                  </div>
                )}
              </div>
            </div>

            {/* Información de la cédula consultada */}
            {formData.numero_cedula && formData.nombres && (
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
            )}

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nombres</label>
                {formData.nombres ? (
                  <div className="api-data-display">
                    <span className="api-data-text">{formData.nombres}</span>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', color: '#6b7280', fontStyle: 'italic', fontSize: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    Ingresa tu cédula para cargar los datos
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Apellidos</label>
                {formData.apellidos ? (
                  <div className="api-data-display">
                    <span className="api-data-text">{formData.apellidos}</span>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', color: '#6b7280', fontStyle: 'italic', fontSize: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    Ingresa tu cédula para cargar los datos
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Edad</label>
                {formData.edad ? (
                  <div className="api-data-display">
                    <span className="api-data-text">{formData.edad} años</span>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', color: '#6b7280', fontStyle: 'italic', fontSize: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    Ingresa tu cédula para cargar los datos
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Género</label>
                {formData.genero ? (
                  <div className="api-data-display">
                    <span className="api-data-text">{formData.genero}</span>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', color: '#6b7280', fontStyle: 'italic', fontSize: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    Ingresa tu cédula para cargar los datos
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nacionalidad</label>
                {formData.nacionalidad ? (
                  <div className="api-data-display">
                    <span className="api-data-text">{formData.nacionalidad}</span>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', color: '#6b7280', fontStyle: 'italic', fontSize: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    Ingresa tu cédula para cargar los datos
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Facturación Electrónica</label>
                <div className={`api-data-display ${esValidaParaFacturacion() ? 'validation-valid' : 'validation-invalid'}`}>
                  <span className="api-data-text" style={{ fontSize: '14px', fontWeight: '600' }}>
                    {esValidaParaFacturacion() ? ' Aplica para facturación electrónica' : ' No aplica para facturación electrónica'}
                  </span>
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
          <div className="section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              <div>
                <h3 className="section-title">Información de Contacto</h3>
                <p className="section-description">Datos para comunicarnos contigo</p>
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
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                {formData.correo && validarCorreo(formData.correo) && (
                  <div className="error-message" style={{ marginTop: '8px' }}>
                    <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {validarCorreo(formData.correo)}
                  </div>
                )}
                {formData.correo && !validarCorreo(formData.correo) && (
                  <div style={{ marginTop: '8px', color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Correo válido
                  </div>
                )}
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
          <div className="section">
            <div className="section-header">
              <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="section-title">Dirección de Residencia</h3>
                <p className="section-description">Información de tu ubicación. Datos cargados del Registro Civil.</p>
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
          </div>
          )}

          {/* (Se elimina Configuración de Clave según flujo de 5 pasos) */}

          {/* Paso 4: Documentos */}
          {step === 4 && (
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

            {/* Aviso de Seguridad y Protección de Datos */}
            <div style={{ 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f59e0b',
              fontSize: '12px',
              color: '#92400e'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ marginTop: '1px', flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    🔒 Seguridad y Protección de Datos
                  </div>
                  <div style={{ lineHeight: '1.4' }}>
                    Tus datos y documentos están protegidos bajo estándares internacionales de seguridad. Utilizamos cifrado TLS de 256 bits para garantizar la confidencialidad de la información transmitida.
                    Cumplimos con la Ley Orgánica de Protección de Datos Personales del Ecuador y aplicamos estrictas medidas para evitar accesos no autorizados.
                    👉 La información proporcionada será utilizada únicamente para fines de verificación de identidad.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid documents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Cédula Frontal <span className="required-asterisk">*</span></label>
                <FileUpload
                  onFileSelect={(file) => handleFileChange('cedula_frontal', file)}
                  selectedFile={archivos.cedula_frontal}
                  accept="image/*"
                  placeholder="Sube la foto frontal de tu cédula"
                />
                <div className="document-info">
                   Foto clara del frente de tu cédula de identidad.
                </div>
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
                <div className="document-info">
                   Foto clara del reverso de tu cédula.
                </div>
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
                <div className="document-info">
                   Selfie sosteniendo tu cédula junto a tu rostro. Asegúrate de que tu cara y la cédula sean claramente visibles. No usar accesorios como gorras o lentes.
                </div>
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
            <div className="solicitante-info" style={{ 
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

          {/* Paso 5: Pago y Envío */}
          {step === 5 && (
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

                <div className="form-group documents-grid">
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
                  <div className="document-info">
                    Comprobante de transferencia o depósito bancario. Acepta PDF, JPG, PNG.
                  </div>
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

            {formData.duracion_firma && (
              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginTop: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    💳
                  </div>
                  <h4 style={{ margin: '0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                    Resumen de Pago
                  </h4>
                </div>
                
                <div style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                      Firma electrónica - {formData.duracion_firma}
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                      ${opcionesPrecio.find(o => o.value === formData.duracion_firma)?.price || 0}
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    paddingTop: '8px',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Precio incluye IVA
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    Incluye certificado digital .P12 y soporte técnico
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

export default FormularioSolicitud;