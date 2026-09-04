/**
 * PROVIWEB - Navegación tipo Carrusel
 * Navegación elegante en la parte inferior con flechas y contador
 */

import React, { useState, useCallback } from 'react';

// Configuración de secciones
const SECTIONS = [
  { id: 'hub', name: 'Centro Creativo', icon: '🏛️', color: '#a855f7' },
  { id: 'feed', name: 'Valle del Feed', icon: '📝', color: '#007BFF' },
  { id: 'music', name: 'Armonía Musical', icon: '🎵', color: '#f43f5e' },
  { id: 'art', name: 'Galería Etereal', icon: '🎨', color: '#ec4899' },
  { id: 'social', name: 'Puente Social', icon: '👥', color: '#8b5cf6' },
  { id: 'learn', name: 'Monte del Conocimiento', icon: '📚', color: '#10b981' },
  { id: 'market', name: 'Bazar Creativo', icon: '🛒', color: '#f59e0b' },
  { id: 'events', name: 'Plaza de Eventos', icon: '📅', color: '#6366f1' },
  { id: 'opportunities', name: 'Horizonte de Oportunidades', icon: '💼', color: '#06b6d4' }
];

export const CarouselNavigation = ({ currentZone, onZoneChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentIndex = SECTIONS.findIndex(s => s.id === currentZone);
  const currentSection = SECTIONS[currentIndex] || SECTIONS[0];
  
  const handlePrev = useCallback(() => {
    const newIndex = currentIndex <= 0 ? SECTIONS.length - 1 : currentIndex - 1;
    onZoneChange(SECTIONS[newIndex].id);
  }, [currentIndex, onZoneChange]);
  
  const handleNext = useCallback(() => {
    const newIndex = currentIndex >= SECTIONS.length - 1 ? 0 : currentIndex + 1;
    onZoneChange(SECTIONS[newIndex].id);
  }, [currentIndex, onZoneChange]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      {/* Botón anterior */}
      <button
        onClick={handlePrev}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#fff',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(168,85,247,0.4)';
          e.target.style.borderColor = '#a855f7';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0,0,0,0.6)';
          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ←
      </button>
      
      {/* Info central */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Contador */}
        <div style={{
          padding: '8px 20px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          {currentIndex + 1} / {SECTIONS.length}
        </div>
        
        {/* Nombre de sección con dropdown */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '12px 30px',
            background: `linear-gradient(135deg, ${currentSection.color}, ${currentSection.color}80)`,
            border: 'none',
            borderRadius: '30px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: `0 4px 30px ${currentSection.color}50`,
            transition: 'all 0.3s ease'
          }}
        >
          <span>{currentSection.icon}</span>
          <span>{currentSection.name}</span>
          <span style={{ fontSize: '12px', marginLeft: '5px' }}>▼</span>
        </button>
        
        {/* Dropdown de secciones */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '15px',
            background: 'rgba(10,10,20,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '15px',
            minWidth: '280px',
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 10px 50px rgba(0,0,0,0.5)'
          }}>
            {SECTIONS.map((section, index) => (
              <button
                key={section.id}
                onClick={() => {
                  onZoneChange(section.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  marginBottom: '8px',
                  background: section.id === currentZone ? `${section.color}30` : 'transparent',
                  border: section.id === currentZone ? `2px solid ${section.color}` : '2px solid transparent',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '20px' }}>{section.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{section.name}</span>
                {section.id === currentZone && (
                  <span style={{ color: section.color }}>●</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Botón siguiente */}
      <button
        onClick={handleNext}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#fff',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(168,85,247,0.4)';
          e.target.style.borderColor = '#a855f7';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0,0,0,0.6)';
          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        →
      </button>
    </div>
  );
};

export default CarouselNavigation;
