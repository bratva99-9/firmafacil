# Instrucciones para Desplegar Edge Function de Consulta ANT

## Descripción
Esta Edge Function consulta los puntos de licencia de la Agencia Nacional de Tránsito (ANT) para una cédula específica.

## Archivos Creados

### 1. Edge Function (`supabase/functions/ant-puntos/index.ts`)
- ✅ Función que consulta la API de ANT desde el servidor
- ✅ Maneja CORS correctamente
- ✅ Obtiene cookies de sesión antes de hacer la consulta
- ✅ Procesa la respuesta JSON y la devuelve en formato estándar
- ✅ Incluye manejo de errores robusto

### 2. Integración en ConsultaCedula.js
- ✅ Estados agregados para datos de ANT
- ✅ Función `consultarPuntosANT` creada
- ✅ Consulta automática al consultar una cédula
- ✅ Sección 09 agregada al expediente para mostrar datos

## Pasos para Desplegar

### Paso 1: Verificar Supabase CLI
```bash
# Verificar que tienes Supabase CLI instalado
supabase --version

# Si no está instalado:
npm install -g supabase
```

### Paso 2: Autenticarse en Supabase (si no lo has hecho)
```bash
supabase login
```

### Paso 3: Desplegar la Edge Function
```bash
# Desde la raíz del proyecto
supabase functions deploy ant-puntos
```

### Paso 4: Verificar Despliegue
```bash
supabase functions list
```

Deberías ver `ant-puntos` en la lista.

## Pruebas

### Probar desde la aplicación
1. Abre la aplicación
2. Ve a "Consultar Cédula"
3. Ingresa una cédula válida (10 dígitos)
4. La consulta de ANT se ejecutará automáticamente
5. Los datos aparecerán en la sección 09 del expediente

### Probar directamente la Edge Function
```bash
# Obtener tu token de Supabase
# Luego hacer una petición:
curl -X POST 'https://eapcqcuzfkpqngbvjtmv.functions.supabase.co/ant-puntos' \
  -H 'Authorization: Bearer TU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"cedula": "1308040409"}'
```

## Estructura de la Solución

```
📁 supabase/
  └── functions/
      └── ant-puntos/
          └── index.ts          # Edge Function principal

📁 src/
  └── components/
      └── ConsultaCedula.js     # Componente actualizado con integración ANT
```

## Flujo de Funcionamiento

1. **Usuario ingresa cédula** → Frontend valida formato
2. **Consulta automática** → Se ejecuta en paralelo con otras consultas
3. **Edge Function** → Consulta API de ANT desde servidor
   - Obtiene cookies de sesión
   - Hace POST con form-urlencoded
   - Procesa respuesta JSON
4. **Muestra datos** → Sección 09 del expediente

## Formato de Datos

La API de ANT puede devolver datos en diferentes formatos. La sección del expediente está diseñada para manejar:
- Objetos simples con propiedades clave-valor
- Arrays de objetos
- Objetos anidados
- Cualquier estructura JSON

## Ventajas de esta Solución

- ✅ **Sin problemas de CORS** - Edge Function actúa como proxy
- ✅ **Más confiable** - Servidor maneja la consulta
- ✅ **Automático** - Se ejecuta al consultar una cédula
- ✅ **Integrado** - Aparece en el expediente completo
- ✅ **Escalable** - Supabase maneja la infraestructura
- ✅ **Seguro** - No expone credenciales

## Monitoreo

### Ver logs en tiempo real
```bash
supabase functions logs ant-puntos
```

### Ver logs desde el dashboard
1. Ve a tu proyecto en Supabase Dashboard
2. Edge Functions → ant-puntos → Logs

## Solución de Problemas

### Error: "Cédula inválida"
- Verifica que la cédula tenga exactamente 10 dígitos
- Solo números, sin guiones ni espacios

### Error: "Timeout"
- La API de ANT puede tardar en responder
- El timeout está configurado en 30 segundos
- Intenta nuevamente

### Error: "La respuesta no es un JSON válido"
- La API puede estar devolviendo HTML o texto
- Revisa los logs para ver el contenido real
- Puede ser un problema temporal del servicio

### No aparecen datos
- Verifica que la cédula tenga licencia registrada
- Algunas cédulas pueden no tener puntos registrados
- Revisa los logs para ver la respuesta completa

## Costos

- **Edge Functions**: Gratuitas hasta 500,000 invocaciones/mes
- **API ANT**: Completamente gratuita
- **Sin costos adicionales** para esta funcionalidad

## Notas Importantes

- La consulta se ejecuta automáticamente al consultar una cédula
- Los datos se muestran en la sección 09 del expediente
- La sección es colapsable/expandible como las demás
- Los datos se actualizan cada vez que se consulta una cédula

