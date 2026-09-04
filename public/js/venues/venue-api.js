/**
 * PROVIWEB - Live Music Venue Module
 * API de Firebase para Establecimientos de Música en Vivo
 */

import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    update, 
    remove,
    push,
    query,
    orderByChild,
    equalTo,
    limitToFirst,
    limitToLast,
    startAt,
    endAt,
    onValue,
    off
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

import { 
    getAuth 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Referencias de base de datos
const getDb = () => getDatabase();

// ============================================
// LIVE MUSIC VENUES - CRUD Básico
// ============================================

/**
 * Crear nuevo establecimiento
 * @param {Object} venueData - Datos del establecimiento
 * @returns {Promise<string>} ID del venue creado
 */
export async function createVenue(venueData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
        throw new Error('Usuario no autenticado');
    }

    const venueId = push(ref(db, 'LiveMusicVenues')).key;
    const timestamp = Date.now();
    
    const venue = {
        venueId,
        ownerUid: currentUser.uid,
        slug: generateSlug(venueData.name),
        status: 'pending_verification',
        isVerified: false,
        plan: {
            type: 'free',
            startDate: timestamp,
            endDate: null,
            autoRenew: false
        },
        stats: {
            profileViews: 0,
            totalEvents: 0,
            totalApplications: 0,
            averageRating: 0,
            totalReviews: 0,
            followerCount: 0,
            lastUpdated: timestamp
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: currentUser.uid,
        ...venueData
    };

    await set(ref(db, `LiveMusicVenues/${venueId}`), venue);
    
    // Registrar en UserVenueRoles para fácil acceso
    await set(ref(db, `UserVenueRoles/${venueId}/${currentUser.uid}`), {
        userId: currentUser.uid,
        venueId,
        role: 'owner',
        addedAt: timestamp,
        canEdit: true,
        canManageEvents: true,
        canManageCalls: true,
        canViewAnalytics: true
    });

    return venueId;
}

/**
 * Obtener establecimiento por ID
 * @param {string} venueId 
 * @returns {Promise<Object|null>}
 */
export async function getVenue(venueId) {
    const db = getDb();
    const snapshot = await get(ref(db, `LiveMusicVenues/${venueId}`));
    return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Obtener establecimiento por slug
 * @param {string} slug 
 * @returns {Promise<Object|null>}
 */
export async function getVenueBySlug(slug) {
    const db = getDb();
    const venuesRef = ref(db, 'LiveMusicVenues');
    const q = query(venuesRef, orderByChild('slug'), equalTo(slug));
    const snapshot = await get(q);
    
    if (!snapshot.exists()) return null;
    
    const venues = snapshot.val();
    const venueId = Object.keys(venues)[0];
    return { venueId, ...venues[venueId] };
}

/**
 * Actualizar establecimiento
 * @param {string} venueId 
 * @param {Object} updates 
 */
export async function updateVenue(venueId, updates) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
        throw new Error('Usuario no autenticado');
    }

    // Verificar permisos
    const venue = await getVenue(venueId);
    if (!venue) throw new Error('Establecimiento no encontrado');
    
    const hasPermission = await checkVenuePermission(venueId, currentUser.uid, 'edit');
    if (!hasPermission) {
        throw new Error('No tienes permiso para editar este establecimiento');
    }

    const updateData = {
        ...updates,
        updatedAt: Date.now()
    };

    await update(ref(db, `LiveMusicVenues/${venueId}`), updateData);
}

/**
 * Eliminar establecimiento
 * @param {string} venueId 
 */
export async function deleteVenue(venueId) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
        throw new Error('Usuario no autenticado');
    }

    const venue = await getVenue(venueId);
    if (!venue) throw new Error('Establecimiento no encontrado');
    
    if (venue.ownerUid !== currentUser.uid) {
        throw new Error('Solo el propietario puede eliminar el establecimiento');
    }

    await remove(ref(db, `LiveMusicVenues/${venueId}`));
    await remove(ref(db, `UserVenueRoles/${venueId}`));
    await remove(ref(db, `VenueEvents/${venueId}`));
    await remove(ref(db, `VenueCalls/${venueId}`));
    await remove(ref(db, `VenueReviews/${venueId}`));
    await remove(ref(db, `VenueFollowers/${venueId}`));
    await remove(ref(db, `VenueNotifications/${venueId}`));
}

// ============================================
// BÚSQUEDA Y FILTROS
// ============================================

/**
 * Buscar establecimientos con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>}
 */
export async function searchVenues(filters = {}, limit = 20) {
    const db = getDb();
    let venuesRef = ref(db, 'LiveMusicVenues');
    
    // Aplicar filtros
    if (filters.city) {
        venuesRef = query(venuesRef, orderByChild('location/city'), equalTo(filters.city));
    } else if (filters.venueType) {
        venuesRef = query(venuesRef, orderByChild('venueType'), equalTo(filters.venueType));
    } else if (filters.status) {
        venuesRef = query(venuesRef, orderByChild('status'), equalTo(filters.status));
    } else {
        venuesRef = query(venuesRef, limitToFirst(limit));
    }

    const snapshot = await get(venuesRef);
    if (!snapshot.exists()) return [];

    let venues = Object.entries(snapshot.val()).map(([id, data]) => ({
        venueId: id,
        ...data
    }));

    // Filtrado adicional en memoria
    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        venues = venues.filter(v => 
            v.name?.toLowerCase().includes(query) ||
            v.description?.toLowerCase().includes(query) ||
            v.location?.city?.toLowerCase().includes(query)
        );
    }

    if (filters.musicGenres && filters.musicGenres.length > 0) {
        venues = venues.filter(v => 
            v.musicGenres?.some(g => filters.musicGenres.includes(g))
        );
    }

    if (filters.hasLiveMusic) {
        venues = venues.filter(v => {
            const schedule = v.schedule || {};
            return Object.values(schedule).some(day => day.hasLiveMusic);
        });
    }

    // Ordenar
    if (filters.sortBy) {
        switch (filters.sortBy) {
            case 'rating':
                venues.sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0));
                break;
            case 'followers':
                venues.sort((a, b) => (b.stats?.followerCount || 0) - (a.stats?.followerCount || 0));
                break;
            case 'newest':
                venues.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case 'name':
            default:
                venues.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    }

    return venues.slice(0, limit);
}

/**
 * Obtener establecimientos destacados
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getFeaturedVenues(limit = 10) {
    const db = getDb();
    const venuesRef = query(
        ref(db, 'LiveMusicVenues'),
        orderByChild('plan/type'),
        equalTo('atlas')
    );
    
    const snapshot = await get(venuesRef);
    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val())
        .map(([id, data]) => ({ venueId: id, ...data }))
        .filter(v => v.status === 'active')
        .slice(0, limit);
}

// ============================================
// EVENTOS/AGENDA
// ============================================

/**
 * Crear evento
 * @param {string} venueId 
 * @param {Object} eventData 
 * @returns {Promise<string>}
 */
export async function createEvent(venueId, eventData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const hasPermission = await checkVenuePermission(venueId, currentUser.uid, 'manageEvents');
    if (!hasPermission) throw new Error('Sin permisos');

    const eventId = push(ref(db, `VenueEvents/${venueId}`)).key;
    const timestamp = Date.now();
    
    const event = {
        eventId,
        venueId,
        createdBy: currentUser.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        isPublic: true,
        isFeatured: false,
        status: 'scheduled',
        stats: {
            views: 0,
            interested: 0,
            attending: 0
        },
        ...eventData
    };

    await set(ref(db, `VenueEvents/${venueId}/${eventId}`), event);
    
    // Actualizar contador de eventos del venue
    await updateVenueStats(venueId, { totalEvents: increment(1) });
    
    return eventId;
}

/**
 * Obtener eventos de un establecimiento
 * @param {string} venueId 
 * @param {Object} filters 
 * @returns {Promise<Array>}
 */
export async function getVenueEvents(venueId, filters = {}) {
    const db = getDb();
    const eventsRef = ref(db, `VenueEvents/${venueId}`);
    
    let q = eventsRef;
    
    if (filters.status) {
        q = query(eventsRef, orderByChild('status'), equalTo(filters.status));
    } else if (filters.upcoming) {
        q = query(eventsRef, orderByChild('startDate'), startAt(Date.now()));
    } else if (filters.past) {
        q = query(eventsRef, orderByChild('startDate'), endAt(Date.now()));
    }

    const snapshot = await get(q);
    if (!snapshot.exists()) return [];

    let events = Object.values(snapshot.val());
    
    // Filtrar solo públicos para usuarios no autenticados
    if (filters.onlyPublic) {
        events = events.filter(e => e.isPublic);
    }

    // Ordenar por fecha
    events.sort((a, b) => (a.startDate || 0) - (b.startDate || 0));
    
    return events;
}

// ============================================
// CONVOCATORIAS
// ============================================

/**
 * Crear convocatoria
 * @param {string} venueId 
 * @param {Object} callData 
 * @returns {Promise<string>}
 */
export async function createCall(venueId, callData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const hasPermission = await checkVenuePermission(venueId, currentUser.uid, 'manageCalls');
    if (!hasPermission) throw new Error('Sin permisos');

    const callId = push(ref(db, `VenueCalls/${venueId}`)).key;
    const timestamp = Date.now();
    
    const call = {
        callId,
        venueId,
        createdBy: currentUser.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'open',
        slotsFilled: 0,
        ...callData
    };

    await set(ref(db, `VenueCalls/${venueId}/${callId}`), call);

    // Sincronizar simultáneamente en nodo ads/ para paridad completa con Android job/
    try {
        const venueSnap = await get(ref(db, `LiveMusicVenues/${venueId}`));
        const venueInfo = venueSnap.exists() ? venueSnap.val() : {};

        await set(ref(db, `ads/${callId}`), {
            id: callId,
            idUser: currentUser.uid,
            title: callData.title || 'Oportunidad artística',
            description: callData.description || '',
            jobCategory: callData.genre || callData.category || 'Música en Vivo',
            position: callData.position || callData.type || 'Músico / Intérprete',
            period: callData.eventDate || callData.period || 'Por evento',
            location: (venueInfo.location ? `${venueInfo.location.city || ''}, ${venueInfo.location.address || ''}` : (callData.location || '')).trim(),
            salary: callData.paymentAmount ? `${callData.paymentAmount} ${callData.currency || 'USD'}` : (callData.salary || callData.compensation || 'A convenir'),
            phone: venueInfo.contact?.phone || venueInfo.contact?.whatsapp || '',
            email: venueInfo.contact?.email || '',
            url: `venue-profile.html?id=${venueId}`,
            venueId: venueId,
            timestamp: timestamp
        });
    } catch(err) {
        console.warn('Error sincronizando con ads/', err);
    }
    return callId;
}

/**
 * Postularse a una convocatoria
 * @param {string} callId 
 * @param {string} venueId 
 * @param {Object} applicationData 
 * @returns {Promise<string>}
 */
export async function applyToCall(callId, venueId, applicationData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');

    // Verificar que la convocatoria exista y esté abierta
    const call = await get(ref(db, `VenueCalls/${venueId}/${callId}`));
    if (!call.exists()) throw new Error('Convocatoria no encontrada');
    
    const callData = call.val();
    if (callData.status !== 'open') throw new Error('La convocatoria no está abierta');
    if (callData.applicationDeadline < Date.now()) throw new Error('La convocatoria ha cerrado');

    // Verificar que no haya postulado antes
    const existingApps = await get(ref(db, `CallApplications/${callId}`));
    if (existingApps.exists()) {
        const apps = Object.values(existingApps.val());
        if (apps.some(a => a.artistId === currentUser.uid)) {
            throw new Error('Ya te has postulado a esta convocatoria');
        }
    }

    const applicationId = push(ref(db, `CallApplications/${callId}`)).key;
    const timestamp = Date.now();
    
    const application = {
        applicationId,
        callId,
        venueId,
        artistId: currentUser.uid,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        ...applicationData
    };

    await set(ref(db, `CallApplications/${callId}/${applicationId}`), application);
    
    // Incrementar contador de postulaciones del venue
    await updateVenueStats(venueId, { totalApplications: increment(1) });
    
    // Crear notificación para el venue
    await createVenueNotification(venueId, {
        type: 'new_application',
        title: 'Nueva postulación recibida',
        message: `${applicationData.artistName} se ha postulado a "${callData.title}"`,
        data: { applicationId, callId, artistId: currentUser.uid }
    });

    return applicationId;
}

/**
 * Obtener postulaciones de una convocatoria
 * @param {string} callId 
 * @param {string} venueId 
 * @returns {Promise<Array>}
 */
export async function getCallApplications(callId, venueId) {
    const db = getDb();
    const snapshot = await get(ref(db, `CallApplications/${callId}`));
    if (!snapshot.exists()) return [];
    
    return Object.values(snapshot.val());
}

/**
 * Actualizar estado de postulación
 * @param {string} callId 
 * @param {string} applicationId 
 * @param {string} status 
 * @param {Object} updates 
 */
export async function updateApplicationStatus(callId, applicationId, status, updates = {}) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');

    const appSnapshot = await get(ref(db, `CallApplications/${callId}/${applicationId}`));
    if (!appSnapshot.exists()) throw new Error('Postulación no encontrada');
    
    const application = appSnapshot.val();
    
    // Verificar permisos
    const hasPermission = await checkVenuePermission(application.venueId, currentUser.uid, 'manageCalls');
    if (!hasPermission) throw new Error('Sin permisos');

    const updateData = {
        status,
        statusChangedAt: Date.now(),
        statusChangedBy: currentUser.uid,
        ...updates,
        updatedAt: Date.now()
    };

    await update(ref(db, `CallApplications/${callId}/${applicationId}`), updateData);
}

// ============================================
// RESEÑAS Y VALORACIONES
// ============================================

/**
 * Crear reseña de establecimiento
 * @param {string} venueId 
 * @param {Object} reviewData 
 * @returns {Promise<string>}
 */
export async function createVenueReview(venueId, reviewData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');

    // Verificar que el usuario no haya reseñado antes
    const existingReview = await get(
        query(
            ref(db, `VenueReviews/${venueId}`),
            orderByChild('authorId'),
            equalTo(currentUser.uid)
        )
    );
    
    if (existingReview.exists()) {
        throw new Error('Ya has reseñado este establecimiento');
    }

    const reviewId = push(ref(db, `VenueReviews/${venueId}`)).key;
    const timestamp = Date.now();
    
    const review = {
        reviewId,
        venueId,
        authorId: currentUser.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        isVerified: false,
        isPublic: true,
        helpful: 0,
        ...reviewData
    };

    await set(ref(db, `VenueReviews/${venueId}/${reviewId}`), review);
    
    // Actualizar promedio de calificaciones del venue
    await updateVenueAverageRating(venueId);
    
    // Crear notificación
    await createVenueNotification(venueId, {
        type: 'review',
        title: 'Nueva reseña recibida',
        message: `Alguien ha dejado una reseña: "${reviewData.title}"`,
        data: { reviewId, rating: reviewData.ratings?.overall }
    });

    return reviewId;
}

/**
 * Obtener reseñas de un establecimiento
 * @param {string} venueId 
 * @param {Object} filters 
 * @returns {Promise<Array>}
 */
export async function getVenueReviews(venueId, filters = {}) {
    const db = getDb();
    let reviewsRef = ref(db, `VenueReviews/${venueId}`);
    
    if (filters.onlyPublic) {
        reviewsRef = query(reviewsRef, orderByChild('isPublic'), equalTo(true));
    }

    const snapshot = await get(reviewsRef);
    if (!snapshot.exists()) return [];

    let reviews = Object.values(snapshot.val());
    
    // Ordenar
    reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return reviews;
}

// ============================================
// SEGUIDORES
// ============================================

/**
 * Seguir/dejar de seguir un establecimiento
 * @param {string} venueId 
 * @param {boolean} follow 
 */
export async function toggleFollowVenue(venueId, follow) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');

    const timestamp = Date.now();
    
    if (follow) {
        await set(ref(db, `VenueFollowers/${venueId}/${currentUser.uid}`), {
            userId: currentUser.uid,
            followedAt: timestamp,
            notificationsEnabled: true
        });
        
        await set(ref(db, `UserFollowedVenues/${currentUser.uid}/${venueId}`), {
            venueId,
            followedAt: timestamp,
            notificationsEnabled: true
        });
        
        await updateVenueStats(venueId, { followerCount: increment(1) });
    } else {
        await remove(ref(db, `VenueFollowers/${venueId}/${currentUser.uid}`));
        await remove(ref(db, `UserFollowedVenues/${currentUser.uid}/${venueId}`));
        await updateVenueStats(venueId, { followerCount: increment(-1) });
    }
}

/**
 * Verificar si el usuario sigue un establecimiento
 * @param {string} venueId 
 * @returns {Promise<boolean>}
 */
export async function isFollowingVenue(venueId) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) return false;
    
    const snapshot = await get(ref(db, `VenueFollowers/${venueId}/${currentUser.uid}`));
    return snapshot.exists();
}

/**
 * Obtener establecimientos seguidos por un usuario
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export async function getUserFollowedVenues(userId) {
    const db = getDb();
    const snapshot = await get(ref(db, `UserFollowedVenues/${userId}`));
    if (!snapshot.exists()) return [];
    
    const venueIds = Object.keys(snapshot.val());
    const venues = [];
    
    for (const venueId of venueIds) {
        const venue = await getVenue(venueId);
        if (venue) venues.push({ venueId, ...venue });
    }
    
    return venues;
}

// ============================================
// ARTISTAS FAVORITOS (PARA VENUES)
// ============================================

/**
 * Agregar artista a favoritos del venue
 * @param {string} venueId 
 * @param {string} artistId 
 * @param {Object} artistInfo 
 */
export async function addFavoriteArtist(venueId, artistId, artistInfo) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const hasPermission = await checkVenuePermission(venueId, currentUser.uid, 'edit');
    if (!hasPermission) throw new Error('Sin permisos');

    await set(ref(db, `VenueFavoriteArtists/${venueId}/${artistId}`), {
        artistId,
        artistName: artistInfo.name,
        artistImage: artistInfo.image || '',
        addedAt: Date.now(),
        timesBooked: 0,
        notes: artistInfo.notes || ''
    });
}

/**
 * Obtener artistas favoritos de un venue
 * @param {string} venueId 
 * @returns {Promise<Array>}
 */
export async function getFavoriteArtists(venueId) {
    const db = getDb();
    const snapshot = await get(ref(db, `VenueFavoriteArtists/${venueId}`));
    if (!snapshot.exists()) return [];
    
    return Object.values(snapshot.val()).sort((a, b) => (b.timesBooked || 0) - (a.timesBooked || 0));
}

// ============================================
// NOTIFICACIONES
// ============================================

/**
 * Crear notificación para el venue
 * @param {string} venueId 
 * @param {Object} notificationData 
 */
export async function createVenueNotification(venueId, notificationData) {
    const db = getDb();
    const notificationId = push(ref(db, `VenueNotifications/${venueId}`)).key;
    
    const notification = {
        notificationId,
        venueId,
        isRead: false,
        createdAt: Date.now(),
        ...notificationData
    };

    await set(ref(db, `VenueNotifications/${venueId}/${notificationId}`), notification);
}

/**
 * Obtener notificaciones de un venue
 * @param {string} venueId 
 * @param {Object} filters 
 * @returns {Promise<Array>}
 */
export async function getVenueNotifications(venueId, filters = {}) {
    const db = getDb();
    let notifRef = ref(db, `VenueNotifications/${venueId}`);
    
    if (filters.onlyUnread) {
        notifRef = query(notifRef, orderByChild('isRead'), equalTo(false));
    }

    const snapshot = await get(notifRef);
    if (!snapshot.exists()) return [];

    let notifications = Object.values(snapshot.val());
    notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return notifications;
}

/**
 * Marcar notificación como leída
 * @param {string} venueId 
 * @param {string} notificationId 
 */
export async function markNotificationAsRead(venueId, notificationId) {
    const db = getDb();
    await update(ref(db, `VenueNotifications/${venueId}/${notificationId}`), {
        isRead: true,
        readAt: Date.now()
    });
}

// ============================================
// UTILIDADES Y AYUDANTES
// ============================================

/**
 * Verificar permisos sobre un venue
 * @param {string} venueId 
 * @param {string} userId 
 * @param {string} permission 
 * @returns {Promise<boolean>}
 */
export async function checkVenuePermission(venueId, userId, permission) {
    const db = getDb();
    
    // Verificar si es owner
    const venue = await getVenue(venueId);
    if (venue && venue.ownerUid === userId) return true;
    
    // Verificar roles asignados
    const roleSnapshot = await get(ref(db, `UserVenueRoles/${venueId}/${userId}`));
    if (!roleSnapshot.exists()) return false;
    
    const role = roleSnapshot.val();
    
    switch (permission) {
        case 'edit':
            return role.canEdit === true;
        case 'manageEvents':
            return role.canManageEvents === true;
        case 'manageCalls':
            return role.canManageCalls === true;
        case 'viewAnalytics':
            return role.canViewAnalytics === true;
        default:
            return false;
    }
}

/**
 * Actualizar estadísticas de un venue
 * @param {string} venueId 
 * @param {Object} updates 
 */
export async function updateVenueStats(venueId, updates) {
    const db = getDb();
    const statsRef = ref(db, `LiveMusicVenues/${venueId}/stats`);
    
    const currentStats = await get(statsRef);
    const stats = currentStats.exists() ? currentStats.val() : {};
    
    const newStats = { ...stats, ...updates, lastUpdated: Date.now() };
    await update(statsRef, newStats);
}

/**
 * Actualizar promedio de calificaciones
 * @param {string} venueId 
 */
export async function updateVenueAverageRating(venueId) {
    const db = getDb();
    const reviewsSnapshot = await get(ref(db, `VenueReviews/${venueId}`));
    
    if (!reviewsSnapshot.exists()) return;
    
    const reviews = Object.values(reviewsSnapshot.val());
    const totalRating = reviews.reduce((sum, r) => sum + (r.ratings?.overall || 0), 0);
    const averageRating = totalRating / reviews.length;
    
    await updateVenueStats(venueId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
    });
}

/**
 * Generar slug único a partir del nombre
 * @param {string} name 
 * @returns {string}
 */
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Helper para incrementar valores
 * @param {number} n 
 * @returns {Object}
 */
function increment(n) {
    return { '.sv': { 'increment': n } };
}

// ============================================
// SUSCRIPCIONES EN TIEMPO REAL
// ============================================

/**
 * Suscribirse a cambios de un venue
 * @param {string} venueId 
 * @param {Function} callback 
 * @returns {Function} Función para cancelar suscripción
 */
export function subscribeToVenue(venueId, callback) {
    const db = getDb();
    const venueRef = ref(db, `LiveMusicVenues/${venueId}`);
    
    const unsubscribe = onValue(venueRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
    });
    
    return () => off(venueRef, 'value', unsubscribe);
}

/**
 * Suscribirse a eventos de un venue
 * @param {string} venueId 
 * @param {Function} callback 
 * @returns {Function}
 */
export function subscribeToVenueEvents(venueId, callback) {
    const db = getDb();
    const eventsRef = ref(db, `VenueEvents/${venueId}`);
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
        const events = snapshot.exists() ? Object.values(snapshot.val()) : [];
        callback(events);
    });
    
    return () => off(eventsRef, 'value', unsubscribe);
}

/**
 * Suscribirse a notificaciones de un venue
 * @param {string} venueId 
 * @param {Function} callback 
 * @returns {Function}
 */
export function subscribeToVenueNotifications(venueId, callback) {
    const db = getDb();
    const notifRef = ref(db, `VenueNotifications/${venueId}`);
    
    const unsubscribe = onValue(notifRef, (snapshot) => {
        const notifications = snapshot.exists() ? Object.values(snapshot.val()) : [];
        callback(notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    
    return () => off(notifRef, 'value', unsubscribe);
}

// Exportar todas las funciones
export default {
    createVenue,
    getVenue,
    getVenueBySlug,
    updateVenue,
    deleteVenue,
    searchVenues,
    getFeaturedVenues,
    createEvent,
    getVenueEvents,
    createCall,
    applyToCall,
    getCallApplications,
    updateApplicationStatus,
    createVenueReview,
    getVenueReviews,
    toggleFollowVenue,
    isFollowingVenue,
    getUserFollowedVenues,
    addFavoriteArtist,
    getFavoriteArtists,
    getVenueNotifications,
    markNotificationAsRead,
    checkVenuePermission,
    subscribeToVenue,
    subscribeToVenueEvents,
    subscribeToVenueNotifications,
    
    // Employee Management
    getVenueEmployees,
    addVenueEmployee,
    updateVenueEmployee,
    deleteVenueEmployee,
    registerAttendance,
    getVenueAttendance
};

// ============================================
// VENUE EMPLOYEES - Gestión de Empleados
// ============================================

/**
 * Obtener empleados de un establecimiento
 * @param {string} venueId - ID del establecimiento
 * @returns {Promise<Array>} Lista de empleados
 */
export async function getVenueEmployees(venueId) {
    const db = getDb();
    const employeesRef = ref(db, `VenueEmployees/${venueId}`);
    const snapshot = await get(employeesRef);
    
    if (!snapshot.exists()) {
        return [];
    }
    
    const employees = [];
    snapshot.forEach((child) => {
        employees.push({ id: child.key, ...child.val() });
    });
    
    return employees;
}

/**
 * Agregar empleado a un establecimiento
 * @param {string} venueId - ID del establecimiento
 * @param {Object} employeeData - Datos del empleado
 * @returns {Promise<string>} ID del empleado creado
 */
export async function addVenueEmployee(venueId, employeeData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
        throw new Error('Usuario no autenticado');
    }
    
    const employeesRef = ref(db, `VenueEmployees/${venueId}`);
    const newEmployeeRef = push(employeesRef);
    
    const data = {
        ...employeeData,
        createdAt: Date.now(),
        createdBy: currentUser.uid,
        venueId
    };
    
    await set(newEmployeeRef, data);
    
    // Create card if custom type
    if (employeeData.cardType === 'custom') {
        const cardRef = ref(db, `VenueEmployeeCards/${venueId}/${newEmployeeRef.key}`);
        await set(cardRef, {
            employeeId: newEmployeeRef.key,
            cardNumber: `EMP-${Date.now().toString(36).toUpperCase()}`,
            createdAt: Date.now()
        });
    }
    
    return newEmployeeRef.key;
}

/**
 * Actualizar empleado
 * @param {string} venueId - ID del establecimiento
 * @param {string} employeeId - ID del empleado
 * @param {Object} updates - Datos a actualizar
 */
export async function updateVenueEmployee(venueId, employeeId, updates) {
    const db = getDb();
    const employeeRef = ref(db, `VenueEmployees/${venueId}/${employeeId}`);
    
    await update(employeeRef, {
        ...updates,
        updatedAt: Date.now()
    });
}

/**
 * Eliminar empleado
 * @param {string} venueId - ID del establecimiento
 * @param {string} employeeId - ID del empleado
 */
export async function deleteVenueEmployee(venueId, employeeId) {
    const db = getDb();
    const employeeRef = ref(db, `VenueEmployees/${venueId}/${employeeId}`);
    const cardRef = ref(db, `VenueEmployeeCards/${venueId}/${employeeId}`);
    
    await remove(employeeRef);
    await remove(cardRef);
}

/**
 * Registrar asistencia
 * @param {string} venueId - ID del establecimiento
 * @param {string} employeeId - ID del empleado
 * @param {string} type - 'entry' o 'exit'
 * @param {Object} employeeData - Datos del empleado
 * @returns {Promise<string>} ID del registro
 */
export async function registerAttendance(venueId, employeeId, type, employeeData) {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    const attendanceRef = ref(db, `VenueAttendance/${venueId}`);
    const newRecordRef = push(attendanceRef);
    
    const record = {
        employeeId,
        employeeName: employeeData.fullName,
        employeePhoto: employeeData.photo || null,
        type,
        timestamp: Date.now(),
        scannedBy: currentUser?.uid || 'self',
        venueId
    };
    
    await set(newRecordRef, record);
    return newRecordRef.key;
}

/**
 * Obtener registros de asistencia
 * @param {string} venueId - ID del establecimiento
 * @param {number} limit - Límite de registros
 * @returns {Promise<Array>} Lista de registros
 */
export async function getVenueAttendance(venueId, limit = 50) {
    const db = getDb();
    const attendanceRef = ref(db, `VenueAttendance/${venueId}`);
    const snapshot = await get(attendanceRef);
    
    if (!snapshot.exists()) {
        return [];
    }
    
    const records = [];
    snapshot.forEach((child) => {
        records.push({ id: child.key, ...child.val() });
    });
    
    // Sort by timestamp desc and limit
    records.sort((a, b) => b.timestamp - a.timestamp);
    return records.slice(0, limit);
}


// ============================================
// GESTIÓN DE PLANES Y COBROS (FACTURACIÓN)
// ============================================

export const VENUE_PLANS = {
    free: {
        id: 'free',
        name: 'Básico (Gratuito)',
        priceUSD: 0,
        priceCOP: 0,
        durationDays: 365,
        maxActiveCalls: 1,
        featuredInMap: false,
        verifiedBadge: false,
        analytics: false
    },
    pro: {
        id: 'pro',
        name: 'PRO Ally',
        priceUSD: 30,
        priceCOP: 49900,
        durationDays: 30,
        maxActiveCalls: 5,
        featuredInMap: true,
        verifiedBadge: true,
        analytics: true
    },
    atlas: {
        id: 'atlas',
        name: 'ATLAS Enterprise',
        priceUSD: 60,
        priceCOP: 149900,
        durationDays: 30,
        maxActiveCalls: 999,
        featuredInMap: true,
        verifiedBadge: true,
        analytics: true,
        multiStaff: true
    }
};

/**
 * Actualizar o renovar plan del establecimiento deduciendo de Balance o por pasarela
 * @param {string} venueId
 * @param {string} planType ('free' | 'pro' | 'atlas')
 * @param {string} paymentMethod ('balance' | 'paypal' | 'card')
 * @param {string} paymentRef
 * @returns {Promise<Object>}
 */
export async function upgradeVenuePlan(venueId, planType, paymentMethod = 'balance', paymentRef = '') {
    const db = getDb();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const planConfig = VENUE_PLANS[planType];
    if (!planConfig) throw new Error('Plan no válido');

    const timestamp = Date.now();
    const durationMillis = (planConfig.durationDays || 30) * 86400000;
    const endDate = timestamp + durationMillis;

    // Si es un plan de pago y se usa balance, verificar y descontar
    if (planType !== 'free' && paymentMethod === 'balance') {
        const balanceRef = ref(db, `Balance/${currentUser.uid}/balance`);
        const balanceSnap = await get(balanceRef);
        let currentBalance = 0;
        if (balanceSnap.exists()) {
            currentBalance = parseFloat(balanceSnap.val()) || 0;
        }

        const cost = planConfig.priceUSD;
        if (currentBalance < cost) {
            throw new Error(`Saldo insuficiente en tu monedero ($ ${currentBalance.toFixed(2)} USD). El plan ${planConfig.name} cuesta $ ${cost} USD. Recarga saldo o usa PayPal.`);
        }

        // Deducir saldo
        const newBalance = currentBalance - cost;
        await set(balanceRef, newBalance);

        // Registrar transacción en BalanceEnviado
        const transRef = push(ref(db, `BalanceEnviado/${currentUser.uid}`));
        await set(transRef, {
            id: transRef.key,
            type: 'plan_subscription',
            venueId: venueId,
            plan: planType,
            amount: cost,
            currency: 'USD',
            timestamp: timestamp,
            status: 'completed'
        });
    }

    const updatedPlan = {
        type: planType,
        startDate: timestamp,
        endDate: endDate,
        autoRenew: true,
        maxActiveCalls: planConfig.maxActiveCalls,
        priceUSD: planConfig.priceUSD,
        paymentMethod: paymentMethod,
        paymentRef: paymentRef || 'DIRECT_BALANCE'
    };

    // Actualizar plan en el venue
    await update(ref(db, `LiveMusicVenues/${venueId}/plan`), updatedPlan);

    // Registrar en historial de suscripciones del usuario
    await set(ref(db, `Subscriptions/${currentUser.uid}/${venueId}`), {
        venueId,
        plan: planType,
        updatedAt: timestamp,
        expiresAt: endDate,
        active: true
    });

    return updatedPlan;
}
