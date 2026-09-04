/**
 * PROVIWEB - Terreno estilo Journey
 * Dunas suaves y ondulantes
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Ruido suave para dunas
const noise = (x, z) => {
  return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2 +
         Math.sin(x * 0.1 + z * 0.08) * 1 +
         Math.sin(x * 0.02) * 3;
};

export const JourneyTerrain = ({ quality = 'high' }) => {
  const meshRef = useRef();
  
  const segments = quality === 'high' ? 120 : 80;
  
  // Geometría de dunas
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 300, segments, segments);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const height = noise(x, z);
      pos.setZ(i, Math.max(-2, height));
    }
    
    geo.computeVertexNormals();
    geo.rotateX(-Math.PI / 2);
    
    // Material de arena con gradiente
    const mat = new THREE.MeshStandardMaterial({
      color: '#e8a87c',
      roughness: 0.9,
      metalness: 0,
      emissive: '#ff6b35',
      emissiveIntensity: 0.05,
    });
    
    return { geometry: geo, material: mat };
  }, [segments]);
  
  return (
    <mesh 
      ref={meshRef}
      geometry={geometry}
      material={material}
      receiveShadow
      position={[0, -2, 0]}
    />
  );
};

export default JourneyTerrain;
