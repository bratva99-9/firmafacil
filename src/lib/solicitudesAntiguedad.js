// Funciones para manejar solicitudes de RUC con antigüedad
import { supabase } from './supabase';

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
