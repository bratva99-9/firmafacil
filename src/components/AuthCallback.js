import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          window.location.href = '/';
          return;
        }

        if (data.session) {
          const user = data.session.user;
          
          // Si es login con Facebook, guardar el Facebook ID
          if (user.app_metadata?.provider === 'facebook') {
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  email: user.email,
                  facebook_id: user.user_metadata?.sub || user.user_metadata?.id,
                  full_name: user.user_metadata?.full_name,
                  avatar_url: user.user_metadata?.avatar_url
                });

              if (updateError) {
                console.error('Error updating profile:', updateError);
              }
            } catch (profileError) {
              console.error('Error handling profile update:', profileError);
            }
          }
        }

        // Redirigir al home
        window.location.href = '/';
      } catch (error) {
        console.error('Auth callback error:', error);
        window.location.href = '/';
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '18px',
      fontWeight: '600'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Procesando autenticación...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthCallback;
