-- Script para crear tabla de caché de RUC con TTL de 30 minutos
-- Este script debe ejecutarse en Supabase

-- Crear tabla de caché de RUC
CREATE TABLE IF NOT EXISTS cache_ruc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ruc TEXT UNIQUE NOT NULL,
  razon_social TEXT,
  estado_contribuyente_ruc TEXT,
  actividad_economica_principal TEXT,
  tipo_contribuyente TEXT,
  regimen TEXT,
  categoria TEXT,
  obligado_llevar_contabilidad TEXT,
  agente_retencion TEXT,
  contribuyente_especial TEXT,
  fecha_inicio_actividades TIMESTAMP WITH TIME ZONE,
  fecha_cese TIMESTAMP WITH TIME ZONE,
  fecha_reinicio_actividades TIMESTAMP WITH TIME ZONE,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE,
  contribuyente_fantasma TEXT,
  transacciones_inexistente TEXT,
  clasificacion_mipyme TEXT,
  motivo_cancelacion_suspension TEXT,
  representantes_legales JSONB DEFAULT '[]',
  establecimientos JSONB DEFAULT '[]',
  fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para caché de RUC
ALTER TABLE cache_ruc ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer el caché (es información pública)
CREATE POLICY "Anyone can view cache_ruc" ON cache_ruc
  FOR SELECT USING (true);

-- Política para que todos puedan insertar en el caché
CREATE POLICY "Anyone can insert cache_ruc" ON cache_ruc
  FOR INSERT WITH CHECK (true);

-- Política para limpiar caché expirado (solo para sistema)
CREATE POLICY "System can delete expired cache_ruc" ON cache_ruc
  FOR DELETE USING (
    fecha_consulta < NOW() - INTERVAL '30 minutes'
  );

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_cache_ruc_numero ON cache_ruc(numero_ruc);
CREATE INDEX IF NOT EXISTS idx_cache_ruc_fecha_consulta ON cache_ruc(fecha_consulta);

-- Función para limpiar caché expirado automáticamente
CREATE OR REPLACE FUNCTION limpiar_cache_ruc_expirado()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_ruc 
  WHERE fecha_consulta < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para limpiar caché automáticamente cada vez que se consulta
CREATE OR REPLACE FUNCTION trigger_limpiar_cache_ruc()
RETURNS TRIGGER AS $$
BEGIN
  -- Limpiar caché expirado antes de insertar nuevos datos
  PERFORM limpiar_cache_ruc_expirado();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar limpieza automática
CREATE TRIGGER trigger_cache_ruc_limpieza
  BEFORE INSERT ON cache_ruc
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_limpiar_cache_ruc();

-- Comentarios para documentar la estructura
COMMENT ON TABLE cache_ruc IS 'Tabla para almacenar caché de consultas RUC con TTL de 30 minutos';
COMMENT ON COLUMN cache_ruc.numero_ruc IS 'Número de RUC consultado';
COMMENT ON COLUMN cache_ruc.razon_social IS 'Razón social del contribuyente';
COMMENT ON COLUMN cache_ruc.estado_contribuyente_ruc IS 'Estado del contribuyente (ACTIVO, INACTIVO, etc.)';
COMMENT ON COLUMN cache_ruc.actividad_economica_principal IS 'Actividad económica principal';
COMMENT ON COLUMN cache_ruc.fecha_inicio_actividades IS 'Fecha de inicio de actividades';
COMMENT ON COLUMN cache_ruc.fecha_consulta IS 'Fecha y hora de la consulta (para TTL)';
COMMENT ON COLUMN cache_ruc.representantes_legales IS 'Lista de representantes legales en formato JSON';
COMMENT ON COLUMN cache_ruc.establecimientos IS 'Lista de establecimientos en formato JSON';
