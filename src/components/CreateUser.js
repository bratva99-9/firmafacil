import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const CreateUser = ({ onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const localStyles = `
    .create-user-wrapper {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin-bottom: 30px;
    }

    .create-user-header {
      margin-bottom: 24px;
    }

    .create-user-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .create-user-subtitle {
      color: #6b7280;
      font-size: 16px;
    }

    .create-user-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .create-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .create-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .create-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .success-message {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #16a34a;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
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

    .password-info {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    @media (max-width: 768px) {
      .create-user-form {
        grid-template-columns: 1fr;
      }
    }
  `;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.nombre || !formData.apellido) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: {
          nombre: formData.nombre,
          apellido: formData.apellido,
        }
      });

      if (error) throw error;

      setSuccess(`Usuario creado exitosamente: ${formData.email}`);
      setFormData({
        email: '',
        password: '',
        nombre: '',
        apellido: ''
      });
      
      if (onUserCreated) {
        onUserCreated(data.user);
      }
    } catch (error) {
      setError(error.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-wrapper">
      <style>{localStyles}</style>
      
      <div className="create-user-header">
        <h2 className="create-user-title">Crear Nuevo Usuario</h2>
        <p className="create-user-subtitle">Agrega un nuevo usuario al sistema</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-user-form">
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Nombre del usuario"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Apellido</label>
          <input
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Apellido del usuario"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="usuario@email.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Contraseña temporal"
            disabled={loading}
          />
          <div className="password-info">
            Mínimo 6 caracteres. El usuario podrá cambiarla después.
          </div>
        </div>
      </form>

      <button 
        type="submit" 
        className="create-button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            Creando usuario...
          </>
        ) : (
          'Crear Usuario'
        )}
      </button>
    </div>
  );
};

export default CreateUser;


