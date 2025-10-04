import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Register = ({ onRegisterSuccess, onSwitchToLogin, onShowPrivacyPolicy }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const localStyles = `
    .register-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 60px 20px 20px;
    }

    .register-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .register-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .register-logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 12px;
      display: block;
      object-fit: contain;
    }

    .register-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .register-subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .register-description {
      color: #6b7280;
      font-size: 16px;
    }

    .register-form {
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

    .register-button {
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

    .register-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .register-button:disabled {
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

    .success-message {
      background: rgba(240, 253, 244, 0.9);
      border: 1px solid #bbf7d0;
      color: #166534;
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
      line-height: 1.4;
    }

    .password-requirements {
      background: rgba(249, 250, 251, 0.9);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      color: #6b7280;
      margin-top: 8px;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 16px;
    }

    .password-requirements li {
      margin-bottom: 4px;
    }

    @media (max-width: 768px) {
      .register-wrapper {
        padding: 30px 15px 15px;
        align-items: flex-start;
      }
      
      .register-container {
        padding: 30px 25px;
        max-width: 100%;
        margin-top: 0;
      }
      
      .register-title {
        font-size: 20px;
      }
      
      .register-subtitle {
        font-size: 12px;
      }
      
      .register-description {
        font-size: 14px;
      }
      
      .register-logo {
        width: 50px;
        height: 50px;
      }
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;

      // Mostrar mensaje de éxito
      setError('');
      alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
      
      // Opcional: cambiar a login automáticamente
      onSwitchToLogin();
      
    } catch (error) {
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <style>{localStyles}</style>
      
      <div className="register-container">
        <div className="register-header">
          <img src="/logo.png" alt="ECUCONTABLE" className="register-logo" />
          <h1 className="register-title">ECUCONTABLE S.A.S.</h1>
          <p className="register-subtitle">Soluciones Contables y tributarias</p>
          <p className="register-description">Crea tu cuenta</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="tu@email.com"
            disabled={loading}
          />

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Tu contraseña"
              disabled={loading}
            />
            <div className="password-requirements">
              <strong>Requisitos de contraseña:</strong>
              <ul>
                <li>Mínimo 6 caracteres</li>
                <li>Recomendamos usar letras y números</li>
              </ul>
            </div>
          </div>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            placeholder="Confirma tu contraseña"
            disabled={loading}
          />

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="switch-form">
          ¿Ya tienes una cuenta?{' '}
          <span 
            className="switch-link"
            onClick={onSwitchToLogin}
          >
            Inicia sesión aquí
          </span>
        </div>

        <div className="privacy-link">
          Al registrarte, aceptas nuestra{' '}
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

export default Register;
