# 📢 Sistema de Notificaciones en Tiempo Real con Pusher

Este documento describe el sistema de notificaciones implementado en la aplicación del Servicio Médico.

## 🎯 Características

- ✅ Notificaciones en tiempo real con Pusher
- 🔔 Icono de campana en el header con contador de notificaciones no leídas
- 🎨 Toast notifications animadas cuando llega una notificación
- 🔊 Sonido de notificación (con fallback a beep generado)
- 💾 Almacenamiento persistente en localStorage
- 📱 Notificaciones del navegador nativas (con permiso del usuario)
- 🏥 Integración con el módulo de incapacidades

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── pusher.ts                          # Configuración de Pusher (cliente y servidor)
├── context/
│   └── NotificationsContext.tsx           # Context API para gestión de notificaciones
├── hooks/
│   └── usePusher.ts                       # Hook personalizado para usar Pusher
├── components/
│   ├── NotificationToast.tsx              # Componente de toasts emergentes
│   └── layout/
│       ├── NotificationBell.tsx           # Componente de campana de notificaciones
│       ├── Header.tsx                     # Header con campana integrada
│       └── MainLayout.tsx                 # Layout con provider de notificaciones
└── app/
    ├── dashboard/
    │   └── consultas/
    │       └── incapacidades/
    │           └── page.tsx               # Página que escucha notificaciones
    └── api/
        ├── pusher/
        │   └── test/
        │       └── route.ts               # Endpoint de prueba
        └── consultas/
            └── finalizar/
                └── route.ts               # Endpoint que envía notificaciones

public/
└── INSTRUCCIONES_SONIDO.md                # Instrucciones para agregar sonido personalizado
```

## ⚙️ Configuración

### 1. Variables de Entorno

Copia el archivo `.env.local.example` a `.env.local` y configura tus credenciales de Pusher:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```env
PUSHER_APP_ID=2092421
NEXT_PUBLIC_PUSHER_KEY=501f0013d5a510bf67b6
PUSHER_SECRET=740dd5865a48ec53b44e
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

### 2. Sonido de Notificación (Opcional)

El sistema tiene un beep generado por defecto, pero puedes agregar un sonido personalizado:

1. Descarga o crea un archivo de sonido en formato MP3
2. Renómbralo a `notification-sound.mp3`
3. Colócalo en la carpeta `public/`

Ver `public/INSTRUCCIONES_SONIDO.md` para más detalles.

## 🚀 Uso

### En el Frontend (Escuchar Notificaciones)

```typescript
import { usePusher } from '@/hooks/usePusher';

function MiComponente() {
  // Conectar al canal y evento de Pusher
  usePusher('incapacidades-channel', 'nueva-incapacidad');

  return <div>Mi componente</div>;
}
```

### En el Backend (Enviar Notificaciones)

```typescript
import { pusherServer } from '@/lib/pusher';

// Enviar notificación
await pusherServer.trigger('incapacidades-channel', 'nueva-incapacidad', {
  tipo: 'incapacidad',
  titulo: 'Nueva Solicitud de Incapacidad',
  mensaje: 'Juan Pérez ha solicitado 3 días de incapacidad',
  datos: {
    id_consulta: 123,
    no_nomina: '12345',
    dias: 3
  }
});
```

### Gestión de Notificaciones

```typescript
import { useNotifications } from '@/context/NotificationsContext';

function MiComponente() {
  const {
    notificaciones,      // Array de notificaciones
    noLeidas,           // Número de notificaciones no leídas
    agregarNotificacion, // Agregar notificación manual
    marcarComoLeida,    // Marcar como leída
    marcarTodasComoLeidas, // Marcar todas como leídas
    eliminarNotificacion, // Eliminar notificación
    limpiarNotificaciones // Limpiar todas
  } = useNotifications();

  return (
    <div>
      <p>Tienes {noLeidas} notificaciones no leídas</p>
    </div>
  );
}
```

## 🧪 Pruebas

### Probar Notificaciones Manualmente

1. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abrir la aplicación en el navegador:**
   - Navega a `http://localhost:3000/dashboard/consultas/incapacidades`

3. **Enviar una notificación de prueba:**
   - Método 1: Usando curl
     ```bash
     curl -X POST http://localhost:3000/api/pusher/test
     ```

   - Método 2: Desde el navegador
     - Abre una nueva pestaña y visita: `http://localhost:3000/api/pusher/test`
     - Usa una extensión como "REST Client" o "Postman" para hacer POST

4. **Verificar que funciona:**
   - Deberías ver un toast emergente
   - Escuchar un sonido
   - Ver el contador en la campana incrementarse
   - La notificación aparece en el panel de la campana

### Probar con Incapacidades Reales

1. Crea una consulta médica
2. Finaliza la consulta y marca la opción de "Incapacidad"
3. Completa los días y motivo
4. Al guardar, se enviará automáticamente una notificación en tiempo real

## 🔧 Canales y Eventos Disponibles

| Canal | Evento | Descripción |
|-------|--------|-------------|
| `incapacidades-channel` | `nueva-incapacidad` | Nueva solicitud de incapacidad |

Para agregar más canales/eventos, simplemente:
1. Agrega el `usePusher()` en el componente que necesite escuchar
2. Dispara el evento desde el backend con `pusherServer.trigger()`

## 📊 Estructura de Datos de Notificación

```typescript
interface Notification {
  id: string;                              // ID único generado
  tipo: 'incapacidad' | 'referencia' | 'general';  // Tipo de notificación
  titulo: string;                          // Título de la notificación
  mensaje: string;                         // Mensaje descriptivo
  fecha: string;                           // ISO timestamp
  leida: boolean;                          // Estado de lectura
  datos?: any;                             // Datos adicionales opcionales
}
```

## 🎨 Personalización

### Modificar el Estilo de los Toasts

Edita `src/components/NotificationToast.tsx`:
- Cambia los colores en las clases Tailwind
- Ajusta la duración de las animaciones
- Modifica el tiempo de auto-cierre (actualmente 5 segundos)

### Modificar el Icono de la Campana

Edita `src/components/layout/NotificationBell.tsx`:
- Cambia el componente `Bell` de lucide-react por otro icono
- Ajusta los estilos y animaciones

### Personalizar el Sonido

Edita `src/hooks/usePusher.ts`:
- Cambia `audioRef.current.volume` para ajustar el volumen (0.0 - 1.0)
- Modifica la función `playBeep()` para cambiar el beep de fallback

## 🔍 Debugging

### Ver logs de Pusher

En la consola del navegador:
```javascript
Pusher.logToConsole = true;
```

### Verificar Conexión

1. Abre las DevTools del navegador
2. Ve a la pestaña Network
3. Busca conexiones WebSocket
4. Deberías ver una conexión a Pusher

### Dashboard de Pusher

Visita https://dashboard.pusher.com/ para:
- Ver eventos en tiempo real
- Monitorear conexiones
- Ver estadísticas de uso
- Enviar eventos de prueba manualmente

## ⚠️ Solución de Problemas

### Las notificaciones no llegan

1. Verifica que las credenciales de Pusher estén correctas en `.env.local`
2. Asegúrate de que el archivo `.env.local` existe
3. Reinicia el servidor de desarrollo después de cambiar `.env.local`
4. Verifica la consola del navegador para errores
5. Revisa el Dashboard de Pusher para ver si los eventos se están disparando

### No se escucha el sonido

1. Verifica que el navegador tenga permiso para reproducir audio
2. Asegúrate de que el volumen del navegador no esté silenciado
3. Si no tienes `notification-sound.mp3`, el sistema usará un beep generado
4. Revisa la consola para errores de audio

### El contador de notificaciones no se actualiza

1. Verifica que el componente esté usando `useNotifications()`
2. Asegúrate de que el `NotificationsProvider` envuelva el componente
3. Revisa localStorage para ver si las notificaciones se están guardando

## 🚀 Próximos Pasos

- [ ] Agregar más tipos de notificaciones (referencias, laboratorio, etc.)
- [ ] Implementar filtros por tipo de notificación
- [ ] Agregar búsqueda en las notificaciones
- [ ] Configuración de usuario para activar/desactivar sonidos
- [ ] Notificaciones push (PWA)
- [ ] Integración con email para notificaciones importantes

## 📚 Referencias

- [Documentación de Pusher](https://pusher.com/docs/)
- [API de Pusher para JavaScript](https://pusher.com/docs/channels/using_channels/client-api)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
