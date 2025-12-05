# 📋 Instrucciones para Cargar Actividades CIIU4 desde CSV

## Paso 1: Preparar el CSV

Tu archivo CSV debe tener exactamente 3 columnas en este orden:
1. **CODIGO** - Código de la actividad (ej: M6920.03)
2. **DESCRIPCION** - Descripción completa de la actividad
3. **NIVEL** - Nivel numérico (1-6)

**Ejemplo de formato CSV:**
```csv
CODIGO,DESCRIPCION,NIVEL
M6920.03,Actividades de consultoría de gestión,6
A0111.01,Cultivo de cereales (excepto arroz),6
```

## Paso 2: Crear la Tabla en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo `ciiu4_actividades_setup.sql`
4. Ejecuta el script (botón "Run")

## Paso 3: Cargar el CSV

Tienes **3 opciones** para cargar los datos:

### Opción A: Usar el Editor SQL de Supabase (Recomendado)

1. En Supabase Dashboard, ve a **Table Editor**
2. Selecciona la tabla `ciiu4_actividades`
3. Haz clic en **"Insert"** → **"Import data from CSV"**
4. Selecciona tu archivo CSV
5. Verifica que las columnas coincidan y haz clic en **"Import"**

### Opción B: Usar SQL COPY (si tienes acceso directo a PostgreSQL)

```sql
COPY public.ciiu4_actividades("CODIGO", "DESCRIPCION", "NIVEL")
FROM '/ruta/a/tu/archivo.csv'
DELIMITER ','
CSV HEADER;
```

### Opción C: Usar el componente CargadorEmpresasMasivo.js (modificado)

Si prefieres cargar desde la aplicación web, puedo ayudarte a crear un componente similar al `CargadorEmpresasMasivo.js` pero para actividades CIIU4.

## Paso 4: Verificar la Carga

Ejecuta esta consulta en el SQL Editor para verificar:

```sql
SELECT COUNT(*) as total_actividades FROM public.ciiu4_actividades;
SELECT * FROM public.ciiu4_actividades LIMIT 10;
```

## Notas Importantes

- ✅ Los nombres de columnas deben coincidir exactamente: `CODIGO`, `DESCRIPCION`, `NIVEL` (en mayúsculas)
- ✅ El código debe ser único (es la clave primaria)
- ✅ Si cargas datos duplicados, usarás `UPSERT` en lugar de `INSERT`
- ✅ Asegúrate de que el CSV esté en formato UTF-8 para caracteres especiales

## Si Necesitas Ayuda

Si tienes problemas cargando el CSV o necesitas modificar el formato, avísame y te ayudo a ajustarlo.

