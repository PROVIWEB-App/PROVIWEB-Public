/**
 * PROVIWEB - Cámara Libre (Optimizado)
 * Movimiento suave sin causar re-renders
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Teclas de control
const KEYS = {
  KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right',
  ArrowUp: 'forward', ArrowDown: 'backward', ArrowLeft: 'left', ArrowRight: 'right',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
  KeyQ: 'rotateLeft', KeyE: 'rotateRight',
  Space: 'up'
};

export const FreeCamera = ({ 
  startPosition = [0, 40, 100],
  onPositionChange,
  speed = 1.5
}) => {
  const { camera } = useThree();
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3(...startPosition));
  const rotationRef = useRef(0);
  const controlsRef = useRef({
    forward: false, backward: false, left: false, right: false,
    sprint: false, rotateLeft: false, rotateRight: false, up: false
  });
  const frameCount = useRef(0);
  const lastNotifiedPos = useRef([0, 0, 0]);
  
  // Throttle para notificaciones (cada 10 frames ~ 6 veces/segundo)
  const throttledNotify = useCallback((pos) => {
    const dx = Math.abs(pos[0] - lastNotifiedPos.current[0]);
    const dy = Math.abs(pos[1] - lastNotifiedPos.current[1]);
    const dz = Math.abs(pos[2] - lastNotifiedPos.current[2]);
    
    // Solo notificar si cambió significativamente o cada 30 frames
    if ((dx > 0.5 || dy > 0.5 || dz > 0.5) || frameCount.current % 30 === 0) {
      lastNotifiedPos.current = [...pos];
      if (onPositionChange) {
        onPositionChange(pos);
      }
    }
  }, [onPositionChange]);

  // Inicializar posición
  useEffect(() => {
    camera.position.set(...startPosition);
    camera.lookAt(0, 0, 0);
  }, [camera, startPosition]);

  // Event listeners para teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = KEYS[e.code];
      if (key) {
        controlsRef.current[key] = true;
      }
    };
    
    const handleKeyUp = (e) => {
      const key = KEYS[e.code];
      if (key) {
        controlsRef.current[key] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Teletransporte entre zonas
  useEffect(() => {
    const handleTeleport = (e) => {
      const { position: targetPosition } = e.detail;
      if (targetPosition) {
        const target = new THREE.Vector3(...targetPosition);
        const start = currentPos.current.clone();
        let progress = 0;
        
        const animate = () => {
          progress += 0.02;
          if (progress <= 1) {
            currentPos.current.lerpVectors(start, target, progress);
            camera.position.copy(currentPos.current);
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    };
    
    window.addEventListener('proviweb:immersive:teleport', handleTeleport);
    return () => window.removeEventListener('proviweb:immersive:teleport', handleTeleport);
  }, [camera]);

  useFrame((state, delta) => {
    frameCount.current++;
    const controls = controlsRef.current;
    const currentSpeed = controls.sprint ? speed * 2.5 : speed;
    
    // Rotación con Q/E
    if (controls.rotateLeft) {
      rotationRef.current += 0.03;
    }
    if (controls.rotateRight) {
      rotationRef.current -= 0.03;
    }
    
    // Calcular dirección basada en rotación
    const cos = Math.cos(rotationRef.current);
    const sin = Math.sin(rotationRef.current);
    
    directionRef.current.set(0, 0, 0);
    
    if (controls.forward) {
      directionRef.current.x -= sin;
      directionRef.current.z -= cos;
    }
    if (controls.backward) {
      directionRef.current.x += sin;
      directionRef.current.z += cos;
    }
    if (controls.left) {
      directionRef.current.x -= cos;
      directionRef.current.z += sin;
    }
    if (controls.right) {
      directionRef.current.x += cos;
      directionRef.current.z -= sin;
    }
    if (controls.up) {
      directionRef.current.y += 1;
    }
    
    // Normalizar y aplicar velocidad
    if (directionRef.current.length() > 0) {
      directionRef.current.normalize().multiplyScalar(currentSpeed);
    }
    
    // Nueva posición
    const newPos = currentPos.current.clone().add(directionRef.current);
    
    // Límites del mundo
    newPos.x = THREE.MathUtils.clamp(newPos.x, -150, 150);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -150, 150);
    newPos.y = THREE.MathUtils.clamp(newPos.y, 5, 100);
    
    // Aplicar posición
    currentPos.current.copy(newPos);
    camera.position.copy(currentPos.current);
    
    // Hacer que la cámara mire en la dirección de rotación
    const lookTarget = new THREE.Vector3(
      newPos.x - Math.sin(rotationRef.current) * 10,
      newPos.y,
      newPos.z - Math.cos(rotationRef.current) * 10
    );
    camera.lookAt(lookTarget);
    
    // Notificar con throttle
    throttledNotify([currentPos.current.x, currentPos.current.y, currentPos.current.z]);
  });
  
  return null;
};

export default FreeCamera;
