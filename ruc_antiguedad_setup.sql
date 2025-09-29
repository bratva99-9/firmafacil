-- Script para configurar la tabla de solicitudes para RUC con antigüedad
-- Este script debe ejecutarse en Supabase para agregar los campos necesarios

-- Crear tabla de solicitudes si no existe (compatible con el código actual)
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_cedula TEXT,
  nombres TEXT,
  apellidos TEXT,
  edad TEXT,
  nacionalidad TEXT,
  genero TEXT,
  ruc TEXT,
  provincia TEXT,
  ciudad TEXT,
  parroquia TEXT,
  direccion TEXT,
  codigo_huella TEXT,
  celular TEXT,
  correo TEXT,
  tipo_banco TEXT,
  fecha_inicio_actividades DATE,
  actividad_economica TEXT,
  estado_tramite TEXT DEFAULT 'pendiente',
  correo_distribuidor TEXT,
  foto_cedula_frontal TEXT,
  foto_cedula_atras TEXT,
  foto_selfie TEXT,
  comprobante_pago TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para solicitudes
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitudes
CREATE POLICY "Users can view own solicitudes" ON solicitudes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own solicitudes" ON solicitudes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solicitudes" ON solicitudes
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para distribuidores (pueden ver todas las solicitudes)
CREATE POLICY "Distribuidores can view all solicitudes" ON solicitudes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = correo_distribuidor
    )
  );

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla de documentos si no existe
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tamaño_archivo BIGINT,
  tipo_mime TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para documentos
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Políticas para documentos
CREATE POLICY "Users can view own documentos" ON documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM solicitudes 
      WHERE solicitudes.id = documentos.solicitud_id 
      AND solicitudes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own documentos" ON documentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM solicitudes 
      WHERE solicitudes.id = documentos.solicitud_id 
      AND solicitudes.user_id = auth.uid()
    )
  );

-- Crear tabla de caché de cédulas si no existe
CREATE TABLE IF NOT EXISTS cache_cedulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cedula TEXT UNIQUE NOT NULL,
  nombres TEXT,
  apellidos TEXT,
  edad TEXT,
  nacionalidad TEXT,
  genero TEXT,
  provincia TEXT,
  ciudad TEXT,
  parroquia TEXT,
  direccion TEXT,
  fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para caché de cédulas
ALTER TABLE cache_cedulas ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer el caché (es información pública)
CREATE POLICY "Anyone can view cache_cedulas" ON cache_cedulas
  FOR SELECT USING (true);

-- Política para que todos puedan insertar en el caché
CREATE POLICY "Anyone can insert cache_cedulas" ON cache_cedulas
  FOR INSERT WITH CHECK (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_solicitudes_user_id ON solicitudes(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_numero_cedula ON solicitudes(numero_cedula);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado_tramite);
CREATE INDEX IF NOT EXISTS idx_solicitudes_correo_distribuidor ON solicitudes(correo_distribuidor);
CREATE INDEX IF NOT EXISTS idx_documentos_solicitud_id ON documentos(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_cache_cedulas_numero ON cache_cedulas(numero_cedula);

-- Comentarios para documentar la estructura
COMMENT ON TABLE solicitudes IS 'Tabla para almacenar solicitudes de RUC con antigüedad';
COMMENT ON COLUMN solicitudes.fecha_inicio_actividades IS 'Fecha de inicio de actividades comerciales';
COMMENT ON COLUMN solicitudes.actividad_economica IS 'Descripción de la actividad económica principal';
COMMENT ON COLUMN solicitudes.codigo_huella IS 'Código de huella dactilar del solicitante';
COMMENT ON COLUMN solicitudes.correo_distribuidor IS 'Email del distribuidor que procesa la solicitud';
