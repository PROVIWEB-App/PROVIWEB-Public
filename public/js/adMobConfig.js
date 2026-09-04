/**
 * PROVIWEB - AdMob Configuration
 * Google Publisher ID: ca-pub-3226785451713391
 * 
 * IMPORTANTE: Reemplaza los Ad Unit IDs con tus IDs reales de Google AdMob Console
 * Los IDs actuales son de PRUEBA y solo funcionan en desarrollo/localhost
 */

const ADMOB_CONFIG = {
  // Google Publisher ID
  publisherId: 'ca-pub-3226785451713391',
  
  // Google App ID (para mobile/apps)
  appId: 'ca-app-pub-3226785451713391~8260100091',
  
  // Ad Unit IDs - REEMPLAZA CON TUS IDS REALES DE ADMOB
  // Formato: ca-app-pub-[publisherId]/[adUnitId]
  adUnits: {
    // Display Banner - Inicio/Home
    displayBanner: 'ca-app-pub-3226785451713391/1635127782', // REAL - Banner
    
    // Display Banner - Perfiles
    profileBanner: 'ca-app-pub-3226785451713391/1635127782', // REAL - Banner
    
    // Interstitial - Entre navegaciones
    interstitial: 'ca-app-pub-3226785451713391/1635127782', // REAL - Banner (adaptable)
    
    // Rewarded Video - Premios
    rewardedVideo: 'ca-app-pub-3226785451713391/2696928018', // REAL - Recompensado
    
    // Native Ads - Recomendaciones
    nativeAds: 'ca-app-pub-3226785451713391/9070764674', // REAL - Nativo Avanzado
  },
  
  // Configuración de Ad Sense
  adsenseSlots: {
    homeDisplayAd: '1234567890', // REEMPLAZAR con tu Slot de AdSense
    profileAd: '0987654321',      // REEMPLAZAR con tu Slot de AdSense
  },
  
  // Frecuencia de anuncios
  frequency: {
    displayBannerInterval: 3000, // milisegundos entre anuncios display
    interstitialInterval: 60000, // mostrar intersticial cada 60 segundos
    rewardedInterval: 120000,    // mostrar video recompensado cada 2 minutos
  },
  
  // Categorías bloqueadas (opcional)
  blockedCategories: [
    // Agregar categorías que no quieres que se muestren
    // 'gambling',
    // 'alcohol',
  ],
};

/**
 * Funciones helper para AdMob
 */
window.AdMobHelper = {
  /**
   * Cargar y mostrar un anuncio display
   * @param {string} containerId - ID del elemento donde mostrar el anuncio
   * @param {string} adUnitType - Tipo de ad unit: 'displayBanner', 'profileBanner', etc.
   */
  loadDisplayAd: function(containerId, adUnitType = 'displayBanner') {
    const adSlot = ADMOB_CONFIG.adUnits[adUnitType] || ADMOB_CONFIG.adUnits.displayBanner;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Contenedor de anuncio no encontrado: ${containerId}`);
      return;
    }
    
    // Crear elemento de anuncio
    const adElement = document.createElement('ins');
    adElement.className = 'adsbygoogle';
    adElement.style.display = 'block';
    adElement.style.height = '250px';
    adElement.setAttribute('data-ad-client', ADMOB_CONFIG.publisherId);
    adElement.setAttribute('data-ad-slot', adSlot);
    adElement.setAttribute('data-ad-format', 'auto');
    adElement.setAttribute('data-full-width-responsive', 'true');
    
    container.appendChild(adElement);
    
    // Empujar el anuncio a Google Ads
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      (adsbygoogle = window.adsbygoogle || []).push({});
    }
  },
  
  /**
   * Mostrar anuncio intersticial
   */
  showInterstitialAd: function() {
    if (typeof adsbygoogle !== 'undefined') {
      adsbygoogle.push({
        google_ad_client: ADMOB_CONFIG.publisherId,
        enable_page_level_ads: true
      });
    }
  },
  
  /**
   * Validar que los Ad Unit IDs han sido reemplazados
   * @returns {boolean} true si está configurado correctamente
   */
  isConfigured: function() {
    const defaultSlot = '6062513051';
    return !ADMOB_CONFIG.adUnits.displayBanner.includes(defaultSlot);
  },
  
  /**
   * Obtener configuración actual
   */
  getConfig: function() {
    return ADMOB_CONFIG;
  },
  
  /**
   * Mostrar aviso si no está configurado
   */
  checkConfiguration: function() {
    if (!this.isConfigured()) {
      console.warn(
        '%c⚠️ AdMob No Configurado ⚠️',
        'color: #ff6b6b; font-size: 14px; font-weight: bold;'
      );
      console.warn(
        '%cDebes reemplazar los Ad Unit IDs en public/js/adMobConfig.js con tus IDs reales de Google AdMob Console',
        'color: #ffa500; font-size: 12px;'
      );
      console.log('📋 Pasos:');
      console.log('1. Ve a https://admob.google.com');
      console.log('2. Crea ad units para tu aplicación');
      console.log('3. Copia los Ad Unit IDs');
      console.log('4. Reemplaza los valores en ADMOB_CONFIG.adUnits');
      return false;
    }
    return true;
  },
};

// Ejecutar verificación al cargar el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AdMobHelper.checkConfiguration();
  });
} else {
  AdMobHelper.checkConfiguration();
}
