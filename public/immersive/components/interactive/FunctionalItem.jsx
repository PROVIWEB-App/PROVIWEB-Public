/**
 * PROVIWEB - Item Funcional
 * Items que abren las funcionalidades reales del proyecto
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const FunctionalItem = ({ 
  position,
  title,
  description,
  icon,
  color = '#a855f7',
  action,
  requiresAuth = false,
  cameraPosition,
  onAction,
  userHasAccess = false,
  isLoadingPerms = false
}) => {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  
  // Calcular distancia
  const distance = cameraPosition ? 
    Math.sqrt(
      Math.pow(cameraPosition[0] - position[0], 2) +
      Math.pow(cameraPosition[1] - position[1], 2) +
      Math.pow(cameraPosition[2] - position[2], 2)
    ) : 999;
  
  // Determinar si puede interactuar
  // NOTA: Para pruebas, descomenta la siguiente línea para permitir todo:
  // const canInteract = true;
  const canInteract = !requiresAuth || (requiresAuth && userHasAccess);
  const isNear = distance < 30 && canInteract && !isLoadingPerms;  // Distancia aumentada
  const isLocked = requiresAuth && !userHasAccess && !isLoadingPerms;
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Flotación suave
    meshRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.3;
    
    // Rotación
    meshRef.current.rotation.y = time * 0.3;
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
    
    // Escala - más pequeño si está bloqueado
    const targetScale = isNear ? 1.4 : (isLocked ? 0.8 : 1);
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    meshRef.current.scale.set(newScale, newScale, newScale);
  });
  
  const handleClick = () => {
    // Permitir clic si está cerca O si no requiere auth (incluso si está lejos)
    const canClick = (distance < 40 && canInteract) || isNear;
    if (canClick && onAction) {
      onAction({ title, description, icon, action });
    }
  };
  
  // Si está cargando permisos, mostrar estado de carga
  if (isLoadingPerms && requiresAuth) {
    return (
      <group position={position}>
        <mesh>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            color="#444"
            emissive="#666"
            emissiveIntensity={0.2}
          />
        </mesh>
        <Html position={[0, 1.5, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            color: '#aaa',
            fontSize: '12px',
          }}>
            ⏳ Verificando...
          </div>
        </Html>
      </group>
    );
  }
  
  // Si está bloqueado (requiere auth y no tiene acceso)
  if (isLocked) {
    return (
      <group position={position}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            color="#444"
            transparent
            opacity={0.6}
            roughness={0.8}
          />
        </mesh>
        {/* Candado */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#666" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.2, 0.05, 8, 16]} />
          <meshStandardMaterial color="#666" />
        </mesh>
        <Html position={[0, 1.5, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            padding: '10px 14px',
            borderRadius: '10px',
            color: '#ff6b6b',
            fontSize: '13px',
            fontWeight: 'bold',
            border: '1px solid #ff6b6b40',
            boxShadow: '0 0 20px rgba(255, 107, 107, 0.2)'
          }}>
            🔒 Solo Admin/Ally
          </div>
        </Html>
      </group>
    );
  }
  
  return (
    <group>
      {/* Cristal principal */}
      <mesh 
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1.2 : 0.6}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Halo exterior */}
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 32]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Partículas orbitando */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh 
            key={i}
            position={[
              position[0] + Math.cos(angle + Date.now() * 0.001) * 2,
              position[1] + Math.sin(Date.now() * 0.001 + i) * 0.5,
              position[2] + Math.sin(angle + Date.now() * 0.001) * 2
            ]}
          >
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
      
      {/* Etiqueta */}
      {isNear && (
        <Html 
          position={[position[0], position[1] + 2.5, position[2]]} 
          center 
          distanceFactor={10}
        >
          <div style={{
            background: `linear-gradient(135deg, rgba(5, 0, 8, 0.98), ${color}60)`,
            backdropFilter: 'blur(10px)',
            padding: '16px 28px',
            borderRadius: '18px',
            border: `2px solid ${color}`,
            color: 'white',
            fontSize: '15px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: `0 0 50px ${color}80`,
            pointerEvents: 'none',
            animation: 'pulse 1.5s infinite'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '17px' }}>{title}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              Click para acceder
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default FunctionalItem;
