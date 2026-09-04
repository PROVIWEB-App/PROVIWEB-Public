/**
 * PROVIWEB - Sistema de Pagos PayPal
 * Integración para el modo inmersivo premium ($20 USD)
 * 
 * NOTA: Admins y Aliados tienen acceso libre sin pago
 */

import { IMMERSIVE_CONFIG, immersiveState } from '../config.js';
import { checkUserFreeAccess, hasFreeAccess, getUserAccessBadge } from '../utils/user-roles.js';

// Client ID de PayPal (sandbox para desarrollo, production para producción)
const PAYPAL_CONFIG = {
  // Reemplazar con tu Client ID de PayPal
  CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
  
  // URL del plan de suscripción (si usas suscripciones)
  PLAN_ID: null, // null para pago único
  
  // Moneda
  CURRENCY: IMMERSIVE_CONFIG.CURRENCY,
  
  // Precio
  AMOUNT: IMMERSIVE_CONFIG.PREMIUM_PRICE,
  
  // Descripción que aparece en el recibo de PayPal
  DESCRIPTION: IMMERSIVE_CONFIG.PRODUCT_DESCRIPTION,
};

// Estado del sistema de pagos
const paymentState = {
  isInitialized: false,
  isProcessing: false,
  paypalButtons: null,
};

/**
 * Inicializar el SDK de PayPal
 */
export const initPayPalSDK = async () => {
  if (paymentState.isInitialized) return true;
  
  return new Promise((resolve, reject) => {
    // Verificar si ya está cargado
    if (window.paypal) {
      paymentState.isInitialized = true;
      resolve(true);
      return;
    }
    
    // Crear script para cargar PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.CLIENT_ID}&currency=${PAYPAL_CONFIG.CURRENCY}&intent=capture`;
    script.async = true;
    
    script.onload = () => {
      paymentState.isInitialized = true;
      console.log('[PayPal] SDK cargado correctamente');
      resolve(true);
    };
    
    script.onerror = () => {
      console.error('[PayPal] Error cargando SDK');
      reject(new Error('No se pudo cargar PayPal SDK'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Crear botones de pago de PayPal
 * @param {HTMLElement} container - Elemento contenedor
 * @param {Function} onSuccess - Callback cuando el pago es exitoso
 * @param {Function} onError - Callback cuando hay error
 */
export const createPayPalButtons = (container, onSuccess, onError) => {
  if (!window.paypal) {
    console.error('[PayPal] SDK no está cargado');
    return;
  }
  
  // Limpiar botones anteriores
  container.innerHTML = '';
  
  paymentState.paypalButtons = window.paypal.Buttons({
    // Estilo de los botones
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'pill',
      label: 'pay',
      height: 45,
    },
    
    // Crear la orden de pago
    createOrder: (data, actions) => {
      paymentState.isProcessing = true;
      
      return actions.order.create({
        purchase_units: [{
          description: PAYPAL_CONFIG.DESCRIPTION,
          amount: {
            currency_code: PAYPAL_CONFIG.CURRENCY,
            value: PAYPAL_CONFIG.AMOUNT.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: PAYPAL_CONFIG.CURRENCY,
                value: PAYPAL_CONFIG.AMOUNT.toFixed(2),
              },
            },
          },
          items: [{
            name: IMMERSIVE_CONFIG.PRODUCT_NAME,
            description: PAYPAL_CONFIG.DESCRIPTION,
            unit_amount: {
              currency_code: PAYPAL_CONFIG.CURRENCY,
              value: PAYPAL_CONFIG.AMOUNT.toFixed(2),
            },
            quantity: '1',
            category: 'DIGITAL_GOODS',
          }],
        }],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      });
    },
    
    // Pago aprobado
    onApprove: async (data, actions) => {
      try {
        const order = await actions.order.capture();
        console.log('[PayPal] Pago completado:', order);
        
        // Guardar información del pago
        const paymentInfo = {
          orderId: order.id,
          status: order.status,
          amount: order.purchase_units[0].amount.value,
          currency: order.purchase_units[0].amount.currency_code,
          payerEmail: order.payer.email_address,
          payerName: `${order.payer.name.given_name} ${order.payer.name.surname}`,
          timestamp: new Date().toISOString(),
        };
        
        // Guardar en localStorage y Firebase
        await savePaymentInfo(paymentInfo);
        
        // Activar modo premium
        activatePremiumAccess(paymentInfo);
        
        paymentState.isProcessing = false;
        
        if (onSuccess) {
          onSuccess(paymentInfo);
        }
      } catch (error) {
        console.error('[PayPal] Error capturando pago:', error);
        paymentState.isProcessing = false;
        if (onError) onError(error);
      }
    },
    
    // Pago cancelado
    onCancel: (data) => {
      console.log('[PayPal] Pago cancelado por el usuario:', data);
      paymentState.isProcessing = false;
    },
    
    // Error en el pago
    onError: (err) => {
      console.error('[PayPal] Error en el pago:', err);
      paymentState.isProcessing = false;
      if (onError) onError(err);
    },
  });
  
  paymentState.paypalButtons.render(container);
};

/**
 * Guardar información del pago
 */
const savePaymentInfo = async (paymentInfo) => {
  // Guardar en localStorage
  localStorage.setItem('proviweb_immersive_payment', JSON.stringify(paymentInfo));
  localStorage.setItem('proviweb_immersive_premium', 'true');
  localStorage.setItem('proviweb_immersive_activated', Date.now().toString());
  
  // Aquí puedes agregar la lógica para guardar en Firebase
  // const userId = getCurrentUserId();
  // await firebase.database().ref(`users/${userId}/immersive`).set({
  //   isPremium: true,
  //   paymentInfo,
  //   activatedAt: Date.now(),
  // });
};

/**
 * Activar acceso premium
 */
const activatePremiumAccess = (paymentInfo) => {
  immersiveState.user.hasPaid = true;
  immersiveState.isPremium = true;
  immersiveState.user.licenseExpiry = null; // Permanente
  
  // Emitir evento
  window.dispatchEvent(new CustomEvent('proviweb:immersive:premium-activated', {
    detail: paymentInfo,
  }));
};

/**
 * Verificar si el usuario tiene acceso premium
 * NOTA: Admins y Aliados tienen acceso libre
 */
export const checkPremiumAccess = async () => {
  // Primero verificar si tiene acceso libre por rol (Admin/Aliado)
  const hasFreeRoleAccess = await checkUserFreeAccess();
  if (hasFreeRoleAccess) {
    console.log('[PayPal] Acceso libre por rol (Admin/Aliado)');
    immersiveState.user.hasPaid = true;
    immersiveState.isPremium = true;
    immersiveState.user.isFreeAccess = true;
    return true;
  }
  
  // Verificar localStorage (usuarios que pagaron)
  const isPremium = localStorage.getItem('proviweb_immersive_premium') === 'true';
  const paymentInfo = localStorage.getItem('proviweb_immersive_payment');
  
  if (isPremium && paymentInfo) {
    immersiveState.user.hasPaid = true;
    immersiveState.isPremium = true;
    
    try {
      const parsed = JSON.parse(paymentInfo);
      immersiveState.user.licenseExpiry = parsed.licenseExpiry || null;
    } catch (e) {
      console.error('Error parsing payment info:', e);
    }
    
    return true;
  }
  
  return false;
};

/**
 * Mostrar modal de compra del modo inmersivo
 * O mensaje de acceso libre para Admins/Aliados
 */
export const showPremiumModal = async (container) => {
  // Primero verificar si tiene acceso libre
  const hasFreeAccess = await checkUserFreeAccess();
  
  if (hasFreeAccess) {
    // Mostrar modal de acceso libre para Admin/Aliado
    showFreeAccessModal(container);
    return;
  }
  
  // Modal de compra para usuarios normales
  const modalHTML = `
    <div id="immersivePremiumModal" class="immersive-premium-modal">
      <div class="immersive-premium-content">
        <button class="immersive-premium-close" id="closePremiumModal">&times;</button>
        
        <div class="immersive-premium-header">
          <div class="immersive-premium-icon">🌌</div>
          <h2>Modo Experiencia Inmersiva</h2>
          <p class="immersive-premium-subtitle">Navega PROVIWEB como nunca antes</p>
        </div>
        
        <div class="immersive-premium-features">
          <div class="immersive-feature">
            <span class="immersive-feature-icon">🎮</span>
            <span>Mundo 3D explorativo tipo Journey</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">✨</span>
            <span>Transiciones cinematográficas</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">🎨</span>
            <span>Zonas temáticas únicas</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">⚡</span>
            <span>Navegación fluida sin recargas</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">🔮</span>
            <span>Atmósfera atmosférica dinámica</span>
          </div>
        </div>
        
        <div class="immersive-premium-pricing">
          <div class="immersive-price">
            <span class="immersive-currency">$</span>
            <span class="immersive-amount">${PAYPAL_CONFIG.AMOUNT}</span>
            <span class="immersive-period">USD</span>
          </div>
          <p class="immersive-price-note">Pago único • Acceso permanente</p>
        </div>
        
        <div id="paypal-button-container"></div>
        
        <p class="immersive-secure-note">
          <span>🔒</span> Pago seguro procesado por PayPal
        </p>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', modalHTML);
  
  // Inicializar PayPal
  const paypalContainer = document.getElementById('paypal-button-container');
  if (paypalContainer) {
    initPayPalSDK().then(() => {
      createPayPalButtons(
        paypalContainer,
        (paymentInfo) => {
          // Éxito
          showSuccessMessage(container);
          setTimeout(() => {
            hidePremiumModal();
            window.dispatchEvent(new CustomEvent('proviweb:immersive:start'));
          }, 2000);
        },
        (error) => {
          // Error
          showErrorMessage(container, error.message);
        }
      );
    });
  }
  
  // Event listeners
  document.getElementById('closePremiumModal')?.addEventListener('click', hidePremiumModal);
};

/**
 * Mostrar modal de acceso libre para Admin/Aliado
 */
const showFreeAccessModal = (container) => {
  const badge = getUserAccessBadge();
  const badgeHTML = badge ? `
    <div class="immersive-free-badge" style="
      background: ${badge.color}20;
      border: 2px solid ${badge.color};
      color: ${badge.color};
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    ">
      <span>${badge.icon}</span>
      <span>${badge.text}</span>
    </div>
  ` : '';
  
  const modalHTML = `
    <div id="immersivePremiumModal" class="immersive-premium-modal">
      <div class="immersive-premium-content">
        <button class="immersive-premium-close" id="closePremiumModal">&times;</button>
        
        <div class="immersive-premium-header">
          <div class="immersive-premium-icon">🌌</div>
          ${badgeHTML}
          <h2>Acceso VIP Libre</h2>
          <p class="immersive-premium-subtitle">Como ${badge?.text || 'miembro especial'}, tienes acceso gratuito al modo inmersivo</p>
        </div>
        
        <div class="immersive-premium-features">
          <div class="immersive-feature">
            <span class="immersive-feature-icon">🎮</span>
            <span>Mundo 3D explorativo tipo Journey</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">✨</span>
            <span>Transiciones cinematográficas</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">🎨</span>
            <span>Zonas temáticas únicas</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">⚡</span>
            <span>Navegación fluida sin recargas</span>
          </div>
          <div class="immersive-feature">
            <span class="immersive-feature-icon">🔮</span>
            <span>Atmósfera atmosférica dinámica</span>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(0,123,255,0.2) 100%);
          border: 1px solid rgba(168,85,247,0.5);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 12px;">🎁</div>
          <h3 style="margin: 0 0 8px; color: white;">¡Acceso Complementario!</h3>
          <p style="margin: 0; color: #a0a0b0; font-size: 14px;">
            Valorado en <strong style="color: #a855f7;">$${PAYPAL_CONFIG.AMOUNT} USD</strong> • Acceso permanente activado
          </p>
        </div>
        
        <button id="startImmersiveFreeBtn" style="
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #a855f7 0%, #007BFF 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        ">
          🚀 Iniciar Modo Inmersivo
        </button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', modalHTML);
  
  // Event listeners
  document.getElementById('closePremiumModal')?.addEventListener('click', hidePremiumModal);
  document.getElementById('startImmersiveFreeBtn')?.addEventListener('click', () => {
    hidePremiumModal();
    window.dispatchEvent(new CustomEvent('proviweb:immersive:start'));
  });
};

/**
 * Mostrar mensaje de éxito
 */
const showSuccessMessage = (container) => {
  const modal = document.getElementById('immersivePremiumModal');
  if (modal) {
    modal.querySelector('.immersive-premium-content').innerHTML = `
      <div class="immersive-success">
        <div class="immersive-success-icon">🎉</div>
        <h2>¡Bienvenido al modo inmersivo!</h2>
        <p>Tu pago ha sido procesado correctamente.</p>
        <p class="immersive-loading">Preparando tu experiencia...</p>
      </div>
    `;
  }
};

/**
 * Mostrar mensaje de error
 */
const showErrorMessage = (container, message) => {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'immersive-error-message';
  errorDiv.textContent = `Error: ${message}. Intenta nuevamente.`;
  
  const paypalContainer = document.getElementById('paypal-button-container');
  if (paypalContainer) {
    paypalContainer.insertAdjacentElement('beforebegin', errorDiv);
  }
};

/**
 * Ocultar modal de premium
 */
export const hidePremiumModal = () => {
  const modal = document.getElementById('immersivePremiumModal');
  if (modal) {
    modal.remove();
  }
};

/**
 * Cerrar sesión - limpiar datos premium (opcional)
 */
export const logoutPremium = () => {
  // Mantener el acceso premium vinculado a la cuenta, no a la sesión
  // Pero podrías querer limpiar estado temporal
  immersiveState.isPremium = false;
  immersiveState.user.hasPaid = false;
};

// Exportar configuración de PayPal
export { PAYPAL_CONFIG };
