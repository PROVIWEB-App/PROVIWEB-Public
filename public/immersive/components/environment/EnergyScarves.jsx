/**
 * PROVIWEB - Bufandas de Energía
 * Cintas de luz flotantes estilo Journey
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Bufanda individual
const EnergyScarf = ({ startPos, length = 10, color = '#ffd700' }) => {
  const scarfRef = useRef();
  const phase = useMemo(() => Math.random() * 100, []);
  
  // Crear curva de puntos
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= length; i++) {
      pts.push(new THREE.Vector3(0, -i * 0.5, 0));
    }
    return pts;
  }, [length]);
  
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 20, 0.1, 6, false);
  }, [curve]);
  
  useFrame((state) => {
    if (!scarfRef.current) return;
    
    const time = state.clock.elapsedTime + phase;
    
    // Flotación ondulante
    scarfRef.current.position.y = startPos[1] + Math.sin(time * 0.5) * 0.3;
    scarfRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
    scarfRef.current.rotation.z = Math.sin(time * 0.3) * 0.05;
  });
  
  return (
    <mesh ref={scarfRef} position={startPos} geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Sistema de bufandas
export const EnergyScarves = ({ count = 12 }) => {
  const scarves = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 80,
        10 + Math.random() * 15,
        (Math.random() - 0.5) * 80,
      ],
      length: 8 + Math.random() * 8,
      color: ['#ff6b35', '#a855f7', '#ffd700', '#00d9ff'][Math.floor(Math.random() * 4)],
    }));
  }, [count]);
  
  return (
    <>
      {scarves.map((scarf) => (
        <EnergyScarf
          key={scarf.id}
          startPos={scarf.position}
          length={scarf.length}
          color={scarf.color}
        />
      ))}
    </>
  );
};

export default EnergyScarves;
