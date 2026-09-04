/**
 * PROVIWEB - Zona de Oportunidades
 * Representa convocatorias y colaboraciones
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const OpportunitiesZone = ({ position = [-30, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  const crystalsRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'opportunities');
  
  // Cristales de oportunidades
  const crystals = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: [
        Math.cos((i / 8) * Math.PI * 2) * 8,
        1 + Math.random() * 4,
        Math.sin((i / 8) * Math.PI * 2) * 8,
      ],
      type: i % 2 === 0 ? 'convocatoria' : 'colaboracion',
      color: i % 2 === 0 ? '#06b6d4' : '#10b981',
    }));
  }, []);
  
  useFrame((state) => {
    // Animar cristales
    crystalsRef.current.forEach((crystal, i) => {
      if (crystal) {
        crystal.rotation.y += 0.01;
        crystal.position.y = crystals[i].position[1] + Math.sin(state.clock.elapsedTime + i) * 0.3;
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
        size={[18, 0.5, 18]}
      />
      
      {/* Cristales de oportunidades */}
      {crystals.map((crystal, i) => (
        <Float key={crystal.id} speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <mesh
            ref={el => crystalsRef.current[i] = el}
            position={crystal.position}
            castShadow
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={crystal.color}
              emissive={crystal.color}
              emissiveIntensity={0.4}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Etiqueta del cristal */}
          <Html
            position={[crystal.position[0], crystal.position[1] + 2, crystal.position[2]]}
            center
            distanceFactor={12}
          >
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${crystal.color}`,
              color: crystal.color,
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}>
              {crystal.type === 'convocatoria' ? '💼 Convocatoria' : '🤝 Colaboración'}
            </div>
          </Html>
        </Float>
      ))}
      
      {/* Estructura de torre de oportunidades */}
      <group position={[-6, 0, -6]}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[2, 3, 8, 8]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.4}
          />
        </mesh>
        {/* Ventanas iluminadas */}
        {[1, 3, 5, 7].map((y, i) => (
          <mesh key={i} position={[1.8, y, 0]}>
            <planeGeometry args={[0.8, 1.2]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>
        ))}
      </group>
      
      {/* Puesto de colaboraciones */}
      <group position={[6, 0, -6]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Cartel */}
        <mesh position={[0, 4.5, 0]}>
          <boxGeometry args={[3, 1, 0.2]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
        </mesh>
      </group>
      
      {/* Flechas indicadoras de dirección */}
      <group position={[0, 0.5, 10]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.5, 1.5, 4]} />
          <meshStandardMaterial color={zoneConfig.color} emissive={zoneConfig.color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
};

export default OpportunitiesZone;
