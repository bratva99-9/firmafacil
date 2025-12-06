import React from 'react';
import { supabase } from '../lib/supabase';

const Sidebar = ({ activeService, onServiceSelect, onLogout }) => {
  const servicios = [
    {
      id: 'home',
      titulo: 'Inicio',
      icono: '🏠',
      descripcion: 'Panel principal'
    },
    {
      id: 'enviar-tramites',
      titulo: 'Enviar Trámites',
      icono: '📤',
      descripcion: 'Enviar solicitudes'
    },
    {
      id: 'consultar-estado',
      titulo: 'Consultar mis tramites',
      icono: '🔍',
      descripcion: 'Estado de trámites'
    },
    {
      id: 'trabajar-nosotros',
      titulo: 'Trabaja con Nosotros',
      icono: '🤝',
      descripcion: 'Oportunidades laborales'
    },
    {
      id: 'ayuda',
      titulo: 'Ayuda',
      icono: '❓',
      descripcion: 'Soporte y ayuda'
    }
    ,
    {
      id: 'herramientas',
      titulo: 'Herramientas',
      icono: '🧰',
      descripcion: 'Búsquedas y utilidades'
    },
    {
      id: 'historial-pagos',
      titulo: 'Historial de Pagos',
      icono: '💳',
      descripcion: 'Ver mis pagos realizados'
    }
  ];

  const localStyles = `
    .sidebar {
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      box-shadow: 4px 0 20px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }

    .sidebar-logo {
      color: white;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 8px;
    }

    .sidebar-logo:hover {
      background: rgba(255,255,255,0.1);
      transform: scale(1.02);
    }

    .sidebar-logo-icon {
      width: 45px;
      height: 45px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .sidebar-logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .sidebar-logo-title {
      font-size: 18px;
      font-weight: 800;
      color: white;
      margin: 0;
    }

    .sidebar-logo-subtitle {
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.7);
      margin: 0;
      margin-top: 2px;
    }

    .sidebar-nav {
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .nav-section {
      flex: 1;
      padding: 16px 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      margin: 2px 0;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
      position: relative;
      border-radius: 0 8px 8px 0;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.08);
      color: white;
      border-left-color: rgba(255,255,255,0.4);
      transform: translateX(2px);
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.15) 100%);
      color: white;
      border-left-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 20px;
      background: #667eea;
      border-radius: 2px 0 0 2px;
    }

    .nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    .nav-content {
      flex: 1;
    }

    .nav-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .nav-description {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      font-weight: 300;
    }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
      background: rgba(0,0,0,0.1);
      margin-top: auto;
    }

    .footer-text {
      color: rgba(255,255,255,0.5);
      font-size: 11px;
      text-align: center;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .logout-button {
      width: 100%;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .logout-button:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.6);
      color: #f87171;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      
      .sidebar.open {
        transform: translateX(0);
      }
    }
  `;

  return (
    <div className="sidebar">
      <style>{localStyles}</style>
      
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => onServiceSelect('home')}>
          <img src="/logo.png" alt="ECUCONTABLE" className="sidebar-logo-icon" />
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title">ECUCONTABLE SAS</div>
            <div className="sidebar-logo-subtitle">Soluciones Contables</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {servicios.map(servicio => (
            <div
              key={servicio.id}
              className={`nav-item ${activeService === servicio.id ? 'active' : ''}`}
              onClick={() => onServiceSelect(servicio.id)}
            >
              <span className="nav-icon">{servicio.icono}</span>
              <div className="nav-content">
                <div className="nav-title">{servicio.titulo}</div>
                <div className="nav-description">{servicio.descripcion}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="footer-text">
            © 2024 ECUCONTABLE<br />
            Soluciones Digitales de Confianza
          </div>
          <button 
            className="logout-button"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                onLogout();
              } catch (error) {
                console.error('Error al cerrar sesión:', error);
                onLogout();
              }
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
