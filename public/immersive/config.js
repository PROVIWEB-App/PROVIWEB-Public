/**
 * PROVIWEB - Modo Experiencia Inmersiva
 * Configuración global del sistema 3D
 */

export const IMMERSIVE_CONFIG = {
  // Versión del modo inmersivo
  VERSION: '1.0.0',
  
  // Precio en USD para activar modo premium
  PREMIUM_PRICE: 20,
  
  // Currency para PayPal
  CURRENCY: 'USD',
  
  // Nombre del producto
  PRODUCT_NAME: 'PROVIWEB Modo Inmersivo',
  
  // Descripción del producto
  PRODUCT_DESCRIPTION: 'Experiencia de navegación 3D inmersiva tipo Journey para PROVIWEB',
  
  // Duración de la licencia en días (0 = permanente)
  LICENSE_DURATION_DAYS: 0,
  
  // Roles que tienen acceso libre al modo inmersivo
  FREE_ACCESS_ROLES: {
    // Por accountType en Firebase
    accountTypes: ['ally', 'admin', 'partner'],
    
    // Por organización
    organizations: ['Aliado', 'Admin', 'PROVIWEB', 'Partner'],
    
    // Por rol específico
    roles: ['admin', 'moderator', 'ally', 'partner'],
    
    // Por verificación especial
    verifiedTypes: ['admin', 'ally'],
  },
  
  // Configuración de renderizado WebGL
  renderer: {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: false,
  },
  
  // Configuración de cámara
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    initialPosition: [0, 5, 20],
    lookAt: [0, 0, 0],
  },
  
  // Configuración de controles de cámara
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enablePan: false,
    enableRotate: true,
    minDistance: 5,
    maxDistance: 50,
    maxPolarAngle: Math.PI / 2 - 0.1, // No permitir ir bajo el suelo
  },
  
  // Configuración de animaciones GSAP
  animation: {
    cameraTransitionDuration: 2,
    cameraEase: 'power3.inOut',
    zoneActivationDelay: 0.3,
  },
  
  // Configuración de zonas
  zones: {
    spacing: 30, // Distancia entre zonas
    layout: 'linear', // 'linear', 'grid', 'circular'
    groundLevel: 0,
    floatingHeight: 2,
  },
  
  // Configuración de partículas atmosféricas (efecto Journey)
  particles: {
    count: 200,
    size: 0.05,
    color: '#a855f7',
    opacity: 0.6,
    windSpeed: 0.5,
  },
  
  // Configuración de niebla atmosférica
  fog: {
    color: '#0f0f13',
    near: 10,
    far: 80,
    density: 0.02,
  },
  
  // Configuración de iluminación
  lighting: {
    ambient: {
      color: '#404040',
      intensity: 0.5,
    },
    directional: {
      color: '#ffffff',
      intensity: 1,
      position: [10, 20, 10],
    },
    pointLights: [
      { color: '#a855f7', intensity: 0.8, position: [0, 5, 0], distance: 30 },
      { color: '#007BFF', intensity: 0.6, position: [20, 5, 0], distance: 25 },
      { color: '#f43f5e', intensity: 0.6, position: [-20, 5, 0], distance: 25 },
    ],
  },
  
  // Configuración de LOD (Level of Detail)
  lod: {
    enabled: true,
    distances: [10, 30, 60],
  },
  
  // Configuración de lazy loading
  lazyLoading: {
    enabled: true,
    preloadDistance: 50,
    unloadDistance: 100,
  },
  
  // Configuración de fallback para dispositivos de baja capacidad
  fallback: {
    // Detectar si el dispositivo es de baja capacidad
    lowPerformanceThreshold: 30, // FPS mínimo esperado
    mobileDisableParticles: true,
    mobileReduceQuality: true,
    maxMobileParticles: 50,
  },
  
  // Límites de dispositivos
  limits: {
    maxTextureSize: 2048,
    maxDrawCalls: 100,
    maxVertices: 50000,
  },
  
  // Zonas disponibles en el mundo 3D - POSICIONES AMPLIADAS
  // Cada zona corresponde a una sección del home.html
  availableZones: [
    {
      id: 'hub',
      name: 'Centro Creativo',
      icon: '🏛️',
      description: 'Punto central de navegación',
      position: [0, 0, 0],
      color: '#a855f7',
      sections: ['home'],
    },
    {
      id: 'feed',
      name: 'Valle del Feed',
      icon: '📝',
      description: 'Posts y reels de la comunidad',
      position: [0, 0, -120],
      color: '#007BFF',
      sections: ['posts', 'reels'],
    },
    {
      id: 'music',
      name: 'Armonía Musical',
      icon: '🎵',
      description: 'Descubre música y artistas',
      position: [120, 0, 0],
      color: '#f43f5e',
      sections: ['music', 'topPlays', 'topLikes', 'featuredMusic'],
    },
    {
      id: 'opportunities',
      name: 'Horizonte de Oportunidades',
      icon: '💼',
      description: 'Convocatorias y colaboraciones',
      position: [-120, 0, 0],
      color: '#06b6d4',
      sections: ['opportunities', 'collaborations'],
    },
    {
      id: 'social',
      name: 'Puente Social',
      icon: '👥',
      description: 'Contactos y comunidad',
      position: [0, 0, 120],
      color: '#8b5cf6',
      sections: ['contacts', 'chat'],
    },
    {
      id: 'art',
      name: 'Galería Etereal',
      icon: '🎨',
      description: 'Arte y creatividad visual',
      position: [120, 0, -120],
      color: '#ec4899',
      sections: ['art', 'gallery'],
    },
    {
      id: 'learn',
      name: 'Monte del Conocimiento',
      icon: '📚',
      description: 'Tutoriales y educación',
      position: [-120, 0, -120],
      color: '#10b981',
      sections: ['tutorials', 'learn'],
    },
    {
      id: 'market',
      name: 'Bazar Creativo',
      icon: '🛒',
      description: 'Marketplace de instrumentos',
      position: [-120, 0, 120],
      color: '#f59e0b',
      sections: ['marketplace'],
    },
    {
      id: 'events',
      name: 'Plaza de Eventos',
      icon: '📅',
      description: 'Eventos y transmisiones en vivo',
      position: [120, 0, 120],
      color: '#6366f1',
      sections: ['events', 'live'],
    },
  ],
  
  // Configuración de SEO
  seo: {
    // Meta tags que se mantienen visibles para SEO
    preserveMetaTags: true,
    // URL canónica para modo inmersivo
    canonicalUrl: '/home.html?mode=immersive',
  },
};

// Estado global del modo inmersivo
export const immersiveState = {
  isActive: false,
  isPremium: false,
  currentZone: null,
  previousZone: null,
  isTransitioning: false,
  performance: {
    fps: 60,
    quality: 'high', // 'high', 'medium', 'low'
  },
  user: {
    hasPaid: false,
    licenseExpiry: null,
  },
};

// Utility: Detectar si es dispositivo móvil
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Utility: Detectar soporte WebGL
export const hasWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

// Utility: Detectar capacidad de rendimiento
export const detectPerformanceCapability = () => {
  const isMobileDevice = isMobile();
  const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  if (isMobileDevice && (hasLowMemory || hasLowCores)) {
    return 'low';
  } else if (isMobileDevice || hasLowMemory) {
    return 'medium';
  }
  return 'high';
};

export default IMMERSIVE_CONFIG;
