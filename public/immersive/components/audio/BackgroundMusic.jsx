/**
 * PROVIWEB - Música de Fondo
 * Reproduce música ambiental del proyecto
 */

import React, { useEffect, useRef, useState } from 'react';

export const BackgroundMusic = ({ 
  src = '/assets/torresdearenalucida.mp3',
  volume = 0.4,
  autoplay = true 
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    
    if (autoplay) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log('[Audio] Autoplay bloqueado, esperando interacción');
      });
    }
    
    const handleFirstInteraction = () => {
      if (audio.paused) {
        audio.play().then(() => setIsPlaying(true));
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      audio.pause();
    };
  }, [src, volume, autoplay]);
  
  return null;
};

export default BackgroundMusic;
