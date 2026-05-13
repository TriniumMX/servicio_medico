# Plan de Implementacion: Modulo de Alertas de Fondos Fijos por Correo

**Fecha de creacion:** 21 de enero de 2026
**Estado:** En progreso
**Tecnologias:** Next.js, PostgreSQL, Nodemailer, pdf-lib

---

## Resumen Ejecutivo

Crear un modulo que permita:
1. Configurar multiples destinatarios de correo electronico
2. Detectar automaticamente medicamentos con fondos fijos bajos/medios/criticos
3. Enviar alertas por correo con reporte PDF adjunto
4. Envio manual + preparado para automatizacion futura (CRON)

---

## Configuracion Confirmada

| Aspecto | Decision |
|---------|----------|
| **Umbrales** | CRITICO: <=10%, BAJO: <=30%, MEDIO: <=50% del fondo fijo |
| **SMTP** | Gmail con contrasena de aplicacion |
| **Envio** | Manual + preparado para CRON automatico (fase futura) |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL SISTEMA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │   Pagina     │────▶│   API CRUD   │────▶│  BD: alertas_  │  │
│  │ Configurar   │     │  /correos    │     │  correos       │  │
│  │  Correos     │     └──────────────┘     └────────────────┘  │
│  └──────────────┘                                               │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │   Boton      │────▶│ API: enviar  │────▶│  nodemailer    │  │
│  │ "Enviar      │     │   alerta     │     │  + PDF adjunto │  │
│  │  Alerta"     │     └──────────────┘     └────────────────┘  │
│  └──────────────┘                                               │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │  CRON Job    │────▶│ Verificar    │────▶│ Enviar alerta  │  │
│  │ (futuro)     │     │ niveles      │     │ si hay bajos   │  │
│  └──────────────┘     └──────────────┘     └────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementacion

### FASE 1: Base de Datos y Tipos

- [ ] **1.1** Crear archivo `src/db/schema/alertas_fondos.ts`
  - Tabla `alertas_fondos_correos`
  - Campos: id_correo, correo, nombre_destinatario, activo, created_at, updated_at

- [ ] **1.2** Crear archivo `database/CREATE_TABLE_alertas_fondos_correos.sql`
  ```sql
  CREATE TABLE alertas_fondos_correos (
    id_correo SERIAL PRIMARY KEY,
    correo VARCHAR(255) NOT NULL UNIQUE,
    nombre_destinatario VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [ ] **1.3** Crear archivo `src/types/alertas-fondos.ts`
  - Interface `CorreoAlerta`
  - Interface `MedicamentoAlerta`
  - Interface `ReporteAlerta`

- [ ] **1.4** Modificar `src/db/schema/index.ts` para exportar nuevo schema

- [ ] **1.5** Ejecutar migracion SQL en la base de datos

---

### FASE 2: Configuracion de Nodemailer

- [ ] **2.1** Instalar dependencias
  ```bash
  npm install nodemailer @types/nodemailer
  ```

- [ ] **2.2** Agregar variables de entorno a `.env.local`
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=correo@gmail.com
  SMTP_PASS=xxxx-xxxx-xxxx-xxxx
  SMTP_FROM="Servicio Medico <noreply@serviciomedico.gob.mx>"
  ```

- [ ] **2.3** Crear archivo `src/lib/nodemailer.ts`
  - Configuracion del transporter
  - Funcion `enviarCorreo(destinatario, asunto, html, adjuntos)`

- [ ] **2.4** Crear archivo `src/lib/templates/alerta-fondos-email.ts`
  - Template HTML del correo de alerta
  - Logo, resumen, tabla de medicamentos criticos

---

### FASE 3: APIs CRUD de Correos

- [ ] **3.1** Crear `src/app/api/alertas-fondos/correos/route.ts`
  - GET: Listar todos los correos
  - POST: Agregar nuevo correo (con validacion de formato)

- [ ] **3.2** Crear `src/app/api/alertas-fondos/correos/[id]/route.ts`
  - GET: Obtener correo por ID
  - PATCH: Editar correo (nombre, activo)
  - DELETE: Eliminar correo

- [ ] **3.3** Probar endpoints con Postman/Thunder Client
  - [ ] GET /api/alertas-fondos/correos
  - [ ] POST /api/alertas-fondos/correos
  - [ ] PATCH /api/alertas-fondos/correos/1
  - [ ] DELETE /api/alertas-fondos/correos/1

---

### FASE 4: Generador de PDF

- [ ] **4.1** Crear archivo `src/lib/generar-reporte-fondos-pdf.ts`
  - Usar pdf-lib (misma libreria del proyecto)
  - Encabezado: "Reporte de Alertas de Inventario"
  - Fecha y hora de generacion
  - Tabla con medicamentos en alerta
  - Columnas: Medicamento, Sustancia, Existencia, Fondo Fijo, Faltante, Estado
  - Codigo de colores por estado (CRITICO=rojo, BAJO=naranja, MEDIO=amarillo)
  - Resumen con totales

- [ ] **4.2** Crear `src/app/api/alertas-fondos/reporte-pdf/route.ts`
  - GET: Genera y retorna PDF de fondos bajos

- [ ] **4.3** Probar generacion de PDF
  ```bash
  curl http://localhost:3000/api/alertas-fondos/reporte-pdf --output reporte-test.pdf
  ```

---

### FASE 5: Sistema de Envio de Alertas

- [ ] **5.1** Crear `src/app/api/alertas-fondos/verificar/route.ts`
  - GET: Retorna lista de medicamentos con alerta
  - Clasificacion por umbrales: CRITICO (<=10%), BAJO (<=30%), MEDIO (<=50%)

- [ ] **5.2** Crear `src/app/api/alertas-fondos/enviar/route.ts`
  - POST: Enviar alerta a todos los correos activos
  - Genera PDF automaticamente
  - Adjunta PDF al correo
  - Retorna resultado del envio

- [ ] **5.3** Probar envio de alerta
  ```bash
  curl -X POST http://localhost:3000/api/alertas-fondos/enviar
  ```

- [ ] **5.4** Verificar recepcion de correo con PDF adjunto

---

### FASE 6: Frontend - Pagina de Configuracion

- [ ] **6.1** Crear `src/app/dashboard/farmacia/alertas-fondos/page.tsx`
  - Layout principal de la pagina
  - Estadisticas: Total correos, Medicamentos en alerta, etc.
  - Tabs o secciones para correos y vista previa

- [ ] **6.2** Crear `src/components/farmacia/alertas/TablaCorreos.tsx`
  - Lista de correos configurados
  - Columnas: Nombre, Correo, Estado, Acciones
  - Toggle para activar/desactivar
  - Botones editar/eliminar

- [ ] **6.3** Crear `src/components/farmacia/alertas/ModalAgregarCorreo.tsx`
  - Formulario: Nombre del destinatario, Correo electronico
  - Validacion de formato de correo
  - Boton guardar/cancelar

- [ ] **6.4** Crear `src/components/farmacia/alertas/ModalEditarCorreo.tsx`
  - Similar al de agregar pero para edicion
  - Pre-carga datos existentes

- [ ] **6.5** Crear `src/components/farmacia/alertas/TablaMedicamentosAlerta.tsx`
  - Vista previa de medicamentos en alerta
  - Columnas: Medicamento, Existencia, Fondo Fijo, Faltante, Estado
  - Indicadores de color por estado
  - Barra de progreso visual

- [ ] **6.6** Crear `src/components/farmacia/alertas/BotonEnviarAlerta.tsx`
  - Boton con confirmacion
  - Loading mientras envia
  - Notificacion de exito/error

- [ ] **6.7** Crear `src/hooks/farmacia/useAlertasFondos.ts`
  - obtenerCorreos()
  - agregarCorreo()
  - editarCorreo()
  - eliminarCorreo()
  - toggleActivo()
  - obtenerMedicamentosAlerta()
  - enviarAlerta()

---

### FASE 7: Integracion Final

- [ ] **7.1** Modificar `src/components/layout/menuConfig.ts`
  - Agregar enlace en seccion Farmacia
  - Ruta: `/dashboard/farmacia/alertas-fondos`
  - Nombre: "Alertas de Fondos"
  - Icono: Bell o Mail

- [ ] **7.2** Agregar permisos necesarios (si aplica)
  - Permiso para ver pagina
  - Permiso para enviar alertas

- [ ] **7.3** Pruebas de integracion completas
  - [ ] Agregar 3 correos de prueba
  - [ ] Verificar que se listen correctamente
  - [ ] Editar un correo
  - [ ] Desactivar un correo
  - [ ] Eliminar un correo
  - [ ] Ver vista previa de medicamentos en alerta
  - [ ] Presionar "Enviar Alerta"
  - [ ] Verificar recepcion del correo
  - [ ] Abrir PDF adjunto y verificar contenido

---

## Estructura de Archivos a Crear

```
src/
├── app/
│   ├── api/
│   │   └── alertas-fondos/
│   │       ├── correos/
│   │       │   ├── route.ts              [ ]
│   │       │   └── [id]/route.ts         [ ]
│   │       ├── enviar/route.ts           [ ]
│   │       ├── reporte-pdf/route.ts      [ ]
│   │       └── verificar/route.ts        [ ]
│   └── dashboard/
│       └── farmacia/
│           └── alertas-fondos/
│               └── page.tsx              [ ]
├── components/
│   └── farmacia/
│       └── alertas/
│           ├── TablaCorreos.tsx          [ ]
│           ├── ModalAgregarCorreo.tsx    [ ]
│           ├── ModalEditarCorreo.tsx     [ ]
│           ├── TablaMedicamentosAlerta.tsx [ ]
│           └── BotonEnviarAlerta.tsx     [ ]
├── db/
│   └── schema/
│       └── alertas_fondos.ts             [ ]
├── hooks/
│   └── farmacia/
│       └── useAlertasFondos.ts           [ ]
├── lib/
│   ├── nodemailer.ts                     [ ]
│   ├── generar-reporte-fondos-pdf.ts     [ ]
│   └── templates/
│       └── alerta-fondos-email.ts        [ ]
└── types/
    └── alertas-fondos.ts                 [ ]

database/
└── CREATE_TABLE_alertas_fondos_correos.sql [ ]
```

**Total archivos a crear:** 18

---

## Archivos a Modificar

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `src/db/schema/index.ts` | Exportar nuevo schema | [ ] |
| `src/components/layout/menuConfig.ts` | Agregar enlace menu | [ ] |
| `.env.local` | Variables SMTP | [ ] |
| `package.json` | Agregar nodemailer | [ ] |

---

## Especificaciones Tecnicas

### Umbrales de Alerta

```typescript
function calcularEstado(existencia: number, fondoFijo: number): string {
  const porcentaje = (existencia / fondoFijo) * 100;

  if (porcentaje <= 10) return 'CRITICO';  // Rojo
  if (porcentaje <= 30) return 'BAJO';     // Naranja
  if (porcentaje <= 50) return 'MEDIO';    // Amarillo
  return 'NORMAL';                          // Verde (no se incluye en alerta)
}
```

### Estructura del Correo de Alerta

**Asunto:** `⚠️ Alerta de Fondos Fijos Bajos - Servicio Medico`

**Contenido:**
- Logo del sistema
- Fecha y hora de generacion
- Resumen: X criticos, Y bajos, Z medios
- Tabla con top 10 medicamentos mas criticos
- Mensaje: "Ver reporte completo en el PDF adjunto"
- Pie de pagina

**Adjunto:** `reporte-fondos-fijos-YYYY-MM-DD.pdf`

### Estructura del PDF

| Seccion | Contenido |
|---------|-----------|
| Encabezado | Logo + Titulo + Fecha |
| Resumen | Total alertas por tipo |
| Tabla | Lista de medicamentos |
| Pie | Generado por sistema |

---

## Notas Importantes

1. **Gmail:** Requiere "Contrasena de aplicacion" (no la contrasena normal)
   - Ir a: Google Account > Seguridad > Contrasenas de aplicaciones
   - Generar nueva contrasena para "Correo"

2. **Rate Limiting:** Considerar limitar envios para evitar spam
   - Sugerencia: Maximo 1 alerta cada 4 horas

3. **Logs:** Registrar cada envio de alerta en consola para debugging

4. **Errores SMTP:** Manejar errores de conexion gracefully

---

## Progreso General

| Fase | Descripcion | Estado |
|------|-------------|--------|
| Fase 1 | Base de Datos y Tipos | [ ] |
| Fase 2 | Configuracion Nodemailer | [ ] |
| Fase 3 | APIs CRUD Correos | [ ] |
| Fase 4 | Generador de PDF | [ ] |
| Fase 5 | Sistema de Alertas | [ ] |
| Fase 6 | Frontend | [ ] |
| Fase 7 | Integracion Final | [ ] |

**Progreso total:** 0 / 7 fases completadas

---

*Documento generado el 21 de enero de 2026*
