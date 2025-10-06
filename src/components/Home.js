import React from 'react';

const Home = ({ onNavigate }) => {

  // Datos de noticias
  const noticias = [
    {
      id: 1,
      titulo: "Nuevo sistema de firma electrónica disponible",
      contenido: "Ya puedes solicitar tu certificado digital de forma completamente online. Proceso simplificado y más rápido.",
      fecha: "15 Dic 2024",
      tipo: "nuevo",
      icono: "🆕"
    },
    {
      id: 2,
      titulo: "Mantenimiento programado del sistema",
      contenido: "El próximo domingo realizaremos mantenimiento preventivo. El servicio estará disponible el lunes.",
      fecha: "12 Dic 2024",
      tipo: "importante",
      icono: "⚠️"
    },
    {
      id: 3,
      titulo: "Actualización de políticas de seguridad",
      contenido: "Hemos mejorado nuestros protocolos de seguridad para proteger mejor tu información personal.",
      fecha: "10 Dic 2024",
      tipo: "normal",
      icono: "🔒"
    }
  ];

  // Datos de servicios
  const servicios = [
    {
      id: 1,
      titulo: "Firma Electrónica",
      descripcion: "Certificado digital para firmar documentos electrónicamente con validez legal completa.",
      precio: "$25.00",
      estado: "disponible",
      icono: "✍️"
    },
    {
      id: 2,
      titulo: "RUC con Antigüedad",
      descripcion: "Obtención de RUC con historial completo y certificación de antigüedad empresarial.",
      precio: "60.00",
      estado: "disponible",
      icono: "📜"
    },
    {
      id: 3,
      titulo: "Certificado de Ingresos",
      descripcion: "Certificación oficial de ingresos para trámites bancarios y crediticios.",
      precio: "$20.00",
      estado: "proximamente",
      icono: "💰"
    },
    {
      id: 4,
      titulo: "Constancia Laboral Digital",
      descripcion: "Constancia de trabajo con firma digital y validación automática.",
      precio: "$15.00",
      estado: "desarrollo",
      icono: "💼"
    }
  ];

  const localStyles = `
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .hero-section {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      border-radius: 20px;
      padding: 40px 30px;
      text-align: center;
      color: white;
      margin-bottom: 30px;
      position: relative;
      overflow: hidden;
    }

    .hero-title {
      font-size: 42px;
      font-weight: 900;
      margin-bottom: 15px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .hero-subtitle {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 300;
      max-width: 600px;
      margin: 0 auto 25px;
      line-height: 1.5;
    }

    .hero-cta {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 25px;
    }

    .cta-button {
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.4);
      color: white;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-width: 200px;
      justify-content: center;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .cta-button:hover {
      background: rgba(255,255,255,0.35);
      border-color: rgba(255,255,255,0.6);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }

    .cta-button.primary {
      background: linear-gradient(45deg, #10b981, #059669);
      border-color: #10b981;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .cta-button.primary:hover {
      background: linear-gradient(45deg, #059669, #047857);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .cta-button.ruc-button {
      background: linear-gradient(45deg, #3b82f6, #2563eb);
      border-color: #3b82f6;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .cta-button.ruc-button:hover {
      background: linear-gradient(45deg, #2563eb, #1d4ed8);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    }

    .stats-section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .stats-title {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 25px;
      color: #1f2937;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      text-align: center;
      padding: 20px 15px;
      border-radius: 12px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .stat-icon {
      font-size: 36px;
      margin-bottom: 12px;
      display: block;
    }

    .stat-number {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 6px;
      color: #1f2937;
    }

    .stat-description {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .servicios-section {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 25px;
      color: #1f2937;
    }

    .servicios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .servicio-card {
      background: white;
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .servicio-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.15);
    }

    .servicio-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }

    .servicio-icon {
      font-size: 28px;
    }

    .servicio-titulo {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 5px;
      color: #1f2937;
    }

    .servicio-descripcion {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 15px;
      color: #4b5563;
    }

    .servicio-estado {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .servicio-estado.disponible {
      background: #dcfce7;
      color: #166534;
    }

    .servicio-estado.proximamente {
      background: #fef3c7;
      color: #92400e;
    }

    .servicio-estado.desarrollo {
      background: #dbeafe;
      color: #1e40af;
    }

    .comunicados-section {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .comunicados-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .comunicado-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
      position: relative;
    }

    .comunicado-card:hover {
      transform: translateX(3px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }

    .comunicado-card.nuevo {
      border-left-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .comunicado-card.informacion {
      border-left-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    }

    .comunicado-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .comunicado-icon {
      font-size: 20px;
    }

    .comunicado-titulo {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      flex: 1;
    }

    .comunicado-fecha {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .comunicado-contenido {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
    }

    /* Nuevas secciones elegantes */
    .features-section {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 20px;
      padding: 40px 30px;
      margin-bottom: 30px;
    }

    .features-title {
      font-size: 32px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 30px;
      color: #1f2937;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .feature-card {
      background: white;
      border-radius: 16px;
      padding: 30px 24px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.15);
    }

    .feature-icon {
      font-size: 48px;
      margin-bottom: 16px;
      display: block;
    }

    .feature-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1f2937;
    }

    .feature-description {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
    }


    .final-cta-section {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      border-radius: 20px;
      padding: 50px 30px;
      text-align: center;
      color: white;
    }

    .final-cta-title {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .final-cta-description {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 30px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .final-cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .final-cta-button {
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      min-width: 180px;
    }

    .final-cta-button.primary {
      background: linear-gradient(45deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .final-cta-button.primary:hover {
      background: linear-gradient(45deg, #059669, #047857);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .final-cta-button.secondary {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 2px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(10px);
    }

    .final-cta-button.secondary:hover {
      background: rgba(255,255,255,0.3);
      border-color: rgba(255,255,255,0.5);
      transform: translateY(-3px);
    }

    /* Sección de Noticias - Moderna */
    .noticias-section {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 24px;
      padding: 32px 24px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.05);
    }

    .noticias-title {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 24px;
      color: #1f2937;
      background: linear-gradient(135deg, #1f2937, #374151);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .noticias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .noticia-card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      border: 1px solid rgba(0,0,0,0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }

    .noticia-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
      border-color: rgba(59, 130, 246, 0.2);
    }

    .noticia-card.importante {
      border-left: 4px solid #ef4444;
      background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
    }

    .noticia-card.nuevo {
      border-left: 4px solid #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    }

    .noticia-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .noticia-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .noticia-titulo {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.4;
      flex: 1;
    }

    .noticia-fecha {
      font-size: 11px;
      color: #6b7280;
      font-weight: 500;
      background: rgba(0,0,0,0.05);
      padding: 4px 8px;
      border-radius: 8px;
      white-space: nowrap;
    }

    .noticia-contenido {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .noticia-leer-mas {
      color: #3b82f6;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .noticia-leer-mas:hover {
      color: #1d4ed8;
    }

    /* Sección de Servicios - Moderna */
    .servicios-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 24px;
      padding: 32px 24px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.05);
    }

    .servicios-title {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 24px;
      color: #1f2937;
      background: linear-gradient(135deg, #1f2937, #374151);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .servicios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .servicio-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(0,0,0,0.08);
    }

    .servicio-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
      border-color: rgba(59, 130, 246, 0.2);
    }

    .servicio-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .servicio-icon {
      font-size: 24px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 16px;
      color: white;
      flex-shrink: 0;
    }

    .servicio-titulo {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #1f2937;
    }

    .servicio-descripcion {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
      color: #4b5563;
    }

    .servicio-precio {
      font-size: 20px;
      font-weight: 800;
      color: #059669;
      margin-bottom: 12px;
    }

    .servicio-estado {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .servicio-estado.disponible {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #166534;
    }

    .servicio-estado.proximamente {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
    }

    .servicio-estado.desarrollo {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #1e40af;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 0 4px;
      }
      
      .hero-section {
        padding: 20px 12px;
        margin-bottom: 16px;
        border-radius: 12px;
      }
      
      .hero-title {
        font-size: 28px;
        margin-bottom: 10px;
      }
      
      .hero-subtitle {
        font-size: 14px;
        margin-bottom: 20px;
      }
      
      .hero-cta {
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
      }
      
      .cta-button {
        padding: 12px 20px;
        font-size: 14px;
        width: 100%;
        max-width: 300px;
        min-width: auto;
        border-radius: 10px;
      }
      
      .stats-section, .servicios-section, .comunicados-section {
        padding: 16px 12px;
        margin-bottom: 16px;
        border-radius: 12px;
      }
      
      .stats-title, .section-title {
        font-size: 22px;
        margin-bottom: 16px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .stat-card {
        padding: 16px 12px;
      }
      
      .stat-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }
      
      .stat-number {
        font-size: 22px;
        margin-bottom: 4px;
      }
      
      .stat-description {
        font-size: 12px;
      }
      
      .servicios-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .servicio-card {
        padding: 16px;
        border-radius: 12px;
      }
      
      .servicio-header {
        margin-bottom: 12px;
      }
      
      .servicio-icon {
        font-size: 24px;
      }
      
      .servicio-titulo {
        font-size: 16px;
      }
      
      .servicio-descripcion {
        font-size: 13px;
        margin-bottom: 12px;
      }
      
      .comunicados-grid {
        gap: 12px;
      }
      
      .comunicado-card {
        padding: 16px;
        border-radius: 10px;
      }
      
      .comunicado-header {
        margin-bottom: 8px;
      }
      
      .comunicado-icon {
        font-size: 18px;
      }
      
      .comunicado-titulo {
        font-size: 16px;
      }
      
      .comunicado-fecha {
        font-size: 11px;
      }
      
      .comunicado-contenido {
        font-size: 13px;
      }

      /* Nuevas secciones móviles */
      .features-section {
        padding: 20px 12px;
        margin-bottom: 16px;
        border-radius: 12px;
      }

      .features-title {
        font-size: 24px;
        margin-bottom: 20px;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .feature-card {
        padding: 20px 16px;
        border-radius: 12px;
      }

      .feature-icon {
        font-size: 36px;
        margin-bottom: 12px;
      }

      .feature-title {
        font-size: 16px;
        margin-bottom: 8px;
      }

      .feature-description {
        font-size: 13px;
      }


      .final-cta-section {
        padding: 30px 16px;
        border-radius: 12px;
      }

      .final-cta-title {
        font-size: 28px;
        margin-bottom: 12px;
      }

      .final-cta-description {
        font-size: 16px;
        margin-bottom: 24px;
      }

      .final-cta-buttons {
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .final-cta-button {
        padding: 14px 24px;
        font-size: 14px;
        width: 100%;
        max-width: 280px;
        min-width: auto;
      }

      /* Secciones modernas móviles */
      .noticias-section {
        padding: 20px 16px;
        margin-bottom: 16px;
        border-radius: 16px;
      }

      .noticias-title {
        font-size: 22px;
        margin-bottom: 16px;
      }

      .noticias-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .noticia-card {
        padding: 16px;
        border-radius: 16px;
      }

      .noticia-header {
        margin-bottom: 8px;
        gap: 8px;
      }

      .noticia-icon {
        font-size: 18px;
      }

      .noticia-titulo {
        font-size: 14px;
      }

      .noticia-fecha {
        font-size: 10px;
        padding: 3px 6px;
      }

      .noticia-contenido {
        font-size: 13px;
        margin-bottom: 8px;
      }

      .noticia-leer-mas {
        font-size: 12px;
      }

      .servicios-section {
        padding: 20px 16px;
        margin-bottom: 16px;
        border-radius: 16px;
      }

      .servicios-title {
        font-size: 22px;
        margin-bottom: 16px;
      }

      .servicios-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .servicio-card {
        padding: 20px;
        border-radius: 16px;
      }

      .servicio-header {
        margin-bottom: 12px;
        gap: 12px;
      }

      .servicio-icon {
        font-size: 20px;
        width: 40px;
        height: 40px;
        border-radius: 12px;
      }

      .servicio-titulo {
        font-size: 16px;
      }

      .servicio-descripcion {
        font-size: 13px;
        margin-bottom: 12px;
      }

      .servicio-precio {
        font-size: 18px;
        margin-bottom: 8px;
      }
    }
  `;

  return (
    <div className="home-container">
      <style>{localStyles}</style>
      
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">ECUCONTABLE SAS</h1>
          <p className="hero-subtitle">
            Soluciones Digitales de Confianza - Certificados digitales seguros y válidos legalmente
          </p>
          <div className="hero-cta">
            <button 
              className="cta-button primary"
              onClick={() => onNavigate('firma-electronica')}
            >
              ✍️ Solicitar Firma Electrónica
            </button>
            <button 
              className="cta-button ruc-button"
              onClick={() => onNavigate('ruc-antiguedad')}
            >
              📜 Solicitar RUC con Antiguedad
            </button>
            <button 
              className="cta-button"
              onClick={() => onNavigate('consultar-estado')}
            >
              🔍 Consultar mis tramites
            </button>
          </div>
        </div>
      </div>

      {/* Características Principales */}
      <div className="features-section">
        <h2 className="features-title">✨ ¿Por qué elegirnos?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Seguridad Garantizada</h3>
            <p className="feature-description">Certificados digitales con máxima seguridad y validación legal</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Proceso Rápido</h3>
            <p className="feature-description">Tramites completados en minutos, no días</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">100% Digital</h3>
            <p className="feature-description">Todo desde tu dispositivo, sin filas ni papeleo</p>
          </div>
        </div>
      </div>

      {/* Sección de Noticias */}
      <div className="noticias-section">
        <h2 className="noticias-title">📰 Últimas Noticias</h2>
        <div className="noticias-grid">
          {noticias.map(noticia => (
            <div key={noticia.id} className={`noticia-card ${noticia.tipo}`}>
              <div className="noticia-header">
                <div className="noticia-icon">{noticia.icono}</div>
                <h3 className="noticia-titulo">{noticia.titulo}</h3>
                <div className="noticia-fecha">{noticia.fecha}</div>
              </div>
              <p className="noticia-contenido">{noticia.contenido}</p>
              <div className="noticia-leer-mas">Leer más →</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección de Servicios */}
      <div className="servicios-section">
        <h2 className="servicios-title">🛠️ Nuestros Servicios</h2>
        <div className="servicios-grid">
          {servicios.map(servicio => (
            <div key={servicio.id} className="servicio-card">
              <div className="servicio-header">
                <div className="servicio-icon">{servicio.icono}</div>
                <div>
                  <h3 className="servicio-titulo">{servicio.titulo}</h3>
                  <div className="servicio-precio">{servicio.precio}</div>
                </div>
              </div>
              <p className="servicio-descripcion">{servicio.descripcion}</p>
              <div className={`servicio-estado ${servicio.estado}`}>
                {servicio.estado === 'disponible' && 'Disponible'}
                {servicio.estado === 'proximamente' && 'Próximamente'}
                {servicio.estado === 'desarrollo' && 'En Desarrollo'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div className="final-cta-section">
        <div className="final-cta-content">
          <h2 className="final-cta-title">🚀 ¿Listo para empezar?</h2>
          <p className="final-cta-description">Únete a miles de ecuatorianos que ya confían en nosotros</p>
          <div className="final-cta-buttons">
            <button 
              className="final-cta-button primary"
              onClick={() => onNavigate('firma-electronica')}
            >
              ✍️ Comenzar Ahora
            </button>
            <button 
              className="final-cta-button secondary"
              onClick={() => onNavigate('consultar-estado')}
            >
              🔍 Ver Estado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

