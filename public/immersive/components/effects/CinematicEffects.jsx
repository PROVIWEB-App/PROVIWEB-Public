/**
 * PROVIWEB - Efectos Cinematográficos ÉPICOS
 * Aurora boreal, cometas, constelaciones, agujeros de gusano
 */

import React, { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==================== AURORA BOREAL ====================
export const AuroraBorealis = memo(({ position = [0, 80, 0], color = '#00d9ff' }) => {
  const auroraRef = useRef();
  const materialRef = useRef();
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 60, 100, 20);
    const positions = geo.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 2] = Math.sin(x * 0.02) * 10 + Math.cos(y * 0.05) * 5;
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.2, color + '00');
    gradient.addColorStop(0.4, color + '60');
    gradient.addColorStop(0.5, color + '90');
    gradient.addColorStop(0.6, color + '60');
    gradient.addColorStop(0.8, color + '00');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 128);
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);
  
  useFrame((state) => {
    if (!auroraRef.current || !materialRef.current) return;
    const time = state.clock.elapsedTime;
    auroraRef.current.rotation.z = Math.sin(time * 0.1) * 0.05;
    materialRef.current.opacity = 0.3 + Math.sin(time * 0.5) * 0.2;
  });
  
  return (
    <mesh 
      ref={auroraRef} 
      position={position} 
      rotation={[-Math.PI / 2.5, 0, 0]}
      geometry={geometry}
    >
      <meshBasicMaterial 
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
});

// ==================== COMETAS ====================
export const Comets = memo(({ count = 5 }) => {
  const cometsRef = useRef([]);
  
  const cometsData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startPos: new THREE.Vector3(
        (Math.random() - 0.5) * 600,
        100 + Math.random() * 100,
        -300 - Math.random() * 200
      ),
      speed: 30 + Math.random() * 40,
      trailLength: 20 + Math.random() * 30,
      color: ['#00d9ff', '#a855f7', '#f43f5e', '#10b981'][i % 4]
    }));
  }, [count]);
  
  useFrame((state, delta) => {
    cometsRef.current.forEach((comet, i) => {
      if (!comet) return;
      const data = cometsData[i];
      comet.position.x += data.speed * delta;
      comet.position.y -= data.speed * 0.3 * delta;
      
      if (comet.position.x > 300 || comet.position.y < -50) {
        comet.position.copy(data.startPos);
      }
    });
  });
  
  return (
    <>
      {cometsData.map((data, i) => (
        <group key={data.id} ref={el => cometsRef.current[i] = el} position={data.startPos}>
          <mesh>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-data.trailLength / 2, 0, 0]}>
            <coneGeometry args={[0.3, data.trailLength, 8, 1, true]} />
            <meshBasicMaterial 
              color={data.color}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <pointLight color={data.color} intensity={2} distance={30} />
        </group>
      ))}
    </>
  );
});

// ==================== ESTRELLAS CADENTES ====================
export const ShootingStars = memo(({ count = 3 }) => {
  const starsRef = useRef([]);
  
  const starsData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * 3,
      duration: 1 + Math.random() * 0.5,
      startPos: new THREE.Vector3(
        (Math.random() - 0.5) * 400,
        150 + Math.random() * 50,
        (Math.random() - 0.5) * 400
      ),
      endPos: new THREE.Vector3(
        (Math.random() - 0.5) * 400,
        50 + Math.random() * 30,
        (Math.random() - 0.5) * 400
      )
    }));
  }, [count]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    starsRef.current.forEach((star, i) => {
      if (!star) return;
      const data = starsData[i];
      const cycle = (time + data.delay) % (data.duration + 2);
      const progress = Math.max(0, Math.min(1, cycle / data.duration));
      
      if (progress > 0 && progress < 1) {
        star.visible = true;
        star.position.lerpVectors(data.startPos, data.endPos, progress);
        star.scale.setScalar(Math.sin(progress * Math.PI) * 2);
      } else {
        star.visible = false;
      }
    });
  });
  
  return (
    <>
      {starsData.map((data, i) => (
        <mesh 
          key={data.id} 
          ref={el => starsRef.current[i] = el}
          visible={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#fff" blending={THREE.AdditiveBlending} />
          <pointLight color="#fff" intensity={3} distance={20} />
        </mesh>
      ))}
    </>
  );
});

// ==================== NEBULOSA PREMIUM ====================
export const NebulaPremium = memo(({ position = [0, 0, 0], color = '#a855f7', scale = 1 }) => {
  const cloudRef = useRef();
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < 5; i++) {
      const gradient = ctx.createRadialGradient(
        256 + (Math.random() - 0.5) * 200,
        256 + (Math.random() - 0.5) * 200,
        0,
        256,
        256,
        200 + i * 50
      );
      const alpha = Math.floor((0.4 - i * 0.08) * 255).toString(16).padStart(2, '0');
      gradient.addColorStop(0, color + alpha);
      gradient.addColorStop(0.5, color + Math.floor((0.2 - i * 0.04) * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);
  
  useFrame((state) => {
    if (!cloudRef.current) return;
    const time = state.clock.elapsedTime;
    cloudRef.current.rotation.z = time * 0.02;
    cloudRef.current.material.opacity = 0.3 + Math.sin(time * 0.4) * 0.1;
  });
  
  return (
    <mesh ref={cloudRef} position={position} scale={scale}>
      <planeGeometry args={[150, 150]} />
      <meshBasicMaterial 
        map={texture}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
});

// Exportar efectos base también
export { StarField, DynamicNebula, VolumetricRays, FairyDust } from './CinematicEffectsBase.jsx';
