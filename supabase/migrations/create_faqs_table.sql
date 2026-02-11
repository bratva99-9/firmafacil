-- Crear tabla de FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  palabras_clave TEXT[] DEFAULT ARRAY[]::TEXT[],
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_faqs_palabras_clave ON public.faqs USING GIN (palabras_clave);
CREATE INDEX IF NOT EXISTS idx_faqs_categoria ON public.faqs (categoria);
CREATE INDEX IF NOT EXISTS idx_faqs_activo ON public.faqs (activo);

-- Habilitar búsqueda full-text (opcional, para búsquedas más avanzadas)
CREATE INDEX IF NOT EXISTS idx_faqs_pregunta_fts ON public.faqs USING GIN (to_tsvector('spanish', pregunta || ' ' || respuesta));

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) - opcional, ajusta según tus necesidades
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (ajusta según tus necesidades)
CREATE POLICY "Permitir lectura pública de FAQs" ON public.faqs
    FOR SELECT USING (activo = true);

-- Insertar FAQs completos del negocio
INSERT INTO public.faqs (pregunta, respuesta, categoria, palabras_clave, orden) VALUES
-- RUC CON ANTIGÜEDAD
(
  '¿Cuánto cuesta el RUC con antigüedad?',
  'El RUC con antigüedad tiene un costo de $60. Este servicio crea un RUC retroactivo en el sistema con 1 año de antigüedad, legalmente registrado y válido para todos los trámites.',
  'ruc',
  ARRAY['ruc antiguedad', 'ruc retroactivo', 'antiguedad', 'ruc 1 año', 'costo ruc antiguedad', 'precio ruc antiguedad', '60 dolares'],
  1
),
(
  '¿Cuánto tiempo tarda el RUC con antigüedad?',
  'El RUC con antigüedad se completa en aproximadamente 3 horas durante horario laboral. Es un proceso rápido y eficiente.',
  'ruc',
  ARRAY['tiempo ruc antiguedad', 'cuanto tarda ruc antiguedad', 'duracion ruc antiguedad', '3 horas', 'rapido'],
  2
),
(
  '¿El RUC con antigüedad es legal?',
  'Sí, todos nuestros trámites son totalmente legales y válidos. El RUC con antigüedad se registra legalmente en el sistema del SRI con 1 año de antigüedad retroactiva.',
  'ruc',
  ARRAY['legal', 'valido', 'legalidad', 'ruc legal', 'registrado', 'sri'],
  3
),
-- RUC CON FECHA ACTUAL
(
  '¿Cuánto cuesta crear un RUC nuevo?',
  'El RUC con fecha actual tiene un costo de $20. Este servicio incluye la creación del RUC y firma electrónica gratis por 1 año, válida para facturación electrónica y más trámites.',
  'ruc',
  ARRAY['crear ruc', 'ruc nuevo', 'ruc fecha actual', 'ruc 20', 'costo ruc nuevo', 'precio ruc nuevo', 'ruc primera vez'],
  4
),
(
  '¿Cuánto tiempo tarda crear un RUC nuevo?',
  'El RUC con fecha actual se completa en aproximadamente 3 horas durante horario laboral. Es un proceso rápido y totalmente en línea.',
  'ruc',
  ARRAY['tiempo crear ruc', 'cuanto tarda crear ruc', 'duracion crear ruc', 'ruc nuevo tiempo'],
  5
),
(
  '¿Qué incluye el RUC de $20?',
  'El RUC con fecha actual de $20 incluye:\n\n• Creación del RUC\n• Firma electrónica gratis por 1 año\n• Válida para facturación electrónica\n• Válida para todos los trámites del SRI\n\nTodo en un solo paquete completo.',
  'ruc',
  ARRAY['que incluye ruc 20', 'incluye firma electronica', 'firma electronica gratis', 'paquete ruc', 'que trae ruc'],
  6
),
-- PONER AL DÍA RUC
(
  '¿Qué significa poner al día el RUC?',
  'Poner al día el RUC significa realizar todas las declaraciones pendientes que tengas. Incluye la revisión completa de tus obligaciones tributarias y la presentación ante el SRI. Te ayudamos a cumplir con todas tus obligaciones tributarias pendientes.',
  'ruc',
  ARRAY['poner al dia', 'poner al dia ruc', 'actualizar ruc', 'regularizar ruc', 'declaraciones pendientes', 'obligaciones tributarias'],
  7
),
(
  '¿Cuánto tiempo tarda poner al día el RUC?',
  'El proceso de poner al día el RUC se completa en menos de 4 horas durante horario laboral. Es un servicio rápido que incluye revisión y presentación de todas las declaraciones pendientes.',
  'ruc',
  ARRAY['tiempo poner al dia', 'cuanto tarda poner al dia', 'duracion poner al dia', '4 horas', 'rapido poner al dia'],
  8
),
-- REQUISITOS PARA RUC
(
  '¿Qué documentos necesito para crear un RUC?',
  'Para crear un RUC necesitas los siguientes documentos:\n\n• Fotos claras de cédula de ambos lados\n• Foto selfie sosteniendo la cédula\n• Planilla de luz (no es necesario que esté a tu nombre, solo para verificar la dirección)\n• No mantener ninguna multa pendiente en CNE (Consejo Nacional Electoral)\n\nTodos los documentos se envían digitalmente, el proceso es totalmente en línea.',
  'ruc',
  ARRAY['documentos', 'requisitos', 'que necesito', 'papeles', 'documentacion', 'crear ruc', 'cedula', 'selfie', 'planilla luz'],
  9
),
(
  '¿Puedo usar mi cédula vencida para crear el RUC?',
  'No, no se puede realizar el proceso con cédula vencida. Necesitas tener tu cédula vigente y válida para poder crear el RUC.',
  'ruc',
  ARRAY['cedula vencida', 'cedula expirada', 'cedula valida', 'cedula vigente'],
  10
),
(
  '¿La planilla de luz debe estar a mi nombre?',
  'No, la planilla de luz no es necesario que esté a tu nombre. Solo la necesitamos para verificar y poner la dirección que se reflejará en tu RUC.',
  'ruc',
  ARRAY['planilla luz', 'planilla a nombre', 'comprobante domicilio', 'direccion'],
  11
),
(
  '¿Qué pasa si tengo multas pendientes en CNE?',
  'Si tienes multas pendientes en el Consejo Nacional Electoral (CNE), debes pagarlas en su totalidad antes de poder crear el RUC. Puedes pagar mediante:\n\n• Facilito\n• Western Union\n• Banco del Barrio\n• Aplicación bancaria\n\nUna vez pagadas las multas, podrás continuar con el proceso.',
  'ruc',
  ARRAY['multas cne', 'multas pendientes', 'consejo nacional electoral', 'pagar multas', 'facilito', 'western union'],
  12
),
-- DECLARACIONES
(
  '¿Cuánto cuesta hacer una declaración de IVA mensual?',
  'Las declaraciones mensuales de IVA tienen un costo desde $3 por declaración. El precio puede variar según la carga tributaria. Si tienes mucha carga tributaria, podemos hacerte un descuento.',
  'declaraciones',
  ARRAY['declaracion iva', 'iva mensual', 'declaracion mensual', 'costo declaracion', 'precio declaracion', '3 dolares'],
  13
),
(
  '¿Cuánto cuesta una declaración semestral?',
  'Las declaraciones semestrales tienen un costo desde $8 por declaración. El precio puede variar según la carga tributaria. Si tienes mucha carga tributaria, podemos hacerte un descuento.',
  'declaraciones',
  ARRAY['declaracion semestral', 'semestral', 'costo semestral', 'precio semestral', '8 dolares'],
  14
),
(
  '¿Cuánto cuesta la declaración de impuesto a la renta?',
  'La declaración de impuesto a la renta tiene un costo desde $5 por declaración. El precio puede variar según la carga tributaria. Si tienes mucha carga tributaria, podemos hacerte un descuento.',
  'declaraciones',
  ARRAY['declaracion renta', 'impuesto renta', 'renta', 'costo renta', 'precio renta', '5 dolares'],
  15
),
(
  '¿Cómo funciona la devolución de IVA?',
  'La devolución de IVA tiene un costo desde el 7% del monto a devolver. Te ayudamos con todo el proceso de solicitud y gestión de la devolución ante el SRI.',
  'declaraciones',
  ARRAY['devolucion iva', 'devolucion', 'iva devolucion', '7 por ciento', 'devolver iva'],
  16
),
(
  '¿Cuánto cuesta el anexo de gastos personales?',
  'El anexo de gastos personales tiene un costo desde $10. Este servicio te ayuda a declarar y deducir tus gastos personales en la declaración de renta.',
  'declaraciones',
  ARRAY['anexo gastos personales', 'gastos personales', 'anexo', 'costo anexo', 'precio anexo', '10 dolares'],
  17
),
(
  '¿Los precios de declaraciones son por mes o por declaración?',
  'Los precios de las declaraciones son por declaración, no por mes. Cada declaración se cobra individualmente según el tipo:\n\n• Declaración mensual de IVA: desde $3\n• Declaración semestral: desde $8\n• Declaración de renta: desde $5\n\nSi tienes mucha carga tributaria, podemos hacerte un descuento.',
  'declaraciones',
  ARRAY['precio declaracion', 'costo declaracion', 'por mes', 'por declaracion', 'tarifa'],
  18
),
-- PROCESO EN LÍNEA
(
  '¿Puedo hacer todo el proceso en línea?',
  'Sí, el proceso para todos los trámites es totalmente en línea. No necesitas ir a ninguna oficina. Puedes enviar todos los documentos digitalmente y realizar todo el proceso desde la comodidad de tu hogar.',
  'general',
  ARRAY['online', 'en linea', 'digital', 'plataforma', 'web', 'tramite online', 'sin oficina', 'desde casa'],
  19
),
(
  '¿Cómo envío los documentos?',
  'Puedes enviar todos los documentos digitalmente a través de nuestra plataforma. Solo necesitas tomar fotos claras de:\n\n• Cédula (ambos lados)\n• Selfie sosteniendo la cédula\n• Planilla de luz\n\nTodo el proceso es totalmente en línea y seguro.',
  'general',
  ARRAY['enviar documentos', 'subir documentos', 'como enviar', 'documentos digitales', 'fotos'],
  20
),
-- CONSULTAS GENERALES
(
  '¿Cómo puedo consultar el estado de mi RUC?',
  'Puedes consultar el estado de tu RUC a través de nuestra plataforma de forma gratuita. También puedes consultarlo en el portal del SRI o contactándonos directamente. Te ayudamos a verificar el estado actual y cualquier pendiente.',
  'ruc',
  ARRAY['consultar', 'estado', 'verificar', 'revisar', 'consulta ruc', 'estado ruc'],
  21
),
(
  '¿Ofrecen descuentos?',
  'Sí, si tienes mucha carga tributaria o necesitas múltiples servicios, podemos hacerte un descuento. Contáctanos para una cotización personalizada y ver qué descuentos podemos ofrecerte según tu caso.',
  'general',
  ARRAY['descuento', 'descuentos', 'promocion', 'oferta', 'carga tributaria', 'múltiples servicios'],
  22
);

