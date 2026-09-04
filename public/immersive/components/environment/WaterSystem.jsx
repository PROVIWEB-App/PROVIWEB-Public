/**
 * PROVIWEB - Sistema de Agua
 * Lagos y ríos ESTABLES
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Lago estático
const Lake = ({ position = [0, 0, 0], radius = 10 }) => {
  const waterMaterial = useMemo(() => (
    new THREE.MeshStandardMaterial({
      color: '#006994',
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.3,
    })
  ), []);
  
  return (
    <group position={position}>
      {/* Superficie del agua */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 32]} />
        <primitive object={waterMaterial} attach="material" />
      </mesh>
      
      {/* Fondo del lago */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius - 0.5, 32]} />
        <meshStandardMaterial color="#003d52" />
      </mesh>
      
      {/* Paredes */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[radius, radius - 0.5, 1.5, 32, 1, true]} />
        <meshStandardMaterial color="#8b7355" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Vegetación acuática */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = radius - 1.5 + Math.random();
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        return (
          <group key={i} position={[x, 0.1, z]}>
            <mesh>
              <cylinderGeometry args={[0.02, 0.03, 0.8, 5]} />
              <meshStandardMaterial color="#228b22" />
            </mesh>
          </group>
        );
      })}
      
      {/* Nenúfares */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2 + Math.random();
        const r = Math.random() * (radius - 4);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        return (
          <group key={`lily-${i}`} position={[x, 0.08, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.35, 7]} />
              <meshStandardMaterial color="#228b22" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.08, 6, 5]} />
              <meshStandardMaterial color="#ff69b4" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// Río simplificado
const River = ({ points, width = 4 }) => {
  const material = useMemo(() => (
    new THREE.MeshStandardMaterial({
      color: '#4a90e2',
      transparent: true,
      opacity: 0.75,
      roughness: 0.15,
    })
  ), []);
  
  // Crear geometría del río
  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    
    const shape = new THREE.Shape();
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    );
    
    const divisions = 30;
    const leftPoints = [];
    const rightPoints = [];
    
    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const w = width * (0.8 + Math.sin(t * Math.PI) * 0.3);
      
      leftPoints.push(new THREE.Vector3(
        point.x + normal.x * w / 2,
        point.y,
        point.z + normal.z * w / 2
      ));
      rightPoints.push(new THREE.Vector3(
        point.x - normal.x * w / 2,
        point.y,
        point.z - normal.z * w / 2
      ));
    }
    
    // Crear forma
    shape.moveTo(leftPoints[0].x, leftPoints[0].z);
    for (let i = 1; i < leftPoints.length; i++) {
      shape.lineTo(leftPoints[i].x, leftPoints[i].z);
    }
    for (let i = rightPoints.length - 1; i >= 0; i--) {
      shape.lineTo(rightPoints[i].x, rightPoints[i].z);
    }
    shape.closePath();
    
    const geo = new THREE.ShapeGeometry(shape, 15);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [points, width]);
  
  if (!geometry) return null;
  
  return (
    <mesh geometry={geometry} material={material} position={[0, 0.02, 0]} />
  );
};

// Sistema de agua completo
export const WaterSystem = () => {
  // Puntos del río
  const riverPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -60 + t * 120;
      const z = Math.sin(t * Math.PI * 2.5) * 20 + Math.cos(t * Math.PI) * 8;
      const y = 0;
      points.push([x, y, z]);
    }
    return points;
  }, []);
  
  return (
    <>
      {/* Lago principal */}
      <Lake position={[-40, 0, -40]} radius={12} />
      
      {/* Lago secundario */}
      <Lake position={[50, 0, 30]} radius={8} />
      
      {/* Río serpenteante */}
      <River points={riverPoints} width={5} />
      
      {/* Charcos pequeños */}
      {Array.from({ length: 4 }, (_, i) => {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        return (
          <mesh 
            key={i} 
            position={[x, 0.02, z]} 
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[1.5 + Math.random(), 8]} />
            <meshStandardMaterial 
              color="#4a90e2" 
              transparent 
              opacity={0.6}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </>
  );
};

export default WaterSystem;
