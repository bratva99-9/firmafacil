# Configuración Rápida de Now Payments

## ✅ Lo que ya tienes:

1. **Clave API** (API Key) - ✅ Ya la tienes
2. **Clave Pública** (Public Key) - ⚠️ No la necesitas para esta integración

## 📋 Pasos siguientes:

### Paso 1: Obtener el IPN Secret Key

1. En Now Payments Dashboard, ve a **Settings** → **Payments**
2. Busca la sección **"Instant payment notifications"** (Notificaciones instantáneas de pago)
3. Haz clic en **"Generate new key"** o **"Generar nueva clave"**
4. **COPIA Y GUARDA ESTA KEY INMEDIATAMENTE** - Solo se muestra una vez
5. Esta es tu `NOWPAYMENTS_IPN_SECRET_KEY`

### Paso 2: Configurar en Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **Edge Functions** → **Secrets**

#### Agregar NOWPAYMENTS_API_KEY:
- **Name:** `NOWPAYMENTS_API_KEY`
- **Value:** Pega la **Clave API** que ya tienes
- Haz clic en **"Save"**

#### Agregar NOWPAYMENTS_IPN_SECRET_KEY:
- **Name:** `NOWPAYMENTS_IPN_SECRET_KEY`
- **Value:** Pega el **IPN Secret Key** que acabas de generar
- Haz clic en **"Save"**

### Paso 3: Configurar Callback URL

1. Obtén tu Project Reference de Supabase:
   - Ve a **Settings** → **API**
   - Busca **"Project URL"** o **"Reference ID"**
   - Ejemplo: Si tu URL es `https://abcdefghijklmnop.supabase.co`
   - Tu Project Reference es: `abcdefghijklmnop`

2. En Now Payments:
   - Ve a **Settings** → **Payments** → **Instant payment notifications**
   - En el campo **"IPN callback URL"**, ingresa:
     ```
     https://TU_PROJECT_REF.supabase.co/functions/v1/nowpayments-callback
     ```
     (Reemplaza `TU_PROJECT_REF` con tu Project Reference real)
   - Haz clic en **"Save"**

### Paso 4: Desplegar las funciones

```bash
supabase functions deploy nowpayments-payment
supabase functions deploy nowpayments-callback
```

## ✅ Resumen de claves:

| Clave | Dónde obtenerla | Dónde configurarla |
|-------|----------------|-------------------|
| **NOWPAYMENTS_API_KEY** | Settings → Payments → API keys | Supabase Secrets |
| **NOWPAYMENTS_IPN_SECRET_KEY** | Settings → Payments → Instant payment notifications | Supabase Secrets |
| **Clave Pública** | No necesaria | - |

## 🔍 Verificación:

1. Verifica que ambos secrets estén en Supabase:
   - `NOWPAYMENTS_API_KEY` ✅
   - `NOWPAYMENTS_IPN_SECRET_KEY` ✅

2. Prueba crear un pago desde tu aplicación
