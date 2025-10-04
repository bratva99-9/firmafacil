import React from 'react';
import Home from './Home';
import FormularioSolicitud from './FormularioSolicitud';
import FormularioRUC from './FormularioRUC';
import ConsultarEstado from './ConsultarEstado';
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
