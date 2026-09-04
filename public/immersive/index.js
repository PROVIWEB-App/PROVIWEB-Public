/**
 * PROVIWEB - Módulo Inmersivo
 * Punto de entrada principal para el modo experiencia 3D
 * 
 * Uso:
 *   import { initImmersiveMode } from './immersive/index.js';
 *   initImmersiveMode();
 */

// Exportar funciones principales
export { 
  startImmersiveMode, 
  stopImmersiveMode,
  IMMERSIVE_CONFIG,
  immersiveState 
} from './immersive-entry.jsx';

export { 
  initImmersiveIntegration 
} from './integration.js';

export { 
  checkPremiumAccess,
  showPremiumModal 
} from './payment/paypal-integration.js';

export { 
  detectDeviceCapabilities,
  showFallbackNotification 
} from './utils/device-detector.js';

export {
  checkUserFreeAccess,
  hasFreeAccess,
  getUserAccessBadge,
  isAdmin,
  isAlly,
  clearUserAccessState,
} from './utils/user-roles.js';

// Función de conveniencia para inicializar todo
export const initImmersiveMode = (options = {}) => {
  // Importar dinámicamente para evitar problemas de carga
  return import('./integration.js').then(module => {
    module.initImmersiveIntegration(options);
    return module;
  });
};

// Auto-inicialización para home.html
if (typeof window !== 'undefined') {
  // Detectar si estamos en home.html
  const isHomePage = window.location.pathname.includes('home.html') || 
                     window.location.pathname === '/' ||
                     window.location.pathname.endsWith('/public/');
  
  if (isHomePage) {
    // Esperar a que el DOM esté listo
    const init = () => {
      initImmersiveMode().catch(err => {
        console.error('[Immersive] Error en auto-inicialización:', err);
      });
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
}

export default initImmersiveMode;
