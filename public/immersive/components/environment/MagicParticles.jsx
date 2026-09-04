/**
 * PROVIWEB - Partículas Mágicas
 * Flotan y brillan como en Journey
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MagicParticles = ({ count = 150, enabled = true }) => {
  const pointsRef = useRef();
  
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    
    const colorPalette = [
      new THREE.Color('#ff6b35'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#ffd700'),
      new THREE.Color('#00d9ff'),
      new THREE.Color('#ff1493'),
    ];
    
    for (let i = 0; i < count; i++) {
      // Posiciones dispersas
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = 5 + Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
      
      // Colores aleatorios de la paleta
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      
      // Tamaños variados
      sz[i] = 0.1 + Math.random() * 0.4;
    }
    
    return { positions: pos, colors: col, sizes: sz };
  }, [count]);
  
  useFrame((state) => {
    if (!enabled || !pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      // Flotación suave
      positions[i * 3 + 1] += Math.sin(time * 0.5 + i) * 0.02;
      
      // Movimiento en espiral muy lento
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const angle = 0.001;
      positions[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
      positions[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  if (!enabled) return null;
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default MagicParticles;
