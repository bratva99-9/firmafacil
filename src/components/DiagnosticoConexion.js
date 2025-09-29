import React, { useState, useEffect } from 'react';
import { verificarConexion } from '../lib/supabase';

const DiagnosticoConexion = () => {
  const [estado, setEstado] = useState('verificando');
  const [mensaje, setMensaje] = useState('');
  const [detalles, setDetalles] = useState('');

  useEffect(() => {
    ejecutarDiagnostico();
  }, []);

  const ejecutarDiagnostico = async () => {
    setEstado('verificando');
    setMensaje('Verificando conexión con Supabase...');
    setDetalles('');

    try {
      const resultado = await verificarConexion();
      
      if (resultado.success) {
        setEstado('exitoso');
        setMensaje('✅ Conexión exitosa con Supabase');
        setDetalles('Tu aplicación está conectada correctamente a la base de datos.');
      } else {
        setEstado('error');
        setMensaje('❌ Error de conexión');
        setDetalles(resultado.error?.message || 'No se pudo conectar con Supabase');
      }
    } catch (error) {
      setEstado('error');
      setMensaje('❌ Error inesperado');
      setDetalles(error.message);
    }
  };

  const getEstadoColor = () => {
    switch (estado) {
      case 'exitoso': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSoluciones = () => {
    if (estado !== 'error') return null;

    return (
      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '8px' 
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>
          🔧 Soluciones posibles:
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d' }}>
          <li>Verifica que tengas conexión a internet</li>
          <li>Crea un archivo <code>.env</code> en la raíz del proyecto con:</li>
        </ul>
        <pre style={{ 
          margin: '8px 0', 
          padding: '12px', 
          backgroundColor: '#1f2937', 
          color: '#f9fafb', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
{`REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-anonima`}
        </pre>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d' }}>
          <li>Reinicia el servidor de desarrollo después de crear el archivo .env</li>
          <li>Verifica que las credenciales sean correctas en tu panel de Supabase</li>
          <li>Asegúrate de que el bucket 'documentos' exista en Storage</li>
        </ul>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#fff', 
      borderRadius: '12px', 
      border: '1px solid #e5e7eb',
      maxWidth: '600px',
      margin: '20px auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#111827' }}>
        🔍 Diagnóstico de Conexión
      </h3>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        border: `2px solid ${getEstadoColor()}`
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: getEstadoColor(),
            marginRight: '8px'
          }} />
          <span style={{ fontWeight: '600', color: '#111827' }}>
            {mensaje}
          </span>
        </div>
        
        {detalles && (
          <p style={{ 
            margin: '8px 0 0 0', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            {detalles}
          </p>
        )}
      </div>

      {getSoluciones()}

      <div style={{ 
        marginTop: '16px', 
        display: 'flex', 
        gap: '12px' 
      }}>
        <button
          onClick={ejecutarDiagnostico}
          disabled={estado === 'verificando'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: estado === 'verificando' ? 'not-allowed' : 'pointer',
            opacity: estado === 'verificando' ? 0.6 : 1
          }}
        >
          {estado === 'verificando' ? 'Verificando...' : '🔄 Reintentar'}
        </button>
        
        <button
          onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          📊 Ir a Supabase Dashboard
        </button>
      </div>
    </div>
  );
};

export default DiagnosticoConexion;
