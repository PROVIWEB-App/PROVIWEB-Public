/**
 * PROVIWEB - Cielo Épico
 * Aurora boreal, nebulosas y estrellas
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Sol monumental
const MonumentalSun = () => {
  const sunRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    if (!sunRef.current || !glowRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Pulso del sol
    const scale = 1 + Math.sin(time * 0.2) * 0.05;
    glowRef.current.scale.setScalar(scale);
  });
  
  return (
    <group position={[80, 60, -80]}>
      {/* Sol core */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      
      {/* Glow 1 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial 
          color="#ff8c00" 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Glow 2 */}
      <mesh>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial 
          color="#ff6b35" 
          transparent 
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Rayos */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh 
            key={i}
            position={[
              Math.cos(angle) * 15,
              Math.sin(angle) * 15,
              0
            ]}
            rotation={[0, 0, angle]}
          >
            <planeGeometry args={[30, 2]} />
            <meshBasicMaterial 
              color="#ffd700" 
              transparent 
              opacity={0.15}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Aurora boreal
const AuroraBorealis = () => {
  const auroraRef = useRef();
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 50, 50, 10);
    return geo;
  }, []);
  
  useFrame((state) => {
    if (!auroraRef.current) return;
    const time = state.clock.elapsedTime * 0.1;
    
    const positions = auroraRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const x = positions[i * 3];
      positions[i * 3 + 2] = Math.sin(x * 0.05 + time) * 5 + 
                             Math.sin(x * 0.1 + time * 1.5) * 3;
    }
    
    auroraRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <mesh 
      ref={auroraRef}
      geometry={geometry}
      position={[-50, 40, -100]}
      rotation={[0, 0.3, 0]}
    >
      <meshBasicMaterial 
        color="#a855f7"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// Estrellas brillantes
const TwinklingStars = ({ count = 300 }) => {
  const starsRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 150 + Math.random() * 50;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(radius * Math.sin(phi) * Math.sin(theta)) + 50;
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return pos;
  }, [count]);
  
  useFrame((state) => {
    if (!starsRef.current) return;
    
    const time = state.clock.elapsedTime;
    // Efecto de centelleo
    starsRef.current.material.opacity = 0.5 + Math.sin(time * 2) * 0.3;
  });
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.8}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Cielo completo
export const EpicSky = () => {
  return (
    <>
      <MonumentalSun />
      <AuroraBorealis />
      <TwinklingStars count={400} />
    </>
  );
};

export default EpicSky;
