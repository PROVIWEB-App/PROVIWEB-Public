/**
 * PROVIWEB - Sistema de Cielo
 * Cielo dinámico con iluminación REALISTA
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Sol con luz realista
const Sun = ({ position = [0, 50, 0] }) => {
  return (
    <group position={position}>
      {/* Sol visual */}
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      
      {/* Corona */}
      <mesh>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#ff8c00" transparent opacity={0.2} />
      </mesh>
      
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color="#ffa500" transparent opacity={0.08} />
      </mesh>
      
      {/* Luz direccional principal - SOMBRAS REALES */}
      <directionalLight
        color="#fff8dc"
        intensity={1.2}
        position={[0, 0, 0]}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
      />
    </group>
  );
};

// Nube estática
const Cloud = ({ position, scale = 1 }) => {
  const shape = useMemo(() => {
    const puffs = [
      { pos: [0, 0, 0], scale: 1 },
      { pos: [0.8, 0.1, 0], scale: 0.7 },
      { pos: [-0.7, 0.05, 0.2], scale: 0.75 },
      { pos: [0.2, 0.4, 0.3], scale: 0.5 },
      { pos: [-0.2, 0.25, -0.3], scale: 0.55 },
    ];
    return puffs;
  }, []);
  
  return (
    <group position={position} scale={scale}>
      {shape.map((puff, i) => (
        <mesh key={i} position={puff.pos} castShadow>
          <sphereGeometry args={[0.8 * puff.scale, 8, 6]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.9}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
};

// Sistema de nubes - POSICIONES FIJAS
const CloudSystem = ({ count = 12 }) => {
  const clouds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 150,
        30 + Math.random() * 15,
        (Math.random() - 0.5) * 80 - 30,
      ],
      scale: 1.5 + Math.random() * 1.5,
    }));
  }, [count]);
  
  return (
    <>
      {clouds.map((cloud) => (
        <Cloud
          key={cloud.id}
          position={cloud.position}
          scale={cloud.scale}
        />
      ))}
    </>
  );
};

// Cielo de fondo
const SkyDome = () => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color('#0077ff') },
        bottomColor: { value: new THREE.Color('#ffffff') },
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);
  
  return (
    <mesh geometry={new THREE.SphereGeometry(300, 32, 32)} material={material} />
  );
};

// Sistema de cielo completo
export const SkySystem = ({ timeOfDay = 'day' }) => {
  return (
    <>
      {/* Cúpula del cielo */}
      <SkyDome />
      
      {/* Sol con sombras */}
      <Sun position={[60, 50, -40]} />
      
      {/* Luz ambiental suave */}
      <ambientLight color="#87ceeb" intensity={0.35} />
      
      {/* Luz hemisférica para iluminación natural */}
      <hemisphereLight
        skyColor="#87ceeb"
        groundColor="#8b7355"
        intensity={0.5}
      />
      
      {/* Nubes */}
      <CloudSystem count={15} />
    </>
  );
};

export default SkySystem;
