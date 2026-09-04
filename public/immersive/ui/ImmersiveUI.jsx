/**
 * PROVIWEB - UI Inmersiva (Mejorada v2.0)
 * Diseño más claro, profesional y funcional
 */

import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';
import './immersive-ui.css';

// Zonas del mundo - Coordenadas actualizadas (120 de separación)
const ZONES = [
  { id: 'hub', name: 'Centro Creativo', icon: '🏛️', color: '#a855f7', position: [0, 0, 0] },
  { id: 'feed', name: 'Valle del Feed', icon: '📝', color: '#007BFF', position: [0, 0, -120] },
  { id: 'music', name: 'Armonía Musical', icon: '🎵', color: '#f43f5e', position: [120, 0, 0] },
  { id: 'art', name: 'Galería Etereal', icon: '🎨', color: '#ec4899', position: [120, 0, -120] },
  { id: 'social', name: 'Puente Social', icon: '👥', color: '#8b5cf6', position: [0, 0, 120] },
  { id: 'learn', name: 'Monte del Conocimiento', icon: '📚', color: '#10b981', position: [-120, 0, -120] },
  { id: 'market', name: 'Bazar Creativo', icon: '🛒', color: '#f59e0b', position: [-120, 0, 120] },
  { id: 'events', name: 'Plaza de Eventos', icon: '📅', color: '#6366f1', position: [120, 0, 120] },
  { id: 'opportunities', name: 'Horizonte de Oportunidades', icon: '💼', color: '#06b6d4', position: [-120, 0, 0] }
];

// Funciones de creación
const CREATOR_FUNCTIONS = [
  { id: 'create-post', name: 'Nuevo Post', icon: '📝', color: '#a855f7', action: 'create-post' },
  { id: 'upload-music', name: 'Subir Música', icon: '🎵', color: '#f43f5e', action: 'upload-music' },
  { id: 'upload-art', name: 'Subir Arte', icon: '🎨', color: '#ec4899', action: 'upload-art' },
  { id: 'create-event', name: 'Crear Evento', icon: '📅', color: '#6366f1', action: 'create-event' }
];

const MISSIONS_STORAGE_KEY = 'proviweb_immersive_weekly_missions_v1';

const getCurrentWeekKey = () => {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  now.setDate(now.getDate() - day);
  now.setHours(0, 0, 0, 0);
  return now.toISOString().slice(0, 10);
};

const createInitialMissionState = () => ({
  weekKey: getCurrentWeekKey(),
  exploredZones: [],
  inspectedItems: 0,
  opportunitiesApplied: 0
});

const sanitizeMissionState = (rawState) => {
  if (!rawState || typeof rawState !== 'object') return createInitialMissionState();
  const expectedWeek = getCurrentWeekKey();
  if (rawState.weekKey !== expectedWeek) return createInitialMissionState();
  return {
    weekKey: expectedWeek,
    exploredZones: Array.isArray(rawState.exploredZones) ? rawState.exploredZones : [],
    inspectedItems: Number(rawState.inspectedItems) || 0,
    opportunitiesApplied: Number(rawState.opportunitiesApplied) || 0
  };
};

const EVENT_REMINDERS_KEY = 'proviweb_immersive_event_reminders_v1';

const asTimestamp = (value, fallback = 0) => {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
};

const parseEventTimestamp = (event) => {
  return asTimestamp(
    event?.eventTimestamp ??
      event?.timestamp ??
      event?.eventDate ??
      event?.date ??
      event?.createdAt,
    0
  );
};

const formatCountdown = (targetMs, nowMs) => {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m ${secs}s`;
};

// ==================== COMPONENTES ====================

// Badge de zona actual
const ZoneBadge = ({ currentZone }) => {
  const zone = ZONES.find(z => z.id === currentZone) || ZONES[0];
  
  return (
    <div className="ui-badge" style={{ borderColor: zone.color }}>
      <span className="ui-badge-icon" style={{ background: zone.color }}>
        {zone.icon}
      </span>
      <div className="ui-badge-content">
        <span className="ui-badge-label">ZONA ACTUAL</span>
        <span className="ui-badge-name">{zone.name}</span>
      </div>
    </div>
  );
};

// Navegador de zonas
const ZoneNavigator = ({ currentZone, onZoneChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Viaje a zona con animación cinematográfica
  const handleZoneSelect = (zone) => {
    setIsOpen(false);
    
    // Posiciones de cámara para cada zona - VISTA FRONTAL a los monumentos
    const zonePositions = {
      hub: { pos: [0, 25, 80], lookAt: [0, 12, 0] },
      feed: { pos: [0, 20, -60], lookAt: [0, 15, -120] },
      music: { pos: [60, 20, 40], lookAt: [120, 12, 0] },
      art: { pos: [60, 20, -60], lookAt: [120, 15, -120] },
      social: { pos: [0, 20, 60], lookAt: [0, 12, 120] },
      learn: { pos: [-60, 25, -60], lookAt: [-120, 18, -120] },
      market: { pos: [-60, 20, 60], lookAt: [-120, 12, 120] },
      events: { pos: [60, 20, 60], lookAt: [120, 12, 120] },
      opportunities: { pos: [-60, 20, 40], lookAt: [-120, 12, 0] }
    };
    
    if (onZoneChange) {
      onZoneChange(zone.id);
    }
    
    // Evento para iniciar viaje cinematográfico
    const target = zonePositions[zone.id];
    window.dispatchEvent(new CustomEvent('proviweb:immersive:teleport', {
      detail: { 
        position: target.pos,
        lookAt: target.lookAt
      }
    }));
  };

  return (
    <div className="ui-dropdown" ref={dropdownRef}>
      <button 
        className="ui-btn ui-btn-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="ui-btn-icon">🧭</span>
        Viajar a zona
      </button>
      
      {isOpen && (
        <div className="ui-dropdown-menu">
          <div className="ui-dropdown-header">
            <span>🗺️ Mapa de Zonas</span>
          </div>
          <div className="ui-dropdown-list">
            {ZONES.map(zone => (
              <button
                key={zone.id}
                className={`ui-dropdown-item ${currentZone === zone.id ? 'active' : ''}`}
                onClick={() => handleZoneSelect(zone)}
              >
                <span style={{ color: zone.color }}>{zone.icon}</span>
                <span className="ui-dropdown-item-name">{zone.name}</span>
                {currentZone === zone.id && (
                  <span className="ui-dropdown-current">📍</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Menú de creación
const CreatorMenu = ({ onFunctionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFunctionClick = (func) => {
    setIsOpen(false);
    
    // Navegar a la página correspondiente
    const routes = {
      'create-post': '/home.html#create-post',
      'upload-music': '/home.html#music/upload',
      'upload-art': '/home.html#art',
      'create-event': '/home.html#events'
    };
    
    window.location.href = routes[func.id] || '/home.html';
  };

  return (
    <div className="ui-dropdown" ref={dropdownRef}>
      <button 
        className="ui-btn ui-btn-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="ui-btn-icon">✨</span>
        Crear
      </button>
      
      {isOpen && (
        <div className="ui-dropdown-menu ui-dropdown-menu-right">
          <div className="ui-dropdown-header">
            <span>🚀 Crear Contenido</span>
          </div>
          <div className="ui-dropdown-list">
            {CREATOR_FUNCTIONS.map(func => (
              <button
                key={func.id}
                className="ui-dropdown-item"
                onClick={() => handleFunctionClick(func)}
              >
                <span style={{ color: func.color }}>{func.icon}</span>
                <span className="ui-dropdown-item-name">{func.name}</span>
                <span className="ui-dropdown-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Minimapa - Escala ajustada para nuevas distancias
const Minimap = ({ playerPosition = [0, 0, 0] }) => {
  const mapScale = 0.25; // Escala reducida para las nuevas distancias mayores
  const centerX = 75;
  const centerY = 75;
  
  // Asegurar que playerPosition sea un array válido
  const pos = playerPosition || [0, 0, 0];
  const playerX = centerX + ((pos[0] || 0) * mapScale);
  const playerZ = centerY + ((pos[2] || 0) * mapScale);
  
  return (
    <div className="ui-panel ui-minimap">
      <div className="ui-panel-header">
        <span>🗺️ Mapa</span>
      </div>
      <div className="ui-minimap-container">
        <svg viewBox="0 0 150 150" className="ui-minimap-svg">
          {/* Fondo */}
          <rect width="150" height="150" fill="rgba(0,0,0,0.5)" rx="8" />
          
          {/* Ejes */}
          <line x1="75" y1="0" x2="75" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1="75" x2="150" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          
          {/* Zonas como puntos */}
          {ZONES.map(zone => {
            const zonePos = zone.position || [0, 0, 0];
            const zx = centerX + ((zonePos[0] || 0) * mapScale);
            const zy = centerY + ((zonePos[2] || 0) * mapScale);
            return (
              <g key={zone.id}>
                <circle cx={zx} cy={zy} r="8" fill={zone.color} opacity="0.3" />
                <circle cx={zx} cy={zy} r="4" fill={zone.color} />
              </g>
            );
          })}
          
          {/* Jugador */}
          <circle cx={playerX} cy={playerZ} r="6" fill="#00d9ff" className="ui-player-dot" />
          <circle cx={playerX} cy={playerZ} r="10" stroke="#00d9ff" strokeWidth="2" fill="none" opacity="0.5">
            <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
        <div className="ui-coords">
          <span>X: {Math.round(pos[0] || 0)}</span>
          <span>Z: {Math.round(pos[2] || 0)}</span>
        </div>
      </div>
    </div>
  );
};

// Panel de ayuda/controles
const ControlsHelp = () => {
  const [collapsed, setCollapsed] = useState(true);
  
  const controls = [
    { key: '🧭 Viajar a...', action: 'Selecciona una zona del menú superior' },
    { key: '👆 Click', action: 'En portales para entrar' },
    { key: '🖱️ Click', action: 'En posts para ver detalles' },
  ];

  return (
    <div className={`ui-panel ui-help ${collapsed ? 'collapsed' : ''}`}>
      <button className="ui-help-toggle" onClick={() => setCollapsed(!collapsed)}>
        <span>{collapsed ? '❓' : '✕'}</span>
        {collapsed ? <span>Controles</span> : <span>Ocultar</span>}
      </button>
      
      {!collapsed && (
        <div className="ui-help-content">
          <div className="ui-panel-header">
            <span>🎮 Controles</span>
          </div>
          <div className="ui-controls-list">
            {controls.map((ctrl, i) => (
              <div key={i} className="ui-control-item">
                <kbd className="ui-key">{ctrl.key}</kbd>
                <span>{ctrl.action}</span>
              </div>
            ))}
          </div>
          <div className="ui-tips">
            <p>💡 <strong>Tip:</strong> Usa el menú "Viajar a zona" para navegar</p>
            <p>💡 <strong>Tip:</strong> Clic en posts para ver detalles</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Presencia en tiempo real
const PresencePulse = () => {
  const [state, setState] = useState({ total: 0, online: 0, names: [] });

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'Users');
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const now = Date.now();
        const users = Object.entries(snapshot.val() || {}).map(([uid, user]) => ({
          uid,
          name: user?.name || user?.username || 'Usuario',
          status: String(user?.status || '').toLowerCase(),
          lastSeen: asTimestamp(user?.lastActive ?? user?.timestamp ?? user?.pTime ?? user?.updatedAt, 0)
        }));

        const onlineUsers = users.filter((user) => {
          if (user.status === 'online') return true;
          if (!user.lastSeen) return false;
          return now - user.lastSeen <= 10 * 60 * 1000;
        });

        setState({
          total: users.length,
          online: onlineUsers.length,
          names: onlineUsers.slice(0, 5).map((user) => user.name)
        });
      },
      () => {
        setState({ total: 0, online: 0, names: [] });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <aside className="ui-panel ui-presence">
      <div className="ui-panel-header">
        <span>Live comunidad</span>
      </div>
      <div className="ui-presence-content">
        <p><strong>{state.online}</strong> conectados ahora</p>
        <small>Total comunidad: {state.total}</small>
        {state.names.length > 0 && (
          <div className="ui-presence-users">
            {state.names.map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

// Eventos en vivo + countdown + recordatorio
const LiveEventsPanel = () => {
  const [events, setEvents] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [reminders, setReminders] = useState({});

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EVENT_REMINDERS_KEY);
      setReminders(raw ? JSON.parse(raw) : {});
    } catch (error) {
      setReminders({});
    }
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const eventsRef = ref(db, 'Events');

    const unsubscribe = onValue(
      eventsRef,
      (snapshot) => {
        const list = Object.entries(snapshot.val() || {})
          .map(([id, event]) => {
            const eventTs = parseEventTimestamp(event);
            return {
              id,
              title: event?.title || event?.name || 'Evento',
              location: event?.location || event?.city || event?.place || 'Sin ubicacion',
              eventTs
            };
          })
          .filter((event) => event.eventTs > 0)
          .sort((a, b) => a.eventTs - b.eventTs)
          .slice(0, 4);

        setEvents(list);
      },
      () => {
        setEvents([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveReminder = (event) => {
    const next = {
      ...reminders,
      [event.id]: {
        eventId: event.id,
        title: event.title,
        eventTs: event.eventTs,
        createdAt: Date.now()
      }
    };
    setReminders(next);
    try {
      localStorage.setItem(EVENT_REMINDERS_KEY, JSON.stringify(next));
    } catch (error) {}
  };

  if (events.length === 0) return null;

  return (
    <aside className="ui-panel ui-live-events">
      <div className="ui-panel-header">
        <span>Eventos en vivo</span>
      </div>
      <div className="ui-live-events-list">
        {events.map((event) => {
          const diff = event.eventTs - now;
          const isLive = diff <= 0 && diff > -2 * 60 * 60 * 1000;
          return (
            <article key={event.id} className={`ui-live-event-item ${isLive ? 'live' : ''}`}>
              <strong>{event.title}</strong>
              <small>{event.location}</small>
              <span>{isLive ? 'EN VIVO' : `Empieza en ${formatCountdown(event.eventTs, now)}`}</span>
              <button
                type="button"
                onClick={() => saveReminder(event)}
                disabled={Boolean(reminders[event.id])}
              >
                {reminders[event.id] ? 'Recordado' : 'Recordarme'}
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
};

// Misiones semanales
const WeeklyMissions = ({ currentZone = 'hub' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [state, setState] = useState(createInitialMissionState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
      if (!raw) {
        setState(createInitialMissionState());
        return;
      }
      setState(sanitizeMissionState(JSON.parse(raw)));
    } catch (error) {
      setState(createInitialMissionState());
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {}
  }, [state]);

  useEffect(() => {
    if (!currentZone) return;
    setState((prev) => {
      const current = sanitizeMissionState(prev);
      if (current.exploredZones.includes(currentZone)) return current;
      return {
        ...current,
        exploredZones: [...current.exploredZones, currentZone]
      };
    });
  }, [currentZone]);

  useEffect(() => {
    const onItemView = () => {
      setState((prev) => {
        const current = sanitizeMissionState(prev);
        return {
          ...current,
          inspectedItems: current.inspectedItems + 1
        };
      });
    };

    const onApplied = () => {
      setState((prev) => {
        const current = sanitizeMissionState(prev);
        return {
          ...current,
          opportunitiesApplied: current.opportunitiesApplied + 1
        };
      });
    };

    window.addEventListener('proviweb:immersive:item-view', onItemView);
    window.addEventListener('proviweb:immersive:opportunity-applied', onApplied);
    return () => {
      window.removeEventListener('proviweb:immersive:item-view', onItemView);
      window.removeEventListener('proviweb:immersive:opportunity-applied', onApplied);
    };
  }, []);

  const missions = [
    {
      id: 'zones',
      icon: '🧭',
      name: 'Explorador semanal',
      target: 5,
      value: state.exploredZones.length,
      reward: 'Badge Explorador'
    },
    {
      id: 'items',
      icon: '🔍',
      name: 'Curador de contenido',
      target: 12,
      value: state.inspectedItems,
      reward: '80 XP'
    },
    {
      id: 'apply',
      icon: '🎯',
      name: 'Talento activo',
      target: 1,
      value: state.opportunitiesApplied,
      reward: 'Sello Postulante'
    }
  ];

  const completed = missions.filter((mission) => mission.value >= mission.target).length;
  const overallProgress = missions.reduce((acc, mission) => {
    const ratio = Math.min(1, mission.value / mission.target);
    return acc + ratio;
  }, 0) / missions.length;

  return (
    <aside className={`ui-panel ui-missions ${collapsed ? 'collapsed' : ''}`}>
      <button className="ui-missions-toggle" onClick={() => setCollapsed((prev) => !prev)}>
        <span>{collapsed ? '🎮' : '✕'}</span>
        <span>{collapsed ? 'Misiones' : 'Ocultar'}</span>
      </button>

      {!collapsed && (
        <div className="ui-missions-content">
          <div className="ui-panel-header">
            <span>🏆 Misiones semanales</span>
          </div>
          <div className="ui-missions-summary">
            <p><strong>{completed}/3</strong> misiones completadas</p>
            <div className="ui-missions-progress">
              <span style={{ width: `${Math.max(4, overallProgress * 100)}%` }} />
            </div>
          </div>
          <div className="ui-missions-list">
            {missions.map((mission) => {
              const percent = Math.min(100, (mission.value / mission.target) * 100);
              const done = mission.value >= mission.target;
              return (
                <article key={mission.id} className={`ui-mission-item ${done ? 'done' : ''}`}>
                  <div className="ui-mission-top">
                    <strong>{mission.icon} {mission.name}</strong>
                    <span>{mission.value}/{mission.target}</span>
                  </div>
                  <div className="ui-mission-bar">
                    <span style={{ width: `${Math.max(4, percent)}%` }} />
                  </div>
                  <small>Recompensa: {mission.reward}</small>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

// Contador de FPS
const FPSCounter = () => {
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;
    
    const updateFPS = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(updateFPS);
    };
    
    animationId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="ui-fps">
      <span className={`ui-fps-value ${fps < 30 ? 'low' : fps > 55 ? 'high' : ''}`}>
        {fps}
      </span>
      <span className="ui-fps-label">FPS</span>
    </div>
  );
};

// Barra superior
const TopBar = ({ currentZone, onZoneChange }) => (
  <div className="ui-top-bar">
    <div className="ui-top-left">
      <ZoneBadge currentZone={currentZone} />
    </div>
    
    <div className="ui-top-center">
      <ZoneNavigator currentZone={currentZone} onZoneChange={onZoneChange} />
      <CreatorMenu />
    </div>
    
    <div className="ui-top-right">
      <FPSCounter />
      <button 
        className="ui-btn ui-btn-outline"
        onClick={() => window.location.href = '/home.html'}
      >
        🏠 Salir
      </button>
    </div>
  </div>
);

// Componente principal
export const ImmersiveUI = ({ currentZone = 'hub', onZoneChange, playerPosition = [0, 0, 0] }) => {
  return (
    <div className="immersive-ui">
      <TopBar currentZone={currentZone} onZoneChange={onZoneChange} />
      <PresencePulse />
      <LiveEventsPanel />
      <WeeklyMissions currentZone={currentZone} />
      <Minimap playerPosition={playerPosition} />
      <ControlsHelp />
    </div>
  );
};

export default ImmersiveUI;
