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
import GeneracionImagenes from './GeneracionImagenes';
import EstadoCuentaBancaria from './EstadoCuentaBancaria';
import GenerarClaveSRI from './GenerarClaveSRI';
import { supabase, getFirmasGuardadas, uploadFirmaP12, downloadFirmaP12, deleteFirma } from '../lib/supabase';
// import CreateUser from './CreateUser';

const MainContent = ({ activeService, onServiceSelect, user }) => {
  const localStyles = `
    .main-content {
      margin-left: 240px;
      min-height: 100vh;
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
                    <strong>Firma Electrónica:</strong> Solo tu Cédula de identidad.<br />
                    <strong>RUC con Antigüedad:</strong> Cédula de identidad y planilla de luz.<br />
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
          <div className="tool-card" onClick={() => setAbierta('generacion-imagenes')}>
            <div className="tool-icon">📸</div>
            <div className="tool-title">Generar Cédula y Selfie</div>
            <p className="tool-desc">Genera cédula digital y selfie de verificación con IA.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('estado-cuenta')}>
            <div className="tool-icon">🏦</div>
            <div className="tool-title">Estado de Cuenta Bancario</div>
            <p className="tool-desc">Genera estados de cuenta de Banco Pichincha.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('depuracion-ruc')}>
            <div className="tool-icon">🔓</div>
            <div className="tool-title">Depuración - Activar RUC</div>
            <p className="tool-desc">Genera formulario SRI para activar RUC suspendido por depuración.</p>
          </div>
          <div className="tool-card" onClick={() => setAbierta('generar-clave-sri')}>
            <div className="tool-icon">🔑</div>
            <div className="tool-title">Generar Clave SRI</div>
            <p className="tool-desc">Automatiza la solicitud de claves y firma 100% en la nube sin apps.</p>
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
      {autenticado && abierta === 'generacion-imagenes' && (
        <div className="tool-panel" style={{ padding: 0 }}>
          <GeneracionImagenes />
        </div>
      )}
      {autenticado && abierta === 'estado-cuenta' && (
        <div className="tool-panel" style={{ padding: 0 }}>
          <EstadoCuentaBancaria />
        </div>
      )}
      {autenticado && abierta === 'depuracion-ruc' && (
        <div className="tool-panel" style={{ padding: 0 }}>
          <DepuracionRUCTool />
        </div>
      )}
      {autenticado && abierta === 'generar-clave-sri' && (
        <div className="tool-panel" style={{ padding: 0 }}>
          <GenerarClaveSRI />
        </div>
      )}
    </div>
  )
}

function DepuracionRUCTool() {
  const [ruc, setRuc] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [datos, setDatos] = useState(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [mostrarConfig, setMostrarConfig] = useState(false)
  const [ciudad, setCiudad] = useState('Guayaquil')
  // --- Firma digital ---
  const [filledPdfBytes, setFilledPdfBytes] = useState(null)
  const [p12File, setP12File] = useState(null)
  const [p12Password, setP12Password] = useState('')
  const [firmandoPDF, setFirmandoPDF] = useState(false)
  const [errorFirma, setErrorFirma] = useState('')
  const [sigPos, setSigPos] = useState({ x: 400, y: 575, w: 140, h: 45 })
  const [mostrarConfigFirma, setMostrarConfigFirma] = useState(false)

  // --- Firma digital en la Nube ---
  const [firmasGuardadas, setFirmasGuardadas] = useState([]);
  const [idFirmaSeleccionada, setIdFirmaSeleccionada] = useState('');
  const [cargandoFirmas, setCargandoFirmas] = useState(false);
  const [cargandoNube, setCargandoNube] = useState(false);
  const [datosCertificado, setDatosCertificado] = useState(null);

  React.useEffect(() => {
    cargarFirmas()
  }, [])

  const cargarFirmas = async (rucConsulta = null) => {
    setCargandoFirmas(true)
    const res = await getFirmasGuardadas()
    if (res.success && res.data && res.data.length > 0) {
      if (rucConsulta) {
        // En Ecuador, el RUC es la cédula + 001. rucConsulta aquí es los primeros 10 dígitos (ej: 0958398984)
        const firmaMatch = res.data.find(f => {
          const nombreFirma = f.nombre.trim()
          return rucConsulta.includes(nombreFirma) || nombreFirma.includes(rucConsulta)
        })

        if (firmaMatch) {
          setFirmasGuardadas([firmaMatch]) // Sólo mostrar la coincidente en el desplegable
          await handleSelectFirmaDirecto(firmaMatch.id, firmaMatch, [firmaMatch])
        } else {
          setFirmasGuardadas([]) // No hay firma para este contribuyente
          await handleSelectFirmaDirecto('', null, [])
        }
      } else {
        // Carga inicial o sin RUC: No mostramos firmas de otros
        setFirmasGuardadas([])
        await handleSelectFirmaDirecto('', null, [])
      }
    } else {
      setFirmasGuardadas([])
      await handleSelectFirmaDirecto('', null, [])
    }
    setCargandoFirmas(false)
  }

  const parseP12Info = async (fileBuffer, password) => {
    try {
      const forge = await import('node-forge')
      const p12Asn1 = forge.asn1.fromDer(fileBuffer.toString('binary'))
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password)
      let cert = null

      for (let s of p12.safeContents) {
        for (let b of s.safeBags) {
          if (b.cert) {
            cert = b.cert
            break
          }
        }
        if (cert) break
      }

      if (!cert) return null

      // Extraer datos clave
      const cnAttr = cert.subject.attributes.find(a => a.shortName === 'CN')
      const commonName = cnAttr ? cnAttr.value : 'Desconocido'

      const serialAttr = cert.subject.attributes.find(a => a.shortName === 'serialNumber')
      const cedulaCert = serialAttr ? serialAttr.value : null

      const vDesde = cert.validity.notBefore
      const vHasta = cert.validity.notAfter
      let vigenteFechas = new Date() >= vDesde && new Date() <= vHasta
      let estadoGlobal = vigenteFechas ? "VIGENTE ✅" : "CADUCADA (Por Fecha) ❌"

      if (vigenteFechas) {
        // Ejecutar prueba criptográfica en memoria para forzar validación de CRL
        try {
          if (typeof window !== 'undefined' && !window.Buffer) {
            const { Buffer: Buf } = await import('buffer')
            window.Buffer = Buf
          }

          const { PDFDocument } = await import('pdf-lib')
          const { pdflibAddPlaceholder } = await import('@signpdf/placeholder-pdf-lib')
          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([100, 100])
          page.drawText('X')

          await pdflibAddPlaceholder({
            pdfDoc,
            reason: 'Test',
            contactInfo: 'Test',
            name: 'Test',
            location: 'Test',
            signatureLength: 16384,
          })

          const pdfBytes = await pdfDoc.save()

          const { P12Signer } = await import('@signpdf/signer-p12')
          const signpdfMod = await import('@signpdf/signpdf')
          const signpdf = signpdfMod.default || signpdfMod.signpdf || signpdfMod

          // Convertir buffer a Uint8Array
          const signerBuf = new Uint8Array(fileBuffer.buffer || fileBuffer)
          const signer = new P12Signer(signerBuf, { passphrase: password })

          const signedPdf = await signpdf.sign(new Uint8Array(pdfBytes), signer)
          if (signedPdf) {
            // No lanzó error
          }
        } catch (signErr) {
          console.warn('⚠️ Firma no pasó validación criptográfica/CRL:', signErr)
          vigenteFechas = false
          const r = signErr.message || ''
          estadoGlobal = `DEFECTUOSA O REVOCADA ❌ (${r})`
        }
      }

      return {
        commonName,
        cedula: cedulaCert,
        validoDesde: vDesde,
        validoHasta: vHasta,
        vigente: vigenteFechas,
        estado: estadoGlobal
      }

    } catch (e) {
      console.error('Error parseando P12:', e)
      return null
    }
  }

  const handleSelectFirmaDirecto = async (id, firmaObj, listaFirmas) => {
    setIdFirmaSeleccionada(id)
    if (!id || !firmaObj) {
      setP12File(null)
      setP12Password('')
      setDatosCertificado(null)
      return
    }

    try {
      setErrorFirma('')
      setCargandoNube(true)
      const res = await downloadFirmaP12(firmaObj.storage_path)
      if (res.success) {
        const file = new File([res.data], `firma_cloud_${id}.p12`, { type: 'application/x-pkcs12' })
        setP12File(file)
        setP12Password(firmaObj.password)

        // Validar vigencia
        const p12ArrayBuffer = await res.data.arrayBuffer()

        // Polyfill Buffer rápido
        if (typeof window !== 'undefined' && !window.Buffer) {
          const { Buffer: Buf } = await import('buffer')
          window.Buffer = Buf
        }

        const nodeBuffer = window.Buffer.from(p12ArrayBuffer)
        const certInfo = await parseP12Info(nodeBuffer, firmaObj.password)
        setDatosCertificado(certInfo)

      } else {
        setErrorFirma('No se pudo descargar la firma desde la base de datos')
      }
    } catch (err) {
      setErrorFirma('Ocurrió un error obteniendo la firma de Supabase')
    } finally {
      setCargandoNube(false)
    }
  }

  const handleSelectFirma = async (e) => {
    const id = e.target.value
    const firma = firmasGuardadas.find(f => f.id === id)
    await handleSelectFirmaDirecto(id, firma, firmasGuardadas)
  }

  const handleEliminarFirma = async (id, path) => {
    if (!window.confirm('¿Seguro quieres borrar esta firma de la base de datos?')) return
    setCargandoNube(true)
    try {
      await deleteFirma(id, path)
      if (idFirmaSeleccionada === id) {
        setIdFirmaSeleccionada('')
        setP12File(null)
        setP12Password('')
      }
      await cargarFirmas()
    } finally {
      setCargandoNube(false)
    }
  }

  // Fecha actual formateada como texto completo
  const hoy = new Date()
  const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const textoFechaHoy = (c) =>
    `${c}, ${DIAS_ES[hoy.getDay()]} ${hoy.getDate()} de ${MESES_ES[hoy.getMonth()]} del ${hoy.getFullYear()}`

  const [posiciones, setPosiciones] = useState({
    ruc: { x: 415, y: 195, size: 14 },
    razonSocial: { x: 40, y: 195, size: 10 },
    ceseAnio: { x: 260, y: 448, size: 15 },
    ceseMes: { x: 170, y: 448, size: 15 },
    ceseDia: { x: 80, y: 448, size: 15 },
    fechaTexto: { x: 185, y: 110, size: 11 },
    marcaX: { x: 563, y: 280, size: 16 },
  })

  const SUPABASE_URL = 'https://eapcqcuzfkpqngbvjtmv.supabase.co/functions/v1/consultar-ruc'
  const BEARER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGNxY3V6ZmtwcW5nYnZqdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTEzNzIsImV4cCI6MjA3NDQyNzM3Mn0.-mufqMzFQetktwAL444d1PjdWfdCC5-2ftVs0LnTIL4'

  const consultarRUC = async (e) => {
    e.preventDefault()
    setError('')
    setDatos(null)
    setPdfPreviewUrl(null)
    const r = ruc.trim()
    if (!/^\d{13}$/.test(r)) { setError('Ingresa un RUC válido de 13 dígitos'); return }
    setCargando(true)
    try {
      const resp = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BEARER}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ruc: r })
      })
      if (!resp.ok) throw new Error(`Error HTTP ${resp.status}`)
      const data = await resp.json()
      if (!data.numero_ruc) throw new Error('Respuesta inesperada de la API')
      setDatos(data)

      // Intentar auto-cargar la firma P12 que coincida con el RUC, con y sin 001
      const cedulaBase = data.numero_ruc.substring(0, 10)
      console.log('Buscando firma auto para base:', cedulaBase, ' o ', data.numero_ruc)
      await cargarFirmas(cedulaBase) // Busca el número base ("0912345678")

      setTimeout(() => generarPDF(data, true), 100)
    } catch (err) {
      setError(err.message || 'Error en la consulta')
    } finally {
      setCargando(false)
    }
  }

  // Parsea "2017-12-10 00:00:00.0" o "2017-12-10" → { anio, mes, dia }
  const parseFechaCese = (fechaCese) => {
    if (!fechaCese) return { anio: '', mes: '', dia: '' }
    const str = String(fechaCese).trim()
    // Busca patrón YYYY-MM-DD sea cual sea el resto
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return { anio: '', mes: '', dia: '' }
    return { anio: match[1], mes: match[2], dia: match[3] }
  }

  const generarPDF = async (datosParam, previewMode = false, ciudadParam) => {
    const d = datosParam || datos
    if (!d) return
    const ciudadActual = ciudadParam !== undefined ? ciudadParam : ciudad
    setGenerandoPDF(true)
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
      const pdfUrl = `${window.location.origin}/depuracion.pdf`
      const pdfRaw = await fetch(pdfUrl)
        .then(r => { if (!r.ok) throw new Error('No se encontró el PDF'); return r.arrayBuffer() })
      const pdfDoc = await PDFDocument.load(pdfRaw)
      const pages = pdfDoc.getPages()
      const page = pages[0]
      const { height } = page.getSize()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      const draw = (text, campo) => {
        if (text === null || text === undefined || text === '') return
        const p = posiciones[campo]
        page.drawText(String(text), {
          x: p.x,
          y: height - p.y,
          size: p.size,
          font,
          color: rgb(0, 0, 0)
        })
      }

      const drawAt = (text, x, y, size) => {
        if (!text) return
        page.drawText(String(text), {
          x, y: height - y, size, font, color: rgb(0, 0, 0)
        })
      }

      // Fecha de cese (3 campos separados)
      const { anio, mes, dia } = parseFechaCese(d.fecha_cese)
      console.log('Fecha cese raw:', d.fecha_cese, '→', { anio, mes, dia })

      draw(d.numero_ruc, 'ruc')
      draw(d.razon_social, 'razonSocial')

      // Cese: dibujamos directamente con las posiciones configuradas
      if (anio) drawAt(anio, posiciones.ceseAnio.x, posiciones.ceseAnio.y, posiciones.ceseAnio.size)
      if (mes) drawAt(mes, posiciones.ceseMes.x, posiciones.ceseMes.y, posiciones.ceseMes.size)
      if (dia) drawAt(dia, posiciones.ceseDia.x, posiciones.ceseDia.y, posiciones.ceseDia.size)

      // Fecha actual como texto completo
      const fechaCompleta = textoFechaHoy(ciudadActual)
      drawAt(fechaCompleta, posiciones.fechaTexto.x, posiciones.fechaTexto.y, posiciones.fechaTexto.size)

      // Marca X
      draw('X', 'marcaX')

      const outBytes = await pdfDoc.save()
      setFilledPdfBytes(outBytes) // guardar bytes para firma posterior
      const blob = new Blob([outBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      if (previewMode) {
        setPdfPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `Formulario_Depuracion_${d.numero_ruc}.pdf`
        a.click()
      }
    } catch (err) {
      setError('Error generando PDF: ' + err.message)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const exportarCoordenadas = () => {
    const json = JSON.stringify(posiciones, null, 2)
    navigator.clipboard.writeText(json).then(() => alert('✅ Coordenadas copiadas al portapapeles'))
  }

  const dibujarFirmaVisual = async (pdfDoc, sigPosConfig, datosObj) => {
    const pages = pdfDoc.getPages()
    const page = pages[0]
    const { height: pH } = page.getSize()

    const rectX1 = sigPosConfig.x
    const rectY1 = pH - sigPosConfig.y - sigPosConfig.h

    const { StandardFonts, rgb } = await import('pdf-lib')
    const QRCode = await import('qrcode')

    const fontNormal = await pdfDoc.embedFont(StandardFonts.Courier)
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    const urlInfo = `Datos de firma: ${datosObj?.razon_social || 'Contribuyente'}\\nFecha: ${new Date().toISOString()}`
    const qrDataUrl = await QRCode.toDataURL(urlInfo, { margin: 1, color: { dark: '#000', light: '#FFF' } })
    const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer())
    const qrImage = await pdfDoc.embedPng(qrImageBytes)

    const scale = Math.max(0.5, sigPosConfig.h / 45)
    const padding = 2 * scale
    const qrSize = sigPosConfig.h - padding * 2
    const qrX = rectX1 + padding
    const qrY = rectY1 + padding

    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })

    const textX = qrX + qrSize + 4 * scale
    const sizeNormal = 6 * scale
    const sizeBold = 10 * scale
    const colorText = rgb(0.1, 0.1, 0.1)

    const topSpaceY = rectY1 + sigPosConfig.h - padding - sizeNormal
    page.drawText('Firmado electrónicamente por:', {
      x: textX, y: topSpaceY, size: sizeNormal, font: fontNormal, color: colorText
    })

    const rs = (datosObj?.razon_social || 'CONTRIBUYENTE').toUpperCase().trim()
    const parts = rs.split(' ')
    let primeraLinea = rs
    let segundaLinea = ''

    if (parts.length >= 4) {
      primeraLinea = parts.slice(0, 2).join(' ')
      segundaLinea = parts.slice(2).join(' ')
    } else if (parts.length === 3) {
      primeraLinea = parts.slice(0, 2).join(' ')
      segundaLinea = parts[2]
    } else if (parts.length === 2 && rs.length > 15) {
      primeraLinea = parts[0]
      segundaLinea = parts[1]
    } else if (rs.length > 22) {
      const breakAt = rs.lastIndexOf(' ', 22)
      if (breakAt > 0) {
        primeraLinea = rs.substring(0, breakAt)
        segundaLinea = rs.substring(breakAt + 1)
      } else {
        primeraLinea = rs.substring(0, 22)
        segundaLinea = rs.substring(22)
      }
    }

    const yRS1 = topSpaceY - sizeBold - 3 * scale
    page.drawText(primeraLinea, { x: textX, y: yRS1, size: sizeBold, font: fontBold, color: colorText })

    let yValidar = yRS1 - sizeNormal - 5 * scale
    if (segundaLinea) {
      const yRS2 = yRS1 - sizeBold
      page.drawText(segundaLinea, { x: textX, y: yRS2, size: sizeBold, font: fontBold, color: colorText })
      yValidar = yRS2 - sizeNormal - 4 * scale
    }

    page.drawText('Validar únicamente con FirmaEC', {
      x: textX, y: yValidar, size: sizeNormal, font: fontNormal, color: colorText
    })
  }

  const previsualizarFirma = async () => {
    if (!filledPdfBytes) { setErrorFirma('Primero genera el PDF base'); return }
    setCargandoNube(true)
    setErrorFirma('')
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(filledPdfBytes)
      await dibujarFirmaVisual(pdfDoc, sigPos, datos)
      const outBytes = await pdfDoc.save()
      const blob = new Blob([outBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
      alert('Vista previa del PDF actualizada visualizando la posición de la firma.')
    } catch (err) {
      setErrorFirma('Error al previsualizar firma: ' + err.message)
    } finally {
      setCargandoNube(false)
    }
  }

  const firmarPDF = async () => {
    if (!filledPdfBytes) { setErrorFirma('Primero genera el PDF'); return }
    if (!p12File) { setErrorFirma('Selecciona tu archivo .p12'); return }
    if (!p12Password) { setErrorFirma('Ingresa la contraseña de tu firma'); return }

    // Bloqueo si el certificado no es válido/está revocado
    if (datosCertificado && !datosCertificado.vigente) {
      setErrorFirma(`No se puede firmar: El certificado se encuentra ${datosCertificado.estado || 'CADUCADO o REVOCADO'}.`)
      return
    }

    setFirmandoPDF(true)
    setErrorFirma('')
    try {
      if (typeof window !== 'undefined' && !window.Buffer) {
        const { Buffer: Buf } = await import('buffer')
        window.Buffer = Buf
      }

      const { PDFDocument } = await import('pdf-lib')
      const { pdflibAddPlaceholder } = await import('@signpdf/placeholder-pdf-lib')
      const signpdfMod = await import('@signpdf/signpdf')
      const { P12Signer } = await import('@signpdf/signer-p12')
      const signpdf = signpdfMod.default || signpdfMod.signpdf || signpdfMod

      const pdfDoc = await PDFDocument.load(filledPdfBytes)
      const pages = pdfDoc.getPages()
      const { height: pH } = pages[0].getSize()

      const rectX1 = sigPos.x
      const rectY1 = pH - sigPos.y - sigPos.h
      const rectX2 = sigPos.x + sigPos.w
      const rectY2 = pH - sigPos.y

      if (!pdfDoc.context.registeredSignatures) {
        pdfDoc.context.registeredSignatures = []
      }

      await dibujarFirmaVisual(pdfDoc, sigPos, datos)

      await pdflibAddPlaceholder({
        pdfDoc,
        reason: '',
        contactInfo: datos?.razon_social || '',
        name: datos?.razon_social || '',
        location: '',
        signatureLength: 16384,
        subFilter: 'adbe.pkcs7.detached',
        widgetRect: [rectX1, rectY1, rectX2, rectY2],
      })

      const pdfConPlaceholder = await pdfDoc.save({ useObjectStreams: false })

      const p12Buffer = await p12File.arrayBuffer()
      const signer = new P12Signer(new Uint8Array(p12Buffer), { passphrase: p12Password })

      const { SignPdf } = await import('@signpdf/signpdf')
      const signPdfInstance = new SignPdf()
      const signedBytes = await signPdfInstance.sign(new Uint8Array(pdfConPlaceholder), signer)

      // Auto-guardar la firma en Cloud
      if (!idFirmaSeleccionada) {
        try {
          const { uploadFirmaP12 } = await import('../lib/supabase')
          const nombreFirma = p12File.name.replace(/\.[^/.]+$/, "")
          const res = await uploadFirmaP12(p12File, nombreFirma, p12Password)
          if (res.success) {
            await cargarFirmas()
            setIdFirmaSeleccionada(res.data.id)
            console.log('✅ Firma autoguardada exitosamente con nombre:', nombreFirma)
          }
        } catch (e) { console.error("Error el autoguardado de la firma:", e) }
      }

      const blob = new Blob([signedBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Formulario_Firmado_${datos?.numero_ruc || 'doc'}.pdf`
      a.click()
    } catch (err) {
      console.error('Error firma:', err)
      setErrorFirma('Error al firmar: ' + err.message)
    } finally {
      setFirmandoPDF(false)
    }
  }

  const actualizarPos = (campo, eje, val) => {
    setPosiciones(prev => ({
      ...prev,
      [campo]: { ...prev[campo], [eje]: Number(val) || 0 }
    }))
  }

  const CAMPOS_CONFIG = [
    { key: 'ruc', label: 'Número RUC' },
    { key: 'razonSocial', label: 'Razón Social' },
    { key: 'ceseAnio', label: 'Año de Cese' },
    { key: 'ceseMes', label: 'Mes de Cese' },
    { key: 'ceseDia', label: 'Día de Cese' },
    { key: 'fechaTexto', label: 'Fecha completa (texto)' },
    { key: 'marcaX', label: 'Marca X (checkbox)' },
  ]

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        .dr-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
        .dr-input { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; }
        .dr-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
        .dr-btn { border: 1px solid #a5b4fc; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 7px 14px; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; }
        .dr-btn:hover { background: #e0e7ff; }
        .dr-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .dr-btn-green { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
        .dr-btn-red { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
        .dr-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 6px; padding: 8px 10px; font-size: 13px; margin-bottom: 8px; }
        .dr-info { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; font-size: 13px; }
        .dr-info-row { display: flex; gap: 8px; margin-bottom: 4px; }
        .dr-info-label { font-weight: 700; color: #0369a1; min-width: 130px; }
        .dr-info-val { color: #1e293b; }
        .dr-config-body { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
        .dr-field-group { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
        .dr-field-label { font-size: 11px; font-weight: 700; color: #6366f1; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .dr-field-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        .dr-coord-input { padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; width: 100%; text-align: center; }
        .dr-coord-label { font-size: 10px; color: #6b7280; text-align: center; margin-bottom: 2px; }
        .dr-preview-container { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; margin-bottom: 12px; }
        .dr-action-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .dr-ciudad-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; }
        .dr-ciudad-btn { padding: 5px 14px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .dr-ciudad-btn.active { background: #065f46; color: #fff; border-color: #065f46; }
      `}</style>

      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>🔓 Depuración – Activar RUC Suspendido</h3>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
        Consulta el RUC y genera el formulario SRI para activar RUC suspendido por depuración.
      </p>

      {/* Selector de ciudad */}
      <div className="dr-ciudad-bar">
        <span style={{ fontSize: 13, fontWeight: 700, color: '#064e3b' }}>🏙️ Ciudad:</span>
        {['Guayaquil', 'Quito'].map(c => (
          <button
            key={c}
            className={`dr-ciudad-btn${ciudad === c ? ' active' : ''}`}
            onClick={() => { setCiudad(c); if (datos) generarPDF(datos, true, c) }}
          >{c}</button>
        ))}
        <span style={{ fontSize: 12, color: '#065f46', marginLeft: 4, flex: 1 }}>
          → <em>{textoFechaHoy(ciudad)}</em>
        </span>
      </div>

      <form className="dr-form" onSubmit={consultarRUC}>
        <input
          className="dr-input"
          value={ruc}
          onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 13))}
          placeholder="Ingresa RUC (13 dígitos)"
          maxLength={13}
        />
        <button className="dr-btn" type="submit" disabled={cargando || ruc.length !== 13}>
          {cargando ? '⏳ Consultando…' : '🔍 Consultar RUC'}
        </button>
      </form>

      {error && <div className="dr-error">⚠️ {error}</div>}

      {datos && (() => {
        const { anio, mes, dia } = parseFechaCese(datos.fecha_cese)
        return (
          <div className="dr-info">
            <div className="dr-info-row"><span className="dr-info-label">📄 RUC:</span><span className="dr-info-val">{datos.numero_ruc}</span></div>
            <div className="dr-info-row"><span className="dr-info-label">👤 Razón Social:</span><span className="dr-info-val">{datos.razon_social}</span></div>
            <div className="dr-info-row"><span className="dr-info-label">✅ Estado:</span><span className="dr-info-val" style={{ color: datos.estado === 'ACTIVO' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{datos.estado}</span></div>
            <div className="dr-info-row"><span className="dr-info-label">📅 Fecha Cese:</span><span className="dr-info-val">{datos.fecha_cese || 'N/A'} → Año: <b>{anio}</b> Mes: <b>{mes}</b> Día: <b>{dia}</b></span></div>
            <div className="dr-info-row"><span className="dr-info-label">⚠️ Motivo:</span><span className="dr-info-val">{datos.motivo_cancelacion || 'N/A'}</span></div>
            <div className="dr-info-row"><span className="dr-info-label">📅 Fecha documento:</span><span className="dr-info-val">{textoFechaHoy(ciudad)}</span></div>
          </div>
        )
      })()}

      {datos && (
        <div className="dr-action-bar">
          <button className="dr-btn" onClick={() => setMostrarConfig(v => !v)}>
            ⚙️ {mostrarConfig ? 'Ocultar' : 'Configurar'} posiciones
          </button>
          <button className="dr-btn" disabled={generandoPDF} onClick={() => generarPDF(datos, true)}>
            {generandoPDF ? '⏳ Generando…' : '🔄 Actualizar vista previa'}
          </button>
          <button className="dr-btn dr-btn-green" disabled={generandoPDF} onClick={() => generarPDF(datos, false)}>
            📥 Descargar PDF
          </button>
          <button className="dr-btn dr-btn-red" onClick={exportarCoordenadas}>
            📋 Exportar coordenadas
          </button>
        </div>
      )}

      {mostrarConfig && (
        <div className="dr-config-body">
          {CAMPOS_CONFIG.map(({ key, label }) => (
            <div className="dr-field-group" key={key}>
              <div className="dr-field-label">{label}</div>
              <div className="dr-field-inputs">
                <div>
                  <div className="dr-coord-label">X</div>
                  <input className="dr-coord-input" type="number" value={posiciones[key].x}
                    onChange={e => actualizarPos(key, 'x', e.target.value)} />
                </div>
                <div>
                  <div className="dr-coord-label">Y (desde arriba)</div>
                  <input className="dr-coord-input" type="number" value={posiciones[key].y}
                    onChange={e => actualizarPos(key, 'y', e.target.value)} />
                </div>
                <div>
                  <div className="dr-coord-label">Tamaño</div>
                  <input className="dr-coord-input" type="number" value={posiciones[key].size}
                    onChange={e => actualizarPos(key, 'size', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <button className="dr-btn" style={{ width: '100%' }} disabled={generandoPDF} onClick={() => generarPDF(datos, true)}>
              {generandoPDF ? '⏳ Aplicando…' : '✅ Aplicar cambios y actualizar vista previa'}
            </button>
          </div>
        </div>
      )}

      {pdfPreviewUrl && (
        <div className="dr-preview-container">
          <iframe
            src={pdfPreviewUrl}
            title="Vista previa del formulario"
            style={{ width: '100%', height: 700, border: 'none', display: 'block' }}
          />
        </div>
      )}

      {filledPdfBytes && (
        <div style={{ marginTop: 8, border: '2px solid #818cf8', borderRadius: 10, overflow: 'hidden' }}>
          <style>{`
            .sig-section { padding: 14px 16px; background: #eef2ff; }
            .sig-title { font-size: 14px; font-weight: 800; color: #3730a3; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
            .sig-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
            .sig-label { font-size: 11px; font-weight: 700; color: #4338ca; margin-bottom: 4px; }
            .sig-input { width: 100%; padding: 6px 8px; border: 1px solid #a5b4fc; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; }
            .sig-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
            .sig-pos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
            .sig-coord-lbl { font-size: 10px; color: #6b7280; margin-bottom: 3px; text-align: center; font-weight: 600; }
            .sig-coord-inp { width: 100%; padding: 4px 6px; border: 1px solid #c7d2fe; border-radius: 4px; font-size: 12px; text-align: center; box-sizing: border-box; }
            .sig-btn-main { background: #4338ca; color: #fff; border: none; border-radius: 7px; padding: 10px 18px; font-weight: 800; font-size: 13px; cursor: pointer; width: 100%; }
            .sig-btn-main:hover { background: #3730a3; }
            .sig-btn-main:disabled { opacity: 0.6; cursor: not-allowed; }
            .sig-error { background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c; border-radius: 6px; padding: 8px; font-size: 12px; margin-top: 8px; }
            .sig-page-mock { position: relative; background: white; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin: 0 auto; }
            .sig-rect-preview { position: absolute; border: 2px solid #4338ca; background: rgba(99,102,241,0.18); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #3730a3; font-weight: 800; pointer-events: none; }
          `}</style>
          <div className='sig-section'>
            <div className='sig-title'>✍️ Firma Digital Electrónica (.p12)
              <span style={{ fontSize: 11, fontWeight: 400, color: '#6366f1', marginLeft: 'auto' }}>
                <select className='sig-input' style={{ width: 'auto', display: 'inline-block', padding: '2px 8px' }}
                  value={idFirmaSeleccionada} onChange={handleSelectFirma}>
                  <option value="">-- Subir firma manualmente --</option>
                  {firmasGuardadas.map(f => (
                    <option key={f.id} value={f.id}>☁️ {f.nombre}</option>
                  ))}
                </select>
              </span>
            </div>

            {cargandoFirmas || cargandoNube ? (
              <div style={{ fontSize: 13, padding: 20, color: '#4338ca', textAlign: 'center', fontWeight: 'bold' }}>⏳ Sincronizando firmas con internet...</div>
            ) : (
              <>
                <div className='sig-grid2'>
                  <div>
                    <div className='sig-label'>📂 Certificado .p12 / .pfx</div>
                    {idFirmaSeleccionada ? (
                      <div style={{ padding: '8px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#4f46e5', fontWeight: 700 }}>☁️ Certificado Nublado</span>
                          <button onClick={() => {
                            const firma = firmasGuardadas.find(f => f.id === idFirmaSeleccionada)
                            if (firma) handleEliminarFirma(firma.id, firma.storage_path)
                          }} style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 6px', color: '#ef4444', cursor: 'pointer', fontSize: 10, fontWeight: 700 }} title="Borrar de la nube">Eliminar</button>
                        </div>
                        {datosCertificado ? (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#334155' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{datosCertificado.commonName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              Estado:
                              {datosCertificado.estado.includes('VIGENTE') ? (
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>{datosCertificado.estado}</span>
                              ) : datosCertificado.estado.includes('CADUCADO') || datosCertificado.estado.includes('REVOCADO') ? (
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{datosCertificado.estado}</span>
                              ) : (
                                <span style={{ color: '#d97706', fontWeight: 600 }}>{datosCertificado.estado}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span>Emisión: {new Date(datosCertificado.validoDesde).toLocaleString('es-EC')}</span>
                              <span>Vencimiento: {new Date(datosCertificado.validoHasta).toLocaleString('es-EC')}</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#64748b' }}>⏳ Leyendo datos...</div>
                        )}
                      </div>
                    ) : (
                      <>
                        <input type='file' accept='.p12,.pfx' className='sig-input' style={{ padding: '4px 8px', cursor: 'pointer' }}
                          onChange={e => { setP12File(e.target.files[0]); setErrorFirma('') }}
                        />
                        {p12File && <div style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>✅ {p12File.name}</div>}
                      </>
                    )}
                  </div>
                  <div>
                    <div className='sig-label'>🔑 Contraseña del certificado</div>
                    <input type='password' className='sig-input' value={p12Password}
                      onChange={e => setP12Password(e.target.value)}
                      placeholder='Contraseña del .p12'
                      readOnly={!!idFirmaSeleccionada}
                      style={{ background: idFirmaSeleccionada ? '#e2e8f0' : '#fff' }}
                    />
                  </div>
                </div>

              </>
            )}

            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button className='dr-btn' style={{ fontSize: 12, padding: '5px 10px' }}
                onClick={() => setMostrarConfigFirma(v => !v)}>
                📐 {mostrarConfigFirma ? 'Ocultar' : 'Ajustar'} posición de firma
              </button>
              <button className='dr-btn' style={{ fontSize: 12, padding: '5px 10px' }}
                onClick={previsualizarFirma} disabled={cargandoNube || !filledPdfBytes}>
                👁️ Previsualizar firma en formulario
              </button>
              <span style={{ fontSize: 11, color: '#6b7280' }}>
                X:{sigPos.x} Y:{sigPos.y} — {sigPos.w}×{sigPos.h} pts
              </span>
            </div>

            {mostrarConfigFirma && (
              <>
                <div className='sig-pos-grid'>
                  {[{ k: 'x', l: 'X (izquierda)' }, { k: 'y', l: 'Y (desde arriba)' }, { k: 'w', l: 'Ancho' }, { k: 'h', l: 'Alto' }].map(({ k, l }) => (
                    <div key={k}>
                      <div className='sig-coord-lbl'>{l}</div>
                      <input type='number' className='sig-coord-inp' value={sigPos[k]}
                        onChange={e => setSigPos(prev => ({ ...prev, [k]: Number(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>
                {/* Mini-preview posición */}
                {(() => {
                  const PDF_W = 595, PDF_H = 842, MOCK_W = 200
                  const sc = MOCK_W / PDF_W
                  return (
                    <div style={{ background: '#f1f5f9', borderRadius: 6, padding: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>📄 Posición de firma (escala)</div>
                      <div className='sig-page-mock' style={{ width: MOCK_W, height: PDF_H * sc }}>
                        <div style={{ position: 'absolute', top: '10%', left: '8%', right: '8%', height: 1, background: '#e2e8f0' }} />
                        <div style={{ position: 'absolute', top: '18%', left: '8%', right: '8%', height: 1, background: '#e2e8f0' }} />
                        <div style={{ position: 'absolute', top: '28%', left: '8%', right: '55%', height: 1, background: '#e2e8f0' }} />
                        <div className='sig-rect-preview' style={{ left: sigPos.x * sc, top: sigPos.y * sc, width: sigPos.w * sc, height: sigPos.h * sc }}>✍️</div>
                      </div>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>A4 = 595×842 pts. El rectángulo azul indica la posición.</p>
                    </div>
                  )
                })()}
              </>
            )}

            <button className='sig-btn-main' disabled={firmandoPDF || !p12File || !p12Password} onClick={firmarPDF}>
              {firmandoPDF ? '⏳ Firmando… por favor espera' : '✍️ Firmar PDF y descargar'}
            </button>
            {errorFirma && <div className='sig-error'>⚠️ {errorFirma}</div>}
          </div>
        </div>
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

      const nombreArchivo = `Estado_Tributario_${ruc || 'contribuyente'}_${new Date().toISOString().slice(0, 10)}.pdf`
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

