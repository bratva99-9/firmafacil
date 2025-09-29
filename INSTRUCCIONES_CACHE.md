# Instrucciones para Configurar el Sistema de Caché de Cédulas

## 📋 Pasos para Ejecutar en Supabase

### 1. Acceder al Dashboard de Supabase
- Ve a https://supabase.com/dashboard
- Selecciona tu proyecto: `eapcqcuzfkpqngbvjtmv`

### 2. Ejecutar el SQL de Creación de Tabla
- Ve a **SQL Editor** en el menú lateral
- Copia y pega el contenido del archivo `cache_cedulas.sql`
- Haz clic en **Run** para ejecutar el script

### 3. Verificar la Creación
- Ve a **Table Editor**
- Deberías ver la nueva tabla `cache_cedulas`
- Verifica que tenga todas las columnas necesarias

## 🎯 Funcionalidad del Sistema de Caché

### ✅ **Beneficios:**
- **Ahorro de Costos:** Solo consulta la API de Zamplisoft la primera vez
- **Velocidad:** Consultas locales son instantáneas
- **Confiabilidad:** Funciona aunque la API externa esté caída
- **Expiración Automática:** Los datos se renuevan cada 30 días

### 🔄 **Flujo de Funcionamiento:**
1. **Usuario ingresa cédula** → Sistema busca en caché local
2. **Si encuentra datos** → Los devuelve inmediatamente (SIN COSTO)
3. **Si NO encuentra datos** → Consulta API Zamplisoft (CON COSTO)
4. **Guarda resultado** → En caché local para futuras consultas
5. **Expira en 30 días** → Se renueva automáticamente

### 📊 **Logs en Consola:**
- `🔍 Buscando cédula en caché local...`
- `✅ Datos encontrados en caché local (sin costo)`
- `🌐 Consultando API Zamplisoft (con costo)...`
- `💾 Guardando datos de cédula en caché local...`

## 🛠️ **API de Zamplisoft Configurada:**

### **URL Real:**
```
https://apiconsult.zampisoft.com/api/consultar?identificacion={cedula}&token=cvZ1-zcMv-OKKh-AR29
```

### **Datos que Devuelve:**
- `cedula`: Número de cédula
- `nombre`: Nombre completo
- `genero`: HOMBRE/MUJER
- `fechaNacimiento`: Fecha de nacimiento
- `estadoCivil`: Estado civil
- `nacionalidad`: Nacionalidad
- `fechaCedulacion`: Fecha de cedulación
- `lugarDomicilio`: Provincia/Ciudad/Parroquia
- `calleDomicilio`: Calle del domicilio
- `numeracionDomicilio`: Numeración
- `nombreMadre`: Nombre de la madre
- `nombrePadre`: Nombre del padre
- `lugarNacimiento`: Lugar de nacimiento
- `instruccion`: Nivel de instrucción
- `profesion`: Profesión
- `conyuge`: Nombre del cónyuge

## 🛠️ **Funciones Disponibles:**

### `obtenerCedulaDesdeCache(numeroCedula)`
- Busca datos en la tabla `cache_cedulas`
- Solo devuelve datos no expirados
- Retorna `null` si no encuentra nada

### `guardarCedulaEnCache(numeroCedula, datosCedula)`
- Guarda datos en la tabla `cache_cedulas`
- Establece expiración de 30 días
- Usa `upsert` para actualizar si ya existe

### `consultarCedula(numeroCedula)` (Modificada)
- Implementa el flujo completo de caché
- Busca primero en local, luego en API
- Guarda automáticamente en caché

## 🎉 **Resultado Final:**
Una vez configurado, cada cédula solo se consultará a la API de Zamplisoft **UNA VEZ**, y todas las consultas posteriores serán instantáneas y gratuitas desde tu base de datos local.

## 💰 **Ahorro de Costos:**
- **Primera consulta:** Consulta API (costo)
- **Consultas posteriores:** Caché local (GRATIS)
- **Renovación automática:** Cada 30 días
