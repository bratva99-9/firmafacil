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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Cargando FIRMAFACIL SAS...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <TopNav user={user} onLogout={handleLogout} />
      <Sidebar activeService={activeService} onServiceSelect={handleServiceSelect} onLogout={handleLogout} />
      <MainContent activeService={activeService} onServiceSelect={handleServiceSelect} user={user} />
    </div>
  );
}

export default App;

