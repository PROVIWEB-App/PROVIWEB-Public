/**
 * PROVIWEB - Zona de Música
 * Representa la sección de música y artistas
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { IMMERSIVE_CONFIG } from '../../config.js';
import { ZonePortal, FloatingPlatform } from './ZoneBase.jsx';

export const MusicZone = ({ position = [30, 0, 0], isActive, onEnter }) => {
  const groupRef = useRef();
  const waveformRef = useRef();
  const notesRef = useRef([]);
  
  const zoneConfig = IMMERSIVE_CONFIG.availableZones.find(z => z.id === 'music');
  
  // Notas musicales flotantes
  const musicNotes = useMemo(() => {
    const notes = ['♪', '♫', '♬', '♩', '♭', '♮', '♯'];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      note: notes[i % notes.length],
      position: [
        (Math.random() - 0.5) * 20,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * 20,
      ],
      speed: 0.5 + Math.random() * 1,
    }));
  }, []);
  
  // Barras del visualizador
  const visualizerBars = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      x: (i - 8) * 1.5,
      baseHeight: 1 + Math.random() * 3,
    }));
  }, []);
  
  useFrame((state) => {
    // Animar notas musicales
    notesRef.current.forEach((note, i) => {
      if (note) {
        note.position.y = musicNotes[i].position[1] + Math.sin(state.clock.elapsedTime * musicNotes[i].speed) * 1;
        note.rotation.y += 0.01;
      }
    });
    
    // Animar barras del visualizador
    if (waveformRef.current) {
      waveformRef.current.children.forEach((bar, i) => {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + i * 0.5) * 0.5;
        bar.scale.y = Math.max(0.2, scale);
      });
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
      
      {/* Plataforma con forma de vinilo */}
      <group position={[0, -1, 0]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[12, 12, 0.5, 32]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.3}
          />
        </mesh>
        {/* Surcos del vinilo */}
        {[8, 6, 4].map((radius, i) => (
          <mesh key={i} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.1, radius, 64]} />
            <meshBasicMaterial color="#333" />
          </mesh>
        ))}
      </group>
      
      {/* Notas musicales flotantes */}
      {musicNotes.map((note, i) => (
        <Html
          key={note.id}
          position={note.position}
          center
          distanceFactor={10}
        >
          <div
            ref={el => {
              if (el) {
                notesRef.current[i] = {
                  position: { y: 0 },
                  rotation: { y: 0 },
                  style: el.style,
                };
              }
            }}
            style={{
              fontSize: '32px',
              color: zoneConfig.color,
              opacity: 0.8,
              textShadow: `0 0 20px ${zoneConfig.color}`,
            }}
          >
            {note.note}
          </div>
        </Html>
      ))}
      
      {/* Visualizador de ondas */}
      <group ref={waveformRef} position={[0, 1, 8]}>
        {visualizerBars.map((bar, i) => (
          <mesh key={i} position={[bar.x, bar.baseHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.8, bar.baseHeight, 0.8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? zoneConfig.color : '#ff6b9d'}
              emissive={i % 2 === 0 ? zoneConfig.color : '#ff6b9d'}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>
      
      {/* Estructuras de albums */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <Float key={i} speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
          <group position={[x, 3, -6]}>
            <mesh castShadow>
              <boxGeometry args={[2.5, 2.5, 0.3]} />
              <meshStandardMaterial
                color={`hsl(${i * 60}, 70%, 50%)`}
                roughness={0.2}
              />
            </mesh>
            {/* Sombra del album */}
            <mesh position={[0.2, -0.2, -0.2]}>
              <boxGeometry args={[2.5, 2.5, 0.1]} />
              <meshBasicMaterial color="#000" opacity={0.3} transparent />
            </mesh>
          </group>
        </Float>
      ))}
      
      {/* Barras de progreso para Top Plays, Likes, Comments */}
      <group position={[-10, 2, 0]}>
        {['🔥 Top Plays', '❤️ Top Likes', '💬 Top Comments'].map((label, i) => (
          <Html key={label} position={[0, -i * 2, 0]} center distanceFactor={15}>
            <div style={{
              background: 'rgba(0,0,0,0.7)',
              padding: '6px 12px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '11px',
              border: `1px solid ${zoneConfig.color}`,
              minWidth: '120px',
              textAlign: 'center',
            }}>
              {label}
            </div>
          </Html>
        ))}
      </group>
      
      {/* Instrumentos flotantes */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <group position={[8, 5, 4]}>
          <mesh castShadow>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Cuerdas de guitarra */}
          {[-0.5, -0.25, 0, 0.25, 0.5, 0.75].map((offset, i) => (
            <mesh key={i} position={[offset, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 3, 4]} />
              <meshBasicMaterial color="#silver" />
            </mesh>
          ))}
        </group>
      </Float>
    </group>
  );
};

export default MusicZone;
