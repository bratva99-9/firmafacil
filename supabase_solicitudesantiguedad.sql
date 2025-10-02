-- Tabla para solicitudes de RUC con antigüedad
CREATE TABLE solicitudesantiguedad (
  -- Campos principales (Identificación)
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cedula VARCHAR(10) NOT NULL,
  estado_tramite VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_tramite IN ('pendiente', 'procesando', 'completado', 'rechazado')),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Datos personales del solicitante
  provincia VARCHAR(50),
  ciudad VARCHAR(50),
  parroquia VARCHAR(50),
  direccion TEXT,
  codigo_huella VARCHAR(20),
  celular VARCHAR(10),
  correo VARCHAR(100),

  -- Datos comerciales/empresariales
  actividad_economica TEXT,
  codigo_cuen VARCHAR(20),
  direccion_completa TEXT,
  lugar_referencia TEXT,
  nombre_comercial VARCHAR(100),
  actividad_sri VARCHAR(100),

  -- Datos del trámite
  antiguedad_solicitada VARCHAR(50),
  tipo_banco VARCHAR(50),

  -- Archivos adjuntos
  foto_cedula_frontal TEXT,
  foto_cedula_atras TEXT,
  foto_selfie TEXT,
  comprobante_pago TEXT,

  -- Datos del distribuidor
  correo_distribuidor VARCHAR(100),
  codigo_distribuidor VARCHAR(20),

  -- Información de precios
  precio_total DECIMAL(10,2),
  precio_antiguedad DECIMAL(10,2),
  precio_complementos DECIMAL(10,2),

  -- Campos de control
  observaciones TEXT,
  notas_cliente TEXT,
  fecha_procesamiento TIMESTAMP WITH TIME ZONE,
  fecha_completado TIMESTAMP WITH TIME ZONE
);

-- Índices para optimizar consultas
CREATE INDEX idx_solicitudesantiguedad_cedula ON solicitudesantiguedad(numero_cedula);
CREATE INDEX idx_solicitudesantiguedad_estado ON solicitudesantiguedad(estado_tramite);
CREATE INDEX idx_solicitudesantiguedad_fecha_creacion ON solicitudesantiguedad(fecha_creacion);
CREATE INDEX idx_solicitudesantiguedad_distribuidor ON solicitudesantiguedad(correo_distribuidor);
CREATE INDEX idx_solicitudesantiguedad_codigo_distribuidor ON solicitudesantiguedad(codigo_distribuidor);

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar fecha_actualizacion
CREATE TRIGGER update_solicitudesantiguedad_updated_at 
    BEFORE UPDATE ON solicitudesantiguedad 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Política RLS (Row Level Security) - Solo usuarios autenticados pueden ver sus propias solicitudes
ALTER TABLE solicitudesantiguedad ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias solicitudes
CREATE POLICY "Users can view own solicitudes" ON solicitudesantiguedad
    FOR SELECT USING (auth.uid()::text = correo_distribuidor OR numero_cedula = auth.jwt() ->> 'numero_cedula');

-- Política para que los usuarios puedan insertar sus propias solicitudes
CREATE POLICY "Users can insert own solicitudes" ON solicitudesantiguedad
    FOR INSERT WITH CHECK (auth.uid()::text = correo_distribuidor);

-- Política para que los usuarios puedan actualizar sus propias solicitudes
CREATE POLICY "Users can update own solicitudes" ON solicitudesantiguedad
    FOR UPDATE USING (auth.uid()::text = correo_distribuidor);

-- Comentarios para documentar la tabla
COMMENT ON TABLE solicitudesantiguedad IS 'Solicitudes de RUC con antigüedad';
COMMENT ON COLUMN solicitudesantiguedad.numero_cedula IS 'Número de cédula del solicitante';
COMMENT ON COLUMN solicitudesantiguedad.estado_tramite IS 'Estado actual del trámite: pendiente, procesando, completado, rechazado';
COMMENT ON COLUMN solicitudesantiguedad.antiguedad_solicitada IS 'Tipo de antigüedad solicitada (ej: 1 año, 2 años, etc.)';
COMMENT ON COLUMN solicitudesantiguedad.precio_total IS 'Precio total del trámite incluyendo todos los servicios';
COMMENT ON COLUMN solicitudesantiguedad.precio_antiguedad IS 'Precio específico por el servicio de antigüedad';
COMMENT ON COLUMN solicitudesantiguedad.precio_complementos IS 'Precio por servicios complementarios adicionales';
COMMENT ON COLUMN solicitudesantiguedad.codigo_distribuidor IS 'Código único del distribuidor que procesa la solicitud';
