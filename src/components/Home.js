import React from 'react';

const Home = ({ onNavigate }) => {
  const comunicados = [
    {
      id: 1,
      titulo: 'Sistema de Firma Electrónica Disponible',
      fecha: '27 de Septiembre, 2025',
      contenido: 'Nuestro sistema de firma electrónica está completamente operativo con certificados digitales seguros y válidos legalmente.',
      tipo: 'nuevo',
      icono: '✍️',
      destacado: true
    },
    {
      id: 2,
      titulo: 'Nuevos Servicios en Desarrollo',
      fecha: 'Próximamente',
      contenido: 'Estamos trabajando en servicios adicionales como Clave Herencia SRI y consulta de RUC en tiempo real.',
      tipo: 'informacion',
      icono: '🚀',
      destacado: false
    }
  ];

  const servicios = [
    {
      id: 1,
      titulo: 'Firma Electrónica',
      descripcion: 'Certificado digital para firmar documentos electrónicamente',
      estado: 'Disponible',
      icono: '✍️',
      color: 'green'
    },
    {
      id: 2,
      titulo: 'RUC con Antigüedad',
      descripcion: 'Enfocado para tramites bancarios, casas comerciales y visas',
      estado: 'Disponible',
      icono: '📊',
      color: 'green'
    },
    {
      id: 3,
      titulo: 'Clave Herencia SRI',
      descripcion: 'Gestión de claves de herencia para el Servicio de Rentas Internas',
      estado: 'Próximamente',
      icono: '🔑',
      color: 'orange'
    },
    {
      id: 4,
      titulo: 'RUC Fecha Actual',
      descripcion: 'Consulta de RUC con información actualizada al día',
      estado: 'En Desarrollo',
      icono: '📅',
      color: 'blue'
    }
  ];

  const estadisticas = [
    {
      numero: '500+',
      descripcion: 'Trámites Procesados',
      icono: '📋',
      color: 'blue'
    },
    {
      numero: '99%',
      descripcion: 'Satisfacción del Cliente',
      icono: '⭐',
      color: 'green'
    },
    {
      numero: '24/7',
      descripcion: 'Soporte Disponible',
      icono: '🕒',
      color: 'purple'
    },
    {
      numero: '15 min',
      descripcion: 'Tiempo Promedio',
      icono: '⚡',
      color: 'orange'
    }
  ];

  const localStyles = `
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 40px 30px;
      text-align: center;
      color: white;
      margin-bottom: 30px;
      position: relative;
      overflow: hidden;
    }

    .hero-title {
      font-size: 42px;
      font-weight: 900;
      margin-bottom: 15px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .hero-subtitle {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 300;
      max-width: 600px;
      margin: 0 auto 25px;
      line-height: 1.5;
    }

    .hero-cta {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 25px;
    }

    .cta-button {
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.4);
      color: white;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-width: 200px;
      justify-content: center;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .cta-button:hover {
      background: rgba(255,255,255,0.35);
      border-color: rgba(255,255,255,0.6);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }

    .cta-button.primary {
      background: linear-gradient(45deg, #10b981, #059669);
      border-color: #10b981;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .cta-button.primary:hover {
      background: linear-gradient(45deg, #059669, #047857);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .cta-button.ruc-button {
      background: linear-gradient(45deg, #3b82f6, #2563eb);
      border-color: #3b82f6;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .cta-button.ruc-button:hover {
      background: linear-gradient(45deg, #2563eb, #1d4ed8);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    }

    .stats-section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .stats-title {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 25px;
      color: #1f2937;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      text-align: center;
      padding: 20px 15px;
      border-radius: 12px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .stat-icon {
      font-size: 36px;
      margin-bottom: 12px;
      display: block;
    }

    .stat-number {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 6px;
      color: #1f2937;
    }

    .stat-description {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .servicios-section {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 25px;
      color: #1f2937;
    }

    .servicios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .servicio-card {
      background: white;
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .servicio-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.15);
    }

    .servicio-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }

    .servicio-icon {
      font-size: 28px;
    }

    .servicio-titulo {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 5px;
      color: #1f2937;
    }

    .servicio-descripcion {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 15px;
      color: #4b5563;
    }

    .servicio-estado {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .servicio-estado.disponible {
      background: #dcfce7;
      color: #166534;
    }

    .servicio-estado.proximamente {
      background: #fef3c7;
      color: #92400e;
    }

    .servicio-estado.desarrollo {
      background: #dbeafe;
      color: #1e40af;
    }

    .comunicados-section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .comunicados-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .comunicado-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
      position: relative;
    }

    .comunicado-card:hover {
      transform: translateX(3px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }

    .comunicado-card.nuevo {
      border-left-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .comunicado-card.informacion {
      border-left-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    }

    .comunicado-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .comunicado-icon {
      font-size: 20px;
    }

    .comunicado-titulo {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      flex: 1;
    }

    .comunicado-fecha {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .comunicado-contenido {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 0 4px;
      }
      
      .hero-section {
        padding: 20px 12px;
        margin-bottom: 16px;
        border-radius: 12px;
      }
      
      .hero-title {
        font-size: 28px;
        margin-bottom: 10px;
      }
      
      .hero-subtitle {
        font-size: 14px;
        margin-bottom: 20px;
      }
      
      .hero-cta {
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
      }
      
      .cta-button {
        padding: 12px 20px;
        font-size: 14px;
        width: 100%;
        max-width: 300px;
        min-width: auto;
        border-radius: 10px;
      }
      
      .stats-section, .servicios-section, .comunicados-section {
        padding: 16px 12px;
        margin-bottom: 16px;
        border-radius: 12px;
      }
      
      .stats-title, .section-title {
        font-size: 22px;
        margin-bottom: 16px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .stat-card {
        padding: 16px 12px;
      }
      
      .stat-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }
      
      .stat-number {
        font-size: 22px;
        margin-bottom: 4px;
      }
      
      .stat-description {
        font-size: 12px;
      }
      
      .servicios-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .servicio-card {
        padding: 16px;
        border-radius: 12px;
      }
      
      .servicio-header {
        margin-bottom: 12px;
      }
      
      .servicio-icon {
        font-size: 24px;
      }
      
      .servicio-titulo {
        font-size: 16px;
      }
      
      .servicio-descripcion {
        font-size: 13px;
        margin-bottom: 12px;
      }
      
      .comunicados-grid {
        gap: 12px;
      }
      
      .comunicado-card {
        padding: 16px;
        border-radius: 10px;
      }
      
      .comunicado-header {
        margin-bottom: 8px;
      }
      
      .comunicado-icon {
        font-size: 18px;
      }
      
      .comunicado-titulo {
        font-size: 16px;
      }
      
      .comunicado-fecha {
        font-size: 11px;
      }
      
      .comunicado-contenido {
        font-size: 13px;
      }
    }
  `;

  return (
    <div className="home-container">
      <style>{localStyles}</style>
      
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">ECUCONTABLE SAS</h1>
          <p className="hero-subtitle">
            Soluciones Digitales de Confianza - Certificados digitales seguros y válidos legalmente
          </p>
          <div className="hero-cta">
            <button 
              className="cta-button primary"
              onClick={() => onNavigate('firma-electronica')}
            >
              ✍️ Solicitar Firma Electrónica
            </button>
            <button 
              className="cta-button ruc-button"
              onClick={() => onNavigate('ruc-antiguedad')}
            >
              📜 Solicitar RUC con Antiguedad
            </button>
            <button 
              className="cta-button"
              onClick={() => onNavigate('consultar-estado')}
            >
              🔍 Consultar mis tramites
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-section">
        <h2 className="stats-title">📊 Nuestros Números</h2>
        <div className="stats-grid">
          {estadisticas.map(stat => (
            <div key={stat.descripcion} className="stat-card">
              <span className="stat-icon">{stat.icono}</span>
              <div className="stat-number">{stat.numero}</div>
              <div className="stat-description">{stat.descripcion}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <div className="servicios-section">
        <h2 className="section-title">🚀 Nuestros Servicios</h2>
        <div className="servicios-grid">
          {servicios.map(servicio => (
            <div key={servicio.id} className="servicio-card">
              <div className="servicio-header">
                <span className="servicio-icon">{servicio.icono}</span>
                <div>
                  <h3 className="servicio-titulo">{servicio.titulo}</h3>
                  <span className={`servicio-estado ${servicio.estado.toLowerCase().replace(' ', '')}`}>
                    {servicio.estado}
                  </span>
                </div>
              </div>
              <p className="servicio-descripcion">{servicio.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comunicados */}
      <div className="comunicados-section">
        <h2 className="section-title">📢 Últimas Noticias</h2>
        <div className="comunicados-grid">
          {comunicados.map(comunicado => (
            <div key={comunicado.id} className={`comunicado-card ${comunicado.tipo}`}>
              <div className="comunicado-header">
                <span className="comunicado-icon">{comunicado.icono}</span>
                <h3 className="comunicado-titulo">{comunicado.titulo}</h3>
                <span className="comunicado-fecha">{comunicado.fecha}</span>
              </div>
              <p className="comunicado-contenido">{comunicado.contenido}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
