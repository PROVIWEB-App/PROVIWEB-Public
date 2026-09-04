/**
 * PROVIWEB - Monumento Arte
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentArt = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const paletteRef = useRef();
  
  useFrame((state) => {
    if (!paletteRef.current) return;
    const time = state.clock.elapsedTime;
    paletteRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
  });
  
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  
  return (
    <group position={position}>
      {/* Paleta gigante */}
      <mesh ref={paletteRef} position={[0, 5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[4, 4, 0.5, 32]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Pinturas fluores centes */}
      {colors.map((color, i) => {
        const angle = (i / colors.length) * Math.PI * 2;
        const x = Math.cos(angle) * 2;
        const y = Math.sin(angle) * 2;
        return (
          <mesh key={i} position={[x, 5 + y, 0.5]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
      
      {/* Pincel flotante */}
      <mesh position={[5, 8, 0]}>
        <cylinderGeometry args={[0.2, 0.1, 6, 8]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      <mesh position={[5, 11, 0]}>
        <coneGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial color="#ff1493" emissive="#ff1493" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

export default MonumentArt;
