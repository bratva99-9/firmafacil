# Soluciones para Consulta de Denuncias de Fiscalía

## Problema
El sistema de fiscalía está protegido por **Incapsula**, que bloquea peticiones automatizadas desde servidores.

## Soluciones Implementadas

### ✅ Solución 1: Iframe Embebido (ACTIVA)
Cuando se detecta un bloqueo, se muestra un **iframe embebido** que permite consultar directamente desde el navegador del usuario. Esta es la solución más práctica y no requiere configuración adicional.

**Ventajas:**
- ✅ No requiere servicios externos
- ✅ Funciona directamente desde el navegador
- ✅ Sin costos adicionales
- ✅ Acceso legítimo desde el navegador del usuario

### 🔧 Solución 2: Servicio de Scraping (OPCIONAL)
Se ha preparado soporte para servicios de scraping especializados que pueden evitar bloqueos de Incapsula.

#### Opción A: ScraperAPI (Recomendado)
1. **Registrarse en ScraperAPI**: https://www.scraperapi.com/
   - Plan gratuito: 5,000 peticiones/mes
   - Plan Starter: $29/mes para 100,000 peticiones

2. **Obtener API Key**:
   - Ir a Dashboard → API Keys
   - Copiar tu API key

3. **Configurar en Supabase**:
   ```bash
   # Desde la terminal de Supabase CLI
   supabase secrets set SCRAPER_API_KEY=tu_api_key_aqui
   ```

4. **Desplegar la función**:
   ```bash
   supabase functions deploy fiscalia-denuncias
   ```

#### Opción B: ScrapingBee
1. **Registrarse**: https://www.scrapingbee.com/
2. **Obtener API Key**
3. **Modificar la Edge Function** para usar ScrapingBee en lugar de ScraperAPI

#### Opción C: Bright Data (Enterprise)
Para uso empresarial con alto volumen:
- https://brightdata.com/
- Requiere configuración personalizada

## Cómo Funciona

### Flujo Actual:
1. **Cliente intenta petición directa** desde el navegador
2. Si falla por CORS → **Edge Function intenta** desde el servidor
3. Si detecta bloqueo de Incapsula → **Muestra iframe embebido**

### Con Servicio de Scraping:
1. **Edge Function intenta primero** con servicio de scraping
2. Si el servicio falla → **Método estándar** (headers mejorados)
3. Si detecta bloqueo → **Muestra iframe embebido**

## Recomendación

**Para la mayoría de casos, la Solución 1 (iframe) es suficiente** porque:
- El usuario puede ver la información directamente
- No requiere servicios externos
- No tiene costos adicionales
- Es la forma más "legítima" de acceder

**Usar Solución 2 solo si:**
- Necesitas automatizar muchas consultas
- El iframe no es suficiente para tu caso de uso
- Tienes presupuesto para servicios de scraping

## Notas Importantes

⚠️ **Términos de Servicio**: Asegúrate de cumplir con los términos de servicio de la fiscalía al hacer scraping automatizado.

⚠️ **Rate Limiting**: Los servicios de scraping tienen límites de peticiones. Planifica según tu uso.

⚠️ **Costo**: Los servicios de scraping pueden tener costos mensuales. Revisa los planes antes de configurar.

