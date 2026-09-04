/**
 * PROVIWEB - Script de Integración con home.html
 * Agrega el modo inmersivo al sistema existente sin modificarlo
 */

import { startImmersiveMode } from './immersive-entry.jsx';
import { checkPremiumAccess } from './payment/paypal-integration.js';
import { detectDeviceCapabilities } from './utils/device-detector.js';
import { checkUserFreeAccess, getUserAccessBadge } from './utils/user-roles.js';

// Configuración de integración
const INTEGRATION_CONFIG = {
  // Selector del contenedor donde se montará el modo inmersivo
  containerSelector: 'body',
  
  // Botón para activar modo inmersivo
  buttonId: 'immersiveModeBtn',
  
  // Clases CSS para el botón
  buttonClasses: ['immersive-mode-trigger'],
  
  // Posición del botón: 'header', 'sidebar', 'floating'
  buttonPosition: 'header',
};

// Estado de la integración - usar window para persistencia entre hot-reloads
window.immersiveIntegrationState = window.immersiveIntegrationState || {
  buttonCreated: false,
  immersiveActive: false,
  deviceChecked: false,
  initialized: false,
};

const integrationState = window.immersiveIntegrationState;

/**
 * Crear el botón para activar modo inmersivo
 */
const createImmersiveButton = async () => {
  // Evitar crear múltiples botones
  if (integrationState.buttonCreated) return;
  
  // Verificar si ya existe un botón con el mismo ID
  const existingButton = document.getElementById(INTEGRATION_CONFIG.buttonId);
  if (existingButton) {
    console.log('[Integration] Botón ya existe, no se crea duplicado');
    integrationState.buttonCreated = true;
    return;
  }
  
  // Verificar si es Admin/Ally (solo ellos ven este botón)
  const hasFreeAccess = await checkUserFreeAccess();
  
  // Si no es Admin/Ally, no crear el botón (el globo terráqueo es para todos)
  if (!hasFreeAccess) {
    console.log('[Integration] Usuario no es Admin/Ally - No se crea botón de texto');
    integrationState.buttonCreated = true;
    return;
  }
  
  const button = document.createElement('button');
  button.id = INTEGRATION_CONFIG.buttonId;
  button.className = INTEGRATION_CONFIG.buttonClasses.join(' ');
  
  // Botón simple sin badge para Admin/Ally
  button.innerHTML = `
    <span class="immersive-icon">🌌</span>
    <span class="immersive-text">Modo Inmersivo</span>
  `;
  button.title = 'Experimenta PROVIWEB en 3D';
  
  // Estilos inline para el botón (se pueden sobreescribir con CSS)
  button.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(0,123,255,0.2) 100%);
    border: 1px solid rgba(168,85,247,0.5);
    border-radius: 12px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  `;
  
  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(0,123,255,0.4) 100%)';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 4px 20px rgba(168,85,247,0.3)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(0,123,255,0.2) 100%)';
    button.style.transform = '';
    button.style.boxShadow = '';
  });
  
  // Click handler
  button.addEventListener('click', handleImmersiveClick);
  
  // Insertar según la posición configurada
  insertButton(button);
  
  integrationState.buttonCreated = true;
};

/**
 * Insertar el botón en la posición correcta
 */
const insertButton = (button) => {
  const { buttonPosition } = INTEGRATION_CONFIG;
  
  switch (buttonPosition) {
    case 'header':
      const header = document.querySelector('.header .nav-icons');
      if (header) {
        header.insertBefore(button, header.firstChild);
        return;
      }
      break;
      
    case 'sidebar':
      const sidebar = document.querySelector('.sidebar-left');
      if (sidebar) {
        const firstWidget = sidebar.querySelector('.widget');
        if (firstWidget) {
          const buttonContainer = document.createElement('div');
          buttonContainer.className = 'widget';
          buttonContainer.style.padding = '16px';
          buttonContainer.appendChild(button);
          sidebar.insertBefore(buttonContainer, firstWidget);
          return;
        }
      }
      break;
      
    case 'floating':
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.right = '20px';
      button.style.zIndex = '1000';
      document.body.appendChild(button);
      return;
  }
  
  // Fallback: agregar al body
  document.body.appendChild(button);
};

/**
 * Manejar click en el botón de modo inmersivo
 */
const handleImmersiveClick = async () => {
  // Verificar capacidad del dispositivo
  if (!integrationState.deviceChecked) {
    const capabilities = await detectDeviceCapabilities();
    integrationState.deviceChecked = true;
    
    if (!capabilities.canRunImmersive) {
      // Mostrar notificación de fallback
      showDeviceWarning();
      return;
    }
  }
  
  // Iniciar modo inmersivo
  try {
    const immersive = await startImmersiveMode(null, {
      onExitToClassic: () => {
        integrationState.immersiveActive = false;
        // Restaurar UI clásica
        document.body.classList.remove('immersive-active');
      },
    });
    
    if (immersive) {
      integrationState.immersiveActive = true;
      document.body.classList.add('immersive-active');
    }
  } catch (error) {
    console.error('[Integration] Error iniciando modo inmersivo:', error);
    alert('No se pudo iniciar el modo inmersivo. Por favor intenta nuevamente.');
  }
};

/**
 * Mostrar advertencia de dispositivo no compatible
 */
const showDeviceWarning = () => {
  const warning = document.createElement('div');
  warning.className = 'immersive-device-warning';
  warning.innerHTML = `
    <div class="immersive-warning-content">
      <span class="warning-icon">⚠️</span>
      <h3>Dispositivo no compatible</h3>
      <p>Tu dispositivo no cumple con los requisitos mínimos para el modo inmersivo.</p>
      <button class="immersive-warning-close">Entendido</button>
    </div>
  `;
  
  warning.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  document.body.appendChild(warning);
  
  warning.querySelector('.immersive-warning-close').addEventListener('click', () => {
    warning.remove();
  });
};

/**
 * Agregar estilos CSS para la integración
 */
const addIntegrationStyles = () => {
  // Verificar si los estilos ya existen
  if (document.getElementById('immersive-integration-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'immersive-integration-styles';
  style.textContent = `
    /* Botón del modo inmersivo */
    .immersive-mode-trigger {
      animation: immersivePulse 2s infinite;
    }
    
    @keyframes immersivePulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(168, 85, 247, 0);
      }
    }
    
    .immersive-mode-trigger:hover {
      animation: none;
    }
    
    .immersive-icon {
      font-size: 18px;
    }
    
    .immersive-premium-badge {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      color: #000;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }
    
    /* Estado activo */
    body.immersive-active .main-container,
    body.immersive-active .header {
      display: none !important;
    }
    
    /* Advertencia de dispositivo */
    .immersive-device-warning .immersive-warning-content {
      background: linear-gradient(135deg, #1a1a2e 0%, #0f0f13 100%);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
    }
    
    .immersive-device-warning .warning-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .immersive-device-warning h3 {
      color: white;
      margin: 0 0 12px;
      font-size: 20px;
    }
    
    .immersive-device-warning p {
      color: #a0a0b0;
      margin-bottom: 24px;
    }
    
    .immersive-warning-close {
      padding: 12px 24px;
      background: linear-gradient(135deg, #a855f7 0%, #007BFF 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.3s;
    }
    
    .immersive-warning-close:hover {
      transform: translateY(-2px);
    }
  `;
  
  document.head.appendChild(style);
};

/**
 * Inicializar la integración
 */
export const initImmersiveIntegration = async (options = {}) => {
  // Evitar inicialización múltiple
  if (integrationState.initialized) {
    console.log('[Integration] Ya inicializado, ignorando llamada duplicada');
    return;
  }
  integrationState.initialized = true;
  
  // Fusionar opciones
  Object.assign(INTEGRATION_CONFIG, options);
  
  // Agregar estilos (solo una vez)
  if (!document.getElementById('immersive-integration-styles')) {
    addIntegrationStyles();
  }
  
  // Crear botón cuando el DOM esté listo
  const initButton = async () => {
    try {
      await createImmersiveButton();
    } catch (error) {
      console.error('[Integration] Error creando botón:', error);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButton);
  } else {
    await initButton();
  }
  
  // Escuchar cambios de estado de pago
  window.addEventListener('proviweb:immersive:premium-activated', () => {
    const button = document.getElementById(INTEGRATION_CONFIG.buttonId);
    if (button) {
      const badge = button.querySelector('.immersive-premium-badge');
      if (badge) {
        badge.textContent = 'ACTIVO';
        badge.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
      }
    }
  });
};

// Auto-inicializar si está en modo standalone - solo una vez
if (typeof window !== 'undefined' && !window.immersiveIntegrationAutoInit) {
  window.immersiveIntegrationAutoInit = true;
  
  // Verificar si estamos en home.html
  if (window.location.pathname.includes('home.html')) {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initImmersiveIntegration();
      });
    } else {
      initImmersiveIntegration();
    }
  }
}

export default initImmersiveIntegration;
