/**
 * PROVIWEB - Monumento Mercado
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentMarket = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const coinRef = useRef();
  
  useFrame((state) => {
    if (!coinRef.current) return;
    coinRef.current.rotation.y = state.clock.elapsedTime;
    coinRef.current.position.y = 8 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
  });
  
  return (
    <group position={position}>
      {/* Moneda gigante */}
      <mesh ref={coinRef} position={[0, 8, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.3, 32]} />
        <meshStandardMaterial 
          color="#ffd700"
          metalness={1}
          roughness={0.2}
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Carrito de compras estilizado */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial 
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Ruedas */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.5, z]}>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      
      {/* Productos flotantes */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 6,
          5 + Math.random() * 3,
          (Math.random() - 0.5) * 6
        ]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial 
            color={`hsl(${Math.random() * 360}, 70%, 50%)`}
            emissive={`hsl(${Math.random() * 360}, 70%, 30%)`}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export default MonumentMarket;
