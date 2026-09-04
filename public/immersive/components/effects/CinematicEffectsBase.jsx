/**
 * PROVIWEB - Efectos Cinematográficos Base
 * Efectos originales optimizados
 */

import React, { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Campo de estrellas
export const StarField = memo(({ count = 1000 }) => {
  const pointsRef = useRef();
  
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 200 + Math.random() * 300;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      
      col[i * 3] = 1;
      col[i * 3 + 1] = 1;
      col[i * 3 + 2] = 1;
    }
    
    return { positions: pos, colors: col };
  }, [count]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={1} vertexColors transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
});

// Nebulosa
export const DynamicNebula = memo(({ position = [0, 0, 0], color = '#a855f7', scale = 1 }) => {
  const nebulaRef = useRef();
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(0.5, color + '20');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);
  
  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });
  
  return (
    <mesh ref={nebulaRef} position={position} scale={scale}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial map={texture} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
});

// Rayos de luz
export const VolumetricRays = memo(({ position = [0, 50, 0], color = '#a855f7' }) => {
  const raysRef = useRef();
  
  const rays = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: (i / 6) * Math.PI * 2,
      length: 30 + Math.random() * 15
    }));
  }, []);
  
  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <group ref={raysRef} position={position}>
      {rays.map((ray) => (
        <mesh key={ray.id} position={[Math.cos(ray.angle) * 5, 0, Math.sin(ray.angle) * 5]} rotation={[0, ray.angle, Math.PI / 6]}>
          <coneGeometry args={[2, ray.length, 4, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
});

// Partículas
export const FairyDust = memo(({ count = 200 }) => {
  const pointsRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = Math.random() * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    return pos;
  }, [count]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position.array;
    
    if (Math.floor(time * 60) % 3 !== 0) return;
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.02;
      if (positions[i * 3 + 1] > 60) positions[i * 3 + 1] = 0;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#a855f7" transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
});

export default { StarField, DynamicNebula, VolumetricRays, FairyDust };
