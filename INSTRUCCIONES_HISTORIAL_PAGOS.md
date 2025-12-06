# Instrucciones: Historial de Pagos

## Configuración de la Base de Datos

Para que el historial de pagos funcione correctamente, necesitas crear la tabla en Supabase.

### Paso 1: Crear la Tabla

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Abre el archivo `pagos_nowpayments_setup.sql`
4. Copia y pega todo el contenido en el editor SQL
5. Ejecuta el script

Este script creará:
- La tabla `pagos_nowpayments` para almacenar los pagos
- Índices para optimizar las consultas
- Políticas de seguridad (RLS) para que los usuarios solo vean sus propios pagos
- Triggers para actualizar automáticamente las fechas

### Paso 2: Verificar la Configuración

Después de ejecutar el SQL, verifica que:

1. La tabla `pagos_nowpayments` existe en tu base de datos
2. Las políticas RLS están activas
3. Los índices se crearon correctamente

## Funcionalidad

### ¿Qué hace el Historial de Pagos?

1. **Al crear un pago**: Cuando un usuario crea un pago en "Consulta RUC Pagada", el sistema guarda automáticamente:
   - El email del usuario
   - El ID del pago
   - El monto y moneda
   - El estado inicial (waiting)

2. **Al recibir callbacks**: Cuando Now Payments envía un callback (IPN), el sistema actualiza:
   - El estado del pago
   - La fecha de pago (si está completado, parcialmente pagado o cancelado)
   - Toda la información adicional del pago

3. **Al ver el historial**: El usuario puede ver:
   - Solo los pagos con estado: `finished`, `partially_paid`, `cancelled`
   - Filtrados por su email (automáticamente)
   - Ordenados por fecha (más recientes primero)

## Estados de Pago Mostrados

El historial muestra únicamente los pagos con estos estados:

- **finished**: Pago completado exitosamente
- **partially_paid**: Pago parcialmente completado
- **cancelled**: Pago cancelado

Los pagos en otros estados (waiting, confirming, etc.) no se muestran en el historial.

## Seguridad

- Los usuarios solo pueden ver sus propios pagos (filtrados por email)
- Las políticas RLS garantizan que no puedan acceder a pagos de otros usuarios
- El callback de Now Payments puede actualizar cualquier pago (usando service role key)

## Solución de Problemas

### No aparecen pagos en el historial

1. Verifica que la tabla existe: `SELECT * FROM pagos_nowpayments LIMIT 1;`
2. Verifica que hay pagos con los estados correctos:
   ```sql
   SELECT payment_status, COUNT(*) 
   FROM pagos_nowpayments 
   GROUP BY payment_status;
   ```
3. Verifica que el email del usuario coincide:
   ```sql
   SELECT user_email, payment_status 
   FROM pagos_nowpayments 
   WHERE user_email = 'tu-email@ejemplo.com';
   ```

### Los pagos no se guardan al crearlos

1. Verifica que el Edge Function `nowpayments-payment` tiene acceso a `SUPABASE_SERVICE_ROLE_KEY`
2. Revisa los logs del Edge Function en Supabase
3. Verifica que la tabla tiene las políticas correctas

### Los callbacks no actualizan los pagos

1. Verifica que el callback URL está configurado en Now Payments
2. Verifica que `NOWPAYMENTS_IPN_SECRET_KEY` está configurado en Supabase
3. Revisa los logs del Edge Function `nowpayments-callback`

## Próximos Pasos

Una vez configurada la tabla, el historial de pagos funcionará automáticamente:

1. Los nuevos pagos se guardarán al crearse
2. Los callbacks actualizarán los estados automáticamente
3. Los usuarios verán su historial en el menú "Historial de Pagos"
