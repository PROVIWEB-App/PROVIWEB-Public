/**
 * Función para mostrar un card flotante indicando que una funcionalidad no está disponible
 * @param {string} message - Mensaje personalizado (opcional)
 */
function showNotAvailable(message = 'Esta función aún no está disponible') {
    // Crear overlay si no existe
    let overlay = document.getElementById('notAvailableOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'notAvailableOverlay';
        overlay.className = 'not-available-card-overlay';
        document.body.appendChild(overlay);
    }

    // Crear card si no existe
    let card = document.getElementById('notAvailableCard');
    if (!card) {
        card = document.createElement('div');
        card.id = 'notAvailableCard';
        card.className = 'not-available-card';
        card.innerHTML = `
            <div class="not-available-card-icon">🚧</div>
            <div class="not-available-card-title">Función No Disponible</div>
            <div class="not-available-card-message">${message}</div>
            <button class="not-available-card-button" onclick="closeNotAvailable()">Entendido</button>
        `;
        document.body.appendChild(card);
    } else {
        // Actualizar mensaje si el card ya existe
        const messageEl = card.querySelector('.not-available-card-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    // Mostrar overlay y card
    overlay.classList.add('active');
    card.classList.add('active');

    // Cerrar al hacer click en el overlay
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            closeNotAvailable();
        }
    };

    // Cerrar con tecla ESC
    const handleEsc = function(e) {
        if (e.key === 'Escape') {
            closeNotAvailable();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

/**
 * Función para cerrar el card flotante
 */
function closeNotAvailable() {
    const overlay = document.getElementById('notAvailableOverlay');
    const card = document.getElementById('notAvailableCard');
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    if (card) {
        card.classList.remove('active');
        // Remover después de la animación
        setTimeout(() => {
            if (overlay && !overlay.classList.contains('active')) {
                overlay.remove();
            }
            if (card && !card.classList.contains('active')) {
                card.remove();
            }
        }, 300);
    }
}

// Mantener compatibilidad con handlers inline cuando el script se carga como módulo.
if (typeof window !== 'undefined') {
    window.showNotAvailable = showNotAvailable;
    window.closeNotAvailable = closeNotAvailable;
}
