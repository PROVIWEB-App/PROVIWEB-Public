/**
 * PROVIWEB - Detector de Dispositivo y Capacidad
 * Determina si el dispositivo puede ejecutar el modo inmersivo
 */

import { IMMERSIVE_CONFIG, isMobile, hasWebGLSupport, detectPerformanceCapability } from '../config.js';

// Resultado de la detección
export const deviceCapability = {
  webglSupported: false,
  webglVersion: null,
  isMobile: false,
  performanceLevel: 'unknown',
  canRunImmersive: false,
  shouldUseFallback: false,
  limitations: [],
  recommendations: [],
  detectedGPU: null,
  maxTextureSize: 0,
  maxViewportDims: [0, 0],
};

/**
 * Detectar capacidades WebGL detalladas
 */
const detectWebGLCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    deviceCapability.webglSupported = false;
    deviceCapability.limitations.push('WebGL no soportado');
    return;
  }
  
  deviceCapability.webglSupported = true;
  deviceCapability.webglVersion = gl instanceof WebGL2RenderingContext ? '2.0' : '1.0';
  
  // Detectar GPU (si está disponible)
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    deviceCapability.detectedGPU = {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  }
  
  // Capacidades de textura
  deviceCapability.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  deviceCapability.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  
  // Verificar extensiones importantes
  const requiredExtensions = [
    'OES_texture_float',
    'WEBGL_depth_texture',
    'OES_standard_derivatives',
  ];
  
  const supportedExtensions = gl.getSupportedExtensions() || [];
  
  requiredExtensions.forEach(ext => {
    if (!supportedExtensions.includes(ext)) {
      deviceCapability.limitations.push(`Extensión ${ext} no soportada`);
    }
  });
};

/**
 * Realizar prueba de rendimiento simple
 */
const runPerformanceTest = () => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    const startTime = performance.now();
    let frames = 0;
    
    const testFrame = () => {
      // Dibujar algo pesado
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `hsl(${i * 3.6}, 50%, 50%)`;
        ctx.fillRect(i, i, 10, 10);
      }
      
      frames++;
      
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(testFrame);
      } else {
        const fps = frames;
        
        if (fps < 30) {
          deviceCapability.performanceLevel = 'low';
          deviceCapability.limitations.push(`FPS de prueba bajo: ${fps}`);
        } else if (fps < 50) {
          deviceCapability.performanceLevel = 'medium';
        } else {
          deviceCapability.performanceLevel = 'high';
        }
        
        resolve(fps);
      }
    };
    
    requestAnimationFrame(testFrame);
  });
};

/**
 * Detectar todas las capacidades del dispositivo
 */
export const detectDeviceCapabilities = async () => {
  // Detectar WebGL
  detectWebGLCapabilities();
  
  // Detectar móvil
  deviceCapability.isMobile = isMobile();
  
  // Detectar capacidad de rendimiento
  const baseCapability = detectPerformanceCapability();
  deviceCapability.performanceLevel = baseCapability;
  
  // Ejecutar prueba de rendimiento
  if (deviceCapability.webglSupported) {
    await runPerformanceTest();
  }
  
  // Determinar si puede ejecutar modo inmersivo
  deviceCapability.canRunImmersive = canRunImmersiveMode();
  deviceCapability.shouldUseFallback = !deviceCapability.canRunImmersive;
  
  // Generar recomendaciones
  generateRecommendations();
  
  console.log('[DeviceDetector] Capacidades detectadas:', deviceCapability);
  
  return deviceCapability;
};

/**
 * Determinar si puede ejecutar modo inmersivo
 */
const canRunImmersiveMode = () => {
  // Requisitos mínimos
  if (!deviceCapability.webglSupported) {
    return false;
  }
  
  // Verificar versión de WebGL
  if (deviceCapability.webglVersion === '1.0') {
    deviceCapability.limitations.push('WebGL 1.0 tiene funcionalidad limitada');
  }
  
  // Verificar tamaño de textura mínimo
  if (deviceCapability.maxTextureSize < 1024) {
    deviceCapability.limitations.push('Tamaño de textura muy limitado');
    return false;
  }
  
  // Verificar rendimiento
  if (deviceCapability.performanceLevel === 'low' && deviceCapability.isMobile) {
    deviceCapability.limitations.push('Rendimiento insuficiente en dispositivo móvil');
    return false;
  }
  
  return true;
};

/**
 * Generar recomendaciones basadas en las capacidades
 */
const generateRecommendations = () => {
  const recommendations = [];
  
  if (deviceCapability.performanceLevel === 'low') {
    recommendations.push({
      type: 'quality',
      message: 'Reducir calidad gráfica para mejor rendimiento',
      action: () => setQualityLevel('low'),
    });
  }
  
  if (deviceCapability.isMobile) {
    recommendations.push({
      type: 'particles',
      message: 'Desactivar partículas en móvil',
      action: () => disableParticles(),
    });
  }
  
  if (deviceCapability.webglVersion === '1.0') {
    recommendations.push({
      type: 'webgl',
      message: 'Algunos efectos visuales no estarán disponibles',
      action: null,
    });
  }
  
  deviceCapability.recommendations = recommendations;
};

/**
 * Aplicar configuración de calidad baja
 */
const setQualityLevel = (level) => {
  // Esta función será llamada desde el mundo 3D
  window.dispatchEvent(new CustomEvent('proviweb:immersive:set-quality', {
    detail: { level },
  }));
};

/**
 * Desactivar partículas
 */
const disableParticles = () => {
  window.dispatchEvent(new CustomEvent('proviweb:immersive:disable-particles'));
};

/**
 * Obtener mensaje de fallback apropiado
 */
export const getFallbackMessage = () => {
  if (!deviceCapability.webglSupported) {
    return {
      title: 'Navegador no compatible',
      message: 'Tu navegador no soporta WebGL, necesario para el modo inmersivo. Te recomendamos usar Chrome, Firefox o Edge actualizado.',
      action: 'Continuar en modo clásico',
    };
  }
  
  if (deviceCapability.performanceLevel === 'low') {
    return {
      title: 'Dispositivo de baja capacidad',
      message: 'Tu dispositivo podría tener dificultades para ejecutar el modo inmersivo correctamente. Hemos ajustado la calidad automáticamente.',
      action: 'Intentar de todos modos',
    };
  }
  
  return {
    title: 'Modo inmersivo no disponible',
    message: 'No podemos ejecutar el modo inmersivo en tu dispositivo actual.',
    action: 'Continuar en modo clásico',
  };
};

/**
 * Mostrar notificación de fallback
 */
export const showFallbackNotification = (container) => {
  const message = getFallbackMessage();
  
  const notificationHTML = `
    <div id="immersiveFallbackNotification" class="immersive-fallback-notification">
      <div class="immersive-fallback-content">
        <div class="immersive-fallback-icon">⚠️</div>
        <h3>${message.title}</h3>
        <p>${message.message}</p>
        <div class="immersive-fallback-actions">
          <button id="immersiveTryAnyway" class="immersive-btn-primary">
            ${message.action}
          </button>
          <button id="immersiveGoClassic" class="immersive-btn-secondary">
            Usar modo clásico
          </button>
        </div>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', notificationHTML);
  
  // Event listeners
  document.getElementById('immersiveTryAnyway')?.addEventListener('click', () => {
    document.getElementById('immersiveFallbackNotification')?.remove();
    window.dispatchEvent(new CustomEvent('proviweb:immersive:force-start'));
  });
  
  document.getElementById('immersiveGoClassic')?.addEventListener('click', () => {
    document.getElementById('immersiveFallbackNotification')?.remove();
    window.dispatchEvent(new CustomEvent('proviweb:immersive:use-classic'));
  });
};

export default deviceCapability;
