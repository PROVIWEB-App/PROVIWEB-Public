/**
 * PROVIWEB - Monumento Central Espacial
 * Estación espacial central
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MonumentHub = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  const ringRef = useRef();
  const coreRef = useRef();
  const orbitRef = useRef();
  
  useFrame((state) => {
    if (!groupRef.current || !ringRef.current || !coreRef.current || !orbitRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Rotación del anillo
    ringRef.current.rotation.z = time * 0.1;
    ringRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    
    // Pulso del núcleo
    const scale = 1 + Math.sin(time * 3) * 0.15;
    coreRef.current.scale.setScalar(scale);
    coreRef.current.material.emissiveIntensity = 0.8 + Math.sin(time * 4) * 0.4;
    
    // Órbita de satélites
    orbitRef.current.rotation.y = time * 0.15;
    
    // Flotación del grupo
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.3;
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Núcleo de energía */}
      <mesh ref={coreRef} position={[0, 6, 0]}>
        <icosahedronGeometry args={[2.5, 1]} />
        <meshStandardMaterial 
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Anillo exterior giratorio */}
      <mesh ref={ringRef} position={[0, 6, 0]}>
        <torusGeometry args={[6, 0.4, 16, 100]} />
        <meshStandardMaterial 
          color="#00d9ff"
          emissive="#00d9ff"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Anillo interior */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0.3, 0]}>
        <torusGeometry args={[4, 0.2, 12, 60]} />
        <meshStandardMaterial 
          color="#ff6b35"
          emissive="#ff6b35"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Satélites orbitando */}
      <group ref={orbitRef} position={[0, 6, 0]}>
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 8;
          const z = Math.sin(angle) * 8;
          return (
            <mesh key={i} position={[x, 0, z]}>
              <octahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial 
                color="#ffd700"
                emissive="#ffd700"
                emissiveIntensity={1}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Plataforma base flotante */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[10, 8, 1, 8]} />
        <meshStandardMaterial 
          color="#2d1b4e"
          emissive="#a855f7"
          emissiveIntensity={0.2}
          roughness={0.6}
          metalness={0.8}
        />
      </mesh>
      
      {/* Pilares de energía */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 7;
        const z = Math.sin(angle) * 7;
        return (
          <mesh key={i} position={[x, 3, z]}>
            <cylinderGeometry args={[0.3, 0.3, 6, 8]} />
            <meshStandardMaterial 
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default MonumentHub;
