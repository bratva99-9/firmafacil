import React, { useState, useEffect } from 'react';
import { verificarConexion } from '../lib/supabase';

const DiagnosticoConexion = () => {
  const [diagnostico, setDiagnostico] = useState({
    conexionSupabase: 'verificando',
    estadoNetlify: 'verificando',
    edgeFunctions: 'verificando',
    proxyConfig: 'verificando'
  });
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    ejecutarDiagnostico();
  }, []);

  const ejecutarDiagnostico = async () => {
    console.log('🔍 Iniciando diagnóstico completo...');
    
    // 1. Verificar conexión con Supabase
    try {
      const conexion = await verificarConexion();
      setDiagnostico(prev => ({
        ...prev,
        conexionSupabase: conexion.success ? 'exitoso' : 'error'
      }));
    } catch (error) {
      console.error('❌ Error en conexión Supabase:', error);
      setDiagnostico(prev => ({
        ...prev,
        conexionSupabase: 'error'
      }));
    }

    // 2. Verificar estado de Netlify
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        timeout: 10000
      });
      setDiagnostico(prev => ({
        ...prev,
        estadoNetlify: response.ok ? 'exitoso' : 'error'
      }));
    } catch (error) {
      console.error('❌ Error en estado Netlify:', error);
      setDiagnostico(prev => ({
        ...prev,
        estadoNetlify: 'error'
      }));
    }

    // 3. Verificar Edge Functions
    try {
      const edgeUrl = process.env.REACT_APP_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co');
      const response = await fetch(`${edgeUrl}/consultar-ruc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ruc: '0990017514001' }),
        timeout: 15000
      });
      setDiagnostico(prev => ({
        ...prev,
        edgeFunctions: response.ok ? 'exitoso' : 'error'
      }));
    } catch (error) {
      console.error('❌ Error en Edge Functions:', error);
      setDiagnostico(prev => ({
        ...prev,
        edgeFunctions: 'error'
      }));
    }

    // 4. Verificar configuración del proxy
    try {
      const proxyTest = await fetch('/api/test', {
        method: 'GET',
        timeout: 5000
      });
      setDiagnostico(prev => ({
        ...prev,
        proxyConfig: proxyTest.ok ? 'exitoso' : 'error'
      }));
    } catch (error) {
      console.error('❌ Error en configuración proxy:', error);
      setDiagnostico(prev => ({
        ...prev,
        proxyConfig: 'error'
      }));
    }
  };

  const getEstadoIcono = (estado) => {
    switch (estado) {
      case 'exitoso':
        return '✅';
      case 'error':
        return '❌';
      case 'verificando':
        return '🔄';
      default:
        return '❓';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'exitoso':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'verificando':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const obtenerSoluciones = () => {
    const problemas = [];
    
    if (diagnostico.conexionSupabase === 'error') {
      problemas.push({
        titulo: 'Problema de conexión con Supabase',
        soluciones: [
          'Verificar que las credenciales de Supabase estén correctas',
          'Comprobar que el proyecto Supabase esté activo',
          'Verificar la conexión a internet',
          'Revisar si hay límites de uso alcanzados en Supabase'
        ]
      });
    }

    if (diagnostico.estadoNetlify === 'error') {
      problemas.push({
        titulo: 'Problema con Netlify',
        soluciones: [
          'Verificar el estado del sitio en Netlify Dashboard',
          'Revisar los logs de build en Netlify',
          'Comprobar que el dominio esté configurado correctamente',
          'Verificar las variables de entorno en Netlify'
        ]
      });
    }

    if (diagnostico.edgeFunctions === 'error') {
      problemas.push({
        titulo: 'Problema con Edge Functions',
        soluciones: [
          'Verificar que las Edge Functions estén desplegadas',
          'Revisar los logs de las funciones en Supabase',
          'Comprobar que las funciones tengan los permisos correctos',
          'Verificar la configuración de CORS'
        ]
      });
    }

    if (diagnostico.proxyConfig === 'error') {
      problemas.push({
        titulo: 'Problema con configuración del proxy',
        soluciones: [
          'Verificar que setupProxy.js esté configurado correctamente',
          'Comprobar que las URLs del proxy sean válidas',
          'Revisar la configuración de CORS',
          'Verificar que los servicios externos estén disponibles'
        ]
      });
    }

    return problemas;
  };

  const problemas = obtenerSoluciones();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔧 Diagnóstico de Conexión
        </h2>
        <p className="text-gray-600">
          Verificando el estado de todos los componentes de la aplicación...
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            {getEstadoIcono(diagnostico.conexionSupabase)} Conexión Supabase
          </h3>
          <p className={`text-sm ${getEstadoColor(diagnostico.conexionSupabase)}`}>
            {diagnostico.conexionSupabase === 'exitoso' && 'Conexión establecida correctamente'}
            {diagnostico.conexionSupabase === 'error' && 'Error en la conexión'}
            {diagnostico.conexionSupabase === 'verificando' && 'Verificando conexión...'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            {getEstadoIcono(diagnostico.estadoNetlify)} Estado Netlify
          </h3>
          <p className={`text-sm ${getEstadoColor(diagnostico.estadoNetlify)}`}>
            {diagnostico.estadoNetlify === 'exitoso' && 'Servicio funcionando correctamente'}
            {diagnostico.estadoNetlify === 'error' && 'Problema con el servicio'}
            {diagnostico.estadoNetlify === 'verificando' && 'Verificando servicio...'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            {getEstadoIcono(diagnostico.edgeFunctions)} Edge Functions
          </h3>
          <p className={`text-sm ${getEstadoColor(diagnostico.edgeFunctions)}`}>
            {diagnostico.edgeFunctions === 'exitoso' && 'Funciones ejecutándose correctamente'}
            {diagnostico.edgeFunctions === 'error' && 'Error en las funciones'}
            {diagnostico.edgeFunctions === 'verificando' && 'Verificando funciones...'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            {getEstadoIcono(diagnostico.proxyConfig)} Configuración Proxy
          </h3>
          <p className={`text-sm ${getEstadoColor(diagnostico.proxyConfig)}`}>
            {diagnostico.proxyConfig === 'exitoso' && 'Proxy configurado correctamente'}
            {diagnostico.proxyConfig === 'error' && 'Problema con el proxy'}
            {diagnostico.proxyConfig === 'verificando' && 'Verificando proxy...'}
          </p>
        </div>
      </div>

      {problemas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            🚨 Problemas Detectados
          </h3>
          {problemas.map((problema, index) => (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">
                {problema.titulo}
              </h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                {problema.soluciones.map((solucion, solIndex) => (
                  <li key={solIndex} className="mb-1">
                    {solucion}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={ejecutarDiagnostico}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Ejecutar Diagnóstico Nuevamente
        </button>
        
        <button
          onClick={() => setMostrarDetalles(!mostrarDetalles)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {mostrarDetalles ? '📋 Ocultar Detalles' : '📋 Mostrar Detalles'}
        </button>
      </div>

      {mostrarDetalles && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Detalles Técnicos:</h4>
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(diagnostico, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DiagnosticoConexion;