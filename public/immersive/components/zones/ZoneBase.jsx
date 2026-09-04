/**
 * PROVIWEB - Componente Base para Zonas 3D
 * Proporciona estructura común para todas las zonas
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Componente de portal/nexo para la zona
export const ZonePortal = ({ position, color, isActive, onClick, name, icon }) => {
  const portalRef = useRef();
  const ringRef = useRef();
  
  // Animación de pulso cuando está activo
  useFrame((state) => {
    if (portalRef.current) {
      const scale = isActive ? 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : 1;
      portalRef.current.scale.setScalar(scale);
    }
    
    if (ringRef.current && isActive) {
      ringRef.current.rotation.z += 0.01;
    }
  });
  
  // Click handler
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  return (
    <group position={position} onClick={handleClick}>
      {/* Anillo exterior giratorio */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.1, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Portal principal */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={portalRef}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isActive ? 0.8 : 0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
      
      {/* Partículas orbitando */}
      {isActive && <OrbitingParticles color={color} />}
      
      {/* Etiqueta HTML */}
      <Html distanceFactor={10} position={[0, 4, 0]} center>
        <div 
          className={`zone-label ${isActive ? 'active' : ''}`}
          style={{
            background: `rgba(0,0,0,0.7)`,
            padding: '8px 16px',
            borderRadius: '20px',
            border: `2px solid ${color}`,
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            cursor: 'pointer',
            pointerEvents: 'none',
            transition: 'all 0.3s',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <div style={{ fontSize: '24px' }}>{icon}</div>
          <div>{name}</div>
        </div>
      </Html>
      
      {/* Indicador de dirección cuando no está activo */}
      {!isActive && (
        <mesh position={[0, -1, 0]}>
          <coneGeometry args={[0.3, 0.5, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

// Partículas orbitando el portal
const OrbitingParticles = ({ color, count = 8 }) => {
  const particlesRef = useRef();
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      radius: 3 + Math.random() * 1,
      yOffset: (Math.random() - 0.5) * 2,
    }));
  }, [count]);
  
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    particles.forEach((particle, i) => {
      const angle = particle.angle + state.clock.elapsedTime * particle.speed;
      const x = Math.cos(angle) * particle.radius;
      const z = Math.sin(angle) * particle.radius;
      const y = particle.yOffset + Math.sin(state.clock.elapsedTime * 2 + i) * 0.5;
      
      const mesh = particlesRef.current.children[i];
      if (mesh) {
        mesh.position.set(x, y, z);
      }
    });
  });
  
  return (
    <group ref={particlesRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

// Plataforma flotante para la zona
export const FloatingPlatform = ({ position, color, size = [8, 0.5, 8] }) => {
  const platformRef = useRef();
  
  useFrame((state) => {
    if (platformRef.current) {
      platformRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  
  return (
    <mesh ref={platformRef} position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.8}
        metalness={0.2}
      />
      {/* Borde iluminado */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
    </mesh>
  );
};

// Camino conector entre zonas
export const ZonePath = ({ start, end, color }) => {
  const pathRef = useRef();
  
  // Crear curva de camino
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5);
    midPoint.y = -1;
    
    return new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
  }, [start, end]);
  
  // Puntos a lo largo del camino
  const points = useMemo(() => curve.getPoints(50), [curve]);
  
  return (
    <line ref={pathRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line>
  );
};

// Indicador de contenido/progreso
export const ContentIndicator = ({ position, count, total, color }) => {
  return (
    <group position={position}>
      {/* Círculo de progreso */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* Segmentos de progreso */}
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * Math.PI * 2;
        const x = Math.cos(angle) * 1.6;
        const z = Math.sin(angle) * 1.6;
        const isActive = i < count;
        
        return (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial 
              color={isActive ? color : '#333'} 
              transparent 
              opacity={isActive ? 1 : 0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Efecto de aura/flujo de energía
export const EnergyFlow = ({ position, color, radius = 2 }) => {
  const flowRef = useRef();
  
  useFrame((state) => {
    if (flowRef.current) {
      flowRef.current.rotation.y += 0.005;
      flowRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });
  
  return (
    <mesh ref={flowRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.05, 8, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
};

export default ZonePortal;
