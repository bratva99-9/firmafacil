-- Tabla para almacenar información de empresas de la Superintendencia de Compañías
-- Datos obtenidos de archivos XLSX/ODS de datos abiertos

CREATE TABLE IF NOT EXISTS empresas_scvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificación
  numero_fila INTEGER,
  expediente TEXT,
  ruc VARCHAR(13) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  
  -- Información legal
  situacion_legal TEXT,
  fecha_constitucion DATE,
  tipo_compania TEXT,
  pais TEXT DEFAULT 'ECUADOR',
  
  -- Ubicación
  region TEXT,
  provincia TEXT,
  canton TEXT,
  ciudad TEXT,
  calle TEXT,
  numero TEXT,
  interseccion TEXT,
  barrio TEXT,
  
  -- Contacto
  telefono TEXT,
  
  -- Representante
  representante TEXT,
  cargo TEXT,
  
  -- Capital
  capital_suscrito TEXT,
  
  -- Actividad económica
  ciiu_nivel_1 TEXT,
  ciiu_nivel_6 TEXT,
  
  -- Información de balances
  ultimo_ano_balance TEXT,
  presento_balance_inicial BOOLEAN,
  fecha_presentacion_balance_inicial DATE,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fuente_datos TEXT DEFAULT 'Datos Abiertos SCVS'
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_empresas_ruc ON empresas_scvs(ruc);
CREATE INDEX IF NOT EXISTS idx_empresas_expediente ON empresas_scvs(expediente);
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas_scvs USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_empresas_provincia ON empresas_scvs(provincia);
CREATE INDEX IF NOT EXISTS idx_empresas_ciudad ON empresas_scvs(ciudad);
CREATE INDEX IF NOT EXISTS idx_empresas_situacion ON empresas_scvs(situacion_legal);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_empresas_ruc_nombre ON empresas_scvs(ruc, nombre);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_empresas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas_scvs;
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas_scvs
  FOR EACH ROW
  EXECUTE FUNCTION update_empresas_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE empresas_scvs ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer empresas"
  ON empresas_scvs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Permitir inserción/actualización a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden insertar empresas"
  ON empresas_scvs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar empresas"
  ON empresas_scvs
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comentarios en la tabla
COMMENT ON TABLE empresas_scvs IS 'Información de empresas activas en Ecuador obtenida de datos abiertos de la Superintendencia de Compañías';
COMMENT ON COLUMN empresas_scvs.ruc IS 'RUC único de la empresa (13 dígitos)';
COMMENT ON COLUMN empresas_scvs.expediente IS 'Número de expediente en la SCVS';
COMMENT ON COLUMN empresas_scvs.fuente_datos IS 'Fuente de los datos (Datos Abiertos SCVS)';

