import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import TopNav from './components/TopNav';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState('home');
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  useEffect(() => {
    // Timer mínimo de carga de 3 segundos
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 3000);

    return () => clearTimeout(minLoadingTimer);
  }, []);

  useEffect(() => {
    // Verificar sesión activa
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Sesión inicial:', session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Cambio de autenticación:', event, session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar estado local independientemente del resultado
      setUser(null);
      setActiveService('home');
    }
  };

  const handleServiceSelect = (serviceId) => {
    setActiveService(serviceId);
  };

  if (loading || minLoadingTime) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: '600',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'contain',
              marginBottom: '20px'
            }}
          >
            <source src="/Cargando.mp4" type="video/mp4" />
            Tu navegador no soporta videos.
          </video>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px',
            color: '#1f2937',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            ECUCONTABLE S.A.S.
          </div>
          <div style={{
            fontSize: '16px',
            color: '#6b7280',
            fontWeight: '400'
          }}>
            Soluciones Contables y Tributarias
          </div>
        </div>
        
        {/* Efecto de fondo animado */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
          zIndex: 1
        }}></div>
        
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <TopNav user={user} onLogout={handleLogout} activeService={activeService} onServiceSelect={handleServiceSelect} />
      <Sidebar activeService={activeService} onServiceSelect={handleServiceSelect} onLogout={handleLogout} />
      <MainContent activeService={activeService} onServiceSelect={handleServiceSelect} user={user} />
    </div>
  );
}

export default App;

