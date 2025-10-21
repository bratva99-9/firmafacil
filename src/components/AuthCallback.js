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

  // No mostrar nada aquí, la pantalla de carga principal se encargará
  return null;
};

export default AuthCallback;











