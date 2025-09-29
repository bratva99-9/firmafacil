# Instrucciones para Desplegar Edge Function de Consulta RUC

## Problema Resuelto
El error de CORS que estabas experimentando se debe a que los navegadores bloquean las consultas directas a APIs externas por razones de seguridad. La solución es usar Supabase Edge Functions que actúan como un proxy seguro.

## Archivos Creados

### 1. Edge Function (`supabase/functions/consultar-ruc/index.ts`)
- ✅ Función que consulta la API del SRI desde el servidor
- ✅ Maneja CORS correctamente
- ✅ Procesa la respuesta y la devuelve en formato estándar
- ✅ Incluye manejo de errores robusto

### 2. Función Actualizada (`src/lib/supabase.js`)
- ✅ Usa Edge Function como método principal
- ✅ Mantiene caché local de 30 minutos
- ✅ Incluye fallback con proxy público
- ✅ Manejo de errores completo

## Pasos para Desplegar

### Paso 1: Instalar Supabase CLI
```bash
npm install -g supabase
```

### Paso 2: Inicializar Supabase (si no está inicializado)
```bash
supabase init
```

### Paso 3: Desplegar la Edge Function
```bash
supabase functions deploy consultar-ruc
```

### Paso 4: Verificar Despliegue
```bash
supabase functions list
```

## Configuración Adicional

### Variables de Entorno (opcional)
Si necesitas configurar variables específicas:
```bash
supabase secrets set SRI_API_TIMEOUT=10000
```

### Logs de la Función
Para ver los logs en tiempo real:
```bash
supabase functions logs consultar-ruc
```

## Estructura de la Solución

```
📁 supabase/
  └── functions/
      └── consultar-ruc/
          └── index.ts          # Edge Function principal

📁 src/
  └── lib/
      └── supabase.js           # Función cliente actualizada
```

## Flujo de Funcionamiento

1. **Usuario ingresa RUC** → Frontend valida formato
2. **Consulta caché local** → Si existe y no expiró, devuelve datos
3. **Edge Function** → Consulta API del SRI desde servidor
4. **Procesa respuesta** → Convierte formato y valida datos
5. **Guarda en caché** → Para futuras consultas (30 min)
6. **Devuelve datos** → Al frontend en formato estándar

## Ventajas de esta Solución

- ✅ **Sin problemas de CORS** - Edge Function actúa como proxy
- ✅ **Más confiable** - Servidor maneja la consulta
- ✅ **Mejor rendimiento** - Caché local + servidor optimizado
- ✅ **Escalable** - Supabase maneja la infraestructura
- ✅ **Seguro** - No expone tokens ni credenciales
- ✅ **Fallback robusto** - Múltiples métodos de respaldo

## Pruebas

Después del despliegue, puedes probar la función directamente:

```bash
curl -X POST 'https://tu-proyecto.supabase.co/functions/v1/consultar-ruc' \
  -H 'Authorization: Bearer tu-token' \
  -H 'Content-Type: application/json' \
  -d '{"ruc": "0958398984001"}'
```

## Monitoreo

- **Logs**: `supabase functions logs consultar-ruc`
- **Métricas**: Dashboard de Supabase
- **Errores**: Logs detallados en tiempo real

## Costos

- **Edge Functions**: Gratuitas hasta 500,000 invocaciones/mes
- **API SRI**: Completamente gratuita
- **Caché**: Reduce consultas innecesarias

Esta solución es la más robusta y profesional para manejar consultas a APIs externas desde aplicaciones web.
