import React from 'react';
import { supabase } from '../lib/supabase';

const Sidebar = ({ activeService, onServiceSelect, onLogout, user }) => {
  
  const getInitials = () => {
    if (!user) return 'U';
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const firstName = user.user_metadata?.given_name || '';
    const lastName = user.user_metadata?.family_name || '';
    
    if (fullName) {
      const names = fullName.split(' ');
      return (names[0]?.charAt(0) || '') + (names[1]?.charAt(0) || '');
    }
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!user) return 'Usuario';
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const firstName = user.user_metadata?.given_name || '';
    const lastName = user.user_metadata?.family_name || '';
    
    if (fullName) {
      return fullName;
    }
    
    return `${firstName} ${lastName}`.trim() || 'Usuario';
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };
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
    }
  ];

  const localStyles = `
    .sidebar {
      width: 240px;
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
      padding: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }

    .user-section {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .user-info-card {
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .user-info-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: 600;
      flex-shrink: 0;
      background-size: cover;
      background-position: center;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: white;
      margin-bottom: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 10px;
      color: rgba(255,255,255,0.7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }


    .sidebar-logo {
      color: white;
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 4px;
      border-radius: 6px;
    }

    .sidebar-logo:hover {
      background: rgba(255,255,255,0.1);
      transform: scale(1.02);
    }

    .sidebar-logo-icon {
      width: 32px;
      height: 32px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .sidebar-logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .sidebar-logo-title {
      font-size: 14px;
      font-weight: 800;
      color: white;
      margin: 0;
    }

    .sidebar-logo-subtitle {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255,255,255,0.7);
      margin: 0;
      margin-top: 1px;
    }

    .sidebar-nav {
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      min-height: 0;
    }

    .nav-section {
      flex: 1;
      padding: 8px 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin: 1px 0;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 2px solid transparent;
      position: relative;
      border-radius: 0 6px 6px 0;
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
      width: 3px;
      height: 16px;
      background: #667eea;
      border-radius: 2px 0 0 2px;
    }

    .nav-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-content {
      flex: 1;
      min-width: 0;
    }

    .nav-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 1px;
      line-height: 1.2;
    }

    .nav-description {
      font-size: 10px;
      color: rgba(255,255,255,0.6);
      font-weight: 300;
      line-height: 1.2;
    }

    .sidebar-footer {
      padding: 10px 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
      background: rgba(0,0,0,0.1);
      margin-top: auto;
    }

    .footer-text {
      color: rgba(255,255,255,0.5);
      font-size: 9px;
      text-align: center;
      line-height: 1.3;
      margin-bottom: 8px;
    }

    .logout-button {
      width: 100%;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
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
    <>
    <div className="sidebar">
      <style>{localStyles}</style>
      
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => onServiceSelect('home')}>
          <img src="/logo.png" alt="ECUCONTABLE" className="sidebar-logo-icon" />
          <div className="sidebar-logo-text">
              <div className="sidebar-logo-title">Ecucontable SAS</div>
              <div className="sidebar-logo-subtitle">Soluciones tributarias</div>
            </div>
          </div>

          {user && (
            <div className="user-section">
              <div className="user-info-card">
                <div className="user-info-header">
                  <div 
                    className="user-avatar"
                    style={{
                      backgroundImage: getUserAvatar() ? `url(${getUserAvatar()})` : undefined,
                      backgroundColor: getUserAvatar() ? 'transparent' : undefined
                    }}
                  >
                    {!getUserAvatar() && getInitials()}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{getUserName()}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              </div>
        </div>
          )}
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

    </>
  );
};

export default Sidebar;
