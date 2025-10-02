# 📋 Implementación de Base de Datos para Solicitudes de RUC con Antigüedad

## 🗄️ Archivos Creados

### 1. **SQL para Supabase** (`supabase_solicitudesantiguedad.sql`)
- Script completo para crear la tabla `solicitudesantiguedad`
- Índices optimizados para consultas rápidas
- Triggers automáticos para `fecha_actualizacion`
- Políticas RLS (Row Level Security) para seguridad
- Comentarios documentando cada campo

### 2. **Funciones JavaScript** (`src/lib/solicitudesAntiguedad.js`)
- Funciones completas para CRUD de solicitudes de antigüedad
- Funciones de consulta por diferentes criterios
- Estadísticas y reportes
- Manejo de estados de trámite

### 3. **Actualización de Supabase** (`src/lib/supabase.js`)
- Nuevas funciones integradas al archivo principal
- Compatibilidad con el sistema existente
- Funciones de estadísticas y reportes

## 🚀 Pasos para Implementar

### **Paso 1: Crear la Tabla en Supabase**
1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `supabase_solicitudesantiguedad.sql`
4. Ejecuta el script

### **Paso 2: Verificar la Tabla**
```sql
-- Verificar que la tabla se creó correctamente
SELECT * FROM solicitudesantiguedad LIMIT 1;

-- Verificar índices
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'solicitudesantiguedad';
```

### **Paso 3: Probar las Funciones**
```javascript
// En la consola del navegador o en tu código
import { insertSolicitudAntiguedad, getSolicitudesAntiguedadByCedula } from './src/lib/supabase';

// Probar inserción
const solicitud = await insertSolicitudAntiguedad({
  numero_cedula: '1234567890',
  provincia: 'PICHINCHA',
  ciudad: 'QUITO',
  // ... otros campos
});

// Probar consulta
const solicitudes = await getSolicitudesAntiguedadByCedula('1234567890');
```

## 📊 Estructura de la Tabla

### **Campos Principales**
- `id` - UUID (Primary Key)
- `numero_cedula` - VARCHAR(10)
- `estado_tramite` - VARCHAR(20) (pendiente, procesando, completado, rechazado)
- `fecha_creacion` - TIMESTAMP
- `fecha_actualizacion` - TIMESTAMP

### **Datos Personales**
- `provincia`, `ciudad`, `parroquia`, `direccion`
- `codigo_huella`, `celular`, `correo`

### **Datos Comerciales**
- `actividad_economica`, `codigo_cuen`
- `direccion_completa`, `lugar_referencia`
- `nombre_comercial`, `actividad_sri`

### **Datos del Trámite**
- `antiguedad_solicitada` - Tipo de antigüedad
- `tipo_banco` - Banco para pago

### **Archivos**
- `foto_cedula_frontal`, `foto_cedula_atras`
- `foto_selfie`, `comprobante_pago`

### **Precios** 💰
- `precio_total` - Precio total del trámite
- `precio_antiguedad` - Precio por antigüedad
- `precio_complementos` - Precio por servicios adicionales

### **Control**
- `correo_distribuidor` - Email del distribuidor
- `observaciones`, `notas_cliente`
- `fecha_procesamiento`, `fecha_completado`

## 🔧 Funciones Disponibles

### **CRUD Básico**
- `insertSolicitudAntiguedad(data)` - Crear solicitud
- `updateSolicitudAntiguedad(id, updates)` - Actualizar solicitud
- `getSolicitudAntiguedad(id)` - Obtener por ID

### **Consultas**
- `getSolicitudesAntiguedadByCedula(cedula)` - Por cédula
- `getSolicitudesAntiguedadByDistribuidor(email)` - Por distribuidor
- `getSolicitudesAntiguedadByEstado(estado)` - Por estado

### **Estadísticas**
- `getEstadisticasSolicitudesAntiguedad()` - Estadísticas completas
- `actualizarEstadoSolicitudAntiguedad(id, estado, obs)` - Cambiar estado

## 🔒 Seguridad

### **Políticas RLS**
- Los usuarios solo pueden ver sus propias solicitudes
- Los distribuidores pueden ver las solicitudes asignadas
- Validación automática de permisos

### **Validaciones**
- Estados válidos: pendiente, procesando, completado, rechazado
- Campos requeridos validados en la aplicación
- Triggers automáticos para fechas

## 📈 Índices Optimizados

```sql
-- Índices para consultas rápidas
CREATE INDEX idx_solicitudesantiguedad_cedula ON solicitudesantiguedad(numero_cedula);
CREATE INDEX idx_solicitudesantiguedad_estado ON solicitudesantiguedad(estado_tramite);
CREATE INDEX idx_solicitudesantiguedad_fecha_creacion ON solicitudesantiguedad(fecha_creacion);
CREATE INDEX idx_solicitudesantiguedad_distribuidor ON solicitudesantiguedad(correo_distribuidor);
```

## 🎯 Uso en FormularioRUC.js

El formulario ya está actualizado para usar las nuevas funciones:

```javascript
// Crear solicitud con precios
const solicitud = await insertSolicitudAntiguedad({
  // ... datos del formulario
  precio_total: obtenerPrecioTotal(),
  precio_antiguedad: obtenerPrecioRUC(),
  precio_complementos: obtenerPrecioComplementos()
});

// Actualizar con archivos
await updateSolicitudAntiguedad(solicitud.id, {
  foto_cedula_frontal: cedulaFrontal.path,
  foto_cedula_atras: cedulaAtras.path,
  foto_selfie: selfie.path,
  comprobante_pago: comprobante.path
});
```

## ✅ Verificación Final

1. **Tabla creada** ✅
2. **Índices funcionando** ✅
3. **Políticas RLS activas** ✅
4. **Funciones JavaScript importadas** ✅
5. **FormularioRUC actualizado** ✅

¡La implementación está lista para usar! 🚀
