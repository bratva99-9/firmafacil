# API ManyChat - Consulta Estado Tributario

Esta función Edge permite que ManyChat consulte el estado tributario de un RUC mediante solicitudes HTTP externas.

## Configuración

### 1. Variables de Entorno en Supabase

Configura las siguientes variables como Secrets en Supabase:

- `MANYCHAT_API_KEY` (opcional): API key para proteger el endpoint
- `SUPABASE_URL`: URL de tu proyecto Supabase (se configura automáticamente)
- `SUPABASE_ANON_KEY`: Anon key de Supabase (se configura automáticamente)
- `ANTICAPTCHA_API_KEY`: Debe estar configurada (usada por la función interna)

### 2. Desplegar la Función

```bash
supabase functions deploy manychat-estado-tributario
```

## Uso con ManyChat

### Opción 1: Webhook en ManyChat (Recomendado)

1. En ManyChat, ve a **Automation** → **Webhooks**
2. Crea un nuevo webhook con:
   - **URL**: `https://[TU-PROYECTO].supabase.co/functions/v1/manychat-estado-tributario`
   - **Method**: POST
   - **Headers**: 
     - `Content-Type: application/json`
     - `x-api-key: [TU_API_KEY]` (si configuraste API key)
   - **Body**:
     ```json
     {
       "ruc": "{{custom_field.ruc}}"
     }
     ```

### Opción 2: JSON API en ManyChat

1. En ManyChat, ve a **Automation** → **JSON API**
2. Configura:
   - **URL**: `https://[TU-PROYECTO].supabase.co/functions/v1/manychat-estado-tributario?ruc={{custom_field.ruc}}`
   - **Method**: GET
   - **Headers**: 
     - `x-api-key: [TU_API_KEY]` (si configuraste API key)

## Formato de Respuesta

### Respuesta Exitosa

```json
{
  "success": true,
  "ruc": "1234567890123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "resumen": "📋 Consulta de Estado Tributario - RUC: 1234567890123\n\n✅ Estado: Activo\n\n💰 Deudas:\n✅ No tiene deudas registradas\n",
  "datos": {
    "informacion_basica": {
      "ruc": "1234567890123",
      "consulta_exitosa": true
    },
    "estado_tributario": {
      "tiene_estado": true,
      "estado_general": "Activo",
      "fecha_consulta": "2024-01-15T10:30:00.000Z"
    },
    "deudas": {
      "tiene_deudas": false,
      "total_deudas": 0,
      "mensaje": "No tiene deudas registradas"
    }
  },
  "datos_completos": {
    "estadoTributario": { ... },
    "detalleDeudas": [ ... ]
  }
}
```

### Respuesta con Deudas

```json
{
  "success": true,
  "ruc": "1234567890123",
  "datos": {
    "deudas": {
      "tiene_deudas": true,
      "total_deudas": "1250.50",
      "cantidad_deudas": 2,
      "deudas": [
        {
          "concepto": "Impuesto a la Renta",
          "monto": "1000.00",
          "periodo": "2023",
          "fecha_vencimiento": "2024-03-31"
        },
        {
          "concepto": "IVA",
          "monto": "250.50",
          "periodo": "2023-12",
          "fecha_vencimiento": "2024-01-15"
        }
      ]
    }
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": "RUC es requerido",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Ejemplos de Uso en ManyChat

### Ejemplo 1: Guardar en Custom Field

En ManyChat, después de recibir la respuesta:

1. Usa **Set Custom Field** para guardar:
   - Campo: `estado_tributario` → Valor: `{{webhook.datos.estado_tributario.estado_general}}`
   - Campo: `tiene_deudas` → Valor: `{{webhook.datos.deudas.tiene_deudas}}`
   - Campo: `total_deudas` → Valor: `{{webhook.datos.deudas.total_deudas}}`

### Ejemplo 2: Mensaje Condicional

```
{{#if webhook.datos.deudas.tiene_deudas}}
⚠️ El RUC {{webhook.ruc}} tiene deudas por un total de ${{webhook.datos.deudas.total_deudas}}
{{else}}
✅ El RUC {{webhook.ruc}} no tiene deudas registradas
{{/if}}
```

### Ejemplo 3: Enviar Resumen Completo

```
{{webhook.resumen}}
```

## Seguridad

- **API Key**: Configura `MANYCHAT_API_KEY` como Secret en Supabase
- **Headers**: Incluye `x-api-key` en las solicitudes desde ManyChat
- **Rate Limiting**: Considera implementar rate limiting si esperas mucho tráfico

## Endpoints

### POST
```
POST https://[PROYECTO].supabase.co/functions/v1/manychat-estado-tributario
Content-Type: application/json
x-api-key: [API_KEY]

{
  "ruc": "1234567890123"
}
```

### GET
```
GET https://[PROYECTO].supabase.co/functions/v1/manychat-estado-tributario?ruc=1234567890123
x-api-key: [API_KEY]
```

## Troubleshooting

1. **Error 401**: Verifica que la API key sea correcta
2. **Error 400**: Asegúrate de enviar el RUC en el formato correcto (13 dígitos)
3. **Error 500**: Revisa los logs de Supabase Functions para más detalles
4. **Timeout**: La consulta puede tardar 30-60 segundos debido al reCAPTCHA

