# APPQR - Generador y Lector de Códigos QR

Aplicación web para generar y leer códigos QR de estudiantes, desarrollada con Flask, Python y MySQL.

## Características

- ✅ Generación de códigos QR para estudiantes
- ✅ Lectura de códigos QR con cámara
- ✅ Gestión de estudiantes (registro, listado, edición, eliminación)
- ✅ Base de datos MySQL con XAMPP
- ✅ Historial de operaciones QR
- ✅ Interfaz moderna y responsive
- ✅ API REST completa

## Requisitos Previos

### 1. XAMPP
- Descargar e instalar [XAMPP](https://www.apachefriends.org/)
- Iniciar Apache y MySQL desde el panel de control de XAMPP

### 2. Python
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

## Instalación

### 1. Crear entorno virtual

```bash
python -m venv venv
```

### 2. Activar entorno virtual

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar base de datos

1. **Abrir phpMyAdmin:**
   - Ir a `http://localhost/phpmyadmin`
   - Usuario: `root`
   - Contraseña: (dejar vacío por defecto)

2. **Crear base de datos:**
   - Crear nueva base de datos llamada `appqr_db`
   - O modificar el archivo `config.py` para usar otra base de datos

3. **Configurar variables de entorno (opcional):**
   - Crear archivo `.env` en la raíz del proyecto:
   ```env
   SECRET_KEY=tu_clave_secreta_muy_segura_aqui
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DB=appqr_db
   MYSQL_PORT=3306
   DEBUG=True
   ```

## Ejecución

```bash
python run.py
```

La aplicación estará disponible en: `http://localhost:5000`

## Estructura del Proyecto

```
APPQR/
├── APPQR/                    # Módulo principal de Flask
│   ├── __init__.py          # Configuración de la app
│   ├── database.py          # Conexión y operaciones de BD
│   ├── main/                # Blueprint para rutas principales
│   ├── auth/                # Blueprint para autenticación y API
│   ├── static/              # Archivos estáticos (CSS, JS)
│   └── templates/           # Plantillas HTML
├── config.py                # Configuración de Flask
├── run.py                   # Punto de entrada
├── requirements.txt         # Dependencias
└── README.md               # Este archivo
```

## Rutas Disponibles

### Páginas Web
- `/` - Página principal
- `/auth/login` - Página de login

### API REST
- `GET /auth/api/students` - Obtener todos los estudiantes
- `POST /auth/api/students` - Crear nuevo estudiante
- `GET /auth/api/students/<id>` - Obtener estudiante específico
- `PUT /auth/api/students/<id>` - Actualizar estudiante
- `DELETE /auth/api/students/<id>` - Eliminar estudiante
- `GET /auth/api/qr-history` - Obtener historial de QR
- `POST /auth/api/qr-history` - Agregar entrada al historial

## Base de Datos

### Tablas Creadas Automáticamente

**students:**
- `id` (VARCHAR) - ID único del estudiante
- `name` (VARCHAR) - Nombre completo
- `email` (VARCHAR) - Email (opcional)
- `course` (VARCHAR) - Curso/Grado
- `section` (VARCHAR) - Sección
- `phone` (VARCHAR) - Teléfono (opcional)
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**qr_history:**
- `id` (INT) - ID autoincremental
- `student_id` (VARCHAR) - ID del estudiante (FK)
- `action_type` (ENUM) - 'generated' o 'scanned'
- `qr_content` (TEXT) - Contenido del QR
- `timestamp` (TIMESTAMP) - Fecha y hora

## Tecnologías Utilizadas

- **Backend:** Flask (Python)
- **Base de Datos:** MySQL (XAMPP)
- **Frontend:** HTML5, CSS3, JavaScript
- **QR:** qrcode.js, jsQR
- **UI:** Font Awesome, Google Fonts
- **Validación:** WTForms, Flask-WTF

## Desarrollo

Para desarrollo, la aplicación se ejecuta en modo debug por defecto. Los cambios en archivos Python se recargan automáticamente.

### Logs
La aplicación registra logs de:
- Conexión a base de datos
- Operaciones CRUD de estudiantes
- Historial de QR
- Errores de la aplicación

### Troubleshooting

**Error de conexión a MySQL:**
1. Verificar que XAMPP esté ejecutándose
2. Verificar que MySQL esté iniciado
3. Verificar credenciales en `config.py`
4. Verificar que la base de datos `appqr_db` exista

**Error de dependencias:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
``` 