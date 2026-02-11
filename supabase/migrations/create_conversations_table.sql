-- Crear tabla para guardar conversaciones de ManyChat
CREATE TABLE IF NOT EXISTS public.conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manychat_subscriber_id TEXT NOT NULL,
  manychat_user_id TEXT,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('usuario', 'bot', 'sistema')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_conversaciones_subscriber_id ON public.conversaciones (manychat_subscriber_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_created_at ON public.conversaciones (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversaciones_subscriber_created ON public.conversaciones (manychat_subscriber_id, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción y lectura (ajusta según tus necesidades)
CREATE POLICY "Permitir inserción de conversaciones" ON public.conversaciones
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de conversaciones propias" ON public.conversaciones
    FOR SELECT USING (true);

-- Función para obtener los últimos N mensajes de una conversación
CREATE OR REPLACE FUNCTION obtener_ultimos_mensajes(
  p_subscriber_id TEXT,
  p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  mensaje TEXT,
  tipo TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.mensaje,
    c.tipo,
    c.created_at
  FROM public.conversaciones c
  WHERE c.manychat_subscriber_id = p_subscriber_id
  ORDER BY c.created_at DESC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

