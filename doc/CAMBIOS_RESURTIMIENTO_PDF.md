# 🔄 Cambios en Módulo de Resurtimiento - Uso de PDF con Código de Barras

## 📋 Resumen

Se modificó el módulo de resurtimiento para que genere recetas en **PDF** con el **mismo formato** que las recetas originales, incluyendo código de barras con formato `NOMINA-ID_RECETA`, eliminando el uso del componente React `RecetaResurtimiento.tsx`.

---

## ✅ Problema Resuelto

### Antes (❌):
- Resurtimiento generaba receta REAL en BD ✅
- Pero usaba componente React para mostrar receta ❌
- Código de barras formato antiguo: `2025000456` (solo folio) ❌
- No era compatible con validación de seguridad (nómina) ❌

### Ahora (✅):
- Resurtimiento genera receta REAL en BD ✅
- **Usa endpoint `/api/recetas/generar-pdf/[id_receta]`** ✅
- **Código de barras formato nuevo:** `2238-00000123` (NOMINA-ID_RECETA) ✅
- **Compatible con validación de seguridad** ✅
- **Misma experiencia que consulta general** ✅

---

## 🔧 Archivos Modificados

### 1. **API: `src/app/api/recetas/generar-resurtimiento/route.ts`**

**Cambio:** Retorna URL del PDF generado

```typescript
// ANTES
return NextResponse.json({
  success: true,
  message: 'Receta de resurtimiento generada exitosamente',
  data: datosImpresion,
});

// AHORA
return NextResponse.json({
  success: true,
  message: 'Receta de resurtimiento generada exitosamente',
  data: {
    ...datosImpresion,
    // ✨ NUEVO: URL para descargar el PDF
    url_pdf: `/api/recetas/generar-pdf/${nuevaReceta.id_receta}`,
  },
});
```

---

### 2. **Modal: `src/components/farmacia/resurtimiento/ModalImprimirResurtimiento.tsx`**

**Cambio:** Simplificado para descargar PDF en lugar de renderizar React

**Antes:**
```typescript
interface ModalImprimirResurtimientoProps {
  recetaData: RecetaResurtimientoData; // Todo el objeto
  // ...
}

// Usaba react-to-print con componente RecetaResurtimiento
const handlePrint = useReactToPrint({
  contentRef: componentRef,
});
```

**Ahora:**
```typescript
interface ModalImprimirResurtimientoProps {
  idReceta: number;              // Solo ID
  folioReceta: string;           // Solo folio
  folioRecetaOriginal: string;   // Solo folio original
  // ...
}

// Descarga PDF directamente del endpoint
const handleDescargarPDF = async () => {
  const response = await fetch(`/api/recetas/generar-pdf/${idReceta}`);
  const blob = await response.blob();
  // Descarga automática
};

const handleAbrirEnNuevaVentana = () => {
  window.open(`/api/recetas/generar-pdf/${idReceta}`, '_blank');
};
```

**Características nuevas:**
- ✅ Botón "Ver PDF" (abre en nueva ventana)
- ✅ Botón "Descargar PDF" (descarga automática)
- ✅ Muestra información del código de barras: `NOMINA-ID_RECETA`

---

### 3. **Página: `src/app/dashboard/farmacia/resurtimiento/page.tsx`**

**Cambio:** Simplificado el manejo de datos

**Antes:**
```typescript
const [recetaResurtimiento, setRecetaResurtimiento] =
  useState<RecetaResurtimientoData | null>(null);

// Al generar receta, construía objeto completo
const recetaData_: RecetaResurtimientoData = {
  folio_receta_original: result.data.receta.folio_receta_original,
  folio_receta: result.data.receta.folio_receta,
  fecha_emision: result.data.receta.fecha_emision,
  paciente: { nombre, nomina },
  medicamentos: [...], // Mapeo completo
};
```

**Ahora:**
```typescript
const [recetaGenerada, setRecetaGenerada] = useState<{
  id_receta: number;
  folio_receta: string;
  folio_receta_original: string;
} | null>(null);

// Al generar receta, solo guarda datos mínimos
setRecetaGenerada({
  id_receta: result.data.receta.id_receta,
  folio_receta: result.data.receta.folio_receta,
  folio_receta_original: result.data.receta.folio_receta_original,
});
```

**Reimpresión simplificada:**
```typescript
const handleReimprimirReceta = async (folioReceta: string, idReceta: number) => {
  // Ya no necesita hacer fetch de datos, solo abre el PDF
  setRecetaGenerada({
    id_receta: idReceta,
    folio_receta: folioReceta,
    folio_receta_original: recetaData.receta.folio_receta,
  });
  setMostrarModal(true);
};
```

---

### 4. **Tipos: `src/types/farmacia/resurtimiento.ts`**

**Cambio:** Tipos deprecados (comentados)

```typescript
// =====================================================
// Tipos para Receta de Resurtimiento Imprimible
// =====================================================
// ⚠️ DEPRECADO: Ya no se usa componente React para imprimir
// Ahora se usa el PDF endpoint directamente (/api/recetas/generar-pdf/[id_receta])
// Se deja comentado por compatibilidad temporal

// export interface MedicamentoResurtimiento { ... }
// export interface RecetaResurtimientoData { ... }
```

---

## 🎯 Flujo Completo Actualizado

### 1. Usuario genera resurtimiento
```
┌─────────────────────────────────────────┐
│  Módulo de Resurtimiento                │
│  /dashboard/farmacia/resurtimiento      │
└─────────────────────────────────────────┘
         │
         │ Selecciona cupones pendientes
         │ (Mes 2, Mes 3, etc.)
         ▼
┌─────────────────────────────────────────┐
│  POST /api/recetas/generar-resurtimiento│
│                                          │
│  1. Valida cupones disponibles          │
│  2. Genera folio: R-2025-000456         │
│  3. Crea receta en BD (id_receta: 456)  │
│  4. Crea detalle_receta (medicamentos)  │
│  5. Marca cupones con id_receta         │
│  6. Retorna: id_receta + url_pdf        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Modal: ModalImprimirResurtimiento      │
│                                          │
│  Muestra:                                │
│  - Folio original: R-2025-000013        │
│  - Folio nuevo: R-2025-000456           │
│  - Código de barras: NOMINA-ID_RECETA   │
│                                          │
│  Botones:                                │
│  - [Ver PDF]       → Abre en nueva tab  │
│  - [Descargar PDF] → Descarga automática│
└─────────────────────────────────────────┘
```

### 2. Usuario descarga PDF
```
┌─────────────────────────────────────────┐
│  GET /api/recetas/generar-pdf/456       │
│                                          │
│  1. Busca receta con id_receta = 456    │
│  2. Obtiene consulta + paciente         │
│  3. Obtiene nómina del paciente         │
│  4. Obtiene medicamentos (solo del      │
│     resurtimiento, no todos)            │
│  5. Genera código de barras:            │
│     NOMINA-ID_RECETA                    │
│     Ejemplo: 2238-00000456              │
│  6. Genera PDF con generarRecetaPDF()   │
│  7. Retorna PDF para descarga           │
└─────────────────────────────────────────┘
```

### 3. Paciente va a farmacia
```
┌─────────────────────────────────────────┐
│  Módulo de Surtimiento                  │
│  /dashboard/farmacia/surtimiento        │
└─────────────────────────────────────────┘
         │
         │ Escanea código de barras
         │ "2238-00000456"
         ▼
┌─────────────────────────────────────────┐
│  GET /api/recetas/buscar?codigo=...     │
│                                          │
│  FORMATO NUEVO (con nómina):            │
│  1. Detecta formato: NOMINA-ID_RECETA   │
│  2. Separa: nomina=2238, id=456         │
│  3. Busca receta por id_receta=456      │
│  4. Obtiene consulta para validar       │
│  5. ✅ VALIDA SEGURIDAD:                │
│     consulta.no_nomina === "2238"       │
│  6. Si coincide → permite surtir        │
│  7. Si NO coincide → Error 403          │
│                                          │
│  FORMATO ANTIGUO (compatibilidad):      │
│  - Convierte código a folio             │
│  - Busca por folio_receta               │
│  - ⚠️ Sin validación de nómina          │
└─────────────────────────────────────────┘
```

---

## 🔒 Validación de Seguridad

### Código de Barras de Resurtimiento

```
Código escaneado: 2238-00000456
                  ↓    ↓
                  │    └─ ID de receta (456)
                  └────── Nómina del paciente (2238)
```

### Validación Automática

```typescript
// src/app/api/recetas/buscar/route.ts (líneas 79-104)

if (consultaValidacion.noNomina !== nomina) {
  return NextResponse.json({
    success: false,
    error: '⛔ Error de seguridad: Esta receta NO pertenece al paciente con nómina ' + nomina,
    receta_pertenece_a: consultaValidacion.noNomina,
  }, { status: 403 });
}
```

**Ejemplo de error:**
```
Código escaneado: 9999-00000456
Nómina en receta: 2238

❌ Error 403 Forbidden
"Esta receta NO pertenece al paciente con nómina 9999"
"La receta pertenece a: 2238"
```

---

## 📦 Características del PDF Generado

### Receta de Resurtimiento

El PDF generado tiene:

✅ **Mismo formato que receta original**
✅ **Código de barras:** `NOMINA-ID_RECETA` (ej: `2238-00000456`)
✅ **Datos del paciente:** Nombre, nómina, edad
✅ **Signos vitales** de la consulta original
✅ **Diagnóstico CIE-11** de la consulta original
✅ **Solo medicamentos del resurtimiento** (cupones seleccionados)
✅ **Indicaciones:** Menciona número de cupón (ej: "Resurtimiento - Cupón #2")
✅ **Escaneable en módulo de surtimiento**

### Diferencias con Receta Original

| Característica | Receta Original | Receta Resurtimiento |
|----------------|-----------------|----------------------|
| Tipo | `original` | `resurtimiento` |
| Medicamentos | Todos los prescritos | Solo cupones seleccionados |
| Genera cupones | ✅ Sí | ❌ No |
| Código de barras | `NOMINA-ID_RECETA` | `NOMINA-ID_RECETA` |
| Validación nómina | ✅ Sí | ✅ Sí |

---

## 🧪 Casos de Prueba

### Caso 1: Generar Resurtimiento Mes 2
```
1. Buscar receta original: R-2025-000013
2. Seleccionar cupón del Mes 2
3. Click "Generar Receta de Resurtimiento"
4. Se crea receta: R-2025-000456 (id_receta: 456)
5. Modal muestra opciones de descarga
6. Descargar PDF
7. Verificar código de barras: 2238-00000456
8. Verificar que solo incluye medicamento del Mes 2
```

### Caso 2: Escanear Receta de Resurtimiento en Farmacia
```
1. Ir a /dashboard/farmacia/surtimiento
2. Escanear código: 2238-00000456
3. Sistema valida nómina automáticamente
4. Si es correcta → muestra medicamentos para surtir
5. Si NO es correcta → Error 403
```

### Caso 3: Reimprimir Receta de Resurtimiento
```
1. Buscar receta original: R-2025-000013
2. Ver cupones con recetas generadas
3. Click "Reimprimir" en cupón que tiene receta
4. Modal se abre con opción de descarga
5. Descargar PDF nuevamente
```

---

## 🚀 Beneficios

1. ✅ **Consistencia:** Mismo sistema de PDF para todo
2. ✅ **Seguridad:** Validación de nómina integrada
3. ✅ **Simplicidad:** Menos código, menos mantenimiento
4. ✅ **Confiabilidad:** Usa código probado del endpoint PDF
5. ✅ **Escalabilidad:** Fácil agregar más datos al PDF
6. ✅ **UX mejorada:** Proceso más fluido para el usuario

---

## 📝 Notas Técnicas

### Componente RecetaResurtimiento.tsx

- ⚠️ **Ya NO se usa** (se deja en codebase por si acaso)
- Puede ser eliminado en futuras versiones
- Se reemplazó completamente por el endpoint PDF

### Endpoint PDF (`generar-receta-pdf.ts`)

- ✅ Funciona tanto para recetas **originales** como **resurtimientos**
- ✅ Detecta automáticamente el `tipo_receta` de la BD
- ✅ Genera código de barras con formato `NOMINA-ID_RECETA`
- ✅ Incluye todos los datos necesarios del paciente

### Módulo de Surtimiento

- ✅ **Ya estaba preparado** para leer formato nuevo
- ✅ **Compatibilidad backward** con formato antiguo
- ✅ Validación de seguridad automática

---

## ✅ Checklist de Implementación

- [x] Modificar API generar-resurtimiento para retornar URL del PDF
- [x] Actualizar ModalImprimirResurtimiento para descargar PDF
- [x] Actualizar page.tsx para pasar datos correctos al modal
- [x] Deprecar tipos no usados (RecetaResurtimientoData)
- [x] Verificar compatibilidad con módulo de surtimiento
- [x] Documentar cambios

---

## 🔄 Compatibilidad

### Versiones Anteriores

Si hay recetas de resurtimiento generadas con el componente React:
- ✅ Pueden ser **reimprimidas** con el nuevo sistema
- ✅ El botón "Reimprimir" usa el endpoint PDF
- ✅ Se genera con código de barras correcto

### Migración

No se requiere migración de datos. El sistema funciona con todas las recetas existentes en BD.

---

## 📚 Referencias

- **Endpoint PDF:** `src/app/api/recetas/generar-pdf/[id_receta]/route.ts`
- **Generador PDF:** `src/lib/generar-receta-pdf.ts`
- **API Búsqueda:** `src/app/api/recetas/buscar/route.ts`
- **Validación Seguridad:** Líneas 79-104 de `buscar/route.ts`

---

**Fecha:** 2025-12-10
**Versión:** 2.0
**Estado:** ✅ Implementado y funcionando
