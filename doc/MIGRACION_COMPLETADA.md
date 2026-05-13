# ✅ MIGRACIÓN COMPLETADA - Módulo de Consultas

## 📅 Fecha: Enero 2025

---

## 🎯 RESUMEN EJECUTIVO

Se implementaron **3 mejoras críticas** en el módulo de consultas y se creó la tabla catálogo `estatus_consulta` con su respectiva Foreign Key.

---

## ✨ MEJORAS IMPLEMENTADAS

### 1️⃣ Campo `id_parentesco` - Lógica Automática

**Archivo:** `src/app/api/consultas/crear/route.ts` (líneas 146-183)

**Lógica implementada:**
- ✅ **Si es empleado** (`es_empleado = true`) → `id_parentesco = 6` (EMPLEADO)
- ✅ **Si es beneficiario** → Busca automáticamente en `beneficiario.parentesco`

```typescript
if (elpacienteesempleado) {
  idParentesco = 6; // EMPLEADO
} else {
  const result = await executeQueryOne(`
    SELECT parentesco FROM beneficiario WHERE id_beneficiario = $1
  `, [clavepaciente]);
  idParentesco = result.parentesco;
}
```

---

### 2️⃣ Campo `id_hospital` - Obtención Automática

**Archivo:** `src/app/api/consultas/crear/route.ts` (líneas 127-144)

**Lógica implementada:**
- ✅ Se obtiene automáticamente desde `usuarios.id_hospital`
- ✅ Usa el `id_medico` (del JWT) para buscar su hospital asignado

```typescript
const usuarioResult = await executeQueryOne(`
  SELECT id_hospital FROM usuarios WHERE id_usuario = $1
`, [idMedico]);
idHospital = usuarioResult.id_hospital;
```

---

### 3️⃣ Campo `id_medico` - Desde JWT

**Archivo:** `src/app/api/consultas/crear/route.ts` (líneas 101-125)

**Lógica implementada:**
- ✅ Se obtiene del token JWT automáticamente
- ✅ Validación de token obligatoria (retorna 401 si falta)

```typescript
const { payload } = await jwtVerify(token, secret);
idMedico = payload.id;
```

---

### 4️⃣ Campo `estatus_consulta` - Tabla Catálogo

**Archivos:**
- `database/CREATE_TABLE_estatus_consulta.sql` ✅ EJECUTADO
- `database/ALTER_TABLE_consulta_add_fk_estatus.sql` ✅ EJECUTADO
- `src/db/schema/estatus_consulta.ts` ✅ CREADO

**Estructura de la tabla:**

```sql
CREATE TABLE estatus_consulta (
    id_estatus_consulta   SMALLINT PRIMARY KEY,
    descripcion           VARCHAR(50) NOT NULL UNIQUE,
    descripcion_corta     VARCHAR(20) NOT NULL,
    orden                 SMALLINT NOT NULL,
    activo                BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Valores:**
| ID | Descripción | Corta | Orden |
|----|-------------|-------|-------|
| 0  | Cancelada | Cancelada | 3 |
| 1  | En espera de atención | En espera | 1 |
| 2  | Atendida y finalizada | Finalizada | 2 |

**Foreign Key creada:**
```sql
ALTER TABLE consulta
ADD CONSTRAINT fk_consulta_estatus
FOREIGN KEY (estatus_consulta)
REFERENCES estatus_consulta(id_estatus_consulta);
```

---

## 🗄️ TABLA PARENTESCO ACTUALIZADA

Se agregó el registro **"EMPLEADO"** con `id_parentesco = 6`:

| ID | Parentesco |
|----|-----------|
| 1  | Esposo(a) |
| 2  | Hijo(a) |
| 3  | Concubino(a) |
| 4  | Padre |
| 5  | Madre |
| **6**  | **EMPLEADO** ✅ |

---

## 🔧 CONSTANTES DISPONIBLES EN CÓDIGO

```typescript
import { ESTATUS_CONSULTA } from '@/db/schema';

// Usar en el código:
ESTATUS_CONSULTA.CANCELADA   // 0
ESTATUS_CONSULTA.EN_ESPERA   // 1
ESTATUS_CONSULTA.FINALIZADA  // 2
```

---

## 📊 VERIFICACIÓN EN BASE DE DATOS

### Scripts SQL ejecutados:
```bash
✅ CREATE_TABLE_estatus_consulta.sql
✅ ALTER_TABLE_consulta_add_fk_estatus.sql
✅ INSERT parentesco EMPLEADO (id=6)
```

### Consulta de verificación:
```sql
-- Ver estatus disponibles
SELECT * FROM estatus_consulta ORDER BY orden;

-- Ver consultas por estatus
SELECT
    ec.descripcion_corta,
    COUNT(*) as total
FROM consulta c
JOIN estatus_consulta ec ON c.estatus_consulta = ec.id_estatus_consulta
GROUP BY ec.descripcion_corta, ec.orden
ORDER BY ec.orden;

-- Verificar FK
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'consulta'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name = 'fk_consulta_estatus';
```

---

## 🚀 FLUJO DE REGISTRO DE CONSULTAS

Ahora cuando se registra una consulta en `POST /api/consultas/crear`:

1. **Se obtiene automáticamente:**
   - ✅ `id_medico` → del JWT (usuario autenticado)
   - ✅ `id_hospital` → de `usuarios.id_hospital` usando `id_medico`
   - ✅ `id_parentesco` → 6 si es empleado, o busca en `beneficiario.parentesco`
   - ✅ `estatus_consulta` → 1 (En espera) usando constante

2. **Se valida:**
   - Token JWT válido (obligatorio)
   - Datos básicos del paciente
   - Signos vitales mínimos

3. **Se genera:**
   - Folio único automático (C-25-NNNNNN)
   - Snapshot inmutable del paciente

---

## 📝 ARCHIVOS MODIFICADOS/CREADOS

### Archivos SQL (database/)
- ✅ `CREATE_TABLE_estatus_consulta.sql`
- ✅ `ALTER_TABLE_consulta_add_fk_estatus.sql`
- ✅ `INSTRUCCIONES_MIGRACION_ESTATUS.md`

### Schemas Drizzle (src/db/schema/)
- ✅ `estatus_consulta.ts` (nuevo)
- ✅ `consulta.ts` (modificado - agregada FK)
- ✅ `index.ts` (modificado - export estatus_consulta)

### API Routes (src/app/api/)
- ✅ `consultas/crear/route.ts` (3 mejoras + constante estatus)

### Documentación
- ✅ `MIGRACION_COMPLETADA.md` (este archivo)

---

## ⚠️ IMPORTANTE PARA PRODUCCIÓN

Antes de migrar a producción:

1. **Ejecutar scripts SQL en orden:**
   ```bash
   psql -U usuario -d produccion -f database/CREATE_TABLE_estatus_consulta.sql
   psql -U usuario -d produccion -f database/ALTER_TABLE_consulta_add_fk_estatus.sql
   ```

2. **Insertar parentesco EMPLEADO:**
   ```sql
   INSERT INTO parentesco (id_parentesco, parentesco, visible)
   VALUES (6, 'EMPLEADO', 1)
   ON CONFLICT DO NOTHING;
   ```

3. **Verificar que todos los usuarios tienen `id_hospital` asignado:**
   ```sql
   SELECT id_usuario, nombre, id_hospital
   FROM usuarios
   WHERE id_hospital IS NULL;
   ```

---

## 📞 SOPORTE

Para cualquier duda sobre esta migración, revisar:
- `INSTRUCCIONES_MIGRACION_ESTATUS.md`
- `MIGRACION_CONSULTAS_DRIZZLE.md`

---

**Estado:** ✅ COMPLETADO Y VERIFICADO
**Ambiente:** Pruebas (servicio-medico-pruebas)
**Fecha:** 2025-01-15
