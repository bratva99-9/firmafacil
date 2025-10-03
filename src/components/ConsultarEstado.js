import React, { useState, useEffect } from 'react';
import { getSolicitudesByDistribuidor } from '../lib/supabase';

const ConsultarEstado = ({ user }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipoTramite, setFiltroTipoTramite] = useState('todos');

  useEffect(() => {
    if (user?.email) {
      handleConsultar();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltro();
  }, [solicitudes, filtroEstado, filtroTipoTramite]);

  const aplicarFiltro = () => {
    let filtradas = solicitudes;

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(solicitud => solicitud.estado_tramite === filtroEstado);
    }

    // Filtrar por tipo de trámite
    if (filtroTipoTramite !== 'todos') {
      filtradas = filtradas.filter(solicitud => {
        const tipoTramite = solicitud.tipo_tramite || solicitud.tipo_firma;
        // Si es firma electrónica, también incluir natural y juridica
        if (filtroTipoTramite === 'firma-electronica') {
          return tipoTramite === 'firma-electronica' || tipoTramite === 'natural' || tipoTramite === 'juridica';
        }
        return tipoTramite === filtroTipoTramite;
      });
    }

    setFilteredSolicitudes(filtradas);
  };

  const handleConsultar = async () => {
    if (!user?.email) {
      setError('No hay usuario logueado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resultado = await getSolicitudesByDistribuidor(user.email);
      
      if (resultado.success) {
        setSolicitudes(resultado.data);
        if (resultado.data.length === 0) {
          setError('No se encontraron solicitudes para este usuario');
        }
      } else {
        setError(resultado.error || 'Error al consultar las solicitudes');
      }
    } catch (err) {
      setError('Error al consultar las solicitudes. Intenta nuevamente.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return { color: '#f59e0b', bg: '#fef3c7', text: 'Pendiente' };
      case 'completado':
        return { color: '#10b981', bg: '#d1fae5', text: 'Completado' };
      case 'rechazado':
        return { color: '#ef4444', bg: '#fee2e2', text: 'Rechazado' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: estado || 'Desconocido' };
    }
  };

  const getTipoTramiteTexto = (tipo) => {
    switch (tipo) {
      case 'firma-electronica':
        return 'Firma Electrónica';
      case 'natural':
        return 'Firma Electrónica';
      case 'juridica':
        return 'Firma Electrónica';
      case 'clave-herencia-sri':
        return 'Clave Herencia SRI';
      case 'ruc-fecha-actual':
        return 'RUC Fecha Actual';
      case 'certificado-digital':
        return 'Certificado Digital';
      case 'renovacion-certificado':
        return 'Renovación de Certificado';
      case 'revocacion-certificado':
        return 'Revocación de Certificado';
      case 'otro':
        return 'Otro Trámite';
      default:
        return tipo || 'No especificado';
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const localStyles = `
    .consultar-wrapper {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0;
      background: #f6f7fb;
      min-height: 100vh;
    }

    .consultar-header {
      text-align: center;
      margin-bottom: 16px;
      margin-top: 0;
    }

    .consultar-title {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .consultar-description {
      font-size: 16px;
      color: #6b7280;
      max-width: 600px;
      margin: 0 auto;
    }

    .filtros-container {
      background: #ffffff;
      padding: 4px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }

    .filtros-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }

    .filtro-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filtro-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .filtro-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: #ffffff;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }

    .filtro-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filtro-stats {
      flex: 1;
      text-align: center;
    }

    .stats-text {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .btn-actualizar {
      background: #3b82f6;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-actualizar:hover {
      background: #2563eb;
    }

    .search-section {
      background: #ffffff;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 32px;
    }

    .search-form {
      display: flex;
      gap: 16px;
      align-items: end;
    }

    .form-group {
      flex: 1;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 14px;
    }

    .solicitudes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .solicitud-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }

    .solicitud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }

    .solicitud-id {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
    }

    .solicitud-estado {
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }

    .estado-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .solicitud-details p {
      margin: 5px 0;
      font-size: 14px;
      color: #374151;
    }

    .solicitud-details strong {
      color: #1f2937;
    }

    .solicitud-footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      text-align: right;
    }

    .no-solicitudes {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .consultar-wrapper {
        padding: 0;
      }
      
      .filtros-container {
        padding: 4px;
        margin-bottom: 16px;
      }
      
      .solicitud-card {
        padding: 4px;
      }
      
      .solicitudes-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 16px;
      }
      
      .filtros-wrapper {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .filtro-group {
        flex-direction: column;
        gap: 6px;
        align-items: stretch;
      }
      
      .filtro-stats {
        text-align: center;
        order: -1;
      }
      
      .search-form {
        flex-direction: column;
        gap: 12px;
      }
      
      .consultar-title {
        font-size: 24px;
      }
      
      .consultar-description {
        font-size: 14px;
      }
    }
  `;

  return (
    <div className="consultar-wrapper">
      <style>{localStyles}</style>
      
             <div className="consultar-header">
               <h1 className="consultar-title">Consultar Estado de Trámites</h1>
               <p className="consultar-description">
                 Aquí puedes ver todas las solicitudes de trámites que has realizado.
               </p>
             </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-wrapper">
          <div className="filtro-group">
            <label className="filtro-label">Filtrar por trámite:</label>
            <select 
              className="filtro-select" 
              value={filtroTipoTramite} 
              onChange={(e) => setFiltroTipoTramite(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="firma-electronica">Firma Electrónica</option>
              <option value="clave-herencia-sri">Clave Herencia SRI</option>
              <option value="ruc-fecha-actual">RUC Fecha Actual</option>
              <option value="certificado-digital">Certificado Digital</option>
              <option value="renovacion-certificado">Renovación de Certificado</option>
              <option value="revocacion-certificado">Revocación de Certificado</option>
              <option value="otro">Otro Trámite</option>
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Filtrar por estado:</label>
            <select 
              className="filtro-select" 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="completado">Completado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div className="filtro-stats">
            <span className="stats-text">
              Mostrando {filteredSolicitudes.length} de {solicitudes.length} trámites
            </span>
          </div>
          <button 
            className="btn-actualizar" 
            onClick={handleConsultar}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Cargando trámites...
        </div>
      )}

      {!loading && filteredSolicitudes.length > 0 && (
        <div className="solicitudes-grid">
          {filteredSolicitudes.map((solicitud) => {
            const estadoInfo = getEstadoColor(solicitud.estado_tramite);
            return (
              <div key={String(solicitud.id)} className="solicitud-card">
                <div className="solicitud-header">
                  <span className="solicitud-id">ID: {String(solicitud.id).substring(0, 8)}...</span>
                  <span className="solicitud-estado" style={{ background: estadoInfo.bg, color: estadoInfo.color }}>
                    {estadoInfo.text}
                  </span>
                </div>
                
                <div className="solicitud-details">
                  <p><strong>Nombres:</strong> {solicitud.nombres} {solicitud.apellidos}</p>
                  <p><strong>Cédula:</strong> {solicitud.numero_cedula}</p>
                  <p><strong>Tipo de Trámite:</strong> {getTipoTramiteTexto(solicitud.tipo_tramite || solicitud.tipo_firma)}</p>
                  {(solicitud.tipo_tramite === 'firma-electronica' || solicitud.tipo_firma === 'firma-electronica' || solicitud.tipo_tramite === 'natural' || solicitud.tipo_tramite === 'juridica' || solicitud.tipo_firma === 'natural' || solicitud.tipo_firma === 'juridica') && (
                    <p><strong>Tipo de Firma:</strong> {solicitud.tipo_firma === 'natural' ? 'Persona Natural' : solicitud.tipo_firma === 'juridica' ? 'Persona Jurídica' : solicitud.tipo_tramite === 'natural' ? 'Persona Natural' : solicitud.tipo_tramite === 'juridica' ? 'Persona Jurídica' : solicitud.tipo_firma}</p>
                  )}
                  {solicitud.duracion_firma && <p><strong>Duración:</strong> {solicitud.duracion_firma}</p>}
                  {solicitud.tipo_banco && <p><strong>Pago:</strong> {solicitud.tipo_banco}</p>}
                  <p><strong>Correo:</strong> {solicitud.correo}</p>
                </div>
                
                <div className="solicitud-footer">
                  Solicitado el {formatFecha(solicitud.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredSolicitudes.length === 0 && !error && (
        <div className="no-solicitudes">
          <span className="no-solicitudes-icon">📄</span>
          <h2 className="no-solicitudes-title">
            {filtroEstado === 'todos' ? 'No hay trámites' : 'No hay trámites con este estado'}
          </h2>
          <p className="no-solicitudes-description">
            {filtroEstado === 'todos' 
              ? 'Aún no has enviado ninguna solicitud de trámites.'
              : `No se encontraron trámites con estado "${getEstadoColor(filtroEstado).text}".`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ConsultarEstado;
