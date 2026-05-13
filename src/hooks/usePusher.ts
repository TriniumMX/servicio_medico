'use client';

import { useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher';
import { useNotifications } from '@/context/NotificationsContext';

interface PusherEventData {
  tipo: 'incapacidad' | 'referencia' | 'referencia_coordinador' | 'referencia_notificador' | 'aviso' | 'laboratorio' | 'general';
  titulo: string;
  mensaje: string;
  datos?: any;
}

interface UsePusherOptions {
  onNotification?: (data: PusherEventData) => void;
}

export function usePusher(canal: string, evento: string, options?: UsePusherOptions | undefined) {
  const { agregarNotificacion } = useNotifications();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Si options es undefined, no hacer nada (usuario sin permiso)
  const isEnabled = options !== undefined;

  // Función para generar un sonido de notificación bonito y llamativo
  const playBeep = () => {
    if (!audioContextRef.current) {
      console.warn('⚠️ AudioContext no disponible para reproducir sonido');
      return;
    }

    try {
      const ctx = audioContextRef.current;

      // En móvil, el AudioContext puede estar suspendido por políticas de autoplay
      if (ctx.state === 'suspended') {
        console.log('🔊 AudioContext suspendido, intentando reanudar...');
        ctx.resume().then(() => {
          console.log('✅ AudioContext reanudado');
          playBeepInternal(ctx);
        }).catch(err => {
          console.error('❌ Error reanudando AudioContext:', err);
        });
        return;
      }

      playBeepInternal(ctx);
    } catch (error) {
      console.error('❌ Error generando sonido:', error);
    }
  };

  const playBeepInternal = (ctx: AudioContext) => {
    try {
      const now = ctx.currentTime;

      // Crear un sonido tipo "ding-ding" con dos tonos
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine'; // Onda suave y agradable

        // Envelope ADSR para sonido más profesional
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01); // Attack
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05); // Decay
        gainNode.gain.setValueAtTime(0.2, startTime + duration - 0.1); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Melodía extendida tipo "campanitas" - do-mi-sol-mi (más larga y bonita)
      playTone(523.25, now, 0.2);         // C5 (Do)
      playTone(659.25, now + 0.18, 0.25); // E5 (Mi)
      playTone(783.99, now + 0.4, 0.3);   // G5 (Sol) - nota más alta
      playTone(659.25, now + 0.68, 0.35); // E5 (Mi) - regresa y se sostiene más

      // Agregar brillo con armónicos en toda la melodía
      const shimmer1 = ctx.createOscillator();
      const shimmerGain1 = ctx.createGain();
      shimmer1.connect(shimmerGain1);
      shimmerGain1.connect(ctx.destination);
      shimmer1.frequency.value = 1318.5; // E6
      shimmer1.type = 'sine';
      shimmerGain1.gain.setValueAtTime(0, now);
      shimmerGain1.gain.linearRampToValueAtTime(0.1, now + 0.02);
      shimmerGain1.gain.linearRampToValueAtTime(0, now + 0.5);
      shimmer1.start(now + 0.18);
      shimmer1.stop(now + 0.5);

      // Segundo brillo para el final
      const shimmer2 = ctx.createOscillator();
      const shimmerGain2 = ctx.createGain();
      shimmer2.connect(shimmerGain2);
      shimmerGain2.connect(ctx.destination);
      shimmer2.frequency.value = 1567.98; // G6
      shimmer2.type = 'sine';
      shimmerGain2.gain.setValueAtTime(0, now + 0.4);
      shimmerGain2.gain.linearRampToValueAtTime(0.12, now + 0.42);
      shimmerGain2.gain.linearRampToValueAtTime(0, now + 1.1);
      shimmer2.start(now + 0.4);
      shimmer2.stop(now + 1.1);

    } catch (error) {
      console.error('Error generando sonido:', error);
    }
  };

  useEffect(() => {
    // Si no está habilitado (sin permisos), no hacer nada
    if (!isEnabled) {
      return;
    }

    // Crear contexto de audio para generar el sonido de notificación
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('✅ AudioContext creado para notificaciones. Estado:', audioContextRef.current.state);

        // En móvil, el AudioContext inicia suspendido. Intentar reanudarlo con cualquier interacción
        const resumeAudioContext = () => {
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().then(() => {
              console.log('✅ AudioContext reanudado por interacción del usuario');
            });
          }
        };

        // Escuchar primera interacción para reanudar AudioContext
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
        document.addEventListener('click', resumeAudioContext, { once: true });
      } catch (e) {
        console.warn('⚠️ AudioContext no disponible:', e);
      }
    }

    // Obtener cliente de Pusher (lazy initialization)
    const client = getPusherClient();

    // Suscribirse al canal
    const channel = client.subscribe(canal);

    // Escuchar el evento
    channel.bind(evento, (data: PusherEventData) => {
      console.log('📢 Notificación recibida:', data);

      // Agregar la notificación al contexto
      agregarNotificacion({
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        datos: data.datos,
      });

      // Ejecutar callback personalizado si existe
      if (options?.onNotification) {
        options.onNotification(data);
      }

      // Reproducir sonido generado por código
      playBeep();

      // Mostrar toast notification nativa del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.titulo, {
          body: data.mensaje,
          icon: '/logo.png',
        });
      }
    });

    // Solicitar permiso para notificaciones del navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup: desuscribirse al desmontar
    return () => {
      channel.unbind(evento);
      client.unsubscribe(canal);
    };
  }, [canal, evento, agregarNotificacion, isEnabled, options]);
}
