/**
 * PROVIWEB - Punto de Entrada del Modo Inmersivo
 * Componente React principal que integra todo el sistema 3D
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { IMMERSIVE_CONFIG, immersiveState } from './config.js';
import { detectDeviceCapabilities, showFallbackNotification } from './utils/device-detector.js';
import { checkPremiumAccess, showPremiumModal } from './payment/paypal-integration.js';

// Importar componentes directamente (sin lazy loading para debug)
import ImmersiveWorld from './components/ImmersiveWorld.jsx';
import ImmersiveUI from './ui/ImmersiveUI.jsx';
import CarouselNavigation from './ui/CarouselNavigation.jsx';

// Importar estilos
import './ui/immersive-styles.css';

// Componente principal del modo inmersivo
const ImmersiveApp = ({ onExitToClassic }) => {
  console.log('[Immersive] ImmersiveApp montado');
  const [currentZone, setCurrentZone] = useState('hub');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [quality, setQuality] = useState('high');
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [audioMuted, setAudioMuted] = useState(false);
  
  // Usar ref para posición del jugador para evitar re-renders constantes
  const playerPositionRef = useRef([0, 40, 100]);
  const [uiPosition, setUiPosition] = useState([0, 40, 100]);
  
  // Throttle para actualización de UI
  const handlePlayerPositionChange = useCallback((pos) => {
    playerPositionRef.current = pos;
    // Actualizar UI solo cada 10 frames aprox
    if (Math.random() > 0.7) {
      setUiPosition(pos);
    }
  }, []);
  
  // Detectar capacidades del dispositivo al iniciar
  useEffect(() => {
    const init = async () => {
      const capabilities = await detectDeviceCapabilities();
      setDeviceCapabilities(capabilities);
      
      // Ajustar calidad según capacidad
      if (capabilities.performanceLevel === 'low') {
        setQuality('low');
        setParticlesEnabled(false);
      } else if (capabilities.performanceLevel === 'medium') {
        setQuality('medium');
      }
      
      // Mostrar fallback si es necesario
      if (!capabilities.canRunImmersive) {
        setShowFallback(true);
      }
    };
    
    init();
  }, []);
  
  // Escuchar eventos de navegación
  useEffect(() => {
    const handleGoto = (e) => {
      handleZoneChange(e.detail);
    };
    
    window.addEventListener('proviweb:immersive:goto', handleGoto);
    return () => window.removeEventListener('proviweb:immersive:goto', handleGoto);
  }, []);
  
  // Escuchar evento de apertura de creador
  useEffect(() => {
    const handleOpenCreator = (e) => {
      console.log('[Immersive] Abriendo creador:', e.detail);
      // El creador ahora se maneja dentro de ImmersiveWorld
      // Este evento puede usarse para tracking o analytics
    };
    
    window.addEventListener('proviweb:immersive:open-creator', handleOpenCreator);
    return () => window.removeEventListener('proviweb:immersive:open-creator', handleOpenCreator);
  }, []);
  
  // Cambio de zona con transición cinematográfica
  const handleZoneChange = useCallback((zoneId) => {
    console.log('[Immersive] Intentando viajar a zona:', zoneId);
    
    if (zoneId === currentZone) {
      console.log('[Immersive] Ya estás en esta zona');
      return;
    }
    if (isTransitioning) {
      console.log('[Immersive] Transición en curso, espera...');
      return;
    }
    
    setIsTransitioning(true);
    setCurrentZone(zoneId);
    
    // Las posiciones de cámara se manejan en StaticCamera a través del cambio de currentZone
    // No necesitamos disparar el evento aquí porque StaticCamera detecta el cambio de currentZone
    console.log('[Immersive] Iniciando viaje cinematográfico a:', zoneId);
    
    // Resetear estado de transición después de la animación
    setTimeout(() => {
      setIsTransitioning(false);
    }, IMMERSIVE_CONFIG.animation.cameraTransitionDuration * 1000);
  }, [currentZone, isTransitioning]);
  
  // Cambio de calidad
  const handleQualityChange = useCallback((newQuality) => {
    setQuality(newQuality);
    
    // Ajustar partículas según calidad
    if (newQuality === 'low') {
      setParticlesEnabled(false);
    } else {
      setParticlesEnabled(true);
    }
  }, []);
  
  // Forzar inicio a pesar de limitaciones
  const handleForceStart = useCallback(() => {
    setShowFallback(false);
  }, []);
  
  // Usar modo clásico
  const handleUseClassic = useCallback(() => {
    onExitToClassic();
  }, [onExitToClassic]);
  
  if (showFallback) {
    return (
      <div className="immersive-root">
        <div ref={(el) => {
          if (el && !el.querySelector('.immersive-fallback-notification')) {
            showFallbackNotification(el);
          }
        }} />
      </div>
    );
  }
  
  return (
    <div className="immersive-root">
      <ImmersiveWorld
        currentZone={currentZone}
        onZoneChange={handleZoneChange}
        onTransitionComplete={(zone) => {
          console.log('[Immersive] Llegó a zona:', zone);
        }}
        quality={quality}
        particlesEnabled={particlesEnabled}
        onPlayerPositionChange={handlePlayerPositionChange}
        onItemInteract={setActiveItem}
      />
      
      <ImmersiveUI
        currentZone={currentZone}
        onZoneChange={handleZoneChange}
        onToggleMode={onExitToClassic}
        isTransitioning={isTransitioning}
        quality={quality}
        onQualityChange={handleQualityChange}
        playerPosition={uiPosition}
        activeItem={activeItem}
        onCloseItem={() => setActiveItem(null)}
      />
      
      {/* Navegación tipo carrusel */}
      <CarouselNavigation
        currentZone={currentZone}
        onZoneChange={handleZoneChange}
      />
    </div>
  );
};

// Función principal para iniciar el modo inmersivo
export const startImmersiveMode = async (container, options = {}) => {
  const {
    onExitToClassic = () => {},
    requirePayment = true,
  } = options;
  
  // Verificar si ya está activo
  if (immersiveState.isActive) {
    console.warn('[Immersive] Ya está activo');
    return;
  }
  
  // Verificar pago premium si es requerido
  if (requirePayment && !checkPremiumAccess()) {
    // Mostrar modal de pago
    const modalContainer = document.createElement('div');
    modalContainer.id = 'immersive-modal-container';
    document.body.appendChild(modalContainer);
    
    showPremiumModal(modalContainer);
    
    // Esperar a que se complete el pago
    return new Promise((resolve) => {
      const handlePayment = (e) => {
        window.removeEventListener('proviweb:immersive:premium-activated', handlePayment);
        modalContainer.remove();
        resolve(startImmersiveMode(container, { ...options, requirePayment: false }));
      };
      
      window.addEventListener('proviweb:immersive:premium-activated', handlePayment);
    });
  }
  
  console.log('[Immersive] Creando contenedor...');
  
  // Crear contenedor para React
  const immersiveContainer = document.createElement('div');
  immersiveContainer.id = 'immersive-app-container';
  immersiveContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background: linear-gradient(135deg, #0f0f13 0%, #1a1a2e 100%);
  `;
  
  console.log('[Immersive] Contenedor creado:', immersiveContainer);
  
  // Ocultar contenido clásico (excepto header que se maneja por evento)
  const mainContent = document.getElementById('mainContent');
  const footer = document.querySelector('.footer');
  
  if (mainContent) mainContent.style.display = 'none';
  if (footer) footer.style.display = 'none';
  
  document.body.appendChild(immersiveContainer);
  
  // Renderizar aplicación React
  const root = createRoot(immersiveContainer);
  
  const handleExit = () => {
    immersiveState.isActive = false;
    root.unmount();
    immersiveContainer.remove();
    
    // Restaurar contenido clásico (excepto header que se maneja por evento)
    if (mainContent) mainContent.style.display = '';
    if (footer) footer.style.display = '';
    
    // Disparar evento de salida
    window.dispatchEvent(new CustomEvent('proviweb:immersive:exit'));
    
    onExitToClassic();
  };
  
  console.log('[Immersive] Renderizando React...');
  
  // Mensaje de carga visible
  const loadingMsg = document.createElement('div');
  loadingMsg.id = 'immersive-loading-msg';
  loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-family:sans-serif;z-index:10000;';
  loadingMsg.innerHTML = '<h2>🌌 Cargando PROVIWEB Journey...</h2><p>Preparando mundo 3D</p>';
  document.body.appendChild(loadingMsg);
  
  try {
    root.render(
      <ImmersiveApp 
        onExitToClassic={handleExit}
      />
    );
    console.log('[Immersive] React renderizado exitosamente');
    // Quitar mensaje de carga después de un momento
    setTimeout(() => loadingMsg.remove(), 1000);
  } catch (error) {
    console.error('[Immersive] Error al renderizar:', error);
    loadingMsg.innerHTML = `<div style="color:white;padding:20px;"><h2>❌ Error al cargar</h2><p>${error.message}</p><button onclick="location.reload()" style="padding:10px 20px;margin-top:10px;cursor:pointer;">Recargar</button></div>`;
  }
  
  immersiveState.isActive = true;
  
  // Disparar evento de inicio
  window.dispatchEvent(new CustomEvent('proviweb:immersive:start'));
  
  return {
    destroy: handleExit,
  };
};

// Función para detener el modo inmersivo
export const stopImmersiveMode = () => {
  const container = document.getElementById('immersive-app-container');
  if (container) {
    // Disparar evento de cierre
    window.dispatchEvent(new CustomEvent('proviweb:immersive:exit'));
  }
};

// Exportar utilidades
export { IMMERSIVE_CONFIG, immersiveState };

// Inicialización automática si hay parámetro en URL
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  if (mode === 'immersive') {
    // Auto-iniciar después de que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        startImmersiveMode();
      });
    } else {
      startImmersiveMode();
    }
  }
}

export default ImmersiveApp;
