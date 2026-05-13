'use client';

import { useEffect } from 'react';

/**
 * Componente helper para activar el contexto de audio
 * al primer click del usuario (requerimiento de navegadores modernos)
 */
export default function AudioPermissionHelper() {
  useEffect(() => {
    const activarAudio = () => {
      // Crear y activar AudioContext
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();

        // Reproducir silencio muy breve para "desbloquear" el audio
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 0.001; // Casi inaudible
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.01);

        console.log('✅ Audio desbloqueado - las notificaciones sonarán correctamente');

        // Remover el listener después de activar
        document.removeEventListener('click', activarAudio);
        document.removeEventListener('touchstart', activarAudio);
      }
    };

    // Activar audio al primer click o touch
    document.addEventListener('click', activarAudio, { once: true });
    document.addEventListener('touchstart', activarAudio, { once: true });

    return () => {
      document.removeEventListener('click', activarAudio);
      document.removeEventListener('touchstart', activarAudio);
    };
  }, []);

  return null; // No renderiza nada
}
