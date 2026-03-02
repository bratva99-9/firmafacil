// Configuración de Supabase y funciones para el formulario
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase - Usar variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://eapcqcuzfkpqngbvjtmv.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGNxY3V6ZmtwcW5nYnZqdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTEzNzIsImV4cCI6MjA3NDQyNzM3Mn0.-mufqMzFQetktwAL444d1PjdWfdCC5-2ftVs0LnTIL4'
// URL base de funciones Edge
export const EDGE_URL = 'https://eapcqcuzfkpqngbvjtmv.functions.supabase.co'

// Función para hacer peticiones a través del proxy de Edge Functions
export const fetchWithProxy = async (url, options = {}) => {
  try {
    // Si es una URL de Zamplisoft, usar el proxy
    if (url.includes('zamplisoft.com')) {
      const urlParts = url.split('zamplisoft.com/');
      const endpoint = urlParts.length > 1 ? urlParts[1] : '';
      const proxyUrl = `${EDGE_URL}/api-proxy/${endpoint}`;
      console.log(`🔄 Usando proxy para: ${proxyUrl}`);
      return await fetch(proxyUrl, options);
    }

    // Para otras URLs, usar directamente
    return await fetch(url, options);
  } catch (error) {
    console.error('Error en fetchWithProxy:', error);
    throw error;
  }
};

/**
 * Consultar RUC usando la Edge Function "consultar-ruc"
 * Retorna datos del SRI, incluyendo representantes_legales.
 */
export const consultarRUCDesdeEdge = async (ruc) => {
  if (!ruc || typeof ruc !== 'string' || ruc.trim().length !== 13) {
    throw new Error('RUC inválido');
  }

  const url = `${EDGE_URL}/consultar-ruc`;
  const payload = { ruc: ruc.trim() };

  // Las Edge Functions requieren el header Authorization con el anon key
  const authHeaders = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Error en consultar-ruc: ${resp.status} ${resp.statusText} - ${text.substring(0, 200)}`);
  }

  const json = await resp.json();
  return json; // { success, data, error }
};

// Validar configuración
if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key') {
  console.error('❌ ERROR: Las credenciales de Supabase no están configuradas correctamente.');
  console.error('📝 Por favor, crea un archivo .env en la raíz del proyecto con:');
  console.error('REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('REACT_APP_SUPABASE_ANON_KEY=tu-clave-anonima');
} else {
  console.log('✅ Credenciales de Supabase configuradas correctamente');
}

// Función para consultar datos de cédula usando caché local y API Zamplisoft
export const consultarCedula = async (numeroCedula) => {
  try {
    console.log('🔍 Consultando cédula:', numeroCedula);

    // PASO 1: Buscar primero en caché local
    const datosCache = await obtenerCedulaDesdeCache(numeroCedula);
    if (datosCache) {
      console.log('✅ Datos obtenidos desde caché local (sin costo)');
      return datosCache;
    }

    // PASO 2: Si no está en caché, consultar API Zamplisoft
    console.log('🌐 Consultando API Zamplisoft (con costo)...');

    try {
      // URL correcta de la API de Zamplisoft
      const apiUrl = `https://apiconsult.zampisoft.com/api/consultar?identificacion=${numeroCedula}&token=cvZ1-zcMv-OKKh-AR29`;

      console.log(`🔄 Consultando: ${apiUrl}`);

      const response = await fetchWithProxy(apiUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      console.log(`📊 Respuesta del servidor: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('📄 Datos recibidos de API:', data);

        if (data.cedula && data.nombre) {
          console.log('✅ Datos de cédula obtenidos de API exitosamente');

          // Función para separar nombres y apellidos
          const separarNombresApellidos = (nombreCompleto) => {
            if (!nombreCompleto) return { nombres: '', apellidos: '' };

            const partes = nombreCompleto.trim().split(' ');
            if (partes.length <= 2) {
              return { nombres: nombreCompleto, apellidos: '' };
            }

            // Los primeros 2 elementos son apellidos, el resto son nombres
            const apellidos = partes.slice(0, 2).join(' ');
            const nombres = partes.slice(2).join(' ');

            return { nombres, apellidos };
          };

          // Función para calcular edad
          const calcularEdad = (fechaNacimiento) => {
            if (!fechaNacimiento) return '';

            try {
              // Formato: DD/MM/YYYY
              const [dia, mes, año] = fechaNacimiento.split('/');
              const fechaNac = new Date(año, mes - 1, dia);
              const hoy = new Date();
              let edad = hoy.getFullYear() - fechaNac.getFullYear();

              // Ajustar si aún no ha cumplido años este año
              const mesActual = hoy.getMonth();
              const mesNacimiento = fechaNac.getMonth();
              if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < fechaNac.getDate())) {
                edad--;
              }

              return edad.toString();
            } catch (error) {
              console.error('Error al calcular edad:', error);
              return '';
            }
          };

          // Separar nombres y apellidos
          const { nombres, apellidos } = separarNombresApellidos(data.nombre);

          // Calcular edad
          const edad = calcularEdad(data.fechaNacimiento);

          // Mantener provincia en mayúsculas como viene de la API

          // Preparar datos para guardar en caché (mapeo según estructura real)
          const datosParaCache = {
            nombres: nombres,
            apellidos: apellidos,
            fechaNacimiento: data.fechaNacimiento || '',
            lugarNacimiento: data.lugarNacimiento || '',
            estadoCivil: data.estadoCivil || '',
            genero: data.genero || '',
            nacionalidad: data.nacionalidad || 'Ecuatoriana',
            provincia: data.lugarDomicilio ? data.lugarDomicilio.split('/')[0] : '',
            ciudad: data.lugarDomicilio ? data.lugarDomicilio.split('/')[1] : '',
            parroquia: data.lugarDomicilio ? data.lugarDomicilio.split('/')[2] : '',
            direccion: `${data.calleDomicilio || ''} ${data.numeracionDomicilio || ''}`.trim(),
            estado: 'Activo',
            edad: edad,
            // Campos adicionales de la API real
            fechaCedulacion: data.fechaCedulacion || '',
            nombreMadre: data.nombreMadre || '',
            nombrePadre: data.nombrePadre || '',
            instruccion: data.instruccion || '',
            profesion: data.profesion || '',
            conyuge: data.conyuge || ''
          };

          // PASO 3: Guardar en caché para futuras consultas
          await guardarCedulaEnCache(numeroCedula, datosParaCache);

          return {
            success: true,
            data: datosParaCache,
            desdeCache: false,
            desdeAPI: true
          };
        } else {
          console.log('⚠️ Cédula no encontrada o datos incompletos');
          throw new Error('Cédula no encontrada o datos incompletos');
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error ${response.status}:`, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (apiError) {
      console.log(`❌ Error en API Zamplisoft:`, apiError.message);
      throw apiError;
    }

  } catch (error) {
    console.error('❌ Error al consultar cédula:', error);
    return {
      success: false,
      error: error.message || 'Error al consultar la cédula'
    };
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Función para obtener datos de cédula desde caché local
export const obtenerCedulaDesdeCache = async (numeroCedula) => {
  try {
    console.log('🔍 Buscando cédula en caché local...');

    const { data, error } = await supabase
      .from('cache_cedulas')
      .select('*')
      .eq('numero_cedula', numeroCedula)
      .gte('fecha_expiracion', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error al consultar caché:', error);
      return null;
    }

    if (data) {
      console.log('✅ Datos encontrados en caché local');

      // Mantener provincia en mayúsculas como viene de la API

      return {
        success: true,
        data: {
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          fechaNacimiento: data.fecha_nacimiento || '',
          lugarNacimiento: data.lugar_nacimiento || '',
          estadoCivil: data.estado_civil || '',
          genero: data.genero || '',
          nacionalidad: data.nacionalidad || 'Ecuatoriana',
          provincia: data.provincia || '',
          ciudad: data.ciudad || '',
          parroquia: data.parroquia || '',
          direccion: data.direccion || '',
          estado: data.estado || 'Activo',
          edad: data.edad || '',
          // Campos adicionales
          fechaCedulacion: data.fecha_cedulacion || '',
          nombreMadre: data.nombre_madre || '',
          nombrePadre: data.nombre_padre || '',
          instruccion: data.instruccion || '',
          profesion: data.profesion || '',
          conyuge: data.conyuge || ''
        },
        desdeCache: true
      };
    }

    console.log('⚠️ Cédula no encontrada en caché local');
    return null;
  } catch (error) {
    console.error('❌ Error al consultar caché:', error);
    return null;
  }
};

// Función para guardar datos de cédula en caché local
export const guardarCedulaEnCache = async (numeroCedula, datosCedula) => {
  try {
    console.log('💾 Guardando datos de cédula en caché local...');

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 30); // Expira en 30 días

    const { error } = await supabase
      .from('cache_cedulas')
      .upsert({
        numero_cedula: numeroCedula,
        nombres: datosCedula.nombres,
        apellidos: datosCedula.apellidos,
        fecha_nacimiento: datosCedula.fechaNacimiento,
        lugar_nacimiento: datosCedula.lugarNacimiento,
        estado_civil: datosCedula.estadoCivil,
        genero: datosCedula.genero,
        nacionalidad: datosCedula.nacionalidad,
        provincia: datosCedula.provincia,
        ciudad: datosCedula.ciudad,
        parroquia: datosCedula.parroquia,
        direccion: datosCedula.direccion,
        estado: datosCedula.estado,
        edad: datosCedula.edad,
        // Campos adicionales
        fecha_cedulacion: datosCedula.fechaCedulacion,
        nombre_madre: datosCedula.nombreMadre,
        nombre_padre: datosCedula.nombrePadre,
        instruccion: datosCedula.instruccion,
        profesion: datosCedula.profesion,
        conyuge: datosCedula.conyuge,
        fecha_expiracion: fechaExpiracion.toISOString()
      });

    if (error) {
      console.error('❌ Error al guardar en caché:', error);
      return false;
    }

    console.log('✅ Datos guardados en caché local exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al guardar en caché:', error);
    return false;
  }
};

// Función para verificar la conexión
export const verificarConexion = async () => {
  try {
    console.log('🔍 Verificando conexión con Supabase...');
    const { data, error } = await supabase
      .from('solicitudes')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
      return { success: false, error };
    }

    console.log('✅ Conexión exitosa con Supabase!');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return { success: false, error: err };
  }
}

// Función para insertar una nueva solicitud
export const insertSolicitud = async (data) => {
  try {
    // Verificar conexión antes de intentar insertar
    const conexion = await verificarConexion();
    if (!conexion.success) {
      throw new Error('No se puede conectar con la base de datos. Verifica tu conexión a internet y las credenciales de Supabase.');
    }

    const { data: result, error } = await supabase
      .from('solicitudes')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error al insertar solicitud:', error)
      throw new Error(`Error al guardar la solicitud: ${error.message}`)
    }

    return result
  } catch (error) {
    console.error('Error en insertSolicitud:', error)
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      throw new Error('Error de conexión. Verifica tu conexión a internet y vuelve a intentar.')
    }
    throw error
  }
}

// Función para subir archivos
export const uploadFile = async (file, cedula, tipo) => {
  try {
    if (!file) {
      throw new Error('No se proporcionó archivo')
    }

    // Verificar conexión antes de intentar subir
    const conexion = await verificarConexion();
    if (!conexion.success) {
      throw new Error('No se puede conectar con el almacenamiento. Verifica tu conexión a internet y las credenciales de Supabase.');
    }

    // Crear nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${tipo}_${Date.now()}.${fileExt}`
    const filePath = `${cedula}/${fileName}`

    // Subir archivo a Supabase Storage
    const { error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file)

    if (error) {
      console.error('Error al subir archivo:', error)
      throw new Error(`Error al subir el archivo: ${error.message}`)
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath)

    return {
      path: filePath,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('Error en uploadFile:', error)
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      throw new Error('Error de conexión al subir archivo. Verifica tu conexión a internet y vuelve a intentar.')
    }
    throw error
  }
}

// Función para actualizar una solicitud
export const updateSolicitud = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar solicitud:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error en updateSolicitud:', error)
    throw error
  }
}

// Función para obtener solicitudes por cédula
export const getSolicitudesByCedula = async (cedula) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('numero_cedula', cedula)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener solicitudes:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error en getSolicitudesByCedula:', error)
    throw error
  }
}

// Función para obtener solicitudes por correo del distribuidor
export const getSolicitudesByDistribuidor = async (correoDistribuidor) => {
  try {
    console.log('🔍 Consultando solicitudes para distribuidor:', correoDistribuidor);

    // Primero obtener las solicitudes
    const { data: solicitudes, error: solicitudesError } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('correo_distribuidor', correoDistribuidor)
      .order('created_at', { ascending: false });

    if (solicitudesError) {
      console.error('Error al obtener solicitudes por distribuidor:', solicitudesError);
      throw solicitudesError;
    }

    console.log('✅ Solicitudes encontradas:', solicitudes?.length || 0);

    // Para cada solicitud, obtener los datos de nombres y apellidos desde cache_cedulas
    const solicitudesConNombres = await Promise.all(
      (solicitudes || []).map(async (solicitud) => {
        if (solicitud.numero_cedula) {
          try {
            const { data: cacheData, error: cacheError } = await supabase
              .from('cache_cedulas')
              .select('nombres, apellidos')
              .eq('numero_cedula', solicitud.numero_cedula)
              .single();

            if (!cacheError && cacheData) {
              return {
                ...solicitud,
                nombres: cacheData.nombres || '',
                apellidos: cacheData.apellidos || ''
              };
            }
          } catch (cacheErr) {
            console.log(`⚠️ No se encontraron datos en caché para cédula ${solicitud.numero_cedula}`);
          }
        }

        // Si no hay datos en caché, mantener la solicitud sin nombres/apellidos
        return {
          ...solicitud,
          nombres: '',
          apellidos: ''
        };
      })
    );

    return { success: true, data: solicitudesConNombres };
  } catch (error) {
    console.error('Error en getSolicitudesByDistribuidor:', error);
    return { success: false, error: error.message };
  }
};

// Función para obtener una solicitud por ID
export const getSolicitudById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener solicitud:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error en getSolicitudById:', error)
    throw error
  }
}

// Función para cambiar estado de solicitud
export const updateEstadoSolicitud = async (id, nuevoEstado) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .update({ estado_tramite: nuevoEstado })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar estado:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error en updateEstadoSolicitud:', error)
    throw error
  }
}

// Función de prueba para verificar la API del SRI
export const probarAPISRI = async () => {
  const rucsPrueba = [
    '0990017514001', // TIA (empresa conocida)
    '0958398984001', // RUC que estabas probando
    '1790012345001'   // RUC de prueba genérico
  ];

  for (const ruc of rucsPrueba) {
    console.log(`\n🧪 Probando RUC: ${ruc}`);

    try {
      // Probar directamente sin proxy primero
      const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?&ruc=${ruc}`;
      console.log(`🔗 URL directa: ${sriUrl}`);

      // Probar con proxy más confiable
      const proxyUrl = 'https://corsproxy.io/?';
      const apiUrl = proxyUrl + encodeURIComponent(sriUrl);
      console.log(`🔗 URL con proxy: ${apiUrl}`);

      const response = await fetchWithProxy(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);

      const responseText = await response.text();
      console.log(`📄 Respuesta:`, responseText.substring(0, 500) + '...');

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log(`✅ RUC ${ruc} válido:`, data);
          return { success: true, ruc, data };
        } catch (e) {
          console.log(`❌ Error parseando JSON para RUC ${ruc}:`, e);
        }
      } else {
        console.log(`❌ Error HTTP para RUC ${ruc}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error de red para RUC ${ruc}:`, error);
    }
  }

  return { success: false, error: 'No se pudo validar ningún RUC' };
};
export const consultarRUC = async (numeroRUC) => {
  try {
    console.log('🔍 Consultando RUC:', numeroRUC);

    // PASO 1: Buscar primero en caché local
    const datosCache = await obtenerRUCDesdeCache(numeroRUC);
    if (datosCache) {
      console.log('✅ Datos obtenidos desde caché local (sin costo)');
      return datosCache;
    }

    // PASO 2: Si no está en caché, consultar API del SRI usando proxy
    console.log('🌐 Consultando API del SRI usando proxy...');

    try {
      // Usar proxy público confiable
      const proxyUrl = 'https://corsproxy.io/?';
      const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?&ruc=${numeroRUC}`;
      const apiUrl = proxyUrl + encodeURIComponent(sriUrl);

      console.log(`🔄 Consultando: ${apiUrl}`);
      console.log(`🔍 RUC a consultar: ${numeroRUC}`);

      const response = await fetchWithProxy(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`📊 Respuesta del servidor: ${response.status} ${response.statusText}`);

      // Leer el contenido de la respuesta para debug
      const responseText = await response.text();
      console.log(`📄 Contenido de respuesta:`, responseText);

      if (response.ok) {
        // Si la respuesta está vacía (código 204 o respuesta vacía), significa que no hay RUC
        if (response.status === 204 || !responseText.trim()) {
          console.log('📄 RUC no encontrado en SRI (respuesta vacía), buscando datos de cédula...');

          // Si no encuentra RUC, buscar datos de cédula
          const cedula = numeroRUC.slice(0, -3); // Remover '001' para obtener cédula
          console.log(`🔍 Buscando cédula: ${cedula}`);

          // PASO 1: Buscar en caché de cédulas
          const datosCedulaCache = await obtenerCedulaDesdeCache(cedula);
          if (datosCedulaCache) {
            console.log('✅ Datos de cédula encontrados en caché');
            return {
              success: true,
              data: {
                numero_ruc: numeroRUC,
                razon_social: `${datosCedulaCache.data.nombres} ${datosCedulaCache.data.apellidos}`,
                estado_contribuyente_ruc: 'SIN RUC',
                tipo_contribuyente: 'PERSONA NATURAL',
                sin_ruc: true,
                nombres: datosCedulaCache.data.nombres,
                apellidos: datosCedulaCache.data.apellidos,
                edad: datosCedulaCache.data.edad || '',
                genero: datosCedulaCache.data.genero || '',
                nacionalidad: datosCedulaCache.data.nacionalidad || 'Ecuatoriana',
                provincia: datosCedulaCache.data.provincia || '',
                ciudad: datosCedulaCache.data.ciudad || '',
                parroquia: datosCedulaCache.data.parroquia || '',
                direccion: datosCedulaCache.data.direccion || '',
                mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
              }
            };
          }

          // PASO 2: Si no está en caché, consultar Zamplisoft por cédula
          console.log('🌐 Consultando Zamplisoft por cédula...');
          try {
            const zamplisoftUrl = `https://apiconsult.zampisoft.com/api/consultar?identificacion=${cedula}&token=cvZ1-zcMv-OKKh-AR29`;
            const proxyUrl = 'https://corsproxy.io/?';
            const apiUrl = proxyUrl + encodeURIComponent(zamplisoftUrl);

            const cedulaResponse = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });

            if (cedulaResponse.ok) {
              const cedulaData = await cedulaResponse.json();
              console.log('📄 Datos de cédula recibidos:', cedulaData);

              if (cedulaData && cedulaData.nombre) {
                // Separar nombre completo en nombres y apellidos
                const nombreCompleto = cedulaData.nombre.trim();
                const partesNombre = nombreCompleto.split(' ');

                // Lógica mejorada para separar nombres y apellidos
                let nombres, apellidos;
                if (partesNombre.length <= 2) {
                  // Si tiene 1 o 2 palabras, todo es nombre
                  nombres = nombreCompleto;
                  apellidos = '';
                } else {
                  // Si tiene más de 2 palabras, los últimos 2 son apellidos
                  apellidos = partesNombre.slice(-2).join(' ');
                  nombres = partesNombre.slice(0, -2).join(' ');
                }

                console.log(`📝 Procesando nombre: "${nombreCompleto}" -> Nombres: "${nombres}", Apellidos: "${apellidos}"`);
                console.log('🔍 Datos completos para retornar:', {
                  nombres,
                  apellidos,
                  nombreCompleto,
                  razon_social: `${nombres} ${apellidos}`.trim()
                });

                // Preparar datos completos para guardar en caché
                const datosParaCache = {
                  nombres: nombres,
                  apellidos: apellidos,
                  fechaNacimiento: cedulaData.fechaNacimiento || '',
                  lugarNacimiento: cedulaData.lugarNacimiento || '',
                  estadoCivil: cedulaData.estadoCivil || '',
                  genero: cedulaData.genero || '',
                  nacionalidad: cedulaData.nacionalidad || 'Ecuatoriana',
                  provincia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[0] : '',
                  ciudad: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[1] : '',
                  parroquia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[2] : '',
                  direccion: `${cedulaData.calleDomicilio || ''} ${cedulaData.numeracionDomicilio || ''}`.trim(),
                  estado: 'Activo',
                  fechaCedulacion: cedulaData.fechaCedulacion || '',
                  nombreMadre: cedulaData.nombreMadre || '',
                  nombrePadre: cedulaData.nombrePadre || '',
                  conyuge: cedulaData.conyuge || ''
                };

                // Guardar en caché de cédulas
                await guardarCedulaEnCache(cedula, datosParaCache);

                return {
                  success: true,
                  data: {
                    numero_ruc: numeroRUC,
                    razon_social: nombreCompleto,
                    estado_contribuyente_ruc: 'SIN RUC',
                    tipo_contribuyente: 'PERSONA NATURAL',
                    sin_ruc: true,
                    nombres: nombres,
                    apellidos: apellidos,
                    edad: cedulaData.edad || '',
                    genero: cedulaData.genero || '',
                    nacionalidad: cedulaData.nacionalidad || 'Ecuatoriana',
                    provincia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[0] : '',
                    ciudad: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[1] : '',
                    parroquia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[2] : '',
                    direccion: `${cedulaData.calleDomicilio || ''} ${cedulaData.numeracionDomicilio || ''}`.trim(),
                    mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                  }
                };
              }
            }
          } catch (cedulaError) {
            console.error('❌ Error al consultar cédula en Zamplisoft:', cedulaError);
          }

          // Si no encuentra datos de cédula tampoco
          return {
            success: false,
            error: 'No se encontraron datos. Por favor, revise los datos ingresados.'
          };
        }

        // Si hay contenido, intentar parsear JSON
        try {
          const dataArray = JSON.parse(responseText);
          console.log('📄 Datos recibidos de API SRI:', dataArray);

          // La API del SRI devuelve un array, tomamos el primer elemento
          const data = Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : null;

          if (data && data.numeroRuc && data.razonSocial) {
            // Guardar en caché para futuras consultas
            await guardarRUCEnCache(data);

            return {
              success: true,
              data: {
                numero_ruc: data.numeroRuc,
                razon_social: data.razonSocial,
                estado_contribuyente_ruc: data.estadoContribuyenteRuc,
                actividad_economica_principal: data.actividadEconomicaPrincipal,
                tipo_contribuyente: data.tipoContribuyente,
                regimen: data.regimen,
                categoria: data.categoria,
                obligado_llevar_contabilidad: data.obligadoLlevarContabilidad,
                agente_retencion: data.agenteRetencion,
                contribuyente_especial: data.contribuyenteEspecial,
                fecha_inicio_actividades: data.informacionFechasContribuyente?.fechaInicioActividades || null,
                fecha_cese: data.informacionFechasContribuyente?.fechaCese || null,
                fecha_reinicio_actividades: data.informacionFechasContribuyente?.fechaReinicioActividades || null,
                fecha_actualizacion: data.informacionFechasContribuyente?.fechaActualizacion || null,
                contribuyente_fantasma: data.contribuyenteFantasma,
                transacciones_inexistente: data.transaccionesInexistente,
                clasificacion_mipyme: data.clasificacionMiPyme,
                motivo_cancelacion_suspension: data.motivoCancelacionSuspension,
                representantes_legales: data.representantesLegales || [],
                establecimientos: data.establecimientos || []
              }
            };
          } else {
            console.log('📄 RUC no encontrado en SRI, buscando datos de cédula...');

            // Si no encuentra RUC, buscar datos de cédula
            const cedula = numeroRUC.slice(0, -3); // Remover '001' para obtener cédula
            console.log(`🔍 Buscando cédula: ${cedula}`);

            // PASO 1: Buscar en caché de cédulas
            const datosCedulaCache = await obtenerCedulaDesdeCache(cedula);
            if (datosCedulaCache) {
              console.log('✅ Datos de cédula encontrados en caché');
              return {
                success: true,
                data: {
                  numero_ruc: numeroRUC,
                  razon_social: `${datosCedulaCache.nombres} ${datosCedulaCache.apellidos}`,
                  estado_contribuyente_ruc: 'SIN RUC',
                  tipo_contribuyente: 'PERSONA NATURAL',
                  sin_ruc: true,
                  nombres: datosCedulaCache.nombres,
                  apellidos: datosCedulaCache.apellidos,
                  mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                }
              };
            }

            // PASO 2: Si no está en caché, consultar Zamplisoft por cédula
            console.log('🌐 Consultando Zamplisoft por cédula...');
            try {
              const zamplisoftUrl = `https://apiconsult.zampisoft.com/api/consultar?identificacion=${cedula}&token=cvZ1-zcMv-OKKh-AR29`;
              const proxyUrl = 'https://corsproxy.io/?';
              const apiUrl = proxyUrl + encodeURIComponent(zamplisoftUrl);

              const cedulaResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              });

              if (cedulaResponse.ok) {
                const cedulaData = await cedulaResponse.json();
                console.log('📄 Datos de cédula recibidos:', cedulaData);

                if (cedulaData && cedulaData.nombre) {
                  // Separar nombre completo en nombres y apellidos
                  const nombreCompleto = cedulaData.nombre.trim();
                  const partesNombre = nombreCompleto.split(' ');

                  // Lógica mejorada para separar nombres y apellidos
                  let nombres, apellidos;
                  if (partesNombre.length <= 2) {
                    // Si tiene 1 o 2 palabras, todo es nombre
                    nombres = nombreCompleto;
                    apellidos = '';
                  } else {
                    // Si tiene más de 2 palabras, los últimos 2 son apellidos
                    apellidos = partesNombre.slice(-2).join(' ');
                    nombres = partesNombre.slice(0, -2).join(' ');
                  }

                  console.log(`📝 Procesando nombre: "${nombreCompleto}" -> Nombres: "${nombres}", Apellidos: "${apellidos}"`);
                  console.log('🔍 Datos completos para retornar:', {
                    nombres,
                    apellidos,
                    nombreCompleto,
                    razon_social: `${nombres} ${apellidos}`.trim()
                  });

                  // Preparar datos completos para guardar en caché
                  const datosParaCache = {
                    nombres: nombres,
                    apellidos: apellidos,
                    fechaNacimiento: cedulaData.fechaNacimiento || '',
                    lugarNacimiento: cedulaData.lugarNacimiento || '',
                    estadoCivil: cedulaData.estadoCivil || '',
                    genero: cedulaData.genero || '',
                    nacionalidad: cedulaData.nacionalidad || 'Ecuatoriana',
                    provincia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[0] : '',
                    ciudad: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[1] : '',
                    parroquia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[2] : '',
                    direccion: `${cedulaData.calleDomicilio || ''} ${cedulaData.numeracionDomicilio || ''}`.trim(),
                    estado: 'Activo',
                    fechaCedulacion: cedulaData.fechaCedulacion || '',
                    nombreMadre: cedulaData.nombreMadre || '',
                    nombrePadre: cedulaData.nombrePadre || '',
                    conyuge: cedulaData.conyuge || ''
                  };

                  // Guardar en caché de cédulas
                  await guardarCedulaEnCache(cedula, datosParaCache);

                  return {
                    success: true,
                    data: {
                      numero_ruc: numeroRUC,
                      razon_social: nombreCompleto,
                      estado_contribuyente_ruc: 'SIN RUC',
                      tipo_contribuyente: 'PERSONA NATURAL',
                      sin_ruc: true,
                      nombres: nombres,
                      apellidos: apellidos,
                      edad: cedulaData.edad || '',
                      genero: cedulaData.genero || '',
                      nacionalidad: cedulaData.nacionalidad || 'Ecuatoriana',
                      provincia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[0] : '',
                      ciudad: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[1] : '',
                      parroquia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[2] : '',
                      direccion: `${cedulaData.calleDomicilio || ''} ${cedulaData.numeracionDomicilio || ''}`.trim(),
                      mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                    }
                  };
                }
              }
            } catch (cedulaError) {
              console.error('❌ Error al consultar cédula en Zamplisoft:', cedulaError);
            }

            // Si no encuentra datos de cédula tampoco
            return {
              success: false,
              error: 'No se encontraron datos. Por favor, revise los datos ingresados.'
            };
          }
        } catch (parseError) {
          console.error('❌ Error al parsear JSON:', parseError);
          console.log('📄 Respuesta que causó error:', responseText);
          return {
            success: false,
            error: 'Error al procesar la respuesta del SRI'
          };
        }
      } else {
        console.error('❌ Error en respuesta de API SRI:', response.status, response.statusText);
        console.log('📄 Contenido del error:', responseText);
        return {
          success: false,
          error: `Error del servidor SRI: ${response.status} ${response.statusText}`
        };
      }
    } catch (apiError) {
      console.error('❌ Error al consultar API SRI:', apiError);

      // Intentar con proxy alternativo
      try {
        console.log('🔄 Intentando con proxy alternativo...');
        const alternativeProxyUrl = 'https://api.allorigins.win/raw?url=';
        const sriUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?&ruc=${numeroRUC}`;
        const alternativeApiUrl = alternativeProxyUrl + encodeURIComponent(sriUrl);

        const altResponse = await fetch(alternativeApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (altResponse.ok) {
          const altResponseText = await altResponse.text();

          // Si la respuesta está vacía, significa que no hay RUC
          if (!altResponseText.trim()) {
            console.log('📄 RUC no encontrado en SRI (proxy alternativo), buscando datos de cédula...');

            // Si no encuentra RUC, buscar datos de cédula
            const cedula = numeroRUC.slice(0, -3); // Remover '001' para obtener cédula
            console.log(`🔍 Buscando cédula: ${cedula}`);

            // PASO 1: Buscar en caché de cédulas
            const datosCedulaCache = await obtenerCedulaDesdeCache(cedula);
            if (datosCedulaCache) {
              console.log('✅ Datos de cédula encontrados en caché');
              return {
                success: true,
                data: {
                  numero_ruc: numeroRUC,
                  razon_social: `${datosCedulaCache.nombres} ${datosCedulaCache.apellidos}`,
                  estado_contribuyente_ruc: 'SIN RUC',
                  tipo_contribuyente: 'PERSONA NATURAL',
                  sin_ruc: true,
                  nombres: datosCedulaCache.nombres,
                  apellidos: datosCedulaCache.apellidos,
                  mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                }
              };
            }

            // PASO 2: Si no está en caché, consultar Zamplisoft por cédula
            console.log('🌐 Consultando Zamplisoft por cédula...');
            try {
              const zamplisoftUrl = `https://apiconsult.zampisoft.com/api/consultar?identificacion=${cedula}&token=cvZ1-zcMv-OKKh-AR29`;
              const proxyUrl = 'https://corsproxy.io/?';
              const apiUrl = proxyUrl + encodeURIComponent(zamplisoftUrl);

              const cedulaResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              });

              if (cedulaResponse.ok) {
                const cedulaData = await cedulaResponse.json();
                console.log('📄 Datos de cédula recibidos:', cedulaData);

                if (cedulaData && cedulaData.nombre) {
                  // Separar nombre completo en nombres y apellidos
                  const nombreCompleto = cedulaData.nombre.trim();
                  const partesNombre = nombreCompleto.split(' ');

                  // Lógica mejorada para separar nombres y apellidos
                  let nombres, apellidos;
                  if (partesNombre.length <= 2) {
                    // Si tiene 1 o 2 palabras, todo es nombre
                    nombres = nombreCompleto;
                    apellidos = '';
                  } else {
                    // Si tiene más de 2 palabras, los últimos 2 son apellidos
                    apellidos = partesNombre.slice(-2).join(' ');
                    nombres = partesNombre.slice(0, -2).join(' ');
                  }

                  console.log(`📝 Procesando nombre: "${nombreCompleto}" -> Nombres: "${nombres}", Apellidos: "${apellidos}"`);
                  console.log('🔍 Datos completos para retornar:', {
                    nombres,
                    apellidos,
                    nombreCompleto,
                    razon_social: `${nombres} ${apellidos}`.trim()
                  });

                  // Preparar datos completos para guardar en caché
                  const datosParaCache = {
                    nombres: nombres,
                    apellidos: apellidos,
                    fechaNacimiento: cedulaData.fechaNacimiento || '',
                    lugarNacimiento: cedulaData.lugarNacimiento || '',
                    estadoCivil: cedulaData.estadoCivil || '',
                    genero: cedulaData.genero || '',
                    nacionalidad: cedulaData.nacionalidad || 'Ecuatoriana',
                    provincia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[0] : '',
                    ciudad: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[1] : '',
                    parroquia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[2] : '',
                    direccion: `${cedulaData.calleDomicilio || ''} ${cedulaData.numeracionDomicilio || ''}`.trim(),
                    estado: 'Activo',
                    fechaCedulacion: cedulaData.fechaCedulacion || '',
                    nombreMadre: cedulaData.nombreMadre || '',
                    nombrePadre: cedulaData.nombrePadre || '',
                    conyuge: cedulaData.conyuge || ''
                  };

                  // Guardar en caché de cédulas
                  await guardarCedulaEnCache(cedula, datosParaCache);

                  return {
                    success: true,
                    data: {
                      numero_ruc: numeroRUC,
                      razon_social: nombreCompleto,
                      estado_contribuyente_ruc: 'SIN RUC',
                      tipo_contribuyente: 'PERSONA NATURAL',
                      sin_ruc: true,
                      nombres: nombres,
                      apellidos: apellidos,
                      edad: cedulaData.edad || '',
                      genero: cedulaData.genero || '',
                      nacionalidad: cedulaData.nacionalidad || 'Ecuatoriana',
                      provincia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[0] : '',
                      ciudad: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[1] : '',
                      parroquia: cedulaData.lugarDomicilio ? cedulaData.lugarDomicilio.split('/')[2] : '',
                      direccion: `${cedulaData.calleDomicilio || ''} ${cedulaData.numeracionDomicilio || ''}`.trim(),
                      mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                    }
                  };
                }
              }
            } catch (cedulaError) {
              console.error('❌ Error al consultar cédula en Zamplisoft:', cedulaError);
            }

            // Si no encuentra datos de cédula tampoco
            return {
              success: false,
              error: 'No se encontraron datos. Por favor, revise los datos ingresados.'
            };
          }

          // Si hay contenido, intentar parsear JSON
          try {
            const dataArray = JSON.parse(altResponseText);
            const data = Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : null;

            if (data && data.numeroRuc && data.razonSocial) {
              await guardarRUCEnCache(data);
              return {
                success: true,
                data: {
                  numero_ruc: data.numeroRuc,
                  razon_social: data.razonSocial,
                  estado_contribuyente_ruc: data.estadoContribuyenteRuc,
                  actividad_economica_principal: data.actividadEconomicaPrincipal,
                  tipo_contribuyente: data.tipoContribuyente,
                  regimen: data.regimen,
                  categoria: data.categoria,
                  obligado_llevar_contabilidad: data.obligadoLlevarContabilidad,
                  agente_retencion: data.agenteRetencion,
                  contribuyente_especial: data.contribuyenteEspecial,
                  fecha_inicio_actividades: data.informacionFechasContribuyente?.fechaInicioActividades || null,
                  fecha_cese: data.informacionFechasContribuyente?.fechaCese || null,
                  fecha_reinicio_actividades: data.informacionFechasContribuyente?.fechaReinicioActividades || null,
                  fecha_actualizacion: data.informacionFechasContribuyente?.fechaActualizacion || null,
                  contribuyente_fantasma: data.contribuyenteFantasma,
                  transacciones_inexistente: data.transaccionesInexistente,
                  clasificacion_mipyme: data.clasificacionMiPyme,
                  motivo_cancelacion_suspension: data.motivoCancelacionSuspension,
                  representantes_legales: data.representantesLegales || [],
                  establecimientos: data.establecimientos || []
                }
              };
            } else {
              // Si no encuentra RUC en el proxy alternativo, buscar datos de cédula
              console.log('📄 RUC no encontrado en SRI (proxy alternativo), buscando datos de cédula...');

              const cedula = numeroRUC.slice(0, -3);
              console.log(`🔍 Buscando cédula: ${cedula}`);

              const datosCedulaCache = await obtenerCedulaDesdeCache(cedula);
              if (datosCedulaCache) {
                console.log('✅ Datos de cédula encontrados en caché');
                return {
                  success: true,
                  data: {
                    numero_ruc: numeroRUC,
                    razon_social: `${datosCedulaCache.nombres} ${datosCedulaCache.apellidos}`,
                    estado_contribuyente_ruc: 'SIN RUC',
                    tipo_contribuyente: 'PERSONA NATURAL',
                    sin_ruc: true,
                    nombres: datosCedulaCache.nombres,
                    apellidos: datosCedulaCache.apellidos,
                    mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                  }
                };
              }

              // Consultar Zamplisoft por cédula
              console.log('🌐 Consultando Zamplisoft por cédula...');
              try {
                const zamplisoftUrl = `https://apiconsult.zampisoft.com/api/consultar?identificacion=${cedula}&token=cvZ1-zcMv-OKKh-AR29`;
                const proxyUrl = 'https://corsproxy.io/?';
                const apiUrl = proxyUrl + encodeURIComponent(zamplisoftUrl);

                const cedulaResponse = await fetch(apiUrl, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json'
                  }
                });

                if (cedulaResponse.ok) {
                  const cedulaData = await cedulaResponse.json();
                  console.log('📄 Datos de cédula recibidos:', cedulaData);

                  if (cedulaData && cedulaData.nombres && cedulaData.apellidos) {
                    await guardarCedulaEnCache({
                      numero_cedula: cedula,
                      nombres: cedulaData.nombres,
                      apellidos: cedulaData.apellidos
                    });

                    return {
                      success: true,
                      data: {
                        numero_ruc: numeroRUC,
                        razon_social: `${cedulaData.nombres} ${cedulaData.apellidos}`,
                        estado_contribuyente_ruc: 'SIN RUC',
                        tipo_contribuyente: 'PERSONA NATURAL',
                        sin_ruc: true,
                        nombres: cedulaData.nombres,
                        apellidos: cedulaData.apellidos,
                        mensaje: 'Esta persona no tiene RUC (Registro Único de Contribuyentes)'
                      }
                    };
                  }
                }
              } catch (cedulaError) {
                console.error('❌ Error al consultar cédula en Zamplisoft:', cedulaError);
              }

              return {
                success: false,
                error: 'No se encontraron datos. Por favor, revise los datos ingresados.'
              };
            }
          } catch (parseError) {
            console.error('❌ Error al parsear JSON del proxy alternativo:', parseError);
            return {
              success: false,
              error: 'Error al procesar la respuesta del SRI'
            };
          }
        }
      } catch (altError) {
        console.error('❌ Error con proxy alternativo:', altError);
      }

      return {
        success: false,
        error: 'Error al consultar la API del SRI. Intenta nuevamente.'
      };
    }
  } catch (error) {
    console.error('❌ Error general en consultarRUC:', error);
    return {
      success: false,
      error: 'Error interno del sistema. Intenta nuevamente.'
    };
  }
};

// Función para obtener RUC desde caché local
const obtenerRUCDesdeCache = async (numeroRUC) => {
  try {
    const { data, error } = await supabase
      .from('cache_ruc')
      .select('*')
      .eq('numero_ruc', numeroRUC)
      .gte('fecha_consulta', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // 30 minutos
      .single();

    if (error || !data) {
      return null;
    }

    return {
      success: true,
      data: {
        numero_ruc: data.numero_ruc,
        razon_social: data.razon_social,
        estado_contribuyente_ruc: data.estado_contribuyente_ruc,
        actividad_economica_principal: data.actividad_economica_principal,
        tipo_contribuyente: data.tipo_contribuyente,
        regimen: data.regimen,
        categoria: data.categoria,
        obligado_llevar_contabilidad: data.obligado_llevar_contabilidad,
        agente_retencion: data.agente_retencion,
        contribuyente_especial: data.contribuyente_especial,
        fecha_inicio_actividades: data.fecha_inicio_actividades,
        fecha_cese: data.fecha_cese,
        fecha_reinicio_actividades: data.fecha_reinicio_actividades,
        fecha_actualizacion: data.fecha_actualizacion,
        contribuyente_fantasma: data.contribuyente_fantasma,
        transacciones_inexistente: data.transacciones_inexistente,
        clasificacion_mipyme: data.clasificacion_mipyme,
        motivo_cancelacion_suspension: data.motivo_cancelacion_suspension,
        representantes_legales: data.representantes_legales || [],
        establecimientos: data.establecimientos || []
      }
    };
  } catch (error) {
    console.error('Error al obtener RUC desde caché:', error);
    return null;
  }
};

// Función para guardar RUC en caché local
const guardarRUCEnCache = async (data) => {
  try {
    const cacheData = {
      numero_ruc: data.numeroRuc,
      razon_social: data.razonSocial,
      estado_contribuyente_ruc: data.estadoContribuyenteRuc,
      actividad_economica_principal: data.actividadEconomicaPrincipal,
      tipo_contribuyente: data.tipoContribuyente,
      regimen: data.regimen,
      categoria: data.categoria,
      obligado_llevar_contabilidad: data.obligadoLlevarContabilidad,
      agente_retencion: data.agenteRetencion,
      contribuyente_especial: data.contribuyenteEspecial,
      fecha_inicio_actividades: data.informacionFechasContribuyente?.fechaInicioActividades || null,
      fecha_cese: data.informacionFechasContribuyente?.fechaCese || null,
      fecha_reinicio_actividades: data.informacionFechasContribuyente?.fechaReinicioActividades || null,
      fecha_actualizacion: data.informacionFechasContribuyente?.fechaActualizacion || null,
      contribuyente_fantasma: data.contribuyenteFantasma,
      transacciones_inexistente: data.transaccionesInexistente,
      clasificacion_mipyme: data.clasificacionMiPyme,
      motivo_cancelacion_suspension: data.motivoCancelacionSuspension,
      representantes_legales: data.representantesLegales || [],
      establecimientos: data.establecimientos || []
    };

    const { error } = await supabase
      .from('cache_ruc')
      .upsert(cacheData, { onConflict: 'numero_ruc' });

    if (error) {
      console.error('Error al guardar RUC en caché:', error);
    } else {
      console.log('✅ RUC guardado en caché local');
    }
  } catch (error) {
    console.error('Error al guardar RUC en caché:', error);
  }
};

// ========================================
// FUNCIONES PARA SOLICITUDES DE ANTIGÜEDAD
// ========================================

/**
 * Inserta una nueva solicitud de RUC con antigüedad
 * @param {Object} solicitudData - Datos de la solicitud
 * @returns {Promise<Object>} - Solicitud creada
 */
export const insertSolicitudAntiguedad = async (solicitudData) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .insert([solicitudData])
      .select()
      .single();

    if (error) {
      console.error('Error al insertar solicitud de antigüedad:', error);
      throw error;
    }

    console.log('✅ Solicitud de antigüedad creada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en insertSolicitudAntiguedad:', error);
    throw error;
  }
};

/**
 * Actualiza una solicitud de RUC con antigüedad
 * @param {string} id - ID de la solicitud
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - Solicitud actualizada
 */
export const updateSolicitudAntiguedad = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar solicitud de antigüedad:', error);
      throw error;
    }

    console.log('✅ Solicitud de antigüedad actualizada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en updateSolicitudAntiguedad:', error);
    throw error;
  }
};

/**
 * Obtiene una solicitud de RUC con antigüedad por ID
 * @param {string} id - ID de la solicitud
 * @returns {Promise<Object>} - Solicitud encontrada
 */
export const getSolicitudAntiguedad = async (id) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener solicitud de antigüedad:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error en getSolicitudAntiguedad:', error);
    throw error;
  }
};

/**
 * Obtiene todas las solicitudes de RUC con antigüedad por número de cédula
 * @param {string} numeroCedula - Número de cédula
 * @returns {Promise<Array>} - Lista de solicitudes
 */
export const getSolicitudesAntiguedadByCedula = async (numeroCedula) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .select('*')
      .eq('numero_cedula', numeroCedula)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al obtener solicitudes por cédula:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getSolicitudesAntiguedadByCedula:', error);
    throw error;
  }
};

/**
 * Obtiene todas las solicitudes de RUC con antigüedad por distribuidor
 * @param {string} correoDistribuidor - Email del distribuidor
 * @returns {Promise<Array>} - Lista de solicitudes
 */
export const getSolicitudesAntiguedadByDistribuidor = async (correoDistribuidor) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .select('*')
      .eq('correo_distribuidor', correoDistribuidor)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al obtener solicitudes por distribuidor:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getSolicitudesAntiguedadByDistribuidor:', error);
    throw error;
  }
};

/**
 * Obtiene todas las solicitudes de RUC con antigüedad por código de distribuidor
 * @param {string} codigoDistribuidor - Código del distribuidor
 * @returns {Promise<Array>} - Lista de solicitudes
 */
export const getSolicitudesAntiguedadByCodigoDistribuidor = async (codigoDistribuidor) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .select('*')
      .eq('codigo_distribuidor', codigoDistribuidor)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al obtener solicitudes por código de distribuidor:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getSolicitudesAntiguedadByCodigoDistribuidor:', error);
    throw error;
  }
};

/**
 * Obtiene todas las solicitudes de RUC con antigüedad por estado
 * @param {string} estado - Estado del trámite
 * @returns {Promise<Array>} - Lista de solicitudes
 */
export const getSolicitudesAntiguedadByEstado = async (estado) => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .select('*')
      .eq('estado_tramite', estado)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al obtener solicitudes por estado:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getSolicitudesAntiguedadByEstado:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de solicitudes de RUC con antigüedad
 * @returns {Promise<Object>} - Estadísticas
 */
export const getEstadisticasSolicitudesAntiguedad = async () => {
  try {
    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .select('estado_tramite, fecha_creacion, precio_total');

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }

    const estadisticas = {
      total: data.length,
      pendientes: data.filter(s => s.estado_tramite === 'pendiente').length,
      procesando: data.filter(s => s.estado_tramite === 'procesando').length,
      completados: data.filter(s => s.estado_tramite === 'completado').length,
      rechazados: data.filter(s => s.estado_tramite === 'rechazado').length,
      ingresos_totales: data.reduce((sum, s) => sum + (s.precio_total || 0), 0),
      ingresos_mes_actual: data
        .filter(s => {
          const fechaCreacion = new Date(s.fecha_creacion);
          const mesActual = new Date();
          return fechaCreacion.getMonth() === mesActual.getMonth() &&
            fechaCreacion.getFullYear() === mesActual.getFullYear();
        })
        .reduce((sum, s) => sum + (s.precio_total || 0), 0)
    };

    return estadisticas;
  } catch (error) {
    console.error('❌ Error en getEstadisticasSolicitudesAntiguedad:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una solicitud de RUC con antigüedad
 * @param {string} id - ID de la solicitud
 * @param {string} nuevoEstado - Nuevo estado
 * @param {string} observaciones - Observaciones opcionales
 * @returns {Promise<Object>} - Solicitud actualizada
 */
export const actualizarEstadoSolicitudAntiguedad = async (id, nuevoEstado, observaciones = null) => {
  try {
    const updates = {
      estado_tramite: nuevoEstado,
      fecha_actualizacion: new Date().toISOString()
    };

    // Agregar fecha específica según el estado
    if (nuevoEstado === 'procesando') {
      updates.fecha_procesamiento = new Date().toISOString();
    } else if (nuevoEstado === 'completado') {
      updates.fecha_completado = new Date().toISOString();
    }

    // Agregar observaciones si se proporcionan
    if (observaciones) {
      updates.observaciones = observaciones;
    }

    const { data, error } = await supabase
      .from('solicitudesantiguedad')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }

    console.log(`✅ Estado actualizado a ${nuevoEstado}:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error en actualizarEstadoSolicitudAntiguedad:', error);
    throw error;
  }
};

// ============================================
// FUNCIONES PARA EMPRESAS SCVS
// ============================================

/**
 * Buscar empresa por RUC
 * @param {string} ruc - RUC de la empresa (13 dígitos)
 * @returns {Promise<Object|null>} - Datos de la empresa o null si no existe
 */
export const buscarEmpresaPorRUC = async (ruc) => {
  try {
    console.log('🔍 Buscando empresa por RUC:', ruc);

    const { data, error } = await supabase
      .from('empresas_scvs')
      .select('*')
      .eq('ruc', ruc)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró la empresa
        console.log('ℹ️ No se encontró empresa con RUC:', ruc);
        return null;
      }
      console.error('Error al buscar empresa:', error);
      throw error;
    }

    console.log('✅ Empresa encontrada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en buscarEmpresaPorRUC:', error);
    throw error;
  }
};

/**
 * Buscar empresa por expediente
 * @param {string} expediente - Número de expediente
 * @returns {Promise<Object|null>} - Datos de la empresa o null si no existe
 */
export const buscarEmpresaPorExpediente = async (expediente) => {
  try {
    console.log('🔍 Buscando empresa por expediente:', expediente);

    const { data, error } = await supabase
      .from('empresas_scvs')
      .select('*')
      .eq('expediente', expediente)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No se encontró empresa con expediente:', expediente);
        return null;
      }
      console.error('Error al buscar empresa:', error);
      throw error;
    }

    console.log('✅ Empresa encontrada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en buscarEmpresaPorExpediente:', error);
    throw error;
  }
};

/**
 * Insertar o actualizar empresa (upsert)
 * @param {Object} empresaData - Datos de la empresa
 * @returns {Promise<Object>} - Empresa insertada o actualizada
 */
export const upsertEmpresa = async (empresaData) => {
  try {
    if (!empresaData.ruc) {
      throw new Error('El RUC es requerido');
    }

    // Normalizar RUC (solo números, 13 dígitos)
    const rucNormalizado = empresaData.ruc.replace(/\D/g, '').substring(0, 13);
    if (rucNormalizado.length !== 13) {
      throw new Error('El RUC debe tener 13 dígitos');
    }

    empresaData.ruc = rucNormalizado;

    const { data, error } = await supabase
      .from('empresas_scvs')
      .upsert(empresaData, {
        onConflict: 'ruc',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error al insertar/actualizar empresa:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error en upsertEmpresa:', error);
    throw error;
  }
};

/**
 * Insertar múltiples empresas (carga masiva)
 * @param {Array<Object>} empresas - Array de objetos con datos de empresas
 * @param {Function} onProgress - Callback para reportar progreso (opcional)
 * @returns {Promise<Object>} - Resumen de la operación
 */
export const insertarEmpresasMasivo = async (empresas, onProgress = null) => {
  try {
    console.log(`📊 Iniciando carga masiva de ${empresas.length} empresas...`);

    // Validar que haya empresas para procesar
    if (!empresas || empresas.length === 0) {
      console.warn('⚠️ No hay empresas para cargar');
      return {
        total: 0,
        insertadas: 0,
        actualizadas: 0,
        errores: 0,
        erroresDetalle: []
      };
    }

    // Verificar que la tabla existe (hacer una consulta simple)
    console.log('🔍 Verificando conexión con la tabla empresas_scvs...');
    const { error: testError } = await supabase
      .from('empresas_scvs')
      .select('ruc')
      .limit(1);

    if (testError) {
      console.error('❌ Error al acceder a la tabla empresas_scvs:', testError);
      console.error('💡 Asegúrate de que:');
      console.error('   1. La tabla empresas_scvs existe en Supabase');
      console.error('   2. Has ejecutado el script SQL: supabase_empresas_scvs.sql');
      console.error('   3. Tienes permisos para insertar datos');
      throw new Error(`No se puede acceder a la tabla empresas_scvs: ${testError.message}`);
    }
    console.log('✅ Conexión con la tabla verificada');

    const resultados = {
      total: empresas.length,
      insertadas: 0,
      actualizadas: 0,
      errores: 0,
      erroresDetalle: []
    };

    // Procesar en lotes de 1000 para evitar problemas de memoria
    const tamañoLote = 1000;
    const lotes = [];

    for (let i = 0; i < empresas.length; i += tamañoLote) {
      lotes.push(empresas.slice(i, i + tamañoLote));
    }

    console.log(`📦 Procesando ${lotes.length} lotes de hasta ${tamañoLote} empresas cada uno`);

    for (let loteIndex = 0; loteIndex < lotes.length; loteIndex++) {
      const lote = lotes[loteIndex];
      console.log(`📦 Procesando lote ${loteIndex + 1}/${lotes.length} (${lote.length} empresas)...`);

      // Normalizar y validar datos del lote
      const loteNormalizado = lote.map(empresa => {
        // Normalizar RUC
        if (empresa.ruc) {
          const rucNormalizado = String(empresa.ruc).replace(/\D/g, '').substring(0, 13);
          if (rucNormalizado.length === 13) {
            empresa.ruc = rucNormalizado;
          } else {
            return null; // RUC inválido, se omitirá
          }
        } else {
          return null; // Sin RUC, se omitirá
        }

        // Normalizar otros campos
        if (empresa.fecha_constitucion !== undefined && empresa.fecha_constitucion !== null && empresa.fecha_constitucion !== '') {
          // Intentar convertir a formato de fecha
          let fecha = null;
          const valorOriginal = empresa.fecha_constitucion;

          // Si es un número (fecha serial de Excel), convertir
          if (typeof empresa.fecha_constitucion === 'number') {
            // Excel almacena fechas como números (días desde 1900-01-01)
            // Nota: Excel tiene un bug donde considera 1900 como año bisiesto
            const fechaBase = new Date(1900, 0, 1);
            fecha = new Date(fechaBase.getTime() + (empresa.fecha_constitucion - 2) * 24 * 60 * 60 * 1000);
          } else {
            // Intentar parsear como string
            const fechaStr = String(empresa.fecha_constitucion).trim();

            // Intentar diferentes formatos
            // Formato DD/MM/YYYY o DD-MM-YYYY
            let fechaMatch = fechaStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
            if (fechaMatch) {
              fecha = new Date(parseInt(fechaMatch[3]), parseInt(fechaMatch[2]) - 1, parseInt(fechaMatch[1]));
            } else {
              // Formato YYYY-MM-DD o YYYY/MM/DD
              fechaMatch = fechaStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
              if (fechaMatch) {
                fecha = new Date(parseInt(fechaMatch[1]), parseInt(fechaMatch[2]) - 1, parseInt(fechaMatch[3]));
              } else {
                // Intentar parseo directo
                fecha = new Date(fechaStr);
              }
            }
          }

          if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1900 && fecha.getFullYear() < 2100) {
            empresa.fecha_constitucion = fecha.toISOString().split('T')[0];
          } else {
            // Si no se puede convertir, intentar extraer de formato YYYY-MM-DD
            const fechaStr = String(valorOriginal).trim();
            const fechaMatch = fechaStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if (fechaMatch) {
              empresa.fecha_constitucion = `${fechaMatch[1]}-${fechaMatch[2].padStart(2, '0')}-${fechaMatch[3].padStart(2, '0')}`;
            } else {
              // Último intento: mantener el valor si parece una fecha válida
              if (fechaStr.length >= 8 && fechaStr.length <= 10) {
                empresa.fecha_constitucion = fechaStr;
              } else {
                empresa.fecha_constitucion = null;
              }
            }
          }
        } else {
          empresa.fecha_constitucion = null;
        }

        if (empresa.fecha_presentacion_balance_inicial) {
          let fecha = null;

          // Si es un número (fecha serial de Excel), convertir
          if (typeof empresa.fecha_presentacion_balance_inicial === 'number') {
            const fechaBase = new Date(1900, 0, 1);
            fecha = new Date(fechaBase.getTime() + (empresa.fecha_presentacion_balance_inicial - 2) * 24 * 60 * 60 * 1000);
          } else {
            fecha = new Date(empresa.fecha_presentacion_balance_inicial);
          }

          if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1900 && fecha.getFullYear() < 2100) {
            empresa.fecha_presentacion_balance_inicial = fecha.toISOString().split('T')[0];
          } else {
            const fechaStr = String(empresa.fecha_presentacion_balance_inicial).trim();
            const fechaMatch = fechaStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if (fechaMatch) {
              empresa.fecha_presentacion_balance_inicial = `${fechaMatch[1]}-${fechaMatch[2].padStart(2, '0')}-${fechaMatch[3].padStart(2, '0')}`;
            } else {
              empresa.fecha_presentacion_balance_inicial = null;
            }
          }
        }

        // Convertir booleanos para presento_balance_inicial
        if (empresa.presento_balance_inicial !== undefined && empresa.presento_balance_inicial !== null && empresa.presento_balance_inicial !== '') {
          const valorStr = String(empresa.presento_balance_inicial).toUpperCase().trim();
          // Convertir diferentes formatos a booleano
          if (valorStr === 'SI' || valorStr === 'YES' || valorStr === 'TRUE' || valorStr === '1' || valorStr === 'VERDADERO') {
            empresa.presento_balance_inicial = true;
          } else if (valorStr === 'NO' || valorStr === 'NO' || valorStr === 'FALSE' || valorStr === '0' || valorStr === 'FALSO') {
            empresa.presento_balance_inicial = false;
          } else {
            // Intentar convertir a booleano directamente
            empresa.presento_balance_inicial = Boolean(empresa.presento_balance_inicial);
          }
        } else {
          empresa.presento_balance_inicial = null;
        }

        return empresa;
      }).filter(empresa => empresa !== null); // Filtrar empresas inválidas

      if (loteNormalizado.length === 0) {
        console.log(`⚠️ Lote ${loteIndex + 1} no tiene empresas válidas, saltando...`);
        continue;
      }

      // Insertar/actualizar el lote
      if (loteIndex === 0 || (loteIndex + 1) % 10 === 0) {
        console.log(`💾 Procesando lote ${loteIndex + 1}/${lotes.length} (${loteNormalizado.length} empresas)...`);
      }

      // DEBUG: Verificar estructura de datos antes de insertar (solo primer lote)
      if (loteIndex === 0 && loteNormalizado.length > 0) {
        const ejemplo = loteNormalizado[0];
        console.log('📋 Ejemplo de empresa a insertar:', {
          ruc: ejemplo.ruc,
          nombre: ejemplo.nombre,
          fecha_constitucion: ejemplo.fecha_constitucion,
          tipo_compania: ejemplo.tipo_compania,
          todasLasPropiedades: Object.keys(ejemplo),
          valoresCompletos: ejemplo
        });

        // Verificar que no tenga propiedades no permitidas
        const propiedadesPermitidas = [
          'numero_fila', 'expediente', 'ruc', 'nombre', 'situacion_legal',
          'fecha_constitucion', 'tipo_compania', 'pais', 'region', 'provincia',
          'canton', 'ciudad', 'calle', 'numero', 'interseccion', 'barrio',
          'telefono', 'representante', 'cargo', 'capital_suscrito',
          'ciiu_nivel_1', 'ciiu_nivel_6', 'ultimo_ano_balance',
          'presento_balance_inicial', 'fecha_presentacion_balance_inicial'
        ];

        const propiedadesNoPermitidas = Object.keys(ejemplo).filter(
          key => !propiedadesPermitidas.includes(key) && key !== '_logged'
        );

        if (propiedadesNoPermitidas.length > 0) {
          console.warn('⚠️ Propiedades no permitidas encontradas:', propiedadesNoPermitidas);
        }
      }

      // Limpiar propiedades no permitidas antes de insertar
      const loteLimpio = loteNormalizado.map(empresa => {
        const empresaLimpia = {};
        const propiedadesPermitidas = [
          'numero_fila', 'expediente', 'ruc', 'nombre', 'situacion_legal',
          'fecha_constitucion', 'tipo_compania', 'pais', 'region', 'provincia',
          'canton', 'ciudad', 'calle', 'numero', 'interseccion', 'barrio',
          'telefono', 'representante', 'cargo', 'capital_suscrito',
          'ciiu_nivel_1', 'ciiu_nivel_6', 'ultimo_ano_balance',
          'presento_balance_inicial', 'fecha_presentacion_balance_inicial'
        ];

        propiedadesPermitidas.forEach(prop => {
          // Incluir el campo si tiene un valor válido (no undefined, no null, y no string vacío para fechas)
          if (empresa[prop] !== undefined && empresa[prop] !== null) {
            // Para fechas, asegurarse de que no sea string vacío
            if (prop === 'fecha_constitucion' || prop === 'fecha_presentacion_balance_inicial') {
              const valorStr = String(empresa[prop]).trim();
              if (valorStr !== '' && valorStr !== 'null' && valorStr !== 'undefined') {
                empresaLimpia[prop] = empresa[prop];
              }
            } else {
              empresaLimpia[prop] = empresa[prop];
            }
          }
        });

        // Asegurar que fecha_constitucion se incluya si tiene valor válido
        if (empresa.fecha_constitucion && empresa.fecha_constitucion !== null && empresa.fecha_constitucion !== '') {
          const fechaStr = String(empresa.fecha_constitucion).trim();
          // Validar formato de fecha (YYYY-MM-DD)
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/) || fechaStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
            empresaLimpia.fecha_constitucion = empresa.fecha_constitucion;
          } else {
            console.warn(`⚠️ Formato de fecha inválido para RUC ${empresa.ruc}: ${fechaStr}`);
          }
        }

        // DEBUG: Verificar fecha_constitucion en el primer lote
        if (loteIndex === 0 && empresa.ruc === loteNormalizado[0]?.ruc) {
          console.log('🔍 DEBUG fecha_constitucion:', {
            original: empresa.fecha_constitucion,
            tipo: typeof empresa.fecha_constitucion,
            enLimpia: empresaLimpia.fecha_constitucion,
            todasLasProps: Object.keys(empresaLimpia),
            tieneFechaEnLimpia: 'fecha_constitucion' in empresaLimpia
          });
        }

        return empresaLimpia;
      });

      // DEBUG: Verificar que fecha_constitucion esté presente antes de insertar
      if (loteIndex === 0 && loteLimpio.length > 0) {
        const ejemploLimpio = loteLimpio[0];
        console.log('🔍 DEBUG antes de upsert:', {
          ruc: ejemploLimpio.ruc,
          fecha_constitucion: ejemploLimpio.fecha_constitucion,
          tipo_fecha: typeof ejemploLimpio.fecha_constitucion,
          tieneFecha: 'fecha_constitucion' in ejemploLimpio,
          todasLasProps: Object.keys(ejemploLimpio)
        });
      }

      const { data, error } = await supabase
        .from('empresas_scvs')
        .upsert(loteLimpio, {
          onConflict: 'ruc',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        // Mostrar detalles del error en TODOS los primeros lotes para diagnosticar
        if (loteIndex < 5) {
          console.error(`❌ Error en lote ${loteIndex + 1}:`, error);
          console.error(`❌ Detalles del error:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          // Mostrar ejemplo de empresa que causó el error
          if (loteLimpio.length > 0) {
            console.error(`❌ Ejemplo de empresa del lote (limpia):`, loteLimpio[0]);
            console.error(`❌ Todas las propiedades:`, Object.keys(loteLimpio[0]));
            console.error(`❌ Valores:`, JSON.stringify(loteLimpio[0], null, 2));
          }
        }
        resultados.errores += loteLimpio.length;
        resultados.erroresDetalle.push({
          lote: loteIndex + 1,
          error: error.message,
          detalles: error.details || error.hint || '',
          code: error.code
        });
      } else {
        // Contar cuántas fueron insertadas vs actualizadas
        const cantidadProcesada = data ? data.length : loteLimpio.length;
        resultados.insertadas += cantidadProcesada;

        // Solo log cada 10 lotes o al final
        if ((loteIndex + 1) % 10 === 0 || loteIndex === lotes.length - 1) {
          console.log(`✅ Lote ${loteIndex + 1}/${lotes.length} completado: ${cantidadProcesada} empresas procesadas`);
        }

        // DEBUG: Mostrar ejemplo de empresa insertada en el primer lote
        if (loteIndex === 0 && data && data.length > 0) {
          console.log('✅ Ejemplo de empresa insertada exitosamente:', data[0]);
        }
      }

      // Reportar progreso
      if (onProgress) {
        const progreso = Math.round(((loteIndex + 1) / lotes.length) * 100);
        onProgress(progreso, loteIndex + 1, lotes.length);
      }

      // Pequeña pausa para no sobrecargar la base de datos
      if (loteIndex < lotes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('✅ Carga masiva completada:', resultados);
    return resultados;
  } catch (error) {
    console.error('❌ Error en insertarEmpresasMasivo:', error);
    throw error;
  }
};

/**
 * Buscar empresas por nombre (búsqueda parcial)
 * @param {string} nombre - Nombre o parte del nombre de la empresa
 * @param {number} limite - Límite de resultados (default: 50)
 * @returns {Promise<Array>} - Array de empresas encontradas
 */
export const buscarEmpresasPorNombre = async (nombre, limite = 50) => {
  try {
    console.log('🔍 Buscando empresas por nombre:', nombre);

    const { data, error } = await supabase
      .from('empresas_scvs')
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .limit(limite);

    if (error) {
      console.error('Error al buscar empresas:', error);
      throw error;
    }

    console.log(`✅ Encontradas ${data.length} empresas`);
    return data || [];
  } catch (error) {
    console.error('❌ Error en buscarEmpresasPorNombre:', error);
    throw error;
  }
};

/**
 * Obtener descripción de actividad CIIU por código.
 * UNA SOLA CONSULTA: busca directamente el código en la tabla ciiu4_actividades
 * @param {string} codigo - Código de la actividad CIIU (ej: "M6920.03")
 * @returns {Promise<string|null>} - Descripción de la actividad o null si no se encuentra
 */
export const obtenerDescripcionActividadCIIU = async (codigo) => {
  try {
    if (!codigo || !codigo.trim()) {
      return null;
    }

    const codigoLimpio = codigo.trim();
    console.log('🔍 UNA SOLA CONSULTA para código:', codigoLimpio);

    // UNA SOLA CONSULTA: usar columnas en mayúsculas (como están definidas en la tabla)
    const { data, error } = await supabase
      .from('ciiu4_actividades')
      .select('DESCRIPCION')
      .eq('CODIGO', codigoLimpio)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`ℹ️ No se encontró actividad con código: "${codigoLimpio}"`);
      } else {
        console.error('❌ Error al buscar actividad CIIU:', error);
      }
      return null;
    }

    if (data && data.DESCRIPCION) {
      console.log('✅ Descripción encontrada');
      return data.DESCRIPCION;
    }

    return null;
  } catch (error) {
    console.error('❌ Error en obtenerDescripcionActividadCIIU:', error);
    return null;
  }
};

// ==========================================
// MÓDULO DE FIRMAS ELECTRÓNICAS P12
// ==========================================

export const getFirmasGuardadas = async () => {
  try {
    const { data, error } = await supabase
      .from('firmas_electronicas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener firmas:', error);
    return { success: false, error: error.message };
  }
};

export const uploadFirmaP12 = async (file, nombre, password) => {
  try {
    // 1. Crear nombre único y ruta para el bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `firma_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Subir archivo al bucket firmas_p12
    const { error: storageError } = await supabase.storage
      .from('firmas_p12')
      .upload(filePath, file);

    if (storageError) throw new Error(`Error subiendo archivo: ${storageError.message}`);

    // 3. Guardar registro en la base de datos
    const { data, error: dbError } = await supabase
      .from('firmas_electronicas')
      .insert([{
        nombre,
        storage_path: filePath,
        password
      }])
      .select()
      .single();

    if (dbError) {
      // Intentar borrar el archivo si falló el insert
      await supabase.storage.from('firmas_p12').remove([filePath]);
      throw new Error(`Error guardando en BD: ${dbError.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en uploadFirmaP12:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFirma = async (id, storagePath) => {
  try {
    // 1. Borrar de Storage
    const { error: storageError } = await supabase.storage
      .from('firmas_p12')
      .remove([storagePath]);

    if (storageError) console.error('Error borrando archivo P12, continuando con BD...', storageError);

    // 2. Borrar de Base de Datos
    const { error: dbError } = await supabase
      .from('firmas_electronicas')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return { success: true };
  } catch (error) {
    console.error('Error en deleteFirma:', error);
    return { success: false, error: error.message };
  }
};

export const downloadFirmaP12 = async (storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('firmas_p12')
      .download(storagePath);

    if (error) throw error;
    return { success: true, data }; // data es un Blob
  } catch (error) {
    console.error('Error descargando firma:', error);
    return { success: false, error: error.message };
  }
};