import React from 'react';

const PrivacyPolicy = ({ onBack }) => {
  const localStyles = `
    .privacy-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
      min-height: 100vh;
    }

    .privacy-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .privacy-title {
      font-size: 32px;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 10px;
    }

    .privacy-subtitle {
      font-size: 16px;
      color: #6b7280;
    }

    .privacy-content {
      line-height: 1.8;
      color: #374151;
    }

    .privacy-section {
      margin-bottom: 30px;
    }

    .privacy-section h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      padding-top: 20px;
    }

    .privacy-section h3 {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 10px;
      margin-top: 20px;
    }

    .privacy-section p {
      margin-bottom: 15px;
      font-size: 16px;
    }

    .privacy-section ul {
      margin-bottom: 15px;
      padding-left: 20px;
    }

    .privacy-section li {
      margin-bottom: 8px;
    }

    .contact-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #3b82f6;
      margin-top: 30px;
    }

    .contact-info h3 {
      color: #1f2937;
      margin-bottom: 10px;
    }

    .contact-info p {
      margin-bottom: 5px;
    }

    .last-updated {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .privacy-container {
        padding: 20px 15px;
      }
      
      .privacy-title {
        font-size: 28px;
      }
      
      .privacy-section h2 {
        font-size: 20px;
      }
      
      .privacy-section h3 {
        font-size: 16px;
      }
    }
  `;

  return (
    <div className="privacy-container">
      <style>{localStyles}</style>
      
      <div className="privacy-header">
        <button 
          onClick={onBack}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ← Volver
        </button>
        <h1 className="privacy-title">Política de Privacidad</h1>
        <p className="privacy-subtitle">ECUCONTABLE S.A.S.</p>
      </div>

      <div className="privacy-content">
        <div className="privacy-section">
          <h2>1. Información que Recopilamos</h2>
          <p>Recopilamos información que nos proporcionas directamente cuando:</p>
          <ul>
            <li>Te registras en nuestra plataforma</li>
            <li>Utilizas nuestros servicios de firma electrónica</li>
            <li>Solicitas certificados digitales</li>
            <li>Te comunicas con nosotros</li>
          </ul>
          
          <h3>Información Personal:</h3>
          <ul>
            <li>Nombre completo</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Información de identificación (cédula, RUC)</li>
            <li>Documentos para certificación</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>2. Cómo Utilizamos tu Información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul>
            <li>Proporcionar y mejorar nuestros servicios</li>
            <li>Procesar solicitudes de certificados digitales</li>
            <li>Verificar tu identidad</li>
            <li>Comunicarnos contigo sobre nuestros servicios</li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
            <li>Prevenir fraudes y mantener la seguridad</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>3. Compartir Información</h2>
          <p>No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:</p>
          <ul>
            <li>Cuando sea necesario para proporcionar nuestros servicios</li>
            <li>Para cumplir con requerimientos legales</li>
            <li>Con tu consentimiento explícito</li>
            <li>Para proteger nuestros derechos y seguridad</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>4. Seguridad de los Datos</h2>
          <p>Implementamos medidas de seguridad técnicas y organizacionales para proteger tu información:</p>
          <ul>
            <li>Encriptación de datos en tránsito y en reposo</li>
            <li>Acceso restringido a información personal</li>
            <li>Monitoreo continuo de seguridad</li>
            <li>Capacitación regular del personal</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>5. Tus Derechos</h2>
          <p>Tienes derecho a:</p>
          <ul>
            <li>Acceder a tu información personal</li>
            <li>Corregir información inexacta</li>
            <li>Solicitar la eliminación de tus datos</li>
            <li>Retirar tu consentimiento</li>
            <li>Recibir una copia de tus datos</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>6. Cookies y Tecnologías Similares</h2>
          <p>Utilizamos cookies y tecnologías similares para:</p>
          <ul>
            <li>Mejorar la funcionalidad del sitio web</li>
            <li>Recordar tus preferencias</li>
            <li>Analizar el uso del sitio</li>
            <li>Proporcionar contenido personalizado</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>7. Retención de Datos</h2>
          <p>Conservamos tu información personal durante el tiempo necesario para:</p>
          <ul>
            <li>Cumplir con los propósitos descritos en esta política</li>
            <li>Satisfacer requisitos legales y regulatorios</li>
            <li>Resolver disputas</li>
            <li>Hacer cumplir nuestros acuerdos</li>
          </ul>
        </div>

        <div className="contact-info">
          <h3>Contacto</h3>
          <p><strong>ECUCONTABLE S.A.S.</strong></p>
          <p>Email: info@ecucontable.com</p>
          <p>Teléfono: +593 78823081</p>
          <p>Dirección: 9 de Octubre 415 y Boyaca </p>
          <p>Si tienes preguntas sobre esta política de privacidad, contáctanos.</p>
        </div>

        <div className="last-updated">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
