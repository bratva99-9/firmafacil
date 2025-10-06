import React, { useState, useEffect } from 'react';

const DataDeletionConfirmation = () => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener código de confirmación de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('confirmation_code');
    
    if (code) {
      setConfirmationCode(code);
    }
    
    setIsLoading(false);
  }, []);

  const localStyles = `
    .deletion-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', sans-serif;
    }

    .deletion-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
    }

    .deletion-icon {
      font-size: 64px;
      margin-bottom: 20px;
      color: #10b981;
    }

    .deletion-title {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }

    .deletion-subtitle {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .confirmation-code {
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      color: #065f46;
      word-break: break-all;
    }

    .deletion-info {
      background: rgba(249, 250, 251, 0.9);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }

    .deletion-info h3 {
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .deletion-info ul {
      color: #4b5563;
      line-height: 1.6;
      margin: 0;
      padding-left: 20px;
    }

    .deletion-info li {
      margin-bottom: 8px;
    }

    .contact-info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .contact-info h3 {
      color: #1e40af;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .contact-info p {
      color: #1e40af;
      margin: 8px 0;
      font-weight: 500;
    }

    .back-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 20px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .back-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(102, 126, 234, 0.3);
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .deletion-container {
        padding: 15px;
      }

      .deletion-card {
        padding: 30px 20px;
      }

      .deletion-title {
        font-size: 24px;
      }

      .deletion-subtitle {
        font-size: 16px;
      }

      .deletion-icon {
        font-size: 48px;
      }
    }
  `;

  if (isLoading) {
    return (
      <div className="deletion-container">
        <style>{localStyles}</style>
        <div className="deletion-card">
          <div className="loading-spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deletion-container">
      <style>{localStyles}</style>
      
      <div className="deletion-card">
        <div className="deletion-icon">✅</div>
        
        <h1 className="deletion-title">
          Datos Eliminados Exitosamente
        </h1>
        
        <p className="deletion-subtitle">
          Tus datos personales han sido eliminados de nuestros sistemas de acuerdo con tu solicitud.
        </p>

        {confirmationCode && (
          <div className="confirmation-code">
            <strong>Código de Confirmación:</strong><br />
            {confirmationCode}
          </div>
        )}

        <div className="deletion-info">
          <h3>📋 Datos que fueron eliminados:</h3>
          <ul>
            <li>Información de perfil personal</li>
            <li>Solicitudes de firma electrónica</li>
            <li>Solicitudes de RUC con antigüedad</li>
            <li>Historial de transacciones</li>
            <li>Datos de contacto y comunicación</li>
            <li>Cualquier información asociada a tu cuenta</li>
          </ul>
        </div>

        <div className="contact-info">
          <h3>📞 ¿Necesitas ayuda?</h3>
          <p><strong>Email:</strong> info@ecucontable.com</p>
          <p><strong>Teléfono:</strong> +593 78823081</p>
          <p><strong>Dirección:</strong> 9 de Octubre 415 y Boyaca</p>
        </div>

        <button 
          className="back-button"
          onClick={() => window.location.href = 'https://ecucontable.com'}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default DataDeletionConfirmation;



