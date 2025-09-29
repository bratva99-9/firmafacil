# 🔧 Solución para NetworkError - App Firma Electrónica

## ❌ Problema Identificado
El error `NetworkError when attempting to fetch resource` indica que tu aplicación no puede conectarse a Supabase porque las credenciales no están configuradas correctamente.

## ✅ Solución Paso a Paso

### 1. Crear archivo de configuración
Crea un archivo llamado `.env` en la raíz de tu proyecto (mismo nivel que `package.json`) con el siguiente contenido:

```env
# Configuración de Supabase
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 2. Obtener credenciales de Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **Project URL** y la **anon public** key
5. Reemplaza los valores en tu archivo `.env`

### 3. Configurar Storage
1. En Supabase Dashboard, ve a **Storage**
2. Crea un bucket llamado `documentos`
3. Configura las políticas de acceso según necesites

### 4. Reiniciar la aplicación
```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npm start
```

## 🧪 Verificar la Solución

### Opción 1: Usar el componente de diagnóstico
1. Importa y usa el componente `DiagnosticoConexion` en tu aplicación
2. Te mostrará el estado de la conexión y sugerencias

### Opción 2: Verificar en consola
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Deberías ver mensajes como:
   - ✅ "Conexión exitosa con Supabase!" (si funciona)
   - ❌ "ERROR: Las credenciales de Supabase no están configuradas correctamente" (si no funciona)

## 🔍 Diagnóstico Adicional

### Si el error persiste:
1. **Verifica la conexión a internet**
2. **Confirma que las credenciales sean correctas**
3. **Asegúrate de que el proyecto Supabase esté activo**
4. **Verifica que las tablas existan** (ejecuta el archivo `supabase-setup.sql`)

### Comandos útiles para debugging:
```bash
# Verificar variables de entorno
echo $REACT_APP_SUPABASE_URL

# Limpiar caché de npm
npm start -- --reset-cache
```

## 📋 Checklist de Verificación
- [ ] Archivo `.env` creado en la raíz del proyecto
- [ ] Variables `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY` configuradas
- [ ] Credenciales copiadas correctamente desde Supabase Dashboard
- [ ] Bucket `documentos` creado en Supabase Storage
- [ ] Servidor de desarrollo reiniciado
- [ ] Sin errores en la consola del navegador

## 🆘 Si necesitas ayuda adicional
1. Revisa los logs en la consola del navegador
2. Verifica el estado de tu proyecto en Supabase Dashboard
3. Asegúrate de que tu proyecto Supabase no haya alcanzado los límites de uso

---
*Este archivo fue generado automáticamente para ayudarte a solucionar el NetworkError.*
