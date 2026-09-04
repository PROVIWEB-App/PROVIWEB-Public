/**
 * PROVIWEB - Monumento Eventos
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentEvents = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const stageRef = useRef();
  const lightsRef = useRef();
  
  useFrame((state) => {
    if (!stageRef.current || !lightsRef.current) return;
    const time = state.clock.elapsedTime;
    
    stageRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
    
    // Luces de discoteca
    lightsRef.current.children.forEach((light, i) => {
      light.material.color.setHSL((time * 0.2 + i * 0.2) % 1, 1, 0.5);
    });
  });
  
  return (
    <group position={position}>
      {/* Escenario circular */}
      <mesh ref={stageRef} position={[0, 1, 0]} receiveShadow>
        <cylinderGeometry args={[8, 9, 2, 32]} />
        <meshStandardMaterial 
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Cortinas */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 7;
        const z = Math.sin(angle) * 7;
        return (
          <mesh key={i} position={[x, 6, z]} rotation={[0, -angle, 0.2]}>
            <boxGeometry args={[2, 8, 0.2]} />
            <meshStandardMaterial 
              color="#dc143c"
              roughness={0.8}
            />
          </mesh>
        );
      })}
      
      {/* Luces de colores */}
      <group ref={lightsRef}>
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[
              Math.cos(angle) * 10,
              12,
              Math.sin(angle) * 10
            ]}>
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshBasicMaterial />
            </mesh>
          );
        })}
      </group>
      
      {/* Micrófono gigante */}
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 6, 16]} />
        <meshStandardMaterial color="#silver" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 11.5, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

export default MonumentEvents;
