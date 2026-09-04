/**
 * PROVIWEB - Item Interactivo
 * Objetos que muestran información y pueden interactuar
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const InteractiveItem = ({ 
  position,
  title,
  description,
  icon,
  color = '#a855f7',
  onInteract,
  cameraPosition
}) => {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  
  // Calcular distancia a la cámara
  const distance = cameraPosition ? 
    Math.sqrt(
      Math.pow(cameraPosition[0] - position[0], 2) +
      Math.pow(cameraPosition[1] - position[1], 2) +
      Math.pow(cameraPosition[2] - position[2], 2)
    ) : 999;
  
  const isNear = distance < 12;
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Flotación
    meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.3;
    
    // Rotación
    meshRef.current.rotation.y = time * 0.5;
    meshRef.current.rotation.x = Math.sin(time) * 0.2;
    
    // Escala al acercarse
    const targetScale = isNear ? 1.3 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });
  
  const handleClick = () => {
    if (onInteract && isNear) onInteract({ title, description, icon });
  };
  
  return (
    <group>
      {/* Item flotante */}
      <mesh 
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1 : 0.5}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Halo */}
      <mesh position={[position[0], position[1] + Math.sin(Date.now() * 0.002) * 0.3, position[2]]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Etiqueta cuando está cerca */}
      {isNear && (
        <Html position={[position[0], position[1] + 2.5, position[2]]} center distanceFactor={10}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(26, 10, 46, 0.95), rgba(168, 85, 247, 0.3))',
            backdropFilter: 'blur(10px)',
            padding: '12px 20px',
            borderRadius: '12px',
            border: `2px solid ${color}`,
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: `0 0 30px ${color}40`,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            animation: 'pulse 1.5s infinite'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
            <div>{title}</div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              Click para interactuar
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default InteractiveItem;
