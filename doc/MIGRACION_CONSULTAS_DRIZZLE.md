# 📋 Migración de Signos Vitales a Tabla Consulta con Drizzle ORM

## 🎯 Objetivo

Migrar la lógica de signos vitales desde una tabla independiente hacia la tabla principal `consulta`, utilizando **Drizzle ORM** como manejador de base de datos PostgreSQL.

---

## 📦 Archivos Creados/Modificados

### **Nuevos Archivos**

1. **`drizzle.config.ts`** - Configuración de Drizzle Kit
2. **`src/db/index.ts`** - Conexión principal de Drizzle
3. **`src/db/schema/parentesco.ts`** - Schema de tabla parentesco
4. **`src/db/schema/consulta.ts`** - Schema principal de consulta
5. **`src/db/schema/index.ts`** - Exportador de schemas
6. **`src/lib/generar-folio.ts`** - Utilidad para generar folios únicos
7. **`database/CREATE_TABLE_consulta.sql`** - Script SQL de migración

### **Archivos Modificados**

1. **`src/app/api/consultas/crear/route.ts`** - Crear consulta con Drizzle
2. **`src/app/api/consultas/hoy/route.ts`** - Listar consultas del día
3. **`src/app/api/consultas/[id]/signos-vitales/route.ts`** - Obtener consulta por ID
4. **`src/app/api/consultas/finalizar/route.ts`** - Finalizar consulta

---

## 🗄️ Estructura de la Tabla `consulta`

### **Campos Principales**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_consulta` | BIGSERIAL | ID autoincremental |
| `folio` | VARCHAR(30) | Folio único: C-25-000123 |
| `id_beneficiario` | BIGINT | Relación con padrón |
| `no_nomina` | VARCHAR(10) | Número de nómina |
| `nombre` | VARCHAR(200) | Snapshot del nombre del paciente |
| `edad` | SMALLINT | Edad en años |
| `sexo` | CHAR(1) | M/F |
| `id_parentesco` | BIGINT | FK a tabla parentesco |
| `departamento` | VARCHAR(200) | Departamento del empleado |
| `sindicato` | VARCHAR(10) | Sindicato |
| `es_empleado` | BOOLEAN | true=empleado, false=beneficiario |

### **Signos Vitales** 🫀

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `temperatura_c` | NUMERIC(4,1) | Temperatura en °C (36.7) |
| `ta_sistolica` | SMALLINT | Presión sistólica (120) |
| `ta_diastolica` | SMALLINT | Presión diastólica (80) |
| `frecuencia_cardiaca` | SMALLINT | Frecuencia cardíaca (72) |
| `oxigenacion` | SMALLINT | Saturación O₂ (98%) |
| `altura_cm` | NUMERIC(5,1) | Altura en cm (170.5) |
| `peso_kg` | NUMERIC(6,1) | Peso en kg (72.3) |
| `glucosa_mg_dl` | SMALLINT | Glucosa en mg/dL (110) |

### **Diagnóstico y SOAP**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cie11_codigo` | VARCHAR(15) | Código CIE-11 |
| `cie11_titulo` | TEXT | Título del diagnóstico |
| `cie11_capitulo` | VARCHAR(15) | Capítulo CIE-11 |
| `subjetivo` | TEXT | Nota subjetiva (SOAP) |
| `objetivo` | TEXT | Nota objetiva (SOAP) |
| `analisis` | TEXT | Análisis (SOAP) |
| `plan` | TEXT | Plan de tratamiento (JSON) |

### **Estatus**

| Valor | Significado |
|-------|-------------|
| 0 | Cancelada |
| 1 | En espera (registrada) |
| 2 | Atendida/Finalizada |

---

## 🔧 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install drizzle-orm drizzle-kit
```

### 2. Crear las tablas en PostgreSQL

```bash
# Crear tabla consulta
psql -U tu_usuario -d tu_base_datos -f database/CREATE_TABLE_consulta.sql

# Insertar parentesco "EMPLEADO" (requerido para empleados)
psql -U tu_usuario -d tu_base_datos -f database/INSERT_parentesco_empleado.sql
```

### 3. Variables de entorno

Asegúrate de tener configuradas en `.env`:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=tu_usuario
PGPASSWORD=tu_contraseña
PGDATABASE=tu_base_datos
```

---

## 📡 API Endpoints Actualizados

### **POST /api/consultas/crear**

Crea una nueva consulta con signos vitales integrados.

**Body:**
```json
{
  "clavenomina": "12345",
  "clavepaciente": 123,
  "nombrepaciente": "Juan Pérez",
  "departamento": "Recursos Humanos",
  "edad": 35,
  "sexo": "M",
  "elpacienteesempleado": true,
  "parentesco": 1,
  "sindicato": "STPS",
  "presionarterialpaciente": "120/80",
  "temperaturapaciente": "36.5",
  "pulsosxminutopaciente": "72",
  "respiracionpaciente": "98",
  "estaturapaciente": "175",
  "pesopaciente": "75.5",
  "glucosapaciente": "95",
  "motivo_consulta": "Consulta de rutina"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consulta creada exitosamente",
  "data": {
    "id_consulta": 1,
    "folio": "C-25-000001"
  }
}
```

---

### **GET /api/consultas/hoy?clavestatus=1**

Obtiene consultas del día actual por estatus.

**Query params:**
- `clavestatus`: 0, 1 o 2

**Response:**
```json
{
  "success": true,
  "consultas": [
    {
      "id_consulta": 1,
      "folio": "C-25-000001",
      "no_nomina": "12345",
      "nombre": "Juan Pérez",
      "edad": 35,
      "sexo": "M",
      "es_empleado": true,
      "departamento": "Recursos Humanos",
      "estatus_consulta": 1,
      "presion_arterial": "120/80",
      "temperatura": 36.5,
      "frecuencia_cardiaca": 72,
      "oxigenacion": 98,
      "altura": 175,
      "peso": 75.5,
      "glucosa": 95,
      "parentesco_desc": "EMPLEADO",
      "fecha_consulta": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### **GET /api/consultas/[id]/signos-vitales**

Obtiene una consulta específica por ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id_consulta": 1,
    "folio": "C-25-000001",
    "no_nomina": "12345",
    "nombre": "Juan Pérez",
    "edad": 35,
    "presion_arterial": "120/80",
    "temperatura": 36.5,
    "frecuencia_cardiaca": 72,
    "oxigenacion": 98,
    "altura": 175,
    "peso": 75.5,
    "glucosa": 95
  }
}
```

---

### **POST /api/consultas/finalizar**

Finaliza una consulta actualizando diagnóstico y SOAP.

**Body:**
```json
{
  "id_consulta": 1,
  "datos_soap": {
    "paciente": {
      "no_nomina": "12345",
      "nombre": "Juan Pérez",
      "es_empleado": true
    },
    "diagnostico": {
      "codigo": "8A62",
      "titulo": "Diabetes mellitus tipo 2",
      "capitulo": "05"
    },
    "subjetivo": "Paciente refiere...",
    "objetivo": "TA: 120/80, FC: 72",
    "analisis": "Se observa..."
  },
  "datos_plan": {
    "opciones": {
      "medicamentos": true,
      "incapacidad": false,
      "especialidad": false,
      "laboratorio": false
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consulta finalizada exitosamente",
  "id_consulta": 1,
  "folio_consulta": 12345
}
```

---

## 🔄 Flujo de Trabajo

1. **Registrar Signos Vitales** (`POST /api/consultas/crear`)
   - Se crea el registro en `consulta`
   - Se genera folio automático (C-25-000001)
   - Estatus inicial: `1` (En espera)

2. **Listar Consultas del Día** (`GET /api/consultas/hoy?clavestatus=1`)
   - Filtra por estatus y fecha actual
   - Retorna lista con signos vitales

3. **Obtener Detalles** (`GET /api/consultas/[id]/signos-vitales`)
   - Retorna consulta específica con signos vitales

4. **Finalizar Consulta** (`POST /api/consultas/finalizar`)
   - Actualiza diagnóstico CIE-11
   - Guarda notas SOAP
   - Cambia estatus a `2` (Atendida)
   - Inserta en SQL Server (compatibilidad)

---

## ✅ Ventajas de la Nueva Implementación

1. **Drizzle ORM**: Type-safe, mejor DX que SQL raw
2. **Schema unificado**: Signos vitales integrados en consulta
3. **Folio único**: Sistema automático de folios (C-25-NNNNNN)
4. **Snapshot del paciente**: Datos históricos inmutables
5. **Validaciones**: Constraints en base de datos
6. **Timestamps automáticos**: Trigger para `actualizado_en`
7. **Índices optimizados**: Búsquedas rápidas por fecha/estatus

---

## 🚀 Próximos Pasos

1. Migrar datos históricos de `signos_vitales` a `consulta`
2. Deprecar tabla `signos_vitales` una vez validada la migración
3. Implementar módulos de Incapacidad, Especialidad y Laboratorio
4. Agregar búsqueda por rango de fechas
5. Implementar sistema de referencias médicas

---

## 📝 Notas Técnicas

- **Separación de Presión Arterial**: El frontend envía "120/80", el backend separa en `ta_sistolica` y `ta_diastolica`
- **Compatibilidad SQL Server**: La inserción en `NotaMedica` se mantiene para compatibilidad con el sistema legacy
- **BigInt Handling**: Drizzle usa `BigInt`, se convierte a `number` en responses
- **Edad Calculada**: Para beneficiarios se calcula desde `f_nacimiento`, para empleados desde WS
- **Parentesco para Empleados**: Los empleados usan `id_parentesco = 1` (EMPLEADO) por defecto. Los beneficiarios usan su parentesco real de la tabla `beneficiario`

---

## 🛠️ Comandos Útiles

```bash
# Generar migraciones de Drizzle
npx drizzle-kit generate:pg

# Aplicar migraciones
npx drizzle-kit push:pg

# Ver estado de migraciones
npx drizzle-kit status

# Abrir Drizzle Studio (GUI)
npx drizzle-kit studio
```

---

**Autor:** Sistema de Migración con Drizzle ORM
**Fecha:** Enero 2025
**Versión:** 1.0.0
