-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  empresa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver y editar su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla de solicitudes de firma electrónica
CREATE TABLE IF NOT EXISTS solicitudes_firma (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_firma TEXT NOT NULL,
  duracion TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  numero_cedula TEXT,
  nombres TEXT,
  apellidos TEXT,
  edad TEXT,
  nacionalidad TEXT,
  provincia TEXT,
  ciudad TEXT,
  parroquia TEXT,
  direccion TEXT,
  celular TEXT,
  correo TEXT,
  ruc TEXT,
  banco TEXT,
  archivos JSONB DEFAULT '{}',
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para solicitudes
ALTER TABLE solicitudes_firma ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitudes
CREATE POLICY "Users can view own solicitudes" ON solicitudes_firma
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own solicitudes" ON solicitudes_firma
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solicitudes" ON solicitudes_firma
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en solicitudes
CREATE TRIGGER update_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes_firma
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


