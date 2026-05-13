# PLAN DE LIBERACIÓN DEL SISTEMA MÉDICO
## De Sistema Municipal a Producto Comercial Independiente

**Versión:** 1.0  
**Fecha de creación:** 2026-04-30  
**Estado:** Pendiente de ejecución  
**Autor del plan:** Análisis arquitectónico completo

---

## CONTEXTO Y OBJETIVO

El sistema actualmente es un **Servicio Médico diseñado exclusivamente para el Municipio de San Juan del Río**. Su núcleo médico (consultas, referencias, farmacia, incapacidades, laboratorio) está bien construido y es sólido, pero está fuertemente atado a infraestructura externa del municipio.

**El objetivo** es convertirlo en un **producto comercial genérico y vendible** a cualquier organización (municipio, empresa privada, clínica, hospital, escuela, etc.) sin dependencia de ningún servicio externo del municipio.

**La transformación conceptual central es:**

```
MODELO ACTUAL (Municipal)
────────────────────────────────────────────────────
Web Service SOAP → trae Empleado (por nómina)
                        ↓
                  tiene Beneficiarios (familiares)
                        ↓
                  se atiende en el sistema

MODELO NUEVO (Genérico Comercial)
────────────────────────────────────────────────────
Paciente llega → se registra en el sistema → se atiende
                 (nace en el sistema, sin dependencias externas)
```

No hay padrón externo. No hay nómina. No hay Web Service. El paciente es creado en el sistema la primera vez que llega y su expediente crece con cada consulta.

---

## DIAGNÓSTICO: QUÉ ESTÁ ATADO AL MUNICIPIO

### Punto Crítico 1 — Web Service SOAP de Empleados
- **Archivo:** `src/app/api/webService/empleado/route.ts`
- **Archivo:** `src/services/webservice/empleado.service.ts`
- **Archivo:** `src/lib/obtenerDatosContacto.ts`
- El sistema llama a `http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl` para obtener datos de cualquier paciente que sea empleado
- Sin acceso a esa IP interna del municipio, **la creación de consultas falla**
- La lógica de negocio tiene hardcodeado que si `PENSIONADO` entonces no rechazar aunque tenga fecha de baja

### Punto Crítico 2 — El campo `es_empleado` divide el universo de pacientes
- **Archivo:** `src/db/schema/consulta.ts` (campo `es_empleado` boolean)
- Todo el sistema tiene dos caminos según este campo:
  - `es_empleado = true` → datos vienen del WS SOAP externo, identificado por `no_nomina`
  - `es_empleado = false` → datos vienen de tabla `beneficiarios` interna, identificado por `id_beneficiario`
- Este campo aparece en **33+ archivos** y ramifica la lógica en consultas, referencias, contrareferencias, PDFs, notificaciones, analytics

### Punto Crítico 3 — El campo `no_nomina` como identidad central
- Presente en: `consulta`, `referencias_especialidad`, `contrareferencias`
- Usado en rutas: `/beneficiarios/por-nomina/[numNomina]`
- Llamado de 3 formas distintas en el código: `no_nomina`, `numNomina`, `clavenomina`, `num_nom`
- Concepto 100% municipal

### Punto Crítico 4 — Tabla `beneficiarios` acoplada al concepto de nómina
- Un beneficiario existe **solo** ligado a un `no_nomina` de empleado
- No puede existir un paciente independiente sin ser empleado o beneficiario de empleado

### Punto Medio 5 — Campos de snapshot municipales en `consulta`
- `sindicato` (VARCHAR 10) — concepto 100% municipal
- `departamento` (VARCHAR 200) — se graba en cada consulta (snapshot)
- `id_parentesco` hardcodeado a `6` ("EMPLEADO") para empleados

### Punto Medio 6 — Base de datos en servidor del municipio
- PostgreSQL en `sanjuandelrio.sytes.net` — solo configuración, fácil de mover
- SQL Server legacy en `172.16.0.7` — parcialmente migrado, hay referencias residuales

### Punto Bajo 7 — Branding y credenciales hardcodeadas
- Nombre "Servicio Medico - Pandora" en `layout.tsx`
- Email `dinformaticasjr@gmail.com` hardcodeado
- Contraseñas con iniciales "SJR" (AdminSJR@2025)
- Credenciales de Pusher, Cloudinary, Gemini son del municipio

---

## ARQUITECTURA DEL SISTEMA NUEVO

### Nueva tabla central: `pacientes`

Reemplaza el concepto dual de (empleado via WS + beneficiario en BD) con **un solo concepto: paciente**.

```
pacientes
├── id_paciente          (BIGSERIAL, PK)
├── clave_paciente       (VARCHAR 50, UNIQUE, NULLABLE) — puede ser CURP, expediente, etc.
├── nombre               (VARCHAR 100, NOT NULL)
├── apellido_paterno     (VARCHAR 100, NOT NULL)
├── apellido_materno     (VARCHAR 100, NULLABLE)
├── fecha_nacimiento     (DATE, NOT NULL)
├── sexo                 (CHAR 1, NOT NULL) — 'M' o 'F'
├── tipo_sangre          (VARCHAR 5, NULLABLE)
├── curp                 (VARCHAR 18, NULLABLE, UNIQUE)
├── telefono             (VARCHAR 20, NULLABLE)
├── correo               (VARCHAR 150, NULLABLE)
├── alergias             (TEXT, NULLABLE)
├── observaciones_medicas(TEXT, NULLABLE) — antecedentes relevantes
├── foto_url             (VARCHAR 500, NULLABLE)
├── activo               (BOOLEAN, DEFAULT true)
├── creado_en            (TIMESTAMP)
└── actualizado_en       (TIMESTAMP)
```

### Nueva tabla de configuración: `organizacion`

Hace el sistema brandeable para cualquier cliente.

```
organizacion
├── id_organizacion      (SERIAL, PK)
├── nombre               (VARCHAR 200, NOT NULL)
├── razon_social         (VARCHAR 200, NULLABLE)
├── rfc                  (VARCHAR 13, NULLABLE)
├── logo_url             (VARCHAR 500, NULLABLE)
├── direccion            (TEXT, NULLABLE)
├── telefono             (VARCHAR 20, NULLABLE)
├── correo_contacto      (VARCHAR 150, NULLABLE)
├── color_primario       (VARCHAR 7, DEFAULT '#1e40af')
├── color_secundario     (VARCHAR 7, DEFAULT '#3b82f6')
├── slogan               (VARCHAR 300, NULLABLE)
├── activo               (BOOLEAN, DEFAULT true)
├── creado_en            (TIMESTAMP)
└── actualizado_en       (TIMESTAMP)
```

### Tabla `consulta` — Campos que cambian

```
ELIMINAR:
├── no_nomina            (VARCHAR 10) — concepto municipal
├── id_beneficiario      (BIGINT)     — concepto municipal
├── es_empleado          (BOOLEAN)    — concepto municipal
├── sindicato            (VARCHAR 10) — concepto municipal

AGREGAR:
├── id_paciente          (BIGINT, FK → pacientes.id_paciente, NOT NULL)

MANTENER CON POSIBLE AJUSTE:
├── id_parentesco        (BIGINT, FK → parentesco) — HACER NULLABLE (ya no siempre aplica)
├── departamento         (VARCHAR 200) — HACER NULLABLE (área donde trabaja el paciente, opcional)
└── [todo lo demás médico queda intacto]
```

### Tablas `referencias_especialidad` y `contrareferencias` — Campos que cambian

```
ELIMINAR:
├── no_nomina            (VARCHAR 10)
├── id_beneficiario      (BIGINT)
├── es_empleado          (BOOLEAN) — si existe

AGREGAR:
└── id_paciente          (BIGINT, FK → pacientes.id_paciente, NOT NULL)
```

---

## FASES DEL PLAN DE TRABAJO

---

## FASE 1 — BASE DE DATOS: Nueva tabla `pacientes`
**Prioridad:** CRÍTICA — Todo lo demás depende de esto  
**Estimado:** 2-3 días  

### 1.1 Crear archivo de schema Drizzle

**Archivo a crear:** `src/db/schema/pacientes.ts`

Definir la tabla con todos los campos descritos en la arquitectura de arriba usando Drizzle ORM.  
Incluir indexes en: `curp`, `clave_paciente`, `nombre + apellido_paterno`.  
Exportar la tabla y sus tipos inferidos (`InferSelectModel`, `InferInsertModel`).

### 1.2 Crear migración Drizzle

Ejecutar `drizzle-kit generate` para generar el SQL de migración.  
Verificar que el SQL generado solo crea la tabla nueva y no modifica nada existente.  
Ejecutar `drizzle-kit migrate` en base de datos de desarrollo.

### 1.3 Crear tipos TypeScript

**Archivo a crear:** `src/types/pacientes.ts`

```typescript
// Tipos que necesita el sistema nuevo
export interface Paciente { ... }
export interface CrearPacienteDTO { ... }
export interface ActualizarPacienteDTO { ... }
export interface BusquedaPacienteResult { ... }  // Para búsqueda rápida en consulta
```

---

## FASE 2 — BASE DE DATOS: Nueva tabla `organizacion`
**Prioridad:** ALTA  
**Estimado:** 1 día  

### 2.1 Crear archivo de schema Drizzle

**Archivo a crear:** `src/db/schema/organizacion.ts`

Misma estructura que la arquitectura de arriba.

### 2.2 Crear migración y aplicar

Generar y ejecutar migración.  
Insertar un registro inicial de organización genérica en la migración (`seed`):
```sql
INSERT INTO organizacion (nombre, activo) VALUES ('Mi Organización', true);
```

### 2.3 Crear tipos TypeScript

**Archivo a crear:** `src/types/organizacion.ts`

---

## FASE 3 — BASE DE DATOS: Modificar tablas existentes
**Prioridad:** CRÍTICA  
**Estimado:** 2 días  
**ATENCIÓN:** Esta fase modifica tablas con datos existentes. Requiere backup previo.

### 3.1 Migración de tabla `consulta`

**Archivo a modificar:** `src/db/schema/consulta.ts`

**Pasos de migración (en este orden exacto para no perder datos):**

```sql
-- Paso A: Agregar columna nueva (nullable para no romper datos existentes)
ALTER TABLE consulta ADD COLUMN id_paciente BIGINT REFERENCES pacientes(id_paciente);

-- Paso B: Crear registros en pacientes a partir de beneficiarios existentes
-- (para datos de beneficiarios ya en BD, migrar sus datos a la tabla pacientes)
INSERT INTO pacientes (nombre, apellido_paterno, apellido_materno, fecha_nacimiento, 
                       sexo, tipo_sangre, telefono, correo, alergias, curp)
SELECT 
    split_part(nombre, ' ', 1) as nombre,
    split_part(nombre, ' ', 2) as apellido_paterno,
    split_part(nombre, ' ', 3) as apellido_materno,
    fecha_nacimiento,
    sexo,
    tipo_sangre,
    telefono,
    correo,
    alergias,
    curp
FROM beneficiarios
WHERE activo = true
ON CONFLICT (curp) DO NOTHING;

-- Paso C: Vincular consultas de beneficiarios con sus nuevos id_paciente
UPDATE consulta c
SET id_paciente = p.id_paciente
FROM beneficiarios b
JOIN pacientes p ON p.curp = b.curp
WHERE c.id_beneficiario = b.id_beneficiario
  AND c.es_empleado = false;

-- Paso D: Para consultas de "empleados" (datos vienen del WS SOAP)
-- Se dejan con id_paciente NULL por ahora — se completan en Fase 8 (datos históricos)

-- Paso E: Hacer id_paciente NOT NULL SOLO cuando todos los registros estén migrados
-- (esto ocurre en Fase 8, no aquí)

-- Paso F: Eliminar columnas municipales
ALTER TABLE consulta DROP COLUMN es_empleado;
ALTER TABLE consulta DROP COLUMN sindicato;
-- NOTA: no_nomina e id_beneficiario se eliminan en Fase 8

-- Paso G: Hacer nullable los campos que ya no son obligatorios
ALTER TABLE consulta ALTER COLUMN id_parentesco DROP NOT NULL;
ALTER TABLE consulta ALTER COLUMN departamento DROP NOT NULL;
```

**Actualizar schema Drizzle** para reflejar estos cambios.

### 3.2 Migración de tabla `referencias_especialidad`

**Archivo a modificar:** `src/db/schema/referencias.ts`

```sql
-- Agregar id_paciente
ALTER TABLE referencias_especialidad ADD COLUMN id_paciente BIGINT REFERENCES pacientes(id_paciente);

-- Migrar datos desde beneficiarios a pacientes (igual que en consulta)
UPDATE referencias_especialidad r
SET id_paciente = p.id_paciente
FROM beneficiarios b
JOIN pacientes p ON p.curp = b.curp
WHERE r.id_beneficiario = b.id_beneficiario;

-- Eliminar columnas municipales (gradual — en Fase 8 se completa)
ALTER TABLE referencias_especialidad DROP COLUMN sindicato; -- si existe
```

### 3.3 Migración de tabla `contrareferencias`

**Archivo a modificar:** `src/db/schema/contrareferencias.ts`

Misma estrategia que referencias: agregar `id_paciente`, migrar datos, eliminar campos municipales.

### 3.4 Hacer `id_parentesco` en `parentesco` más genérico

La tabla `parentesco` actualmente tiene "EMPLEADO" como tipo de parentesco (id = 6, hardcodeado).  
Eliminar el registro "EMPLEADO" de la tabla parentesco (ya no aplica, no hay empleados).  
El catálogo queda solo con: HIJO, CÓNYUGE, PADRE, MADRE, HERMANO, etc.

---

## FASE 4 — BACKEND: Eliminar el Web Service SOAP
**Prioridad:** CRÍTICA  
**Estimado:** 1 día  

### 4.1 Eliminar archivos del WS

**Archivos a eliminar:**
- `src/app/api/webService/empleado/route.ts`
- `src/services/webservice/empleado.service.ts` (si existe)

### 4.2 Eliminar dependencia `soap`

Verificar si el paquete `soap` o `easy-soap-request` está en `package.json`.  
Si está, ejecutar `npm uninstall soap` (o el paquete equivalente).

### 4.3 Reemplazar `src/lib/obtenerDatosContacto.ts`

**Archivo a reemplazar completamente:** `src/lib/obtenerDatosContacto.ts`

La nueva versión solo consulta la tabla `pacientes`:

```typescript
// Nueva lógica: siempre va a la tabla pacientes, sin lógica dual
export async function obtenerDatosContactoPaciente(idConsulta: number) {
  const consulta = await db.select({ id_paciente: consulta.idPaciente })
                           .from(consultaTable)
                           .where(eq(consultaTable.idConsulta, idConsulta))
                           .limit(1);
  
  if (!consulta[0]?.id_paciente) return { telefono: null, correo: null };

  const paciente = await db.select({ telefono: pacientes.telefono, correo: pacientes.correo })
                           .from(pacientes)
                           .where(eq(pacientes.idPaciente, consulta[0].id_paciente))
                           .limit(1);

  return { telefono: paciente[0]?.telefono ?? null, correo: paciente[0]?.correo ?? null };
}
```

### 4.4 Eliminar ruta `/api/webService/empleado`

La carpeta completa `src/app/api/webService/` puede eliminarse.

---

## FASE 5 — BACKEND: Crear APIs de Pacientes
**Prioridad:** CRÍTICA  
**Estimado:** 3-4 días  

### 5.1 CRUD completo de pacientes

**Archivos a crear:**

#### `src/app/api/pacientes/crear/route.ts` — POST
Registra un nuevo paciente. Valida campos requeridos (nombre, apellido_paterno, fecha_nacimiento, sexo).  
Si se proporciona CURP, valida formato y unicidad.  
Si ya existe un paciente con el mismo CURP → retorna el existente con mensaje informativo.  
Responde con `id_paciente` y datos del paciente creado.

#### `src/app/api/pacientes/buscar/route.ts` — GET
Búsqueda inteligente con parámetro `q` (query).  
Busca por: nombre, apellido, CURP, clave_paciente.  
Retorna lista de coincidencias con datos básicos para selección en formulario de consulta.  
Paginación: máximo 20 resultados por búsqueda.

#### `src/app/api/pacientes/[id]/route.ts` — GET, PUT
- GET: Retorna datos completos del paciente + historial resumido
- PUT: Actualiza datos del paciente (validando unicidad de CURP si cambia)

#### `src/app/api/pacientes/[id]/historial/route.ts` — GET
Retorna todas las consultas del paciente ordenadas por fecha descendente.  
Incluye diagnósticos, recetas y referencias asociadas.

#### `src/app/api/pacientes/[id]/referencias/route.ts` — GET
Historial de referencias a especialidades del paciente.

### 5.2 Reemplazar la ruta `/api/beneficiarios/por-nomina/[numNomina]`

**Archivo a eliminar:** `src/app/api/beneficiarios/por-nomina/[numNomina]/route.ts`

Esta ruta ya no tiene sentido en el modelo nuevo.  
El formulario de consulta ya no busca "beneficiarios por nómina", sino que busca directamente en `pacientes`.

### 5.3 Evaluar módulo de Beneficiarios (catálogo)

**Archivos afectados:** `src/app/api/catalogos/beneficiarios/`

**Decisión de diseño:**
- La tabla `beneficiarios` puede **renombrarse a `dependientes`** o eliminarse
- En el nuevo modelo, un "dependiente" es simplemente otro `paciente` con una relación hacia un paciente titular
- Si se necesita la funcionalidad de "este paciente viene con cobertura de otro", crear tabla `relaciones_pacientes`:

```
relaciones_pacientes
├── id_relacion          (BIGSERIAL, PK)
├── id_paciente_titular  (BIGINT, FK → pacientes)
├── id_paciente_dep      (BIGINT, FK → pacientes)
├── id_parentesco        (BIGINT, FK → parentesco)
├── activo               (BOOLEAN)
└── creado_en            (TIMESTAMP)
```

Esta es opcional. Si el cliente del sistema no necesita cobertura familiar, simplemente no se usa.

---

## FASE 6 — BACKEND: Modificar API de Consultas
**Prioridad:** CRÍTICA  
**Estimado:** 2-3 días  

### 6.1 Refactorizar `src/app/api/consultas/crear/route.ts`

**Cambios en el request body — antes:**
```json
{
  "clavenomina": "12345",
  "clavepaciente": null,
  "elpacienteesempleado": true,
  "parentesco": 6,
  "sindicato": "STMSJR",
  "departamento": "PARQUES Y JARDINES",
  ...
}
```

**Cambios en el request body — después:**
```json
{
  "id_paciente": 42,
  "departamento": "Administración General",  // opcional, libre
  ...
  // [todos los campos médicos permanecen igual]
}
```

**Cambios en la lógica interna:**
- Eliminar: toda la lógica de `elpacienteesempleado`, `clavenomina`, `clavepaciente`
- Eliminar: hardcodeo de `id_parentesco = 6` para empleados
- Eliminar: llamada a WS SOAP para obtener parentesco
- Agregar: validar que `id_paciente` existe en tabla `pacientes`
- Agregar: obtener `nombre`, `edad` y `sexo` directamente de `pacientes`
- Simplificar: el snapshot ahora es solo nombre del paciente (ya no nómina ni tipo)
- Mantener: toda la lógica de signos vitales, SOAP, folios, Pusher notification

### 6.2 Refactorizar `/api/consultas/hoy`, `/api/consultas/atendidas`, etc.

Todas las rutas que hacen `SELECT` con `no_nomina`, `id_beneficiario` o `es_empleado` deben:
- Reemplazar JOIN/SELECT de esos campos por `id_paciente`
- Hacer JOIN con tabla `pacientes` para obtener nombre, sexo, etc.

### 6.3 Rutas de historial por nómina → historial por id_paciente

Todos los endpoints con `[clavenomina]` en la ruta:
- `src/app/api/medicamentos/historial/[clavenomina]/route.ts`
- `src/app/api/contrareferencias/historial-paciente/[nomina]/route.ts`
- `src/app/api/referencias/especialista/historial-paciente/[nomina]/route.ts`

**Acción:** Reemplazar el parámetro de ruta `[clavenomina]` o `[nomina]` por `[id_paciente]`.

---

## FASE 7 — BACKEND: Modificar APIs de Referencias y Contrareferencias
**Prioridad:** ALTA  
**Estimado:** 2 días  

### 7.1 `src/app/api/referencias/crear/route.ts`

**Cambios:**
- Eliminar: `no_nomina`, `id_beneficiario`, `es_empleado` del request y del INSERT
- Agregar: `id_paciente` en el INSERT

### 7.2 Todas las rutas bajo `/api/referencias/`

Auditar cada subruta (coordinador, hospital, especialista, admin) para:
- Quitar referencias a `no_nomina`, `es_empleado`, `id_beneficiario` en queries
- Reemplazar con JOIN a `pacientes` para obtener datos del paciente

### 7.3 `/api/contrareferencias/crear/route.ts` y subrutas

Mismo patrón: eliminar campos municipales, reemplazar con `id_paciente`.

---

## FASE 8 — BACKEND: Crear API de Organización
**Prioridad:** ALTA  
**Estimado:** 1 día  

### 8.1 `src/app/api/organizacion/route.ts` — GET, PUT

GET: Retorna la configuración actual de la organización (nombre, logo, colores, etc.).  
PUT: Actualiza la configuración (solo admin puede hacerlo).

### 8.2 Endpoint de carga de logo

`src/app/api/organizacion/logo/route.ts` — POST  
Sube el logo a Cloudinary y actualiza `logo_url` en la tabla.

---

## FASE 9 — FRONTEND: Nuevo flujo de búsqueda de pacientes
**Prioridad:** CRÍTICA  
**Estimado:** 3-4 días  

Este es el cambio más visible para el usuario final.

### 9.1 Eliminar componente `BuscarPorNomina` o refactorizarlo

**Archivo actual:** `src/components/consultas/BuscarPorNomina.tsx` (o equivalente)

Este componente actualmente:
1. Muestra un input de número de nómina
2. Llama al WS SOAP para obtener datos del empleado
3. Muestra los beneficiarios del empleado para selección
4. Pasa los datos al formulario de consulta

**Reemplazar por:** `src/components/pacientes/BuscarPaciente.tsx`

Este componente nuevo:
1. Muestra un input de búsqueda libre (nombre, CURP, o clave)
2. Llama a `GET /api/pacientes/buscar?q={texto}`
3. Muestra resultados en dropdown con foto, nombre y fecha de nacimiento
4. Opción "Registrar nuevo paciente" si no existe en el sistema
5. Al seleccionar, pasa `id_paciente` y datos básicos al formulario de consulta

### 9.2 Nuevo componente `RegistrarPacienteRapido`

**Archivo a crear:** `src/components/pacientes/RegistrarPacienteRapido.tsx`

Modal o drawer que permite dar de alta un paciente nuevo al vuelo desde el formulario de consulta.  
Campos mínimos requeridos: nombre, apellido_paterno, fecha_nacimiento, sexo.  
Campos opcionales: CURP, teléfono, correo, tipo_sangre, alergias.  
Al guardar → llama a `POST /api/pacientes/crear` → cierra modal → selecciona el paciente recién creado.

### 9.3 Refactorizar formulario de creación de consulta

**Archivo:** `src/app/dashboard/consultas/nueva/page.tsx` (o equivalente)

**Cambios en UI:**
- Eliminar: campo "Número de Nómina"
- Eliminar: sección "Beneficiarios del empleado"
- Eliminar: campo "Sindicato"
- Agregar: componente `BuscarPaciente` como primer paso
- Mantener opcional: campo "Departamento/Área" (texto libre)
- Mantener: todos los campos de signos vitales y nota SOAP

### 9.4 Refactorizar `TablaPacientesEspera` y `TablaPacientesAtendidos`

**Archivos:**  
- `src/components/consultas/diagnosticos/TablaPacientesEspera.tsx`
- `src/components/consultas/diagnosticos/TablaPacientesAtendidos.tsx`

**Cambios:**
- Eliminar: columna/badge "Emp" vs "Ben" (ya no aplica la distinción)
- Eliminar: toda lógica `es_empleado ?? elpacienteesempleado ?? false`
- Simplificar: la tabla muestra nombre, edad, sexo, motivo → directo de la consulta

### 9.5 Actualizar componentes de Referencias

**Archivos en:** `src/components/referencias/`

Auditar todos para eliminar:
- Mostrar `no_nomina` en UI
- Lógica de `es_empleado` para renderizar iconos o badges
- Texto "EMPLEADO / SINDICATO" en PDFs (ver Fase 11)

### 9.6 Crear módulo de Catálogo de Pacientes

**Archivo a crear:** `src/app/dashboard/catalogos/pacientes/page.tsx`

Tabla con listado de todos los pacientes registrados.  
Funcionalidades: ver perfil, editar datos, ver historial de consultas.  
Búsqueda y filtros por nombre, CURP, fecha de registro.

---

## FASE 10 — FRONTEND: Panel de Configuración de Organización
**Prioridad:** ALTA  
**Estimado:** 2 días  

### 10.1 Crear página de configuración

**Archivo a crear:** `src/app/dashboard/admin/organizacion/page.tsx`

Formulario con:
- Nombre de la organización
- Razón social y RFC
- Dirección y teléfono
- Correo de contacto
- Upload de logo (con preview)
- Colores primario y secundario (color pickers)
- Slogan

Solo accesible para rol Admin.

### 10.2 Consumir datos de organización en el layout

**Archivo:** `src/app/layout.tsx` o el layout del dashboard

Actualmente el título es `'Servicio Medico - Pandora'` hardcodeado.  
Reemplazar: hacer un `GET /api/organizacion` al inicio de la aplicación y usar el nombre de la organización en el `<title>` de la página, en el sidebar y en el header.

### 10.3 Agregar logo en PDFs

**Archivos:**
- `src/lib/generar-receta-pdf.ts`
- `src/lib/generar-incapacidad-pdf.ts`
- `src/lib/generar-orden-laboratorio-pdf.ts`
- `src/lib/generar-pase-especialidad-pdf.ts`

Reemplazar cualquier logo o nombre hardcodeado por los datos de la tabla `organizacion`.  
El generador de PDFs hace un fetch a `GET /api/organizacion` al inicio y usa esos datos.

---

## FASE 11 — FRONTEND y BACKEND: Limpiar textos municipales en PDFs
**Prioridad:** MEDIA  
**Estimado:** 1 día  

### 11.1 `src/lib/generar-pase-especialidad-pdf.ts`

Línea 119 actual: `draw(referencia.es_empleado ? 'EMPLEADO / SINDICATO' : 'BENEFICIARIO', ...)`

Nuevo: simplemente mostrar los datos del paciente sin categorizar por tipo.

### 11.2 Auditar todos los PDFs generados

Buscar en los 4 generadores de PDFs cualquier texto que mencione:
- "Municipio"
- "San Juan del Río"
- "Sindicato"
- "Nómina"
- "Empleado" (como tipo, no como descripción médica)

Reemplazar por equivalentes genéricos o eliminar.

---

## FASE 12 — CONFIGURACIÓN: Hacer el sistema completamente portable
**Prioridad:** ALTA  
**Estimado:** 1-2 días  

### 12.1 Crear `.env.example` completo y documentado

**Archivo a crear:** `.env.example` en la raíz

```env
# ============================================================
# CONFIGURACIÓN DE BASE DE DATOS (PostgreSQL)
# ============================================================
PGHOST=localhost                  # Host del servidor PostgreSQL
PGPORT=5432                       # Puerto (default: 5432)
PGUSER=postgres                   # Usuario de BD
PGPASSWORD=tu_password_aqui       # Contraseña de BD
PGDATABASE=servicio_medico        # Nombre de la base de datos
DB_SSL=false                      # true si el servidor requiere SSL

# ============================================================
# APLICACIÓN
# ============================================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # URL base del sistema
PORT=3000                                    # Puerto del servidor Next.js
NODE_ENV=development                         # development | production

# ============================================================
# AUTENTICACIÓN JWT
# ============================================================
JWT_SECRET=cambia_esto_por_una_cadena_aleatoria_larga_y_segura

# ============================================================
# NOTIFICACIONES EN TIEMPO REAL (Pusher)
# Crear cuenta gratuita en https://pusher.com
# ============================================================
PUSHER_APP_ID=tu_app_id
NEXT_PUBLIC_PUSHER_KEY=tu_key
PUSHER_SECRET=tu_secret
NEXT_PUBLIC_PUSHER_CLUSTER=mt1

# ============================================================
# EMAIL SMTP
# Para Gmail: activar "Contraseñas de aplicación" en Google
# ============================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion

# ============================================================
# ALMACENAMIENTO DE IMÁGENES (Cloudinary)
# Crear cuenta gratuita en https://cloudinary.com
# ============================================================
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# ============================================================
# DIAGNÓSTICOS CIE-11 (Organización Mundial de la Salud)
# Registrarse en: https://icdaccessmanagement.who.int
# ============================================================
ICD_CLIENT_ID=tu_client_id_who
ICD_CLIENT_SECRET=tu_client_secret_who

# ============================================================
# INTELIGENCIA ARTIFICIAL (Google Gemini) — OPCIONAL
# ============================================================
GOOGLE_GENERATIVE_AI_API_KEY=tu_api_key_gemini
```

### 12.2 Mover credenciales hardcodeadas del código a variables de entorno

**CIE-11 credentials en `src/app/api/cie11/token/route.ts`:**

Actualmente tiene hardcodeado:
```typescript
const CLIENT_ID = 'a0aced8b-...'
const CLIENT_SECRET = '180q4evFUYQQ/...'
```

Reemplazar por:
```typescript
const CLIENT_ID = process.env.ICD_CLIENT_ID
const CLIENT_SECRET = process.env.ICD_CLIENT_SECRET
```

**Email hardcodeado** en cualquier servicio: reemplazar por `process.env.SMTP_USER`.

### 12.3 Crear script de setup inicial

**Archivo a crear:** `scripts/setup.ts` (o `scripts/setup.js`)

Script que se ejecuta una sola vez al instalar el sistema:
1. Verifica conexión a BD
2. Ejecuta todas las migraciones pendientes
3. Crea datos iniciales (catálogos base, tipos de usuario, estatus)
4. Crea usuario administrador inicial (pide nombre, username y password)
5. Crea registro inicial en tabla `organizacion`

Agregar en `package.json`:
```json
"scripts": {
  "setup": "npx tsx scripts/setup.ts"
}
```

### 12.4 Crear `docker-compose.yml` para despliegue

**Archivo a crear:** `docker-compose.yml` en la raíz

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${PGUSER}
      POSTGRES_PASSWORD: ${PGPASSWORD}
      POSTGRES_DB: ${PGDATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    env_file: .env
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## FASE 13 — LIMPIEZA: Eliminar referencias residuales al municipio
**Prioridad:** MEDIA  
**Estimado:** 1 día  

### 13.1 Eliminar toda referencia a SQL Server legacy

Buscar en todo el código referencias a:
- `172.16.0.7` (IP interna del municipio)
- `mssql` o `tedious` (drivers SQL Server)
- `PRESIDENCIA` o `PRUEBAS` (bases de datos SQL Server del municipio)
- `smedico` (usuario SQL Server del municipio)

Eliminar archivos de configuración y servicios de SQL Server legacy.  
Desinstalar paquetes Node.js relacionados si existen.

### 13.2 Actualizar `src/app/layout.tsx`

Reemplazar:
```typescript
title: 'Servicio Medico - Pandora'
```
Por: dato dinámico de la tabla `organizacion`.

### 13.3 Limpiar tipos TypeScript

**Archivos a auditar:**
- `src/types/consultas.ts` — eliminar campos `no_nomina`, `es_empleado`, `id_beneficiario`, `sindicato`
- `src/types/referencias.ts` — eliminar mismos campos
- Cualquier otro tipo con esos campos

### 13.4 Actualizar analytics

**Archivos en:** `src/app/api/analytics/`

Las queries de analytics que agrupan por `sindicato` o filtran por `es_empleado` deben actualizarse.  
Ejemplo: analytics por `departamento` puede mantenerse si `departamento` sigue siendo campo opcional en consulta.

---

## FASE 14 — DATOS HISTÓRICOS: Estrategia de migración para clientes existentes
**Prioridad:** ALTA (para el Municipio actual que quiera migrar)  
**Estimado:** 2-3 días  

Esta fase es opcional y se ejecuta solo si hay un cliente existente con datos que migrar.

### 14.1 Script para migrar empleados históricos del WS SOAP

Para las consultas históricas de "empleados" que quedaron sin `id_paciente`:
1. Leer todos los `no_nomina` únicos de consultas sin `id_paciente`
2. Por cada uno, crear un registro en `pacientes` con los datos disponibles en el snapshot de `consulta` (nombre, departamento)
3. Vincular el `id_paciente` creado con todas las consultas de ese `no_nomina`
4. Repetir para referencias y contrareferencias

### 14.2 Script para migrar beneficiarios históricos

Los beneficiarios ya fueron migrados en Fase 3.  
Verificar que todas las consultas de beneficiarios tengan `id_paciente` asignado.  
Una vez verificado, ejecutar:
```sql
ALTER TABLE consulta DROP COLUMN no_nomina;
ALTER TABLE consulta DROP COLUMN id_beneficiario;
-- Repetir para referencias y contrareferencias
```

### 14.3 Archivar tabla `beneficiarios`

Una vez migrados todos los datos:
```sql
-- Renombrar para backup
ALTER TABLE beneficiarios RENAME TO beneficiarios_legado;
-- No eliminar todavía — mantener 3 meses como respaldo
```

---

## FASE 15 — TESTING Y VALIDACIÓN
**Prioridad:** CRÍTICA  
**Estimado:** 3-4 días  

### 15.1 Pruebas de flujo completo

Ejecutar el flujo médico completo de inicio a fin en ambiente de desarrollo:

**Flujo 1 — Paciente nuevo:**
1. Médico inicia formulario de nueva consulta
2. Busca paciente → no existe
3. Registra paciente nuevo (nombre, fecha_nacimiento, sexo)
4. Llena signos vitales
5. Llena nota SOAP
6. Asigna diagnóstico CIE-11
7. Genera receta
8. Finaliza consulta
9. Verifica que el paciente aparece en historial

**Flujo 2 — Paciente existente:**
1. Médico busca paciente por nombre o CURP
2. Selecciona de la lista
3. Sistema pre-llena nombre y datos básicos
4. Continúa con consulta normalmente

**Flujo 3 — Referencia completa:**
1. Crear consulta → crear referencia
2. Coordinador autoriza
3. Hospital asigna
4. Admin notifica
5. Especialista atiende y contrarrefiere
6. Médico base ve contrareferencia

**Flujo 4 — Farmacia:**
1. Ver receta activa del paciente
2. Surtir medicamento
3. Verificar que el inventario se actualiza

### 15.2 Verificar PDFs generados

Generar cada tipo de PDF y verificar:
- No contiene texto del municipio
- Usa datos de la organización configurada (nombre, logo)
- Datos del paciente son correctos

### 15.3 Verificar analytics

Comprobar que los dashboards de estadísticas funcionan sin errores después de eliminar campos municipales.

---

## CHECKLIST DE COMPLETITUD

### Base de Datos
- [ ] Tabla `pacientes` creada y migrada
- [ ] Tabla `organizacion` creada
- [ ] Campo `id_paciente` en `consulta`, `referencias`, `contrareferencias`
- [ ] Campos `no_nomina`, `id_beneficiario`, `es_empleado`, `sindicato` eliminados de todas las tablas
- [ ] `id_parentesco` en consulta es NULLABLE
- [ ] Datos históricos migrados (si aplica)
- [ ] SQL Server legacy sin referencias en código

### Backend (APIs)
- [ ] `/api/webService/empleado` eliminado
- [ ] `/api/beneficiarios/por-nomina/[numNomina]` eliminado o reemplazado
- [ ] `obtenerDatosContacto.ts` reemplazado (sin lógica dual)
- [ ] CRUD completo de pacientes creado
- [ ] `/api/consultas/crear` actualizado (sin nómina, sin empleado/beneficiario)
- [ ] Todas las rutas de consultas actualizadas
- [ ] Todas las rutas de referencias actualizadas
- [ ] Todas las rutas de contrareferencias actualizadas
- [ ] Rutas con `[clavenomina]` reemplazadas por `[id_paciente]`
- [ ] `/api/organizacion` creado (GET, PUT)
- [ ] Credenciales CIE-11 movidas a variables de entorno
- [ ] Paquete `soap` desinstalado

### Frontend
- [ ] Componente `BuscarPaciente` creado (reemplaza `BuscarPorNomina`)
- [ ] Componente `RegistrarPacienteRapido` creado
- [ ] Formulario de consulta actualizado (sin campos de nómina/sindicato)
- [ ] `TablaPacientesEspera` y `TablaPacientesAtendidos` actualizados
- [ ] Componentes de referencias sin lógica `es_empleado`
- [ ] Módulo de catálogo de pacientes creado
- [ ] Panel de configuración de organización creado
- [ ] Layout usa nombre de organización dinámico

### PDFs
- [ ] Generador de recetas usa datos de organización
- [ ] Generador de incapacidades usa datos de organización
- [ ] Generador de órdenes de laboratorio usa datos de organización
- [ ] Generador de pases de especialidad usa datos de organización
- [ ] Ningún PDF menciona municipio, sindicato, nómina

### Configuración
- [ ] `.env.example` creado y documentado
- [ ] Todas las credenciales están en variables de entorno (no hardcodeadas)
- [ ] Script de setup inicial creado
- [ ] `docker-compose.yml` creado
- [ ] Nombre "Servicio Medico - Pandora" / "SJR" eliminado del código

---

## ESTIMADO DE TIEMPO TOTAL

| Fase | Descripción | Días estimados |
|------|-------------|----------------|
| 1 | Tabla `pacientes` | 2-3 |
| 2 | Tabla `organizacion` | 1 |
| 3 | Modificar tablas existentes (migración) | 2 |
| 4 | Eliminar WS SOAP | 1 |
| 5 | APIs de Pacientes | 3-4 |
| 6 | Modificar API de Consultas | 2-3 |
| 7 | Modificar APIs Referencias/Contrareferencias | 2 |
| 8 | API de Organización | 1 |
| 9 | Frontend - Búsqueda de pacientes | 3-4 |
| 10 | Frontend - Panel de organización | 2 |
| 11 | Limpiar textos en PDFs | 1 |
| 12 | Configuración portable | 1-2 |
| 13 | Limpieza residual | 1 |
| 14 | Datos históricos (opcional) | 2-3 |
| 15 | Testing y validación | 3-4 |
| **TOTAL** | | **27-36 días hábiles** |

---

## ORDEN DE EJECUCIÓN RECOMENDADO

El orden importa. Seguir este orden evita romper el sistema durante el desarrollo:

```
1. Fase 1 (Tabla pacientes)     ← No rompe nada, solo agrega
2. Fase 2 (Tabla organización)  ← No rompe nada, solo agrega
3. Fase 12 (env y config)       ← Preparar antes de trabajar
4. Fase 3 (Migrar BD)           ← Agregar id_paciente, NO eliminar aún campos viejos
5. Fase 5 (APIs Pacientes)      ← Crear lo nuevo sin borrar lo viejo
6. Fase 4 (Eliminar WS SOAP)    ← Ya podemos eliminar porque tenemos alternativa
7. Fase 6 (API Consultas)       ← Migrar la creación de consultas
8. Fase 9 (Frontend búsqueda)   ← UI nueva de búsqueda de pacientes
9. Fase 7 (APIs Referencias)    ← Migrar referencias
10. Fase 8 (API Organización)   ← Habilitar configuración
11. Fase 10 (Panel organización)← UI de configuración
12. Fase 11 (PDFs)              ← Limpiar PDFs
13. Fase 13 (Limpieza residual) ← Eliminar definitivamente campos viejos de BD
14. Fase 14 (Datos históricos)  ← Opcional, solo si hay cliente con datos
15. Fase 15 (Testing)           ← Validación final
```

---

## NOTAS FINALES

1. **El flujo médico no cambia.** Consultas, referencias, contrareferencias, farmacia, incapacidades, laboratorio — todo permanece igual. Solo cambia de dónde vienen los pacientes y cómo se identifican.

2. **La migración es incremental.** En ningún punto el sistema queda inoperante. Primero se agrega lo nuevo, se valida, y al final se elimina lo viejo.

3. **El backup es obligatorio** antes de iniciar la Fase 3 (modificación de tablas existentes).

4. **Las credenciales de APIs externas** (Pusher, Cloudinary, CIE-11, Google Gemini) son independientes — el cliente del sistema crea sus propias cuentas y pone sus propias llaves en el `.env`.

5. **El sistema resultante** puede instalarse en cualquier servidor con Node.js + PostgreSQL, sin dependencia de ninguna red o servicio externo específico.
