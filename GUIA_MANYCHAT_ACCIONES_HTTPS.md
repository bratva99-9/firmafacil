# 🚀 Guía: Usar Nodo de Acciones HTTPS en ManyChat

## Paso 1: Desplegar la Función (si no lo has hecho)

```bash
cd "C:\Users\Kevin\Desktop\APP FIRMA 0.1"
supabase functions deploy manychat-estado-tributario
```

## Paso 2: Obtener tu URL

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto → **Settings** → **API**
3. Copia tu **Project URL**
4. Tu endpoint será:
   ```
   https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario
   ```

## Paso 3: Configurar el Nodo de Acciones en ManyChat

### 3.1. Crear o Editar un Flujo

1. Ve a **Automation** → **Flows**
2. Crea un nuevo flujo o edita uno existente
3. Agrega un trigger (ej: "User Says" con palabras clave como "consultar ruc")

### 3.2. Pedir el RUC al Usuario

1. Arrastra **Action** → **Ask Question**
2. Configura:
   - **Question Type**: Text
   - **Question**: `Por favor, ingresa el RUC (13 dígitos):`
   - **Save Answer To**: Crea o selecciona un Custom Field llamado `ruc`

### 3.3. Agregar el Nodo de Acción Externa HTTPS

1. Arrastra **Action** → **External HTTP Request** (o "Solicitud de Acción Externa HTTPS")
2. Configura el nodo:

#### **Configuración Básica:**

**Request Type:** `POST` (o `GET` si prefieres)

**URL:**
```
https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario
```

**Headers:**
Haz clic en **+ Add Header** y agrega:
- **Header Name**: `Content-Type`
- **Header Value**: `application/json`

Si configuraste API key, agrega otro header:
- **Header Name**: `x-api-key`
- **Header Value**: `[TU_API_KEY]` (si la configuraste)

**Request Body:**
Si usas POST, en el campo **Body** pega:
```json
{
  "ruc": "{{custom_field.ruc}}"
}
```

**Response Variable Name:**
```
consulta_ruc
```
(ManyChat guardará la respuesta en `{{consulta_ruc}}`)

### 3.4. Configuración Alternativa con GET

Si prefieres usar GET en lugar de POST:

**Request Type:** `GET`

**URL:**
```
https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario?ruc={{custom_field.ruc}}
```

**Headers:**
- `Content-Type`: `application/json`
- `x-api-key`: `[TU_API_KEY]` (opcional)

**Body:** (dejar vacío para GET)

**Response Variable Name:**
```
consulta_ruc
```

## Paso 4: Mostrar la Respuesta

### 4.1. Agregar Mensaje con la Respuesta

1. Después del nodo de Acción Externa, arrastra **Action** → **Send Message**
2. En el mensaje, puedes usar:

#### Opción 1: Mostrar Todo el JSON
```
{{consulta_ruc}}
```

#### Opción 2: Mostrar Datos Específicos
```
📋 Consulta de Estado Tributario

RUC: {{consulta_ruc.ruc}}
Estado: {{consulta_ruc.estado_tributario.estado}}
Total Deudas: ${{consulta_ruc.deudas.total}}
```

#### Opción 3: Mensaje Condicional
```
{{#if consulta_ruc.success}}
✅ Consulta exitosa

RUC: {{consulta_ruc.ruc}}
Estado: {{consulta_ruc.estado_tributario.estado}}

{{#if consulta_ruc.deudas.tiene_deudas}}
⚠️ Tiene deudas: ${{consulta_ruc.deudas.total}}
Cantidad: {{consulta_ruc.deudas.cantidad}} deuda(s)
{{else}}
✅ Sin deudas registradas
{{/if}}
{{else}}
❌ Error: {{consulta_ruc.error}}
{{/if}}
```

### 4.2. Guardar Datos en Custom Fields (Opcional)

Después de recibir la respuesta, puedes guardar datos específicos:

1. **Action** → **Set Custom Field**
   - **Field**: `estado_tributario`
   - **Value**: `{{consulta_ruc.estado_tributario.estado}}`

2. **Action** → **Set Custom Field**
   - **Field**: `total_deudas`
   - **Value**: `{{consulta_ruc.deudas.total}}`

3. **Action** → **Set Custom Field**
   - **Field**: `tiene_deudas`
   - **Value**: `{{consulta_ruc.deudas.tiene_deudas}}`

## Paso 5: Manejo de Errores

### 5.1. Agregar Condición para Errores

1. Después del nodo de Acción Externa, arrastra **Action** → **Condition**
2. Configura:
   - **Condition**: `{{consulta_ruc.success}}`
   - **Operator**: `equals`
   - **Value**: `false`

3. Si es falso (error), agrega un mensaje:
   ```
   ❌ Lo siento, hubo un error al consultar el RUC.
   
   {{#if consulta_ruc.error}}
   Error: {{consulta_ruc.error}}
   {{else}}
   Por favor, verifica que el RUC tenga 13 dígitos.
   {{/if}}
   ```

## Estructura Completa del Flujo

```
1. Trigger: "User Says" → "consultar ruc"
   ↓
2. Ask Question: Pide RUC → Guarda en {{custom_field.ruc}}
   ↓
3. External HTTP Request (POST)
   - URL: https://[PROJECT].supabase.co/functions/v1/manychat-estado-tributario
   - Headers: Content-Type: application/json
   - Body: {"ruc": "{{custom_field.ruc}}"}
   - Response Variable: consulta_ruc
   ↓
4. Condition: {{consulta_ruc.success}} equals true
   ↓
5a. Send Message (si éxito):
    "Estado: {{consulta_ruc.estado_tributario.estado}}"
   ↓
5b. Send Message (si error):
    "Error: {{consulta_ruc.error}}"
```

## Ejemplo de Configuración Visual

### Nodo External HTTP Request:

```
┌─────────────────────────────────────────┐
│ External HTTP Request                   │
├─────────────────────────────────────────┤
│ Request Type: POST                      │
│ URL: https://xxx.supabase.co/...       │
│                                         │
│ Headers:                                │
│   Content-Type: application/json       │
│                                         │
│ Body:                                   │
│   {                                     │
│     "ruc": "{{custom_field.ruc}}"     │
│   }                                     │
│                                         │
│ Response Variable: consulta_ruc        │
└─────────────────────────────────────────┘
```

## Campos Disponibles en la Respuesta

Después de la petición, puedes acceder a:

- `{{consulta_ruc.success}}` - true/false
- `{{consulta_ruc.ruc}}` - El RUC consultado
- `{{consulta_ruc.timestamp}}` - Fecha de consulta
- `{{consulta_ruc.estado_tributario.estado}}` - Estado del contribuyente
- `{{consulta_ruc.estado_tributario.tiene_estado}}` - true/false
- `{{consulta_ruc.deudas.tiene_deudas}}` - true/false
- `{{consulta_ruc.deudas.total}}` - Total de deudas
- `{{consulta_ruc.deudas.cantidad}}` - Cantidad de deudas
- `{{consulta_ruc.deudas.lista}}` - Array de deudas

## Ejemplo de Mensaje Completo

```
📋 *CONSULTA DE ESTADO TRIBUTARIO*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RUC: {{consulta_ruc.ruc}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{#if consulta_ruc.estado_tributario.tiene_estado}}
✅ *Estado:* {{consulta_ruc.estado_tributario.estado}}
{{else}}
⚠️ No se pudo obtener el estado
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{#if consulta_ruc.deudas.tiene_deudas}}
⚠️ *DEUDAS PENDIENTES*
💰 Total: ${{consulta_ruc.deudas.total}}
📊 Cantidad: {{consulta_ruc.deudas.cantidad}} deuda(s)

{{#each consulta_ruc.deudas.lista}}
• {{concepto}}: ${{monto}}
  Período: {{periodo}}
{{/each}}
{{else}}
✅ *Sin deudas registradas*
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 {{consulta_ruc.timestamp}}
```

## Prueba Rápida

1. Publica tu flujo
2. Ve a **Test** en ManyChat
3. Inicia una conversación
4. Escribe: `consultar ruc`
5. Ingresa un RUC de prueba
6. Verifica que recibas la respuesta JSON

## Troubleshooting

### ❌ No recibo respuesta

**Solución:**
- Verifica que la URL sea correcta
- Verifica que el Custom Field `ruc` tenga el valor
- Revisa los logs en Supabase Dashboard

### ❌ Error de timeout

**Solución:**
- La consulta puede tardar 30-60 segundos
- ManyChat tiene timeout de 30 segundos
- Considera mostrar mensaje de "Consultando, por favor espera..."

### ❌ No puedo acceder a los campos

**Solución:**
- Verifica que el Response Variable Name sea correcto
- Usa `{{consulta_ruc.campo}}` (con el nombre que pusiste)
- Verifica la estructura del JSON en la respuesta

### ❌ Error 400 o 500

**Solución:**
- Verifica que el RUC tenga 13 dígitos
- Verifica el formato del body JSON
- Revisa los logs en Supabase

## ✅ Checklist

- [ ] Función desplegada
- [ ] URL copiada
- [ ] Custom Field "ruc" creado
- [ ] Nodo External HTTP Request configurado
- [ ] Headers configurados
- [ ] Body configurado con {{custom_field.ruc}}
- [ ] Response Variable Name configurado
- [ ] Mensaje de respuesta configurado
- [ ] Flujo publicado
- [ ] Prueba realizada

¡Listo! Tu integración con ManyChat usando el nodo de Acciones está configurada 🎉

