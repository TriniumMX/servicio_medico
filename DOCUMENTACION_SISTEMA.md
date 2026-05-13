# Documentación del Sistema de Servicio Médico 2.0

## Índice
1. [Roles y Tipos de Usuario](#1-roles-y-tipos-de-usuario)
2. [Flujo General del Sistema](#2-flujo-general-del-sistema)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Casos de Uso y Flujos](#4-casos-de-uso-y-flujos)

---

## 1. Roles y Tipos de Usuario

| ID | Tipo de Usuario | Descripción |
|----|---------------|-------------|
| 1 | Médico general | Realiza consultas y diagnósticos |
| 2 | Enfermera | Gestiona triage, signos vitales, recetas |
| 3 | Administración Pases | Admininistra pases de empleados |
| 4 | Contadora | Gestiona aspectos contables |
| 5 | Capturista Recetas | Captura recetas generales |
| 6 | Administrador | Acceso total al sistema |
| 7 | Presidente | Acceso ejecutivo |
| 8 | Recursos Humanos | Gestiona empleados y beneficiarios |
| 9 | Farmacia | Gestiona medicamentos y inventario |
| 10 | Director SM | Dirección del servicio médico |
| 11 | Médico especialista | Atiende referencias especializadas |
| 12 | Recepcionista | Recibe y agenda pacientes |

---

## 2. Flujo General del Sistema

```
[Empleado/Beneficiario]
        ↓
[Recepcionista - Agenda/Checa vigencia]
        ↓
[Enfermera - Triage y Signos Vitales]
        ↓
[Médico General/Especialista - Consulta y Diagnóstico]
        ↓
[Receta] → [Farmacia - Surtimiento]
        ↓
[Referencia Externa] → [Coordinador Autoriza] → [Hospital/Especialista Ext.]
        ↓
[Contrareferencia] → [Seguimiento]
```

---

## 3. Módulos del Sistema

### 3.1 Módulo de Recepción (Recepcionista - Tipo 12)

**Funciones:**
- Agenda de citas médicas
- Verificación de vigencia de empleados y beneficiarios
- Registro de pacientes
- Consulta de historial médico por número de nómina

**Casos de uso:**
- El paciente llega a consulta y la recepcionista verifica su vigencia
- La recepcionista agenda citas para el médico
- La recepcionista consulta el historial de un paciente

---

### 3.2 Módulo de Enfermería (Enfermera - Tipo 2)

**Funciones:**
- Registro de triage (signos vitales)
- Captura de signos vitales (presión arterial, temperatura, frecuencia cardíaca)
- Seguimiento de pacientes
- Impresión de recetas

**Casos de uso:**
- La enfermera toma los signos vitales del paciente antes de la consulta
- La enfermera registra el triage inicial
- La enfermera imprime una receta para el paciente

---

### 3.3 Módulo de Consulta Médica (Médico General - Tipo 1)

**Funciones:**
- Atención de pacientes en espera
- Registro de diagnósticos (CIE-11)
- Creación de recetas electrónicas
- Solicitud de incapacidades
- Solicitud de referencias a especialista
- Solicitud de estudios de laboratorio

**Casos de uso:**
- El médico atiende al paciente y registra el diagnóstico
- El médico prescribe medicamentos en receta
- El médico solicita incapacidad laboral (1-30+ días)
- El médico refiere a especialista interno o externo
- El médico solicita estudios de laboratorio

---

### 3.4 Módulo de Diagnóstico y Consulta

**Sub-módulos:**

#### 3.4.1 Diagnóstico (CIE-11)
- Pacientes en espera de atención
- Pacientes atendidos recientemente
- Registro de diagnósticos múltiples por consulta
- Búsqueda de códigos CIE-11
- Impresión de recetas

#### 3.4.2 Incapacidades
- Solicitar incapacidad (días sugeridos, motivo médico)
- Ver incapacidades pendientes
- Ver incapacidades autorizadas
- Ver incapacidades rechazadas
- PDF de incapacidad para imprimir

#### 3.4.3 Signos Vitales
- Registro de signos vitales por empleado/beneficiario
- Historial de signos vitales

---

### 3.5 Módulo de Farmacia (Farmacia - Tipo 9)

**Funciones:**
- Búsqueda de recetas por folio
- Surtimiento de medicamentos
- Control de inventario
- Registro de cancelaciones
- Resurtimiento de almacén
- Alertas de fondos mínimos

**Casos de uso:**
- El paciente presenta folio de receta y la farmacia la surte
- La farmacia registra cuando no hay medicamento (marcar como 0)
- La farmacia realiza resurtimiento de medicamentos
- La pharmacy recibe alertas cuando el inventario está bajo

---

### 3.6 Módulo de Referencias (Médico Especialista - Tipo 11 / Coordinador)

**Funciones:**
- Crear referencias a especialista interno/externo
- Autorizar referencias pendientes
- Asignar hospital/médico para referencia
- Seguimiento de referencias
- Reportes de referencias

**Flujo de referencias:**
```
Médico General → Crea Referencia → Coordinador Autoriza → 
Hospital Asignado → Especialista Atiende → Contrareferencia
```

**Tipos de referencia:**
- Referencia a especialista interno
- Referencia a hospital externo
- Reprogramación de citas

---

### 3.7 Módulo de Coordinación (Coordinador - Tipo 2/11)

**Funciones:**
- Autorizar referencias a especialista
- Autorizar estudios de laboratorio
- Gestionar incapacidades
- Seguimientos de pacientes

**Casos de uso:**
- El coordinador recibe referencia y decide autorizarla o rechazarla
- El coordinador asigna hospital y médico a la referencia
- El coordinador autoriza estudios de laboratorio

---

### 3.8 Módulo de Laboratorio

**Funciones:**
- Catálogo de estudios de laboratorio
- Solicitud de estudios por médico
- Autorización de estudios por coordinación
- Resultado de estudios
- Entrega de resultados

---

### 3.9 Módulo de Contrareferencias

**Funciones:**
- Crear contrareferencia desde hospital
- Ver contrareferencias pendientes
- Seguimiento de contrareferencias
- Historial de contrareferencias por paciente

---

### 3.10 Módulo de Administración (Administrador - Tipo 6)

**Funciones:**
- Gestión de usuarios y permisos
- Catálogos del sistema
- Estadísticas del servicio médico
- Gestión de avisos
- Gestión de referencias (admin)
- Gestión de alertas de fondos

---

### 3.11 Módulos de Catálogos

| Catálogo | Descripción |
|---------|-------------|
| Beneficiarios | Empleados y sus beneficiarios |
| Tipos de Usuario | Roles del sistema |
| Especialidades | Especialidades médicas |
| Hospitales | Hospitales de referencia |
| Usuarios y Proveedores | Médicos y personal médico |
| Enfermedades | Catálogo CIE-11 |
| Estudios de Laboratorio | Estudios disponibles |
| Unidades de Medida | Para inventario de farmacia |

---

## 4. Casos de Uso y Flujos

### 4.1 Caso: Consulta Médica Completa

```
1. Recepcionista: Verifica vigencia del paciente
2. Recepcionista: Registra/Agenda paciente
3. Enfermera: Registra triage y signos vitales
4. Médico: Atención en consultorio
5. Médico: Registra diagnóstico (CIE-11)
6. Médico: Genera receta electrónica
7. Farmacia: Surtimiento de receta
8. Paciente: Recibe medicamentos
```

**Variaciones:**
- Si el paciente no tiene vigencia → No se atiende
- Si no hay medicamentos → Marcar como 0, volver mañana
- Si es referencia externa → Ir al paso de referencias

---

### 4.2 Caso: Solicitud de Incapacidad

```
1. Médico: Solicita incapacidad (días, diagnóstico)
2. Incapacidad: Queda en статус PENDIENTE
3. Coordinador: Revisiona solicitud
4. Coordinador: Autoriza/Rechaza
5. Incapacidad: Cambio a AUTORIZADA o RECHAZADA
6. Paciente: Puede imprimir PDF si autorizada
```

**Estados:**
- PENDIENTE: Esperando autorización
- AUTORIZADA: Lista para entrega
- RECHAZADA: No autorizada

---

### 4.3 Caso: Referencias a Especialista

```
1. Médico: Crea referencia con motivo
2. Referencia: Estado PENDIENTE
3. Coordinador: Autoriza o rechaza
4. Si Autorizada:
   a. Asigna hospital
   b. Asigna médico
   c. Agenda fecha
5. Paciente: Acude al hospital
6. Especialista: Atiende
7. Especialista: Crea contrareferencia
8. Médico origen: Recibe contrareferencia
```

**Estados de Referencia:**
- PENDIENTE: Esperando autorización
- AUTORIZADA: Aprobada y agendada
- RECHAZADA: Rechazada
- ATENDIDA: Ya fue atendida
- REPROGRAMAR: Necesita nueva fecha
- INASISTENCIA: Paciente no acudió

---

### 4.4 Caso: Estudios de Laboratorio

```
1. Médico: Solicita estudios
2. Laboratorio: Queda PENDIENTE
3. Coordinación: Autoriza estudios
4. Laboratorio: Queda AUTORIZADO
5. Paciente: Acude a laboratorio
6. Laboratorio: Toma muestras
7. Laboratorio: Envía resultados
8. Paciente: Recibe resultados
```

---

### 4.5 Caso: Resurtimiento de Farmacia

```
1. Sistema: Detecta stock bajo
2. Alerta: Se notifica a farmacéutica
3. Farmacéutica: Solicita resurtimiento
4. Admin: Aprueba resurtimiento
5. Compras: Realiza pedido
6. Recepción: Recibe medicamentos
7. Farmacia: Registra en inventario
```

---

## 5. Notificaciones en Tiempo Real

El sistema utiliza Pusher para notificaciones en tiempo real:

| Evento | Descripción |
|-------|-------------|
| stats-refresh | Actualizar estadísticas del dashboard |
| nuevo-aviso | Nuevo aviso administrativo |
| nueva-incapacidad | Nueva incapacidad pendiente |
| nueva-referencia | Nueva referencia pendiente |

---

## 6. Permisos del Sistema

| Permiso | Descripción |
|--------|-------------|
| VER_METRICAS_DASHBOARD | Ver estadísticas |
| GESTIONAR_USUARIOS | Gestionar usuarios |
| GESTIONAR_PERMISOS | Gestionar permisos |
| GESTIONAR_CATALOGOS | Gestionar catálogos |
| AUTORIZAR_REFERENCIAS | Autorizar referencias |
| AUTORIZAR_INCAPACIDADES | Autorizar incapacidades |
| GESTIONAR_FARMACIA | Gestionar farmacia |
| VER_ALERTAS_FONDOS | Ver alertas de fondos |

---

## 7. Estados de Consulta

| Estado | Descripción |
|--------|-------------|
| EN_ESPERA | Paciente esperando atención |
| EN_ATENCION | En proceso de atención |
| ATENDIDA | Consulta finalizada |
| CANCELADA | Consulta cancelada |

---

## 8. Tablas Principales

- `consultas` - Registro de consultas
- `recetas` - Recetas emitidas
- `incapacidades` - Incapacidades laborales
- `referencias` - Referencias a especialistas
- `contrareferencias` - Contrareferencias
- `inventario` - Inventario de farmacia
- `signos_vitales` - Registro de signos vitales
- `diagnosticos_consulta` - Diagnósticos por consulta

---

*Documento generado automaticamente - Servicio Médico 2.0*