-- Script para actualizar la tabla pagos_nowpayments existente
-- Ejecuta esto si ya tienes la tabla creada

-- Agregar índice único parcial para invoice_id (solo cuando no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_invoice_id_unique 
ON pagos_nowpayments(invoice_id) 
WHERE invoice_id IS NOT NULL;

-- Agregar índice regular para invoice_id si no existe
CREATE INDEX IF NOT EXISTS idx_pagos_invoice_id ON pagos_nowpayments(invoice_id);

-- Verificar que los índices se crearon correctamente
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'pagos_nowpayments' 
AND indexname LIKE '%invoice%';
