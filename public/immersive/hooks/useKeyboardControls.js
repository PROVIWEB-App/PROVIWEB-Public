/**
 * PROVIWEB - Hook para controles de teclado
 * Maneja el input del teclado para el personaje
 */

import { useState, useEffect, useCallback } from 'react';

// Mapa de teclas
const KEYS = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  Space: 'jump',
};

export const useKeyboardControls = () => {
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
  });
  
  const handleKeyDown = useCallback((e) => {
    const key = KEYS[e.code];
    if (key) {
      setControls((prev) => ({ ...prev, [key]: true }));
    }
  }, []);
  
  const handleKeyUp = useCallback((e) => {
    const key = KEYS[e.code];
    if (key) {
      setControls((prev) => ({ ...prev, [key]: false }));
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  return controls;
};

// Hook para controles táctiles (móvil)
export const useTouchControls = () => {
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  
  useEffect(() => {
    const handleTouchStart = (e) => {
      setIsTouching(true);
    };
    
    const handleTouchMove = (e) => {
      if (!isTouching) return;
      const touch = e.touches[0];
      // Calcular posición relativa del joystick
      const centerX = window.innerWidth * 0.2;
      const centerY = window.innerHeight * 0.8;
      const deltaX = (touch.clientX - centerX) / 50;
      const deltaY = (touch.clientY - centerY) / 50;
      
      setJoystick({
        x: Math.max(-1, Math.min(1, deltaX)),
        y: Math.max(-1, Math.min(1, deltaY)),
      });
    };
    
    const handleTouchEnd = () => {
      setIsTouching(false);
      setJoystick({ x: 0, y: 0 });
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouching]);
  
  return {
    forward: joystick.y < -0.3,
    backward: joystick.y > 0.3,
    left: joystick.x < -0.3,
    right: joystick.x > 0.3,
    sprint: isTouching,
    jump: false,
    joystick,
    isTouching,
  };
};

export default useKeyboardControls;
