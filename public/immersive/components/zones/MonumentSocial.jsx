/**
 * PROVIWEB - Monumento Social
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentSocial = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child.type === 'Mesh') {
        child.position.y = Math.sin(time + i) * 0.3;
      }
    });
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Manos entrelazadas */}
      {Array.from({ length: 3 }, (_, i) => (
        <mesh key={i} position={[i * 2 - 2, 5, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial 
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Anillos de conexión */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 2 + i * 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3 + i * 0.5, 0.1, 8, 50]} />
          <meshBasicMaterial 
            color="#8b5cf6"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export default MonumentSocial;
