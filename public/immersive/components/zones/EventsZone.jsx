/**
 * PROVIWEB - Zona de Eventos
 * Representa eventos y transmisiones en vivo
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const EventsZone = ({ position = [30, 0, 30], isActive, onEnter }) => {
  const groupRef = useRef();
  const stageRef = useRef();
  const lightsRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'events');
  
  // Luces del escenario
  const stageLights = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      position: [
        (i - 2.5) * 3,
        8,
        -5,
      ],
      color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][i],
    }));
  }, []);
  
  useFrame((state) => {
    // Animar luces del escenario
    lightsRef.current.forEach((light, i) => {
      if (light) {
        light.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.3;
        light.position.x = stageLights[i].position[0] + Math.sin(state.clock.elapsedTime + i) * 0.5;
      }
    });
    
    // Rotación del escenario
    if (stageRef.current) {
      stageRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
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
        size={[22, 0.5, 20]}
      />
      
      {/* Escenario principal */}
      <group ref={stageRef} position={[0, 0, -6]}>
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[8, 9, 4, 32]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Plataforma del escenario */}
        <mesh position={[0, 4.1, 0]}>
          <cylinderGeometry args={[8, 8, 0.2, 32]} />
          <meshStandardMaterial color="#2a2a3e" />
        </mesh>
      </group>
      
      {/* Luces del escenario */}
      {stageLights.map((light, i) => (
        <group key={light.id} position={light.position}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color={light.color}
              emissive={light.color}
              emissiveIntensity={1}
            />
          </mesh>
          <spotLight
            ref={el => lightsRef.current[i] = el}
            color={light.color}
            intensity={1}
            angle={Math.PI / 6}
            penumbra={0.5}
            distance={30}
            target-position={[0, 0, -6]}
            castShadow
          />
        </group>
      ))}
      
      {/* Pantalla gigante */}
      <Float speed={0.5} floatIntensity={0.1}>
        <group position={[0, 10, -8]}>
          <mesh>
            <planeGeometry args={[12, 6]} />
            <meshStandardMaterial
              color="#000"
              emissive={zoneConfig.color}
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Contenido HTML en la pantalla */}
          <Html
            transform
            position={[0, 0, 0.1]}
            style={{
              width: '400px',
              height: '200px',
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%)',
              border: `2px solid ${zoneConfig.color}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <div style={{ 
                fontSize: '48px', 
                animation: 'pulse 2s infinite',
              }}>
                📡 EN VIVO
              </div>
              <div style={{ marginTop: '16px', fontSize: '18px' }}>
                Concierto de Jazz - Hoy 8PM
              </div>
              <div style={{ 
                marginTop: '8px', 
                padding: '4px 12px',
                background: zoneConfig.color,
                borderRadius: '12px',
                fontSize: '14px',
              }}>
                🔴 1,234 espectadores
              </div>
            </div>
          </Html>
        </group>
      </Float>
      
      {/* Asientos/butacas */}
      {Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return (
          <mesh
            key={i}
            position={[
              (col - 1.5) * 3,
              0.5,
              4 + row * 3,
            ]}
            castShadow
          >
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>
        );
      })}
      
      {/* Globos/decoraciones */}
      <Float speed={1} floatIntensity={0.5}>
        <group position={[-8, 6, 4]}>
          {['🎈', '🎊', '🎉'].map((emoji, i) => (
            <Html key={i} position={[i * 2, 0, 0]} center distanceFactor={10}>
              <div style={{ fontSize: '48px' }}>{emoji}</div>
            </Html>
          ))}
        </group>
      </Float>
    </group>
  );
};

export default EventsZone;
