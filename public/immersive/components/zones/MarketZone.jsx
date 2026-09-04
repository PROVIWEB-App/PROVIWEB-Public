/**
 * PROVIWEB - Zona de Marketplace
 * Representa tienda de instrumentos y arte
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const MarketZone = ({ position = [-30, 0, 30], isActive, onEnter }) => {
  const groupRef = useRef();
  const itemsRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'market');
  
  // Items del marketplace
  const marketItems = useMemo(() => {
    const items = [
      { icon: '🎸', name: 'Guitarra', price: '$250' },
      { icon: '🎹', name: 'Piano', price: '$800' },
      { icon: '🎨', name: 'Pinturas', price: '$45' },
      { icon: '🎤', name: 'Micrófono', price: '$120' },
      { icon: '🎧', name: 'Audífonos', price: '$180' },
      { icon: '📷', name: 'Cámara', price: '$600' },
    ];
    
    return items.map((item, i) => ({
      ...item,
      position: [
        (i % 3 - 1) * 6,
        2 + Math.floor(i / 3) * 4,
        -3,
      ],
    }));
  }, []);
  
  useFrame((state) => {
    // Rotación de items
    itemsRef.current.forEach((item, i) => {
      if (item) {
        item.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.3;
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
        size={[20, 0.5, 18]}
      />
      
      {/* Items flotantes */}
      {marketItems.map((item, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <group 
            ref={el => itemsRef.current[i] = el}
            position={item.position}
          >
            {/* Base del item */}
            <mesh castShadow>
              <cylinderGeometry args={[1.5, 1.5, 0.2, 16]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
            </mesh>
            
            {/* Etiqueta HTML */}
            <Html
              position={[0, 2, 0]}
              center
              distanceFactor={10}
            >
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: `2px solid ${zoneConfig.color}`,
                textAlign: 'center',
                color: 'white',
              }}>
                <div style={{ fontSize: '32px' }}>{item.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                  {item.name}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: zoneConfig.color,
                  fontWeight: 'bold',
                  marginTop: '4px',
                }}>
                  {item.price}
                </div>
              </div>
            </Html>
          </group>
        </Float>
      ))}
      
      {/* Caja registradora */}
      <group position={[6, 0, 4]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[3, 2, 2]} />
          <meshStandardMaterial color="#2a2a3e" />
        </mesh>
        {/* Pantalla */}
        <mesh position={[0, 2.2, 0.5]}>
          <planeGeometry args={[2, 1]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
        {/* Teclado */}
        <mesh position={[0, 1.1, 1.1]}>
          <planeGeometry args={[2.5, 0.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      
      {/* Carrito de compras */}
      <Float speed={0.8} floatIntensity={0.2}>
        <group position={[-6, 2, 4]}>
          <mesh castShadow>
            <boxGeometry args={[2, 0.1, 3]} />
            <meshStandardMaterial color="#silver" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Ruedas */}
          {[[-0.8, -0.5, -1.2], [0.8, -0.5, -1.2], [-0.8, -0.5, 1.2], [0.8, -0.5, 1.2]].map((pos, i) => (
            <mesh key={i} position={pos}>
              <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          ))}
          {/* Manija */}
          <mesh position={[0, 1.5, 2]}>
            <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
            <meshStandardMaterial color="#silver" />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

export default MarketZone;
