# PROVIWEB - Modo Experiencia Inmersiva

## Descripción

Modo de navegación inmersiva 3D para PROVIWEB, inspirado en la atmósfera y fluidez de Journey (2012).

## Características

- 🎮 **Mundo 3D explorativo** - Navega la red social como un entorno tridimensional
- ✨ **Transiciones cinematográficas** - Cambios de zona fluidos con GSAP
- 🎨 **Zonas temáticas únicas** - Cada sección del home tiene su propio espacio 3D
- ⚡ **Navegación sin recargas** - SPA (Single Page Application) completa
- 🔮 **Atmósfera dinámica** - Partículas, niebla e iluminación estilo Journey
- 📱 **Fallback inteligente** - Detección de capacidad del dispositivo
- 💳 **Sistema de pagos** - Integración PayPal para acceso premium ($20 USD)

## Estructura de Carpetas

```
immersive/
├── components/
│   ├── zones/              # Zonas 3D del mundo
│   │   ├── ZoneBase.jsx    # Componentes base reutilizables
│   │   ├── HubZone.jsx     # Centro de navegación
│   │   ├── FeedZone.jsx    # Posts y reels
│   │   ├── MusicZone.jsx   # Sección musical
│   │   ├── OpportunitiesZone.jsx
│   │   ├── SocialZone.jsx
│   │   ├── ArtZone.jsx
│   │   ├── LearnZone.jsx
│   │   ├── MarketZone.jsx
│   │   └── EventsZone.jsx
│   └── ImmersiveWorld.jsx  # Mundo 3D principal
├── ui/
│   ├── ImmersiveUI.jsx     # Interfaz de usuario
│   └── immersive-styles.css # Estilos CSS
├── payment/
│   └── paypal-integration.js # Integración PayPal
├── utils/
│   └── device-detector.js   # Detección de capacidades
├── config.js               # Configuración global
├── immersive-entry.jsx     # Punto de entrada React
├── integration.js          # Integración con home.html
└── index.js                # Exportaciones principales
```

## Zonas Disponibles

| Zona | ID | Secciones Representadas |
|------|----|-------------------------|
| Centro Creativo | `hub` | Punto de partida |
| Valle del Feed | `feed` | Posts, Reels |
| Armonía Musical | `music` | Música, Top Plays, Destacados |
| Horizonte de Oportunidades | `opportunities` | Convocatorias, Colaboraciones |
| Puente Social | `social` | Contactos, Chat |
| Galería Etereal | `art` | Arte, Galería |
| Monte del Conocimiento | `learn` | Tutoriales, Educación |
| Bazar Creativo | `market` | Marketplace |
| Plaza de Eventos | `events` | Eventos, En vivo |

## Uso

### Activar desde el home.html

El botón "Modo Inmersivo" aparece automáticamente en el header de navegación.

### URL con parámetro

```
https://proviweb.com/home.html?mode=immersive
```

### API JavaScript

```javascript
// Importar funciones
import { startImmersiveMode, stopImmersiveMode } from './immersive/index.js';

// Iniciar modo inmersivo
await startImmersiveMode();

// Detener modo inmersivo
stopImmersiveMode();
```

## Configuración

Editar `immersive/config.js` para personalizar:

- Precio del premium
- Colores de zonas
- Calidad de renderizado
- Cantidad de partículas
- Velocidad de animaciones

## Requisitos Técnicos

- WebGL 2.0 (o 1.0 con funcionalidad limitada)
- GPU con soporte para texturas de al menos 1024px
- 4GB RAM recomendada
- Navegador moderno (Chrome, Firefox, Edge, Safari)

## Optimizaciones

- Lazy loading de componentes 3D
- Reducción automática de calidad en dispositivos de baja capacidad
- Partículas desactivables
- LOD (Level of Detail) para geometrías complejas
- Culling de objetos fuera de cámara

## Licencia

Parte de PROVIWEB - Todos los derechos reservados.
