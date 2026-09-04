/**
 * PROVIWEB - Zona de Arte
 * Representa galería y arte visual
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const ArtZone = ({ position = [30, 0, -30], isActive, onEnter }) => {
  const groupRef = useRef();
  const framesRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'art');
  
  // Marcos de cuadros flotantes
  const artFrames = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: [
        (i % 4 - 1.5) * 6,
        3 + Math.floor(i / 4) * 5,
        -5 + (i % 2) * 10,
      ],
      rotation: [0, (Math.random() - 0.5) * 0.3, 0],
      gradient: `linear-gradient(${135 + i * 45}deg, hsl(${i * 45}, 70%, 50%), hsl(${i * 45 + 60}, 70%, 50%))`,
    }));
  }, []);
  
  useFrame((state) => {
    // Rotación suave de los marcos
    framesRef.current.forEach((frame, i) => {
      if (frame) {
        frame.rotation.y = artFrames[i].rotation[1] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.1;
      }
    });
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Portal */}
      <ZonePortal
        position={[0, 2, 0]}
        color={zoneConfig.color}
        isActive={isActive}
        onClick={onEnter}
        name={zoneConfig.name}
        icon={zoneConfig.icon}
      />
      
      {/* Plataforma */}
      <FloatingPlatform 
        position={[0, -1, 0]} 
        color={zoneConfig.color}
        size={[25, 0.5, 20]}
      />
      
      {/* Marcos de arte flotantes */}
      {artFrames.map((frame, i) => (
        <Float key={frame.id} speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
          <group 
            ref={el => framesRef.current[i] = el}
            position={frame.position}
          >
            {/* Marco */}
            <mesh castShadow>
              <boxGeometry args={[3.2, 4.2, 0.2]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
            {/* Lienzo */}
            <mesh position={[0, 0, 0.15]}>
              <planeGeometry args={[3, 4]} />
              <meshBasicMaterial color={frame.gradient.split(',')[1].trim().split(')')[0] + ')'} />
            </mesh>
            
            {/* Contenido HTML sobre el lienzo */}
            <Html
              transform
              occlude
              position={[0, 0, 0.2]}
              style={{
                width: '120px',
                height: '160px',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                background: frame.gradient,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}>
                {['🎨', '🖼️', '🖌️', '✨', '🌈', '🎭', '🎪', '🎬'][i]}
              </div>
            </Html>
          </group>
        </Float>
      ))}
      
      {/* Paleta de pintor gigante */}
      <Float speed={0.5} floatIntensity={0.3}>
        <group position={[-10, 4, 5]}>
          <mesh castShadow>
            <cylinderGeometry args={[2, 2, 0.3, 32]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Manchas de pintura */}
          {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map((color, i) => (
            <mesh key={i} position={[
              Math.cos((i / 5) * Math.PI * 2) * 1.2,
              0.2,
              Math.sin((i / 5) * Math.PI * 2) * 1.2,
            ]}>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </group>
      </Float>
      
      {/* Estatua abstracta */}
      <group position={[10, 0, 5]}>
        <mesh position={[0, 3, 0]} castShadow>
          <torusKnotGeometry args={[1.5, 0.4, 64, 8]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
};

export default ArtZone;
