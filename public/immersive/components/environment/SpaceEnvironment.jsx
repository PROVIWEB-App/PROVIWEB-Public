/**
 * PROVIWEB - Entorno Espacial
 * Mundo flotante en el espacio sin terreno
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Plataforma flotante estilo estación espacial
const FloatingPlatform = ({ position, scale = 1, color = '#a855f7' }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2;
    meshRef.current.rotation.y = Math.sin(time * 0.1) * 0.02;
  });
  
  return (
    <mesh ref={meshRef} position={position} scale={scale} receiveShadow>
      <cylinderGeometry args={[4, 4, 0.3, 8]} />
      <meshStandardMaterial 
        color="#2d1b4e"
        emissive={color}
        emissiveIntensity={0.2}
        roughness={0.6}
        metalness={0.8}
      />
    </mesh>
  );
};

// Planeta lejano
const DistantPlanet = ({ position, size, color, rings = false }) => {
  const planetRef = useRef();
  
  useFrame((state) => {
    if (!planetRef.current) return;
    planetRef.current.rotation.y = state.clock.elapsedTime * 0.02;
  });
  
  return (
    <group position={position}>
      {/* Planeta */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Anillos */}
      {rings && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[size * 1.4, size * 2, 64]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Brillo */}
      <mesh>
        <sphereGeometry args={[size * 1.2, 32, 32]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
};

// Cometa con cola
const Comet = ({ startPosition, speed = 1 }) => {
  const cometRef = useRef();
  const trailRef = useRef();
  
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      pts.push(new THREE.Vector3(0, 0, i * 0.8));
    }
    return pts;
  }, []);
  
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  
  useFrame((state) => {
    if (!cometRef.current) return;
    
    const time = state.clock.elapsedTime * speed * 0.1;
    
    // Movimiento orbital
    const x = startPosition[0] + Math.cos(time) * 80;
    const z = startPosition[2] + Math.sin(time) * 80;
    const y = startPosition[1] + Math.sin(time * 0.5) * 20;
    
    cometRef.current.position.set(x, y, z);
    cometRef.current.lookAt(x + Math.cos(time + 0.1) * 80, y, z + Math.sin(time + 0.1) * 80);
  });
  
  return (
    <group ref={cometRef} position={startPosition}>
      {/* Núcleo del cometa */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial 
          color="#00d9ff"
          emissive="#00d9ff"
          emissiveIntensity={1}
        />
      </mesh>
      
      {/* Cola */}
      <mesh ref={trailRef} position={[0, 0, 8]}>
        <tubeGeometry args={[curve, 20, 0.3, 8, false]} />
        <meshBasicMaterial 
          color="#00d9ff"
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

// Nebulosa de fondo
const Nebula = ({ position, color = '#a855f7' }) => {
  const nebulaRef = useRef();
  
  useFrame((state) => {
    if (!nebulaRef.current) return;
    nebulaRef.current.rotation.y = state.clock.elapsedTime * 0.005;
  });
  
  return (
    <mesh ref={nebulaRef} position={position}>
      <sphereGeometry args={[40, 32, 32]} />
      <meshBasicMaterial 
        color={color}
        transparent
        opacity={0.15}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Estación espacial/laboratorio flotante
const SpaceStation = ({ position }) => {
  const stationRef = useRef();
  
  useFrame((state) => {
    if (!stationRef.current) return;
    const time = state.clock.elapsedTime;
    stationRef.current.rotation.y = time * 0.05;
    stationRef.current.position.y = position[1] + Math.sin(time * 0.3) * 0.5;
  });
  
  return (
    <group ref={stationRef} position={position}>
      {/* Cuerpo principal */}
      <mesh>
        <cylinderGeometry args={[3, 3, 8, 12]} />
        <meshStandardMaterial 
          color="#4a4a6a"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      
      {/* Paneles solares */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh 
            key={i}
            position={[
              Math.cos(angle) * 5,
              0,
              Math.sin(angle) * 5
            ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.2, 6, 3]} />
            <meshStandardMaterial 
              color="#1a237e"
              emissive="#00d9ff"
              emissiveIntensity={0.3}
              metalness={0.8}
            />
          </mesh>
        );
      })}
      
      {/* Luces */}
      <mesh position={[0, 4.5, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};

// Asteroides flotantes
const AsteroidField = ({ count = 30 }) => {
  const asteroids = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 200,
      ],
      scale: 0.5 + Math.random() * 1.5,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
    }));
  }, [count]);
  
  return (
    <>
      {asteroids.map((asteroid) => (
        <mesh 
          key={asteroid.id}
          position={asteroid.position}
          rotation={asteroid.rotation}
          scale={asteroid.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color="#666"
            roughness={0.9}
            metalness={0.3}
          />
        </mesh>
      ))}
    </>
  );
};

// Entorno espacial completo
export const SpaceEnvironment = ({ quality = 'high' }) => {
  return (
    <>
      {/* Planetas distantes */}
      <DistantPlanet position={[-100, 30, -150]} size={15} color="#ff6b35" rings />
      <DistantPlanet position={[120, -20, -120]} size={12} color="#a855f7" />
      <DistantPlanet position={[-80, 50, 100]} size={8} color="#00d9ff" />
      <DistantPlanet position={[150, 40, 80]} size={6} color="#f43f5e" rings />
      
      {/* Nebulosas */}
      <Nebula position={[-100, 0, -100]} color="#a855f7" />
      <Nebula position={[100, 20, 50]} color="#ff6b35" />
      <Nebula position={[0, 50, -100]} color="#00d9ff" />
      
      {/* Cometas */}
      <Comet startPosition={[0, 30, 0]} speed={0.8} />
      <Comet startPosition={[50, -20, 50]} speed={0.5} />
      <Comet startPosition={[-50, 40, -50]} speed={0.6} />
      
      {/* Estaciones espaciales decorativas */}
      <SpaceStation position={[60, 25, -60]} />
      <SpaceStation position={[-60, 35, 60]} />
      
      {/* Campo de asteroides */}
      <AsteroidField count={quality === 'high' ? 40 : 20} />
    </>
  );
};

export default SpaceEnvironment;
