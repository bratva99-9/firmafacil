# Guía de Prueba de Now Payments

## ✅ Configuración Completada

- ✅ Secrets configurados en Supabase
- ✅ Funciones desplegadas

## 🔍 Verificación Final

### 1. Verificar Secrets en Supabase

1. Ve a Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. Verifica que veas:
   - `NOWPAYMENTS_API_KEY` ✅
   - `NOWPAYMENTS_IPN_SECRET_KEY` ✅

### 2. Verificar Funciones Desplegadas

1. Ve a Supabase Dashboard → **Edge Functions**
2. Verifica que veas:
   - `nowpayments-payment` ✅
   - `nowpayments-callback` ✅

### 3. Configurar Callback URL en Now Payments (IMPORTANTE)

Si aún no lo has hecho:

1. Obtén tu Project Reference:
   - Supabase Dashboard → **Settings** → **API**
   - Copia el **Project URL** (ejemplo: `https://abcdefghijklmnop.supabase.co`)
   - Tu Project Reference es: `abcdefghijklmnop`

2. En Now Payments:
   - Ve a **Settings** → **Payments** → **Instant payment notifications**
   - En **"IPN callback URL"**, ingresa:
     ```
     https://TU_PROJECT_REF.supabase.co/functions/v1/nowpayments-callback
     ```
     (Reemplaza `TU_PROJECT_REF` con tu Project Reference)
   - Haz clic en **"Save"**

## 🧪 Prueba de la Integración

### Paso 1: Probar Crear un Pago

1. Abre tu aplicación
2. Ve a la herramienta **"Consulta RUC Pagada"**
3. Ingresa un RUC válido de 13 dígitos (ejemplo: `0999999999001`)
4. Haz clic en **"💰 Crear Pago"**

**Resultado esperado:**
- Deberías ver un mensaje de "Pago creado"
- Se abrirá una nueva ventana con la página de pago de Now Payments
- Deberías ver el Payment ID y un enlace para abrir la página de pago

### Paso 2: Verificar Logs

1. En Supabase Dashboard → **Edge Functions** → **Logs**
2. Selecciona la función `nowpayments-payment`
3. Busca logs recientes de tu prueba
4. Verifica que no haya errores

**Si hay errores comunes:**
- **"Falta configurar NOWPAYMENTS_API_KEY"**: Verifica que el secret esté configurado
- **"Invalid API key"**: Verifica que copiaste la API key correctamente
- **"No payout wallets configured"**: Debes configurar un wallet en Now Payments

### Paso 3: Probar Verificación de Pago

1. Después de crear el pago, haz clic en **"✓ Verificar Pago"**
2. Si el pago está pendiente, verás un mensaje indicando el estado
3. Si el pago está completado, se ejecutará automáticamente la consulta de RUC

### Paso 4: Probar Callback (Opcional)

1. Completa un pago de prueba en Now Payments
2. Ve a Supabase Dashboard → **Edge Functions** → **Logs**
3. Selecciona la función `nowpayments-callback`
4. Deberías ver logs indicando que se recibió el callback

## 🐛 Troubleshooting

### Error: "Error al crear el pago"

**Posibles causas:**
1. API Key incorrecta o no configurada
2. No hay payout wallet configurado en Now Payments
3. Cuenta de Now Payments no verificada

**Solución:**
- Verifica los secrets en Supabase
- Configura un payout wallet en Now Payments
- Verifica que tu cuenta esté verificada

### Error: "No se pudo verificar el pago"

**Posibles causas:**
1. El payment_id no existe
2. El order_id no coincide
3. Problema de conexión con Now Payments

**Solución:**
- Verifica que el pago se haya creado correctamente
- Revisa los logs de la función
- Intenta crear un nuevo pago

### El callback no se recibe

**Posibles causas:**
1. Callback URL no configurada en Now Payments
2. URL incorrecta
3. Función no desplegada

**Solución:**
- Verifica que el callback URL esté configurado en Now Payments
- Verifica que la URL sea correcta (debe incluir tu Project Reference)
- Asegúrate de que la función `nowpayments-callback` esté desplegada

## ✅ Checklist Final

- [ ] Secrets configurados en Supabase
- [ ] Funciones desplegadas
- [ ] Callback URL configurada en Now Payments
- [ ] Payout wallet configurado en Now Payments
- [ ] Prueba de crear pago exitosa
- [ ] Prueba de verificar pago exitosa
- [ ] Logs sin errores

## 📝 Notas

- **Modo Test**: Now Payments tiene un modo sandbox para pruebas sin usar dinero real
- **Límites**: Revisa los límites de tu plan de Now Payments
- **Monedas**: Puedes configurar qué criptomonedas aceptar en Now Payments

## 🎉 ¡Listo!

Si todos los pasos funcionan correctamente, tu integración de Now Payments está lista para usar.

Para usar en producción:
1. Asegúrate de estar en modo producción en Now Payments
2. Verifica que todos los secrets estén configurados correctamente
3. Prueba con un pago real pequeño antes de usar en producción completa
