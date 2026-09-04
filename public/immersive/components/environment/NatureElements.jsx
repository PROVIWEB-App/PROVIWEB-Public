/**
 * PROVIWEB - Elementos de Naturaleza
 * Árboles, arbustos y vegetación REALISTA y ESTÁTICA
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Paleta de colores naturales (FIJOS, sin cambios)
const TREE_COLORS = {
  oak: { trunk: '#5c4033', leaves: '#228b22' },
  pine: { trunk: '#4a3728', leaves: '#0f5132' },
  birch: { trunk: '#f5f5dc', leaves: '#9acd32' },
  willow: { trunk: '#654321', leaves: '#9acd32' },
};

// Componente de árbol individual - COMPLETAMENTE ESTÁTICO
const Tree = ({ position, type = 'oak', scale = 1, rotation = 0 }) => {
  const colors = TREE_COLORS[type];
  
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Tronco con textura simple */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25 * scale, 0.35 * scale, 3, 12]} />
        <meshStandardMaterial 
          color={colors.trunk} 
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      
      {/* Copas del árbol según tipo - SIN ANIMACIONES */}
      {type === 'oak' && (
        <group position={[0, 3.5, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <dodecahedronGeometry args={[1.8, 0]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0.8, -0.5, 0.5]} castShadow>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
          <mesh position={[-0.6, -0.3, -0.4]} castShadow>
            <dodecahedronGeometry args={[1.0, 0]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
        </group>
      )}
      
      {type === 'pine' && (
        <group position={[0, 4, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <coneGeometry args={[2.2, 3.5, 12]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[1.7, 3, 12]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0, 4.5, 0]} castShadow>
            <coneGeometry args={[1.2, 2.5, 12]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
        </group>
      )}
      
      {type === 'birch' && (
        <group position={[0, 3.8, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <dodecahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0.5, 0.8, 0]} castShadow>
            <dodecahedronGeometry args={[1.0, 0]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
        </group>
      )}
      
      {type === 'willow' && (
        <group position={[0, 3, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[2, 8, 6]} />
            <meshStandardMaterial 
              color={colors.leaves} 
              roughness={0.8}
            />
          </mesh>
          {/* Ramas colgantes estáticas */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 1.3;
            const z = Math.sin(angle) * 1.3;
            return (
              <mesh key={i} position={[x, -1, z]} castShadow>
                <cylinderGeometry args={[0.04, 0.02, 2, 6]} />
                <meshStandardMaterial color={colors.leaves} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

// Arbusto estático
const Bush = ({ position, scale = 1 }) => {
  const color = '#3d6b22'; // Color fijo, no cambia
  
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.1, 0.15]} castShadow>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[-0.25, 0.15, -0.15]} castShadow>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
};

// Piedra/Roca realista
const Rock = ({ position, scale = 1, rotation = 0 }) => {
  // Forma irregular usando dodecaedro escalado
  const scaleX = 0.8 + Math.random() * 0.4;
  const scaleY = 0.6 + Math.random() * 0.3;
  const scaleZ = 0.8 + Math.random() * 0.4;
  
  return (
    <mesh 
      position={position} 
      scale={[scaleX * scale, scaleY * scale, scaleZ * scale]}
      rotation={[Math.random() * 0.3, rotation, Math.random() * 0.3]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial 
        color="#666666" 
        roughness={0.95}
        metalness={0.1}
      />
    </mesh>
  );
};

// Tronco caído
const FallenLog = ({ position, rotation = 0 }) => {
  return (
    <group position={position} rotation={[0.2, rotation, 0.1]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 2.5, 10]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      {/* Detalle de la madera cortada */}
      <mesh position={[0, 1.25, 0]}>
        <circleGeometry args={[0.25, 8]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      <mesh position={[0, -1.25, 0]}>
        <circleGeometry args={[0.25, 8]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
    </group>
  );
};

// Sistema de naturaleza completo
export const NatureElements = ({ 
  treeCount = 30, 
  bushCount = 40,
  area = { minX: -80, maxX: 80, minZ: -80, maxZ: 80 }
}) => {
  // Generar posiciones de árboles (solo una vez, no cambian)
  const trees = useMemo(() => {
    const types = ['oak', 'pine', 'birch', 'willow'];
    return Array.from({ length: treeCount }, (_, i) => {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = 20 + Math.random() * 50;
      const x = Math.cos(angle + i) * radius + (Math.random() - 0.5) * 10;
      const z = Math.sin(angle + i) * radius + (Math.random() - 0.5) * 10;
      
      // Evitar el centro (donde está el hub)
      if (Math.abs(x) < 15 && Math.abs(z) < 15) return null;
      // Evitar lagos
      if (Math.abs(x + 40) < 15 && Math.abs(z + 40) < 15) return null;
      if (Math.abs(x - 50) < 12 && Math.abs(z - 30) < 12) return null;
      
      return {
        id: i,
        position: [x, 0, z],
        type: types[Math.floor(Math.random() * types.length)],
        scale: 0.9 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
      };
    }).filter(Boolean);
  }, [treeCount]);
  
  // Generar posiciones de arbustos
  const bushes = useMemo(() => {
    return Array.from({ length: bushCount }, (_, i) => {
      const x = area.minX + Math.random() * (area.maxX - area.minX);
      const z = area.minZ + Math.random() * (area.maxZ - area.minZ);
      
      // Evitar centro y lagos
      if (Math.abs(x) < 15 && Math.abs(z) < 15) return null;
      if (Math.abs(x + 40) < 15 && Math.abs(z + 40) < 15) return null;
      
      return {
        id: i,
        position: [x, 0, z],
        scale: 0.6 + Math.random() * 0.5,
      };
    }).filter(Boolean);
  }, [bushCount, area]);
  
  // Rocas
  const rocks = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 140,
        0.3,
        (Math.random() - 0.5) * 140,
      ],
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
    }));
  }, []);
  
  // Troncos caídos
  const logs = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 100,
        0.2,
        (Math.random() - 0.5) * 100,
      ],
      rotation: Math.random() * Math.PI * 2,
    }));
  }, []);
  
  return (
    <>
      {/* Bosque */}
      {trees.map((tree) => (
        <Tree
          key={tree.id}
          position={tree.position}
          type={tree.type}
          scale={tree.scale}
          rotation={tree.rotation}
        />
      ))}
      
      {/* Arbustos */}
      {bushes.map((bush) => (
        <Bush
          key={bush.id}
          position={bush.position}
          scale={bush.scale}
        />
      ))}
      
      {/* Rocas */}
      {rocks.map((rock) => (
        <Rock
          key={rock.id}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
        />
      ))}
      
      {/* Troncos caídos */}
      {logs.map((log) => (
        <FallenLog
          key={log.id}
          position={log.position}
          rotation={log.rotation}
        />
      ))}
    </>
  );
};

export default NatureElements;
