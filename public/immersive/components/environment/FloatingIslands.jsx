/**
 * PROVIWEB - Islas Flotantes
 * Plataformas flotantes estilo Sky/Journey
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Isla individual flotante
const FloatingIsland = ({ position, scale = 1, color = '#a855f7' }) => {
  const groupRef = useRef();
  const floatOffset = useMemo(() => Math.random() * 100, []);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime + floatOffset;
    // Flotación suave
    groupRef.current.position.y = position[1] + Math.sin(time * 0.3) * 0.5;
    groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.02;
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Base de roca */}
      <mesh castShadow position={[0, -1, 0]}>
        <coneGeometry args={[3, 3, 8]} />
        <meshStandardMaterial 
          color="#5c4033" 
          roughness={0.9}
        />
      </mesh>
      
      {/* Plataforma superior */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[3, 2.5, 1, 8]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Borde brillante */}
      <mesh position={[0, 1, 0]}>
        <torusGeometry args={[3, 0.1, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Cristales emergentes */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 1.5;
        const z = Math.sin(angle) * 1.5;
        return (
          <mesh key={i} position={[x, 1.5, z]}>
            <coneGeometry args={[0.2, 1, 4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Sistema de islas
export const FloatingIslands = () => {
  const islands = useMemo(() => [
    { pos: [25, 8, 25], scale: 0.8, color: '#a855f7' },
    { pos: [-30, 12, -20], scale: 1, color: '#007BFF' },
    { pos: [35, 6, -30], scale: 0.6, color: '#f43f5e' },
    { pos: [-25, 10, 30], scale: 0.9, color: '#10b981' },
    { pos: [15, 15, -15], scale: 0.5, color: '#f59e0b' },
    { pos: [-35, 7, 10], scale: 0.7, color: '#8b5cf6' },
    { pos: [30, 9, 15], scale: 0.6, color: '#06b6d4' },
  ], []);
  
  return (
    <>
      {islands.map((island, i) => (
        <FloatingIsland
          key={i}
          position={island.pos}
          scale={island.scale}
          color={island.color}
        />
      ))}
    </>
  );
};

export default FloatingIslands;
