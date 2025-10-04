import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Login = ({ onLoginSuccess, onSwitchToRegister, onShowPrivacyPolicy }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const localStyles = `
    .login-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 60px 20px 20px;
    }

    .login-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 12px;
      display: block;
      object-fit: contain;
    }

    .login-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .login-subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .login-description {
      color: #6b7280;
      font-size: 16px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-input {
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(5px);
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: white;
    }

    .login-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .login-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .login-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      background: rgba(254, 242, 242, 0.9);
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      text-align: center;
      backdrop-filter: blur(5px);
      margin-bottom: 20px;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }


    .google-button {
      background: white;
      color: #374151;
      border: 2px solid #e5e7eb;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      width: 100%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .google-button:hover {
      border-color: #d1d5db;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }

    .google-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .facebook-button {
      background: #1877F2;
      color: #ffffff;
      border: 2px solid #1877F2;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      box-shadow: 0 2px 8px rgba(24, 119, 242, 0.3);
    }

    .facebook-button:hover {
      background: #166FE5;
      border-color: #166FE5;
      box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
      transform: translateY(-1px);
    }

    .facebook-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .switch-form {
      text-align: center;
      margin-top: 20px;
      color: #6b7280;
      font-size: 14px;
    }

    .switch-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.3s ease;
    }

    .switch-link:hover {
      color: #5a67d8;
    }

    .privacy-link {
      text-align: center;
      margin-top: 15px;
      color: #6b7280;
      font-size: 12px;
    }

    

    .google-icon {
      width: 18px;
      height: 18px;
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 20px 0;
      color: #6b7280;
      font-size: 14px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }

    .divider span {
      padding: 0 16px;
    }

    @media (max-width: 768px) {
      .login-wrapper {
        padding: 30px 15px 15px;
        align-items: flex-start;
      }
      
      .login-container {
        padding: 30px 25px;
        max-width: 100%;
        margin-top: 0;
      }
      
      .login-title {
        font-size: 20px;
      }
      
      .login-subtitle {
        font-size: 12px;
      }
      
      .login-description {
        font-size: 14px;
      }
      
      .login-logo {
        width: 50px;
        height: 50px;
      }
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      onLoginSuccess(data.user);
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión con Facebook');
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{localStyles}</style>
      
      <div className="login-container">
        <div className="login-header">
          <img src="/logo.png" alt="ECUCONTABLE" className="login-logo" />
          <h1 className="login-title">ECUCONTABLE S.A.S.</h1>
          <p className="login-subtitle">Soluciones Contables y tributarias</p>
          <p className="login-description">Inicia sesión en tu cuenta</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 10, fontWeight: 600, color: '#374151', textAlign: 'center' }}>Inicia sesión con</div>
          <button 
            onClick={handleGoogleLogin}
            className="google-button"
            disabled={loading}
            style={{ marginBottom: 10 }}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Iniciando...' : 'Continuar con Google'}
          </button>

          <button 
            onClick={handleFacebookLogin}
            className="facebook-button"
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#FFFFFF" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988H7.898v-2.89h2.54V9.797c0-2.507 1.493-3.89 3.778-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
            {loading ? 'Iniciando...' : 'Continuar con Facebook'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="divider">
          <span>o</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="tu@email.com"
            disabled={loading}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Tu contraseña"
            disabled={loading}
          />

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Iniciando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="switch-form">
          ¿No tienes una cuenta?{' '}
          <span 
            className="switch-link"
            onClick={onSwitchToRegister}
          >
            Regístrate aquí
          </span>
        </div>

        <div className="privacy-link">
          <span 
            className="switch-link"
            onClick={onShowPrivacyPolicy}
          >
            Política de Privacidad
          </span>
        </div>

      </div>
    </div>
  );
};

export default Login;
