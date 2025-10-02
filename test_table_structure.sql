-- Script de prueba para verificar que la tabla funciona correctamente
-- Ejecutar este script en Supabase SQL Editor después de aplicar las correcciones

-- 1. Verificar que la tabla existe y tiene la estructura correcta
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'solicitudesantiguedad'
ORDER BY ordinal_position;

-- 2. Verificar que los índices se crearon
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'solicitudesantiguedad';

-- 3. Verificar el estado de RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'solicitudesantiguedad';

-- 4. Verificar las políticas RLS (si están habilitadas)
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'solicitudesantiguedad';

-- 5. Probar inserción de datos de prueba (opcional)
-- INSERT INTO solicitudesantiguedad (
--     numero_cedula,
--     provincia,
--     ciudad,
--     parroquia,
--     direccion,
--     codigo_huella,
--     celular,
--     correo,
--     tipo_banco,
--     actividad_economica,
--     codigo_cuen,
--     direccion_completa,
--     lugar_referencia,
--     nombre_comercial,
--     actividad_sri,
--     antiguedad_solicitada,
--     estado_tramite,
--     correo_distribuidor,
--     codigo_distribuidor,
--     precio_total,
--     precio_antiguedad,
--     precio_complementos
-- ) VALUES (
--     '1234567890',
--     'PICHINCHA',
--     'QUITO',
--     'CENTRO',
--     'Calle Principal 123',
--     'ABC123',
--     '0987654321',
--     'test@example.com',
--     'PRODUBANCO',
--     'Comercio',
--     'CUEN123',
--     'Dirección completa',
--     'Referencia',
--     'Mi Empresa',
--     'Actividad SRI',
--     '1 año',
--     'pendiente',
--     'kevincenteno39@gmail.com',
--     'DIST001',
--     50.00,
--     30.00,
--     20.00
-- );

-- 6. Si la inserción funciona, verificar los datos
-- SELECT * FROM solicitudesantiguedad WHERE numero_cedula = '1234567890';

-- 7. Limpiar datos de prueba (opcional)
-- DELETE FROM solicitudesantiguedad WHERE numero_cedula = '1234567890';
