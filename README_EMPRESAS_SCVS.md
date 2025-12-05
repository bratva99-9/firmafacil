# 📊 Sistema de Gestión de Empresas SCVS

Sistema para cargar y consultar información de empresas de la Superintendencia de Compañías, Valores y Seguros de Ecuador.

## 🗄️ Configuración de la Base de Datos

### Paso 1: Crear la Tabla en Supabase

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `supabase_empresas_scvs.sql`
4. Ejecuta el script

### Paso 2: Verificar la Tabla

```sql
-- Verificar que la tabla se creó correctamente
SELECT COUNT(*) FROM empresas_scvs;

-- Ver estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'empresas_scvs';
```

## 📥 Carga Masiva de Datos

### Cómo Cargar el Archivo XLSX/ODS

1. **Descarga el archivo de Datos Abiertos SCVS**
   - Ve a: https://datosabiertos.gob.ec/dataset/directorio-de-companias
   - Descarga el archivo XLSX o ODS (máximo 50MB)

2. **Carga el archivo en la aplicación**
   - En la sección "Carga Masiva de Empresas SCVS"
   - Arrastra el archivo o haz clic para seleccionarlo
   - El sistema procesará el archivo y cargará los datos a la base de datos

3. **Monitoreo del Progreso**
   - Verás una barra de progreso durante la carga
   - Los datos se procesan en lotes de 1000 empresas
   - Al finalizar verás un resumen con:
     - Total de empresas procesadas
     - Empresas insertadas/actualizadas
     - Errores (si los hay)

## 🔍 Búsqueda de Empresas

### Búsqueda por RUC

1. Ingresa el RUC (13 dígitos) en el campo "Buscar por RUC"
2. Presiona Enter o haz clic en "Buscar"
3. Si se encuentra la empresa, los datos se cargarán automáticamente en el formulario

### Búsqueda por Expediente

1. Ingresa el número de expediente en el campo "Buscar por Expediente"
2. Presiona Enter o haz clic en "Buscar"
3. Los datos se cargarán automáticamente

## 📋 Campos Mapeados

El sistema mapea automáticamente las siguientes columnas del Excel a la base de datos:

| Columna Excel | Campo Base de Datos |
|--------------|---------------------|
| No. FILA | numero_fila |
| EXPEDIENTE | expediente |
| RUC | ruc |
| NOMBRE | nombre |
| SITUACIÓN LEGAL | situacion_legal |
| FECHA CONSTITUCIÓN | fecha_constitucion |
| TIPO DE COMPAÑÍA | tipo_compania |
| PAÍS | pais |
| REGIÓN | region |
| PROVINCIA | provincia |
| CANTÓN | canton |
| CIUDAD | ciudad |
| CALLE | calle |
| NÚMERO | numero |
| INTERSECCIÓN | interseccion |
| BARRIO | barrio |
| TELÉFONO | telefono |
| REPRESENTANTE | representante |
| CARGO | cargo |
| CAPITAL SUSCRITO | capital_suscrito |
| CIIU NIVEL 1 | ciiu_nivel_1 |
| CIIU NIVEL 6 | ciiu_nivel_6 |
| ÚLTIMO AÑO BALANCE | ultimo_ano_balance |
| PRESENTÓ BALANCE INICIAL | presento_balance_inicial |
| FECHA PRESENTACIÓN BALANCE INICIAL | fecha_presentacion_balance_inicial |

## 🔧 Funciones Disponibles

### En `src/lib/supabase.js`:

- `buscarEmpresaPorRUC(ruc)` - Buscar empresa por RUC
- `buscarEmpresaPorExpediente(expediente)` - Buscar empresa por expediente
- `buscarEmpresasPorNombre(nombre, limite)` - Búsqueda por nombre (parcial)
- `upsertEmpresa(empresaData)` - Insertar o actualizar una empresa
- `insertarEmpresasMasivo(empresas, onProgress)` - Carga masiva con progreso

## 📊 Índices Optimizados

La tabla incluye índices para búsquedas rápidas:
- Índice único en RUC
- Índice en expediente
- Índice de texto completo en nombre (búsqueda en español)
- Índices en provincia y ciudad
- Índice compuesto RUC + Nombre

## 🔐 Seguridad

- La tabla tiene RLS (Row Level Security) habilitado
- Solo usuarios autenticados pueden leer, insertar y actualizar
- Los datos se almacenan de forma segura en Supabase

## 🚀 Uso

Una vez cargado el archivo masivo, puedes:

1. **Buscar empresas** por RUC o expediente
2. **Cargar datos automáticamente** en el formulario de informes
3. **Generar informes** con información completa de la empresa

## 📝 Notas

- El archivo se procesa en lotes para evitar problemas de memoria
- Los RUCs se normalizan automáticamente (solo números, 13 dígitos)
- Si una empresa ya existe (mismo RUC), se actualiza con los nuevos datos
- Las fechas se convierten automáticamente al formato correcto

