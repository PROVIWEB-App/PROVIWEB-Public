# Módulo: Establecimientos de Música en Vivo
## Especificación Técnica - PROVIWEB

---

## 1. Arquitectura de Datos (Firebase Realtime Database)

### 1.1 Entidades Principales

```json
{
  "LiveMusicVenues": {
    "$venueId": {
      // Información Básica
      "venueId": "string",
      "ownerUid": "string",           // UID del propietario (user)
      "name": "string",
      "slug": "string",               // URL amigable
      "description": "string",
      "shortDescription": "string",   // Para tarjetas/listados
      
      // Tipo y Categorización
      "venueType": "string",          // bar, restaurante, taberna_mariachi, 
                                      // peña, foro_cultural, espacio_artistico, etc.
      "musicGenres": ["string"],      // géneros musicales que maneja
      "atmosphere": ["string"],       // informal, elegante, familiar, etc.
      
      // Ubicación
      "location": {
        "country": "string",
        "state": "string",
        "city": "string",
        "neighborhood": "string",
        "address": "string",
        "zipCode": "string",
        "latitude": "number",
        "longitude": "number",
        "geohash": "string"           // Para consultas geográficas
      },
      
      // Capacidad y Espacio
      "capacity": "number",
      "hasStage": "boolean",
      "hasSoundSystem": "boolean",
      "hasLighting": "boolean",
      "stageSize": "string",          // pequeño, mediano, grande
      
      // Multimedia
      "profileImage": "string",       // URL imagen principal
      "coverImage": "string",         // URL imagen de portada
      "gallery": [{
        "url": "string",
        "type": "string",           // image, video
        "caption": "string",
        "order": "number"
      }],
      "videos": [{
        "url": "string",
        "platform": "string",       // youtube, vimeo, etc.
        "title": "string"
      }],
      
      // Horarios
      "schedule": {
        "monday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" },
        "tuesday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" },
        "wednesday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" },
        "thursday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" },
        "friday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" },
        "saturday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" },
        "sunday": { "open": "string", "close": "string", "hasLiveMusic": "boolean" }
      },
      "typicalMusicStartTime": "string",
      
      // Contacto
      "contact": {
        "phone": "string",
        "whatsapp": "string",
        "email": "string",
        "website": "string",
        "instagram": "string",
        "facebook": "string",
        "tiktok": "string"
      },
      
      // Plan y Estado
      "plan": {
        "type": "string",           // free, pro, atlas
        "startDate": "number",      // timestamp
        "endDate": "number",        // timestamp (null si es free)
        "autoRenew": "boolean"
      },
      "status": "string",             // active, inactive, pending_verification, suspended
      "isVerified": "boolean",
      "verifiedAt": "number",
      
      // Configuración
      "settings": {
        "allowPublicMessaging": "boolean",
        "autoAcceptApplications": "boolean",
        "showContactPublicly": "boolean",
        "notificationPreferences": {
          "newApplications": "boolean",
          "messages": "boolean",
          "reviews": "boolean"
        }
      },
      
      // Estadísticas
      "stats": {
        "profileViews": "number",
        "totalEvents": "number",
        "totalApplications": "number",
        "averageRating": "number",
        "totalReviews": "number",
        "followerCount": "number",
        "lastUpdated": "number"
      },
      
      // Metadatos
      "createdAt": "number",
      "updatedAt": "number",
      "createdBy": "string"
    }
  }
}
```

### 1.2 Agenda Musical (Events)

```json
{
  "VenueEvents": {
    "$venueId": {
      "$eventId": {
        "eventId": "string",
        "venueId": "string",
        "title": "string",
        "description": "string",
        "eventType": "string",        // regular, special, festival, open_mic
        
        // Fechas
        "startDate": "number",        // timestamp
        "endDate": "number",          // timestamp
        "startTime": "string",        // HH:mm
        "endTime": "string",
        "isRecurring": "boolean",
        "recurrencePattern": "string", // weekly, monthly, etc.
        
        // Artistas
        "artists": [{
          "artistId": "string",       // UID del músico
          "artistName": "string",
          "artistImage": "string",
          "role": "string",          // headliner, supporting, guest
          "confirmed": "boolean",
          "confirmedAt": "number"
        }],
        "artistSlots": "number",      // cupos disponibles
        "isOpenCall": "boolean",      // convocatoria abierta
        
        // Multimedia
        "flyer": "string",
        "poster": "string",
        "photos": ["string"],
        
        // Estado
        "status": "string",           // scheduled, cancelled, completed, postponed
        "isPublic": "boolean",
        "isFeatured": "boolean",      // destacado (PRO/Atlas)
        
        // Estadísticas
        "stats": {
          "views": "number",
          "interested": "number",
          "attending": "number"
        },
        
        "createdAt": "number",
        "updatedAt": "number"
      }
    }
  }
}
```

### 1.3 Sistema de Convocatorias (Calls)

```json
{
  "VenueCalls": {
    "$venueId": {
      "$callId": {
        "callId": "string",
        "venueId": "string",
        "createdBy": "string",
        
        // Información de la convocatoria
        "title": "string",
        "description": "string",
        "requirements": ["string"],
        
        // Posición buscada
        "positionType": "string",     // band, solo_artist, specific_instrument
        "instruments": ["string"],    // si aplica
        "genre": "string",
        
        // Fechas
        "eventDate": "number",        // cuando se necesita
        "applicationDeadline": "number",
        "duration": "string",         // one_time, weekly, monthly, indefinite
        
        // Compensación
        "payment": {
          "type": "string",         // fixed, percentage, guarantee_plus_percentage, 
                                    // exchange, voluntary
          "amount": "number",
          "currency": "string",
          "details": "string"
        },
        
        // Requisitos
        "requirements": {
          "experienceYears": "number",
          "demoRequired": "boolean",
          "repertoireRequired": "boolean",
          "equipmentRequired": "boolean",
          "referencesRequired": "boolean"
        },
        
        // Ubicación (si es diferente a la del venue)
        "location": {
          "city": "string",
          "address": "string"
        },
        
        // Estado
        "status": "string",           // open, closed, filled, cancelled
        "slotsAvailable": "number",
        "slotsFilled": "number",
        
        "createdAt": "number",
        "updatedAt": "number"
      }
    }
  },
  
  "CallApplications": {
    "$callId": {
      "$applicationId": {
        "applicationId": "string",
        "callId": "string",
        "venueId": "string",
        "artistId": "string",
        "artistName": "string",
        "artistImage": "string",
        
        // Información de postulación
        "message": "string",
        "proposedRepertoire": ["string"],
        "demoLinks": ["string"],
        "availability": "string",
        
        // Estado
        "status": "string",           // pending, accepted, rejected, cancelled
        "statusChangedAt": "number",
        "statusChangedBy": "string",
        
        // Notas internas
        "venueNotes": "string",
        "artistNotes": "string",
        
        "createdAt": "number",
        "updatedAt": "number"
      }
    }
  }
}
```

### 1.4 Sistema de Reputación (Reviews)

```json
{
  "VenueReviews": {
    "$venueId": {
      "$reviewId": {
        "reviewId": "string",
        "venueId": "string",
        "authorId": "string",         // Quien deja la reseña
        "authorType": "string",       // artist, visitor
        
        // Calificaciones
        "ratings": {
          "overall": "number",        // 1-5
          "soundQuality": "number",
          "professionalism": "number",
          "punctuality": "number",
          "treatment": "number",
          "payment": "number"
        },
        
        // Reseña
        "title": "string",
        "comment": "string",
        "wouldRecommend": "boolean",
        
        // Relación con evento (opcional)
        "eventId": "string",
        "eventDate": "number",
        
        // Estado
        "isVerified": "boolean",      // Verificado si hubo un evento real
        "isPublic": "boolean",
        "helpful": "number",          // votos de útil
        
        "createdAt": "number",
        "updatedAt": "number"
      }
    }
  },
  
  "ArtistReviewsByVenue": {
    "$artistId": {
      "$reviewId": {
        "reviewId": "string",
        "artistId": "string",
        "venueId": "string",
        "venueName": "string",
        
        // Calificaciones
        "ratings": {
          "overall": "number",
          "punctuality": "number",
          "professionalism": "number",
          "performance": "number",
          "repertoire": "number"
        },
        
        "comment": "string",
        "eventId": "string",
        "isPublic": "boolean",
        
        "createdAt": "number",
        "updatedAt": "number"
      }
    }
  }
}
```

### 1.5 Relaciones Sociales

```json
{
  "VenueFollowers": {
    "$venueId": {
      "$userId": {
        "userId": "string",
        "followedAt": "number",
        "notificationsEnabled": "boolean"
      }
    }
  },
  
  "UserFollowedVenues": {
    "$userId": {
      "$venueId": {
        "venueId": "string",
        "followedAt": "number",
        "notificationsEnabled": "boolean"
      }
    }
  },
  
  "VenueFavoriteArtists": {
    "$venueId": {
      "$artistId": {
        "artistId": "string",
        "artistName": "string",
        "artistImage": "string",
        "addedAt": "number",
        "timesBooked": "number",
        "lastBookedAt": "number",
        "notes": "string"
      }
    }
  }
}
```

### 1.6 Notificaciones del Venue

```json
{
  "VenueNotifications": {
    "$venueId": {
      "$notificationId": {
        "notificationId": "string",
        "venueId": "string",
        "type": "string",           // new_application, message, review, 
                                      // artist_confirmed, artist_cancelled, etc.
        "title": "string",
        "message": "string",
        "data": {
          // Datos específicos según el tipo
          "applicationId": "string",
          "artistId": "string",
          "eventId": "string"
        },
        "isRead": "boolean",
        "createdAt": "number"
      }
    }
  }
}
```

---

## 2. Índices Requeridos (database.rules.json)

```json
{
  "rules": {
    "LiveMusicVenues": {
      ".indexOn": ["slug", "venueType", "status", "plan/type", "location/city", "location/geohash", "stats/averageRating"]
    },
    "VenueEvents": {
      ".indexOn": ["startDate", "status", "isPublic", "isFeatured", "eventType"]
    },
    "VenueCalls": {
      ".indexOn": ["status", "applicationDeadline", "payment/type", "createdAt"]
    },
    "CallApplications": {
      ".indexOn": ["artistId", "status", "createdAt"]
    },
    "VenueReviews": {
      ".indexOn": ["authorId", "createdAt", "isPublic"]
    }
  }
}
```

---

## 3. Páginas HTML a Crear

### 3.1 Páginas Públicas
1. `venue-profile.html` - Perfil público del establecimiento
2. `venues-explore.html` - Exploración/descubrimiento de establecimientos
3. `venue-event.html` - Detalle de un evento específico
4. `venue-call-detail.html` - Detalle de una convocatoria

### 3.2 Páginas de Administración (Venue Owner)
1. `venue-dashboard.html` - Panel principal del establecimiento
2. `venue-edit-profile.html` - Editar información del venue
3. `venue-manage-events.html` - Gestión de agenda/eventos
4. `venue-manage-calls.html` - Gestión de convocatorias
5. `venue-applications.html` - Ver postulaciones recibidas
6. `venue-reviews.html` - Gestión de reseñas
7. `venue-analytics.html` - Estadísticas (PRO/Atlas)
8. `venue-register.html` - Registro de nuevo establecimiento

---

## 4. Componentes JavaScript Reutilizables

### 4.1 Módulos ES6 a Crear

```
public/js/venues/
├── venue-auth.js           # Autenticación específica de venues
├── venue-api.js            # API de Firebase para venues
├── venue-search.js         # Búsqueda y filtros
├── venue-maps.js           # Integración con mapas
├── venue-calendar.js       # Componente de calendario
├── venue-ratings.js        # Sistema de valoraciones
├── venue-applications.js   # Gestión de postulaciones
└── venue-notifications.js  # Notificaciones del venue
```

---

## 5. Planes y Limitaciones

### 5.1 Plan Gratuito (Free)
- 1 establecimiento por cuenta
- Perfil público básico
- Hasta 5 eventos activos
- Hasta 3 convocatorias activas
- Búsqueda estándar de músicos
- Estadísticas básicas

### 5.2 Plan PRO ($XX/mes)
- Todo lo del plan gratuito
- Perfil destacado
- Eventos ilimitados
- Convocatorias ilimitadas
- Filtros avanzados de búsqueda
- Estadísticas avanzadas
- Sello "PRO"
- Prioridad en resultados de búsqueda

### 5.3 Plan Atlas ($XXX/mes)
- Todo lo del plan PRO
- Posicionamiento geográfico prioritario
- Gestión de múltiples administradores
- Promoción prioritaria de eventos
- Reportes comerciales avanzados
- Integración con reservas (futuro)
- API access (futuro)
- Soporte prioritario

---

## 6. Flujos de Usuario

### 6.1 Registro de Establecimiento
1. Usuario autenticado va a `venue-register.html`
2. Completa formulario con información básica
3. Selecciona plan (Free por defecto)
4. Verificación de email/telefono del establecimiento
5. Revisión por equipo PROVIWEB (para verificación)
6. Perfil activado

### 6.2 Músico Postulándose
1. Músico navega `venues-explore.html`
2. Encuentra establecimiento → `venue-profile.html`
3. Ve convocatorias abiertas o botón "Postularme"
4. Si hay convocatoria → `venue-call-detail.html`
5. Envía postulación con mensaje y demos
6. Recibe notificación de respuesta

### 6.3 Venue Contratando
1. Dueño entra a `venue-dashboard.html`
2. Busca músicos o crea convocatoria
3. Recibe postulaciones en `venue-applications.html`
4. Revisa perfiles de músicos
5. Acepta/rechaza postulaciones
6. Confirma evento en agenda

---

## 7. Seguridad y Validaciones

### 7.1 Reglas de Acceso
- Solo usuarios autenticados pueden crear venues
- Solo el owner puede modificar su venue
- Los reviews solo pueden dejarse después de eventos confirmados
- Las postulaciones solo pueden hacerse a convocatorias abiertas

### 7.2 Validaciones Importantes
- Verificar que el usuario no tenga un venue activo (plan Free)
- Validar fechas de eventos (no pueden ser en el pasado)
- Verificar que el venue tenga plan activo para ciertas funciones
- Rate limiting en postulaciones (anti-spam)
