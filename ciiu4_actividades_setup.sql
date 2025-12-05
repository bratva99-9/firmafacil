-- Tabla para almacenar actividades CIIU4
-- Columnas: CODIGO, DESCRIPCION, NIVEL

CREATE TABLE IF NOT EXISTS public.ciiu4_actividades (
  "CODIGO" TEXT NOT NULL,
  "DESCRIPCION" TEXT NOT NULL,
  "NIVEL" BIGINT NOT NULL,
  PRIMARY KEY ("CODIGO")
);

-- Índice para búsquedas rápidas por código
CREATE INDEX IF NOT EXISTS idx_ciiu4_codigo ON public.ciiu4_actividades("CODIGO");

-- Índice para búsquedas por nivel
CREATE INDEX IF NOT EXISTS idx_ciiu4_nivel ON public.ciiu4_actividades("NIVEL");

-- Comentarios en las columnas
COMMENT ON TABLE public.ciiu4_actividades IS 'Tabla de actividades económicas CIIU4';
COMMENT ON COLUMN public.ciiu4_actividades."CODIGO" IS 'Código de la actividad económica (ej: M6920.03)';
COMMENT ON COLUMN public.ciiu4_actividades."DESCRIPCION" IS 'Descripción de la actividad económica';
COMMENT ON COLUMN public.ciiu4_actividades."NIVEL" IS 'Nivel de clasificación CIIU (1-6)';

-- Habilitar RLS (Row Level Security) si es necesario
ALTER TABLE public.ciiu4_actividades ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura de actividades CIIU4 a usuarios autenticados"
  ON public.ciiu4_actividades
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserción a usuarios autenticados (para carga de datos)
CREATE POLICY "Permitir inserción de actividades CIIU4 a usuarios autenticados"
  ON public.ciiu4_actividades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Permitir actualización de actividades CIIU4 a usuarios autenticados"
  ON public.ciiu4_actividades
  FOR UPDATE
  TO authenticated
  USING (true);
