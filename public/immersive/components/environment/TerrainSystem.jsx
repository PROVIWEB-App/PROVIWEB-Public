/**
 * PROVIWEB - Sistema de Terreno
 * Terreno procedural REALISTA y ESTABLE
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Ruido simple para terreno
const noise = (x, z, seed = 12345) => {
  const n = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

const smoothNoise = (x, z, scale = 0.05) => {
  const nx = Math.floor(x * scale);
  const nz = Math.floor(z * scale);
  const fx = (x * scale) - nx;
  const fz = (z * scale) - nz;
  
  const n00 = noise(nx, nz);
  const n10 = noise(nx + 1, nz);
  const n01 = noise(nx, nz + 1);
  const n11 = noise(nx + 1, nz + 1);
  
  const nx0 = n00 * (1 - fx) + n10 * fx;
  const nx1 = n01 * (1 - fx) + n11 * fx;
  
  return nx0 * (1 - fz) + nx1 * fz;
};

// Altura del terreno - FUNCIÓN PURA
export const getTerrainHeight = (x, z) => {
  let height = smoothNoise(x, z, 0.03) * 2;
  height += smoothNoise(x, z, 0.1) * 0.5;
  height += smoothNoise(x, z, 0.02) * 3;
  
  const path1 = Math.sin(z * 0.05) * 10;
  const path2 = Math.cos(x * 0.03) * 15;
  
  if (Math.abs(x - path1) < 4 || Math.abs(z - path2) < 4) {
    height *= 0.3;
  }
  
  return Math.max(0, height);
};

// Componente del terreno
export const TerrainSystem = ({ 
  size = 200, 
  segments = 60,
  quality = 'high' 
}) => {
  const meshRef = useRef();
  
  // Ajustar calidad
  const actualSegments = quality === 'high' ? segments : quality === 'medium' ? 40 : 30;
  
  // Geometría del terreno - SOLO SE CALCULA UNA VEZ
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, actualSegments, actualSegments);
    const posAttribute = geo.attributes.position;
    
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const z = posAttribute.getY(i);
      const height = getTerrainHeight(x, z);
      posAttribute.setZ(i, height);
    }
    
    geo.computeVertexNormals();
    geo.rotateX(-Math.PI / 2);
    
    return geo;
  }, [size, actualSegments]);
  
  // Material con textura procedural
  const material = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base de tierra
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(0, 0, 512, 512);
    
    // Ruido de tierra
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = Math.random() * 3;
      ctx.fillStyle = Math.random() > 0.5 ? '#5c4033' : '#3d2914';
      ctx.fillRect(x, y, w, w);
    }
    
    // Pasto
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = Math.random() * 2;
      const green = Math.floor(40 + Math.random() * 40);
      ctx.fillStyle = `rgb(${green}, ${green + 100}, ${green + 20})`;
      ctx.fillRect(x, y, w, w);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0,
    });
  }, []);
  
  return (
    <>
      {/* Terreno principal */}
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        material={material}
        receiveShadow
      />
      
      {/* Caminos visuales */}
      <Roads size={size} />
    </>
  );
};

// Caminos - ESTÁTICOS
const Roads = ({ size }) => {
  const roadMaterial = useMemo(() => (
    new THREE.MeshStandardMaterial({ 
      color: '#8b7355', 
      roughness: 0.95 
    })
  ), []);
  
  return (
    <>
      {/* Camino principal serpenteante */}
      {Array.from({ length: 20 }, (_, i) => {
        const z = (i - 10) * 10;
        const x = Math.sin(z * 0.05) * 10;
        return (
          <mesh key={i} position={[x, 0.02, z]} receiveShadow>
            <boxGeometry args={[5, 0.04, 10]} />
            <primitive object={roadMaterial} attach="material" />
          </mesh>
        );
      })}
      
      {/* Camino transversal */}
      {Array.from({ length: 15 }, (_, i) => {
        const x = (i - 7) * 12;
        const z = Math.cos(x * 0.03) * 15;
        return (
          <mesh key={`cross-${i}`} position={[x, 0.02, z]} receiveShadow>
            <boxGeometry args={[10, 0.04, 5]} />
            <primitive object={roadMaterial} attach="material" />
          </mesh>
        );
      })}
    </>
  );
};

export default TerrainSystem;
