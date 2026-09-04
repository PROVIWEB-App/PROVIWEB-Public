/**
 * PROVIWEB - Monumento Aprendizaje
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentLearn = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const scrollRef = useRef();
  
  useFrame((state) => {
    if (!scrollRef.current) return;
    scrollRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });
  
  return (
    <group position={position}>
      {/* Pergamino desenrollado */}
      <mesh ref={scrollRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[2, 2, 8, 32, 1, true]} />
        <meshStandardMaterial 
          color="#f5f5dc"
          emissive="#10b981"
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Símbolos de conocimiento flotantes */}
      {['+', '×', '÷', '=', '√'].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[
            Math.cos(angle) * 4,
            4 + Math.sin(i) * 2,
            Math.sin(angle) * 4
          ]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial 
              color="#10b981"
              emissive="#10b981"
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
      
      {/* Gradas */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, i * 0.5, 5 + i * 0.8]}>
          <boxGeometry args={[12, 0.5, 1]} />
          <meshStandardMaterial color="#4a4a6a" />
        </mesh>
      ))}
    </group>
  );
};

export default MonumentLearn;
