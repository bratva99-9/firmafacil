# 🚀 Guía Simple: Consulta Estado Tributario desde ManyChat

## Paso 1: Desplegar la Función

```bash
cd "C:\Users\Kevin\Desktop\APP FIRMA 0.1"
supabase functions deploy manychat-estado-tributario
```

## Paso 2: Obtener tu URL

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto → **Settings** → **API**
3. Copia tu **Project URL** (ej: `https://abcdefghijklmnop.supabase.co`)
4. Tu endpoint será:
   ```
   https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario
   ```

## Paso 3: Configurar en ManyChat

### Opción A: Usar JSON API (Más Simple)

1. En ManyChat → **Automation** → **JSON API**
2. Configura:
   - **URL**: `https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario?ruc=1234567890123`
   - **Method**: `GET`
   - **Response Variable**: `api_response`

**Para usar con variable dinámica:**
```
https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario?ruc={{custom_field.ruc}}
```

### Opción B: Usar Webhook (Recomendado)

1. En ManyChat → **Automation** → **Webhooks**
2. Crea nuevo webhook:
   - **Name**: `Consulta RUC`
   - **URL**: `https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario`
   - **Method**: `POST`
   - **Body**:
     ```json
     {
       "ruc": "1234567890123"
     }
     ```
   - **Response Variable**: `webhook` (automático)

**Para usar con variable dinámica en el body:**
```json
{
  "ruc": "{{custom_field.ruc}}"
}
```

## Paso 4: Respuesta JSON

La función devuelve un JSON simple:

```json
{
  "success": true,
  "ruc": "1234567890123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "estado_tributario": {
    "tiene_estado": true,
    "estado": "Activo",
    "datos_completos": { ... }
  },
  "deudas": {
    "tiene_deudas": true,
    "total": 1250.50,
    "cantidad": 2,
    "lista": [
      {
        "concepto": "Impuesto a la Renta",
        "monto": "1000.00",
        "periodo": "2023",
        "fecha_vencimiento": "2024-03-31"
      }
    ]
  }
}
```

## Paso 5: Usar la Respuesta en ManyChat

### Ejemplo 1: Mostrar Estado
```
Estado: {{webhook.estado_tributario.estado}}
```

### Ejemplo 2: Mostrar Deudas
```
{{#if webhook.deudas.tiene_deudas}}
Total de deudas: ${{webhook.deudas.total}}
Cantidad: {{webhook.deudas.cantidad}}
{{else}}
Sin deudas
{{/if}}
```

### Ejemplo 3: Mostrar Todo
```
RUC: {{webhook.ruc}}
Estado: {{webhook.estado_tributario.estado}}
Deudas: ${{webhook.deudas.total}}
```

## Ejemplo Completo de Flujo

1. **Trigger**: Usuario escribe "consultar ruc"
2. **Ask Question**: Pide el RUC y guarda en `{{custom_field.ruc}}`
3. **Webhook**: Llama al webhook con body `{"ruc": "{{custom_field.ruc}}"}`
4. **Send Message**: 
   ```
   📋 Consulta RUC: {{webhook.ruc}}
   
   Estado: {{webhook.estado_tributario.estado}}
   
   {{#if webhook.deudas.tiene_deudas}}
   ⚠️ Deudas: ${{webhook.deudas.total}}
   {{else}}
   ✅ Sin deudas
   {{/if}}
   ```

## Prueba Rápida

Puedes probar directamente con curl:

```bash
curl -X POST https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario \
  -H "Content-Type: application/json" \
  -d '{"ruc": "1234567890123"}'
```

O con GET:

```bash
curl "https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario?ruc=1234567890123"
```

## Estructura de la Respuesta

- `success`: true/false
- `ruc`: El RUC consultado
- `timestamp`: Fecha de la consulta
- `estado_tributario.estado`: Estado del contribuyente
- `deudas.tiene_deudas`: true/false
- `deudas.total`: Total de deudas
- `deudas.cantidad`: Cantidad de deudas
- `deudas.lista`: Array con detalles de cada deuda

¡Listo! Es así de simple 🎉

