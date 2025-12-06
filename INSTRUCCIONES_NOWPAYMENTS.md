# Guía de Configuración de Now Payments

Esta guía te ayudará a obtener las credenciales de Now Payments y configurarlas en Supabase.

## Paso 1: Obtener las Credenciales de Now Payments

### 1.1. Crear cuenta en Now Payments

1. Ve a [https://nowpayments.io/](https://nowpayments.io/)
2. Haz clic en "Sign Up" para crear una cuenta
3. Completa el proceso de registro y verifica tu email

### 1.2. Acceder al Dashboard

1. Inicia sesión en [https://nowpayments.io/dashboard](https://nowpayments.io/dashboard)
2. Completa la verificación de identidad si es necesario

### 1.3. Configurar Wallet de Pago (Payout Wallet)

**IMPORTANTE:** Debes configurar al menos un wallet antes de poder usar la API.

1. En el dashboard, ve a **Settings** → **Payments**
2. En la sección **"Payout wallets"**, haz clic en **"Add another wallet"**
3. Selecciona la criptomoneda que deseas recibir (ej: Bitcoin, Ethereum, USDT, etc.)
4. Ingresa la dirección de tu wallet
5. Haz clic en el checkmark verde para confirmar
6. Haz clic en **"Save"**

### 1.4. Generar API Key

1. En **Settings** → **Payments**, busca la sección **"API keys"**
2. Haz clic en **"Add new key"**
3. Se generará una nueva API key
4. **COPIA Y GUARDA ESTA KEY INMEDIATAMENTE** - Solo se muestra una vez
5. Esta es tu `NOWPAYMENTS_API_KEY`

### 1.5. Generar IPN Secret Key (Opcional pero Recomendado)

1. En **Settings** → **Payments**, busca la sección **"Instant payment notifications"**
2. Haz clic en **"Generate new key"**
3. Se generará un IPN secret key
4. **COPIA Y GUARDA ESTA KEY INMEDIATAMENTE** - Solo se muestra una vez
5. Esta es tu `NOWPAYMENTS_IPN_SECRET_KEY`

### 1.6. Configurar URL de Callback (Webhook)

1. En la misma sección **"Instant payment notifications"**
2. En el campo **"IPN callback URL"**, ingresa:
   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/nowpayments-callback
   ```
   Reemplaza `TU_PROJECT_REF` con tu Project Reference de Supabase
3. Haz clic en **"Save"**

## Paso 2: Configurar Secrets en Supabase

### 2.1. Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto

### 2.2. Agregar Secrets

1. En el menú lateral, ve a **Settings** (⚙️)
2. Haz clic en **Edge Functions**
3. Busca la sección **"Secrets"**
4. Haz clic en **"Add new secret"** o en el botón **"+"**

### 2.3. Agregar NOWPAYMENTS_API_KEY

1. **Name:** `NOWPAYMENTS_API_KEY`
2. **Value:** Pega la API key que copiaste de Now Payments
3. Haz clic en **"Save"**

### 2.4. Agregar NOWPAYMENTS_IPN_SECRET_KEY

1. **Name:** `NOWPAYMENTS_IPN_SECRET_KEY`
2. **Value:** Pega el IPN secret key que copiaste de Now Payments
3. Haz clic en **"Save"**

### 2.5. Verificar que los Secrets estén configurados

Deberías ver ambos secrets en la lista:
- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET_KEY`

## Paso 3: Obtener tu Project Reference de Supabase

Para configurar el callback URL correctamente:

1. En Supabase Dashboard, ve a **Settings** → **API**
2. Busca **"Project URL"** o **"Reference ID"**
3. Tu Project Reference es la parte antes de `.supabase.co`
   - Ejemplo: Si tu URL es `https://abcdefghijklmnop.supabase.co`
   - Tu Project Reference es: `abcdefghijklmnop`

## Paso 4: Actualizar el Callback URL en Now Payments

1. Vuelve a Now Payments Dashboard
2. Ve a **Settings** → **Payments** → **Instant payment notifications**
3. Actualiza el campo **"IPN callback URL"** con:
   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/nowpayments-callback
   ```
   (Reemplaza `TU_PROJECT_REF` con tu Project Reference real)
4. Haz clic en **"Save"**

## Paso 5: Desplegar las Edge Functions

Si aún no has desplegado las funciones:

```bash
# Desde la raíz del proyecto
supabase functions deploy nowpayments-payment
supabase functions deploy nowpayments-callback
```

O desde Supabase Dashboard:
1. Ve a **Edge Functions**
2. Haz clic en **"Deploy"** para cada función

## Verificación

Para verificar que todo está configurado correctamente:

1. **Prueba crear un pago:**
   - Usa la herramienta "Consulta RUC Pagada" en tu aplicación
   - Ingresa un RUC válido
   - Haz clic en "Crear Pago"
   - Deberías ver una URL de pago de Now Payments

2. **Verifica los logs:**
   - En Supabase Dashboard, ve a **Edge Functions** → **Logs**
   - Busca errores relacionados con `NOWPAYMENTS_API_KEY`

3. **Prueba el callback:**
   - Después de completar un pago de prueba
   - Verifica en los logs de `nowpayments-callback` que se recibió el callback

## Troubleshooting

### Error: "Falta configurar NOWPAYMENTS_API_KEY"
- Verifica que el secret esté configurado en Supabase
- Asegúrate de que el nombre sea exactamente `NOWPAYMENTS_API_KEY` (sin espacios)
- Redespliega la función después de agregar el secret

### Error: "Invalid API key"
- Verifica que copiaste la API key correctamente
- Asegúrate de que no haya espacios al inicio o final
- Genera una nueva API key si es necesario

### Callback no se recibe
- Verifica que el callback URL esté configurado correctamente en Now Payments
- Asegúrate de que la función `nowpayments-callback` esté desplegada
- Verifica que el Project Reference en la URL sea correcto

### No se puede crear pago
- Verifica que hayas configurado al menos un payout wallet en Now Payments
- Asegúrate de que tu cuenta de Now Payments esté verificada
- Revisa los logs de la función `nowpayments-payment` para más detalles

## Notas Importantes

⚠️ **Seguridad:**
- Nunca compartas tus API keys
- No las subas a repositorios públicos
- Usa siempre secrets de Supabase para almacenarlas

⚠️ **Testing:**
- Now Payments tiene un modo sandbox/test para pruebas
- Usa el modo test antes de ir a producción

⚠️ **Límites:**
- Revisa los límites de tu plan de Now Payments
- Algunos planes tienen límites en el número de transacciones

## Recursos Adicionales

- [Documentación de Now Payments](https://nowpayments.io/help)
- [Guía de Integración](https://nowpayments.zendesk.com/hc/en-us/articles/21341613323421-NOWPayments-Integration-Guide)
- [API Documentation](https://nowpayments.zendesk.com/hc/en-us/articles/21345824322717-API-and-endpoint-description)
