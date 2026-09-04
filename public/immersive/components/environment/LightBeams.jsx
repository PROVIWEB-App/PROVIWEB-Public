/**
 * PROVIWEB - Haces de Luz
 * Rayos de luz que caen desde el cielo
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Haz de luz individual
const LightBeam = ({ position, height = 30, color = '#ffd700', opacity = 0.3 }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.5, 3, height, 8, 1, true);
    geo.translate(0, height / 2, 0);
    return geo;
  }, [height]);
  
  return (
    <mesh position={position} geometry={geometry} rotation={[0.1, 0, 0]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Sistema de haces de luz
export const LightBeams = () => {
  const beams = useMemo(() => [
    { pos: [0, 0, 0], height: 40, color: '#a855f7', opacity: 0.25 },
    { pos: [30, 0, 0], height: 35, color: '#007BFF', opacity: 0.2 },
    { pos: [-30, 0, 0], height: 35, color: '#f43f5e', opacity: 0.2 },
    { pos: [0, 0, 30], height: 35, color: '#10b981', opacity: 0.2 },
    { pos: [0, 0, -30], height: 35, color: '#f59e0b', opacity: 0.2 },
    { pos: [20, 0, 20], height: 30, color: '#8b5cf6', opacity: 0.15 },
    { pos: [-20, 0, -20], height: 30, color: '#06b6d4', opacity: 0.15 },
    { pos: [20, 0, -20], height: 30, color: '#ec4899', opacity: 0.15 },
    { pos: [-20, 0, 20], height: 30, color: '#6366f1', opacity: 0.15 },
  ], []);
  
  return (
    <>
      {beams.map((beam, i) => (
        <LightBeam
          key={i}
          position={beam.pos}
          height={beam.height}
          color={beam.color}
          opacity={beam.opacity}
        />
      ))}
    </>
  );
};

export default LightBeams;
