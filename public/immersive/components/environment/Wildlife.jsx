/**
 * PROVIWEB - Vida Salvaje
 * Aves y animales con movimiento SUAVE
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Ave con vuelo suave
const Bird = ({ initialPosition, type = 'seagull' }) => {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  
  const flightParams = useMemo(() => ({
    center: new THREE.Vector3(...initialPosition),
    radius: 15 + Math.random() * 15,
    speed: 0.3 + Math.random() * 0.2,
    height: initialPosition[1],
    phase: Math.random() * Math.PI * 2,
  }), [initialPosition]);
  
  useFrame((state) => {
    if (!groupRef.current || !leftWingRef.current || !rightWingRef.current) return;
    
    const time = state.clock.elapsedTime * flightParams.speed + flightParams.phase;
    
    // Vuelo orbital suave
    const x = flightParams.center.x + Math.cos(time) * flightParams.radius;
    const z = flightParams.center.z + Math.sin(time) * flightParams.radius;
    const y = flightParams.height + Math.sin(time * 0.5) * 2;
    
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y = -time;
    
    // Aleteo suave
    const flap = Math.sin(time * 8) * 0.4;
    leftWingRef.current.rotation.z = flap;
    rightWingRef.current.rotation.z = -flap;
  });
  
  const colors = {
    seagull: { body: '#ffffff', wings: '#e0e0e0' },
    sparrow: { body: '#8b4513', wings: '#654321' },
    bluebird: { body: '#4169e1', wings: '#1e90ff' },
    cardinal: { body: '#dc143c', wings: '#8b0000' },
  }[type] || colors.seagull;
  
  return (
    <group ref={groupRef}>
      <mesh>
        <capsuleGeometry args={[0.06, 0.25, 4, 6]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>
      <mesh position={[0.1, 0.05, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>
      <mesh ref={leftWingRef} position={[0, 0.05, 0.1]}>
        <boxGeometry args={[0.2, 0.02, 0.12]} />
        <meshStandardMaterial color={colors.wings} />
      </mesh>
      <mesh ref={rightWingRef} position={[0, 0.05, -0.1]}>
        <boxGeometry args={[0.2, 0.02, 0.12]} />
        <meshStandardMaterial color={colors.wings} />
      </mesh>
    </group>
  );
};

// Bandada de aves
const BirdFlock = ({ center, count = 8 }) => {
  const types = ['seagull', 'sparrow', 'bluebird'];
  
  const birds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        center[0] + (Math.random() - 0.5) * 25,
        center[1] + 5 + Math.random() * 8,
        center[2] + (Math.random() - 0.5) * 25,
      ],
      type: types[Math.floor(Math.random() * types.length)],
    }));
  }, [center, count]);
  
  return (
    <>
      {birds.map((bird) => (
        <Bird
          key={bird.id}
          initialPosition={bird.position}
          type={bird.type}
        />
      ))}
    </>
  );
};

// Mariposa con vuelo suave
const Butterfly = ({ initialPosition, color = '#ff69b4' }) => {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  
  const flightParams = useMemo(() => ({
    center: new THREE.Vector3(...initialPosition),
    radius: 2 + Math.random() * 2,
    speed: 0.4 + Math.random() * 0.2,
    height: initialPosition[1],
    phase: Math.random() * Math.PI * 2,
  }), [initialPosition]);
  
  useFrame((state) => {
    if (!groupRef.current || !leftWingRef.current || !rightWingRef.current) return;
    
    const time = state.clock.elapsedTime * flightParams.speed + flightParams.phase;
    
    const x = flightParams.center.x + Math.cos(time) * flightParams.radius;
    const z = flightParams.center.z + Math.sin(time * 1.2) * flightParams.radius;
    const y = flightParams.height + Math.sin(time * 3) * 0.3;
    
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y = Math.atan2(
      -Math.sin(time * 1.2), 
      Math.cos(time)
    );
    
    const flap = Math.sin(time * 20) * 0.6;
    leftWingRef.current.rotation.y = flap;
    rightWingRef.current.rotation.y = -flap;
  });
  
  return (
    <group ref={groupRef} scale={0.25}>
      <mesh>
        <capsuleGeometry args={[0.03, 0.12, 4, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={leftWingRef} position={[0, 0, 0.08]}>
        <circleGeometry args={[0.12, 6]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightWingRef} position={[0, 0, -0.08]}>
        <circleGeometry args={[0.12, 6]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Grupo de mariposas
const Butterflies = ({ center, count = 12 }) => {
  const colors = ['#ff69b4', '#ffd700', '#87ceeb', '#ff6347', '#98fb98', '#dda0dd'];
  
  const butterflies = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        center[0] + (Math.random() - 0.5) * 12,
        center[1] + Math.random() * 2,
        center[2] + (Math.random() - 0.5) * 12,
      ],
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [center, count]);
  
  return (
    <>
      {butterflies.map((b) => (
        <Butterfly key={b.id} initialPosition={b.position} color={b.color} />
      ))}
    </>
  );
};

// Pez nadando suave
const Fish = ({ position, color = '#ffa500' }) => {
  const fishRef = useRef();
  
  const swimParams = useMemo(() => ({
    center: new THREE.Vector3(...position),
    radius: 2 + Math.random() * 2,
    speed: 0.4 + Math.random() * 0.3,
    phase: Math.random() * Math.PI * 2,
  }), [position]);
  
  useFrame((state) => {
    if (!fishRef.current) return;
    
    const time = state.clock.elapsedTime * swimParams.speed + swimParams.phase;
    
    const x = swimParams.center.x + Math.cos(time) * swimParams.radius;
    const z = swimParams.center.z + Math.sin(time) * swimParams.radius;
    const y = position[1] + Math.sin(time * 2) * 0.15;
    
    fishRef.current.position.set(x, y, z);
    fishRef.current.rotation.y = -time;
  });
  
  return (
    <group ref={fishRef} scale={0.25}>
      <mesh>
        <capsuleGeometry args={[0.08, 0.35, 4, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.2, 0, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.08, 0.15, 3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Peces en lago
const FishSchool = ({ center, count = 8 }) => {
  const colors = ['#ffa500', '#ff6347', '#ffd700', '#87ceeb'];
  
  const fishes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        center[0] + (Math.random() - 0.5) * 6,
        center[1] - 0.8,
        center[2] + (Math.random() - 0.5) * 6,
      ],
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [center, count]);
  
  return (
    <>
      {fishes.map((fish) => (
        <Fish key={fish.id} position={fish.position} color={fish.color} />
      ))}
    </>
  );
};

// Sistema de vida salvaje
export const Wildlife = () => {
  return (
    <>
      {/* Aves */}
      <BirdFlock center={[0, 25, 0]} count={8} />
      <BirdFlock center={[40, 35, -40]} count={6} />
      <BirdFlock center={[-30, 30, 30]} count={7} />
      
      {/* Mariposas */}
      <Butterflies center={[10, 2, 10]} count={10} />
      <Butterflies center={[-15, 2, -20]} count={8} />
      
      {/* Peces */}
      <FishSchool center={[-40, 0, -40]} count={8} />
      <FishSchool center={[50, 0, 30]} count={6} />
    </>
  );
};

export default Wildlife;
