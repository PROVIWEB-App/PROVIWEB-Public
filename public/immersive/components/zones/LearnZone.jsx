/**
 * PROVIWEB - Zona de Aprendizaje
 * Representa tutoriales y educación
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const LearnZone = ({ position = [-30, 0, -30], isActive, onEnter }) => {
  const groupRef = useRef();
  const booksRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'learn');
  
  // Libros flotantes
  const books = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 16,
        2 + Math.random() * 5,
        (Math.random() - 0.5) * 16,
      ],
      rotation: [Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5],
      color: `hsl(${120 + Math.random() * 60}, 60%, ${40 + Math.random() * 20}%)`,
    }));
  }, []);
  
  useFrame((state) => {
    // Flotación de libros
    booksRef.current.forEach((book, i) => {
      if (book) {
        book.position.y = books[i].position[1] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2;
        book.rotation.y += 0.005;
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
        size={[20, 0.5, 20]}
      />
      
      {/* Libros flotantes */}
      {books.map((book, i) => (
        <Float key={book.id} speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh
            ref={el => booksRef.current[i] = el}
            position={book.position}
            rotation={book.rotation}
            castShadow
          >
            <boxGeometry args={[1.5, 2, 0.4]} />
            <meshStandardMaterial color={book.color} />
          </mesh>
        </Float>
      ))}
      
      {/* Estante de libros central */}
      <group position={[0, 0, -6]}>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[10, 8, 2]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
        {/* Libros en el estante */}
        {Array.from({ length: 15 }, (_, i) => (
          <mesh
            key={i}
            position={[
              -4 + (i % 5) * 2,
              1 + Math.floor(i / 5) * 2.5,
              1.2,
            ]}
          >
            <boxGeometry args={[0.3, 1.8, 1.2]} />
            <meshStandardMaterial color={`hsl(${Math.random() * 360}, 50%, 50%)`} />
          </mesh>
        ))}
      </group>
      
      {/* Pizarra flotante */}
      <Float speed={0.5} floatIntensity={0.2}>
        <group position={[7, 5, 0]}>
          <mesh>
            <planeGeometry args={[5, 3]} />
            <meshStandardMaterial color="#1a472a" />
          </mesh>
          {/* Marco */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[5.2, 3.2]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          
          {/* Contenido HTML */}
          <Html transform position={[0, 0, 0.05]} style={{ width: '150px', height: '90px' }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#1a472a',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '10px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <div>📚 Tutorial: Acordes</div>
              <div style={{ marginTop: '8px', color: '#90ee90' }}>
                C - Am - F - G
              </div>
              <div style={{ marginTop: '4px', fontSize: '8px', color: '#aaa' }}>
                Próximo: Escala Mayor
              </div>
            </div>
          </Html>
        </group>
      </Float>
      
      {/* Graduación cap */}
      <Float speed={1} rotationIntensity={0.3}>
        <group position={[-7, 6, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.2, 1.2, 1, 16]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
          {/* Borla */}
          <mesh position={[1.2, 0.5, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffd700" />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

export default LearnZone;
