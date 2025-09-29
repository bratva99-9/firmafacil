-- Script para agregar el campo correo_distribuidor a la tabla solicitudes
-- Este campo identificará qué distribuidor envió cada solicitud

-- Agregar la columna correo_distribuidor a la tabla solicitudes
ALTER TABLE solicitudes 
ADD COLUMN correo_distribuidor VARCHAR(255);

-- Agregar comentario a la columna para documentar su propósito
COMMENT ON COLUMN solicitudes.correo_distribuidor IS 'Correo electrónico del distribuidor que envió la solicitud';

-- Crear índice para búsquedas rápidas por distribuidor
CREATE INDEX IF NOT EXISTS idx_solicitudes_distribuidor 
ON solicitudes(correo_distribuidor);

-- Actualizar registros existentes (opcional - solo si hay datos previos)
-- UPDATE solicitudes 
-- SET correo_distribuidor = 'admin@admin.com' 
-- WHERE correo_distribuidor IS NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'solicitudes' 
AND column_name = 'correo_distribuidor';
