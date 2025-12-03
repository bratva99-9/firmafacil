import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Home from './Home';
import FormularioSolicitud from './FormularioSolicitud';
import FormularioRUC from './FormularioRUC';
import ConsultarEstado from './ConsultarEstado';
import ValidadorFirma from './ValidadorFirma';
import ConsultaPlacas from './ConsultaPlacas';
import ConsultaCedula from './ConsultaCedula';
import CorreosTool from './CorreosTool';
import InformeSuperCompanias from './InformeSuperCompanias';
import { supabase } from '../lib/supabase';
// import CreateUser from './CreateUser';

const MainContent = ({ activeService, onServiceSelect, user }) => {
  const localStyles = `
    .main-content {
      margin-left: 280px;
      min-height: calc(100vh - 80px);
      background: #f8fafc;
      padding-top: 0;
    }

    .content-wrapper {
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .service-header {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border-left: 4px solid #667eea;
    }

    .service-title {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .service-description {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
    }

    .coming-soon {
      background: white;
      border-radius: 16px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .coming-soon-icon {
      font-size: 64px;
      margin-bottom: 20px;
      display: block;
    }

    .coming-soon-title {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .coming-soon-description {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      max-width: 500px;
      margin: 0 auto 30px;
    }

    .security-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #065f46;
      padding: 12px 14px;
      border-radius: 10px;
      margin-top: 12px;
      box-shadow: 0 2px 8px rgba(6,95,70,0.06);
    }
    .security-banner .icon {
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
    }
    .security-banner .text {
      font-size: 13px;
      line-height: 1.5;
      font-weight: 600;
    }

    .back-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .back-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    /* Help Section Styles */
    .help-section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .help-section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* FAQ Styles */
    .faq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .faq-item {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }

    .faq-question {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }

    .faq-answer {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }

    /* Guides Styles */
    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .guide-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #bae6fd;
    }

    .guide-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .guide-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
    }

    .guide-steps {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      padding-left: 20px;
    }

    .guide-steps li {
      margin-bottom: 8px;
    }

    /* Contact Styles */
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .contact-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #bbf7d0;
    }

    .contact-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .contact-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 14px;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 4px;
    }

    .contact-description {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }

    /* Troubleshooting Styles */
    .troubleshooting-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .troubleshooting-item {
      background: #fef3c7;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #f59e0b;
    }

    .troubleshooting-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }

    .troubleshooting-solution {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .service-card {
      background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .service-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(17, 24, 39, 0.10);
      border-color: #c7d2fe;
    }

    .service-card.coming-soon-card {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .service-card.coming-soon-card:hover {
      transform: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border-color: transparent;
    }

    .service-card-icon {
      font-size: 36px;
      display: block;
    }

    .service-card-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }

    .service-card-description {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.45;
      margin: 0;
    }

    .service-card-status {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .service-card:not(.coming-soon-card) .service-card-status {
      background: #dcfce7;
      color: #166534;
    }

    .service-card.coming-soon-card .service-card-status {
      background: #fef3c7;
      color: #92400e;
    }

    .service-card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: auto;
    }

    .service-card-duration {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
      font-size: 11px;
      font-weight: 700;
    }

    .service-card-price {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #ecfdf5;
      color: #065f46;
      font-size: 11px;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }
      
      .content-wrapper {
        padding: 8px 4px;
      }
      
      .content-wrapper.full-width {
        padding: 4px 2px;
        max-width: 100%;
      }
      
      .service-header {
        padding: 16px 12px;
        margin-bottom: 16px;
        border-radius: 12px;
      }
      
      .service-title {
        font-size: 22px;
        margin-bottom: 6px;
      }
      
      .service-description {
        font-size: 14px;
      }
      
      .security-banner {
        padding: 10px 12px;
        margin-top: 10px;
        border-radius: 8px;
      }
      
      .security-banner .text {
        font-size: 12px;
      }

      .services-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 12px;
      }

      .service-card {
        padding: 16px;
        border-radius: 12px;
      }
      
      .service-card-icon {
        font-size: 32px;
      }
      
      .service-card-title {
        font-size: 16px;
      }
      
      .service-card-description {
        font-size: 12px;
      }
      
      .service-card-status {
        padding: 4px 8px;
        font-size: 10px;
      }
      
      .service-card-duration, .service-card-price {
        padding: 4px 8px;
        font-size: 10px;
      }
      
      .coming-soon {
        padding: 40px 20px;
        border-radius: 12px;
      }
      
      .coming-soon-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .coming-soon-title {
        font-size: 24px;
        margin-bottom: 10px;
      }
      
      .coming-soon-description {
        font-size: 14px;
        margin-bottom: 24px;
      }
      
      .back-button {
        padding: 10px 20px;
        font-size: 14px;
      }

      /* Help Section Mobile Styles */
      .help-section {
        padding: 20px 16px;
        margin-bottom: 20px;
        border-radius: 12px;
      }

      .help-section-title {
        font-size: 20px;
        margin-bottom: 16px;
      }

      .faq-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .faq-item {
        padding: 16px;
        border-radius: 10px;
      }

      .faq-question {
        font-size: 15px;
        margin-bottom: 8px;
      }

      .faq-answer {
        font-size: 13px;
      }

      .guides-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .guide-card {
        padding: 16px;
        border-radius: 10px;
      }

      .guide-icon {
        font-size: 28px;
        margin-bottom: 10px;
      }

      .guide-title {
        font-size: 16px;
        margin-bottom: 12px;
      }

      .guide-steps {
        font-size: 13px;
        padding-left: 16px;
      }

      .contact-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .contact-card {
        padding: 16px;
        border-radius: 10px;
      }

      .contact-icon {
        font-size: 28px;
        margin-bottom: 10px;
      }

      .contact-title {
        font-size: 14px;
        margin-bottom: 6px;
      }

      .contact-info {
        font-size: 13px;
        margin-bottom: 3px;
      }

      .contact-description {
        font-size: 11px;
      }

      .troubleshooting-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .troubleshooting-item {
        padding: 16px;
        border-radius: 10px;
      }

      .troubleshooting-title {
        font-size: 15px;
        margin-bottom: 8px;
      }

      .troubleshooting-solution {
        font-size: 13px;
      }
    }
  `;

  const renderServiceContent = () => {
    switch (activeService) {
      case 'home':
        return <Home onNavigate={onServiceSelect} />;
      
      case 'enviar-tramites':
        return (
          <div>
            <div className="service-header">
              <h1 className="service-title">Enviar Trámites</h1>
              <p className="service-description">
                Selecciona el servicio que necesitas y completa tu solicitud de forma rapida y segura.
              </p>
              <div className="security-banner">
                <span className="icon">🔒</span>
                <div className="text">
                Tus datos y documentos están protegidos bajo estándares internacionales de seguridad. Utilizamos cifrado TLS de 256 bits para garantizar la confidencialidad de la información transmitida.
                    Cumplimos con la Ley Orgánica de Protección de Datos Personales del Ecuador y aplicamos estrictas medidas para evitar accesos no autorizados.
                    👉 La información proporcionada será utilizada únicamente para fines de verificación de identidad.
                </div>
              </div>
            </div>
            <div className="services-grid">
              {/* 1) Firma Electrónica */}
              <div className="service-card" onClick={() => onServiceSelect('firma-electronica')}>
                <div className="service-card-icon">✍️</div>
                <h3 className="service-card-title">Firma Electrónica</h3>
                <p className="service-card-description">Certificado digitales completos validos para firmar documentos electrónicamente, validos para facturacion electronica</p>
                <div className="service-card-meta">
                  <div className="service-card-status">Disponible</div>
                  <div className="service-card-duration">⏱️ 30 min</div>
                  <div className="service-card-price">Desde $7.5</div>
                </div>
              </div>

              {/* 2) RUC con Antigüedad */}
              <div className="service-card" onClick={() => onServiceSelect('ruc-antiguedad')}>
                <div className="service-card-icon">📊</div>
                <h3 className="service-card-title">RUC con Antigüedad</h3>
                <p className="service-card-description">Enfocado para tramites bancarios, casas comerciales y visas</p>
                <div className="service-card-meta">
                  <div className="service-card-status">Disponible</div>
                  <div className="service-card-duration">⏱️ 3 horas</div>
                  <div className="service-card-price">Desde $45</div>
                </div>
              </div>

              {/* 3) Reporte Equifax 360 */}
              <div className="service-card" onClick={() => onServiceSelect('reporte-equifax')}>
                <div className="service-card-icon">📈</div>
                <h3 className="service-card-title">Reporte Equifax 360</h3>
                <p className="service-card-description">Reporte crediticio completo de Equifax</p>
                <div className="service-card-meta">
                  <div className="service-card-status">Disponible</div>
                  <div className="service-card-duration">⏱️ 30 min</div>
                  <div className="service-card-price">Desde $8</div>
                </div>
              </div>

              {/* Otros */}
              <div className="service-card coming-soon-card">
                <div className="service-card-icon">🔑</div>
                <h3 className="service-card-title">Clave Herencia SRI</h3>
                <p className="service-card-description">Gestión de claves de herencia para el Servicio de Rentas Internas</p>
                <div className="service-card-status">Próximamente</div>
              </div>

              <div className="service-card coming-soon-card">
                <div className="service-card-icon">📅</div>
                <h3 className="service-card-title">RUC Fecha Actual</h3>
                <p className="service-card-description">Consulta de RUC con información actualizada al día</p>
                <div className="service-card-status">En Desarrollo</div>
              </div>

              <div className="service-card coming-soon-card">
                <div className="service-card-icon">🔍</div>
                <h3 className="service-card-title">Revisión de Crédito</h3>
                <p className="service-card-description">Análisis y revisión completa de historial crediticio</p>
                <div className="service-card-status">Próximamente</div>
              </div>
            </div>
          </div>
        );
      
      case 'firma-electronica':
        return (
          <div>
            <FormularioSolicitud user={user} onServiceSelect={onServiceSelect} onBack={() => onServiceSelect('home')} />
          </div>
        );
      
      case 'ruc-antiguedad':
        return (
          <div>
            <FormularioRUC user={user} />
          </div>
        );
      
      case 'consultar-estado':
        return (
          <div>
            <ConsultarEstado user={user} />
          </div>
        );
      
      case 'trabajar-nosotros':
        return (
          <div>
            <div className="service-header">
              <h1 className="service-title">Trabaja con Nosotros</h1>
              <p className="service-description">
                Únete a nuestro equipo y forma parte de la revolución digital en Ecuador.
                Oportunidades laborales en tecnología, contabilidad, atención al cliente y más.
              </p>
            </div>
            <div className="coming-soon">
              <span className="coming-soon-icon">🤝</span>
              <h2 className="coming-soon-title">Próximamente</h2>
              <p className="coming-soon-description">
                Portal de oportunidades laborales en desarrollo. 
                Pronto podrás ver las vacantes disponibles y aplicar directamente.
              </p>
              <button 
                className="back-button"
                onClick={() => onServiceSelect('home')}
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        );
      
      case 'ayuda':
        return (
          <div>
            <div className="service-header">
              <h1 className="service-title">Centro de Ayuda</h1>
              <p className="service-description">
                Encuentra respuestas a tus preguntas, guías paso a paso y obtén soporte técnico especializado.
              </p>
            </div>

            {/* FAQ Section */}
            <div className="help-section">
              <h2 className="help-section-title">📋 Preguntas Frecuentes</h2>
              <div className="faq-grid">
                <div className="faq-item">
                  <h3 className="faq-question">¿Qué es una Firma Electrónica?</h3>
                  <p className="faq-answer">
                    Es un certificado digital que te permite firmar documentos electrónicamente con la misma validez legal que una firma manuscrita. 
                    Es válido para facturación electrónica y trámites gubernamentales.
                  </p>
                </div>
                
                <div className="faq-item">
                  <h3 className="faq-question">¿Cuánto tiempo toma obtener mi RUC con Antigüedad?</h3>
                  <p className="faq-answer">
                    El proceso completo toma aproximadamente 3 horas hábiles. Te notificaremos por email cuando esté listo para descargar.
                  </p>
                </div>
                
                <div className="faq-item">
                  <h3 className="faq-question">¿Es seguro subir mis documentos?</h3>
                  <p className="faq-answer">
                    Sí, utilizamos cifrado TLS de 256 bits y cumplimos con la Ley Orgánica de Protección de Datos Personales del Ecuador. 
                    Tus documentos se almacenan de forma segura y solo son utilizados para los trámites solicitados.
                  </p>
                </div>
                
                <div className="faq-item">
                  <h3 className="faq-question">¿Qué documentos necesito para cada servicio?</h3>
                  <p className="faq-answer">
                    <strong>Firma Electrónica:</strong> Solo tu Cédula de identidad.<br/>
                    <strong>RUC con Antigüedad:</strong> Cédula de identidad y planilla de luz.<br/>
                    <strong>Reporte Equifax:</strong> Numero de Cédula de identidad.
                  </p>
                </div>
                
                <div className="faq-item">
                  <h3 className="faq-question">¿Cómo puedo consultar el estado de mi trámite?</h3>
                  <p className="faq-answer">
                    Ve a la sección "Consultar mis trámites" en el menú lateral. Ingresa tu número de cédula y podrás ver el estado actual de todos tus trámites.
                  </p>
                </div>
                
                <div className="faq-item">
                  <h3 className="faq-question">¿Qué métodos de pago aceptan?</h3>
                  <p className="faq-answer">
                    Aceptamos transferencias bancarias, tarjetas de crédito/débito, PayPal y pagos en efectivo en nuestras oficinas. 
                    Todos los precios incluyen IVA.
                  </p>
                </div>
              </div>
            </div>

            {/* Guides Section */}
            <div className="help-section">
              <h2 className="help-section-title">📖 Guías Paso a Paso</h2>
              <div className="guides-grid">
                <div className="guide-card">
                  <div className="guide-icon">✍️</div>
                  <h3 className="guide-title">Cómo obtener tu Firma Electrónica</h3>
                  <ol className="guide-steps">
                    <li>Selecciona "Enviar Trámites" → "Firma Electrónica"</li>
                    <li>Completa el formulario con tus datos personales</li>
                    <li>Sube los documentos requeridos (cédula, foto, comprobante)</li>
                    <li>Realiza el pago correspondiente</li>
                    <li>Recibe tu certificado por email en 30 minutos</li>
                  </ol>
                </div>
                
                <div className="guide-card">
                  <div className="guide-icon">📊</div>
                  <h3 className="guide-title">Proceso para RUC con Antigüedad</h3>
                  <ol className="guide-steps">
                    <li>Ve a "Enviar Trámites" → "RUC con Antigüedad"</li>
                    <li>Ingresa tu información fiscal actual</li>
                    <li>Adjunta los documentos solicitados</li>
                    <li>Confirma y realiza el pago</li>
                    <li>Recibe tu reporte en 3 horas hábiles</li>
                  </ol>
                </div>
                
                <div className="guide-card">
                  <div className="guide-icon">📈</div>
                  <h3 className="guide-title">Solicitar Reporte Equifax</h3>
                  <ol className="guide-steps">
                    <li>Accede a "Enviar Trámites" → "Reporte Equifax 360"</li>
                    <li>Proporciona tu numero de cedula.</li>
                    <li>Autoriza la consulta crediticia</li>
                    <li>Confirma y realiza el pago</li>
                    <li>Descarga tu reporte en 30 minutos</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="help-section">
              <h2 className="help-section-title">📞 Contacto y Soporte</h2>
              <div className="contact-grid">
                <div className="contact-card">
                  <div className="contact-icon">📧</div>
                  <h3 className="contact-title">Email</h3>
                  <p className="contact-info">soporte@ecucontable.com</p>
                  <p className="contact-description">Respuesta en 24 horas</p>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">📱</div>
                  <h3 className="contact-title">WhatsApp</h3>
                  <p className="contact-info">+593 99 123 4567</p>
                  <p className="contact-description">Atención inmediata</p>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">🏢</div>
                  <h3 className="contact-title">Oficina</h3>
                  <p className="contact-info">Av. Amazonas N12-34, Quito</p>
                  <p className="contact-description">Lunes a Viernes 8:00-18:00</p>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">💬</div>
                  <h3 className="contact-title">Chat en Vivo</h3>
                  <p className="contact-info">Disponible en horario laboral</p>
                  <p className="contact-description">Soporte técnico instantáneo</p>
                </div>
              </div>
            </div>

            {/* Troubleshooting Section */}
            <div className="help-section">
              <h2 className="help-section-title">🔧 Solución de Problemas</h2>
              <div className="troubleshooting-grid">
                <div className="troubleshooting-item">
                  <h3 className="troubleshooting-title">❌ Error al subir documentos</h3>
                  <p className="troubleshooting-solution">
                    <strong>Solución:</strong> Verifica que el archivo sea PDF, JPG o PNG y no exceda 5MB. 
                    Asegúrate de que la imagen esté clara y legible.
                  </p>
                </div>
                
                <div className="troubleshooting-item">
                  <h3 className="troubleshooting-title">⏳ Mi trámite está demorado</h3>
                  <p className="troubleshooting-solution">
                    <strong>Solución:</strong> Los tiempos pueden variar según la carga del SRI. 
                    Si excede el tiempo estimado, contacta a soporte con tu número de trámite.
                  </p>
                </div>
                
                <div className="troubleshooting-item">
                  <h3 className="troubleshooting-title">💳 Problema con el pago</h3>
                  <p className="troubleshooting-solution">
                    <strong>Solución:</strong> Verifica que tu tarjeta tenga fondos suficientes. 
                    Si el problema persiste, intenta con otro método de pago o contacta a tu banco.
                  </p>
                </div>
                
                <div className="troubleshooting-item">
                  <h3 className="troubleshooting-title">📧 No recibo emails</h3>
                  <p className="troubleshooting-solution">
                    <strong>Solución:</strong> Revisa tu carpeta de spam. 
                    Si no encuentras los emails, verifica que el correo esté correcto en tu perfil o en tu soliciutd de tramite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'herramientas':
        return (
          <HerramientasSection />
        );
      
      
      default:
        return <Home onNavigate={onServiceSelect} />;
    }
  };

  const isFormView = activeService === 'firma-electronica' || activeService === 'ruc-antiguedad';

  return (
    <div className="main-content">
      <style>{localStyles}</style>
      <div className={`content-wrapper ${isFormView ? 'full-width' : ''}`}>
        {renderServiceContent()}
      </div>
    </div>
  );
};

export default MainContent;

function HerramientasSection() {
  const [abierta, setAbierta] = useState(null);
  const [pin, setPin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [pinError, setPinError] = useState('');

  const validarPin = (e) => {
    e.preventDefault();
    if (pin.trim() === '112677') {
      setAutenticado(true);
      setPinError('');
    } else {
      setPinError('Código incorrecto. Intenta nuevamente.');
    }
  };

  return (
    <div style={{ background: '#f8fafc', borderRadius: 18, padding: 18, boxShadow: '0 12px 30px rgba(148,163,184,0.35)', border: '1px solid rgba(148,163,184,0.3)', color: '#1f2937', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
      <div
        className="service-header"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(148,163,184,0.35)',
          borderRadius: 16,
          padding: 24,
          color: '#1f2937',
          boxShadow: '0 12px 22px rgba(148,163,184,0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div>
            <h1 className="service-title" style={{ marginBottom: 4, color: '#0f172a' }}>Herramientas</h1>
            <p className="service-description" style={{ margin: 0, color: '#475569' }}>
              {autenticado
                ? (abierta ? 'Vista de herramienta' : 'Selecciona una utilidad disponible.')
                : 'Zona restringida. Ingresa el código para continuar.'}
            </p>
          </div>
          {autenticado && abierta && (
            <button
              onClick={() => setAbierta(null)}
              className="back-button"
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                color: '#1e3a8a'
              }}
            >
              ← Volver
            </button>
          )}
        </div>
      </div>

      {!autenticado && (
        <div
          style={{
            marginTop: 16,
            background: '#ffffff',
            border: '1px solid rgba(96,165,250,0.5)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 18px 32px rgba(148,163,184,0.45)',
            color: '#1f2937',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace'
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 2, color: '#1e40af', textTransform: 'uppercase' }}>
            // TOOLS GATEWAY
          </div>
          <h3 style={{ margin: '8px 0 4px', fontSize: 20 }}>Autenticación requerida</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
            Introduce el código para habilitar las herramientas.
          </p>

          <form onSubmit={validarPin} style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 340 }}>
            <label style={{ fontSize: 12, letterSpacing: 1, color: '#94a3b8', textTransform: 'uppercase' }}>
              Código
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                style={{
                  marginTop: 6,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.6)',
                  background: '#f8fafc',
                  color: '#111827',
                  fontSize: 15,
                  letterSpacing: 4
                }}
              />
            </label>
            {pinError && (
              <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
                {pinError}
              </div>
            )}
            <button
              type="submit"
              style={{
                alignSelf: 'flex-start',
                padding: '10px 24px',
                borderRadius: 999,
                border: '1px solid rgba(59,130,246,0.4)',
                background: 'rgba(191,219,254,0.35)',
                color: '#1d4ed8',
                fontWeight: 700,
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Desbloquear
            </button>
          </form>
        </div>
      )}

      <style>{`
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 18px;
        }
        .tool-card {
          background: #ffffff;
          border: 1px solid rgba(148, 163, 184, 0.5);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
          color: #0f172a;
        }
        .tool-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 30px rgba(148,163,184,0.45);
          border-color: rgba(59, 130, 246, 0.5);
        }
        .tool-icon {
          font-size: 22px;
          color: #4c1d95;
        }
        .tool-title {
          font-size: 14px;
          font-weight: 800;
          margin: 6px 0 2px;
          color: #1e3a8a;
        }
        .tool-desc {
          font-size: 12px;
          color: #475569;
          margin: 0;
        }
        .tool-panel {
          margin-top: 18px;
          border: 1px solid rgba(148,163,184,0.35);
          border-radius: 12px;
          padding: 12px;
          background: #ffffff;
        }
      `}</style>
      {autenticado && !abierta && (
        <div className="tools-grid">
          <div className="tool-card" onClick={() => setAbierta('nombres')}>
            <div className="tool-icon">🪪</div>
            <div className="tool-title">Cuál es mi número de cédula</div>
            <p className="tool-desc">Busca por apellidos y nombres.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('cedula')}>
            <div className="tool-icon">🆔</div>
            <div className="tool-title">Consulta de Cédula</div>
            <p className="tool-desc">Consulta información completa de una cédula.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('placas')}>
            <div className="tool-icon">🚗</div>
            <div className="tool-title">Consultar placas</div>
            <p className="tool-desc">Detalle, propietario y valores SRI.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('correos')}>
            <div className="tool-icon">📬</div>
            <div className="tool-title">Correos temporales</div>
            <p className="tool-desc">Genera cuentas y lee mensajes rápidos.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('informe-scvs')}>
            <div className="tool-icon">📋</div>
            <div className="tool-title">Informe SCVS</div>
            <p className="tool-desc">Genera informes listos para firmar para Superintendencia de Compañías.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('estado-tributario')}>
            <div className="tool-icon">📑</div>
            <div className="tool-title">Estado Tributario SRI</div>
            <p className="tool-desc">Ejecuta el flujo de captcha y token para consultas avanzadas.</p>
          </div>
        </div>
      )}

      {autenticado && abierta === 'nombres' && (
        <div className="tool-panel" style={{ padding: 12 }}>
          <ValidadorFirma />
        </div>
      )}
      {autenticado && abierta === 'cedula' && (
        <div className="tool-panel" style={{ padding: 12 }}>
          <ConsultaCedula />
        </div>
      )}
      {autenticado && abierta === 'placas' && (
        <div className="tool-panel" style={{ padding: 12 }}>
          <ConsultaPlacas />
        </div>
      )}
      {autenticado && abierta === 'correos' && (
        <div className="tool-panel" style={{ padding: 12 }}>
          <CorreosTool />
        </div>
      )}
      {autenticado && abierta === 'informe-scvs' && (
        <div className="tool-panel" style={{ padding: 12 }}>
          <InformeSuperCompanias />
        </div>
      )}
      {autenticado && abierta === 'estado-tributario' && (
        <EstadoTributarioTool />
      )}
    </div>
  )
}

function EstadoTributarioTool() {
  const [ruc, setRuc] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const pdfRef = useRef(null)

  const consultar = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)

    const r = ruc.trim()

    if (!/^\d{13}$/.test(r)) {
      setError('Ingresa un RUC válido de 13 dígitos')
      return
    }

    setCargando(true)
    try {
      const { data, error } = await supabase.functions.invoke('estado-tributario', {
        body: { ruc: r }
      })

      if (error) {
        console.error('Error estado-tributario:', error)
        setError(error.message || 'Error en la consulta de estado tributario')
        return
      }

      if (!data?.success) {
        setError(data?.error || 'No se pudo obtener el estado tributario')
        setResultado(data || null)
        return
      }

      setResultado(data)
    } catch (e) {
      console.error('Error invocando estado-tributario:', e)
      setError(e.message || 'Error en la consulta de estado tributario')
    } finally {
      setCargando(false)
    }
  }

  const descargarPDF = async () => {
    if (!resultado?.estadoTributario || !pdfRef.current) return

    try {
      const nodo = pdfRef.current

      const canvas = await html2canvas(nodo, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgWidth = 210 // A4 mm
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const nombreArchivo = `Estado_Tributario_${ruc || 'contribuyente'}_${new Date().toISOString().slice(0,10)}.pdf`
      pdf.save(nombreArchivo)
    } catch (e) {
      console.error('Error al generar PDF de estado tributario:', e)
      alert('No se pudo generar el PDF. Intenta nuevamente.')
    }
  }

  return (
    <div className="tool-panel" style={{ padding: 12 }}>
      <style>{`
        .et-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
        .et-input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
        .et-btn { border: 1px solid #a5b4fc; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; }
        .et-alert { padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-bottom: 6px; }
        .et-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
        .et-ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .et-result { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; font-size: 12px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
        .et-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
        .et-title-main { font-size: 14px; font-weight: 800; color: #111827; }
        .et-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .et-badge { border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 700; }
        .et-badge-ok { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
        .et-badge-warn { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .et-badge-neutral { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .et-section { margin-top: 6px; }
        .et-section-title { font-size: 12px; font-weight: 700; color: #374151; margin: 0 0 4px; display: flex; align-items: center; gap: 6px; }
        .et-section-title span { font-size: 11px; font-weight: 500; color: #6b7280; }
        .et-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .et-table th, .et-table td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
        .et-table th { background: #f9fafb; color: #374151; font-weight: 700; }
        .et-table tbody tr:nth-child(even) { background: #f9fafb; }
      `}</style>

      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Estado tributario (SRI)</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
          Ejecuta el flujo automático (consulta código de persona + captcha + token SRI + estado tributario) usando solo el RUC.
        </p>
        {resultado?.estadoTributario && (
          <button
            type="button"
            onClick={descargarPDF}
            className="et-btn"
            style={{ whiteSpace: 'nowrap' }}
          >
            Descargar PDF
          </button>
        )}
      </div>

      <form className="et-form" onSubmit={consultar}>
        <input
          className="et-input"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          placeholder="Ingresa RUC (13 dígitos)"
        />
        <button className="et-btn" type="submit" disabled={cargando}>
          {cargando ? 'Procesando…' : 'Ejecutar flujo'}
        </button>
      </form>

      {error && (
        <div className="et-alert et-error">
          {error}
        </div>
      )}

      {resultado?.estadoTributario && (() => {
        const et = resultado.estadoTributario
        const fecha = et.fecha ? new Date(et.fecha).toLocaleDateString('es-EC') : null
        const pendientes = Array.isArray(et.dtObligacionesPendientes) ? et.dtObligacionesPendientes : []
        const pendientesPresentacion = Array.isArray(et.dtObligacionesPendientesPresentacion) ? et.dtObligacionesPendientesPresentacion : []
        const pendientesPago = Array.isArray(et.dtObligacionesPendientesPago) ? et.dtObligacionesPendientesPago : []

        // Unificar pendientes y pendientes de presentación, evitando duplicados
        const mapaUnicos = new Map()
        const agregarUnico = (item) => {
          if (!item) return
          const clave = `${item.motivo}|||${item.periodo}|||${item.codigoObligacion}`
          if (!mapaUnicos.has(clave)) {
            mapaUnicos.set(clave, item)
          }
        }
        pendientes.forEach(agregarUnico)
        pendientesPresentacion.forEach(agregarUnico)
        const pendientesTotales = Array.from(mapaUnicos.values())

        const tienePendientes = pendientesTotales.length > 0 || pendientesPago.length > 0

        // Detalle de deudas firmes (si viene desde el backend)
        const detalleDeudas = resultado.detalleDeudas || null
        const detalleListado = Array.isArray(detalleDeudas?.detalleDeudas)
          ? detalleDeudas.detalleDeudas
          : Array.isArray(detalleDeudas)
          ? detalleDeudas
          : []

        const primeraDeuda = detalleListado[0] || {}
        const razonSocial = primeraDeuda.razonSocial || et.razonSocial || ''
        const numeroRucCliente = primeraDeuda.numeroRuc || ruc || ''
        const totalObligaciones = pendientesTotales.length + pendientesPago.length
        const totalHonorariosServicio = totalObligaciones * 5

        // Agrupar obligaciones por periodo para organizarlas visualmente por mes
        const agruparPorPeriodo = (lista) => {
          const mapa = new Map()
          lista.forEach((item) => {
            if (!item) return
            const periodo = item.periodo || 'SIN PERIODO'
            const arr = mapa.get(periodo) || []
            arr.push(item)
            mapa.set(periodo, arr)
          })
          // Ordenar por periodo (mes y año)
          return Array.from(mapa.entries())
            .sort((a, b) => {
              // Intentar ordenar por fecha si es posible
              return a[0].localeCompare(b[0])
            })
            .map(([periodo, items]) => ({
              periodo,
              items,
            }))
        }

        const gruposPendientes = agruparPorPeriodo(pendientesTotales)
        const gruposPendientesPago = agruparPorPeriodo(pendientesPago)

        return (
          <div className="et-result" ref={pdfRef} style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Contenedor principal */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '40px 50px', backgroundColor: '#ffffff' }}>
              
              {/* Encabezado elegante */}
              <div style={{ marginBottom: '35px', borderBottom: '2px solid #1a1a1a', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', letterSpacing: '-0.5px' }}>
                      ECUCONTABLE S.A.S.
                    </div>
                    <div style={{ fontSize: '11px', color: '#666666', lineHeight: '1.6' }}>
                      RUC: 1799999999001<br />
                      Servicios Contables y Tributarios Integrales<br />
                      Email: soporte@ecucontable.com · Tel: 099 999 9999
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      COTIZACIÓN DE SERVICIOS
                    </div>
                    <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>
                      Fecha: {new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666666' }}>
                      Ref: Estado Tributario SRI
                    </div>
                  </div>
                </div>
              </div>

              {/* Referencias y destinatario */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '11px', color: '#666666', marginBottom: '8px' }}>
                  <strong>Señores:</strong> {razonSocial || 'Cliente'}
                </div>
                <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>
                  <strong>RUC:</strong> {numeroRucCliente || 'N/D'}
                </div>
                {fecha && (
                  <div style={{ fontSize: '11px', color: '#666666' }}>
                    <strong>Fecha de Corte SRI:</strong> {fecha}
                  </div>
                )}
              </div>

              {/* Introducción breve */}
              <div style={{ marginBottom: '30px' }}>
                <p style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.8', marginBottom: '12px', textAlign: 'justify' }}>
                  Por medio de la presente, nos complace presentar nuestra cotización de servicios contables y tributarios, 
                  basada en el análisis del estado tributario obtenido del Servicio de Rentas Internas (SRI). 
                  Nuestra propuesta incluye la revisión, preparación y presentación de todas las obligaciones pendientes identificadas.
                </p>
                <p style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.8', textAlign: 'justify' }}>
                  <strong>Estado Tributario:</strong> {et.textoEstadoTributario || 'Estado tributario'} {fecha && `· Corte al ${fecha}`}
                </p>
              </div>

              {/* Listado de obligaciones y costos */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e5e5e5', paddingBottom: '8px' }}>
                  Detalle de Servicios y Honorarios
                </div>
                
                {/* Obligaciones pendientes de presentación */}
                {gruposPendientes.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
                      Obligaciones Pendientes de Presentación ({pendientesTotales.length} registros)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                          <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '45%' }}>Obligación</th>
                          <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '25%' }}>Periodo</th>
                          <th style={{ textAlign: 'center', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '15%' }}>Código</th>
                          <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '15%' }}>Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gruposPendientes.map((grupo, grupoIdx) => (
                          grupo.items.map((item, idx) => (
                            <tr key={`${grupoIdx}-${idx}`} style={{ borderBottom: idx < grupo.items.length - 1 || grupoIdx < gruposPendientes.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                              <td style={{ padding: '8px 0', color: '#1a1a1a', fontWeight: 500 }}>{item.motivo}</td>
                              <td style={{ padding: '8px 0', color: '#666666' }}>{grupo.periodo}</td>
                              <td style={{ textAlign: 'center', padding: '8px 0', color: '#666666' }}>{item.codigoObligacion}</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', color: '#1a1a1a', fontWeight: 600 }}>USD 5,00</td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'right', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#666666', marginRight: '12px' }}>
                        Subtotal Obligaciones Pendientes:
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>
                        USD {(pendientesTotales.length * 5).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Obligaciones pendientes de pago */}
                {gruposPendientesPago.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
                      Obligaciones Pendientes de Pago ({pendientesPago.length} registros)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                          <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '45%' }}>Obligación</th>
                          <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '25%' }}>Periodo</th>
                          <th style={{ textAlign: 'center', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '15%' }}>Código</th>
                          <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: '#666666', fontSize: '10px', width: '15%' }}>Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gruposPendientesPago.map((grupo, grupoIdx) => (
                          grupo.items.map((item, idx) => (
                            <tr key={`${grupoIdx}-${idx}`} style={{ borderBottom: idx < grupo.items.length - 1 || grupoIdx < gruposPendientesPago.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                              <td style={{ padding: '8px 0', color: '#1a1a1a', fontWeight: 500 }}>{item.motivo}</td>
                              <td style={{ padding: '8px 0', color: '#666666' }}>{grupo.periodo}</td>
                              <td style={{ textAlign: 'center', padding: '8px 0', color: '#666666' }}>{item.codigoObligacion}</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', color: '#1a1a1a', fontWeight: 600 }}>USD 5,00</td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'right', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#666666', marginRight: '12px' }}>
                        Subtotal Obligaciones con Pago Pendiente:
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>
                        USD {(pendientesPago.length * 5).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de deudas firmes (información) */}
              {detalleListado.length > 0 && (
                <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', marginBottom: '10px' }}>
                    Información Adicional: Deudas Firmes Registradas ({detalleListado.length} registros)
                  </div>
                  <div style={{ fontSize: '11px', color: '#666666', lineHeight: '1.6' }}>
                    Se han identificado deudas firmes registradas ante el SRI por un monto total de USD {(() => {
                      const totalSaldos = detalleListado.reduce((acc, item) => {
                        const saldo = item.saldoDeuda ?? item.montoDeuda ?? item.valorTotal ?? item.monto ?? item.saldo
                        return acc + (typeof saldo === 'number' ? saldo : 0)
                      }, 0)
                      return totalSaldos.toFixed(2)
                    })()}. Esta información es referencial y no está incluida en los honorarios de la presente cotización.
                  </div>
                </div>
              )}

              {/* Total destacado */}
              <div style={{ marginTop: '30px', marginBottom: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.5px' }}>
                    TOTAL DE HONORARIOS
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>
                    USD {totalHonorariosServicio.toLocaleString('es-EC', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#cccccc', marginTop: '6px', textAlign: 'right' }}>
                  + IVA (12%)
                </div>
                <div style={{ fontSize: '10px', color: '#999999', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333333' }}>
                  Tiempo estimado de ejecución: 3-5 días hábiles
                </div>
              </div>

              {/* Métodos de pago */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>
                  Métodos de Pago Aceptados:
                </div>
                <div style={{ fontSize: '11px', color: '#666666', lineHeight: '1.6' }}>
                  Aceptamos todas las tarjetas de crédito y débito, así como transferencias bancarias.
                </div>
              </div>

              {/* Cierre profesional */}
              <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                <p style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.8', marginBottom: '12px', textAlign: 'justify' }}>
                  La presente cotización tiene una vigencia de 15 días calendario a partir de la fecha de emisión. 
                  Los valores indicados son referenciales y podrán ajustarse según el volumen de documentación y 
                  necesidades específicas del contribuyente.
                </p>
                <p style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.8', marginBottom: '12px', textAlign: 'justify' }}>
                  Quedamos a su disposición para cualquier consulta o aclaración que considere necesaria.
                </p>
                <p style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.8', marginTop: '20px' }}>
                  Atentamente,
                </p>
                <p style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.8', marginTop: '30px', fontWeight: 600 }}>
                  ECUCONTABLE S.A.S.
                </p>
              </div>

              {/* Mensaje cuando no hay pendientes */}
              {!tienePendientes && (
                <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '4px', borderLeft: '3px solid #0ea5e9' }}>
                  <p style={{ fontSize: '11px', color: '#0369a1', lineHeight: '1.6', margin: 0 }}>
                    <strong>Nota:</strong> El contribuyente no registra obligaciones pendientes de presentación ni de pago al momento de la consulta.
                  </p>
                </div>
              )}

              {/* Pie de página */}
              <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e5e5', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#999999', lineHeight: '1.6' }}>
                  ECUCONTABLE S.A.S. · RUC: 1799999999001<br />
                  Email: soporte@ecucontable.com · Tel: 099 999 9999
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
