/**
 * PROVIWEB - Cámara con Transiciones Cinematográficas
 * Viajes suaves entre zonas con animación de acercamiento
 */

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Posiciones de zonas - Cámara a nivel de los monumentos para ver de frente
export const ZONE_POSITIONS = {
  hub: { 
    pos: [0, 25, 80],      // Más cerca y más bajo
    lookAt: [0, 12, 0],    // Mira al centro del monumento
    name: 'Centro Creativo'
  },
  feed: { 
    pos: [0, 20, -60],     // Frente a la torre de cristal
    lookAt: [0, 15, -120], // Mira la torre
    name: 'Valle del Feed'
  },
  music: { 
    pos: [60, 20, 40],     // Frente al altavoz
    lookAt: [120, 12, 0],  // Mira el altavoz
    name: 'Armonía Musical'
  },
  art: { 
    pos: [60, 20, -60],    // Frente al lienzo
    lookAt: [120, 15, -120],
    name: 'Galería Etereal'
  },
  social: { 
    pos: [0, 20, 60],      // Frente al puente
    lookAt: [0, 12, 120],
    name: 'Puente Social'
  },
  learn: { 
    pos: [-60, 25, -60],   // Frente a la torre de libros
    lookAt: [-120, 18, -120],
    name: 'Monte del Conocimiento'
  },
  market: { 
    pos: [-60, 20, 60],    // Frente al bazar
    lookAt: [-120, 12, 120],
    name: 'Bazar Creativo'
  },
  events: { 
    pos: [60, 20, 60],     // Frente al escenario
    lookAt: [120, 12, 120],
    name: 'Plaza de Eventos'
  },
  opportunities: { 
    pos: [-60, 20, 40],    // Frente al horizonte
    lookAt: [-120, 12, 0],
    name: 'Horizonte de Oportunidades'
  }
};

// Curva de animación ease-in-out-cubic suave
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const StaticCamera = ({ 
  currentZone = 'hub',
  onPositionChange,
  onTravelStart,
  onTravelEnd
}) => {
  const { camera } = useThree();
  
  // Refs para animación
  const currentPos = useRef(new THREE.Vector3(...ZONE_POSITIONS.hub.pos));
  const targetPos = useRef(new THREE.Vector3(...ZONE_POSITIONS.hub.pos));
  const currentLookAt = useRef(new THREE.Vector3(...ZONE_POSITIONS.hub.lookAt));
  const targetLookAt = useRef(new THREE.Vector3(...ZONE_POSITIONS.hub.lookAt));
  const isTraveling = useRef(false);
  const travelProgress = useRef(0);
  const travelDuration = useRef(2.5); // segundos
  const startPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const lastZone = useRef(currentZone);
  const idleTime = useRef(0);

  // Inicializar cámara
  useEffect(() => {
    const initial = ZONE_POSITIONS[currentZone] || ZONE_POSITIONS.hub;
    camera.position.set(...initial.pos);
    camera.lookAt(...initial.lookAt);
    currentPos.current.set(...initial.pos);
    targetPos.current.set(...initial.pos);
    currentLookAt.current.set(...initial.lookAt);
    targetLookAt.current.set(...initial.lookAt);
  }, []);

  // Detectar cambio de zona y iniciar viaje
  useEffect(() => {
    if (currentZone !== lastZone.current) {
      const zone = ZONE_POSITIONS[currentZone] || ZONE_POSITIONS.hub;
      
      // Guardar posición inicial
      startPos.current.copy(currentPos.current);
      startLookAt.current.copy(currentLookAt.current);
      
      // Configurar destino
      targetPos.current.set(...zone.pos);
      targetLookAt.current.set(...zone.lookAt);
      
      // Iniciar animación de viaje
      isTraveling.current = true;
      travelProgress.current = 0;
      
      // Notificar inicio de viaje
      if (onTravelStart) {
        onTravelStart(zone.name);
      }
      
      lastZone.current = currentZone;
    }
  }, [currentZone, onTravelStart]);

  useFrame((state, delta) => {
    // Animación de viaje
    if (isTraveling.current) {
      travelProgress.current += delta / travelDuration.current;
      
      if (travelProgress.current >= 1) {
        travelProgress.current = 1;
        isTraveling.current = false;
        
        // Notificar fin de viaje
        if (onTravelEnd) {
          onTravelEnd();
        }
      }
      
      const t = easeInOutCubic(travelProgress.current);
      
      // Fase 1: Alejarse y subir (0% - 30%)
      // Fase 2: Viajar por arriba (30% - 70%)
      // Fase 3: Acercarse y bajar (70% - 100%)
      
      let animatedT = t;
      let heightOffset = 0;
      
      if (t < 0.3) {
        // Fase de despegue - subir
        const phaseT = t / 0.3;
        heightOffset = Math.sin(phaseT * Math.PI / 2) * 40;
      } else if (t > 0.7) {
        // Fase de aterrizaje - bajar
        const phaseT = (t - 0.7) / 0.3;
        heightOffset = Math.cos(phaseT * Math.PI / 2) * 40;
      } else {
        // Fase de crucero - altura máxima
        heightOffset = 40;
      }
      
      // Interpolar posición horizontal
      currentPos.current.lerpVectors(startPos.current, targetPos.current, t);
      
      // Añadir altura de arco
      currentPos.current.y = THREE.MathUtils.lerp(
        startPos.current.y, 
        targetPos.current.y, 
        t
      ) + heightOffset;
      
      // Interpolar lookAt
      currentLookAt.current.lerpVectors(startLookAt.current, targetLookAt.current, t);
      
      // Aplicar
      camera.position.copy(currentPos.current);
      camera.lookAt(currentLookAt.current);
      
    } else {
      // Idle - pequeña animación de respiración
      idleTime.current += delta;
      const breathY = Math.sin(idleTime.current * 0.3) * 1.5;
      camera.position.y = currentPos.current.y + breathY;
      
      // Suave rotación idle
      const breathRot = Math.sin(idleTime.current * 0.15) * 0.02;
      camera.lookAt(
        currentLookAt.current.x + breathRot * 10,
        currentLookAt.current.y,
        currentLookAt.current.z
      );
    }
    
    // Notificar posición cada ~0.5 segundos
    if (state.clock.elapsedTime % 0.5 < delta && onPositionChange) {
      onPositionChange([camera.position.x, camera.position.y, camera.position.z]);
    }
  });
  
  return null;
};

export default StaticCamera;
