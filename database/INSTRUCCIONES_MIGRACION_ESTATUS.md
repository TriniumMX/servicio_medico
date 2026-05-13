# 📋 Instrucciones de Migración - Tabla estatus_consulta

## 🎯 Objetivo

Crear tabla catálogo `estatus_consulta` y establecer relación FK con la tabla `consulta`.

---

## ⚠️ IMPORTANTE: Orden de Ejecución

Ejecuta los scripts SQL en el siguiente orden:

### 1️⃣ Crear tabla `estatus_consulta`

```bash
psql -U tu_usuario -d tu_base_datos -f database/CREATE_TABLE_estatus_consulta.sql
```

### 2️⃣ Agregar Foreign Key en tabla `consulta`

```bash
psql -U tu_usuario -d tu_base_datos -f database/ALTER_TABLE_consulta_add_fk_estatus.sql
```

---

## 🔍 Verificación

### Verificar que la tabla se creó correctamente

```sql
SELECT * FROM estatus_consulta ORDER BY orden;
```

**Resultado esperado:**
```
 id_estatus_consulta |      descripcion       | descripcion_corta | orden | activo
---------------------+------------------------+-------------------+-------+--------
                   1 | En espera de atención  | En espera         |     1 | t
                   2 | Atendida y finalizada  | Finalizada        |     2 | t
                   0 | Cancelada              | Cancelada         |     3 | t
```

### Verificar la Foreign Key

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'consulta'
    AND kcu.column_name = 'estatus_consulta';
```

**Resultado esperado:**
```
   constraint_name    | table_name |    column_name    | foreign_table_name | foreign_column_name
----------------------+------------+-------------------+--------------------+---------------------
 fk_consulta_estatus  | consulta   | estatus_consulta  | estatus_consulta   | id_estatus_consulta
```

---

## 📝 Cambios en el Código

### Archivos Creados/Modificados

1. **`database/CREATE_TABLE_estatus_consulta.sql`** - Script de creación
2. **`database/ALTER_TABLE_consulta_add_fk_estatus.sql`** - Script para agregar FK
3. **`src/db/schema/estatus_consulta.ts`** - Schema Drizzle nuevo
4. **`src/db/schema/index.ts`** - Exporta el nuevo schema
5. **`src/db/schema/consulta.ts`** - Actualizado con FK a estatus_consulta
6. **`src/app/api/consultas/crear/route.ts`** - 3 mejoras implementadas:
   - ✅ `id_parentesco`: Lógica correcta (empleado=5, beneficiario=buscar en tabla)
   - ✅ `id_hospital`: Se obtiene automáticamente del usuario autenticado
   - ✅ `id_medico`: Se obtiene del JWT
   - ✅ `estatus_consulta`: Usa constante `ESTATUS_CONSULTA.EN_ESPERA`

---

## 🔑 Constantes Disponibles

En el código puedes usar las constantes:

```typescript
import { ESTATUS_CONSULTA } from '@/db/schema';

ESTATUS_CONSULTA.CANCELADA   // 0
ESTATUS_CONSULTA.EN_ESPERA   // 1
ESTATUS_CONSULTA.FINALIZADA  // 2
```

---

## 🚀 Próximos Pasos

1. Ejecutar los scripts SQL en orden
2. Verificar que no hay errores en la BD
3. Probar la creación de consultas desde el frontend
4. Verificar que los campos se llenan correctamente:
   - `id_medico` → del JWT
   - `id_hospital` → de la tabla usuarios
   - `id_parentesco` → 5 para empleados, buscar en beneficiario para beneficiarios
   - `estatus_consulta` → 1 (En espera)

---

**Fecha:** Enero 2025
**Versión:** 1.0.0
