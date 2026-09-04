/**
 * PROVIWEB - Portal Holográfico 3D v3.1 (Optimizado)
 * Sin parpadeo, geometrías reutilizables
 */

import React, { useRef, useState, memo, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Geometrías estáticas (única instancia)
const ringGeometry = new THREE.TorusGeometry(5, 0.15, 8, 64);
const innerRingGeometry = new THREE.TorusGeometry(4.2, 0.1, 8, 48);
const coreGeometry = new THREE.SphereGeometry(2.5, 16, 16);
const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
const glowGeometry = new THREE.SphereGeometry(6, 16, 16);

// Materiales estáticos (reutilizables)
const glowMaterial = new THREE.MeshBasicMaterial({ 
  color: '#a855f7', 
  transparent: true, 
  opacity: 0.1 
});

// Colores para cada zona
const ZONE_COLORS = {
  feed: '#007BFF',
  music: '#f43f5e',
  art: '#ec4899',
  social: '#8b5cf6',
  learn: '#10b981',
  market: '#f59e0b',
  events: '#6366f1',
  opportunities: '#06b6d4',
  hub: '#a855f7'
};

const HolographicPortal = memo(({ 
  position = [0, 0, 0], 
  title, 
  icon = '🌀', 
  color = '#a855f7', 
  zoneId = 'hub',
  stats = { users: 0, items: 0 },
  onActivate 
}) => {
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const particlesRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  const actualColor = ZONE_COLORS[zoneId] || color;
  
  // Memoizar materiales para evitar recreación
  const materials = useMemo(() => ({
    ring1: new THREE.MeshStandardMaterial({
      color: actualColor,
      emissive: actualColor,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9
    }),
    ring2: new THREE.MeshStandardMaterial({
      color: actualColor,
      emissive: actualColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7
    }),
    ring3: new THREE.MeshStandardMaterial({
      color: '#fff',
      emissive: actualColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5
    }),
    core: new THREE.MeshStandardMaterial({
      color: actualColor,
      emissive: actualColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3
    })
  }), [actualColor]);
  
  // Partículas orbitando - Memoizadas
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      radius: 5.5 + Math.random() * 1.5,
      yOffset: (Math.random() - 0.5) * 2
    }));
  }, []);

  // Actualizar intensidad emisiva en hover
  useMemo(() => {
    materials.ring1.emissiveIntensity = hovered ? 0.8 : 0.4;
    materials.ring2.emissiveIntensity = hovered ? 1 : 0.5;
  }, [hovered, materials]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Rotación de anillos (eficiente)
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.3;
      ring1Ref.current.rotation.y = t * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.4;
      ring2Ref.current.rotation.z = t * 0.3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = -t * 0.5;
    }
    
    // Animación de partículas
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = particles[i];
        const angle = p.angle + t * p.speed;
        child.position.x = Math.cos(angle) * p.radius;
        child.position.z = Math.sin(angle) * p.radius;
        child.position.y = p.yOffset + Math.sin(t * 2 + i) * 0.3;
      });
    }
    
    // Escala suave en hover
    if (groupRef.current) {
      const targetScale = hovered ? 1.1 : clicked ? 0.95 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = useCallback(() => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);
    if (onActivate) {
      onActivate({ 
        title, 
        color: actualColor, 
        zoneId,
        position,
        action: zoneId === 'feed' ? 'feed' : 
                zoneId === 'music' ? 'music' : 
                zoneId === 'art' ? 'art' : 
                zoneId === 'events' ? 'events' : 
                zoneId === 'market' ? 'market' : 'home'
      });
    }
  }, [onActivate, title, actualColor, zoneId, position]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <group 
      ref={groupRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Anillo exterior - Geometría compartida */}
      <mesh ref={ring1Ref} geometry={ringGeometry} material={materials.ring1} />
      
      {/* Anillo medio */}
      <mesh ref={ring2Ref} geometry={innerRingGeometry} material={materials.ring2} rotation={[Math.PI / 4, 0, 0]} />
      
      {/* Anillo interior */}
      <mesh ref={ring3Ref} geometry={innerRingGeometry} material={materials.ring3} />
      
      {/* Núcleo energético */}
      <mesh geometry={coreGeometry} material={materials.core} />
      
      {/* Partículas - Geometría compartida */}
      <group ref={particlesRef}>
        {particles.map((_, i) => (
          <mesh key={i} geometry={particleGeometry}>
            <meshBasicMaterial color="#fff" />
          </mesh>
        ))}
      </group>
      
      {/* Efecto de brillo - Solo renderizar cuando es necesario */}
      {hovered && (
        <mesh geometry={glowGeometry} material={glowMaterial} />
      )}
      
      {/* HTML UI - Estático, sin animaciones costosas */}
      <Html center position={[0, -8, 0]} distanceFactor={10} occlude>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          {/* Icono y título */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            background: `linear-gradient(135deg, ${actualColor}20, ${actualColor}40)`,
            borderRadius: '25px',
            border: `2px solid ${actualColor}`,
            boxShadow: hovered 
              ? `0 0 30px ${actualColor}80, 0 0 60px ${actualColor}40` 
              : `0 0 15px ${actualColor}40`,
            transition: 'box-shadow 0.3s ease',
            willChange: 'transform'
          }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <span style={{ 
              fontSize: '15px', 
              fontWeight: 'bold', 
              color: '#fff',
              textShadow: `0 0 10px ${actualColor}`
            }}>
              {title}
            </span>
          </div>
          
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '16px',
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            <span>👥 {formatNumber(stats.users)}</span>
            <span>•</span>
            <span>📦 {formatNumber(stats.items)}</span>
          </div>
          
          {/* Indicador de acción */}
          {hovered && (
            <div style={{
              padding: '8px 16px',
              background: `linear-gradient(135deg, ${actualColor}, ${actualColor}80)`,
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fff',
              animation: 'pulse 1s ease infinite'
            }}>
              👆 Click para entrar
            </div>
          )}
        </div>
      </Html>
      
      {/* Tooltip - Oculto por defecto */}
      {hovered && (
        <Html center position={[0, 8, 0]}>
          <div style={{
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '8px',
            fontSize: '11px',
            color: actualColor,
            whiteSpace: 'nowrap'
          }}>
            Zona: {title}
          </div>
        </Html>
      )}
    </group>
  );
});

export default HolographicPortal;
