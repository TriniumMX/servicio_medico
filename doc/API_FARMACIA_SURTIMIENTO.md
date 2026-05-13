# 📡 APIs del Módulo de Farmacia - Surtimiento

**Fecha de creación:** 05/Diciembre/2025

---

## 📋 Resumen de APIs Implementadas

### ✅ APIs NUEVAS Creadas:
1. **Búsqueda de Recetas** - `/api/recetas/buscar`
2. **Búsqueda de Medicamentos por EAN** - `/api/farmacia/medicamentos/buscar-ean`
3. **Historial de Surtimientos** - `/api/recetas/historial-surtimientos/[id_receta]`

### ✅ APIs MODIFICADAS:
1. **Surtimiento de Medicamentos** - `/api/recetas/surtir` (ahora descuenta inventario automáticamente)

---

## 🔍 1. API de Búsqueda de Recetas

**Endpoint:** `GET /api/recetas/buscar`

**Descripción:** Busca una receta por folio o código de barras y retorna información completa.

### Query Parameters:
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `folio` | string | No* | Folio de receta | `R-2025-000123` |
| `codigo` | string | No* | Código de barras | `2025000123` |

*Al menos uno es requerido

### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": {
    "receta": {
      "id_receta": 1,
      "folio_receta": "R-2025-000123",
      "codigo_barras": "2025000123",
      "fecha_emision": "2025-12-05T10:30:00Z",
      "vigencia_dias": 30,
      "observaciones_generales": null
    },
    "paciente": {
      "nomina": "12345",
      "nombre": "Juan",
      "ape_pat": "Pérez",
      "ape_mat": "García",
      "nombre_completo": "Juan Pérez García"
    },
    "consulta": {
      "folio": "C-2025-000456",
      "diagnostico": "Hipertensión arterial",
      "fecha_consulta": "2025-12-05T09:00:00Z"
    },
    "medicamentos": [
      {
        "id_detalle": 1,
        "medicamento": {
          "id_medicamento": 10,
          "nombre_comercial": "LOSARTAN 50MG",
          "sustancia_activa": "Losartán",
          "clasificacion": "GENERICO",
          "codigo_ean": "7501008493366"
        },
        "prescripcion": {
          "cantidad_total": 90,
          "dosis": "1 tableta cada 12 horas",
          "duracion_tratamiento_dias": 90,
          "via_administracion": "Oral",
          "indicaciones": "Tomar con alimentos"
        },
        "resurtimiento": {
          "realizar_resurtimiento": true,
          "meses_resurtimiento": 3,
          "cupones": [
            {
              "id_control": 1,
              "numero_resurtimiento": 1,
              "estatus": "surtido",
              "fecha_programada": "2025-12-05"
            },
            {
              "id_control": 2,
              "numero_resurtimiento": 2,
              "estatus": "pendiente",
              "fecha_programada": "2026-01-05"
            }
          ]
        },
        "surtimientos": {
          "total_surtido": 30,
          "pendiente_surtir": 60,
          "completado": false,
          "historial": [
            {
              "id_surtimiento": 1,
              "cantidad_surtida": 30,
              "fecha_surtimiento": "2025-12-05T11:00:00Z"
            }
          ]
        }
      }
    ],
    "resumen": {
      "total_medicamentos": 3,
      "medicamentos_completados": 1,
      "medicamentos_pendientes": 2,
      "receta_completada": false
    }
  }
}
```

### Errores:
- **400:** No se proporcionó folio ni código
- **404:** Receta no encontrada
- **500:** Error del servidor

### Uso en Frontend:
```typescript
// Buscar por código de barras (escaneado)
const response = await fetch('/api/recetas/buscar?codigo=2025000123');

// Buscar por folio (manual)
const response = await fetch('/api/recetas/buscar?folio=R-2025-000123');
```

---

## 🔍 2. API de Búsqueda de Medicamentos por EAN

**Endpoint:** `GET /api/farmacia/medicamentos/buscar-ean`

**Descripción:** Busca un medicamento por su código EAN y retorna información del medicamento e inventario actual.

### Query Parameters:
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `ean` | string | Sí | Código EAN del medicamento | `7501008493366` |

### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": {
    "medicamento": {
      "id_medicamento": 10,
      "nombre_comercial": "LOSARTAN 50MG",
      "sustancia_activa": "Losartán",
      "clasificacion": "GENERICO",
      "presentacion_piezas_envase": 30,
      "codigo_ean": "7501008493366",
      "precio_unitario": "125.50"
    },
    "inventario": {
      "id_inventario": 5,
      "piezas_almacen": 450,
      "stock_minimo": 100,
      "stock_maximo": 1000,
      "punto_reorden": 150,
      "es_cuadro_basico": true
    },
    "alertas": {
      "sin_stock": false,
      "stock_bajo": false,
      "stock_critico": false,
      "mensaje": "✅ Stock disponible"
    }
  }
}
```

### Posibles Mensajes de Alerta:
- `✅ Stock disponible` - Stock normal
- `⚠️ Stock bajo` - Stock por debajo del mínimo
- `🔴 Stock crítico` - Stock crítico (50% del mínimo)
- `⛔ Sin stock disponible` - Agotado

### Errores:
- **400:** No se proporcionó el código EAN
- **400:** Medicamento inactivo
- **404:** Medicamento no encontrado
- **404:** Sin registro en inventario
- **500:** Error del servidor

### Uso en Frontend:
```typescript
// Escanear EAN del medicamento
const response = await fetch('/api/farmacia/medicamentos/buscar-ean?ean=7501008493366');
const { data } = await response.json();

// Validar stock antes de surtir
if (data.alertas.sin_stock) {
  alert('⛔ Medicamento agotado');
} else if (data.inventario.piezas_almacen < cantidad_a_surtir) {
  alert(`Stock insuficiente. Disponible: ${data.inventario.piezas_almacen}`);
}
```

---

## 💊 3. API de Surtimiento de Medicamentos (MODIFICADA)

**Endpoint:** `POST /api/recetas/surtir`

**Descripción:** Registra el surtimiento de un medicamento y **descuenta automáticamente del inventario**.

### Cambios Implementados:
- ✅ **Validación de inventario disponible** antes de surtir
- ✅ **Descuento automático** del inventario al surtir
- ✅ **Alertas de stock** (bajo, crítico, agotado)
- ✅ **Información del inventario** en la respuesta

### Body (JSON):
```json
{
  "id_detalle": 1,
  "cantidad_surtida": 30,
  "id_farmaceutico": 5,
  "observaciones": "Surtimiento completo",
  "id_control": 2  // Opcional: ID del cupón específico
}
```

### Respuesta Exitosa (200):
```json
{
  "success": true,
  "message": "Surtimiento registrado exitosamente (Cupón #2)",
  "data": {
    "surtimiento": {
      "id_surtimiento": 15,
      "id_detalle": 1,
      "cantidad_surtida": 30,
      "fecha_surtimiento": "2025-12-05T11:30:00Z",
      "id_farmaceutico": 5,
      "observaciones": "Surtimiento completo"
    },
    "cupon_surtido": {
      "id_control": 2,
      "numero_resurtimiento": 2,
      "estatus": "surtido"
    },
    "resumen": {
      "cantidad_total": 90,
      "total_surtido": 60,
      "pendiente_surtir": 30,
      "completado": false,
      "cupones_pendientes": 1
    },
    "inventario": {
      "stock_anterior": 450,
      "cantidad_descontada": 30,
      "stock_actual": 420,
      "alertas": {
        "stock_bajo": false,
        "stock_critico": false,
        "mensaje": "✅ Stock normal"
      }
    }
  }
}
```

### Errores:
- **400:** Datos faltantes o inválidos
- **400:** Cantidad mayor a lo permitido
- **400:** Stock insuficiente (NUEVO)
- **404:** Detalle de receta no encontrado
- **404:** Sin registro en inventario (NUEVO)
- **500:** Error del servidor

### Validaciones Agregadas:
1. **Verificar inventario disponible**
   ```typescript
   if (inventario.piezas_almacen < cantidad_surtida) {
     return error; // Stock insuficiente
   }
   ```

2. **Descontar del inventario**
   ```sql
   UPDATE inventario_medicamentos
   SET piezas_almacen = piezas_almacen - cantidad_surtida
   WHERE id_medicamento = ?
   ```

3. **Alertas de stock**
   - Stock crítico: ≤ 50% del stock mínimo
   - Stock bajo: ≤ stock mínimo
   - Stock agotado: = 0

---

## 📋 4. API de Historial de Surtimientos

**Endpoint:** `GET /api/recetas/historial-surtimientos/[id_receta]`

**Descripción:** Obtiene el historial completo de surtimientos de una receta.

### URL Parameters:
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `id_receta` | number | Sí | ID de la receta | `1` |

### Respuesta Exitosa (200):
```json
{
  "success": true,
  "data": {
    "receta": {
      "id_receta": 1,
      "folio_receta": "R-2025-000123",
      "fecha_emision": "2025-12-05T10:30:00Z"
    },
    "historial": [
      {
        "medicamento": {
          "id_medicamento": 10,
          "nombre_comercial": "LOSARTAN 50MG",
          "sustancia_activa": "Losartán"
        },
        "prescripcion": {
          "cantidad_total": 90,
          "dosis": "1 tableta cada 12 horas",
          "duracion_tratamiento_dias": 90
        },
        "surtimientos": [
          {
            "id_surtimiento": 1,
            "cantidad_surtida": 30,
            "fecha_surtimiento": "2025-12-05T11:00:00Z",
            "observaciones": null
          },
          {
            "id_surtimiento": 2,
            "cantidad_surtida": 30,
            "fecha_surtimiento": "2026-01-05T10:00:00Z",
            "observaciones": "Resurtimiento mes 2"
          }
        ],
        "resumen": {
          "total_surtido": 60,
          "pendiente_surtir": 30,
          "completado": false,
          "numero_surtimientos": 2
        }
      }
    ],
    "resumen_general": {
      "total_medicamentos": 3,
      "medicamentos_completados": 1,
      "medicamentos_pendientes": 2,
      "total_surtimientos_realizados": 5,
      "receta_completada": false
    }
  }
}
```

### Errores:
- **400:** ID de receta inválido
- **404:** Receta no encontrada
- **500:** Error del servidor

---

## 🔄 Flujo Completo de Surtimiento

### Paso 1: Escanear código de barras de la receta
```typescript
const receta = await fetch('/api/recetas/buscar?codigo=2025000123');
// Retorna: Receta completa con medicamentos y surtimientos previos
```

### Paso 2: Mostrar medicamentos pendientes de surtir
```typescript
const medicamentosPendientes = receta.data.medicamentos.filter(
  m => !m.surtimientos.completado
);
```

### Paso 3: Para cada medicamento a surtir:

#### 3a. Escanear EAN del medicamento
```typescript
const medicamento = await fetch('/api/farmacia/medicamentos/buscar-ean?ean=7501008493366');

// Validar stock
if (medicamento.data.alertas.sin_stock) {
  alert('⛔ Sin stock disponible');
  return;
}

// Validar cantidad disponible
if (medicamento.data.inventario.piezas_almacen < cantidad_a_surtir) {
  alert(`Stock insuficiente. Disponible: ${medicamento.data.inventario.piezas_almacen}`);
  return;
}
```

#### 3b. Confirmar y registrar surtimiento
```typescript
const surtimiento = await fetch('/api/recetas/surtir', {
  method: 'POST',
  body: JSON.stringify({
    id_detalle: medicamento.id_detalle,
    cantidad_surtida: 30,
    id_farmaceutico: usuarioActual.id,
    observaciones: 'Surtimiento normal'
  })
});

// Respuesta incluye:
// - Surtimiento registrado
// - Cupón marcado como surtido (si aplica)
// - Inventario actualizado automáticamente
// - Alertas de stock
```

### Paso 4: Ver historial completo (opcional)
```typescript
const historial = await fetch(`/api/recetas/historial-surtimientos/${receta.data.receta.id_receta}`);
// Retorna: Historial completo de todos los surtimientos
```

---

## 🎯 Características Clave

### 1. Descuento Automático de Inventario
- Al surtir un medicamento, el inventario se descuenta **automáticamente**
- No es necesario hacer una llamada adicional para actualizar inventario
- El proceso es **atómico** (se registra el surtimiento y se descuenta en la misma transacción)

### 2. Validaciones de Stock
- **Antes de surtir:** Verifica que hay suficiente stock disponible
- **Después de surtir:** Genera alertas si el stock quedó bajo/crítico
- **Prevención de errores:** No permite surtir si no hay stock suficiente

### 3. Trazabilidad Completa
- Cada surtimiento queda registrado con fecha, cantidad y farmacéutico
- Historial completo disponible por receta
- Cupones de resurtimiento marcados automáticamente

### 4. Códigos de Barras
- **Recetas:** Formato `2025000123` (año + número)
- **Medicamentos:** Formato EAN estándar (ej: `7501008493366`)
- Compatible con scanners estándar CODE128

---

## 📊 Logs de Consola

### API de Búsqueda de Recetas:
```
🔍 [Buscar Receta] Buscando folio: R-2025-000123
✅ [Buscar Receta] Receta encontrada: R-2025-000123
   📊 Medicamentos: 1/3 surtidos
```

### API de Búsqueda por EAN:
```
🔍 [Buscar EAN] Buscando medicamento con EAN: 7501008493366
✅ [Buscar EAN] Medicamento encontrado: LOSARTAN 50MG
   📦 Stock actual: 450 piezas
```

### API de Surtimiento:
```
📦 [Surtir] Stock actual: 450 piezas
📤 [Surtir] A descontar: 30 piezas
✅ [Surtir] Inventario actualizado. Nuevo stock: 420 piezas
✅ Cupón #2 marcado como surtido
```

### API de Historial:
```
📋 [Historial] Obteniendo surtimientos de receta: 1
✅ [Historial] 5 surtimientos encontrados
```

---

## 🧪 Pruebas Recomendadas

### Test 1: Búsqueda por Código de Barras
```bash
curl "http://localhost:3000/api/recetas/buscar?codigo=2025000123"
```

### Test 2: Búsqueda por EAN
```bash
curl "http://localhost:3000/api/farmacia/medicamentos/buscar-ean?ean=7501008493366"
```

### Test 3: Surtimiento con Descuento de Inventario
```bash
curl -X POST http://localhost:3000/api/recetas/surtir \
  -H "Content-Type: application/json" \
  -d '{
    "id_detalle": 1,
    "cantidad_surtida": 30,
    "id_farmaceutico": 5
  }'
```

### Test 4: Historial de Surtimientos
```bash
curl "http://localhost:3000/api/recetas/historial-surtimientos/1"
```

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
1. `src/app/api/recetas/buscar/route.ts`
2. `src/app/api/farmacia/medicamentos/buscar-ean/route.ts`
3. `src/app/api/recetas/historial-surtimientos/[id_receta]/route.ts`

### Archivos Modificados:
1. `src/app/api/recetas/surtir/route.ts` (agregado descuento de inventario)

---

## ✅ Backend Completo

Todo el backend necesario para el módulo de Farmacia - Surtimiento está **100% implementado**:

- ✅ Búsqueda de recetas por código de barras
- ✅ Búsqueda de medicamentos por EAN
- ✅ Surtimiento con descuento automático de inventario
- ✅ Validaciones de stock completas
- ✅ Sistema de cupones de resurtimiento
- ✅ Historial completo de surtimientos
- ✅ Alertas de stock (bajo, crítico, agotado)
- ✅ Logs detallados para debugging

**Siguiente paso:** Implementar el frontend del módulo de Farmacia - Surtimiento.

---

**Última actualización:** 05/Diciembre/2025 - Hora actual
