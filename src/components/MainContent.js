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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 40px;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.2);
      position: relative;
      overflow: hidden;
    }

    .service-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    }

    .service-title {
      font-size: 36px;
      font-weight: 800;
      color: white;
      margin-bottom: 12px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
      z-index: 1;
    }

    .service-description {
      color: rgba(255,255,255,0.9);
      font-size: 18px;
      line-height: 1.7;
      font-weight: 400;
      position: relative;
      z-index: 1;
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
      gap: 16px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 20px 24px;
      border-radius: 16px;
      margin-top: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
    }
    .security-banner .icon {
      font-size: 24px;
      line-height: 1;
      flex-shrink: 0;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    .security-banner .text {
      font-size: 15px;
      line-height: 1.6;
      font-weight: 500;
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

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .service-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.05);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .service-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      border-color: rgba(102, 126, 234, 0.2);
    }

    .service-card:hover::before {
      opacity: 1;
    }

    .service-card.premium-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .service-card.premium-card .service-card-title,
    .service-card.premium-card .service-card-description {
      color: white;
    }

    .service-card.business-card {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .service-card.business-card .service-card-title,
    .service-card.business-card .service-card-description {
      color: white;
    }

    .service-card.financial-card {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .service-card.financial-card .service-card-title,
    .service-card.financial-card .service-card-description {
      color: white;
    }

    .service-card.coming-soon-card {
      opacity: 0.6;
      cursor: not-allowed;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    }

    .service-card.coming-soon-card:hover {
      transform: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border-color: rgba(0,0,0,0.05);
    }

    .service-card.coming-soon-card:hover::before {
      opacity: 0;
    }

    .service-card-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(255,255,255,0.2);
      color: white;
      backdrop-filter: blur(10px);
    }

    .service-card.coming-soon-card .service-card-badge {
      background: rgba(0,0,0,0.1);
      color: #6b7280;
    }

    .service-card-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 8px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .service-card-title {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      margin: 0;
      line-height: 1.3;
    }

    .service-card-description {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
    }

    .service-card-features {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
    }

    .feature-tag {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255,255,255,0.2);
      color: white;
      backdrop-filter: blur(10px);
    }

    .service-card.coming-soon-card .feature-tag {
      background: rgba(0,0,0,0.1);
      color: #6b7280;
    }

    .service-card-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: auto;
      flex-wrap: wrap;
    }

    .service-card-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .service-card-status.available {
      background: rgba(34, 197, 94, 0.2);
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .service-card-status.coming-soon {
      background: rgba(156, 163, 175, 0.2);
      color: #6b7280;
      border: 1px solid rgba(156, 163, 175, 0.3);
    }

    .service-card-duration {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(255,255,255,0.2);
      color: white;
      font-size: 12px;
      font-weight: 700;
      backdrop-filter: blur(10px);
    }

    .service-card.coming-soon-card .service-card-duration {
      background: rgba(0,0,0,0.1);
      color: #6b7280;
    }

    .service-card-price {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(255,255,255,0.2);
      color: white;
      font-size: 12px;
      font-weight: 700;
      backdrop-filter: blur(10px);
    }

    .service-card.coming-soon-card .service-card-price {
      background: rgba(0,0,0,0.1);
      color: #6b7280;
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
        padding: 24px 20px;
        margin-bottom: 24px;
        border-radius: 16px;
      }
      
      .service-title {
        font-size: 28px;
        margin-bottom: 10px;
      }
      
      .service-description {
        font-size: 16px;
      }
      
      .security-banner {
        padding: 16px 20px;
        margin-top: 20px;
        border-radius: 12px;
      }
      
      .security-banner .text {
        font-size: 14px;
      }

      .services-grid {
        grid-template-columns: 1fr;
        gap: 20px;
        margin-top: 20px;
      }

      .service-card {
        padding: 20px;
        border-radius: 16px;
      }
      
      .service-card-icon {
        font-size: 40px;
      }
      
      .service-card-title {
        font-size: 20px;
      }
      
      .service-card-description {
        font-size: 14px;
      }
      
      .service-card-status {
        padding: 6px 12px;
        font-size: 11px;
      }
      
      .service-card-duration, .service-card-price {
        padding: 6px 12px;
        font-size: 11px;
      }

      .service-card-badge {
        top: 12px;
        right: 12px;
        padding: 4px 8px;
        font-size: 10px;
      }

      .feature-tag {
        padding: 4px 8px;
        font-size: 11px;
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
              <h1 className="service-title">🚀 Servicios Digitales</h1>
              <p className="service-description">
                Descubre nuestra gama completa de servicios digitales diseñados para simplificar tus trámites y potenciar tu negocio. 
                Soluciones rápidas, seguras y confiables al alcance de un clic.
              </p>
              <div className="security-banner">
                <span className="icon">🛡️</span>
                <div className="text">
                  <strong>Seguridad Garantizada:</strong> Protegemos tu información con tecnología de vanguardia. 
                  Cifrado TLS 256-bit, cumplimiento con la Ley de Protección de Datos del Ecuador y auditorías de seguridad regulares. 
                  Tu privacidad es nuestra prioridad absoluta.
                </div>
              </div>
            </div>
            <div className="services-grid">
              {/* 1) Firma Electrónica */}
              <div className="service-card premium-card" onClick={() => onServiceSelect('firma-electronica')}>
                <div className="service-card-badge">⭐ Más Popular</div>
                <div className="service-card-icon">✍️</div>
                <h3 className="service-card-title">Firma Electrónica</h3>
                <p className="service-card-description">Certificados digitales completos para firmar documentos electrónicamente. 
                Válidos para facturación electrónica, contratos y trámites gubernamentales.</p>
                <div className="service-card-features">
                  <span className="feature-tag">📄 Facturación Electrónica</span>
                  <span className="feature-tag">🏛️ Trámites Gubernamentales</span>
                </div>
                <div className="service-card-meta">
                  <div className="service-card-status available">✅ Disponible</div>
                  <div className="service-card-duration">⚡ 30 minutos</div>
                  <div className="service-card-price">💰 Desde $7.50</div>
                </div>
              </div>

              {/* 2) RUC con Antigüedad */}
              <div className="service-card business-card" onClick={() => onServiceSelect('ruc-antiguedad')}>
                <div className="service-card-badge">🏢 Para Empresas</div>
                <div className="service-card-icon">📊</div>
                <h3 className="service-card-title">RUC con Antigüedad</h3>
                <p className="service-card-description">Documentación completa de RUC con historial de antigüedad. 
                Ideal para trámites bancarios, casas comerciales, visas y procesos corporativos.</p>
                <div className="service-card-features">
                  <span className="feature-tag">🏦 Trámites Bancarios</span>
                  <span className="feature-tag">✈️ Procesos de Visa</span>
                </div>
                <div className="service-card-meta">
                  <div className="service-card-status available">✅ Disponible</div>
                  <div className="service-card-duration">⏰ 3 horas</div>
                  <div className="service-card-price">💰 Desde $45.00</div>
                </div>
              </div>

              {/* 3) Reporte Equifax 360 */}
              <div className="service-card financial-card" onClick={() => onServiceSelect('reporte-equifax')}>
                <div className="service-card-badge">💳 Financiero</div>
                <div className="service-card-icon">📈</div>
                <h3 className="service-card-title">Reporte Equifax 360</h3>
                <p className="service-card-description">Reporte crediticio completo y detallado de Equifax. 
                Información actualizada sobre tu historial crediticio y capacidad de pago.</p>
                <div className="service-card-features">
                  <span className="feature-tag">📊 Historial Crediticio</span>
                  <span className="feature-tag">💼 Evaluación Financiera</span>
                </div>
                <div className="service-card-meta">
                  <div className="service-card-status available">✅ Disponible</div>
                  <div className="service-card-duration">⚡ 30 minutos</div>
                  <div className="service-card-price">💰 Desde $8.00</div>
                </div>
              </div>

              {/* Próximos Servicios */}
              <div className="service-card coming-soon-card">
                <div className="service-card-badge">🔮 Próximamente</div>
                <div className="service-card-icon">🔑</div>
                <h3 className="service-card-title">Clave Herencia SRI</h3>
                <p className="service-card-description">Gestión completa de claves de herencia para el Servicio de Rentas Internas. 
                Simplifica los procesos de sucesión y herencia.</p>
                <div className="service-card-features">
                  <span className="feature-tag">🏛️ SRI</span>
                  <span className="feature-tag">👥 Herencias</span>
                </div>
                <div className="service-card-status coming-soon">🚧 En Desarrollo</div>
              </div>

              <div className="service-card coming-soon-card">
                <div className="service-card-badge">🔮 Próximamente</div>
                <div className="service-card-icon">📅</div>
                <h3 className="service-card-title">RUC Fecha Actual</h3>
                <p className="service-card-description">Consulta de RUC con información actualizada al día. 
                Datos en tiempo real para decisiones informadas.</p>
                <div className="service-card-features">
                  <span className="feature-tag">📊 Tiempo Real</span>
                  <span className="feature-tag">📈 Datos Actualizados</span>
                </div>
                <div className="service-card-status coming-soon">🚧 En Desarrollo</div>
              </div>

              <div className="service-card coming-soon-card">
                <div className="service-card-badge">🔮 Próximamente</div>
                <div className="service-card-icon">🔍</div>
                <h3 className="service-card-title">Revisión de Crédito</h3>
                <p className="service-card-description">Análisis y revisión completa de historial crediticio. 
                Herramientas avanzadas para mejorar tu perfil crediticio.</p>
                <div className="service-card-features">
                  <span className="feature-tag">📊 Análisis Avanzado</span>
                  <span className="feature-tag">📈 Mejora Crediticia</span>
                </div>
                <div className="service-card-status coming-soon">🚧 En Desarrollo</div>
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
              <h1 className="service-title">Ayuda y Soporte</h1>
              <p className="service-description">
                Encuentra respuestas a tus preguntas y obtén soporte técnico especializado.
                Guías, tutoriales y contacto directo con nuestro equipo.
              </p>
            </div>
            <div className="coming-soon">
              <span className="coming-soon-icon">❓</span>
              <h2 className="coming-soon-title">En Desarrollo</h2>
              <p className="coming-soon-description">
                Centro de ayuda y soporte en desarrollo. 
                Pronto tendrás acceso a guías completas, FAQ y chat de soporte.
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
