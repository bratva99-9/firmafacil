import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Register from './components/Register';
import PrivacyPolicy from './components/PrivacyPolicy';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import TopNav from './components/TopNav';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState('home');
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
  };

  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
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
        background: 'transparent',
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
          <img
            src="/logo.png"
            alt="ECUCONTABLE"
            className="loading-logo"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              marginBottom: '20px',
              animation: 
                'rotate-2s 8s linear infinite, blink-constant 4s ease-in-out infinite',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          />
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
        
        <style>{`
          @keyframes rotate-2s {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(90deg); }
            50% { transform: rotate(180deg); }
            75% { transform: rotate(270deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes blink-constant {
            0%, 50% {
              opacity: 1;
            }
            25%, 75% {
              opacity: 0.3;
            }
          }
          
          @media (max-width: 768px) {
            .loading-logo {
              width: 80px !important;
              height: 80px !important;
            }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    if (showPrivacyPolicy) {
      return (
        <PrivacyPolicy 
          onBack={() => setShowPrivacyPolicy(false)}
        />
      );
    }
    
    if (authMode === 'register') {
      return (
        <Register 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
          onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
        />
      );
    }
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={handleSwitchToRegister}
        onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
      />
    );
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

