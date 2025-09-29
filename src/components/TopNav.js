import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
// import UserProfile from './UserProfile';

const TopNav = ({ user, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);

  const localStyles = `
    .top-nav {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 40px;
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

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }

    .nav-logo-icon {
      font-size: 24px;
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

    @media (max-width: 768px) {
      .top-nav {
        padding: 12px 20px;
      }
      
      .nav-logo {
        font-size: 18px;
      }
      
      .user-info {
        display: none;
      }
      
      .profile-dropdown {
        min-width: 280px;
        right: -20px;
      }
    }
  `;

  const getInitials = () => {
    const nombre = user.user_metadata?.nombre || '';
    const apellido = user.user_metadata?.apellido || '';
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase() || 'U';
  };

  const getUserName = () => {
    const nombre = user.user_metadata?.nombre || '';
    const apellido = user.user_metadata?.apellido || '';
    return `${nombre} ${apellido}`.trim() || 'Usuario';
  };

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
          <div className="nav-logo">
            <span className="nav-logo-icon">🔐</span>
            <span>FIRMAFACIL SAS</span>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-menu">
            <button 
              className={`user-button ${showProfile ? 'open' : ''}`}
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="user-avatar">
                {getInitials()}
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
                    <div className="profile-avatar-large">
                      {getInitials()}
                    </div>
                    <div className="profile-details">
                      <h3>{getUserName()}</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="profile-actions">
                    <button 
                      className="profile-action-button view-profile-button"
                      onClick={() => {
                        // Aquí podrías abrir un modal con el perfil completo
                        setShowProfile(false);
                      }}
                    >
                      Ver Perfil
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
    </>
  );
};

export default TopNav;
