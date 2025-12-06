-- Tabla para almacenar pagos de Now Payments
CREATE TABLE IF NOT EXISTS pagos_nowpayments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificación del pago
  payment_id TEXT UNIQUE,
  invoice_id TEXT,
  order_id TEXT NOT NULL,
  
  -- Información del usuario
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Información del pago
  price_amount DECIMAL(10, 2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  pay_currency TEXT,
  pay_amount DECIMAL(20, 8),
  
  -- Estado del pago
  payment_status TEXT NOT NULL DEFAULT 'waiting',
  -- Estados posibles: waiting, confirming, confirmed, sending, partially_paid, 
  -- finished, failed, refunded, expired, cancelled
  
  -- URLs
  invoice_url TEXT,
  pay_url TEXT,
  
  -- Información adicional de Now Payments (JSON)
  payment_data JSONB DEFAULT '{}',
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices
  CONSTRAINT unique_payment_id UNIQUE (payment_id),
  CONSTRAINT unique_order_id UNIQUE (order_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pagos_user_email ON pagos_nowpayments(user_email);
CREATE INDEX IF NOT EXISTS idx_pagos_user_id ON pagos_nowpayments(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_payment_status ON pagos_nowpayments(payment_status);
CREATE INDEX IF NOT EXISTS idx_pagos_order_id ON pagos_nowpayments(order_id);
CREATE INDEX IF NOT EXISTS idx_pagos_payment_id ON pagos_nowpayments(payment_id);
CREATE INDEX IF NOT EXISTS idx_pagos_invoice_id ON pagos_nowpayments(invoice_id);
-- Índice único parcial para invoice_id (solo cuando no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_invoice_id_unique ON pagos_nowpayments(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagos_created_at ON pagos_nowpayments(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pagos_nowpayments ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios pagos
CREATE POLICY "Users can view own payments" ON pagos_nowpayments
  FOR SELECT USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- Política: Permitir que el callback de Now Payments inserte/actualice pagos
-- (usando service role key, no requiere autenticación de usuario)
CREATE POLICY "Service role can manage payments" ON pagos_nowpayments
  FOR ALL USING (true)
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Si el estado cambió a finished, partially_paid o cancelled, actualizar paid_at
  IF NEW.payment_status IN ('finished', 'partially_paid', 'cancelled') 
     AND (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('finished', 'partially_paid', 'cancelled'))
     AND NEW.paid_at IS NULL THEN
    NEW.paid_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_pagos_nowpayments_updated_at ON pagos_nowpayments;
CREATE TRIGGER update_pagos_nowpayments_updated_at
  BEFORE UPDATE ON pagos_nowpayments
  FOR EACH ROW
  EXECUTE FUNCTION update_pagos_updated_at();

-- Comentarios en la tabla
COMMENT ON TABLE pagos_nowpayments IS 'Almacena los pagos realizados a través de Now Payments';
COMMENT ON COLUMN pagos_nowpayments.payment_status IS 'Estado del pago: waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired, cancelled';
COMMENT ON COLUMN pagos_nowpayments.user_email IS 'Email del usuario que realizó el pago (para filtrar por correo)';
