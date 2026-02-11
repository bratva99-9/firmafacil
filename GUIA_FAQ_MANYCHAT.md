# Guía: Conectar FAQs de Supabase con ManyChat

Esta guía te ayudará a conectar el sistema de FAQs con ManyChat usando ChatGPT.

## Paso 1: Crear la tabla en Supabase

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el contenido del archivo `supabase/migrations/create_faqs_table.sql`
4. Verifica que la tabla `faqs` se haya creado correctamente

## Paso 2: Desplegar la función Edge Function

1. En Supabase, ve a **Edge Functions**
2. Crea una nueva función llamada `consultar-faq`
3. Copia el contenido de `supabase/functions/consultar-faq/index.ts`
4. Despliega la función

O desde la terminal:
```bash
supabase functions deploy consultar-faq
```

## Paso 3: Agregar FAQs iniciales

Los FAQs de ejemplo ya están en el SQL. Puedes agregar más desde:

1. **Supabase Dashboard** → Table Editor → `faqs`
2. O ejecuta más INSERTs en SQL

**Estructura de un FAQ:**
- `pregunta`: La pregunta completa
- `respuesta`: La respuesta completa (puede tener saltos de línea con `\n`)
- `categoria`: "ruc", "firma_electronica", "general", etc.
- `palabras_clave`: Array de palabras clave para búsqueda (ej: `["costo", "precio", "cuanto"]`)
- `activo`: `true` para activo, `false` para desactivar
- `orden`: Número para ordenar (menor = aparece primero)

## Paso 4: Configurar en ManyChat

### Flujo sugerido:

```
Usuario envía mensaje
    ↓
ChatGPT detecta intención
    ↓
Si es "consulta_general" o pregunta directa:
    ↓
External HTTP Request → consultar-faq
    ↓
ChatGPT usa los FAQs encontrados para responder
```

### Configuración del nodo "External HTTP Request":

1. **URL:**
   ```
   https://[TU-PROYECTO].supabase.co/functions/v1/consultar-faq
   ```

2. **Method:** `POST`

3. **Headers:**
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer [TU-ANON-KEY]`

4. **Body:**
   ```json
   {
     "pregunta": "{{last_user_input}}"
   }
   ```

5. **Response Mapping:**
   - **JSONPath:** `$.faqs` → Campo: `faqs_encontrados` (Text)
   - **JSONPath:** `$.respuesta_final` → Campo: `respuesta_faq` (Text)

### Configuración del nodo ChatGPT:

**Prompt mejorado con FAQs:**

```
Eres un asistente de una empresa de servicios tributarios en Ecuador.

INFORMACIÓN DE CONTEXTO (FAQs encontrados):
{{custom_field.faqs_encontrados}}

Si hay FAQs disponibles, úsalos para responder de manera precisa y profesional.
Si no hay FAQs o no son relevantes, responde amablemente que no tienes esa información específica y ofrece contactar para más detalles.

INSTRUCCIONES:
- Usa la información de los FAQs cuando sea relevante
- Sé claro, conciso y profesional
- Si el usuario necesita un servicio específico, sugiere contactar para más información
- Mantén un tono amigable y servicial

Pregunta del usuario: {{last_user_input}}
```

**O si prefieres usar solo la respuesta final:**

```
Eres un asistente de una empresa de servicios tributarios en Ecuador.

INFORMACIÓN RELEVANTE:
{{custom_field.respuesta_faq}}

INSTRUCCIONES:
- Si hay información disponible arriba, úsala para responder
- Si no hay información o dice "No encontré información", responde amablemente que no tienes esa información específica
- Ofrece contactar para más detalles
- Sé claro, conciso y profesional

Pregunta del usuario: {{last_user_input}}
```

## Paso 5: Campos personalizados en ManyChat

Crea estos campos en ManyChat (Settings → Custom Fields):

1. **faqs_encontrados** (Text)
   - Almacena el JSON completo de FAQs encontrados

2. **respuesta_faq** (Text)
   - Almacena la respuesta formateada del FAQ más relevante

## Paso 6: Probar la función

Puedes probar la función directamente con PowerShell:

```powershell
$body = @{
    pregunta = "cuanto cuesta poner al dia un ruc"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://[TU-PROYECTO].supabase.co/functions/v1/consultar-faq" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer [TU-ANON-KEY]"
  } `
  -Body $body
```

**Respuesta esperada:**
```json
{
  "encontrados": 1,
  "pregunta_buscada": "cuanto cuesta poner al dia un ruc",
  "faqs": [
    {
      "pregunta": "¿Cuánto cuesta poner al día un RUC?",
      "respuesta": "El costo para poner al día un RUC depende...",
      "categoria": "ruc",
      "relevancia": 35
    }
  ],
  "respuesta_final": "Pregunta: ¿Cuánto cuesta poner al día un RUC?\n\nRespuesta: El costo para poner al día un RUC depende..."
}
```

## Paso 7: Agregar más FAQs

Puedes agregar FAQs desde:

1. **Supabase Dashboard** (más fácil):
   - Ve a Table Editor → `faqs`
   - Click en "Insert row"
   - Completa los campos

2. **SQL** (más rápido para múltiples):
   ```sql
   INSERT INTO public.faqs (pregunta, respuesta, categoria, palabras_clave, orden)
   VALUES (
     'Tu pregunta aquí',
     'Tu respuesta aquí',
     'ruc', -- o 'general', 'firma_electronica', etc.
     ARRAY['palabra1', 'palabra2', 'palabra3'],
     10
   );
   ```

## Tips

1. **Palabras clave:** Agrega todas las variaciones posibles (singular, plural, sinónimos)
2. **Categorías:** Usa categorías consistentes para facilitar filtros futuros
3. **Orden:** FAQs más comunes deben tener `orden` menor (aparecen primero)
4. **Activo/Inactivo:** Desactiva FAQs antiguos en lugar de borrarlos
5. **Pruebas:** Prueba con diferentes formas de hacer la misma pregunta

## Ejemplos de FAQs adicionales

```sql
-- FAQ sobre tiempo de entrega
INSERT INTO public.faqs (pregunta, respuesta, categoria, palabras_clave, orden)
VALUES (
  '¿Cuándo recibiré mi RUC?',
  'El tiempo de entrega depende del tipo de trámite...',
  'ruc',
  ARRAY['cuando', 'tiempo', 'entrega', 'recibir', 'listo'],
  4
);

-- FAQ sobre soporte
INSERT INTO public.faqs (pregunta, respuesta, categoria, palabras_clave, orden)
VALUES (
  '¿Ofrecen soporte después de la compra?',
  'Sí, ofrecemos soporte completo durante y después del proceso...',
  'general',
  ARRAY['soporte', 'ayuda', 'asistencia', 'despues', 'post venta'],
  9
);
```

## Solución de problemas

**Problema:** No encuentra FAQs relevantes
- **Solución:** Agrega más palabras clave al FAQ
- **Solución:** Revisa que el FAQ esté activo (`activo = true`)

**Problema:** Encuentra FAQs pero no son relevantes
- **Solución:** Ajusta las palabras clave para ser más específicas
- **Solución:** Revisa la puntuación en los logs de Supabase

**Problema:** ChatGPT no usa la información de los FAQs
- **Solución:** Asegúrate de que el campo `faqs_encontrados` o `respuesta_faq` esté en el prompt
- **Solución:** Verifica que el mapeo de respuesta esté correcto

