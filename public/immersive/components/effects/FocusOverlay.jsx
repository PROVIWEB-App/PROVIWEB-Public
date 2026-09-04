/**
 * PROVIWEB - Overlay de Enfoque
 * Oscurece el fondo cuando se selecciona un item
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FocusOverlay = ({ isActive, intensity = 0.7 }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  
  // Crear textura de vignette
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Gradiente radial desde el centro transparente hacia los bordes oscuros
    const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 400);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.4, 'rgba(0,0,0,0.3)');
    gradient.addColorStop(0.8, 'rgba(0,0,0,0.7)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);
  
  useFrame(() => {
    if (materialRef.current) {
      const targetOpacity = isActive ? intensity : 0;
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        0.05
      );
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, -50]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
};

export default FocusOverlay;
