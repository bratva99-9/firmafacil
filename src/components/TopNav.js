import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import UserProfile from './UserProfile';

const TopNav = ({ user, onLogout, activeService, onServiceSelect }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const localStyles = `
    .top-nav {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 40px 16px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .mobile-menu-button {
      display: none;
      background: none;
      border: none;
      font-size: 24px;
      color: #1f2937;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .mobile-menu-button:hover {
      background: #f3f4f6;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 8px;
    }

    .nav-logo:hover {
      background: rgba(0,0,0,0.05);
      transform: scale(1.02);
    }

    .nav-logo-icon {
      width: 32px;
      height: 32px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .nav-logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .nav-logo-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .nav-logo-subtitle {
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
      margin: 0;
      margin-top: -1px;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-menu {
      position: relative;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .user-button:hover {
      background: #f1f5f9;
      border-color: #d1d5db;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: white;
      font-weight: 600;
      background-size: cover;
      background-position: center;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.2;
    }

    .user-email {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.2;
    }

    .dropdown-icon {
      font-size: 12px;
      color: #6b7280;
      transition: transform 0.3s ease;
    }

    .user-button.open .dropdown-icon {
      transform: rotate(180deg);
    }

    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      min-width: 300px;
      z-index: 1000;
    }

    .profile-content {
      padding: 20px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .profile-avatar-large {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: white;
      font-weight: 600;
      background-size: cover;
      background-position: center;
    }

    .profile-details h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 2px;
    }

    .profile-details p {
      font-size: 14px;
      color: #6b7280;
    }

    .profile-actions {
      display: flex;
      gap: 8px;
    }

    .profile-action-button {
      flex: 1;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .view-profile-button {
      background: #f3f4f6;
      color: #374151;
    }

    .view-profile-button:hover {
      background: #e5e7eb;
    }

    .logout-button {
      background: #fef2f2;
      color: #dc2626;
    }

    .logout-button:hover {
      background: #fee2e2;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.1);
      z-index: 99;
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      display: none;
    }

    .mobile-menu-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      overflow-y: auto;
    }

    .mobile-menu.open .mobile-menu-content {
      transform: translateX(0);
    }

    .mobile-menu-header {
      padding: 16px 40px 16px 0px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0px;
    }

    .mobile-menu-logo {
      color: white;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 3px;
      padding-left: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 8px;
    }

    .mobile-menu-logo:hover {
      background: rgba(255,255,255,0.1);
      transform: scale(1.02);
    }

    .mobile-logo-icon {
      width: 29px;
      height: 29px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .mobile-logo-title {
      font-size: 14px;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .mobile-logo-subtitle {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255,255,255,0.7);
      margin: 0;
      margin-top: -1px;
    }

    .mobile-menu-close {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background 0.3s ease;
      font-weight: bold;
      margin-left: auto;
      margin-right: 16px;
    }

    .mobile-menu-close:hover {
      background: rgba(255,255,255,0.1);
    }

    .mobile-menu-nav {
      padding: 20px 0;
    }

    .mobile-nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
    }

    .mobile-nav-item:hover {
      background: rgba(255,255,255,0.08);
      color: white;
      border-left-color: rgba(255,255,255,0.4);
    }

    .mobile-nav-item.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.15) 100%);
      color: white;
      border-left-color: #667eea;
    }

    .mobile-nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    .mobile-nav-content {
      flex: 1;
    }

    .mobile-nav-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .mobile-nav-description {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    }

    .mobile-menu-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.1);
    }

    .mobile-logout-button {
      width: 100%;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .mobile-logout-button:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.6);
      color: #f87171;
    }

    @media (max-width: 768px) {
      .top-nav {
        padding: 12px 20px 12px 12px;
      }
      
      .mobile-menu-button {
        display: block;
      }
      
      .nav-logo-title {
        font-size: 14px;
      }
      
      .nav-logo-subtitle {
        font-size: 10px;
      }
      
      .nav-logo-icon {
        width: 29px;
        height: 29px;
      }
      
      .user-info {
        display: none;
      }
      
      .profile-dropdown {
        min-width: 280px;
        right: -20px;
      }

      .mobile-menu {
        display: block;
      }
    }
  `;

  const getInitials = () => {
    // Priorizar información de Google
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
    // Priorizar información de Google
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const firstName = user.user_metadata?.given_name || '';
    const lastName = user.user_metadata?.family_name || '';
    
    if (fullName) {
      return fullName;
    }
    
    return `${firstName} ${lastName}`.trim() || 'Usuario';
  };

  const getUserAvatar = () => {
    // Usar foto de perfil de Google si está disponible
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  const getUserInfo = () => {
    return {
      name: getUserName(),
      email: user.email,
      avatar: getUserAvatar(),
      provider: user.app_metadata?.provider || 'email',
      verified: user.email_confirmed_at ? true : false,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
      // Información adicional de Google
      locale: user.user_metadata?.locale,
      emailVerified: user.user_metadata?.email_verified
    };
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
      titulo: 'Consultar Estado',
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowProfile(false);
      onLogout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así llamar a onLogout para limpiar el estado local
      onLogout();
    }
  };

  return (
    <>
      <div className="top-nav">
        <style>{localStyles}</style>
        
        <div className="nav-left">
          <button 
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(true)}
          >
            ☰
          </button>
          <div className="nav-logo" onClick={() => onServiceSelect('home')}>
            <img src="/logo.png" alt="ECUCONTABLE" className="nav-logo-icon" />
            <div className="nav-logo-text">
              <div className="nav-logo-title">ECUCONTABLE SAS</div>
              <div className="nav-logo-subtitle">Soluciones Contables</div>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-menu">
            <button 
              className={`user-button ${showProfile ? 'open' : ''}`}
              onClick={() => setShowProfile(!showProfile)}
            >
              <div 
                className="user-avatar"
                style={{
                  backgroundImage: getUserAvatar() ? `url(${getUserAvatar()})` : undefined,
                  backgroundColor: getUserAvatar() ? 'transparent' : undefined
                }}
              >
                {!getUserAvatar() && getInitials()}
              </div>
              <div className="user-info">
                <div className="user-name">{getUserName()}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <span className="dropdown-icon">▼</span>
            </button>

            {showProfile && (
              <div className="profile-dropdown">
                <div className="profile-content">
                  <div className="profile-header">
                    <div 
                      className="profile-avatar-large"
                      style={{
                        backgroundImage: getUserAvatar() ? `url(${getUserAvatar()})` : undefined,
                        backgroundColor: getUserAvatar() ? 'transparent' : undefined
                      }}
                    >
                      {!getUserAvatar() && getInitials()}
                    </div>
                    <div className="profile-details">
                      <h3>{getUserName()}</h3>
                      <p>{user.email}</p>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                        <div>Proveedor: {getUserInfo().provider === 'google' ? 'Google' : 'Email'}</div>
                        <div>Verificado: {getUserInfo().verified ? 'Sí' : 'No'}</div>
                        {getUserInfo().locale && <div>Idioma: {getUserInfo().locale}</div>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="profile-actions">
                    <button 
                      className="profile-action-button view-profile-button"
                      onClick={() => {
                        setShowProfile(false);
                        setShowProfileModal(true);
                      }}
                    >
                      Ver Perfil Completo
                    </button>
                    <button 
                      className="profile-action-button logout-button"
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfile && (
        <div className="overlay" onClick={() => setShowProfile(false)} />
      )}

      {showProfileModal && (
        <UserProfile 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}

      {showMobileMenu && (
        <div className="mobile-menu open" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <button 
                className="mobile-menu-close"
                onClick={() => setShowMobileMenu(false)}
              >
                ☰
              </button>
              <div className="mobile-menu-logo" onClick={() => { onServiceSelect('home'); setShowMobileMenu(false); }}>
                <img src="/logo.png" alt="ECUCONTABLE" className="mobile-logo-icon" />
                <div className="mobile-logo-text">
                  <div className="mobile-logo-title">ECUCONTABLE SAS</div>
                  <div className="mobile-logo-subtitle">Soluciones Contables</div>
                </div>
              </div>
            </div>

            <nav className="mobile-menu-nav">
              {servicios.map(servicio => (
                <div
                  key={servicio.id}
                  className={`mobile-nav-item ${activeService === servicio.id ? 'active' : ''}`}
                  onClick={() => {
                    onServiceSelect(servicio.id);
                    setShowMobileMenu(false);
                  }}
                >
                  <span className="mobile-nav-icon">{servicio.icono}</span>
                  <div className="mobile-nav-content">
                    <div className="mobile-nav-title">{servicio.titulo}</div>
                    <div className="mobile-nav-description">{servicio.descripcion}</div>
                  </div>
                </div>
              ))}
            </nav>

            <div className="mobile-menu-footer">
              <button 
                className="mobile-logout-button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    onLogout();
                    setShowMobileMenu(false);
                  } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    onLogout();
                    setShowMobileMenu(false);
                  }
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
