/**
 * PROVIWEB - Live Music Venue Module
 * Componentes UI reutilizables para venues
 */

// ============================================
// COMPONENTES DE TARJETAS
// ============================================

/**
 * Crear tarjeta de venue para listados
 * @param {Object} venue 
 * @param {Object} options 
 * @returns {HTMLElement}
 */
export function createVenueCard(venue, options = {}) {
    const {
        showRating = true,
        showLocation = true,
        showFollowers = true,
        compact = false,
        onClick = null
    } = options;

    const card = document.createElement('div');
    card.className = 'venue-card' + (compact ? ' venue-card--compact' : '');
    
    const stats = venue.stats || {};
    const location = venue.location || {};
    
    card.innerHTML = `
        <div class="venue-card__image">
            <img src="${venue.profileImage || 'assets/venue-default.png'}" 
                 alt="${venue.name}" 
                 loading="lazy">
            ${venue.plan?.type !== 'free' ? 
                `<span class="venue-card__badge venue-card__badge--${venue.plan.type}">
                    ${venue.plan.type === 'atlas' ? '★ ATLAS' : 'PRO'}
                </span>` : ''}
            ${venue.isVerified ? 
                `<span class="venue-card__verified" title="Verificado">✓</span>` : ''}
        </div>
        <div class="venue-card__content">
            <h3 class="venue-card__name">${venue.name}</h3>
            ${showLocation && location.city ? 
                `<p class="venue-card__location">📍 ${location.city}${location.neighborhood ? ', ' + location.neighborhood : ''}</p>` : ''}
            ${venue.venueType ? 
                `<span class="venue-card__type">${getVenueTypeLabel(venue.venueType)}</span>` : ''}
            <div class="venue-card__meta">
                ${showRating && stats.averageRating ? 
                    `<span class="venue-card__rating">⭐ ${stats.averageRating.toFixed(1)}</span>` : ''}
                ${showFollowers && stats.followerCount ? 
                    `<span class="venue-card__followers">👥 ${formatNumber(stats.followerCount)}</span>` : ''}
            </div>
            ${venue.musicGenres?.length ? 
                `<div class="venue-card__genres">
                    ${venue.musicGenres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>` : ''}
        </div>
    `;

    if (onClick) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => onClick(venue));
    }

    return card;
}

/**
 * Crear tarjeta de evento
 * @param {Object} event 
 * @param {Object} options 
 * @returns {HTMLElement}
 */
export function createEventCard(event, options = {}) {
    const { showVenue = false, compact = false, onClick = null } = options;
    
    const card = document.createElement('div');
    card.className = 'event-card' + (compact ? ' event-card--compact' : '');
    
    const date = event.startDate ? new Date(event.startDate) : null;
    const isPast = date && date < new Date();
    
    card.innerHTML = `
        <div class="event-card__date ${isPast ? 'event-card__date--past' : ''}">
            <span class="event-card__month">${date ? date.toLocaleDateString('es', { month: 'short' }).toUpperCase() : 'TBD'}</span>
            <span class="event-card__day">${date ? date.getDate() : '?'}</span>
        </div>
        <div class="event-card__content">
            <h4 class="event-card__title">${event.title || 'Evento sin título'}</h4>
            ${showVenue && event.venueName ? 
                `<p class="event-card__venue">🏢 ${event.venueName}</p>` : ''}
            ${event.startTime ? 
                `<p class="event-card__time">🕐 ${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</p>` : ''}
            ${event.artists?.length ? 
                `<div class="event-card__artists">
                    🎤 ${event.artists.map(a => a.artistName).join(', ')}
                </div>` : ''}
            ${event.isOpenCall ? 
                `<span class="event-card__opencode">🎵 Convocatoria abierta</span>` : ''}
        </div>
    `;

    if (onClick) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => onClick(event));
    }

    return card;
}

/**
 * Crear tarjeta de convocatoria
 * @param {Object} call 
 * @param {Object} options 
 * @returns {HTMLElement}
 */
export function createCallCard(call, options = {}) {
    const { showActions = true, onApply = null, onView = null } = options;
    
    const card = document.createElement('div');
    card.className = 'call-card';
    
    const deadline = call.applicationDeadline ? new Date(call.applicationDeadline) : null;
    const isClosed = call.status === 'closed' || call.status === 'filled' || 
                     (deadline && deadline < new Date());
    
    card.innerHTML = `
        <div class="call-card__header">
            <h4 class="call-card__title">${call.title}</h4>
            <span class="call-card__status call-card__status--${call.status}">
                ${getCallStatusLabel(call.status)}
            </span>
        </div>
        <div class="call-card__body">
            ${call.description ? 
                `<p class="call-card__description">${truncateText(call.description, 120)}</p>` : ''}
            <div class="call-card__details">
                ${call.instruments?.length ? 
                    `<span>🎸 ${call.instruments.join(', ')}</span>` : ''}
                ${call.payment?.type ? 
                    `<span>💰 ${getPaymentTypeLabel(call.payment.type)}${call.payment.amount ? ': $' + call.payment.amount : ''}</span>` : ''}
                ${deadline ? 
                    `<span>📅 Cierre: ${deadline.toLocaleDateString()}</span>` : ''}
            </div>
        </div>
        ${showActions ? `
            <div class="call-card__actions">
                <button class="btn btn--secondary" data-action="view">Ver detalles</button>
                ${!isClosed ? `
                    <button class="btn btn--primary" data-action="apply">Postularme</button>
                ` : ''}
            </div>
        ` : ''}
    `;

    if (showActions) {
        card.querySelector('[data-action="view"]')?.addEventListener('click', () => onView?.(call));
        card.querySelector('[data-action="apply"]')?.addEventListener('click', () => onApply?.(call));
    }

    return card;
}

/**
 * Crear componente de reseña
 * @param {Object} review 
 * @returns {HTMLElement}
 */
export function createReviewItem(review) {
    const item = document.createElement('div');
    item.className = 'review-item';
    
    const date = review.createdAt ? new Date(review.createdAt) : null;
    const ratings = review.ratings || {};
    
    item.innerHTML = `
        <div class="review-item__header">
            <div class="review-item__author">
                <img src="${review.authorImage || 'assets/avatar.png'}" alt="" class="review-item__avatar">
                <div>
                    <span class="review-item__name">${review.authorName || 'Usuario anónimo'}</span>
                    ${review.isVerified ? 
                        `<span class="review-item__verified" title="Experiencia verificada">✓ Verificado</span>` : ''}
                </div>
            </div>
            <div class="review-item__rating">
                ${'★'.repeat(Math.round(ratings.overall || 0))}${'☆'.repeat(5 - Math.round(ratings.overall || 0))}
                <span>${ratings.overall?.toFixed(1) || '-'}</span>
            </div>
        </div>
        <h5 class="review-item__title">${review.title || ''}</h5>
        <p class="review-item__comment">${review.comment || ''}</p>
        <div class="review-item__meta">
            <span>${date ? date.toLocaleDateString() : ''}</span>
            ${Object.entries(ratings).filter(([k]) => k !== 'overall').map(([key, value]) => 
                `<span class="review-item__detail">${getRatingLabel(key)}: ${value}</span>`
            ).join('')}
        </div>
    `;

    return item;
}

// ============================================
// COMPONENTES DE FORMULARIO
// ============================================

/**
 * Crear selector de horario semanal
 * @param {Object} currentSchedule 
 * @returns {HTMLElement}
 */
export function createScheduleSelector(currentSchedule = {}) {
    const container = document.createElement('div');
    container.className = 'schedule-selector';
    
    const days = [
        { key: 'monday', label: 'Lunes' },
        { key: 'tuesday', label: 'Martes' },
        { key: 'wednesday', label: 'Miércoles' },
        { key: 'thursday', label: 'Jueves' },
        { key: 'friday', label: 'Viernes' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ];
    
    container.innerHTML = `
        <h4 class="schedule-selector__title">Horario de operación</h4>
        ${days.map(day => {
            const schedule = currentSchedule[day.key] || {};
            return `
                <div class="schedule-selector__day" data-day="${day.key}">
                    <label class="schedule-selector__label">
                        <input type="checkbox" class="schedule-selector__active" 
                               ${schedule.open ? 'checked' : ''}>
                        <span>${day.label}</span>
                    </label>
                    <div class="schedule-selector__times" style="${schedule.open ? '' : 'display:none'}">
                        <input type="time" class="schedule-selector__open" 
                               value="${schedule.open || '18:00'}">
                        <span>a</span>
                        <input type="time" class="schedule-selector__close" 
                               value="${schedule.close || '02:00'}">
                        <label class="schedule-selector__music">
                            <input type="checkbox" class="schedule-selector__live-music"
                                   ${schedule.hasLiveMusic ? 'checked' : ''}>
                            <span>Música en vivo</span>
                        </label>
                    </div>
                </div>
            `;
        }).join('')}
    `;
    
    // Event listeners
    container.querySelectorAll('.schedule-selector__active').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const dayRow = e.target.closest('.schedule-selector__day');
            const timesDiv = dayRow.querySelector('.schedule-selector__times');
            timesDiv.style.display = e.target.checked ? 'flex' : 'none';
        });
    });
    
    return container;
}

/**
 * Obtener valor del selector de horario
 * @param {HTMLElement} container 
 * @returns {Object}
 */
export function getScheduleValue(container) {
    const schedule = {};
    
    container.querySelectorAll('.schedule-selector__day').forEach(dayRow => {
        const dayKey = dayRow.dataset.day;
        const isActive = dayRow.querySelector('.schedule-selector__active').checked;
        
        if (isActive) {
            schedule[dayKey] = {
                open: dayRow.querySelector('.schedule-selector__open').value,
                close: dayRow.querySelector('.schedule-selector__close').value,
                hasLiveMusic: dayRow.querySelector('.schedule-selector__live-music').checked
            };
        }
    });
    
    return schedule;
}

// ============================================
// COMPONENTES DE CALENDARIO
// ============================================

/**
 * Crear calendario de eventos
 * @param {Array} events 
 * @param {Object} options 
 * @returns {HTMLElement}
 */
export function createEventCalendar(events, options = {}) {
    const { onEventClick = null, onDateClick = null } = options;
    
    const container = document.createElement('div');
    container.className = 'event-calendar';
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Agrupar eventos por día
    const eventsByDay = {};
    events.forEach(event => {
        if (event.startDate) {
            const date = new Date(event.startDate);
            const day = date.getDate();
            if (!eventsByDay[day]) eventsByDay[day] = [];
            eventsByDay[day].push(event);
        }
    });
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let calendarHTML = `
        <div class="event-calendar__header">
            <button class="event-calendar__nav" data-nav="prev">‹</button>
            <h4 class="event-calendar__month">${monthNames[currentMonth]} ${currentYear}</h4>
            <button class="event-calendar__nav" data-nav="next">›</button>
        </div>
        <div class="event-calendar__grid">
            <div class="event-calendar__weekday">Dom</div>
            <div class="event-calendar__weekday">Lun</div>
            <div class="event-calendar__weekday">Mar</div>
            <div class="event-calendar__weekday">Mié</div>
            <div class="event-calendar__weekday">Jue</div>
            <div class="event-calendar__weekday">Vie</div>
            <div class="event-calendar__weekday">Sáb</div>
    `;
    
    // Días vacíos antes del primer día
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="event-calendar__day event-calendar__day--empty"></div>';
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const hasEvents = eventsByDay[day]?.length > 0;
        const isToday = day === currentDate.getDate();
        
        calendarHTML += `
            <div class="event-calendar__day ${isToday ? 'event-calendar__day--today' : ''} ${hasEvents ? 'event-calendar__day--events' : ''}"
                 data-day="${day}">
                <span class="event-calendar__day-number">${day}</span>
                ${hasEvents ? `<span class="event-calendar__event-dot"></span>` : ''}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    
    // Lista de eventos del mes
    if (events.length > 0) {
        calendarHTML += `
            <div class="event-calendar__events">
                <h5>Eventos este mes</h5>
                ${events.map(event => `
                    <div class="event-calendar__event-item" data-event-id="${event.eventId}">
                        <span class="event-calendar__event-date">
                            ${new Date(event.startDate).getDate()}
                        </span>
                        <span class="event-calendar__event-title">${event.title}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = calendarHTML;
    
    // Event listeners
    container.querySelectorAll('.event-calendar__day[data-day]').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            const day = parseInt(dayEl.dataset.day);
            onDateClick?.(new Date(currentYear, currentMonth, day));
        });
    });
    
    container.querySelectorAll('.event-calendar__event-item').forEach(eventEl => {
        eventEl.addEventListener('click', () => {
            const eventId = eventEl.dataset.eventId;
            const event = events.find(e => e.eventId === eventId);
            onEventClick?.(event);
        });
    });
    
    return container;
}

// ============================================
// UTILIDADES DE UI
// ============================================

/**
 * Mostrar modal
 * @param {Object} options 
 */
export function showModal(options = {}) {
    const { title, content, onClose = null, buttons = [] } = options;
    
    const modal = document.createElement('div');
    modal.className = 'modal modal--active';
    modal.innerHTML = `
        <div class="modal__overlay"></div>
        <div class="modal__container">
            <div class="modal__header">
                <h3 class="modal__title">${title || ''}</h3>
                <button class="modal__close">×</button>
            </div>
            <div class="modal__content">
                ${typeof content === 'string' ? content : ''}
            </div>
            ${buttons.length ? `
                <div class="modal__footer">
                    ${buttons.map(btn => `
                        <button class="btn btn--${btn.type || 'secondary'}" data-action="${btn.action}">
                            ${btn.label}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    if (typeof content === 'object') {
        modal.querySelector('.modal__content').appendChild(content);
    }
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
        onClose?.();
    };
    
    modal.querySelector('.modal__close').addEventListener('click', closeModal);
    modal.querySelector('.modal__overlay').addEventListener('click', closeModal);
    
    buttons.forEach(btn => {
        modal.querySelector(`[data-action="${btn.action}"]`)?.addEventListener('click', () => {
            btn.onClick?.();
            if (btn.closeOnClick !== false) closeModal();
        });
    });
    
    return { modal, close: closeModal };
}

/**
 * Mostrar toast/notificación
 * @param {string} message 
 * @param {string} type 
 * @param {number} duration 
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</span>
        <span class="toast__message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animación de entrada
    requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
    });
    
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Crear skeleton loader
 * @param {string} type 
 * @param {number} count 
 * @returns {HTMLElement}
 */
export function createSkeleton(type = 'card', count = 1) {
    const container = document.createElement('div');
    container.className = 'skeleton-container';
    
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton--${type}`;
        container.appendChild(skeleton);
    }
    
    return container;
}

// ============================================
// HELPERS DE TEXTO Y FORMATO
// ============================================

function getVenueTypeLabel(type) {
    const labels = {
        'bar': 'Bar',
        'restaurant': 'Restaurante',
        'taberna_mariachi': 'Taberna de Mariachi',
        'peña': 'Peña',
        'foro_cultural': 'Foro Cultural',
        'espacio_artistico': 'Espacio Artístico',
        'discoteca': 'Discoteca',
        'cafeteria': 'Cafetería',
        'hotel': 'Hotel',
        'centro_comercial': 'Centro Comercial',
        'sala_conciertos': 'Sala de Conciertos',
        'otro': 'Otro'
    };
    return labels[type] || type;
}

function getCallStatusLabel(status) {
    const labels = {
        'open': 'Abierta',
        'closed': 'Cerrada',
        'filled': 'Completa',
        'cancelled': 'Cancelada'
    };
    return labels[status] || status;
}

function getPaymentTypeLabel(type) {
    const labels = {
        'fixed': 'Pago fijo',
        'percentage': 'Porcentaje',
        'guarantee_plus_percentage': 'Garantía + %',
        'exchange': 'Trueque',
        'voluntary': 'Voluntario/Propina'
    };
    return labels[type] || type;
}

function getRatingLabel(key) {
    const labels = {
        'soundQuality': 'Sonido',
        'professionalism': 'Profesionalismo',
        'punctuality': 'Puntualidad',
        'treatment': 'Trato',
        'payment': 'Pago',
        'performance': 'Presentación',
        'repertoire': 'Repertorio'
    };
    return labels[key] || key;
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Exportar todo
export default {
    createVenueCard,
    createEventCard,
    createCallCard,
    createReviewItem,
    createScheduleSelector,
    getScheduleValue,
    createEventCalendar,
    showModal,
    showToast,
    createSkeleton
};
