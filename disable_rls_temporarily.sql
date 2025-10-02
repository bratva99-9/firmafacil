-- Script alternativo: Deshabilitar RLS temporalmente para pruebas
-- Ejecutar este script en Supabase SQL Editor si las políticas siguen causando problemas

-- Deshabilitar RLS temporalmente
ALTER TABLE solicitudesantiguedad DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'solicitudesantiguedad';

-- Si quieres volver a habilitar RLS después, ejecuta:
-- ALTER TABLE solicitudesantiguedad ENABLE ROW LEVEL SECURITY;
