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
        padding: 20px;
      }
      
      .service-header {
        padding: 20px;
      }
      
      .service-title {
        font-size: 24px;
      }

      .services-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .service-card {
        padding: 20px;
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
                  Tu tranquilidad es nuestra prioridad: cada servicio está protegido con tecnología de seguridad avanzada para garantizar la integridad de tus documentos.
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
                  <div className="service-card-price">Desde $35</div>
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
            <FormularioSolicitud user={user} />
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

  return (
    <div className="main-content">
      <style>{localStyles}</style>
      <div className="content-wrapper">
        {renderServiceContent()}
      </div>
    </div>
  );
};

export default MainContent;
