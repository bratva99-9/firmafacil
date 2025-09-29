// Archivo de prueba para verificar la conexión con Supabase
// Ejecuta este archivo en la consola del navegador para probar la conexión

import { supabase } from './src/lib/supabase.js';

// Función para probar la conexión
async function probarConexion() {
  console.log('🔍 Probando conexión con Supabase...');
  
  try {
    // Probar conexión básica
    const { data, error } = await supabase
      .from('solicitudes')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase!');
    console.log('📊 Datos recibidos:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return false;
  }
}

// Función para probar inserción de datos de prueba
async function probarInsercion() {
  console.log('🧪 Probando inserción de datos...');
  
  try {
    const datosPrueba = {
      numero_cedula: '9999999999',
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      parroquia: 'Centro',
      direccion: 'Av. Test 123',
      codigo_huella: 'TEST123',
      celular: '0999999999',
      correo: 'test@prueba.com',
      tipo_banco: 'Banco Pichincha',
      tipo_firma: 'natural',
      duracion_firma: '2 años',
      estado_tramite: 'pendiente'
    };
    
    const { data, error } = await supabase
      .from('solicitudes')
      .insert([datosPrueba])
      .select();
    
    if (error) {
      console.error('❌ Error al insertar:', error);
      return false;
    }
    
    console.log('✅ Inserción exitosa!');
    console.log('📝 Registro creado:', data[0]);
    return true;
    
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return false;
  }
}

// Función para probar consulta de datos
async function probarConsulta() {
  console.log('🔍 Probando consulta de datos...');
  
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error al consultar:', error);
      return false;
    }
    
    console.log('✅ Consulta exitosa!');
    console.log('📋 Registros encontrados:', data.length);
    console.log('📊 Datos:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return false;
  }
}

// Ejecutar todas las pruebas
async function ejecutarPruebas() {
  console.log('🚀 Iniciando pruebas de Supabase...\n');
  
  const conexion = await probarConexion();
  if (!conexion) return;
  
  console.log('\n');
  const insercion = await probarInsercion();
  if (!insercion) return;
  
  console.log('\n');
  await probarConsulta();
  
  console.log('\n🎉 ¡Todas las pruebas completadas!');
  console.log('💡 Tu sistema está listo para usar.');
}

// Exportar funciones para uso manual
export { probarConexion, probarInsercion, probarConsulta, ejecutarPruebas };

// Ejecutar automáticamente si se importa
if (typeof window !== 'undefined') {
  ejecutarPruebas();
}

