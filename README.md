# Servicio Medico 2.0

Sistema integral de gestión de servicios medicos desarrollado para optimizar y digitalizar los procesos de atencion medica, farmacia, laboratorio y administracion de pacientes.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.14-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## Demo

**Ambiente de Pruebas:** [https://sanjuandelrio.sytes.net:3010/login](https://sanjuandelrio.sytes.net:3010/login)

---

## Tabla de Contenidos

- [Caracteristicas](#caracteristicas)
- [Stack Tecnologico](#stack-tecnologico)
- [Prerrequisitos](#prerrequisitos)
- [Instalacion](#instalacion)
- [Variables de Entorno](#variables-de-entorno)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Modulos del Sistema](#modulos-del-sistema)
- [API Endpoints](#api-endpoints)
- [Base de Datos](#base-de-datos)
- [Despliegue](#despliegue)
- [Flujo de Git](#flujo-de-git)
- [Contribucion](#contribucion)
- [Licencia](#licencia)

---

## Caracteristicas

### Modulo de Consultas Medicas
- Registro de consultas con SOAP (Subjetivo, Objetivo, Analisis, Plan)
- Diagnosticos multiples con codificacion CIE-11
- Captura de signos vitales
- Generacion de recetas digitales con QR

### Modulo de Farmacia
- Control de inventario de medicamentos
- Sistema de surtimiento y resurtimiento
- Alertas de fondo fijo via correo electronico
- Gestion de stock minimo y maximo

### Modulo de Laboratorio
- Creacion de ordenes de estudios
- Registro de resultados
- Integracion de costos
- Generacion de reportes PDF

### Modulo de Referencias y Contrareferencias
- Derivacion de pacientes a especialidades
- Seguimiento de estatus de referencias
- Generacion de documentos oficiales

### Modulo de Incapacidades
- Generacion de constancias de incapacidad
- Validacion de periodos
- Documentos con firma digital

### Panel Administrativo
- Gestion de usuarios y permisos
- Catalogos del sistema (hospitales, especialidades, medicamentos)
- Analytics y dashboard de productividad
- Reportes y estadisticas

### Caracteristicas Tecnicas
- Autenticacion JWT con middleware de proteccion
- Notificaciones en tiempo real con Pusher
- Generacion de PDFs con codigos QR y de barras
- Firma digital de documentos
- Mapas interactivos con Leaflet
- Integracion con servicios externos via SOAP
- Monitoreo de errores con Winston

---

## Stack Tecnologico

### Frontend
| Tecnologia | Version | Descripcion |
|------------|---------|-------------|
| Next.js | 15.5.4 | Framework React con App Router |
| React | 19.1.0 | Biblioteca de interfaces |
| TypeScript | 5 | Tipado estatico |
| Tailwind CSS | 4.1.14 | Framework CSS utilitario |
| Framer Motion | 12.23.22 | Animaciones |
| Recharts | 3.6.0 | Graficas y visualizaciones |
| Lucide React | 0.545.0 | Iconos |

### Backend
| Tecnologia | Version | Descripcion |
|------------|---------|-------------|
| Next.js API Routes | 15.5.4 | API REST |
| Drizzle ORM | 0.44.7 | ORM para PostgreSQL |
| PostgreSQL | - | Base de datos principal |
| Jose/JWT | 6.1.0 | Autenticacion |
| Nodemailer | 7.0.12 | Envio de correos |
| Winston | 3.19.0 | Logging |

### Integraciones
| Tecnologia | Descripcion |
|------------|-------------|
| Pusher | Notificaciones en tiempo real |
| jsPDF | Generacion de PDFs |
| QRCode | Codigos QR |
| JSBarcode | Codigos de barras |
| Leaflet | Mapas interactivos |
| XLSX | Manejo de archivos Excel |
| AI SDK (Google) | Integracion con IA |

---

## Prerrequisitos

Antes de instalar el proyecto, asegurate de tener instalado:

- **Node.js** >= 18.x
- **npm** >= 9.x o **yarn** >= 1.22.x
- **PostgreSQL** >= 14.x
- **Git**

---

## Instalacion

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/presidenciaSJR/Servicio_Medico_2.0.git
   cd Servicio_Medico_2.0
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Editar `.env.local` con las credenciales correspondientes.

4. **Configurar base de datos**
   ```bash
   # Ejecutar scripts de migracion en /database
   npm run db:push
   ```

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

---

## Variables de Entorno

Crear un archivo `.env.local` en la raiz del proyecto con las siguientes variables:

```env
# Base de Datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost:5432/servicio_medico

# JWT
JWT_SECRET=tu_clave_secreta_jwt

# Pusher (Notificaciones en tiempo real)
PUSHER_APP_ID=tu_app_id
PUSHER_KEY=tu_key
PUSHER_SECRET=tu_secret
PUSHER_CLUSTER=tu_cluster

# Nodemailer (Correo electronico)
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=tu_usuario
SMTP_PASS=tu_password

# Servicio Web Externo (SOAP)
WS_URL=url_del_servicio
WS_USER=usuario
WS_PASS=password
```

---

## Uso

### Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la build de produccion |
| `npm run start` | Inicia el servidor de produccion |
| `npm run deploy` | Ejecuta script de despliegue |

### Acceso al Sistema

1. Navegar a la URL del sistema
2. Iniciar sesion con credenciales proporcionadas
3. El dashboard mostrara los modulos segun los permisos del usuario

---

## Estructura del Proyecto

```
Servicio_Medico_2.0/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # Endpoints de API (27 modulos)
│   │   │   ├── auth/             # Autenticacion
│   │   │   ├── consultas/        # Gestion de consultas
│   │   │   ├── recetas/          # Recetas medicas
│   │   │   ├── farmacia/         # Modulo farmacia
│   │   │   ├── laboratorio/      # Modulo laboratorio
│   │   │   ├── referencias/      # Referencias medicas
│   │   │   └── ...
│   │   ├── dashboard/            # Paginas del dashboard
│   │   ├── login/                # Pagina de autenticacion
│   │   ├── layout.tsx            # Layout raiz
│   │   └── page.tsx              # Pagina principal
│   │
│   ├── components/               # Componentes React (87+)
│   │   ├── analytics/            # Graficas y estadisticas
│   │   ├── catalogos/            # Gestion de catalogos
│   │   ├── consultas/            # Componentes de consultas
│   │   ├── farmacia/             # Componentes de farmacia
│   │   ├── laboratorio/          # Componentes de laboratorio
│   │   ├── layout/               # Sidebar, Header, etc.
│   │   └── ...
│   │
│   ├── context/                  # React Context
│   │   ├── AuthContext.tsx       # Estado de autenticacion
│   │   └── NotificationsContext.tsx
│   │
│   ├── db/
│   │   └── schema/               # Esquemas Drizzle ORM
│   │
│   ├── hooks/                    # Custom hooks (~20)
│   ├── lib/                      # Utilidades y helpers
│   │   ├── dbPostgres.ts         # Conexion a BD
│   │   └── generar-*.ts          # Generadores de PDF
│   │
│   ├── services/                 # Servicios externos
│   ├── types/                    # Definiciones TypeScript
│   └── middleware.ts             # Middleware de autenticacion
│
├── database/                     # Scripts SQL (~40 archivos)
├── public/                       # Archivos estaticos
├── docs/                         # Documentacion
├── drizzle.config.ts             # Configuracion Drizzle
├── next.config.ts                # Configuracion Next.js
├── tailwind.config.ts            # Configuracion Tailwind
├── tsconfig.json                 # Configuracion TypeScript
└── package.json
```

---

## Modulos del Sistema

### 1. Consultas Medicas
Gestion completa del ciclo de consulta medica con soporte para:
- Registro de sintomas y diagnosticos
- Formato SOAP
- Signos vitales
- Generacion automatica de recetas

### 2. Farmacia
- **Inventario:** Control de existencias con alertas
- **Surtimiento:** Despacho de medicamentos por receta
- **Resurtimiento:** Autorizacion de medicamentos continuos (hasta 6 meses)
- **Alertas Fondo Fijo:** Notificaciones por correo cuando se alcanza stock minimo

### 3. Laboratorio
- Ordenes de estudios clinicos
- Captura de resultados
- Reportes con costos integrados
- Exportacion a PDF

### 4. Referencias
- Derivacion a especialidades medicas
- Generacion de documento oficial
- Seguimiento de estatus

### 5. Contrareferencias
- Respuesta de especialistas
- Cierre de ciclo de atencion

### 6. Incapacidades
- Generacion de constancias
- Periodos configurables
- Firma digital

### 7. Analytics
- Dashboard con KPIs
- Graficas de productividad
- Reportes por periodo
- Analisis de diagnosticos frecuentes

---

## API Endpoints

### Autenticacion
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/logout` | Cerrar sesion |
| GET | `/api/auth/me` | Obtener usuario actual |

### Consultas
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/consultas` | Listar consultas |
| POST | `/api/consultas` | Crear consulta |
| GET | `/api/consultas/[id]` | Obtener consulta |
| PUT | `/api/consultas/[id]` | Actualizar consulta |

### Farmacia
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/farmacia/inventario` | Listar inventario |
| POST | `/api/farmacia/surtir` | Surtir receta |
| GET | `/api/farmacia/alertas` | Obtener alertas |

### Laboratorio
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/laboratorio/ordenes` | Listar ordenes |
| POST | `/api/laboratorio/ordenes` | Crear orden |
| PUT | `/api/laboratorio/resultados` | Registrar resultados |

> Para documentacion completa de la API, consultar `/docs/api.md`

---

## Base de Datos

### Esquema Principal

El sistema utiliza **PostgreSQL** con **Drizzle ORM**. Total: **33 tablas**.

---

#### Tablas de Catalogos (12 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `parentesco` | Catalogo de tipos de parentesco (titular, conyuge, hijo, etc.) |
| `estatus_consulta` | Estados de la consulta (en espera, finalizada, cancelada) |
| `tiposusuarios` | Tipos de usuarios del sistema (medico, enfermera, admin, etc.) |
| `especialidades` | Especialidades medicas disponibles |
| `hospitales` | Catalogo de hospitales e instituciones |
| `unidades_medida` | Unidades de medida para medicamentos |
| `cat_estudios_laboratorio` | Catalogo de estudios de laboratorio con costos |
| `cat_acciones` | Catalogo de acciones/permisos del sistema |
| `cat_etiquetas_avisos` | Etiquetas de colores para avisos |
| `enfermedades_cronicas` | Catalogo de enfermedades cronicas |
| `enfermedades_kpis` | Indicadores KPI por enfermedad |
| `reglas_generales` | Configuraciones globales (vigencias, tolerancias, alertas) |

---

#### Tablas de Usuarios y Beneficiarios (4 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `proveedores` | Usuarios del sistema (medicos, enfermeras, administradores) |
| `usuarios` | Vista/alias de proveedores para consultas |
| `usuario_acciones` | Relacion de permisos asignados por usuario |
| `beneficiarios` | Pacientes y derechohabientes registrados |

---

#### Tablas de Consultas Medicas (2 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `consulta` | Registro principal de consultas con SOAP, signos vitales y costos |
| `diagnosticos_consulta` | Diagnosticos CIE-11 por consulta (soporta multiples) |

---

#### Tablas de Farmacia (6 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `medicamentos` | Catalogo de medicamentos (nombre, sustancia activa, clasificacion, precio) |
| `inventario_medicamentos` | Control de existencias y fondo fijo por medicamento |
| `recetas` | Recetas medicas generadas (original y resurtimiento) |
| `detalle_receta` | Medicamentos prescritos con dosis, duracion e indicaciones |
| `surtimientos_receta` | Registro de cada surtimiento realizado en farmacia |
| `control_resurtimientos` | Programacion y seguimiento de resurtimientos (hasta 6 meses) |

---

#### Tablas de Laboratorio (1 tabla)

| Tabla | Descripcion |
|-------|-------------|
| `consulta_estudios` | Estudios de laboratorio solicitados por consulta |

---

#### Tablas de Referencias (2 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `referencias_especialidad` | Referencias a especialistas con flujo completo de autorizacion |
| `contrareferencias` | Respuestas de especialistas con SOAP y cierre de ciclo |

---

#### Tablas de Incapacidades (1 tabla)

| Tabla | Descripcion |
|-------|-------------|
| `incapacidades` | Incapacidades generadas con periodos y diagnostico |

---

#### Tablas de Sistema (5 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `firmas_digitales` | Firmas digitales de coordinadores en base64 |
| `alertas_fondos_correos` | Destinatarios de alertas de fondo fijo bajo |
| `avisos` | Avisos y comunicados del sistema |
| `signos_vitales` | Registro historico de signos vitales (legacy) |
| `logs` | Registro de actividad del sistema |

---

#### Enums de PostgreSQL

| Enum | Valores |
|------|---------|
| `clasificacion_medicamento` | PATENTE, GENERICO, CONTROLADO |
| `tipo_receta` | original, resurtimiento |
| `estatus_resurtimiento` | pendiente, surtido, vencido, cancelado |
| `estatus_referencia_enum` | pendiente_asignar, asignada, autorizada, notificada, atendida, cancelada |
| `estatus_contrareferencia_enum` | pendiente, vista, cerrada |

---

### Migraciones

Los scripts de base de datos se encuentran en `/database/`. Para aplicar:

```bash
# Usando Drizzle Kit
npx drizzle-kit push

# O ejecutar scripts SQL directamente
psql -U usuario -d servicio_medico -f database/script.sql
```

---

## Despliegue

### Produccion con IIS

El proyecto incluye configuracion para despliegue en IIS:

1. Generar build de produccion:
   ```bash
   npm run build
   ```

2. Configurar IIS con el archivo `web.config` incluido

3. Ejecutar script de despliegue:
   ```bash
   npm run deploy
   ```

### Variables de Produccion

Asegurar que todas las variables de entorno esten configuradas en el servidor de produccion.

---

## Flujo de Git

Este proyecto sigue un flujo de trabajo estructurado:

### Ramas Principales
- `main` - Produccion (codigo estable y liberado)
- `testing` - Anteproduccion (validaciones finales)

### Ramas de Desarrollo
- `feature/nombre` - Nuevas funcionalidades
- `fix/nombre` - Correcciones de bugs

### Ramas de Version
- `release/v#` - Versiones para liberacion

### Formato de Commits
```
[Epica X][V#.#] Descripcion clara del cambio
```

Ejemplos:
- `[Epica 1][V1.1] Modulo de cancelaciones`
- `[Epica 2][V2.1] Integracion de laboratorios con costos`

---

## Contribucion

1. Crear rama desde `testing`:
   ```bash
   git checkout testing
   git checkout -b feature/mi-funcionalidad
   ```

2. Realizar cambios y commits siguiendo el formato establecido

3. Crear Pull Request hacia `testing`

4. Esperar revision y aprobacion

5. Una vez integrada, la rama sera eliminada

### Reglas
- No hacer push directo a `main`
- Todos los cambios requieren Pull Request aprobado
- Commits pequenos y claros
- No subir codigo incompleto

---

