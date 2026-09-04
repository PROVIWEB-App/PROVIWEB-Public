/**
 * PROVIWEB - Zona Social
 * Representa contactos y chat
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const SocialZone = ({ position = [0, 0, 30], isActive, onEnter }) => {
  const groupRef = useRef();
  const orbsRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'social');
  
  // Órbs de usuarios conectados
  const userOrbs = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 20,
        1 + Math.random() * 6,
        (Math.random() - 0.5) * 20,
      ],
      isOnline: Math.random() > 0.3,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }));
  }, []);
  
  useFrame((state) => {
    // Animar órbs flotando
    orbsRef.current.forEach((orb, i) => {
      if (orb) {
        orb.position.y = userOrbs[i].position[1] + Math.sin(state.clock.elapsedTime + i) * 0.4;
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
        size={[22, 0.5, 22]}
      />
      
      {/* Órbs de usuarios */}
      {userOrbs.map((orb, i) => (
        <Float key={orb.id} speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
          <mesh
            ref={el => orbsRef.current[i] = el}
            position={orb.position}
            castShadow
          >
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={orb.isOnline ? 0.5 : 0.1}
              transparent
              opacity={orb.isOnline ? 1 : 0.5}
            />
          </mesh>
          
          {/* Indicador de estado */}
          <mesh position={[orb.position[0] + 0.4, orb.position[1] - 0.4, orb.position[2]]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={orb.isOnline ? '#4ade80' : '#6b7280'} />
          </mesh>
        </Float>
      ))}
      
      {/* Estructura de chat central */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 5, 0]} castShadow>
          <cylinderGeometry args={[3, 3, 10, 16]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
        
        {/* Burbujas de chat flotantes */}
        {[-3, 0, 3].map((x, i) => (
          <Float key={i} speed={2} floatIntensity={0.5}>
            <mesh position={[x, 6 + i * 2, 3]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial
                color={i === 1 ? zoneConfig.color : '#8b5cf6'}
                transparent
                opacity={0.6}
              />
            </mesh>
          </Float>
        ))}
      </group>
      
      {/* Conexiones entre usuarios (líneas) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={4}
            array={new Float32Array([
              -5, 3, -5,
              5, 4, 5,
              5, 2, -5,
              -5, 5, 5,
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={zoneConfig.color} transparent opacity={0.2} />
      </line>
      
      {/* Panel de mensajes */}
      <Html position={[8, 4, 0]} center distanceFactor={12}>
        <div style={{
          background: 'rgba(22,22,29,0.95)',
          borderRadius: '12px',
          padding: '12px',
          width: '200px',
          border: `1px solid ${zoneConfig.color}`,
          color: 'white',
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: zoneConfig.color,
          }}>
            💬 Mensajes recientes
          </div>
          {['Ana: ¡Hola! 👋', 'Carlos: ¿Colaboramos?', 'María: Me encanta tu arte'].map((msg, i) => (
            <div key={i} style={{
              fontSize: '11px',
              padding: '6px',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRadius: '6px',
              marginBottom: '4px',
            }}>
              {msg}
            </div>
          ))}
        </div>
      </Html>
    </group>
  );
};

export default SocialZone;
