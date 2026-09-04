/**
 * PROVIWEB - Creador Inmersivo
 * Interfaz 3D para crear contenido (posts, música, arte, eventos)
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Tipos de contenido que se pueden crear
const CONTENT_TYPES = {
  post: {
    title: 'Nuevo Post',
    icon: '✍️',
    color: '#ff6b35',
    fields: ['Título', 'Contenido', 'Imagen/Vídeo', 'Tags'],
    placeholder: '¿Qué quieres compartir con la comunidad?'
  },
  music: {
    title: 'Subir Música',
    icon: '🎵',
    color: '#a855f7',
    fields: ['Título', 'Artista', 'Género', 'Archivo MP3', 'Portada'],
    placeholder: 'Comparte tu talento musical'
  },
  art: {
    title: 'Subir Arte',
    icon: '🎨',
    color: '#ec4899',
    fields: ['Título', 'Descripción', 'Imagen', 'Categoría', 'Precio (opcional)'],
    placeholder: 'Muestra tu creatividad visual'
  },
  event: {
    title: 'Crear Evento',
    icon: '📅',
    color: '#6366f1',
    fields: ['Nombre', 'Fecha', 'Lugar', 'Descripción', 'Imagen'],
    placeholder: 'Organiza un concierto, meetup o taller'
  }
};

export const ImmersiveCreator = ({ 
  type = 'post',
  position = [0, 10, 0],
  onClose,
  onSubmit
}) => {
  const creatorRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const content = CONTENT_TYPES[type];
  const fields = content.fields;
  
  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  useFrame((state) => {
    if (!creatorRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Flotación suave
    creatorRef.current.position.y = position[1] + Math.sin(time) * 0.5;
    
    // Rotación lenta
    creatorRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
  });
  
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNext = () => {
    if (currentStep < fields.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simular envío
    setTimeout(() => {
      if (onSubmit) onSubmit({ type, data: formData });
      setIsSubmitting(false);
      onClose();
    }, 2000);
  };
  
  const currentField = fields[currentStep];
  const progress = ((currentStep + 1) / fields.length) * 100;
  
  if (!isVisible) return null;
  
  return (
    <group ref={creatorRef} position={position}>
      {/* Base holográfica */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <cylinderGeometry args={[6, 6, 0.5, 32]} />
        <meshStandardMaterial
          color={content.color}
          emissive={content.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
      
      {/* Columnas de luz */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 5,
              0,
              Math.sin(angle) * 5
            ]}
          >
            <cylinderGeometry args={[0.1, 0.1, 10, 8]} />
            <meshBasicMaterial
              color={content.color}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
      
      {/* Panel principal */}
      <Html center transform position={[0, 0, 0]}>
        <div style={{
          width: '500px',
          background: 'linear-gradient(135deg, rgba(5,0,8,0.98), rgba(20,10,40,0.95))',
          border: `2px solid ${content.color}`,
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(30px)',
          boxShadow: `0 0 80px ${content.color}60, inset 0 0 60px ${content.color}10`,
          animation: 'slideIn 0.5s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            borderBottom: `1px solid ${content.color}40`,
            paddingBottom: '16px'
          }}>
            <div style={{
              fontSize: '48px',
              filter: `drop-shadow(0 0 20px ${content.color})`
            }}>
              {content.icon}
            </div>
            <div>
              <h2 style={{
                margin: 0,
                color: content.color,
                fontSize: '28px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                {content.title}
              </h2>
              <p style={{
                margin: '4px 0 0',
                color: '#888',
                fontSize: '14px'
              }}>
                {content.placeholder}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#666'}
            >
              ✕
            </button>
          </div>
          
          {/* Barra de progreso */}
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${content.color}, #fff)`,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
              boxShadow: `0 0 10px ${content.color}`
            }} />
          </div>
          
          {/* Paso actual */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: content.color,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '8px'
            }}>
              Paso {currentStep + 1} de {fields.length}
            </label>
            <h3 style={{
              margin: '0 0 16px',
              color: '#fff',
              fontSize: '20px'
            }}>
              {currentField}
            </h3>
            
            {currentField.includes('Imagen') || currentField.includes('Archivo') ? (
              <div style={{
                border: `2px dashed ${content.color}50`,
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'rgba(255,255,255,0.02)'
              }}
              onDragEnter={(e) => {
                e.currentTarget.style.borderColor = content.color;
                e.currentTarget.style.background = `${content.color}10`;
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = `${content.color}50`;
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                <p style={{ color: '#888', margin: 0 }}>
                  Arrastra un archivo aquí o<br />
                  <span style={{ color: content.color, textDecoration: 'underline' }}>
                    haz clic para seleccionar
                  </span>
                </p>
              </div>
            ) : (
              <textarea
                value={formData[currentField] || ''}
                onChange={(e) => handleFieldChange(currentField, e.target.value)}
                placeholder={`Escribe ${currentField.toLowerCase()}...`}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${content.color}30`,
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#fff',
                  fontSize: '16px',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = content.color;
                  e.target.style.boxShadow = `0 0 20px ${content.color}30`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${content.color}30`;
                  e.target.style.boxShadow = 'none';
                }}
              />
            )}
          </div>
          
          {/* Botones de navegación */}
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                style={{
                  padding: '16px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
              >
                ← Anterior
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '16px 24px',
                background: `linear-gradient(135deg, ${content.color}, ${content.color}80)`,
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isSubmitting ? 'wait' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: `0 4px 20px ${content.color}40`,
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 8px 30px ${content.color}60`;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 20px ${content.color}40`;
              }}
            >
              {isSubmitting ? (
                '⏳ Creando...'
              ) : currentStep === fields.length - 1 ? (
                '✨ Crear Contenido'
              ) : (
                'Siguiente →'
              )}
            </button>
          </div>
          
          {/* Preview de datos ingresados */}
          {Object.keys(formData).length > 0 && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px'
            }}>
              <h4 style={{
                margin: '0 0 12px',
                color: '#888',
                fontSize: '12px',
                textTransform: 'uppercase'
              }}>
                Resumen
              </h4>
              {Object.entries(formData).map(([key, value]) => (
                value && (
                  <div key={key} style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: content.color }}>{key}:</span>
                    <span style={{ 
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '300px'
                    }}>
                      {value}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

export default ImmersiveCreator;
