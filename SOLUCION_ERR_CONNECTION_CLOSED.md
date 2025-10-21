# 🚨 Solución para ERR_CONNECTION_CLOSED - ecucontable.com

## ❌ Problema Identificado
El error `ERR_CONNECTION_CLOSED` indica que la conexión se está cerrando inesperadamente. Este problema puede tener varias causas:

## 🔍 Causas Posibles

### 1. **Problemas de Configuración de Supabase**
- Credenciales incorrectas o expiradas
- Proyecto Supabase suspendido o inactivo
- Límites de uso alcanzados

### 2. **Problemas de Netlify**
- Configuración incorrecta de redirecciones
- Variables de entorno faltantes
- Problemas con el dominio

### 3. **Problemas de Edge Functions**
- Funciones no desplegadas correctamente
- Timeouts en las funciones
- Problemas de CORS

### 4. **Problemas de Proxy**
- Configuración incorrecta del proxy
- Servicios externos no disponibles
- Problemas de CORS

## ✅ Soluciones Implementadas

### 1. **Configuración de Variables de Entorno**
Se ha actualizado `src/lib/supabase.js` para usar variables de entorno:

```javascript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'fallback-url'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'fallback-key'
```

### 2. **Configuración Mejorada de Netlify**
Se ha actualizado `netlify.toml` con:
- Headers de seguridad mejorados
- Configuración de caché optimizada
- Redirecciones más robustas

### 3. **Componente de Diagnóstico**
Se ha creado `src/components/DiagnosticoConexion.js` para:
- Verificar conexión con Supabase
- Verificar estado de Netlify
- Verificar Edge Functions
- Verificar configuración del proxy

## 🛠️ Pasos para Resolver el Problema

### Paso 1: Crear archivo .env
Crea un archivo `.env` en la raíz del proyecto con:

```env
REACT_APP_SUPABASE_URL=https://eapcqcuzfkpqngbvjtmv.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGNxY3V6ZmtwcW5nYnZqdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTEzNzIsImV4cCI6MjA3NDQyNzM3Mn0.-mufqMzFQetktwAL444d1PjdWfdCC5-2ftVs0LnTIL4
REACT_APP_NETLIFY_SITE_URL=https://ecucontable.com
```

### Paso 2: Configurar Variables en Netlify
1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio
3. Ve a **Site settings** → **Environment variables**
4. Agrega las variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_NETLIFY_SITE_URL`

### Paso 3: Verificar Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Verifica que tu proyecto esté activo
3. Revisa los logs de las Edge Functions
4. Verifica que no hayas alcanzado los límites de uso

### Paso 4: Redesplegar la Aplicación
```bash
# Limpiar caché
npm run build -- --reset-cache

# Redesplegar en Netlify
git add .
git commit -m "Fix: Resolver ERR_CONNECTION_CLOSED"
git push origin main
```

### Paso 5: Usar el Componente de Diagnóstico
1. Importa el componente en tu aplicación:
```javascript
import DiagnosticoConexion from './components/DiagnosticoConexion';
```

2. Úsalo en tu aplicación para verificar el estado:
```javascript
<DiagnosticoConexion />
```

## 🔧 Comandos de Diagnóstico

### Verificar conexión localmente:
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Verificar build de producción
npm run build
```

### Verificar logs de Netlify:
1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio
3. Ve a **Functions** → **Logs**
4. Revisa los logs de las funciones

### Verificar logs de Supabase:
1. Ve a Supabase Dashboard
2. Selecciona tu proyecto
3. Ve a **Logs** → **Edge Functions**
4. Revisa los logs de las funciones

## 🚨 Soluciones de Emergencia

### Si el problema persiste:

1. **Verificar DNS**:
   - Usa `nslookup ecucontable.com`
   - Verifica que el dominio apunte a Netlify

2. **Verificar SSL**:
   - Asegúrate de que el certificado SSL esté activo
   - Verifica que no haya problemas de certificado

3. **Verificar Firewall**:
   - Revisa si hay bloqueos de firewall
   - Verifica la configuración de proxy

4. **Contactar Soporte**:
   - Netlify Support para problemas de hosting
   - Supabase Support para problemas de base de datos

## 📋 Checklist de Verificación

- [ ] Archivo `.env` creado con variables correctas
- [ ] Variables configuradas en Netlify
- [ ] Proyecto Supabase activo y funcionando
- [ ] Edge Functions desplegadas correctamente
- [ ] Certificado SSL activo
- [ ] DNS configurado correctamente
- [ ] Aplicación redesplegada
- [ ] Diagnóstico ejecutado sin errores

## 🆘 Si Necesitas Ayuda Adicional

1. **Ejecuta el diagnóstico** usando el componente `DiagnosticoConexion`
2. **Revisa los logs** en Netlify y Supabase
3. **Verifica la configuración** de variables de entorno
4. **Contacta al soporte** si el problema persiste

---

*Este archivo fue generado automáticamente para ayudarte a resolver el error ERR_CONNECTION_CLOSED.*
