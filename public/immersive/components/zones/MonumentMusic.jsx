/**
 * PROVIWEB - Monumento Música
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentMusic = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  const noteRef = useRef();
  
  useFrame((state) => {
    if (!groupRef.current || !noteRef.current) return;
    
    const time = state.clock.elapsedTime;
    noteRef.current.rotation.y = time * 0.2;
    noteRef.current.position.y = 10 + Math.sin(time) * 1;
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Estructura de arpa */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
        <meshStandardMaterial color="#f43f5e" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Cuerdas */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-2 + i * 0.7, 4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 7, 4]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      ))}
      
      {/* Nota musical gigante */}
      <mesh ref={noteRef} position={[0, 10, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial 
          color="#f43f5e"
          emissive="#f43f5e"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Ondas sonoras */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3 + i, 3.2 + i, 32]} />
          <meshBasicMaterial 
            color="#f43f5e"
            transparent
            opacity={0.2 - i * 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export default MonumentMusic;
