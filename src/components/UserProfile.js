import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserProfile = ({ user, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  useEffect(() => {
    // Cargar teléfono actual del usuario
    const currentPhone = user.user_metadata?.phone || '';
    setPhoneNumber(currentPhone);
  }, [user]);

  const getUserInfo = () => {
    return {
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
      email: user.email,
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      provider: user.app_metadata?.provider || 'email',
      verified: user.email_confirmed_at ? true : false,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
      locale: user.user_metadata?.locale,
      emailVerified: user.user_metadata?.email_verified,
      givenName: user.user_metadata?.given_name,
      familyName: user.user_metadata?.family_name,
      picture: user.user_metadata?.picture
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdatePhone = async () => {
    setIsUpdatingPhone(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { phone: phoneNumber }
      });
      
      if (error) {
        console.error('Error al actualizar teléfono:', error);
        alert('Error al actualizar el teléfono');
      } else {
        alert('Teléfono actualizado correctamente');
        setIsEditingPhone(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el teléfono');
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const userInfo = getUserInfo();

  const localStyles = `
    .profile-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .profile-modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .profile-modal-header {
      padding: 24px 24px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .profile-modal-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .close-button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .profile-content {
      padding: 24px;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: white;
      font-weight: 600;
      margin: 0 auto 16px;
      background-size: cover;
      background-position: center;
    }

    .profile-name {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .profile-email {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .profile-provider {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f3f4f6;
      color: #374151;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .profile-section {
      margin-bottom: 24px;
    }

    .profile-section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .profile-info-grid {
      display: grid;
      gap: 12px;
    }

    .profile-info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .profile-info-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .profile-info-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #dcfce7;
      color: #166534;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .unverified-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #fef2f2;
      color: #dc2626;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .google-icon {
      width: 16px;
      height: 16px;
    }

    .phone-field {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .phone-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .phone-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .phone-actions {
      display: flex;
      gap: 4px;
    }

    .phone-button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .save-phone-button {
      background: #10b981;
      color: white;
    }

    .save-phone-button:hover {
      background: #059669;
    }

    .save-phone-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .cancel-phone-button {
      background: #f3f4f6;
      color: #374151;
    }

    .cancel-phone-button:hover {
      background: #e5e7eb;
    }

    .edit-phone-button {
      background: #667eea;
      color: white;
    }

    .edit-phone-button:hover {
      background: #5a67d8;
    }

    @media (max-width: 480px) {
      .profile-modal {
        padding: 10px;
      }
      
      .profile-modal-content {
        max-height: 95vh;
      }
      
      .profile-content {
        padding: 16px;
      }
    }
  `;

  return (
    <div className="profile-modal">
      <style>{localStyles}</style>
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">Perfil de Usuario</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-header">
            <div 
              className="profile-avatar"
              style={{
                backgroundImage: userInfo.avatar ? `url(${userInfo.avatar})` : undefined,
                backgroundColor: userInfo.avatar ? 'transparent' : undefined
              }}
            >
              {!userInfo.avatar && userInfo.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="profile-name">{userInfo.name}</h3>
            <p className="profile-email">{userInfo.email}</p>
            <div className="profile-provider">
              {userInfo.provider === 'google' && (
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {userInfo.provider === 'google' ? 'Google' : 'Email'}
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">Información Personal</h4>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Nombre completo:</span>
                <span className="profile-info-value">{userInfo.name}</span>
              </div>
              {userInfo.givenName && (
                <div className="profile-info-item">
                  <span className="profile-info-label">Nombre:</span>
                  <span className="profile-info-value">{userInfo.givenName}</span>
                </div>
              )}
              {userInfo.familyName && (
                <div className="profile-info-item">
                  <span className="profile-info-label">Apellido:</span>
                  <span className="profile-info-value">{userInfo.familyName}</span>
                </div>
              )}
              <div className="profile-info-item">
                <span className="profile-info-label">Email:</span>
                <span className="profile-info-value">{userInfo.email}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Estado:</span>
                <span className="profile-info-value">
                  {userInfo.verified ? (
                    <span className="verified-badge">✓ Verificado</span>
                  ) : (
                    <span className="unverified-badge">⚠ No verificado</span>
                  )}
                </span>
              </div>
              {userInfo.locale && (
                <div className="profile-info-item">
                  <span className="profile-info-label">Idioma:</span>
                  <span className="profile-info-value">{userInfo.locale}</span>
                </div>
              )}
              <div className="profile-info-item">
                <span className="profile-info-label">Teléfono:</span>
                <div className="phone-field">
                  {isEditingPhone ? (
                    <>
                      <input
                        type="tel"
                        className="phone-input"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Número de teléfono"
                        maxLength="15"
                      />
                      <div className="phone-actions">
                        <button
                          className="phone-button save-phone-button"
                          onClick={handleUpdatePhone}
                          disabled={isUpdatingPhone}
                        >
                          {isUpdatingPhone ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          className="phone-button cancel-phone-button"
                          onClick={() => {
                            setIsEditingPhone(false);
                            setPhoneNumber(user.user_metadata?.phone || '');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="profile-info-value">
                        {phoneNumber || 'No especificado'}
                      </span>
                      <button
                        className="phone-button edit-phone-button"
                        onClick={() => setIsEditingPhone(true)}
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">Información de Cuenta</h4>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Proveedor:</span>
                <span className="profile-info-value">
                  {userInfo.provider === 'google' ? 'Google OAuth' : 'Email/Password'}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Cuenta creada:</span>
                <span className="profile-info-value">{formatDate(userInfo.createdAt)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;