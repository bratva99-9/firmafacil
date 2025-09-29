import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserProfile = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    empresa: ''
  });

  const localStyles = `
    .profile-wrapper {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin-bottom: 30px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
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
      font-weight: 700;
    }

    .profile-info h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .profile-info p {
      color: #6b7280;
      font-size: 16px;
    }

    .profile-actions {
      margin-left: auto;
      display: flex;
      gap: 12px;
    }

    .profile-button {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .edit-button {
      background: #f3f4f6;
      color: #374151;
    }

    .edit-button:hover {
      background: #e5e7eb;
    }

    .logout-button {
      background: #fef2f2;
      color: #dc2626;
    }

    .logout-button:hover {
      background: #fee2e2;
    }

    .profile-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
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

    .form-input:disabled {
      background: #f9fafb;
      color: #6b7280;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .save-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .save-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .cancel-button {
      background: #f3f4f6;
      color: #374151;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cancel-button:hover {
      background: #e5e7eb;
    }

    .account-info {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }

    .account-info h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .account-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .account-detail {
      display: flex;
      flex-direction: column;
    }

    .account-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .account-value {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
      
      .profile-actions {
        margin-left: 0;
        margin-top: 16px;
      }
      
      .profile-form {
        grid-template-columns: 1fr;
      }
    }
  `;

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          empresa: data.empresa || ''
        });
      } else {
        // Crear perfil básico si no existe
        setFormData({
          nombre: user.user_metadata?.nombre || '',
          apellido: user.user_metadata?.apellido || '',
          telefono: '',
          empresa: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const profileData = {
        id: user.id,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        empresa: formData.empresa,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;

      setProfile(profileData);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="profile-wrapper">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          Cargando perfil...
        </div>
      </div>
    );
  }

  const getInitials = () => {
    const nombre = formData.nombre || profile?.nombre || '';
    const apellido = formData.apellido || profile?.apellido || '';
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
  };

  return (
    <div className="profile-wrapper">
      <style>{localStyles}</style>
      
      <div className="profile-header">
        <div className="profile-avatar">
          {getInitials()}
        </div>
        
        <div className="profile-info">
          <h2>
            {formData.nombre || profile?.nombre || 'Usuario'} {formData.apellido || profile?.apellido || ''}
          </h2>
          <p>{user.email}</p>
        </div>

        <div className="profile-actions">
          <button 
            className="profile-button edit-button"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
          <button 
            className="profile-button logout-button"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="profile-form">
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            className="form-input"
            disabled={!editing}
            placeholder="Tu nombre"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Apellido</label>
          <input
            type="text"
            value={formData.apellido}
            onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
            className="form-input"
            disabled={!editing}
            placeholder="Tu apellido"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
            className="form-input"
            disabled={!editing}
            placeholder="Tu teléfono"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Empresa</label>
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
            className="form-input"
            disabled={!editing}
            placeholder="Tu empresa"
          />
        </div>
      </div>

      {editing && (
        <div className="form-actions">
          <button className="save-button" onClick={handleSave}>
            Guardar Cambios
          </button>
          <button 
            className="cancel-button" 
            onClick={() => {
              setEditing(false);
              fetchProfile(); // Reset form data
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="account-info">
        <h3>Información de la Cuenta</h3>
        <div className="account-details">
          <div className="account-detail">
            <div className="account-label">Email</div>
            <div className="account-value">{user.email}</div>
          </div>
          <div className="account-detail">
            <div className="account-label">Miembro desde</div>
            <div className="account-value">
              {new Date(user.created_at).toLocaleDateString('es-ES')}
            </div>
          </div>
          <div className="account-detail">
            <div className="account-label">Última actualización</div>
            <div className="account-value">
              {profile?.updated_at 
                ? new Date(profile.updated_at).toLocaleDateString('es-ES')
                : 'Nunca'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;


