/**
 * PROVIWEB - Monumento Feed
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentFeed = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  const pagesRef = useRef();
  
  useFrame((state) => {
    if (!groupRef.current || !pagesRef.current) return;
    
    const time = state.clock.elapsedTime;
    pagesRef.current.rotation.y = time * 0.05;
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2;
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Base del libro */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[6, 4, 1]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      
      {/* Páginas que giran */}
      <group ref={pagesRef} position={[0, 5, 0]}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh 
              key={i}
              position={[
                Math.cos(angle) * 2,
                Math.sin(i * 0.5) * 0.5,
                Math.sin(angle) * 2
              ]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[1.5, 2, 0.05]} />
              <meshStandardMaterial 
                color="#f5f5dc"
                emissive="#007BFF"
                emissiveIntensity={0.2}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Pluma gigante */}
      <mesh position={[0, 8, 0]}>
        <coneGeometry args={[0.3, 6, 8]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Tinta flotante */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = (Math.random() - 0.5) * 4;
        const y = 3 + Math.random() * 4;
        const z = (Math.random() - 0.5) * 4;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#007BFF" />
          </mesh>
        );
      })}
    </group>
  );
};

export default MonumentFeed;
