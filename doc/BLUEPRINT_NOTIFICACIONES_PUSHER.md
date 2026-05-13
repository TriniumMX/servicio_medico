# 🔔 Blueprint: Sistema de Notificaciones en Tiempo Real con Pusher

Este documento es una guía completa de cómo se implementó el sistema de notificaciones en tiempo real con Pusher para el **Módulo de Incapacidades**. Usa este documento como referencia para implementar notificaciones en otros módulos.

---

## 📋 Índice

1. [Resumen General](#resumen-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Implementación Paso a Paso](#implementación-paso-a-paso)
4. [Archivos Creados/Modificados](#archivos-creadosmodificados)
5. [Configuración de Base de Datos](#configuración-de-base-de-datos)
6. [Sistema de Permisos](#sistema-de-permisos)
7. [Cómo Replicar para Otro Módulo](#cómo-replicar-para-otro-módulo)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 📌 Resumen General

### ¿Qué se implementó?

Un sistema de notificaciones en tiempo real que:
- ✅ Envía notificaciones cuando se crea una nueva incapacidad
- ✅ Solo usuarios con permiso específico las reciben
- ✅ Funciona en **cualquier página** del dashboard (global)
- ✅ Muestra toast animado, sonido, y badge en campana
- ✅ Redirige al módulo al hacer clic en la notificación
- ✅ Auto-recarga la tabla cuando estás en el módulo

### Tecnologías Usadas

- **Pusher** (WebSocket en tiempo real)
- **React Context API** (gestión de estado global)
- **Next.js App Router** (framework)
- **Framer Motion** (animaciones)
- **Web Audio API** (sonido de notificación)
- **PostgreSQL** (permisos en BD)

---

## 🏗️ Arquitectura del Sistema

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. BACKEND: Se crea una incapacidad                        │
│     → API: /api/consultas/finalizar                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BACKEND: Dispara evento de Pusher                       │
│     pusherServer.trigger('incapacidades-channel',           │
│                          'nueva-incapacidad', {...})        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. FRONTEND: GlobalNotificationListener escucha            │
│     → Verifica permisos del usuario                         │
│     → Si tiene permiso: continúa, si no: ignora             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. HOOK: usePusher recibe el evento                        │
│     → Agrega notificación al contexto                       │
│     → Reproduce sonido                                      │
│     → Muestra toast emergente                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  5. UI: Se actualizan componentes                           │
│     → NotificationBell: muestra badge con contador          │
│     → NotificationToast: muestra toast animado              │
│     → Página de incapacidades: auto-recarga (si está ahí)  │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Clave

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `pusherServer` | `src/lib/pusher.ts` | Cliente de Pusher para backend (enviar eventos) |
| `pusherClient` | `src/lib/pusher.ts` | Cliente de Pusher para frontend (recibir eventos) |
| `GlobalNotificationListener` | `src/components/GlobalNotificationListener.tsx` | Escucha eventos globalmente con verificación de permisos |
| `usePusher` | `src/hooks/usePusher.ts` | Hook para suscribirse a canales de Pusher |
| `NotificationsContext` | `src/context/NotificationsContext.tsx` | Gestión global de notificaciones |
| `NotificationBell` | `src/components/layout/NotificationBell.tsx` | Campana con panel de notificaciones |
| `NotificationToast` | `src/components/NotificationToast.tsx` | Toasts emergentes animados |

---

## 🚀 Implementación Paso a Paso

### PASO 1: Configurar Pusher (Backend)

**Archivo:** `src/lib/pusher.ts`

```typescript
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// SERVIDOR (para enviar eventos desde el backend)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "TU_APP_ID",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "TU_KEY",
  secret: process.env.PUSHER_SECRET || "TU_SECRET",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "TU_CLUSTER",
  useTLS: true,
});

// CLIENTE (para recibir eventos en el frontend)
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || "TU_KEY",
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "TU_CLUSTER",
  }
);
```

**Variables de entorno (.env.local):**
```env
PUSHER_APP_ID=tu_app_id
NEXT_PUBLIC_PUSHER_KEY=tu_key
PUSHER_SECRET=tu_secret
NEXT_PUBLIC_PUSHER_CLUSTER=tu_cluster
```

---

### PASO 2: Disparar Evento desde el Backend

**Archivo:** `src/app/api/consultas/finalizar/route.ts`

**Dónde:** Después de insertar la incapacidad en la BD

```typescript
import { pusherServer } from '@/lib/pusher';

// ... código de inserción de incapacidad ...

// Obtener datos del paciente
const pacienteInfo = await executeQueryOne<{ nombre: string, folio: string }>(`
  SELECT nombre, folio FROM consulta WHERE id_consulta = $1
`, [id_consulta]);

// Disparar evento de Pusher
try {
  await pusherServer.trigger('incapacidades-channel', 'nueva-incapacidad', {
    tipo: 'incapacidad',
    titulo: 'Nueva Solicitud de Incapacidad',
    mensaje: `${pacienteInfo?.nombre || 'Paciente'} ha solicitado ${datosIncapacidad.dias} días de incapacidad (Folio: ${pacienteInfo?.folio || 'N/A'})`,
    datos: {
      id_consulta,
      no_nomina: consultaDb.no_nomina,
      dias: datosIncapacidad.dias,
      folio_consulta: pacienteInfo?.folio
    }
  });
  console.log("📢 Notificación enviada vía Pusher");
} catch (error) {
  console.error("❌ Error enviando notificación:", error);
  // No bloqueamos el proceso si falla la notificación
}
```

**Formato del evento:**
```typescript
{
  tipo: 'incapacidad' | 'referencia' | 'general',  // Tipo de notificación
  titulo: string,                                   // Título corto
  mensaje: string,                                  // Mensaje descriptivo
  datos?: any                                       // Datos adicionales opcionales
}
```

---

### PASO 3: Crear Permiso en Base de Datos

**Archivo SQL:** `database/INSERT_PERMISO_NOTIFICACIONES_INCAPACIDADES.sql`

```sql
-- Insertar permiso en la tabla cat_acciones
INSERT INTO cat_acciones (clave, descripcion, activo)
VALUES (
    'ACCESO_NOTIFICACIONES_INCAPACIDADES',
    'Recibir notificaciones en tiempo real de nuevas solicitudes de incapacidad',
    true
)
ON CONFLICT (clave) DO NOTHING;

-- Verificar
SELECT * FROM cat_acciones WHERE clave = 'ACCESO_NOTIFICACIONES_INCAPACIDADES';
```

**Ejecutar:**
```bash
psql -h HOST -U USER -d DATABASE -f database/INSERT_PERMISO_NOTIFICACIONES_INCAPACIDADES.sql
```

---

### PASO 4: Agregar Permiso a la UI de Gestión de Permisos

**Archivo:** `src/app/dashboard/admin/permisos/page.tsx`

**Ubicación:** En el array `SECCIONES_ORDENADAS`, dentro de la sección correspondiente

```typescript
{
  titulo: 'CONSULTAS',
  icono: <Stethoscope size={16} />,
  claves: [
    'VER_CONSULTAS',
    'TOMAR_SIGNOS_VITALES',
    'REALIZAR_DIAGNOSTICO',
    'VER_MIS_INCAPACIDADES',
    'ACCESO_NOTIFICACIONES_INCAPACIDADES'  // ← AGREGAR AQUÍ
  ]
},
```

---

### PASO 5: Crear Listener Global con Verificación de Permisos

**Archivo:** `src/components/GlobalNotificationListener.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePusher } from '@/hooks/usePusher';
import { useAuth } from '@/context/AuthContext';

export default function GlobalNotificationListener() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  // Verificar permiso
  const tienePermiso = hasPermission('ACCESO_NOTIFICACIONES_INCAPACIDADES');

  useEffect(() => {
    if (tienePermiso) {
      console.log('✅ Usuario autorizado para recibir notificaciones');
    }
  }, [tienePermiso]);

  // Escuchar notificaciones (solo si tiene permiso)
  usePusher(
    'incapacidades-channel',      // Canal
    'nueva-incapacidad',           // Evento
    tienePermiso ? {               // Opciones (solo si tiene permiso)
      onNotification: (data) => {
        console.log('📢 Notificación recibida:', data);
        // Aquí puedes agregar lógica adicional
      },
    } : undefined  // Si no tiene permiso, no escucha
  );

  return null; // No renderiza nada
}
```

---

### PASO 6: Integrar Listener al Layout Global

**Archivo:** `src/components/layout/MainLayout.tsx`

```typescript
import GlobalNotificationListener from '@/components/GlobalNotificationListener';

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <NotificationsProvider>
      {/* ... otros componentes ... */}

      <NotificationToast />
      <GlobalNotificationListener />  {/* ← AGREGAR AQUÍ */}
    </NotificationsProvider>
  );
}
```

---

### PASO 7: Agregar Redirección al Hacer Clic

**Archivo:** `src/components/layout/NotificationBell.tsx`

**Función:** `handleNotificationClick`

```typescript
const handleNotificationClick = (notif: any) => {
  // Marcar como leída
  if (!notif.leida) {
    marcarComoLeida(notif.id);
  }

  // Cerrar panel
  setIsOpen(false);

  // Redirigir según el tipo
  if (notif.tipo === 'incapacidad') {
    router.push('/dashboard/consultas/incapacidades');
  } else if (notif.tipo === 'referencia') {
    router.push('/dashboard/referencias');
  }
  // Agregar más tipos según necesidad
};
```

---

### PASO 8: Auto-recarga de la Tabla del Módulo

**Archivo:** `src/app/dashboard/consultas/incapacidades/page.tsx`

```typescript
import { useNotifications } from '@/context/NotificationsContext';

export default function IncapacidadesPage() {
  const { notificaciones } = useNotifications();

  // Escuchar cambios en notificaciones
  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultimaNotificacion = notificaciones[0];
      const ahora = new Date();
      const fechaNotif = new Date(ultimaNotificacion.fecha);
      const diff = ahora.getTime() - fechaNotif.getTime();

      // Si es reciente (< 5 segundos) y del tipo correcto
      if (diff < 5000 && ultimaNotificacion.tipo === 'incapacidad') {
        console.log('🔄 Recargando datos...');
        cargarDatos(); // Recargar tabla
      }
    }
  }, [notificaciones]);

  // ... resto del código ...
}
```

---

## 📁 Archivos Creados/Modificados

### Archivos Creados ✨

```
src/
├── components/
│   ├── GlobalNotificationListener.tsx          ← Nuevo
│   └── NotificationToast.tsx                   ← Nuevo
├── context/
│   └── NotificationsContext.tsx                ← Nuevo
└── hooks/
    └── usePusher.ts                            ← Nuevo

database/
└── INSERT_PERMISO_NOTIFICACIONES_INCAPACIDADES.sql  ← Nuevo
```

### Archivos Modificados 📝

```
src/
├── lib/
│   └── pusher.ts                               ← Agregado pusherClient
├── components/layout/
│   ├── MainLayout.tsx                          ← Agregado GlobalNotificationListener
│   ├── NotificationBell.tsx                    ← Agregada redirección
│   └── Header.tsx                              ← Integrado NotificationBell
├── app/
│   ├── dashboard/
│   │   ├── admin/permisos/page.tsx             ← Agregado permiso
│   │   └── consultas/incapacidades/page.tsx    ← Auto-recarga
│   └── api/
│       └── consultas/finalizar/route.ts        ← Dispara evento Pusher
```

---

## 🗄️ Configuración de Base de Datos

### Tabla: `cat_acciones`

```sql
CREATE TABLE IF NOT EXISTS cat_acciones (
    id_accion SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);
```

### Insertar Permiso

```sql
INSERT INTO cat_acciones (clave, descripcion, activo)
VALUES (
    'ACCESO_NOTIFICACIONES_INCAPACIDADES',
    'Recibir notificaciones en tiempo real de nuevas solicitudes de incapacidad',
    true
);
```

### Asignar a Usuario (desde UI)

1. Ir a: `/dashboard/admin/permisos`
2. Seleccionar usuario
3. Marcar: `ACCESO_NOTIFICACIONES_INCAPACIDADES`
4. Guardar

---

## 🔐 Sistema de Permisos

### ¿Cómo Funciona?

1. **AuthContext** (`src/context/AuthContext.tsx`)
   - Método: `hasPermission(action: string): boolean`
   - Verifica si el usuario actual tiene un permiso específico

2. **GlobalNotificationListener**
   - Llama a `hasPermission('ACCESO_NOTIFICACIONES_INCAPACIDADES')`
   - Si `true` → Pasa opciones al hook `usePusher`
   - Si `false` → Pasa `undefined` (hook no escucha)

3. **usePusher Hook**
   - Si `options === undefined` → No se suscribe al canal
   - Si `options !== undefined` → Se suscribe y escucha eventos

### Ejemplo de Verificación

```typescript
const { hasPermission } = useAuth();
const tienePermiso = hasPermission('ACCESO_NOTIFICACIONES_INCAPACIDADES');

// Solo escucha si tiene permiso
usePusher(
  'canal',
  'evento',
  tienePermiso ? { onNotification: callback } : undefined
);
```

---

## 🔄 Cómo Replicar para Otro Módulo

### Ejemplo: Referencias a Especialidad

#### 1. Crear Permiso en BD

```sql
INSERT INTO cat_acciones (clave, descripcion, activo)
VALUES (
    'ACCESO_NOTIFICACIONES_REFERENCIAS',
    'Recibir notificaciones en tiempo real de nuevas referencias a especialidad',
    true
);
```

#### 2. Agregar a UI de Permisos

En `src/app/dashboard/admin/permisos/page.tsx`:

```typescript
{
  titulo: 'REFERENCIAS',
  icono: <UserCheck size={16} />,
  claves: [
    'VER_REFERENCIAS',
    'VER_REFERENCIAS_HOSPITAL',
    'VER_REFERENCIAS_ADMIN',
    'ACCESO_NOTIFICACIONES_REFERENCIAS'  // ← NUEVO
  ]
},
```

#### 3. Disparar Evento desde Backend

En el endpoint donde se crea la referencia (ej: `src/app/api/referencias/crear/route.ts`):

```typescript
import { pusherServer } from '@/lib/pusher';

// Después de crear la referencia...
await pusherServer.trigger('referencias-channel', 'nueva-referencia', {
  tipo: 'referencia',
  titulo: 'Nueva Referencia a Especialidad',
  mensaje: `${paciente.nombre} ha sido referido a ${especialidad.nombre}`,
  datos: {
    id_referencia,
    folio,
    especialidad
  }
});
```

#### 4. Crear Listener Global

En `src/components/GlobalNotificationListener.tsx`:

```typescript
export default function GlobalNotificationListener() {
  const { hasPermission } = useAuth();

  // Incapacidades (ya existe)
  const tienePermisoIncapacidades = hasPermission('ACCESO_NOTIFICACIONES_INCAPACIDADES');
  usePusher('incapacidades-channel', 'nueva-incapacidad',
    tienePermisoIncapacidades ? { onNotification: ... } : undefined
  );

  // Referencias (NUEVO)
  const tienePermisoReferencias = hasPermission('ACCESO_NOTIFICACIONES_REFERENCIAS');
  usePusher('referencias-channel', 'nueva-referencia',
    tienePermisoReferencias ? { onNotification: ... } : undefined
  );

  return null;
}
```

#### 5. Agregar Redirección

En `src/components/layout/NotificationBell.tsx`:

```typescript
const handleNotificationClick = (notif: any) => {
  if (!notif.leida) marcarComoLeida(notif.id);
  setIsOpen(false);

  if (notif.tipo === 'incapacidad') {
    router.push('/dashboard/consultas/incapacidades');
  } else if (notif.tipo === 'referencia') {
    router.push('/dashboard/referencias');  // ← NUEVO
  }
};
```

#### 6. Auto-recarga en el Módulo

En la página del módulo (ej: `src/app/dashboard/referencias/page.tsx`):

```typescript
const { notificaciones } = useNotifications();

useEffect(() => {
  if (notificaciones.length > 0) {
    const ultima = notificaciones[0];
    const diff = new Date().getTime() - new Date(ultima.fecha).getTime();

    if (diff < 5000 && ultima.tipo === 'referencia') {
      cargarDatos(); // Recargar tabla
    }
  }
}, [notificaciones]);
```

---

## 🧪 Testing

### 1. Probar Endpoint de Pusher

```bash
# Endpoint de prueba
curl -X POST http://localhost:3000/api/pusher/test
```

### 2. Verificar Permisos

```javascript
// En consola del navegador
const { hasPermission } = useAuth();
console.log(hasPermission('ACCESO_NOTIFICACIONES_INCAPACIDADES'));
```

### 3. Probar Notificación Real

1. Usuario CON permiso → Crear incapacidad
2. Verificar:
   - ✅ Toast emergente
   - ✅ Sonido
   - ✅ Badge en campana
   - ✅ Notificación en panel
   - ✅ Auto-recarga de tabla (si estás en el módulo)

3. Usuario SIN permiso → Crear incapacidad
4. Verificar:
   - ❌ No debe ver/escuchar nada

### 4. Verificar en Dashboard de Pusher

https://dashboard.pusher.com/
- Ver eventos en tiempo real
- Monitorear conexiones
- Ver estadísticas

---

## 🔧 Troubleshooting

### Problema: No se escucha el sonido

**Solución:**
- Verificar que el navegador tenga permiso para reproducir audio
- Verificar volumen del navegador
- El sistema usa un beep generado por Web Audio API (no requiere archivo MP3)

### Problema: No llegan notificaciones

**Checklist:**
1. ✅ Verificar credenciales de Pusher en `.env.local`
2. ✅ Reiniciar servidor después de cambiar `.env.local`
3. ✅ Verificar que el usuario tenga el permiso asignado
4. ✅ Verificar logs del navegador (F12 → Console)
5. ✅ Verificar Dashboard de Pusher (eventos enviados)

### Problema: Notificación no redirige

**Solución:**
- Verificar que el tipo de notificación coincida en `handleNotificationClick`
- Verificar que la ruta de redirección sea correcta

### Problema: No se auto-recarga la tabla

**Solución:**
- Verificar que el `useEffect` esté escuchando cambios en `notificaciones`
- Verificar que el tipo de notificación coincida
- Verificar el timestamp (diferencia de tiempo)

### Problema: Todos reciben notificaciones (sin filtro de permisos)

**Solución:**
- Verificar que `GlobalNotificationListener` esté verificando permisos
- Verificar que se pase `undefined` si no tiene permiso
- Verificar que el hook `usePusher` verifique `isEnabled`

---

## 📊 Nomenclatura y Convenciones

### Nombres de Canales

Formato: `{modulo}-channel`

Ejemplos:
- `incapacidades-channel`
- `referencias-channel`
- `laboratorio-channel`

### Nombres de Eventos

Formato: `nueva-{entidad}` o `{accion}-{entidad}`

Ejemplos:
- `nueva-incapacidad`
- `nueva-referencia`
- `actualizar-orden-lab`
- `cancelar-cita`

### Nombres de Permisos

Formato: `ACCESO_NOTIFICACIONES_{MODULO}`

Ejemplos:
- `ACCESO_NOTIFICACIONES_INCAPACIDADES`
- `ACCESO_NOTIFICACIONES_REFERENCIAS`
- `ACCESO_NOTIFICACIONES_LABORATORIO`

### Tipos de Notificaciones

```typescript
tipo: 'incapacidad' | 'referencia' | 'laboratorio' | 'farmacia' | 'general'
```

---

## 📈 Estadísticas y Monitoreo

### Dashboard de Pusher

**URL:** https://dashboard.pusher.com/

**Métricas Disponibles:**
- Conexiones activas
- Eventos enviados
- Mensajes por segundo
- Latencia promedio
- Uso de ancho de banda

### Logs del Sistema

**Backend:**
```typescript
console.log("📢 Notificación enviada vía Pusher");
console.error("❌ Error enviando notificación:", error);
```

**Frontend:**
```typescript
console.log('📢 Notificación recibida:', data);
console.log('✅ Usuario autorizado para recibir notificaciones');
console.log('🔄 Recargando datos...');
```

---

## 🎯 Checklist de Implementación

Usa este checklist al implementar notificaciones en un nuevo módulo:

### Backend
- [ ] Importar `pusherServer` desde `@/lib/pusher`
- [ ] Disparar evento después de la operación crítica
- [ ] Usar formato correcto de evento (`tipo`, `titulo`, `mensaje`, `datos`)
- [ ] Manejar errores (try/catch)
- [ ] No bloquear proceso si falla Pusher

### Base de Datos
- [ ] Crear script SQL para insertar permiso
- [ ] Ejecutar script en BD
- [ ] Verificar que el permiso existe

### UI de Permisos
- [ ] Agregar permiso a `SECCIONES_ORDENADAS`
- [ ] Asignar a sección correcta
- [ ] Usar nomenclatura consistente

### Frontend
- [ ] Agregar listener en `GlobalNotificationListener`
- [ ] Verificar permisos antes de escuchar
- [ ] Agregar redirección en `NotificationBell`
- [ ] Implementar auto-recarga en página del módulo (opcional)

### Testing
- [ ] Probar con usuario CON permiso
- [ ] Probar con usuario SIN permiso
- [ ] Verificar sonido
- [ ] Verificar toast
- [ ] Verificar badge
- [ ] Verificar redirección
- [ ] Verificar auto-recarga

---

## 🚀 Próximos Pasos / Mejoras Futuras

- [ ] Agregar filtros de notificaciones por tipo
- [ ] Implementar "marcar todas como leídas"
- [ ] Agregar búsqueda en notificaciones
- [ ] Configuración de usuario (activar/desactivar sonidos)
- [ ] Notificaciones push (PWA)
- [ ] Integración con email para notificaciones críticas
- [ ] Sistema de prioridades (alta, media, baja)
- [ ] Agrupación de notificaciones similares

---

## 📚 Referencias

- [Documentación de Pusher](https://pusher.com/docs/)
- [API de Pusher Channels](https://pusher.com/docs/channels)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [React Context API](https://react.dev/reference/react/useContext)

---

## 📝 Notas Finales

- **Seguridad:** Los permisos se verifican en el frontend. Para mayor seguridad, también se pueden verificar en el backend.
- **Escalabilidad:** Pusher tiene límites según el plan. Monitorear uso en el dashboard.
- **Performance:** Las notificaciones son asíncronas y no bloquean operaciones críticas.
- **UX:** El sonido es generado (no requiere archivo), funciona en todos los navegadores modernos.

---

**Autor:** Sistema de Servicio Médico SJR
**Fecha:** Diciembre 2025
**Versión:** 1.0

---

¿Dudas? Revisa los ejemplos de código en este documento o consulta los archivos fuente en el proyecto. 🚀
