-- Script para agregar codigo_distribuidor a la tabla existente
-- Ejecutar este script en Supabase SQL Editor

-- Agregar el campo codigo_distribuidor
ALTER TABLE solicitudesantiguedad 
ADD COLUMN IF NOT EXISTS codigo_distribuidor VARCHAR(20);

-- Crear índice para el nuevo campo
CREATE INDEX IF NOT EXISTS idx_solicitudesantiguedad_codigo_distribuidor 
ON solicitudesantiguedad(codigo_distribuidor);

-- Agregar comentario al campo
COMMENT ON COLUMN solicitudesantiguedad.codigo_distribuidor IS 'Código único del distribuidor que procesa la solicitud';

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'solicitudesantiguedad' 
AND column_name = 'codigo_distribuidor';

-- Verificar que el índice se creó
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'solicitudesantiguedad' 
AND indexname = 'idx_solicitudesantiguedad_codigo_distribuidor';
