# Estado Tributario con Navegador Real (ScrapingBee/ScraperAPI)

Esta función usa servicios de scraping con navegador real (ScrapingBee o ScraperAPI) para resolver el captcha del SRI de forma más natural.

## Configuración

Necesitas configurar uno de estos servicios:

### Opción 1: ScrapingBee (Recomendado)

1. **Registrarse**: https://www.scrapingbee.com/
2. **Obtener API Key** del dashboard
3. **Configurar en Supabase**:
   ```bash
   supabase secrets set SCRAPINGBEE_API_KEY=tu_api_key_aqui
   ```

### Opción 2: ScraperAPI

1. **Registrarse**: https://www.scraperapi.com/
2. **Obtener API Key** del dashboard  
3. **Configurar en Supabase**:
   ```bash
   supabase secrets set SCRAPER_API_KEY=tu_api_key_aqui
   ```

## Limitaciones

1. **Tiempo de ejecución**: Edge Functions tienen un límite de tiempo (normalmente 60 segundos).
2. **Costo**: Los servicios de scraping tienen costos por petición.
3. **Captcha manual**: Si el captcha requiere resolución manual, puede fallar. ScrapingBee tiene mejor soporte para esto.

## Uso

```bash
curl -X POST https://[TU-PROYECTO].supabase.co/functions/v1/estado-tributario-playwright \
  -H "Authorization: Bearer [TU-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{"ruc": "0993391170001"}'
```

## Notas

- Esta función usa servicios externos de scraping con navegador real
- ScrapingBee tiene mejor soporte para JavaScript y captchas
- ScraperAPI es más económico pero puede tener limitaciones con JavaScript complejo
- Si el captcha requiere resolución manual, ScrapingBee puede manejarlo mejor

