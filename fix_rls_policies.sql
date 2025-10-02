-- Script para corregir las políticas RLS de solicitudesantiguedad
-- Ejecutar este script en Supabase SQL Editor

-- Primero, eliminar las políticas existentes que están causando problemas
DROP POLICY IF EXISTS "Users can view own solicitudes" ON solicitudesantiguedad;
DROP POLICY IF EXISTS "Users can insert own solicitudes" ON solicitudesantiguedad;
DROP POLICY IF EXISTS "Users can update own solicitudes" ON solicitudesantiguedad;

-- Crear políticas más permisivas para usuarios autenticados
-- Política para INSERT: Permitir a cualquier usuario autenticado insertar solicitudes
CREATE POLICY "Authenticated users can insert solicitudes" ON solicitudesantiguedad
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política para SELECT: Permitir a usuarios ver sus propias solicitudes o las de su distribuidor
CREATE POLICY "Users can view own solicitudes" ON solicitudesantiguedad
    FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND (
            numero_cedula = auth.jwt() ->> 'numero_cedula' OR
            correo_distribuidor = auth.jwt() ->> 'email' OR
            codigo_distribuidor = auth.jwt() ->> 'codigo_distribuidor'
        )
    );

-- Política para UPDATE: Permitir a usuarios actualizar sus propias solicitudes
CREATE POLICY "Users can update own solicitudes" ON solicitudesantiguedad
    FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND (
            numero_cedula = auth.jwt() ->> 'numero_cedula' OR
            correo_distribuidor = auth.jwt() ->> 'email' OR
            codigo_distribuidor = auth.jwt() ->> 'codigo_distribuidor'
        )
    );

-- Política para DELETE: Solo permitir a distribuidores eliminar solicitudes
CREATE POLICY "Distributors can delete solicitudes" ON solicitudesantiguedad
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND (
            correo_distribuidor = auth.jwt() ->> 'email' OR
            codigo_distribuidor = auth.jwt() ->> 'codigo_distribuidor'
        )
    );

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'solicitudesantiguedad';
