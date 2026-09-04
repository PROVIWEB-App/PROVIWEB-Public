/**
 * PROVIWEB - Zona del Feed (Posts y Reels)
 * Representa la sección de contenido social
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform, ContentIndicator } from './ZoneBase.jsx';

export const FeedZone = ({ position = [0, 0, -30], isActive, onEnter }) => {
  const groupRef = useRef();
  const cardsRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'feed');
  
  // Tarjetas de contenido flotantes
  const contentCards = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 15,
        2 + Math.random() * 4,
        (Math.random() - 0.5) * 10,
      ],
      rotation: [0, Math.random() * Math.PI, 0],
      type: i % 2 === 0 ? 'post' : 'reel',
    }));
  }, []);
  
  useFrame((state) => {
    // Animar tarjetas flotando
    cardsRef.current.forEach((card, i) => {
      if (card) {
        card.position.y = contentCards[i].position[1] + Math.sin(state.clock.elapsedTime + i) * 0.3;
        card.rotation.y += 0.002;
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
        size={[20, 0.5, 15]}
      />
      
      {/* Estructura de feed - torres de contenido */}
      <group position={[-8, 0, -5]}>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[4, 8, 4]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.5}
          />
        </mesh>
        {/* Pantallas de posts */}
        <mesh position={[0, 5, 2.1]}>
          <planeGeometry args={[3, 2]} />
          <meshBasicMaterial color="#007BFF" />
        </mesh>
        <mesh position={[0, 2, 2.1]}>
          <planeGeometry args={[3, 2]} />
          <meshBasicMaterial color="#007BFF" opacity={0.7} transparent />
        </mesh>
      </group>
      
      {/* Torre de reels */}
      <group position={[8, 0, -5]}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[2, 2, 8, 8]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.5}
          />
        </mesh>
        {/* Pantallas verticales de reels */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 2 + i * 2.5, 1.8]}>
            <planeGeometry args={[1.5, 2.5]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
        ))}
      </group>
      
      {/* Tarjetas de contenido flotantes */}
      {contentCards.map((card, i) => (
        <Float
          key={card.id}
          speed={1 + Math.random()}
          rotationIntensity={0.3}
          floatIntensity={0.5}
        >
          <mesh
            ref={el => cardsRef.current[i] = el}
            position={card.position}
            rotation={card.rotation}
          >
            <boxGeometry args={[2, 2.5, 0.2]} />
            <meshStandardMaterial
              color={card.type === 'post' ? '#007BFF' : '#f43f5e'}
              emissive={card.type === 'post' ? '#007BFF' : '#f43f5e'}
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Contenido HTML en la tarjeta */}
          <Html
            transform
            occlude
            position={[card.position[0], card.position[1], card.position[2] + 0.15]}
            style={{
              width: '180px',
              height: '220px',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <div 
              className="feed-card-preview"
              style={{
                background: 'rgba(22,22,29,0.95)',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontSize: '12px',
                border: `1px solid ${card.type === 'post' ? '#007BFF' : '#f43f5e'}`,
              }}
            >
              <div style={{ 
                height: '80px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '4px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                {card.type === 'post' ? '📝' : '🎬'}
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {card.type === 'post' ? 'Post destacado' : 'Reel viral'}
              </div>
              <div style={{ color: '#a0a0b0', fontSize: '10px' }}>
                @{['artista', 'musico', 'creator'][i % 3]}{card.id}
              </div>
              <div style={{ 
                marginTop: '8px', 
                display: 'flex', 
                gap: '8px',
                fontSize: '10px',
              }}>
                <span>❤️ {Math.floor(Math.random() * 1000)}</span>
                <span>💬 {Math.floor(Math.random() * 100)}</span>
              </div>
            </div>
          </Html>
        </Float>
      ))}
      
      {/* Indicador de contenido nuevo */}
      <ContentIndicator 
        position={[0, 0.5, 8]} 
        count={4} 
        total={6} 
        color={zoneConfig.color}
      />
      
      {/* Etiqueta de sección */}
      <Html position={[0, 8, 0]} center distanceFactor={10}>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: `2px solid ${zoneConfig.color}`,
          color: 'white',
          fontSize: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontWeight: 'bold' }}>{zoneConfig.sections.join(' • ')}</div>
        </div>
      </Html>
    </group>
  );
};

export default FeedZone;
