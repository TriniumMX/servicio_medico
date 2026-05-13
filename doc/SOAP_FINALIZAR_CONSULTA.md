# 📋 Finalización de Consultas - Módulo SOAP

## 🎯 Objetivo

Implementar el flujo completo de finalización de consultas médicas usando **solo PostgreSQL**, eliminando toda la lógica de SQL Server.

---

## 🔄 FLUJO COMPLETO DE LA CONSULTA

### **1️⃣ SIGNOS VITALES** ✅ (Ya implementado)
- **Endpoint:** `POST /api/consultas/crear`
- **Acción:** Crea registro en tabla `consulta` con `estatus_consulta = 1` (En espera)
- **Tabla:** `consulta` (PostgreSQL)
- **Campos llenados:**
  - Datos del paciente (snapshot)
  - Signos vitales
  - `id_medico`, `id_hospital`, `id_parentesco` (automáticos)
  - Folio único generado

---

### **2️⃣ SOA - Atención Médica (Hoja 1)** ✅
- **Página:** `/dashboard/consultas/diagnostico/atender/[id]`
- **Acción:** El médico llena:
  - **S (Subjetivo)**: Lo que el paciente refiere
  - **O (Objetivo)**: Lo que el médico observa
  - **A (Assessment)**: Diagnóstico CIE-11
  - **Análisis**: Notas adicionales

- **Storage:** Se guarda en `localStorage` con la key `nota_medica_en_progreso`
- **Estructura del cache:**
```typescript
{
  id_consulta: number,        // ⚠️ CRÍTICO para el UPDATE
  timestamp: string,
  hoja_actual: 1,
  datos_soap: {
    paciente: PacienteEnEspera,
    subjetivo: string,
    objetivo: string,
    diagnostico: {
      codigo: string,
      titulo: string,
      capitulo: string
    },
    analisis: string
  },
  datos_plan: null
}
```

---

### **3️⃣ P (Plan) - Segunda hoja** ⚠️ (Módulos pendientes)
- **Página:** `/dashboard/consultas/diagnostico/plan/[id]`
- **Opciones disponibles:**
  - ☐ **Medicamentos** (por desarrollar)
  - ☐ **Incapacidad** (por desarrollar)
  - ☐ **Especialidad/Referencia** (por desarrollar)
  - ☐ **Laboratorio/Estudios** (por desarrollar)
  - ☐ **NADA** (puede omitir el plan completamente)

- **Acción:** Se actualiza el cache agregando `datos_plan`:
```typescript
{
  ...cache_anterior,
  datos_plan: {
    opciones: {
      medicamentos: boolean,
      incapacidad: boolean,
      especialidad: boolean,
      laboratorio: boolean
    }
  }
}
```

---

### **4️⃣ FINALIZAR CONSULTA** ✅ (Implementado)
- **Endpoint:** `POST /api/consultas/finalizar`
- **Body:** Todo el cache completo
- **Acción:**
  1. Valida que exista la consulta
  2. Valida que no esté ya finalizada
  3. Hace **UPDATE** en tabla `consulta`:
     - `subjetivo`, `objetivo`, `analisis`
     - `cie11_codigo`, `cie11_titulo`, `cie11_capitulo`
     - `plan` (como JSON string)
     - `se_asigno_incapacidad`, `tiene_referencia`, `tiene_estudios_laboratorio`
     - **`estatus_consulta = 2`** (Atendida/Finalizada) ⚠️ CRÍTICO
  4. Limpia el localStorage
  5. Redirige a `/dashboard/consultas/diagnostico`

---

## 📁 ARCHIVOS MODIFICADOS

### **1. Endpoint de finalizar**
**Archivo:** `src/app/api/consultas/finalizar/route.ts`

**Cambios:**
- ❌ **ELIMINADO:** Toda la lógica de SQL Server (NotaMedica, detalleReceta, SURTIMIENTOS, etc.)
- ✅ **AGREGADO:** UPDATE simple en tabla `consulta` con Drizzle ORM
- ✅ **AGREGADO:** Validación de que la consulta exista y no esté finalizada
- ✅ **AGREGADO:** Cambio de `estatus_consulta` a `FINALIZADA` (2)

```typescript
await db
  .update(consulta)
  .set({
    cie11Codigo: cie_codigo,
    cie11Titulo: cie_titulo,
    cie11Capitulo: cie_capitulo,
    subjetivo: datos_soap.subjetivo,
    objetivo: datos_soap.objetivo,
    analisis: datos_soap.analisis,
    plan: datos_plan ? JSON.stringify(datos_plan) : null,
    seAsignoIncapacidad: opciones.incapacidad,
    tieneReferencia: opciones.especialidad,
    tieneEstudiosLaboratorio: opciones.laboratorio,
    estatusConsulta: ESTATUS_CONSULTA.FINALIZADA, // 2
    actualizadoEn: new Date(),
  })
  .where(eq(consulta.idConsulta, id_consulta));
```

---

### **2. Tipo CacheNotaMedica**
**Archivo:** `src/types/consultas.ts`

**Cambios:**
- ✅ **AGREGADO:** Campo `id_consulta: number` (OBLIGATORIO)

```typescript
export interface CacheNotaMedica {
  id_consulta: number; // ⚠️ IMPORTANTE: Necesario para el UPDATE
  timestamp: string;
  hoja_actual: number;
  datos_soap: DatosSOAP | null;
  datos_plan: DatosPlan | null;
  sindicato?: string | null;
}
```

---

### **3. Página SOA (Hoja 1)**
**Archivo:** `src/app/dashboard/consultas/diagnostico/atender/[id]/page.tsx`

**Cambios:**
- ✅ **AGREGADO:** `id_consulta` al cache en función `guardarEnCache()`
- ✅ **MODIFICADO:** Validación en `cargarDatosCache()` para verificar `id_consulta` en lugar de `id_signo_vital`

```typescript
const cache: CacheNotaMedica = {
  id_consulta: paciente.id_consulta, // ⚠️ IMPORTANTE
  timestamp: new Date().toISOString(),
  hoja_actual: 1,
  datos_soap: datosSOAP,
  datos_plan: null
};
```

---

### **4. Página Plan (Hoja 2)**
**Archivo:** `src/app/dashboard/consultas/diagnostico/plan/[id]/page.tsx`

**Cambios:**
- ✅ **MODIFICADO:** Mensaje de éxito usa la nueva estructura `data.data.folio`
- ✅ **CONFIRMADO:** Redirige a `/dashboard/consultas/diagnostico` después de finalizar

---

## 🗄️ TABLA `consulta` - Campos del SOAP

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cie11_codigo` | VARCHAR(15) | Código CIE-11 del diagnóstico |
| `cie11_titulo` | TEXT | Título completo del diagnóstico |
| `cie11_capitulo` | VARCHAR(15) | Capítulo CIE-11 |
| `subjetivo` | TEXT | Nota subjetiva (SOAP) |
| `objetivo` | TEXT | Nota objetiva (SOAP) |
| `analisis` | TEXT | Análisis del diagnóstico |
| `plan` | TEXT | Plan de tratamiento (JSON) |
| `se_asigno_incapacidad` | BOOLEAN | Flag: ¿tiene incapacidad? |
| `tiene_referencia` | BOOLEAN | Flag: ¿tiene referencia? |
| `tiene_estudios_laboratorio` | BOOLEAN | Flag: ¿tiene estudios? |
| `estatus_consulta` | SMALLINT | **1=En espera, 2=Finalizada** |
| `actualizado_en` | TIMESTAMPTZ | Timestamp de última actualización |

---

## 🚀 FLUJO DE ESTADOS

```
SIGNOS VITALES      →  estatus_consulta = 1 (En espera)
       ↓
   ATENDER          →  Solo guarda en localStorage
       ↓
     PLAN           →  Solo guarda en localStorage
       ↓
  FINALIZAR         →  estatus_consulta = 2 (Finalizada)
                       + UPDATE campos SOAP en BD
```

---

## 📊 CONSULTA SQL PARA VERIFICAR

```sql
-- Ver consultas por estatus
SELECT
    c.id_consulta,
    c.folio,
    c.nombre AS paciente,
    ec.descripcion_corta AS estatus,
    c.cie11_codigo,
    c.cie11_titulo,
    c.fecha_consulta,
    c.actualizado_en
FROM consulta c
JOIN estatus_consulta ec ON c.estatus_consulta = ec.id_estatus_consulta
WHERE c.estatus_activo = true
ORDER BY c.fecha_consulta DESC;

-- Ver solo pacientes en espera
SELECT * FROM consulta
WHERE estatus_consulta = 1
  AND estatus_activo = true
  AND DATE(fecha_consulta) = CURRENT_DATE;

-- Ver solo pacientes atendidos hoy
SELECT * FROM consulta
WHERE estatus_consulta = 2
  AND estatus_activo = true
  AND DATE(fecha_consulta) = CURRENT_DATE;
```

---

## ⚠️ IMPORTANTE

1. **Pacientes atendidos NO aparecen en la lista "En espera"** porque tienen `estatus_consulta = 2`
2. **El endpoint `/api/consultas/hoy` debe filtrar por `estatus_consulta = 1`** para mostrar solo pacientes en espera
3. **El cache se limpia automáticamente** después de finalizar la consulta
4. **Los módulos del Plan (medicamentos, incapacidad, etc.) se desarrollarán después**

---

## 🔜 PRÓXIMOS PASOS

1. ✅ Endpoint de finalizar → **COMPLETADO**
2. ✅ Flujo completo SOA → **COMPLETADO**
3. ⚠️ Verificar filtro en `/api/consultas/hoy` para que solo muestre `estatus_consulta = 1`
4. ⏳ Desarrollar módulo de **Medicamentos**
5. ⏳ Desarrollar módulo de **Incapacidad**
6. ⏳ Desarrollar módulo de **Especialidad/Referencia**
7. ⏳ Desarrollar módulo de **Laboratorio**

---

**Estado:** ✅ SOAP FINALIZADO Y FUNCIONAL
**Base de datos:** PostgreSQL únicamente
**Fecha:** 2025-01-15
