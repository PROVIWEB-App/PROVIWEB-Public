/**
 * PROVIWEB - Centro de Mando (Diseño Limpio)
 */

import React, { useRef, useState, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Funciones disponibles
const FUNCTIONS = [
  { id: 'create-post', title: 'Post', icon: '✍️', color: '#ff6b35' },
  { id: 'upload-music', title: 'Música', icon: '🎵', color: '#a855f7' },
  { id: 'upload-art', title: 'Arte', icon: '🎨', color: '#ec4899' },
  { id: 'create-event', title: 'Evento', icon: '📅', color: '#6366f1' },
];

// Geometrías reutilizables
const coreGeometry = new THREE.IcosahedronGeometry(2, 1);
const innerGeometry = new THREE.SphereGeometry(1.2, 16, 16);
const ringGeometry = new THREE.TorusGeometry(4, 0.05, 8, 50);

const CommandCenter = memo(({ position, onFunctionSelect, playerPosition }) => {
  const groupRef = useRef();
  const coreRef = useRef();
  const ringsRef = useRef();
  const [hoveredFunc, setHoveredFunc] = useState(null);

  // Calcular distancia al jugador
  const distance = playerPosition ? 
    Math.sqrt(
      Math.pow(playerPosition[0] - position[0], 2) +
      Math.pow(playerPosition[1] - position[1], 2) +
      Math.pow(playerPosition[2] - position[2], 2)
    ) : 999;

  const isNear = distance < 40;

  useFrame((state) => {
    if (!groupRef.current || !coreRef.current || !ringsRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Rotación suave
    groupRef.current.rotation.y = time * 0.05;
    coreRef.current.rotation.y = time * 0.1;
    
    // Pulso del núcleo
    const scale = 1 + Math.sin(time * 2) * 0.1;
    coreRef.current.scale.setScalar(scale);
    
    // Rotación de anillos
    ringsRef.current.children.forEach((ring, i) => {
      ring.rotation.x = time * (0.1 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Núcleo exterior */}
      <mesh geometry={coreGeometry}>
        <meshBasicMaterial
          color="#a855f7"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Núcleo interior */}
      <mesh ref={coreRef} geometry={innerGeometry}>
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Anillos */}
      <group ref={ringsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[4 + i * 1.2, 0.05, 8, 50]} />
            <meshBasicMaterial
              color={['#a855f7', '#00d9ff', '#ff6b35'][i]}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Panel de funciones (visible cuando está cerca) */}
      {isNear && (
        <Html center position={[0, -6, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid rgba(168,85,247,0.5)',
            borderRadius: '16px',
            padding: '20px',
            width: '320px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              margin: '0 0 16px',
              color: '#00d9ff',
              fontSize: '14px',
              textTransform: 'uppercase',
              textAlign: 'center',
              letterSpacing: '2px'
            }}>
              🎛️ Crear Contenido
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {FUNCTIONS.map((func) => (
                <button
                  key={func.id}
                  onClick={() => onFunctionSelect && onFunctionSelect(func)}
                  onMouseEnter={() => setHoveredFunc(func.id)}
                  onMouseLeave={() => setHoveredFunc(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 8px',
                    background: hoveredFunc === func.id 
                      ? `linear-gradient(135deg, ${func.color}30, transparent)`
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${hoveredFunc === func.id ? func.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{func.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{func.title}</span>
                </button>
              ))}
            </div>
            
            <p style={{
              margin: '12px 0 0',
              color: '#666',
              fontSize: '11px',
              textAlign: 'center'
            }}>
              Click para crear nuevo contenido
            </p>
          </div>
        </Html>
      )}

      {/* Label cuando está lejos */}
      {!isNear && (
        <Html center position={[0, 5, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '10px 20px',
            borderRadius: '20px',
            color: '#a855f7',
            fontSize: '14px',
            fontWeight: 'bold',
            border: '1px solid rgba(168,85,247,0.5)'
          }}>
            🚀 Acércate para interactuar
          </div>
        </Html>
      )}
    </group>
  );
});

export default CommandCenter;
