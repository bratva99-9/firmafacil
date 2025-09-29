// Script de prueba para verificar autenticación
import { supabase } from './src/lib/supabase.js';

async function testAuth() {
  console.log('🧪 Iniciando pruebas de autenticación...');
  
  // 1. Verificar sesión inicial
  console.log('\n1. Verificando sesión inicial...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Sesión actual:', session);
  console.log('Error:', sessionError);
  
  // 2. Intentar login (reemplaza con credenciales reales)
  console.log('\n2. Intentando login...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // Cambia por un email real
    password: 'password123'   // Cambia por una contraseña real
  });
  
  if (loginError) {
    console.log('❌ Error en login:', loginError.message);
  } else {
    console.log('✅ Login exitoso:', loginData.user?.email);
    
    // 3. Verificar sesión después del login
    console.log('\n3. Verificando sesión después del login...');
    const { data: { session: newSession } } = await supabase.auth.getSession();
    console.log('Nueva sesión:', newSession?.user?.email);
    
    // 4. Cerrar sesión
    console.log('\n4. Cerrando sesión...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.log('❌ Error en logout:', logoutError.message);
    } else {
      console.log('✅ Logout exitoso');
      
      // 5. Verificar sesión después del logout
      console.log('\n5. Verificando sesión después del logout...');
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      console.log('Sesión final:', finalSession);
      
      if (!finalSession) {
        console.log('✅ Sesión limpiada correctamente');
      } else {
        console.log('❌ La sesión no se limpió correctamente');
      }
    }
  }
  
  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar pruebas
testAuth().catch(console.error);


