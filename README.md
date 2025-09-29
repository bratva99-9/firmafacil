# Sistema de Firmas Electrónicas

Una aplicación web moderna para solicitar firmas electrónicas de forma segura y eficiente.

## 🚀 Características

- **Formulario completo**: Captura todos los datos necesarios para la solicitud
- **Subida de archivos**: Interfaz drag-and-drop para documentos
- **Validaciones**: Validación completa de formularios y archivos
- **Diseño responsivo**: Funciona perfectamente en móviles y desktop
- **Integración con Supabase**: Base de datos y almacenamiento seguros

## 📋 Requisitos

- Node.js 16 o superior
- Cuenta de Supabase configurada
- Navegador web moderno

## ⚙️ Instalación

1. **Clona el repositorio**
```bash
git clone <tu-repositorio>
cd app-firma-electronica
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
# Crea un archivo .env en la raíz del proyecto
REACT_APP_SUPABASE_URL=tu_supabase_url_aqui
REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

4. **Actualiza la configuración de Supabase**
Edita `src/lib/supabase.js` y reemplaza las variables con tus datos reales:
```javascript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
```

5. **Inicia la aplicación**
```bash
npm start
```

## 🗄️ Estructura de la Base de Datos

### Tabla: `solicitudes`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | bigint PK | Identificador único |
| numero_cedula | varchar(10) | Cédula del usuario |
| provincia | text | Provincia |
| ciudad | text | Ciudad |
| parroquia | text | Parroquia |
| direccion | text | Dirección física |
| codigo_huella | text | Código de huella |
| celular | varchar(10) | Teléfono celular |
| correo | text | Email del usuario |
| tipo_banco | text | Banco del usuario |
| tipo_firma | text | Tipo de firma (natural/juridica) |
| duracion_firma | text | Duración de la firma |
| estado_tramite | text | Estado del trámite (default: pendiente) |
| foto_cedula_frontal | text | Ruta en Storage |
| foto_cedula_atras | text | Ruta en Storage |
| foto_selfie | text | Ruta en Storage |
| comprobante_pago | text | Ruta en Storage |
| created_at | timestamp | Fecha de creación |

### Storage: `documentos`

Bucket privado para almacenar los archivos organizados por cédula:
```
documentos/
├── 0123456789/
│   ├── cedula_frontal.jpg
│   ├── cedula_atras.jpg
│   ├── selfie.jpg
│   └── comprobante_pago.pdf
```

## 📱 Funcionalidades

### Formulario de Solicitud
- **Datos personales**: Cédula, dirección, contacto
- **Información bancaria**: Selección de banco
- **Tipo de firma**: Natural o jurídica
- **Duración**: 1, 2 o 3 años

### Subida de Documentos
- **Cédula frontal y trasera**: Fotos claras de la cédula
- **Selfie con cédula**: Para verificación de identidad
- **Comprobante de pago**: PDF o imagen del pago

### Validaciones
- Formato de cédula (10 dígitos)
- Formato de celular (10 dígitos)
- Email válido
- Campos obligatorios
- Tamaño de archivos (máx. 5MB)
- Tipos de archivo permitidos

## 🎨 Componentes

- `App.js`: Componente principal
- `FormularioSolicitud.js`: Formulario completo con validaciones
- `FileUpload.js`: Componente de subida de archivos con drag-and-drop

## 🔧 Scripts Disponibles

```bash
npm start      # Inicia el servidor de desarrollo
npm build      # Construye la app para producción
npm test       # Ejecuta los tests
```

## 🚀 Despliegue

Para desplegar en producción:

1. **Construye la aplicación**
```bash
npm run build
```

2. **Sube los archivos** a tu servidor web o plataforma de hosting

3. **Configura las variables de entorno** en tu plataforma de hosting

## 🔐 Seguridad

- Los archivos se almacenan en un bucket privado de Supabase
- Acceso controlado mediante signed URLs
- Validación de tipos y tamaños de archivo
- Sanitización de datos de entrada

## 📞 Soporte

Si tienes problemas o preguntas, contacta al equipo de desarrollo.

---

**Versión**: 0.1.0  
**Tecnologías**: React, Supabase, CSS3

