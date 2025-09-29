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
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 20px;
    }

    .service-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.1);
      border-color: #667eea;
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
      font-size: 48px;
      margin-bottom: 16px;
      display: block;
    }

    .service-card-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .service-card-description {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .service-card-status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .service-card:not(.coming-soon-card) .service-card-status {
      background: #dcfce7;
      color: #166534;
    }

    .service-card.coming-soon-card .service-card-status {
      background: #fef3c7;
      color: #92400e;
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
                Selecciona el servicio que necesitas y completa tu solicitud de forma rápida y segura.
              </p>
            </div>
            <div className="services-grid">
              <div className="service-card" onClick={() => onServiceSelect('firma-electronica')}>
                <div className="service-card-icon">✍️</div>
                <h3 className="service-card-title">Firma Electrónica</h3>
                <p className="service-card-description">Certificado digital básico para firmar documentos electrónicamente</p>
                <div className="service-card-status">Disponible</div>
              </div>
              
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
              
              <div className="service-card" onClick={() => onServiceSelect('ruc-antiguedad')}>
                <div className="service-card-icon">📊</div>
                <h3 className="service-card-title">RUC con Antigüedad</h3>
                <p className="service-card-description">Consulta de RUC con información histórica y gestión de antigüedad</p>
                <div className="service-card-status">Disponible</div>
              </div>
              
              <div className="service-card coming-soon-card">
                <div className="service-card-icon">📈</div>
                <h3 className="service-card-title">Reporte Equifax 360</h3>
                <p className="service-card-description">Reporte crediticio completo de Equifax</p>
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
                Oportunidades laborales en tecnología, atención al cliente y más.
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
