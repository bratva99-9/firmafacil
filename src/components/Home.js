import React from 'react';

const Home = ({ onNavigate }) => {

  const servicios = [
    {
      id: 1,
      titulo: "Firma Electrónica",
      descripcion: "Certificado digital válido legalmente",
      precio: "$25.00",
      tiempo: "30 min",
      icono: "✍️"
    },
    {
      id: 2,
      titulo: "RUC con Antigüedad",
      descripcion: "Historial completo y certificación",
      precio: "$45.00",
      tiempo: "3 horas",
      icono: "📜"
    },
    {
      id: 3,
      titulo: "Reporte Equifax",
      descripcion: "Reporte crediticio completo",
      precio: "$8.00",
      tiempo: "30 min",
      icono: "📈"
    }
  ];

  const localStyles = `
    * {
      box-sizing: border-box;
    }

    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    /* Hero Section - Minimalista */
    .hero-wrapper {
      margin-bottom: 64px;
    }

    .hero-main {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }

    .hero-greeting {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 16px;
    }

    .hero-headline {
      font-size: 64px;
      font-weight: 900;
      line-height: 1.1;
      margin: 0 0 24px 0;
      color: #0a0e27;
      letter-spacing: -2px;
    }

    .hero-description {
      font-size: 20px;
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 40px 0;
      font-weight: 400;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary {
      padding: 14px 32px;
      background: #0a0e27;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: #1a1f3a;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(10, 14, 39, 0.2);
    }

    .btn-secondary {
      padding: 14px 32px;
      background: transparent;
      color: #0a0e27;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      border-color: #0a0e27;
      background: #f8fafc;
    }

    /* Servicios Grid - Moderno */
    .services-section {
      margin-bottom: 80px;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      text-align: center;
    }

    .section-heading {
      font-size: 42px;
      font-weight: 800;
      color: #0a0e27;
      text-align: center;
      margin: 0 0 48px 0;
      letter-spacing: -1.5px;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 28px;
    }

    .service-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .service-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }

    .service-item:hover {
      transform: translateY(-6px);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
      border-color: #cbd5e1;
    }

    .service-item:hover::before {
      transform: scaleX(1);
    }

    .service-header {
      padding: 32px 32px 24px;
    }

    .service-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .service-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .service-item:hover .service-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transform: scale(1.05);
      border-color: transparent;
    }

    .service-name {
      font-size: 24px;
      font-weight: 800;
      color: #0a0e27;
      margin-bottom: 12px;
      letter-spacing: -0.8px;
      line-height: 1.2;
    }

    .service-text {
      font-size: 15px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .service-footer {
      margin-top: auto;
      padding: 24px 32px 32px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .service-price-wrapper {
      display: flex;
      flex-direction: column;
    }

    .service-price-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .service-price {
      font-size: 36px;
      font-weight: 900;
      color: #0a0e27;
      line-height: 1;
      letter-spacing: -1.5px;
    }

    .service-meta-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .service-time {
      font-size: 13px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .service-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Stats Section - Elegante */
    .stats-section {
      background: #0a0e27;
      border-radius: 24px;
      padding: 64px 48px;
      margin-bottom: 80px;
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 48px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 56px;
      font-weight: 900;
      margin-bottom: 8px;
      letter-spacing: -2px;
    }

    .stat-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Benefits - Minimalista */
    .benefits-section {
      margin-bottom: 80px;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }

    .benefit-card {
      text-align: center;
      padding: 24px;
    }

    .benefit-emoji {
      font-size: 40px;
      margin-bottom: 16px;
      display: block;
    }

    .benefit-title {
      font-size: 16px;
      font-weight: 700;
      color: #0a0e27;
      margin-bottom: 8px;
    }

    .benefit-text {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-radius: 24px;
      padding: 64px 48px;
      text-align: center;
      border: 1px solid #f1f5f9;
    }

    .cta-heading {
      font-size: 48px;
      font-weight: 900;
      color: #0a0e27;
      margin: 0 0 16px 0;
      letter-spacing: -2px;
    }

    .cta-text {
      font-size: 18px;
      color: #64748b;
      margin: 0 0 32px 0;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .cta-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
    }

      .benefits-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 24px 16px;
      }
      
      .hero-headline {
        font-size: 40px;
      }
      
      .hero-description {
        font-size: 18px;
      }
      
      .section-heading {
        font-size: 32px;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }
      
      .service-item {
        padding: 24px;
      }
      
      .stats-section {
        padding: 48px 32px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
      }
      
      .stat-value {
        font-size: 40px;
      }
      
      .benefits-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      
      .cta-section {
        padding: 48px 32px;
      }
      
      .cta-heading {
        font-size: 32px;
      }
      
      .cta-text {
        font-size: 16px;
      }
      
      .hero-actions,
      .cta-buttons {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
      }
    }
  `;

  return (
    <div className="home-container">
      <style>{localStyles}</style>
      
      {/* Hero Minimalista */}
      <div className="hero-wrapper">
        <div className="hero-main">
          <div className="hero-greeting">Bienvenido</div>
          <h1 className="hero-headline">
            Soluciones Tributarias<br />
            para tu Negocio
          </h1>
          <p className="hero-description">
            Simplificamos tus trámites tributarios con tecnología avanzada. 
            Rápido, seguro y completamente digital.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={() => onNavigate('enviar-tramites')}
            >
              Ver Servicios
            </button>
            <button 
              className="btn-secondary"
              onClick={() => onNavigate('consultar-estado')}
            >
              Mis Trámites
            </button>
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div className="services-section">
        <div className="section-label">Servicios</div>
        <h2 className="section-heading">Lo que ofrecemos</h2>
        <div className="services-grid">
          {servicios.map(servicio => (
            <div 
              key={servicio.id}
              className="service-item"
              onClick={() => {
                if (servicio.titulo === "Firma Electrónica") {
                  onNavigate('firma-electronica');
                } else if (servicio.titulo === "RUC con Antigüedad") {
                  onNavigate('ruc-antiguedad');
                } else if (servicio.titulo === "Reporte Equifax") {
                  onNavigate('reporte-equifax');
                }
              }}
            >
              <div className="service-header">
                <div className="service-icon-wrapper">
                  <div className="service-icon">{servicio.icono}</div>
          </div>
                <h3 className="service-name">{servicio.titulo}</h3>
                <p className="service-text">{servicio.descripcion}</p>
          </div>
              <div className="service-footer">
                <div className="service-price-wrapper">
                  <div className="service-price-label">Desde</div>
                  <div className="service-price">{servicio.precio}</div>
          </div>
                <div className="service-meta-right">
                  <span className="service-time">⏱️ {servicio.tiempo}</span>
                  <span className="service-badge">Disponible</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">10K+</div>
            <div className="stat-label">Trámites</div>
              </div>
          <div className="stat-item">
            <div className="stat-value">98%</div>
            <div className="stat-label">Satisfacción</div>
            </div>
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Soporte</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">100%</div>
            <div className="stat-label">Seguro</div>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="benefits-section">
        <div className="section-label">Ventajas</div>
        <h2 className="section-heading">¿Por qué elegirnos?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-emoji">🔒</span>
            <h3 className="benefit-title">Seguridad</h3>
            <p className="benefit-text">Encriptación de nivel empresarial</p>
                </div>
          <div className="benefit-card">
            <span className="benefit-emoji">⚡</span>
            <h3 className="benefit-title">Rapidez</h3>
            <p className="benefit-text">Trámites en minutos</p>
              </div>
          <div className="benefit-card">
            <span className="benefit-emoji">📱</span>
            <h3 className="benefit-title">Digital</h3>
            <p className="benefit-text">100% online</p>
              </div>
          <div className="benefit-card">
            <span className="benefit-emoji">🎯</span>
            <h3 className="benefit-title">Legal</h3>
            <p className="benefit-text">Validez completa</p>
            </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="cta-section">
        <h2 className="cta-heading">¿Listo para comenzar?</h2>
        <p className="cta-text">
          Únete a miles de empresas que confían en nosotros para sus trámites tributarios
        </p>
        <div className="cta-buttons">
            <button 
            className="btn-primary"
              onClick={() => onNavigate('firma-electronica')}
            >
            Comenzar Ahora
            </button>
            <button 
            className="btn-secondary"
              onClick={() => onNavigate('consultar-estado')}
            >
            Consultar Estado
            </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
