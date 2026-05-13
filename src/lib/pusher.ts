// src/lib/pusher.ts
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Instancia para el SERVIDOR (Backend)
// Esta se usa para DISPARAR (trigger) eventos
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2092421",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "501f0013d5a510bf67b6",
  secret: process.env.PUSHER_SECRET || "740dd5865a48ec53b44e",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  useTLS: true,
});

// Instancia para el CLIENTE (Frontend)
// Esta se usa para ESCUCHAR (subscribe) eventos
// Lazy initialization para evitar errores en el servidor
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient => {
  // Solo crear en el navegador
  if (typeof window === 'undefined') {
    throw new Error('pusherClient solo puede usarse en el navegador');
  }

  // Singleton: crear solo una vez
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "501f0013d5a510bf67b6",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      }
    );
  }

  return pusherClientInstance;
};