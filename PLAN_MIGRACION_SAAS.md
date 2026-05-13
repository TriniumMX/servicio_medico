# Plan de Migración: Pandora → Trinium Médico SaaS v1

> **Objetivo:** Transformar el sistema médico mono-empresa (Pandora) en una plataforma SaaS multi-tenant comercializable.
> **Stack destino:** Next.js 15 · Supabase PostgreSQL · Drizzle ORM · Vercel · Resend · Vercel KV
> **Arquitectura destino:** Clean Architecture dentro de Next.js (Controller → Service → Repository → DB)
> **Principio central:** `tenant_id` obligatorio en todas las tablas. RLS en Supabase como segunda capa.
> **Plazo estimado:** ~36 días hábiles (Linear: 12 May → 4 Jul 2026)

---

## Estado actual del código (Pandora)

| Área | Implementado | Observaciones |
|------|-------------|---------------|
| Auth JWT propio | ✅ | JWT lleva `{id, usuario, tipoUsuario}`. Sin tenant. |
| Módulo Pacientes | ⚠️ Parcial | Identificados por `clavenomina + id_beneficiario`. Concepto de nómina corporativa. |
| Consultas Médicas | ✅ Completo | Drizzle schema completo. Usa Pusher. Sin `tenant_id`. |
| Recetas y Resurtimiento | ✅ Completo | Lógica robusta de 6 resurtimientos. Sin tenant. |
| Farmacia e Inventario | ✅ Completo | Fondo fijo, alertas, EAN scanner. Sin tenant. |
| Referencias Médicas | ✅ Completo | Flujo de 5 etapas muy elaborado. Sin tenant. |
| Contrareferencias | ✅ Completo | Flujo cascada. Sin tenant. |
| Laboratorio | ✅ Completo | Órdenes y entrega de resultados. Sin tenant. |
| Incapacidades | ✅ Completo | Autorización y entrega. Sin tenant. |
| Analytics / KPIs | ✅ Completo | 14 endpoints. Sin tenant ni caché. |
| PDFs | ✅ Completo | jsPDF + QR + barcode. Sin branding por tenant. |
| Email | ⚠️ Parcial | Nodemailer (SMTP). Sin templates de branding. |
| Certificados Médicos | ❌ No existe | Módulo completamente nuevo. |
| Portal del Paciente | ❌ No existe | Módulo completamente nuevo. |
| Super Admin Panel | ❌ No existe | Panel `/trinium-admin`. Nuevo. |
| Multi-tenancy | ❌ No existe | Cero `tenant_id` en toda la DB. |
| Rate Limiting | ❌ No existe | Login sin protección de intentos. |
| Security Headers | ❌ No existe | Sin CSP, HSTS, X-Frame-Options. |
| Supabase Realtime | ❌ No existe | Usa Pusher (debe reemplazarse). |
| Vercel KV Cache | ❌ No existe | Sin caché de KPIs. |

---

## Mapa de cambios: Pandora vs SaaS

### El problema raíz: identidad del paciente

```
PANDORA (actual)                    SAAS (destino)
────────────────────────────────    ─────────────────────────────────
clavenomina    → número de nómina   id_paciente → UUID por tenant
id_beneficiario → dependiente       nombre, apellidos, CURP, contacto
sindicato      → afiliación         (eliminado - concepto corporativo)
es_empleado    → bool               (eliminado - concepto corporativo)
parentesco     → tipo de beneficio  (eliminado - concepto corporativo)
id_hospital    → hospital del user  tenant_id → organización del user
id_tipousuario → rol numérico       role → string enum SaaS
```

Este cambio impacta **50+ rutas API** y **todos los schemas Drizzle**.

### Tablas que necesitan `tenant_id`

Actualmente estas tablas NO tienen `tenant_id`. Todas deben recibirlo:

| Tabla Drizzle | Archivo Schema | Impacto |
|---|---|---|
| `consulta` | `schema/consulta.ts` | Alta - tabla central |
| `recetas` | `schema/recetas.ts` | Alta |
| `detalle_receta` | `schema/recetas.ts` | Media (hereda de receta) |
| `surtimientos_receta` | `schema/recetas.ts` | Media |
| `control_resurtimientos` | `schema/recetas.ts` | Media |
| `medicamentos` | `schema/farmacia.ts` | Alta - catálogo global vs por tenant |
| `inventario_medicamentos` | `schema/farmacia.ts` | Alta |
| `referencias_especialidad` | `schema/referencias.ts` | Alta |
| `contrareferencias` | `schema/contrareferencias.ts` | Alta |
| `diagnosticos_consulta` | `schema/diagnosticos_consulta.ts` | Media |
| `firmas_digitales` | `schema/firmas.ts` | Media |
| `alertas_fondos_correos` | `schema/alertas_fondos.ts` | Media |
| `reglas_generales` | `schema/reglas_generales.ts` | Alta - debe ser por tenant |
| `usuarios` | Solo en SQL (no en Drizzle aún) | Muy alta - tabla de auth |
| `cat_acciones` / `usuario_acciones` | Solo en SQL | Alta - permisos por tenant |
| `hospitales` | Solo en SQL | Media - en SaaS son "sucursales" |
| `beneficiarios` | Solo en SQL / SOAP externo | Eliminar concepto |

### Librerías a reemplazar

| Actual | Destino | Motivo |
|---|---|---|
| `lib/pusher.ts` | `lib/realtime.ts` (Supabase Realtime) | Costo y acoplamiento |
| `lib/nodemailer.ts` | `lib/email.ts` (Resend) | Branding dinámico por tenant |
| `lib/dbPostgres.ts` (pg pool custom) | Supabase client | Migración a Supabase |
| `lib/generar-*-pdf.ts` (múltiples) | Sistema PDFContext unificado | Branding por tenant |
| JWT manual (jose) | JWT Supabase + propio con tenant_id | Supabase Auth base |

---

## Fases de trabajo

---

### FASE 1 — Scaffold, BD y Supabase (Prerrequisito de todo)

**Linear:** No listado explícitamente, implícito en la arquitectura base
**Estimado:** 3-4 días hábiles
**Dependencias:** Ninguna — debe hacerse primero

#### Tareas

- [x] **1.1** Crear proyecto en Supabase y configurar variables de entorno
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `.env.local` creado con todas las variables necesarias
  - `drizzle.config.ts` actualizado para usar `DATABASE_URL` de Supabase
  
- [x] **1.2** Crear tabla `organizaciones` en Supabase
  ```sql
  CREATE TABLE organizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    color_primario VARCHAR(7) DEFAULT '#0EA5E9',
    color_secundario VARCHAR(7) DEFAULT '#7C3AED',
    activo BOOLEAN DEFAULT true,
    plan VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [x] **1.3** Crear tabla `usuarios` en Drizzle schema (actualmente solo existe en SQL raw)
  - Campos: `id`, `tenant_id` (FK organizaciones), `email`, `password_hash`, `nombre`, `apellidos`, `role` (enum SaaS), `activo`, timestamps
  - Roles SaaS: `super_admin`, `admin_org`, `medico`, `enfermera`, `farmaceutico`, `especialista`
  
- [x] **1.4** Migrar todos los schemas Drizzle para agregar `tenant_id UUID NOT NULL REFERENCES organizaciones(id)`
  - Todos los archivos en `src/db/schema/` reescritos con tenant_id, UUIDs y nuevos ENUMs
  - DB ya migrada directamente en Supabase con `SAAS_MIGRATION_V1.sql`
  
- [x] **1.5** Crear nueva tabla `pacientes` (reemplaza el modelo nómina)
  ```typescript
  // src/db/schema/pacientes.ts
  export const pacientes = pgTable('pacientes', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => organizaciones.id),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    apellidoPaterno: varchar('apellido_paterno', { length: 100 }),
    apellidoMaterno: varchar('apellido_materno', { length: 100 }),
    curp: varchar('curp', { length: 18 }),
    fechaNacimiento: date('fecha_nacimiento'),
    sexo: char('sexo', { length: 1 }),
    telefono: varchar('telefono', { length: 15 }),
    email: varchar('email', { length: 200 }),
    activo: boolean('activo').default(true),
    creadoEn: timestamp('creado_en').defaultNow(),
    actualizadoEn: timestamp('actualizado_en').defaultNow(),
  });
  ```

- [x] **1.6** Activar Row Level Security (RLS) en Supabase
  ```sql
  -- Ejemplo para tabla consulta
  ALTER TABLE consulta ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON consulta
    USING (tenant_id = (current_setting('app.tenant_id'))::uuid);
  ```
  - Aplicar el mismo patrón a todas las tablas con `tenant_id`

- [x] **1.7** Crear función helper para pasar `tenant_id` al contexto de Supabase
  ```typescript
  // src/lib/supabase-server.ts
  export async function getSupabaseWithTenant(tenantId: string) {
    const supabase = createClient(...);
    await supabase.rpc('set_tenant', { tenant_id: tenantId });
    return supabase;
  }
  ```

---

### FASE 2 — Auth, Roles y Contexto Tenant (TRI-24 a TRI-27)

**Linear:** 4 tickets · Prioridad Urgent/High
**Estimado:** 3-4 días hábiles
**Dependencias:** Fase 1 completa

#### Estado actual
- `src/app/api/auth/login/route.ts` → JWT con `{id, usuario, tipoUsuario}`. Sin tenant.
- `src/context/AuthContext.tsx` → No tiene `tenant_id` ni `nombre_organizacion`.
- `src/components/RouteGuard.tsx` → Basado en `id_tipousuario` numérico.
- `src/lib/routePermissions.ts` → Mapeo de rutas a permisos (string).

#### Tareas

- [ ] **2.1 — TRI-24** Reescribir `POST /api/auth/login`
  ```typescript
  // Cambios:
  // ANTES: Busca en `usuarios WHERE username = $1`
  // DESPUÉS: Busca con tenant_id + carga org
  
  // JWT nuevo payload:
  {
    id: string, // UUID
    email: string,
    role: 'medico' | 'admin_org' | 'farmaceutico' | ...,
    tenant_id: string, // UUID de la organización
    nombre_organizacion: string,
  }
  // Mismo sistema de permisos string[] pero cargados por tenant
  ```
  - Mantener misma estructura de cookie httpOnly
  - Agregar rate limiting (10 intentos/min/IP) — **vinculado a TRI-68**
  - Reescribir `GET /api/auth/me` para incluir `tenant_id` y branding

- [ ] **2.2 — TRI-25** Actualizar `AuthContext.tsx`
  ```typescript
  // Agregar al estado global:
  interface AuthState {
    user: {
      id: string;
      email: string;
      nombre: string;
      role: string;
      tenant_id: string;           // NUEVO
      nombre_organizacion: string; // NUEVO
      firma_digital?: string;
    };
    permissions: string[];
    hasPermission: (action: string) => boolean;
    tenantConfig: TenantConfig;    // NUEVO
  }
  ```

- [ ] **2.3 — TRI-26** Crear `TenantContext.tsx`
  ```typescript
  // Propaga variables CSS de branding al DOM
  // Lee: logo_url, color_primario, color_secundario
  // Inyecta: --color-brand-primary, --color-brand-secondary en :root
  // Provee: logo_url a Header y documentos PDF
  ```

- [ ] **2.4 — TRI-27** Actualizar `RouteGuard.tsx` y `routePermissions.ts`
  - Reemplazar validación por `id_tipousuario` numérico → por `role` string
  - Agregar ruta base `/trinium-admin/*` → requiere `role === 'super_admin'`
  - Agregar ruta base `/portal/*` → auth separado (portal paciente)
  - Actualizar `middleware.ts` para leer `tenant_id` del JWT y rechazar si no existe

- [ ] **2.5** Actualizar **todos** los endpoints API para extraer `tenant_id` del JWT
  ```typescript
  // Crear helper: src/lib/auth-helpers.ts
  export async function getTenantFromRequest(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.id as string,
      tenantId: payload.tenant_id as string,
      role: payload.role as string,
      permissions: payload.permissions as string[],
    };
  }
  ```
  - Este helper reemplaza el patrón repetido en 50+ rutas donde se hace `jwtVerify` manualmente

---

### FASE 3 — Módulo Pacientes (TRI-28 a TRI-33)

**Linear:** 6 tickets · Prioridad Urgent/High
**Estimado:** 4-5 días hábiles
**Dependencias:** Fase 1 (tabla `pacientes`), Fase 2 (tenant en JWT)

#### Estado actual
- `src/app/api/pacientes/buscar/route.ts` → Busca en SOAP/WebService por nómina
- `src/app/api/pacientes/[id]/historial/route.ts` → Historial por `no_nomina`
- `src/app/api/beneficiarios/por-nomina/[numNomina]/route.ts` → Integración SOAP
- `src/app/dashboard/pacientes/` → Páginas parciales (búsqueda por nómina)

#### Tareas

- [ ] **3.1 — TRI-28** Crear `src/repositories/pacientes.repository.ts`
  ```typescript
  // Operaciones con tenant_id obligatorio:
  - findById(tenantId, pacienteId)
  - findByName(tenantId, query) → full-text search
  - create(tenantId, data)
  - update(tenantId, pacienteId, data)
  - getHistorial(tenantId, pacienteId) → consultas, recetas, referencias
  ```

- [ ] **3.2 — TRI-29** Crear `src/services/pacientes.service.ts` y `src/domain/paciente.ts`
  ```typescript
  // domain/paciente.ts: tipos y validaciones de negocio
  // service: orquesta repository, valida reglas de negocio
  // Quitar toda lógica de nómina/sindicato/beneficiario
  ```

- [ ] **3.3 — TRI-30** Reescribir API de pacientes
  ```
  POST   /api/pacientes/crear        → body: {nombre, apellidos, curp, fechaNacimiento, sexo, ...}
  GET    /api/pacientes/buscar       → query: ?q=nombre&tenant_id (del JWT)
  GET    /api/pacientes/[id]         → por UUID, validando tenant_id
  PUT    /api/pacientes/[id]         → actualizar datos
  GET    /api/pacientes/[id]/historial → todas las consultas + recetas del paciente
  ```
  - **ELIMINAR** `api/beneficiarios/`, `api/webService/empleado`
  - **ELIMINAR** referencias a `clavenomina`, `sindicato`, `no_nomina` en estas rutas

- [ ] **3.4 — TRI-31** Crear componentes
  - `BuscadorPaciente.tsx` — buscador con debounce, muestra nombre + CURP
  - `FormularioPaciente.tsx` — formulario de registro/edición sin campos de nómina
  - `CardPaciente.tsx` — tarjeta resumen del paciente

- [ ] **3.5 — TRI-32** Crear hooks
  - `usePacientes.ts` — lista paginada con búsqueda
  - `useHistorial.ts` — historial clínico completo del paciente
  - Crear `HistorialClinico.tsx` — componente de timeline de consultas y recetas

- [ ] **3.6 — TRI-33** Actualizar páginas dashboard
  - `/pacientes` → lista con buscador y botón "Nuevo Paciente"
  - `/pacientes/nuevo` → formulario de registro
  - `/pacientes/[id]` → perfil + historial clínico

---

### FASE 4 — Consultas Médicas (TRI-34 a TRI-39)

**Linear:** 6 tickets · Prioridad Urgent/High
**Estimado:** 4-5 días hábiles
**Dependencias:** Fase 3 (modelo paciente nuevo)

#### Estado actual — **Código muy avanzado, requiere adaptación**
- `src/db/schema/consulta.ts` → Schema Drizzle completo. Tiene `no_nomina`, `id_beneficiario`, `sindicato`, `es_empleado`, `id_parentesco`.
- `src/app/api/consultas/crear/route.ts` → Usa `clavenomina`, `clavepaciente`, `sindicato`. Integración Pusher.
- `src/app/api/consultas/[id]/soap/route.ts` → PUT con CIE-11.
- `src/app/api/consultas/[id]/signos-vitales/route.ts` → PUT signos vitales.
- `src/app/api/consultas/finalizar/route.ts` → Finaliza + dispara receta.

#### Tareas

- [ ] **4.1 — TRI-34** Crear `consultas.repository.ts` y `consultas.service.ts`
  ```typescript
  // Adaptar lógica existente de las rutas directas
  // QUITAR: clavenomina, id_beneficiario, sindicato, es_empleado, id_parentesco
  // AGREGAR: id_paciente (UUID FK), tenant_id
  
  // Modificar schema/consulta.ts:
  // ANTES: noNomina, idBeneficiario, sindicato, esEmpleado, idParentesco
  // DESPUÉS: idPaciente (uuid, FK pacientes.id), tenantId (uuid, FK organizaciones.id)
  ```

- [ ] **4.2 — TRI-35** Reescribir `POST /api/consultas/crear`
  ```typescript
  // ANTES: recibe clavenomina, clavepaciente, elpacienteesempleado...
  // DESPUÉS: recibe id_paciente (UUID), genera folio 8 chars (mantener lógica)
  // Mantener: signos vitales, triage, folio generation
  // Agregar: tenant_id del JWT
  // Reemplazar: pusherServer.trigger → Supabase Realtime broadcast
  ```

- [ ] **4.3 — TRI-36** Adaptar endpoints SOAP y signos vitales
  - `PUT /api/consultas/[id]/signos-vitales` → validar que `consulta.tenant_id === jwt.tenant_id`
  - `PUT /api/consultas/[id]/soap` → igual, mantener integración CIE-11 (funciona bien)
  - `POST /api/consultas/[id]/finalizar` → reemplazar Pusher → Supabase Realtime + invalidar caché KV

- [ ] **4.4 — TRI-38** Crear `lib/realtime.ts` y `hooks/useRealtime.ts`
  ```typescript
  // lib/realtime.ts → wrapper de Supabase Realtime channel
  // Reemplaza: src/lib/pusher.ts
  // Canales: 'dashboard-{tenant_id}', 'consultas-{tenant_id}'
  // Eventos: 'stats-refresh', 'nueva-consulta', etc.
  
  // hooks/useRealtime.ts → hook React que suscribe y limpia
  ```
  - **Eliminar** `src/lib/pusher.ts` y dependencia `pusher-js`
  - Actualizar `package.json`

- [ ] **4.5 — TRI-39** Adaptar componentes de consultas
  - `TablaPacientesEspera.tsx` → usa `useRealtime` en lugar de Pusher channel
  - `ModalConsulta.tsx` → campo paciente es búsqueda por nombre (no por nómina)
  - `FormSOAP.tsx` → mantener lógica, quitar referencias a beneficiario
  - `ModalSignosVitales.tsx` → sin cambios sustanciales

---

### FASE 5 — Recetas, Farmacia y Laboratorio (TRI-40 a TRI-45)

**Linear:** 6 tickets · Prioridad High/Medium
**Estimado:** 4-5 días hábiles
**Dependencias:** Fase 4 (consulta con id_paciente)

#### Estado actual — **Código muy robusto, cambios principalmente de tenant**
- `src/db/schema/recetas.ts` → 6 tablas Drizzle. Lógica completa de resurtimiento.
- `src/db/schema/farmacia.ts` → Medicamentos, inventario, unidades.
- 18 endpoints de recetas + 10 de farmacia completamente funcionales.
- Catálogo de medicamentos es por instalación, en SaaS debe ser global + por tenant.

#### Tareas

- [ ] **5.1 — TRI-40** Crear `recetas.repository.ts`, `recetas.service.ts`, `farmacia.service.ts`
  ```typescript
  // Extraer lógica de rutas directas a servicios
  // Agregar tenant_id en todas las queries
  
  // Decisión arquitectural importante:
  // medicamentos: CATÁLOGO GLOBAL (todas las orgs los ven)
  //               inventario_medicamentos: POR TENANT (cada org tiene su stock)
  
  // schema/farmacia.ts:
  // medicamentos → NO necesita tenant_id (catálogo global)
  // inventario_medicamentos → SÍ necesita tenant_id
  ```

- [ ] **5.2 — TRI-41** Adaptar API de recetas con tenant_id
  ```
  POST /api/recetas/emitir    → (era /crear) requiere tenant_id del JWT
  POST /api/recetas/surtir    → valida inventario del tenant
  POST /api/recetas/resurtimiento → genera receta resurtimiento por tenant
  ```
  - Mantener toda la lógica de `control_resurtimientos` (está bien construida)
  - Agregar `tenant_id` en inserts de `recetas`, `detalle_receta`, `surtimientos_receta`

- [ ] **5.3 — TRI-42** Adaptar API de farmacia e inventario
  ```
  GET /api/farmacia/buscar-medicamentos → catálogo global (sin tenant filter)
  GET /api/farmacia/inventario          → inventario del tenant (con tenant filter)
  PUT /api/farmacia/inventario/[id]     → solo si inventario.tenant_id === jwt.tenant_id
  ```

- [ ] **5.4 — TRI-43** Crear/adaptar API de laboratorio con schema
  ```
  POST /api/laboratorio/orden          → nueva orden por tenant
  PUT  /api/laboratorio/[id]/resultado → carga resultado con URL firmada (Supabase Storage)
  ```
  - Actualmente en rutas `/api/admin/laboratorio/` y `/api/coordinacion/laboratorio/`
  - Unificar en una sola estructura con control de acceso por rol

- [ ] **5.5 — TRI-44** Mantener ruta pública `GET /r/[token]`
  - Esta ruta ya existe y usa token para acceso sin sesión
  - Solo validar que el QR incluya `tenant_id` en el payload del token
  - Mostrar branding del tenant en la vista pública

- [ ] **5.6 — TRI-45** Adaptar componentes de farmacia
  - Eliminar campos `clavenomina`, `no_nomina` de todos los formularios
  - `BuscadorReceta.tsx` → busca por folio o nombre del paciente (no por nómina)
  - `TablaInventario.tsx` → filtrado por `tenant_id` (transparente para el usuario)

---

### FASE 6 — Referencias Simplificadas (TRI-46 a TRI-49)

**Linear:** 4 tickets · Prioridad High
**Estimado:** 4-5 días hábiles
**Dependencias:** Fase 4

#### Estado actual — **Código extremadamente complejo, se simplifica drásticamente**
- 30+ endpoints de referencias organizados en: coordinador, hospital, admin, especialista
- 5 etapas en el flujo: `pendiente_autorizar → autorizada → asignada → notificada → atendida`
- `src/db/schema/referencias.ts` → Tabla con columnas por fase (muy compleja)
- Flujo SaaS: se elimina la figura del "coordinador de empresa" y se simplifica

#### Tareas

- [ ] **6.1 — TRI-46** Crear `referencias.repository.ts` y `referencias.service.ts`
  ```typescript
  // NUEVO flujo simplificado (3 estados):
  // pendiente → programada → atendida (+ cancelada + inasistencia)
  
  // Simplificar schema referencias:
  // ELIMINAR: columnas de fase coordinador (autoriza, firma_digital, observacionesCoordinador)
  // ELIMINAR: columnas de fase admin (notifica, observacionesNotificacion)
  // MANTENER: médico refiere, especialista asignado, fecha_cita, atención
  
  // Tipos: referencia_interna (dentro del tenant) vs referencia_externa (a hospital externo)
  ```

- [ ] **6.2 — TRI-47** Reescribir API de transiciones
  ```
  POST /api/referencias/crear          → médico crea referencia
  POST /api/referencias/[id]/programar → admin/médico asigna fecha y especialista
  POST /api/referencias/[id]/atender   → especialista marca atendida
  POST /api/referencias/[id]/cancelar  → cancelación con motivo
  POST /api/referencias/[id]/inasistencia → registra inasistencia
  ```
  - **ELIMINAR** rutas de coordinador (`/referencias/coordinador/*`)
  - **ELIMINAR** rutas de hospital (`/referencias/hospital/*`)
  - **ELIMINAR** rutas de admin de notificación (`/referencias/admin/*`)

- [ ] **6.3 — TRI-48** Crear API de contrareferencias simplificada
  ```
  POST /api/referencias/[id]/contrareferir → especialista crea contrareferencia
  GET  /api/referencias/[id]/contrareferencia → obtiene contrareferencia
  ```
  - Notificación al médico original: via Supabase Realtime

- [ ] **6.4 — TRI-49** Simplificar componentes de referencias
  - **ELIMINAR** vistas de coordinador (`/referencias/coordinador/`)
  - **ELIMINAR** vistas de hospital (`/referencias/hospital/`)
  - **ELIMINAR** vistas de admin (`/referencias/admin/`)
  - **MANTENER** vista de médico (crear referencia)
  - **MANTENER** vista de especialista (atender referencia, crear contrareferencia)
  - **CREAR** vista unificada para el admin de la organización (programar)

---

### FASE 7 — Certificados Médicos (TRI-50 a TRI-53)

**Linear:** 4 tickets · Prioridad High
**Estimado:** 3-4 días hábiles
**Dependencias:** Fase 1 (Supabase Storage para URLs firmadas)

#### Estado actual — **Módulo completamente nuevo**
- No existe ningún código de certificados en el proyecto actual.
- Tipos de certificados médicos comunes: Aptitud laboral, Incapacidad temporal, Salud general, Defunción.

#### Tareas

- [ ] **7.1 — TRI-50** Crear `certificados.service.ts` y `certificados.repository.ts`
  ```typescript
  // Nueva tabla en DB:
  CREATE TABLE certificados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizaciones(id),
    id_consulta BIGINT REFERENCES consulta(id_consulta),
    id_paciente UUID REFERENCES pacientes(id),
    id_medico UUID REFERENCES usuarios(id),
    tipo_certificado VARCHAR(50) NOT NULL, -- 'aptitud_laboral', 'incapacidad', 'salud_general'
    campos_dinamicos JSONB NOT NULL,       -- Campos específicos por tipo
    pdf_url TEXT,                          -- URL firmada Supabase Storage
    folio VARCHAR(30) UNIQUE,
    emitido_en TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID NOT NULL
  );
  ```

- [ ] **7.2 — TRI-51** Crear `lib/pdf/generar-certificado.ts`
  ```typescript
  // PDFContext dinámico: lee branding del tenant
  // Incluye: logo de la org, nombre del médico, firma digital, sello
  // Genera según tipo: campos distintos por tipo de certificado
  // Sube PDF a Supabase Storage y retorna URL firmada
  ```

- [ ] **7.3 — TRI-52** Crear API de certificados
  ```
  POST /api/certificados/crear          → genera certificado y PDF
  GET  /api/certificados/[id]           → detalle con URL firmada del PDF
  GET  /api/certificados/consulta/[id]  → certificados de una consulta
  ```

- [ ] **7.4 — TRI-53** Crear `ModalCertificado.tsx`
  - Selector de tipo de certificado (lista por tenant o global)
  - Formulario dinámico según tipo seleccionado
  - Vista previa del certificado antes de emitir
  - Botón de descarga PDF con URL firmada

---

### FASE 8 — Analytics y KPIs con Caché (TRI-54 a TRI-57)

**Linear:** 4 tickets · Prioridad High/Medium
**Estimado:** 3-4 días hábiles
**Dependencias:** Fase 1, Vercel KV configurado

#### Estado actual — **Lógica existe, necesita tenant + caché**
- `src/app/api/analytics/` → 14 endpoints completamente funcionales
- Sin filtro por `tenant_id` (consultan toda la BD)
- Sin caché (cada request ejecuta queries complejas en tiempo real)

#### Tareas

- [ ] **8.1 — TRI-54** Crear `lib/cache.ts`
  ```typescript
  // Vercel KV helpers con estrategia de keys por tenant
  // Key pattern: `kpi:{tenant_id}:{tipo_kpi}:{fecha_YYYY-MM-DD}`
  
  export async function getCachedKPI<T>(tenantId: string, tipo: string): Promise<T | null>
  export async function setCachedKPI<T>(tenantId: string, tipo: string, data: T, ttl: number): Promise<void>
  export async function invalidateTenantKPIs(tenantId: string): Promise<void>
  ```

- [ ] **8.2 — TRI-55** Crear `analytics.service.ts`
  ```typescript
  // 5 grupos de KPIs (ya existen las queries, solo agregar tenant_id y caché):
  // 1. KPIs de consultas (total, por día, por médico)
  // 2. KPIs de farmacia (consumo, costo, stock crítico)
  // 3. KPIs de referencias (tasa de derivación, especialidades más solicitadas)
  // 4. KPIs de diagnósticos (enfermedades más frecuentes, CIE-11)
  // 5. KPIs de productividad (consultas por médico, tiempos de atención)
  
  // Agregar WHERE tenant_id = ? en todas las queries
  // TTL de caché: 1 hora para KPIs del día, 24h para históricos
  ```

- [ ] **8.3 — TRI-56** Adaptar endpoint de exportación
  ```
  GET /api/analytics/exportar → genera Excel/PDF filtrado por tenant y rango de fechas
  ```
  - Mantener lógica de ExcelJS (funciona bien)
  - Agregar filtro por `tenant_id`

- [ ] **8.4 — TRI-57** Invalidación de caché al finalizar consulta
  ```typescript
  // En consultas.service.finalizar():
  await invalidateTenantKPIs(tenantId);
  await supabaseRealtime.broadcast('dashboard-' + tenantId, 'stats-refresh', {});
  ```
  - Adaptar dashboard frontend para consumir KPIs cacheados
  - Multi-tenant en widgets: cada widget filtra por `tenant_id` del contexto

---

### FASE 9 — PDFs, Branding y Email (TRI-58 a TRI-61)

**Linear:** 4 tickets · Prioridad High
**Estimado:** 3-4 días hábiles
**Dependencias:** Fase 1 (Supabase Storage), Fase 2 (TenantContext)

#### Estado actual
- `src/lib/generar-receta-pdf.ts`, `generar-incapacidad-pdf.ts`, etc. → Múltiples archivos PDF independientes sin branding por tenant
- `src/lib/nodemailer.ts` → SMTP genérico sin templates de branding

#### Tareas

- [ ] **9.1 — TRI-58** Crear `lib/storage.ts`
  ```typescript
  // Supabase Storage helpers
  // Estructura de buckets: 'pdfs/{tenant_id}/{tipo}/{id}.pdf'
  //                        'logos/{tenant_id}/logo.png'
  //                        'firmas/{tenant_id}/{user_id}.png'
  
  export async function uploadPDF(tenantId, tipo, id, buffer): Promise<string>
  export async function getSignedUrl(path, expiresIn = 3600): Promise<string>
  export async function uploadLogo(tenantId, buffer): Promise<string>
  ```

- [ ] **9.2 — TRI-59** Crear `lib/email.ts` con Resend
  ```typescript
  // Reemplaza nodemailer.ts
  // Templates con branding dinámico por tenant:
  // - Template de bienvenida a nueva organización
  // - Template de referencia médica
  // - Template de notificación de cita
  // - Template de alerta de stock bajo
  
  export async function sendEmail(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<void>
  // donde data incluye: { org_nombre, org_logo_url, org_color_primario, ... }
  ```
  - Instalar `resend` y remover `nodemailer`

- [ ] **9.3 — TRI-60** Refactorizar `lib/pdf/generar-receta.ts`
  ```typescript
  // Unificar los múltiples archivos PDF en sistema PDFContext
  // PDFContext = { org_nombre, org_logo_url, org_color, medico_nombre, medico_firma }
  // QR público: apunta a /r/[token] con tenant_id en el payload
  // Código de barras EAN: mantener lógica JSBarcode existente
  // Subir PDF a Supabase Storage y retornar URL firmada
  ```

- [ ] **9.4 — TRI-61** Crear `lib/pdf/generar-referencia.ts` y `generar-orden-laboratorio.ts`
  ```typescript
  // Migrar lógica de generar-pase-especialidad-pdf.ts → PDFContext
  // Migrar lógica de generar-orden-laboratorio-pdf.ts → PDFContext
  // Ambos con branding del tenant
  ```

---

### FASE 10 — Portal Super Admin Trinium (TRI-62 a TRI-64)

**Linear:** 3 tickets · Prioridad Urgent
**Estimado:** 3-4 días hábiles
**Dependencias:** Fase 1 y Fase 2

#### Estado actual — **Completamente nuevo**
- No existe ningún panel `/trinium-admin` en el proyecto.
- El "super admin" es Trinium como empresa (no los admins de cada organización cliente).

#### Tareas

- [ ] **10.1 — TRI-62** Crear layout `/trinium-admin/`
  ```typescript
  // src/app/trinium-admin/layout.tsx
  // Middleware: role === 'super_admin' → acceso concedido, else → 403
  // Dashboard de organizaciones: listado con KPIs por org
  // Sidebar con: Organizaciones, Usuarios, Facturación (placeholder), Config
  ```

- [ ] **10.2 — TRI-63** Crear endpoint de alta de organización
  ```
  POST /api/trinium/organizaciones/crear
  ```
  ```typescript
  // Crea: registro en `organizaciones`
  // Crea: usuario admin_org inicial
  // Envía: email de bienvenida con Resend (template de onboarding)
  // Retorna: credenciales iniciales del admin
  ```

- [ ] **10.3 — TRI-64** Crear endpoints de gestión de organizaciones
  ```
  GET /api/trinium/organizaciones        → listado con stats (tenants activos, usuarios, consultas/mes)
  PUT /api/trinium/organizaciones/[id]   → actualizar datos, plan, estado (activar/suspender)
  ```
  - Vista en `/trinium-admin/organizaciones` con tabla y acciones

---

### FASE 11 — Scaffold Portal del Paciente (TRI-65 a TRI-66)

**Linear:** 2 tickets · Prioridad High/Urgent
**Estimado:** 3-4 días hábiles
**Dependencias:** Fase 3 (modelo paciente), Fase 7 (certificados)

#### Estado actual — **Completamente nuevo**
- Existe `GET /api/r/[token]` para QR público de recetas (base útil)
- No existe ningún portal de paciente autenticado

#### Tareas

- [ ] **11.1 — TRI-65** Crear auth separado para portal del paciente
  ```
  POST /api/portal/auth/activar    → el médico activa el acceso del paciente (envía link por email)
  POST /api/portal/auth/login      → el paciente inicia sesión con email + código
  GET  /api/portal/auth/me         → sesión del paciente (JWT separado, sin acceso al dashboard médico)
  ```
  ```typescript
  // JWT del paciente lleva: { id_paciente, tenant_id, email, tipo: 'paciente' }
  // Cookie separada: 'portal_token' (distinta a 'token' del dashboard)
  ```

- [ ] **11.2 — TRI-66** Crear layout y páginas del portal
  ```typescript
  // src/app/portal/layout.tsx → layout independiente (sin sidebar del dashboard médico)
  
  // Páginas:
  // /portal → redirect a /portal/historial si autenticado
  // /portal/historial      → timeline de consultas del paciente
  // /portal/recetas        → recetas activas y para descarga
  // /portal/certificados   → certificados médicos descargables
  // /portal/datos          → actualizar datos personales del paciente
  // /portal/login          → formulario de login del paciente
  ```

---

### FASE 12 — QA, Seguridad y Lanzamiento (TRI-67 a TRI-72)

**Linear:** 6 tickets · Prioridad Urgent/High/Medium
**Estimado:** 4-5 días hábiles
**Dependencias:** Todas las fases anteriores

#### Tareas

- [ ] **12.1 — TRI-67** Tests de aislamiento multi-tenant
  ```typescript
  // Crear: src/__tests__/tenant-isolation.test.ts
  // Escenarios:
  // 1. Usuario de Tenant A intenta GET /api/pacientes/{id_de_tenant_B} → 404
  // 2. Usuario de Tenant A intenta PUT /api/consultas/{id_de_tenant_B} → 403
  // 3. Analytics de Tenant A no incluye datos de Tenant B
  // 4. Super admin puede ver cualquier tenant
  // Herramienta: Vitest o Jest + supabase test client
  ```

- [ ] **12.2 — TRI-68** Rate limiting en login
  ```typescript
  // src/app/api/auth/login/route.ts
  // Usar: Vercel KV como store de intentos
  // Key: `rate_limit:login:{ip}`
  // Límite: 10 intentos por minuto por IP
  // Al exceder: 429 + header Retry-After
  
  import { kv } from '@vercel/kv';
  const attempts = await kv.incr(`rate_limit:login:${ip}`);
  await kv.expire(`rate_limit:login:${ip}`, 60);
  if (attempts > 10) return Response.json({}, { status: 429 });
  ```

- [ ] **12.3 — TRI-69** Headers HTTP de seguridad en `next.config.ts`
  ```typescript
  // next.config.ts
  const securityHeaders = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    {
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.supabase.co; connect-src 'self' *.supabase.co wss://*.supabase.co"
    },
  ];
  ```

- [ ] **12.4 — TRI-70** Auditoría Zod — validar todos los endpoints POST/PUT
  ```typescript
  // Verificar que CADA endpoint POST/PUT tenga un schema Zod antes del service
  // Ejemplo del patrón correcto:
  const bodySchema = z.object({ nombre: z.string().min(1).max(200), ... });
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ errors: body.error.errors }, { status: 422 });
  
  // Rutas que probablemente carecen de Zod (revisar):
  // - /api/consultas/crear (validaciones manuales con if/else)
  // - /api/referencias/crear
  // - /api/recetas/emitir
  // - /api/certificados/crear
  ```

- [ ] **12.5 — TRI-71** Checklist NOM-004 (expediente clínico)
  ```typescript
  // NOM-004-SSA3-2012: Norma del expediente clínico electrónico en México
  // Verificar que consulta.soap capture:
  // ✓ Subjetivo (motivo de consulta + antecedentes)
  // ✓ Objetivo (signos vitales + exploración física)
  // ✓ Análisis (diagnóstico CIE-11)
  // ✓ Plan (tratamiento + medicamentos + indicaciones)
  // ✓ Datos de identificación del paciente (nombre, fecha nacimiento, sexo)
  // ✓ Datos del médico (nombre, cédula profesional)
  // ✓ Fecha y hora de la consulta
  // ✓ Firma del médico
  
  // Agregar campo: cedula_profesional a tabla usuarios
  // Agregar campo: especialidad_medico a tabla usuarios
  ```

- [ ] **12.6 — TRI-72** Deploy en producción
  ```bash
  # Infraestructura checklist:
  # - Dominio app.trinium.mx apuntando a Vercel
  # - SSL/TLS activo (Vercel automático)
  # - Variables de entorno de producción en Vercel Dashboard
  # - Supabase en plan Pro (backups + pgBouncer + RLS)
  # - Resend con dominio trinium.mx verificado
  # - Vercel KV configurado y conectado
  # - Drizzle migrations ejecutadas en producción
  
  # Flujo end-to-end con primera organización real:
  # 1. Super admin crea organización desde /trinium-admin
  # 2. Admin de org recibe email de bienvenida
  # 3. Admin de org crea médico, farmacéutico, especialista
  # 4. Médico registra paciente, crea consulta, emite receta
  # 5. Farmacéutico surte receta desde su vista
  # 6. Analytics muestra datos de esa organización
  ```

---

### FASE 13 — App Móvil del Paciente ✦ Plus opcional (Post-SaaS)

> **Funcionalidad plus, no parte del flujo core del SaaS.**
> Se implementa solo si se decide ofrecerla como valor agregado al finalizar y estabilizar las Fases 1–12.
> No bloquea ni es prerequisito de ninguna fase anterior.

**Stack tentativo (si se implementa):** React Native (Expo) · JWT `tipo: 'paciente'` ya existente en Fase 11 · QR dinámico firmado
**Estimado:** A decidir y planear al concluir el SaaS
**Base existente:** La Fase 11 (Portal del Paciente web) ya incluye auth separado para pacientes; la app móvil sería una extensión de ese mismo sistema.

---

#### Qué es y para qué sirve

Una app móvil que el paciente descarga voluntariamente. La app le permite:
- Ver su historial médico (consultas, recetas, diagnósticos, certificados)
- **Plus:** compartir su expediente con un médico nuevo mediante un QR temporal

El flujo SaaS base (Fases 1–12) funciona perfectamente sin esta app. El médico sigue registrando pacientes manualmente. La app es una comodidad para el paciente, no un requisito operativo.

---

#### Funcionalidades plus (a elegir cuáles implementar)

##### Plus 1 — Historial en el celular

El paciente accede a la misma información que ya existe en el Portal web (Fase 11), pero desde una app nativa. No requiere cambios de arquitectura: usa los mismos endpoints del Portal.

##### Plus 2 — QR para compartir expediente con un médico nuevo

```
1. Paciente llega con un doctor que aún no lo tiene registrado
2. Paciente abre la app y genera un QR temporal (expira en 15 minutos)
3. QR contiene: { id_paciente, token_firmado, exp }
4. Doctor escanea el QR desde el dashboard web del SaaS
5. El sistema valida el token y muestra el perfil del paciente
6. Doctor puede:
   a. Registrarlo en su propio expediente con un clic (en lugar de capturar datos manualmente)
   b. Ver el historial de consultas anteriores (solo lo que el paciente autorizó compartir)
7. El paciente recibe notificación: "Dr. [nombre] accedió a tu expediente"
```

> Sin la app el flujo sigue funcionando: el doctor busca al paciente por nombre o CURP y lo registra de forma normal. El QR es solo una comodidad.

##### Plus 3 — Control de privacidad del paciente

El paciente decide qué información es visible para médicos nuevos al escanear el QR:
- Todas las consultas
- Solo diagnósticos (sin notas SOAP)
- Solo medicamentos activos
- Solo datos de contacto (sin historial)

---

#### Decisión arquitectural: ¿una sola tabla de pacientes o separada por tenant?

Esta pregunta aplica si se decide implementar el QR (Plus 2). Es la decisión más importante de la Fase 13.

##### Opción A — Paciente por tenant (modelo actual del SaaS, Fases 1–12)

```
pacientes
├── tenant_id  ← el paciente "pertenece" a la org donde fue registrado
├── curp, nombre, ...
```

El mismo paciente en dos hospitales = dos registros distintos. La app móvil tendría que unir esos registros por CURP o email para mostrar un historial unificado.

**Cuándo elegir esta:** si el QR solo va a permitir que el médico vea datos básicos del paciente y lo registre rápido en su expediente. El historial de otros hospitales no se comparte.

##### Opción B — Paciente como identidad global (requiere migración de schema)

```
pacientes_globales              ← sin tenant_id, identidad única en todo el sistema
├── id, curp UNIQUE, nombre, email, app_activada

expedientes                     ← relación paciente ↔ médico/hospital
├── id_paciente (FK pacientes_globales)
├── tenant_id, id_medico
```

El mismo paciente en dos hospitales = un solo registro, dos expedientes. La app muestra historial de todos los hospitales en un solo lugar.

**Cuándo elegir esta:** si se quiere que el médico nuevo pueda ver el historial completo del paciente de otros hospitales al escanear el QR.

**Implicación:** requiere migrar la tabla `pacientes` de la Fase 1. No es una reescritura, pero sí una migración de schema con datos reales en producción. Se planea detalladamente antes de ejecutar.

##### Recomendación

Las Fases 1–12 se implementan con Opción A (ya planeada). Al decidir arrancar la Fase 13, se elige entre A o B según el alcance del plus que se quiera ofrecer. Para dejar la puerta abierta, en la Fase 3 conviene guardar `curp` como campo indexado, lo que facilita deduplicar pacientes más adelante si se elige Opción B.

---

#### Endpoints nuevos (solo si se implementa)

```
# Plus 2 — QR
POST /api/portal/qr/generar                    → genera token QR temporal (15 min)
GET  /api/pacientes/qr/[token]                 → médico escanea y obtiene perfil del paciente
POST /api/pacientes/qr/vincular                → médico registra al paciente en su expediente vía QR

# Plus 3 — Privacidad
GET  /api/portal/privacidad                    → configuración de visibilidad del historial
PUT  /api/portal/privacidad                    → actualizar preferencias
GET  /api/portal/medicos-con-acceso            → lista de médicos con acceso activo
DELETE /api/portal/medicos-con-acceso/[id]     → revocar acceso a un médico

# Push notifications (app nativa)
POST /api/portal/notificaciones/push           → enviar notificación al paciente
```

---

#### Consideraciones legales (a planear antes del lanzamiento)

Puntos a resolver con área legal/compliance antes de publicar la app:
- Consentimiento informado del paciente para compartir historial clínico
- Derecho al olvido y retención de datos (LFPDPPP México)
- Responsabilidad del médico al acceder a expediente via QR
- Tokens QR de un solo uso o con expiración corta (recomendado: 15 min, no renovable automáticamente)
- Registro de auditoría: cada acceso via QR queda logueado con timestamp, médico y acción

> Los términos y condiciones se planearán en una sesión separada con el equipo legal al concluir el SaaS.

---

## Riesgos y decisiones críticas

### Riesgo 1 — El cambio de modelo de paciente es la migración más arriesgada

**Problema:** `clavenomina` y `id_beneficiario` están en 50+ rutas. Cambiar a `id_paciente` (UUID) rompe todo.
**Estrategia:** Hacer la Fase 3 completamente antes de tocar cualquier otra cosa. Una vez que `pacientes.repository.ts` existe y `consultas.service.ts` lo usa, el resto de los módulos se actualiza en cadena.

### Riesgo 2 — La tabla `consulta` tiene campos que desaparecen en SaaS

**Antes:** `no_nomina`, `id_beneficiario`, `sindicato`, `es_empleado`, `id_parentesco`
**Después:** `id_paciente`, `tenant_id`
**Implicación:** La migración de DB debe manejar datos existentes. Crear columnas nuevas, poblarlas, luego eliminar las viejas.

### Riesgo 3 — Referencias pierde 5 etapas y quedan 3

**Problema:** La lógica de coordinador, hospital y admin de notificaciones existe en 30 endpoints.
**Estrategia:** No refactorizar las rutas actuales. Crear rutas nuevas `/api/referencias/v2/*` con la arquitectura SaaS y eliminar las viejas en la Fase 12.

### Riesgo 4 — Supabase Realtime ≠ Pusher (diferente paradigma)

**Pusher:** Canal fijo, eventos con nombres fijos.
**Supabase Realtime:** Subscriptions a cambios en tablas DB o channels broadcast.
**Estrategia:** Usar Supabase Realtime en modo Broadcast (más cercano a Pusher). Crear el wrapper en `lib/realtime.ts` con la misma API que Pusher para minimizar cambios en componentes.

---

## Decisiones de arquitectura tomadas en Linear

| Decisión | Detalle |
|---|---|
| `tenant_id` en todas las tablas | No se usa schema de PostgreSQL separado por tenant. Una sola BD con RLS. |
| Drizzle ORM | Se mantiene Drizzle (ya hay 13 schemas). Se genera migración con `drizzle-kit`. |
| Medicamentos: catálogo global | `medicamentos` sin `tenant_id`. `inventario_medicamentos` con `tenant_id`. |
| Auth: JWT propio | Se mantiene JWT httpOnly. Se agrega `tenant_id` al payload. No se usa Supabase Auth directamente. |
| Supabase Storage | PDFs y logos subidos a Supabase Storage. URLs firmadas con expiración. |
| Vercel KV | Cache de KPIs con TTL. Keys por tenant. Invalidación al finalizar consulta. |
| CIE-11 | Integración actual se mantiene (funciona correctamente). |

---

## Dependencias entre fases

```
Fase 1 (DB + Supabase) ─────────────────────────────────────────────┐
    │                                                                │
    ├─► Fase 2 (Auth + Tenant) ─────────────────────────────────────┤
    │       │                                                        │
    │       ├─► Fase 3 (Pacientes) ──────────────────────────────── ┤
    │       │       │                                                │
    │       │       ├─► Fase 4 (Consultas) ──────────────────────── ┤
    │       │       │       │                                        │
    │       │       │       ├─► Fase 5 (Recetas/Farmacia)           │
    │       │       │       ├─► Fase 6 (Referencias)                │
    │       │       │       └─► Fase 7 (Certificados) ─────────────►┤
    │       │       │                                                │
    │       │       └─► Fase 11 (Portal Paciente) ──────────────────┤
    │       │                                                        │
    │       └─► Fase 10 (Super Admin)                               │
    │                                                                │
    ├─► Fase 8 (Analytics + Caché)                                  │
    └─► Fase 9 (PDFs + Email)                                       │
                                                                     │
                        Fase 12 (QA + Deploy) ◄────────────────────┘
                                │
                                │  ← SaaS en producción estable
                                ▼
                   Fase 13 (App Móvil Paciente) [POST-SaaS]
                   Depende de: Fase 11 (auth paciente) + Fase 3 (modelo paciente)
                   Decisión previa: Opción A vs Opción B de identidad del paciente
```

---

## Checklist de limpieza (código a eliminar)

Al finalizar todas las fases, eliminar:

- [ ] `src/lib/pusher.ts` y dependencia `pusher-js`, `pusher`
- [ ] `src/lib/nodemailer.ts` y dependencia `nodemailer`
- [ ] `src/lib/dbPostgres.ts` (reemplazado por Supabase client)
- [ ] `src/app/api/webService/` (integración SOAP con sistema de nómina)
- [ ] `src/app/api/beneficiarios/` (concepto eliminado)
- [ ] `src/app/api/referencias/coordinador/` (flujo eliminado en SaaS)
- [ ] `src/app/api/referencias/hospital/` (flujo eliminado en SaaS)
- [ ] `src/app/api/referencias/admin/` (flujo eliminado en SaaS)
- [ ] `src/app/api/catalogos/beneficiarios/` (concepto eliminado)
- [ ] `src/app/dashboard/catalogos/beneficiarios/` (página eliminada)
- [ ] `src/app/dashboard/coordinacion/` (rol eliminado en SaaS)
- [ ] `src/app/dashboard/referencias/coordinador/` (rol eliminado en SaaS)
- [ ] `src/app/dashboard/referencias/hospital/` (rol eliminado en SaaS)
- [ ] `src/app/dashboard/referencias/admin/` (rol eliminado en SaaS)
- [ ] `database/*.sql` (migraciones de Pandora, ya no aplican)

---

*Generado: 2026-05-12 | Basado en análisis del código (Pandora) y 85 tickets de Linear (Trinium Médico SaaS v1)*
