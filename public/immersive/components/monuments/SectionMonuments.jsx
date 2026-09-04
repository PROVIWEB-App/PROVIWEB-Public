/**
 * PROVIWEB - Monumentos 3D por Seccion
 * Cada seccion tiene una forma arquitectonica unica y distintiva
 */

import React, { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const MonumentLabel = memo(({
  gradient,
  shadow,
  label,
  shortcut,
  onClick,
  padding = '12px 24px',
  radius = '30px',
  titleSize = '16px',
  titleLetterSpacing = '0.01em'
}) => (
  <div
    style={{
      background: gradient,
      padding,
      borderRadius: radius,
      color: '#fff',
      fontWeight: 'bold',
      boxShadow: shadow,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      textAlign: 'center'
    }}
    onClick={onClick}
  >
    <span
      style={{
        fontSize: '10px',
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        border: '1px solid rgba(255,255,255,0.45)',
        borderRadius: '999px',
        padding: '2px 8px',
        background: 'rgba(0,0,0,0.28)',
        lineHeight: 1.2
      }}
    >
      Tecla {shortcut}
    </span>
    <span style={{ fontSize: titleSize, letterSpacing: titleLetterSpacing, lineHeight: 1.15 }}>
      {label}
    </span>
  </div>
));

// ==================== MONUMENTO: FEED (Torre de Cristal) ====================
export const FeedMonument = memo(({ position, stats, onClick, label = 'Feed', shortcut = '1' }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Base */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[12, 14, 4, 8]} />
        <meshStandardMaterial color="#1a365d" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Torre central */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[6, 8, 25, 6]} />
        <meshStandardMaterial 
          color="#007BFF" 
          emissive="#007BFF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Anillos flotantes */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 8 + i * 6, 0]} rotation={[Math.PI / 2, i * 0.5, 0]}>
          <torusGeometry args={[8 + i * 1.5, 0.3, 8, 32]} />
          <meshBasicMaterial color="#00d9ff" transparent opacity={0.6} />
        </mesh>
      ))}
      
      {/* Label */}
      <Html center position={[0, 32, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #007BFF, #00d9ff)"
          shadow="0 0 30px rgba(0,123,255,0.5)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
        />
      </Html>
    </group>
  );
});

// ==================== MONUMENTO: MUSICA (Altavoz Gigante) ====================
export const MusicMonument = memo(({ position, stats, onClick, label = 'Musica', shortcut = '2' }) => {
  const groupRef = useRef();
  const speakerRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (speakerRef.current) {
      speakerRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.05);
    }
  });
  
  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Base */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[20, 10, 15]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      
      {/* Cono del altavoz */}
      <mesh ref={speakerRef} position={[0, 12, 0]}>
        <coneGeometry args={[12, 15, 32, 1, true]} />
        <meshStandardMaterial 
          color="#f43f5e"
          emissive="#f43f5e"
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Ondas sonoras */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 12, 8 + i * 2]}>
          <ringGeometry args={[8 + i * 3, 8.5 + i * 3, 32]} />
          <meshBasicMaterial 
            color="#f43f5e"
            transparent
            opacity={0.5 - i * 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Label */}
      <Html center position={[0, 28, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #f43f5e, #ec4899)"
          shadow="0 0 30px rgba(244,63,94,0.5)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
        />
      </Html>
    </group>
  );
});

// ==================== MONUMENTO: ARTE (Lienzo Dorado) ====================
export const ArtMonument = memo(({ position, stats, onClick, label = 'Arte', shortcut = '3' }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Marco dorado */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[24, 30, 2]} />
        <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Lienzo */}
      <mesh position={[0, 15, 1.2]}>
        <boxGeometry args={[20, 26, 0.5]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Pinceladas */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[(i-2)*4, 15 + (Math.random()-0.5)*10, 1.5]} rotation={[0, 0, Math.random()]}>
          <planeGeometry args={[3, 8]} />
          <meshBasicMaterial color={['#ff6b6b', '#4ecdc4', '#ffe66d'][i % 3]} transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Label */}
      <Html center position={[0, 32, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #ec4899, #f43f5e)"
          shadow="0 0 30px rgba(236,72,153,0.5)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
        />
      </Html>
    </group>
  );
});

// ==================== MONUMENTO: EVENTOS (Escenario) ====================
export const EventsMonument = memo(({ position, stats, onClick, label = 'Eventos', shortcut = '4' }) => {
  const lightsRef = useRef([]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    lightsRef.current.forEach((light, i) => {
      if (light) {
        light.material.emissiveIntensity = 0.5 + Math.sin(time * 3 + i) * 0.5;
      }
    });
  });
  
  return (
    <group position={position} onClick={onClick}>
      {/* Escenario */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[18, 20, 6, 32]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      
      {/* Arco */}
      <mesh position={[0, 15, -8]}>
        <torusGeometry args={[12, 2, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Luces */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI;
        return (
          <mesh 
            key={i}
            ref={el => lightsRef.current[i] = el}
            position={[Math.cos(angle) * 15, 25, Math.sin(angle) * 8 - 5]}
          >
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshStandardMaterial 
              color={['#6366f1', '#a855f7', '#00d9ff'][i % 3]}
              emissive={['#6366f1', '#a855f7', '#00d9ff'][i % 3]}
              emissiveIntensity={1}
            />
          </mesh>
        );
      })}
      
      {/* Label */}
      <Html center position={[0, 32, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
          shadow="0 0 30px rgba(99,102,241,0.5)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
        />
      </Html>
    </group>
  );
});

// ==================== MONUMENTO: MARKET (Tienda) ====================
export const MarketMonument = memo(({ position, stats, onClick, label = 'Market', shortcut = '5' }) => {
  return (
    <group position={position} onClick={onClick}>
      {/* Edificio */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[20, 20, 15]} />
        <meshStandardMaterial color="#d97706" />
      </mesh>
      
      {/* Toldo */}
      <mesh position={[0, 20, 8]}>
        <boxGeometry args={[22, 2, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      
      {/* Rayas */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-10 + i * 4, 20, 8.1]}>
          <boxGeometry args={[2, 2, 0.2]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      ))}
      
      {/* Label */}
      <Html center position={[0, 28, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          shadow="0 0 30px rgba(245,158,11,0.5)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
        />
      </Html>
    </group>
  );
});

// ==================== MONUMENTO: LEARN (Torre de Libros) ====================
export const LearnMonument = memo(({ position, stats, onClick, label = 'Aprende', shortcut = '6' }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });
  
  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Base */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[10, 12, 10, 8]} />
        <meshStandardMaterial color="#065f46" />
      </mesh>
      
      {/* Libros apilados */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 12 + i * 3.5, 0]} rotation={[0, i * 0.3, 0]}>
          <boxGeometry args={[10 - i * 0.5, 3, 8 - i * 0.3]} />
          <meshStandardMaterial color={['#10b981', '#059669', '#047857', '#065f46'][i % 4]} />
        </mesh>
      ))}
      
      {/* Brillo en la cima */}
      <mesh position={[0, 35, 0]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#10b981" emissiveIntensity={1} />
      </mesh>
      
      <pointLight color="#10b981" intensity={3} distance={40} position={[0, 38, 0]} />
      
      {/* Label */}
      <Html center position={[0, 42, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #10b981, #059669)"
          shadow="0 0 30px rgba(16,185,129,0.5)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
        />
      </Html>
    </group>
  );
});

// ==================== HUB CENTRAL (Nexo Cosmico) ====================
export const HubMonument = memo(({ position, onClick, label = 'CENTRO CREATIVO', shortcut = '0' }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.1;
      groupRef.current.children.forEach((child, i) => {
        if (child.type === 'Mesh') {
          child.rotation.z = time * (0.5 + i * 0.1);
        }
      });
    }
  });
  
  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Nucleo central */}
      <mesh>
        <icosahedronGeometry args={[8, 2]} />
        <meshStandardMaterial 
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      
      {/* Anillos giratorios */}
      {[12, 18, 24].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, i * 0.5, 0]}>
          <torusGeometry args={[radius, 0.5, 16, 100]} />
          <meshBasicMaterial 
            color={['#a855f7', '#00d9ff', '#f43f5e'][i]}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
      
      {/* Particulas flotantes */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 15, Math.sin(angle * 2) * 5, Math.sin(angle) * 15]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
        );
      })}
      
      {/* Label */}
      <Html center position={[0, 28, 0]}>
                <MonumentLabel
          gradient="linear-gradient(135deg, #a855f7, #00d9ff)"
          shadow="0 0 50px rgba(168,85,247,0.8)"
          label={label}
          shortcut={shortcut}
          onClick={onClick}
          padding="16px 32px"
          radius="40px"
          titleSize="20px"
          titleLetterSpacing="0.08em"
        />
      </Html>
    </group>
  );
});

export default {
  FeedMonument,
  MusicMonument,
  ArtMonument,
  EventsMonument,
  MarketMonument,
  LearnMonument,
  HubMonument
};

