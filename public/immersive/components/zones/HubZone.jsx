/**
 * PROVIWEB - Zona Central (Hub)
 * Punto de partida y navegación principal
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform, EnergyFlow } from './ZoneBase.jsx';

export const HubZone = ({ position = [0, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  const beaconRef = useRef();
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'hub');
  
  // Estructura del hub
  const pillars = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 6;
      return {
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        rotation: [0, -angle, 0],
        color: i % 2 === 0 ? '#a855f7' : '#007BFF',
      };
    });
  }, []);
  
  useFrame((state) => {
    // Rotación lenta del grupo
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
    
    // Pulso del beacon central
    if (beaconRef.current) {
      beaconRef.current.material.emissiveIntensity = 
        0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Portal principal */}
      <ZonePortal
        position={[0, 2, 0]}
        color={zoneConfig.color}
        isActive={isActive}
        onClick={onEnter}
        name={zoneConfig.name}
        icon={zoneConfig.icon}
      />
      
      {/* Plataforma central */}
      <FloatingPlatform 
        position={[0, -1, 0]} 
        color={zoneConfig.color}
        size={[12, 0.5, 12]}
      />
      
      {/* Pilares circulares */}
      {pillars.map((pillar, i) => (
        <group key={i} position={pillar.position}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.5, 6, 8]} />
            <meshStandardMaterial
              color={pillar.color}
              emissive={pillar.color}
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Luz en la punta del pilar */}
          <pointLight
            color={pillar.color}
            intensity={0.5}
            distance={10}
            position={[0, 6, 0]}
          />
        </group>
      ))}
      
      {/* Beacon central */}
      <mesh ref={beaconRef} position={[0, 8, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#a855f7"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Rayo de luz central */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[0.1, 2, 20, 8, 1, true]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Flujos de energía hacia otras zonas */}
      <EnergyFlow position={[0, 0.5, 0]} color={zoneConfig.color} radius={8} />
      <EnergyFlow position={[0, 1, 0]} color={zoneConfig.color} radius={9} />
      
      {/* Indicadores de zonas vecinas */}
      {IMMERSIVE_CONFIG.availableZones.filter(z => z.id !== 'hub').map((zone, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 10;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <Html
            key={zone.id}
            position={[x, 3, z]}
            center
            distanceFactor={15}
          >
            <div
              className="hub-zone-indicator"
              style={{
                background: `rgba(0,0,0,0.6)`,
                padding: '4px 8px',
                borderRadius: '12px',
                border: `1px solid ${zone.color}`,
                color: zone.color,
                fontSize: '11px',
                cursor: 'pointer',
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('proviweb:immersive:goto', { detail: zone.id }))}
            >
              {zone.icon} {zone.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
};

export default HubZone;
