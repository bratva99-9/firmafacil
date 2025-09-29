-- Tabla para caché de consultas de cédulas
CREATE TABLE IF NOT EXISTS cache_cedulas (
  id SERIAL PRIMARY KEY,
  numero_cedula VARCHAR(20) UNIQUE NOT NULL,
  nombres VARCHAR(200),
  apellidos VARCHAR(200),
  fecha_nacimiento VARCHAR(50),
  lugar_nacimiento VARCHAR(200),
  estado_civil VARCHAR(50),
  genero VARCHAR(20),
  nacionalidad VARCHAR(50),
  provincia VARCHAR(100),
  ciudad VARCHAR(100),
  parroquia VARCHAR(100),
  direccion TEXT,
  estado VARCHAR(50),
  edad VARCHAR(10),
  -- Campos adicionales de la API real de Zamplisoft
  fecha_cedulacion VARCHAR(50),
  nombre_madre VARCHAR(200),
  nombre_padre VARCHAR(200),
  instruccion VARCHAR(100),
  profesion VARCHAR(100),
  conyuge VARCHAR(200),
  fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por número de cédula
CREATE INDEX IF NOT EXISTS idx_cache_cedulas_numero ON cache_cedulas(numero_cedula);

-- Índice para limpieza de registros expirados
CREATE INDEX IF NOT EXISTS idx_cache_cedulas_expiracion ON cache_cedulas(fecha_expiracion);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_cache_cedulas_updated_at 
    BEFORE UPDATE ON cache_cedulas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Política RLS para permitir acceso a todos los usuarios autenticados
ALTER TABLE cache_cedulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso a cache_cedulas para usuarios autenticados" ON cache_cedulas
    FOR ALL USING (auth.role() = 'authenticated');

-- Función para limpiar registros expirados (opcional, se puede ejecutar periódicamente)
CREATE OR REPLACE FUNCTION limpiar_cache_expirado()
RETURNS INTEGER AS $$
DECLARE
    registros_eliminados INTEGER;
BEGIN
    DELETE FROM cache_cedulas 
    WHERE fecha_expiracion < NOW();
    
    GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
    RETURN registros_eliminados;
END;
$$ LANGUAGE plpgsql;
