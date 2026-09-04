/**
 * PROVIWEB - Sistema de Items Orbitales
 * Items que orbitan como lunas y se separan al seleccionar
 */

import React, { useRef, useState, useMemo, memo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Curva de easing suave
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// ==================== CONFIGURACIONES DE ÓRBITA POR SECCIÓN ====================

export const ORBIT_CONFIGS = {
  music: {
    type: 'horizontal',  // Órbita circular horizontal
    radius: 15,
    height: 0,
    speed: 0.3,
    tilt: 0,
    itemScale: 1.2,
    spacing: 'even'
  },
  art: {
    type: 'vertical',    // Órbita vertical (galería)
    radius: 12,
    height: 8,
    speed: 0.2,
    tilt: Math.PI / 6,
    itemScale: 1.5,
    spacing: 'arch'
  },
  events: {
    type: 'elliptical',  // Órbita elíptica
    radius: 18,
    height: 0,
    speed: 0.25,
    tilt: Math.PI / 8,
    itemScale: 1,
    spacing: 'even'
  },
  market: {
    type: 'cluster',     // Agrupación tipo mercado
    radius: 10,
    height: 5,
    speed: 0.15,
    tilt: 0,
    itemScale: 0.9,
    spacing: 'random'
  },
  feed: {
    type: 'swarm',       // Enjambre de posts
    radius: 20,
    height: 8,
    speed: 0.35,
    tilt: Math.PI / 12,
    itemScale: 1,
    spacing: 'swarm'
  },
  learn: {
    type: 'stair',       // Escalera ascendente
    radius: 14,
    height: 12,
    speed: 0.2,
    tilt: -Math.PI / 8,
    itemScale: 1.1,
    spacing: 'stair'
  },
  opportunities: {
    type: 'horizontal',
    radius: 16,
    height: 0,
    speed: 0.28,
    tilt: 0,
    itemScale: 1.1,
    spacing: 'even'
  },
  social: {
    type: 'network',     // Red conectada
    radius: 14,
    height: 6,
    speed: 0.22,
    tilt: Math.PI / 10,
    itemScale: 1,
    spacing: 'network'
  }
};

// ==================== ITEM ORBITAL INDIVIDUAL ====================

export const OrbitalItem = memo(({
  item,
  index,
  total,
  config,
  isSelected,
  isDimmed,
  onSelect,
  onDeselect,
  renderContent
}) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const { camera, viewport } = useThree();
  
  const [hovered, setHovered] = useState(false);
  const [isSeparating, setIsSeparating] = useState(false);
  const separationProgress = useRef(0);
  
  // Posición base en la órbita
  const baseAngle = useMemo(() => (index / total) * Math.PI * 2, [index, total]);
  const angleOffset = useRef(baseAngle);
  
  // Calcular posición objetivo cuando está seleccionado (centro de pantalla)
  const getScreenCenterPosition = useCallback(() => {
    const vector = new THREE.Vector3(0, 0, -30); // 30 unidades frente a la cámara
    vector.applyQuaternion(camera.quaternion);
    vector.add(camera.position);
    return vector;
  }, [camera]);
  
  // Posición en la órbita
  const getOrbitPosition = useCallback((angle, time) => {
    const { type, radius, height, tilt, speed } = config;
    let x, y, z;
    
    switch (type) {
      case 'vertical':
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * height + (index - total/2) * 2;
        z = Math.sin(angle) * radius * 0.3;
        break;
        
      case 'elliptical':
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius * 0.6;
        y = Math.sin(angle * 2) * height * 0.5;
        break;
        
      case 'cluster':
        const clusterOffset = (index % 3) * 4 - 4;
        x = Math.cos(angle) * radius + clusterOffset;
        z = Math.sin(angle) * radius + Math.floor(index / 3) * 4;
        y = Math.sin(time * 0.5 + index) * height * 0.3;
        break;
        
      case 'swarm':
        const swarmOffset = Math.sin(index * 132.2) * 5;
        x = Math.cos(angle) * (radius + swarmOffset);
        z = Math.sin(angle) * (radius + swarmOffset);
        y = Math.sin(time * 0.3 + index * 0.5) * height;
        break;
        
      case 'stair':
        const stairStep = index / (total - 1);
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = stairStep * height * 2 - height;
        break;
        
      case 'network':
        const layer = Math.floor(index / 3);
        x = Math.cos(angle) * (radius - layer * 3);
        z = Math.sin(angle) * (radius - layer * 3);
        y = layer * 4 - 4;
        break;
        
      default: // horizontal
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = Math.sin(time * 0.2 + index) * height * 0.3;
    }
    
    // Aplicar inclinación
    if (tilt) {
      const yTilted = y * Math.cos(tilt) - z * Math.sin(tilt);
      const zTilted = y * Math.sin(tilt) + z * Math.cos(tilt);
      y = yTilted;
      z = zTilted;
    }
    
    return { x, y, z };
  }, [config, index, total]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    if (isSelected && isSeparating) {
      // Animación de separación hacia el centro
      separationProgress.current += 0.03;
      if (separationProgress.current > 1) separationProgress.current = 1;
      
      const t = easeOutCubic(separationProgress.current);
      const orbitPos = getOrbitPosition(angleOffset.current, time);
      const centerPos = getScreenCenterPosition();
      
      groupRef.current.position.x = THREE.MathUtils.lerp(orbitPos.x, centerPos.x, t);
      groupRef.current.position.y = THREE.MathUtils.lerp(orbitPos.y, centerPos.y, t);
      groupRef.current.position.z = THREE.MathUtils.lerp(orbitPos.z, centerPos.z, t);
      
      // Escalar hacia arriba
      const scale = THREE.MathUtils.lerp(config.itemScale, 2.5, t);
      groupRef.current.scale.setScalar(scale);
      
      // Mirar a la cámara
      groupRef.current.lookAt(camera.position);
      
    } else if (!isSelected && separationProgress.current > 0) {
      // Volver a la órbita
      separationProgress.current -= 0.03;
      if (separationProgress.current < 0) separationProgress.current = 0;
      
      const t = easeOutCubic(separationProgress.current);
      const orbitPos = getOrbitPosition(angleOffset.current, time);
      const centerPos = getScreenCenterPosition();
      
      groupRef.current.position.x = THREE.MathUtils.lerp(orbitPos.x, centerPos.x, t);
      groupRef.current.position.y = THREE.MathUtils.lerp(orbitPos.y, centerPos.y, t);
      groupRef.current.position.z = THREE.MathUtils.lerp(orbitPos.z, centerPos.z, t);
      
      const scale = THREE.MathUtils.lerp(config.itemScale, 2.5, t);
      groupRef.current.scale.setScalar(scale);
      
    } else {
      // Órbita normal
      angleOffset.current += config.speed * 0.01;
      const pos = getOrbitPosition(angleOffset.current, time);
      
      groupRef.current.position.x = pos.x;
      groupRef.current.position.y = pos.y;
      groupRef.current.position.z = pos.z;
      
      // Rotación suave
      groupRef.current.rotation.y = time * 0.1 + index;
      
      // Escala base con efecto hover
      const hoverScale = hovered ? 1.3 : 1;
      const targetScale = config.itemScale * hoverScale;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    
    // Aplicar efecto de oscurecimiento
    if (meshRef.current) {
      const opacity = isDimmed ? 0.3 : 1;
      meshRef.current.material.opacity = THREE.MathUtils.lerp(
        meshRef.current.material.opacity,
        opacity,
        0.1
      );
    }
  });
  
  const handlePointerEnter = () => {
    if (!isDimmed && !isSelected) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };
  
  const handlePointerLeave = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };
  
  const handleClick = () => {
    if (isSelected) {
      onDeselect();
      setIsSeparating(false);
    } else {
      onSelect(item);
      setIsSeparating(true);
    }
  };
  
  return (
    <group
      ref={groupRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {/* Base del item - esfera invisible más grande para facilitar clic */}
      <mesh ref={meshRef} visible={!item.image && !item.imageUrl}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial 
          color={item.color || '#a855f7'}
          emissive={item.color || '#a855f7'}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          transparent
          opacity={isDimmed ? 0.2 : hovered ? 0.8 : 0.5}
        />
      </mesh>
      
      {/* Glow exterior en hover */}
      {hovered && !isDimmed && (
        <mesh scale={1.3}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial 
            color={item.color || '#a855f7'}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}
      
      {/* Aura cuando está seleccionado */}
      {isSelected && (
        <mesh scale={1.5}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial 
            color={item.color || '#a855f7'}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
      
      {/* Contenido HTML del item */}
      <Html 
        center 
        distanceFactor={15}
        style={{
          pointerEvents: isSelected ? 'auto' : 'none',
          opacity: isDimmed && !isSelected ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
          userSelect: 'none'
        }}
        transform
        occlude={false}
      >
        <div 
          className="orbital-card"
          onClick={(e) => {
            e.stopPropagation();
            if (!isSelected) handleClick();
          }}
          style={{
            cursor: isSelected ? 'default' : 'pointer',
            pointerEvents: isSelected ? 'auto' : 'none'
          }}
        >
          {renderContent(item, hovered || isSelected, isSelected)}
        </div>
      </Html>
      
      {/* Indicador de hover */}
      {hovered && !isSelected && !isDimmed && (
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.3, 0.6, 8]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      )}
    </group>
  );
});

// ==================== SISTEMA DE ÓRBITA COMPLETO ====================

export const OrbitalSystem = memo(({
  items = [],
  sectionType = 'music',
  selectedItem,
  onSelectItem,
  onDeselectItem,
  renderItemContent,
  centerPosition = [0, 0, 0]
}) => {
  const config = ORBIT_CONFIGS[sectionType] || ORBIT_CONFIGS.music;
  const groupRef = useRef();
  
  // Verificar si hay un item seleccionado para oscurecer los demás
  const isItemDimmed = useCallback((item) => {
    return selectedItem && selectedItem.id !== item.id;
  }, [selectedItem]);
  
  const isItemSelected = useCallback((item) => {
    return selectedItem && selectedItem.id === item.id;
  }, [selectedItem]);
  
  return (
    <group ref={groupRef} position={centerPosition}>
      {/* Anillo de órbita (debug/visual) */}
      {config.type === 'horizontal' && (
        <mesh rotation={[-Math.PI / 2, config.tilt, 0]}>
          <ringGeometry args={[config.radius - 0.5, config.radius + 0.5, 64]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Items orbitales - key único por sección */}
      {items.map((item, index) => (
        <OrbitalItem
          key={`${sectionType}-${item.id || 'item'}-${index}`}
          item={item}
          index={index}
          total={items.length}
          config={config}
          isSelected={isItemSelected(item)}
          isDimmed={isItemDimmed(item)}
          onSelect={onSelectItem}
          onDeselect={onDeselectItem}
          renderContent={renderItemContent}
        />
      ))}
    </group>
  );
});

export default OrbitalSystem;
