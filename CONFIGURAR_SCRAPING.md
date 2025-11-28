# Configurar Servicio de Scraping para Fiscalía

## Problema
El sistema de fiscalía está protegido por Incapsula y bloquea peticiones automatizadas desde servidores. Para resolver esto, necesitas configurar un servicio de scraping.

## Opción Recomendada: ScraperAPI (Plan Gratuito)

### Paso 1: Registrarse en ScraperAPI
1. Ve a: https://www.scraperapi.com/
2. Haz clic en "Start Free Trial"
3. Crea una cuenta (puedes usar Google/GitHub)
4. **Plan gratuito**: 5,000 peticiones/mes (suficiente para pruebas)

### Paso 2: Obtener API Key
1. Una vez registrado, ve al Dashboard
2. En la sección "API Keys", copia tu API key
3. Se verá algo como: `abc123def456ghi789...`

### Paso 3: Configurar en Supabase

#### Opción A: Desde Supabase Dashboard
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a **Settings** → **Edge Functions** → **Secrets**
3. Haz clic en **Add new secret**
4. Nombre: `SCRAPER_API_KEY`
5. Valor: Pega tu API key de ScraperAPI
6. Guarda

#### Opción B: Desde Terminal (Supabase CLI)
```bash
# Asegúrate de estar autenticado
supabase login

# Configurar el secret
supabase secrets set SCRAPER_API_KEY=tu_api_key_aqui

# Verificar que se guardó
supabase secrets list
```

### Paso 4: Desplegar la Edge Function
```bash
# Desde la raíz del proyecto
supabase functions deploy fiscalia-denuncias
```

### Paso 5: Probar
1. Consulta una cédula en tu aplicación
2. Debería funcionar automáticamente usando ScraperAPI

## Alternativa: ScrapingBee

Si prefieres ScrapingBee:

1. **Registrarse**: https://www.scrapingbee.com/
2. **Obtener API Key** del dashboard
3. **Configurar en Supabase**:
   ```bash
   supabase secrets set SCRAPINGBEE_API_KEY=tu_api_key_aqui
   ```
4. **Desplegar**:
   ```bash
   supabase functions deploy fiscalia-denuncias
   ```

## Verificar Configuración

Para verificar que los secrets están configurados:

```bash
supabase secrets list
```

Deberías ver:
- `SCRAPER_API_KEY` (si configuraste ScraperAPI)
- `SCRAPINGBEE_API_KEY` (si configuraste ScrapingBee)

## Costos

### ScraperAPI
- **Gratis**: 5,000 peticiones/mes
- **Starter**: $29/mes → 100,000 peticiones
- **Business**: $99/mes → 500,000 peticiones

### ScrapingBee
- **Starter**: $49/mes → 25,000 peticiones
- **Business**: $149/mes → 100,000 peticiones

## Notas Importantes

⚠️ **Límites**: El plan gratuito de ScraperAPI tiene 5,000 peticiones/mes. Si necesitas más, considera actualizar el plan.

⚠️ **Rate Limiting**: Los servicios de scraping pueden tener límites de velocidad. La función maneja esto automáticamente.

⚠️ **Fallback**: Si no configuras ningún servicio, la aplicación mostrará un iframe embebido como alternativa.

## Solución de Problemas

### Error: "SCRAPER_API_KEY not found"
- Verifica que configuraste el secret correctamente
- Asegúrate de haber desplegado la función después de configurar el secret

### Error: "Invalid API key"
- Verifica que copiaste la API key completa
- Asegúrate de que no hay espacios extra

### Error: "Quota exceeded"
- Has alcanzado el límite mensual
- Considera actualizar tu plan o esperar al siguiente mes

## Soporte

- **ScraperAPI**: https://www.scraperapi.com/documentation
- **ScrapingBee**: https://www.scrapingbee.com/documentation

