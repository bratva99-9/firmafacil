# 🚀 Guía Completa: Configurar ManyChat con Consulta Estado Tributario

## 📋 Índice
1. [Paso 1: Desplegar la Función en Supabase](#paso-1)
2. [Paso 2: Obtener la URL de tu Función](#paso-2)
3. [Paso 3: Configurar ManyChat (Webhook)](#paso-3)
4. [Paso 4: Crear un Flujo de Prueba](#paso-4)
5. [Paso 5: Probar la Integración](#paso-5)
6. [Paso 6: Guardar Datos en Custom Fields](#paso-6)
7. [Paso 7: Crear Mensajes Dinámicos](#paso-7)
8. [Solución de Problemas](#solucion)

---

## <a name="paso-1"></a>Paso 1: Desplegar la Función en Supabase

### 1.1. Abre tu terminal y navega a tu proyecto

```bash
cd "C:\Users\Kevin\Desktop\APP FIRMA 0.1"
```

### 1.2. Verifica que tienes Supabase CLI instalado

```bash
supabase --version
```

Si no lo tienes, instálalo:
```bash
npm install -g supabase
```

### 1.3. Inicia sesión en Supabase (si no lo has hecho)

```bash
supabase login
```

### 1.4. Enlaza tu proyecto (si no está enlazado)

```bash
supabase link --project-ref [TU_PROJECT_REF]
```

Para obtener tu `project-ref`:
- Ve a https://supabase.com/dashboard
- Selecciona tu proyecto
- Ve a Settings → API
- Copia el "Reference ID"

### 1.5. Despliega la función

```bash
supabase functions deploy manychat-estado-tributario
```

**✅ Deberías ver un mensaje como:**
```
Deploying function manychat-estado-tributario...
Function manychat-estado-tributario deployed successfully!
```

---

## <a name="paso-2"></a>Paso 2: Obtener la URL de tu Función

### 2.1. Obtén tu URL de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca la sección **Project URL**
5. Copia la URL (algo como: `https://xxxxxxxxxxxxx.supabase.co`)

### 2.2. Construye la URL completa de tu función

Tu URL será:
```
https://[TU_PROJECT_REF].supabase.co/functions/v1/manychat-estado-tributario
```

**Ejemplo:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/manychat-estado-tributario
```

**📝 GUARDA ESTA URL, la necesitarás en ManyChat**

### 2.3. (Opcional) Configurar API Key para Seguridad

Si quieres proteger tu endpoint:

1. En Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. Haz clic en **Add Secret**
3. Nombre: `MANYCHAT_API_KEY`
4. Valor: Crea una clave secreta (ej: `mc_abc123xyz789`)
5. Guarda

**📝 GUARDA ESTA API KEY también**

---

## <a name="paso-3"></a>Paso 3: Configurar ManyChat (Webhook)

### 3.1. Inicia sesión en ManyChat

1. Ve a https://manychat.com
2. Inicia sesión con tu cuenta
3. Selecciona tu página de Facebook/Instagram

### 3.2. Crea un Custom Field para el RUC

Antes de crear el webhook, necesitas un campo para guardar el RUC:

1. Ve a **Settings** → **Custom Fields**
2. Haz clic en **+ Add Field**
3. Configura:
   - **Field Name**: `ruc`
   - **Field Type**: Text
   - **Description**: RUC del contribuyente
4. Guarda

### 3.3. Crea el Webhook

1. Ve a **Automation** → **Webhooks**
2. Haz clic en **+ Add Webhook**
3. Configura el webhook:

#### **Configuración Básica:**
- **Webhook Name**: `Consulta Estado Tributario`
- **Webhook URL**: Pega la URL que guardaste en el Paso 2.2
  ```
  https://[TU_PROJECT_REF].supabase.co/functions/v1/manychat-estado-tributario
  ```
- **Request Method**: `POST`
- **Request Format**: `JSON`

#### **Headers (si configuraste API Key):**
Haz clic en **+ Add Header** y agrega:
- **Header Name**: `x-api-key`
- **Header Value**: Tu API key (la que guardaste en 2.3)

Si NO configuraste API key, puedes omitir los headers.

#### **Request Body:**
Haz clic en **Body** y pega esto:

```json
{
  "ruc": "{{custom_field.ruc}}"
}
```

**Explicación:** `{{custom_field.ruc}}` tomará el valor del campo personalizado "ruc" del usuario.

#### **Response Mapping (Opcional pero Recomendado):**
ManyChat guardará automáticamente la respuesta en `{{webhook}}`. No necesitas configurar nada aquí, pero puedes mapear campos específicos si quieres.

4. Haz clic en **Save**

**✅ Tu webhook está configurado**

---

## <a name="paso-4"></a>Paso 4: Crear un Flujo de Prueba

### 4.1. Crea un nuevo Flujo

1. Ve a **Automation** → **Flows**
2. Haz clic en **+ Create Flow**
3. Nombre: `Consulta Estado Tributario - Prueba`

### 4.2. Agrega un Trigger

1. Arrastra **Trigger** → **User Says**
2. Configura:
   - **Keywords**: `consultar ruc`, `estado tributario`, `verificar ruc`
   - **Match Type**: Contains

### 4.3. Pide el RUC al Usuario

1. Arrastra **Action** → **Ask Question**
2. Configura:
   - **Question Type**: Text
   - **Question**: `Por favor, ingresa el RUC que deseas consultar (13 dígitos):`
   - **Save Answer To**: `{{custom_field.ruc}}`

### 4.4. Valida el RUC (Opcional pero Recomendado)

1. Arrastra **Action** → **Condition**
2. Configura:
   - **Condition**: `{{custom_field.ruc}}` contains `{{custom_field.ruc}}`
   - **Operator**: `matches regex`
   - **Value**: `^\d{13}$`

Esto verificará que el RUC tenga exactamente 13 dígitos.

### 4.5. Llama al Webhook

1. Arrastra **Action** → **Webhook**
2. Selecciona el webhook que creaste: `Consulta Estado Tributario`
3. ManyChat automáticamente enviará el RUC y recibirá la respuesta

### 4.6. Muestra el Resultado

1. Arrastra **Action** → **Send Message**
2. En el mensaje, pega:

```
{{webhook.resumen}}
```

O si quieres un mensaje más personalizado:

```
📋 *Consulta de Estado Tributario*

RUC: {{webhook.ruc}}

{{#if webhook.datos.deudas.tiene_deudas}}
⚠️ *Estado:* Tiene deudas
💰 *Total de deudas:* ${{webhook.datos.deudas.total_deudas}}
📊 *Cantidad:* {{webhook.datos.deudas.cantidad_deudas}} deuda(s)
{{else}}
✅ *Estado:* Sin deudas registradas
{{/if}}

{{#if webhook.datos.estado_tributario.tiene_estado}}
📄 *Estado Tributario:* {{webhook.datos.estado_tributario.estado_general}}
{{/if}}
```

### 4.7. Manejo de Errores

1. Después del webhook, agrega **Condition**
2. Configura:
   - **Condition**: `{{webhook.success}}` equals `false`
3. Si es falso (error), agrega un mensaje:
   ```
   ❌ Lo siento, hubo un error al consultar el RUC.
   
   Error: {{webhook.error}}
   
   Por favor, verifica que el RUC tenga 13 dígitos e intenta nuevamente.
   ```

### 4.8. Activa el Flujo

1. Haz clic en **Publish** en la esquina superior derecha
2. El flujo está activo

---

## <a name="paso-5"></a>Paso 5: Probar la Integración

### 5.1. Prueba desde ManyChat

1. Ve a **Test** en ManyChat
2. Inicia una conversación de prueba
3. Escribe: `consultar ruc`
4. Ingresa un RUC de prueba: `1234567890123` (o un RUC real)
5. Espera la respuesta (puede tardar 30-60 segundos)

### 5.2. Verifica la Respuesta

Deberías ver:
- El resumen del estado tributario
- Información de deudas (si las hay)
- Estado del contribuyente

### 5.3. Revisa los Logs (si hay problemas)

1. En Supabase Dashboard → **Edge Functions** → **manychat-estado-tributario**
2. Ve a **Logs** para ver si hay errores

---

## <a name="paso-6"></a>Paso 6: Guardar Datos en Custom Fields

Para usar los datos más adelante, guárdalos en Custom Fields:

### 6.1. Crea los Custom Fields Necesarios

Ve a **Settings** → **Custom Fields** y crea:

1. **estado_tributario** (Text)
2. **tiene_deudas** (Yes/No)
3. **total_deudas** (Number)
4. **cantidad_deudas** (Number)

### 6.2. Guarda los Datos Después del Webhook

En tu flujo, después del webhook, agrega:

1. **Action** → **Set Custom Field**
   - **Field**: `estado_tributario`
   - **Value**: `{{webhook.datos.estado_tributario.estado_general}}`

2. **Action** → **Set Custom Field**
   - **Field**: `tiene_deudas`
   - **Value**: `{{webhook.datos.deudas.tiene_deudas}}`

3. **Action** → **Set Custom Field**
   - **Field**: `total_deudas`
   - **Value**: `{{webhook.datos.deudas.total_deudas}}`

4. **Action** → **Set Custom Field**
   - **Field**: `cantidad_deudas`
   - **Value**: `{{webhook.datos.deudas.cantidad_deudas}}`

---

## <a name="paso-7"></a>Paso 7: Crear Mensajes Dinámicos

### Ejemplo 1: Mensaje Simple

```
{{webhook.resumen}}
```

### Ejemplo 2: Mensaje con Formato

```
📋 *CONSULTA DE ESTADO TRIBUTARIO*

━━━━━━━━━━━━━━━━━━━━
RUC: {{webhook.ruc}}
━━━━━━━━━━━━━━━━━━━━

{{#if webhook.datos.estado_tributario.tiene_estado}}
✅ *Estado:* {{webhook.datos.estado_tributario.estado_general}}
{{/if}}

{{#if webhook.datos.deudas.tiene_deudas}}
⚠️ *DEUDAS PENDIENTES*
💰 Total: ${{webhook.datos.deudas.total_deudas}}
📊 Cantidad: {{webhook.datos.deudas.cantidad_deudas}} deuda(s)

{{#each webhook.datos.deudas.deudas}}
• {{concepto}}: ${{monto}}
  Período: {{periodo}}
  Vence: {{fecha_vencimiento}}
{{/each}}
{{else}}
✅ *Sin deudas registradas*
{{/if}}

━━━━━━━━━━━━━━━━━━━━
🕐 Consultado: {{webhook.timestamp}}
```

### Ejemplo 3: Mensaje Condicional por Deudas

```
{{#if webhook.datos.deudas.tiene_deudas}}
⚠️ *ALERTA DE DEUDAS*

El RUC {{webhook.ruc}} tiene deudas pendientes por un total de ${{webhook.datos.deudas.total_deudas}}.

Te recomendamos regularizar tu situación tributaria lo antes posible.
{{else}}
✅ *TODO EN ORDEN*

El RUC {{webhook.ruc}} no tiene deudas registradas en el SRI.
{{/if}}
```

---

## <a name="solucion"></a>Solución de Problemas

### ❌ Error: "Function not found"

**Solución:**
- Verifica que desplegaste la función: `supabase functions deploy manychat-estado-tributario`
- Verifica que la URL sea correcta

### ❌ Error: "RUC es requerido"

**Solución:**
- Verifica que el Custom Field `ruc` esté guardando el valor correctamente
- Verifica que el body del webhook tenga: `{"ruc": "{{custom_field.ruc}}"}`

### ❌ Error: "RUC debe tener 13 dígitos"

**Solución:**
- Agrega validación en ManyChat antes de llamar al webhook
- Usa la condición del Paso 4.4

### ❌ Error: "API key inválida"

**Solución:**
- Verifica que configuraste `MANYCHAT_API_KEY` en Supabase Secrets
- Verifica que el header `x-api-key` tenga el valor correcto en ManyChat

### ❌ La consulta tarda mucho (timeout)

**Solución:**
- Es normal, la consulta puede tardar 30-60 segundos
- ManyChat tiene un timeout de 30 segundos por defecto
- Considera mostrar un mensaje de "Consultando, por favor espera..."

### ❌ No recibo respuesta

**Solución:**
1. Verifica los logs en Supabase Dashboard → Edge Functions → Logs
2. Prueba la función directamente con Postman o curl:
   ```bash
   curl -X POST https://[TU_PROJECT].supabase.co/functions/v1/manychat-estado-tributario \
     -H "Content-Type: application/json" \
     -d '{"ruc": "1234567890123"}'
   ```

### ❌ Los datos no se guardan en Custom Fields

**Solución:**
- Verifica que los nombres de los Custom Fields coincidan exactamente
- Verifica que estés usando la sintaxis correcta: `{{webhook.datos.deudas.total_deudas}}`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard
2. Verifica que todos los pasos se hayan completado correctamente
3. Prueba la función directamente con curl o Postman

---

## ✅ Checklist Final

- [ ] Función desplegada en Supabase
- [ ] URL de la función copiada
- [ ] Custom Field "ruc" creado en ManyChat
- [ ] Webhook configurado en ManyChat
- [ ] Flujo de prueba creado
- [ ] Prueba exitosa realizada
- [ ] Custom Fields para guardar datos creados
- [ ] Mensajes dinámicos configurados

**¡Listo! Tu integración ManyChat está funcionando** 🎉

