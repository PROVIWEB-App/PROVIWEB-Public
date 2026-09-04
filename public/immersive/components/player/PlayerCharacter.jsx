/**
 * PROVIWEB - Personaje Jugable
 * Avatar del usuario con COLISIONES REALISTAS
 */

import React, { useRef, useEffect, useState, useMemo, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import * as THREE from 'three';

// Lista de objetos con colisión (posiciones y radios)
const COLLISION_OBJECTS = [
  // Zona central (hub)
  { x: 0, z: 0, radius: 8 },
  // Árboles grandes
  { x: 30, z: 0, radius: 3 },
  { x: -30, z: 0, radius: 3 },
  { x: 0, z: -30, radius: 3 },
  { x: 0, z: 30, radius: 3 },
  { x: 30, z: -30, radius: 3 },
  { x: -30, z: -30, radius: 3 },
  { x: 30, z: 30, radius: 3 },
  { x: -30, z: 30, radius: 3 },
  // Lagos
  { x: -40, z: -40, radius: 12 },
  { x: 50, z: 30, radius: 8 },
  // Límites del mundo
  { x: 0, z: 100, radius: 5 },
  { x: 0, z: -100, radius: 5 },
  { x: 100, z: 0, radius: 5 },
  { x: -100, z: 0, radius: 5 },
];

// Función de detección de colisiones
const checkCollision = (newX, newZ, currentX, currentZ, radius = 0.8) => {
  // Verificar límites del mundo
  if (newX < -95 || newX > 95 || newZ < -95 || newZ > 95) {
    return true;
  }
  
  // Verificar colisiones con objetos
  for (const obj of COLLISION_OBJECTS) {
    const dx = newX - obj.x;
    const dz = newZ - obj.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < (obj.radius + radius)) {
      return true; // Colisión detectada
    }
  }
  
  return false; // Sin colisión
};

// Obtener altura del terreno en una posición
const getTerrainHeight = (x, z) => {
  // Simulación de la altura del terreno (igual que en TerrainSystem)
  const noise = (x, z) => {
    const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  };
  
  const smoothNoise = (x, z, scale) => {
    return noise(x * scale, z * scale);
  };
  
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

// Componente del personaje
export const PlayerCharacter = forwardRef(({ 
  startPosition = [0, 1, 0], 
  onPositionChange,
}, ref) => {
  const meshRef = useRef();
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const { camera } = useThree();
  
  // Controles
  const { forward, backward, left, right, sprint, jump } = useKeyboardControls();
  
  // Estado
  const [isMoving, setIsMoving] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const yVelocity = useRef(0);
  const currentPos = useRef(new THREE.Vector3(...startPosition));
  
  // Configuración
  const SPEED = 0.12;
  const SPRINT_SPEED = 0.22;
  const JUMP_FORCE = 0.35;
  const GRAVITY = 0.015;
  
  // Color del personaje
  const characterColor = useMemo(() => {
    const colors = ['#a855f7', '#007BFF', '#f43f5e', '#10b981', '#f59e0b'];
    return colors[2]; // Rojo coral fijo
  }, []);
  
  // Exponer ref
  useEffect(() => {
    if (ref) {
      ref.current = meshRef.current;
    }
  }, [ref]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const currentSpeed = sprint ? SPRINT_SPEED : SPEED;
    
    // Dirección basada en cámara
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
    
    // Resetear dirección
    directionRef.current.set(0, 0, 0);
    
    if (forward) directionRef.current.add(cameraDirection);
    if (backward) directionRef.current.sub(cameraDirection);
    if (right) directionRef.current.add(cameraRight);
    if (left) directionRef.current.sub(cameraRight);
    
    if (directionRef.current.length() > 0) {
      directionRef.current.normalize();
      setIsMoving(true);
      
      // Rotar personaje suavemente
      const targetRotation = Math.atan2(directionRef.current.x, directionRef.current.z);
      mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation, delta * 8);
    } else {
      setIsMoving(false);
    }
    
    // Calcular nueva posición
    velocityRef.current.x = directionRef.current.x * currentSpeed;
    velocityRef.current.z = directionRef.current.z * currentSpeed;
    
    let newX = currentPos.current.x + velocityRef.current.x;
    let newZ = currentPos.current.z + velocityRef.current.z;
    
    // COLISIONES - Verificar antes de mover
    if (!checkCollision(newX, newZ, currentPos.current.x, currentPos.current.z)) {
      currentPos.current.x = newX;
      currentPos.current.z = newZ;
    } else {
      // Intentar deslizarse en X solo
      if (!checkCollision(newX, currentPos.current.z, currentPos.current.x, currentPos.current.z)) {
        currentPos.current.x = newX;
      }
      // Intentar deslizarse en Z solo
      else if (!checkCollision(currentPos.current.x, newZ, currentPos.current.x, currentPos.current.z)) {
        currentPos.current.z = newZ;
      }
    }
    
    // Altura del terreno
    const groundHeight = getTerrainHeight(currentPos.current.x, currentPos.current.z);
    
    // Física de salto
    if (jump && !isJumping && currentPos.current.y <= groundHeight + 1.1) {
      yVelocity.current = JUMP_FORCE;
      setIsJumping(true);
    }
    
    yVelocity.current -= GRAVITY;
    currentPos.current.y += yVelocity.current;
    
    // Colisión con suelo
    if (currentPos.current.y <= groundHeight + 1) {
      currentPos.current.y = groundHeight + 1;
      yVelocity.current = 0;
      setIsJumping(false);
    }
    
    // Aplicar posición
    mesh.position.copy(currentPos.current);
    
    // Animación de caminar
    if (isMoving && !isJumping) {
      const walkCycle = state.clock.elapsedTime * (sprint ? 12 : 8);
      mesh.rotation.z = Math.sin(walkCycle) * 0.03;
      mesh.position.y += Math.abs(Math.sin(walkCycle)) * 0.05;
    } else {
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, 0, delta * 5);
    }
    
    // Notificar posición
    if (onPositionChange) {
      onPositionChange([currentPos.current.x, currentPos.current.y, currentPos.current.z]);
    }
    
    // Cámara suave
    const cameraOffset = new THREE.Vector3(0, 6, 10);
    const targetCameraPos = currentPos.current.clone().add(cameraOffset);
    camera.position.lerp(targetCameraPos, delta * 4);
    camera.lookAt(currentPos.current.x, currentPos.current.y + 1, currentPos.current.z);
  });
  
  return (
    <group ref={meshRef} position={startPosition}>
      {/* Cuerpo */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.35, 1.0, 4, 8]} />
        <meshStandardMaterial 
          color={characterColor} 
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      
      {/* Cabeza */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffdbac" roughness={0.5} />
      </mesh>
      
      {/* Ojos */}
      <mesh position={[-0.1, 1.65, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.1, 1.65, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      
      {/* Sombrero */}
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
      
      {/* Brazos */}
      <mesh position={[-0.45, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>
      <mesh position={[0.45, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>
      
      {/* Piernas */}
      <mesh position={[-0.15, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[0.15, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Sombra proyectada */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
});

export default PlayerCharacter;
