/**
 * PROVIWEB - Monumento Oportunidades
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentOpportunities = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const ladderRef = useRef();
  const starsRef = useRef();
  
  useFrame((state) => {
    if (!ladderRef.current || !starsRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Escalera que brilla
    ladderRef.current.children.forEach((step, i) => {
      const intensity = 0.3 + Math.sin(time * 2 + i * 0.5) * 0.2;
      step.material.emissiveIntensity = intensity;
    });
    
    // Estrellas que giran
    starsRef.current.rotation.y = time * 0.1;
  });
  
  return (
    <group position={position}>
      {/* Escalera al cielo */}
      <group ref={ladderRef}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[0, i * 1.5, 0]}>
            <boxGeometry args={[4, 0.2, 1]} />
            <meshStandardMaterial 
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>
      
      {/* Estrella en la cima */}
      <group ref={starsRef} position={[0, 20, 0]}>
        <mesh>
          <octahedronGeometry args={[2, 0]} />
          <meshStandardMaterial 
            color="#ffd700"
            emissive="#ffd700"
            emissiveIntensity={1}
          />
        </mesh>
        
        {/* Rayos de estrella */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[
              Math.cos(angle) * 3,
              0,
              Math.sin(angle) * 3
            ]} rotation={[0, angle, Math.PI / 2]}>
              <coneGeometry args={[0.3, 3, 4]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
          );
        })}
      </group>
      
      {/* Puertas de oportunidad */}
      {[[-5, 0], [5, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 4, z]}>
          <boxGeometry args={[0.2, 8, 4]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#06b6d4"
            emissiveIntensity={0.2}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
};

export default MonumentOpportunities;
