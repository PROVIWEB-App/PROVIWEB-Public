/**
 * PROVIWEB - Mundo Inmersivo v9.0 - MONUMENTOS + ITEMS ORBITALES
 * Monumentos arquitectonicos con contenido orbital interactivo
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { getDatabase, ref as dbRef, get as dbGet, set as dbSet } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

// Efectos visuales
import { StarField, AuroraBorealis, Comets, ShootingStars, NebulaPremium, VolumetricRays } from './effects/CinematicEffects.jsx';

// Monumentos arquitectonicos
import {
  FeedMonument,
  MusicMonument,
  ArtMonument,
  EventsMonument,
  MarketMonument,
  LearnMonument,
  HubMonument
} from './monuments/SectionMonuments.jsx';

// Items orbitales
import { OrbitalSystem } from './content/OrbitalItems.jsx';

// Audio
import { BackgroundMusic } from './audio/BackgroundMusic.jsx';

// Camara
import { StaticCamera, ZONE_POSITIONS } from './player/StaticCamera.jsx';

// Hooks
import { useAllContentRealtime } from '../hooks/useFirebaseData.js';

// Componentes estaticos
const SpaceFog = memo(() => (
  <>
    <fog attach="fog" color="#050010" near={50} far={500} />
    <color attach="background" args={['#020005']} />
  </>
));

const Lighting = memo(() => (
  <>
    <ambientLight color="#1a0a3e" intensity={0.4} />
    <directionalLight color="#a855f7" intensity={0.6} position={[100, 200, 100]} />
    <pointLight color="#00d9ff" intensity={0.8} position={[0, 150, 0]} distance={500} />
    <pointLight color="#f43f5e" intensity={0.5} position={[200, 100, -200]} distance={400} />
    <hemisphereLight skyColor="#a855f7" groundColor="#0a0014" intensity={0.5} />
  </>
));

const LoadingScreen = memo(({ stats }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #0a0014 0%, #000001 100%)',
    zIndex: 9999
  }}>
    <div style={{
      width: '150px',
      height: '150px',
      border: '3px solid transparent',
      borderTopColor: '#a855f7',
      borderRightColor: '#00d9ff',
      borderRadius: '50%',
      animation: 'spin 2s linear infinite'
    }} />
    <h1 style={{
      marginTop: '40px',
      fontSize: '42px',
      background: 'linear-gradient(135deg, #a855f7, #00d9ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 'bold',
      letterSpacing: '12px',
      textTransform: 'uppercase'
    }}>
      PROVIWEB
    </h1>
    <p style={{ color: '#666', marginTop: '20px', fontSize: '14px', letterSpacing: '2px' }}>
      {stats ? 'Cargando experiencia cosmica...' : 'Cargando universo...'}
    </p>
  </div>
));

// ==================== RENDERERS DE CONTENIDO POR TIPO ====================
const FALLBACK_AVATAR = '/assets/avatar.png';

const getSafeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const out = String(value).trim();
  return out || fallback;
};

const getSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(168, 85, 247, ${alpha})`;
  }
  const clean = hex.replace('#', '');
  const six = clean.length === 3
    ? clean.split('').map((ch) => ch + ch).join('')
    : clean;
  if (six.length !== 6) {
    return `rgba(168, 85, 247, ${alpha})`;
  }
  const int = Number.parseInt(six, 16);
  if (!Number.isFinite(int)) {
    return `rgba(168, 85, 247, ${alpha})`;
  }
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const resolveAuthor = (item, fallbackName = 'Usuario') => {
  const name = getSafeText(item?.authorName || item?.userName || item?.artist || item?.name, fallbackName);
  const rawUsername = getSafeText(item?.authorUsername || item?.username || '');
  const username = rawUsername ? `@${rawUsername.replace(/^@+/, '')}` : '';
  const photo = getSafeText(item?.authorPhoto || item?.photo || item?.avatar, FALLBACK_AVATAR);
  return { name, username, photo };
};

const resolveImage = (item) => {
  if (!item || typeof item !== 'object') return '';
  if (item.image) return String(item.image);
  if (item.imageUrl) return String(item.imageUrl);
  if (item.cover) return String(item.cover);
  if (Array.isArray(item.images) && item.images.length > 0) {
    return String(item.images[0] || '');
  }
  return '';
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'A convenir';
  return `$${amount.toLocaleString('es-CO')}`;
};

const formatDateLabel = (value) => {
  const raw = getSafeText(value, '');
  if (!raw) return 'Proximamente';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const openHomeSection = (section, id) => {
  const cleanSection = getSafeText(section, 'home');
  const cleanId = getSafeText(id, '');
  const target = cleanId ? `/home.html#${cleanSection}/${encodeURIComponent(cleanId)}` : '/home.html';
  window.location.href = target;
};

const openUserProfile = (uid) => {
  const cleanUid = getSafeText(uid, '');
  if (!cleanUid) return;
  window.location.href = `/userprofile.html?uid=${encodeURIComponent(cleanUid)}`;
};

const applyOpportunityFromImmersive = async (item) => {
  const opportunityId = getSafeText(item?.id || item?.key, '');
  const userId = getSafeText(localStorage.getItem('proviweb_userid'), '');
  const username = getSafeText(localStorage.getItem('proviweb_username'), 'usuario');
  const userRole = getSafeText(localStorage.getItem('proviweb_role'), 'user');

  if (!opportunityId) {
    return { ok: false, message: 'No se pudo identificar la convocatoria.' };
  }

  if (!userId) {
    return { ok: false, message: 'Debes iniciar sesion para postularte.' };
  }

  if (item?.createdBy && item.createdBy === userId) {
    return { ok: false, message: 'No puedes postularte a tu propia convocatoria.' };
  }

  const visibility = getSafeText(item?.visibility, '').toLowerCase();
  if (visibility === 'private' && item?.createdBy !== userId) {
    return { ok: false, message: 'Esta convocatoria es privada.' };
  }

  const db = getDatabase();
  const appPath = `Opportunities/${opportunityId}/applications/${userId}`;
  const existingSnap = await dbGet(dbRef(db, appPath));
  if (existingSnap.exists()) {
    return { ok: false, message: 'Ya estas registrado en esta convocatoria.' };
  }

  let phone = '';
  try {
    const userSnap = await dbGet(dbRef(db, `Users/${userId}`));
    if (userSnap.exists()) {
      phone = getSafeText(userSnap.val()?.phone, '');
    }
  } catch (error) {}

  await dbSet(dbRef(db, appPath), {
    uid: userId,
    name: username,
    role: userRole,
    phone,
    status: 'pending',
    source: 'immersive',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  window.dispatchEvent(new CustomEvent('proviweb:immersive:opportunity-applied', {
    detail: { opportunityId, uid: userId }
  }));

  return { ok: true, message: 'Postulacion enviada con exito.' };
};

const reportItemFromImmersive = async (item, reason = 'content') => {
  const userId = getSafeText(localStorage.getItem('proviweb_userid'), '');
  const username = getSafeText(localStorage.getItem('proviweb_username'), 'usuario');
  if (!userId) {
    return { ok: false, message: 'Debes iniciar sesion para reportar.' };
  }

  const itemId = getSafeText(item?.id || item?.postId || item?.songId, '');
  const itemType = getSafeText(item?.kind || item?.type || reason, 'content');
  const createdAt = Date.now();
  const reportId = `rp_${createdAt}_${Math.floor(Math.random() * 10000)}`;
  const db = getDatabase();
  const reportPath = `Reports/${reportId}`;

  await dbSet(dbRef(db, reportPath), {
    id: reportId,
    reporterUid: userId,
    reporterName: username,
    itemId,
    itemType,
    targetUid: getSafeText(item?.authorId || item?.createdBy || item?.id, ''),
    reason,
    source: 'immersive',
    status: 'pending',
    createdAt
  });

  window.dispatchEvent(new CustomEvent('proviweb:immersive:item-reported', {
    detail: { reportId, itemId, itemType }
  }));

  return { ok: true, message: 'Reporte enviado al equipo.' };
};

const HomeLikeCard = memo(({
  item,
  hovered,
  isSelected,
  layoutMode = 'orbital',
  accent = '#a855f7',
  category = 'Contenido',
  title = 'Sin titulo',
  description = '',
  author,
  image = '',
  icon = '',
  badges = [],
  metrics = [],
  ctaLabel = 'Ver en home',
  onOpen,
  onReport,
  extraContent = null
}) => {
  const isRailLayout = layoutMode === 'rail';
  const isExpanded = Boolean(isSelected || isRailLayout);
  const width = isRailLayout ? 352 : isSelected ? 392 : hovered ? 226 : 188;
  const accentSoft = hexToRgba(accent, 0.2);
  const accentGlow = hexToRgba(accent, isExpanded ? 0.4 : 0.26);
  const canOpen = typeof onOpen === 'function';
  const canReport = typeof onReport === 'function';
  const finalAuthor = author || resolveAuthor(item);
  const normalizedDescription = getSafeText(description, 'Sin descripcion');

  return (
    <article
      className={`immersive-home-card ${isExpanded ? 'is-selected' : 'is-compact'} ${isRailLayout ? 'is-rail' : ''}`}
      style={{
        width: `${width}px`,
        borderColor: hovered || isExpanded ? accent : 'rgba(255,255,255,0.14)',
        boxShadow: hovered || isExpanded
          ? `0 16px 36px ${accentGlow}, 0 12px 26px rgba(0,0,0,0.52)`
          : '0 8px 22px rgba(0,0,0,0.46)',
        background: `linear-gradient(160deg, ${accentSoft} 0%, rgba(18,14,30,0.96) 42%, rgba(8,8,14,0.98) 100%)`
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="ihc-header">
        <div className="ihc-author">
          <img src={finalAuthor.photo || FALLBACK_AVATAR} alt="" className="ihc-avatar" />
          <div className="ihc-author-info">
            <strong>{finalAuthor.name}</strong>
            <span>{finalAuthor.username || category}</span>
          </div>
        </div>
        <span className="ihc-chip" style={{ color: accent, borderColor: hexToRgba(accent, 0.4) }}>
          {category}
        </span>
      </header>

      <h3 className="ihc-title">{getSafeText(title, 'Sin titulo')}</h3>

      <p className="ihc-desc">{normalizedDescription}</p>

      {image ? (
        <div className="ihc-media-wrap">
          <img src={image} alt="" className="ihc-media" />
        </div>
      ) : (
        icon ? <div className="ihc-icon-wrap">{icon}</div> : null
      )}

      {badges.length > 0 && (
        <div className="ihc-badge-row">
          {badges.filter(Boolean).slice(0, 4).map((badge, index) => (
            <span key={`${badge}-${index}`} className="ihc-badge">{badge}</span>
          ))}
        </div>
      )}

      {metrics.length > 0 && (
        <div className="ihc-metric-row">
          {metrics.filter(Boolean).slice(0, 3).map((metric, index) => (
            <span key={`${metric}-${index}`}>{metric}</span>
          ))}
        </div>
      )}

      {extraContent}

      {isExpanded && (canOpen || canReport) && (
        <div className="ihc-inline-actions">
          {canOpen && (
            <button type="button" className="ihc-action" style={{ background: accent }} onClick={onOpen}>
              {ctaLabel}
            </button>
          )}
          {canReport && (
            <button type="button" className="ihc-action ihc-action-danger" onClick={onReport}>
              Reportar
            </button>
          )}
        </div>
      )}
    </article>
  );
});

// Renderer para posts/feed/social/hub/oportunidades
const PostCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const text = getSafeText(item?.content || item?.description || item?.text, 'Sin contenido');
  const derivedTitle = getSafeText(item?.title, text.length > 70 ? `${text.slice(0, 70)}...` : text);
  const likes = getSafeNumber(item?.likes);
  const comments = getSafeNumber(item?.comments);
  const kind = getSafeText(item?.type || item?.kind, 'Post');
  const author = resolveAuthor(item, 'Usuario');

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#a855f7"
      category={kind}
      title={derivedTitle || 'Publicacion'}
      description={text}
      author={author}
      image={resolveImage(item)}
      badges={[getSafeText(item?.city, ''), getSafeText(item?.country, '')]}
      metrics={[`Likes ${likes}`, `Comentarios ${comments}`]}
      ctaLabel="Ver en home"
      onOpen={() => openHomeSection('post', item?.postId || item?.id)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'post');
        if (result?.message) window.alert(result.message);
      }}
    />
  );
});

// Renderer para musica
const MusicCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const title = getSafeText(item?.title, 'Pista de audio');
  const artist = getSafeText(item?.artist, 'Artista');
  const author = {
    name: artist,
    username: '',
    photo: getSafeText(item?.cover, FALLBACK_AVATAR)
  };
  const audioUrl = getSafeText(item?.audioUrl || item?.url, '');
  const plays = getSafeNumber(item?.plays || item?.stats?.plays);
  const likes = getSafeNumber(item?.likes);

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#f43f5e"
      category="Musica"
      title={title}
      description={`Artista: ${artist}`}
      author={author}
      image={resolveImage(item)}
      icon="â™ª"
      badges={[getSafeText(item?.genre, ''), getSafeText(item?.duration, '')]}
      metrics={[`Reproducciones ${plays}`, `Likes ${likes}`]}
      ctaLabel="Abrir musica"
      onOpen={() => openHomeSection('music', item?.id || item?.songId)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'music');
        if (result?.message) window.alert(result.message);
      }}
      extraContent={(isSelected || layoutMode === 'rail') && audioUrl ? (
        <audio controls className="immersive-home-audio">
          <source src={audioUrl} type="audio/mpeg" />
        </audio>
      ) : null}
    />
  );
});

// Renderer para arte
const ArtCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const title = getSafeText(item?.title, 'Obra');
  const artist = getSafeText(item?.artist || item?.authorName, 'Artista');
  const author = resolveAuthor(item, artist);

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#ec4899"
      category="Arte"
      title={title}
      description={getSafeText(item?.description || item?.content, `Autor: ${artist}`)}
      author={author}
      image={resolveImage(item)}
      badges={[getSafeText(item?.discipline, ''), getSafeText(item?.style, '')]}
      metrics={[`Likes ${getSafeNumber(item?.likes)}`, `Comentarios ${getSafeNumber(item?.comments)}`]}
      ctaLabel="Ver obra"
      onOpen={() => openHomeSection('art', item?.postId || item?.id)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'art');
        if (result?.message) window.alert(result.message);
      }}
    />
  );
});

// Renderer para eventos
const EventCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const title = getSafeText(item?.title || item?.name, 'Evento');
  const location = getSafeText(item?.location || item?.city || item?.place, 'Ubicacion por confirmar');
  const dateLabel = formatDateLabel(item?.date || item?.eventDate);
  const attendees = getSafeNumber(item?.attendees || item?.attendeesCount);
  const organizer = getSafeText(item?.organizer || item?.authorName, 'Organizador');
  const author = resolveAuthor(item, organizer);

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#6366f1"
      category="Evento"
      title={title}
      description={`${dateLabel} - ${location}`}
      author={author}
      image={resolveImage(item)}
      badges={[dateLabel, location]}
      metrics={[`Asistentes ${attendees}`]}
      ctaLabel="Ver evento"
      onOpen={() => openHomeSection('events', item?.id)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'event');
        if (result?.message) window.alert(result.message);
      }}
    />
  );
});

// Renderer para productos del market
const ProductCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const productName = getSafeText(item?.name || item?.title, 'Producto');
  const description = getSafeText(item?.description || item?.content, 'Producto publicado en PROVIWEB');
  const priceLabel = formatMoney(item?.price || item?.value);
  const seller = getSafeText(item?.sellerName || item?.authorName || item?.artist, 'Vendedor');
  const author = resolveAuthor(item, seller);

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#f59e0b"
      category="Marketplace"
      title={productName}
      description={description}
      author={author}
      image={resolveImage(item)}
      badges={[priceLabel, getSafeText(item?.condition, ''), getSafeText(item?.city, '')]}
      metrics={[getSafeText(item?.currency, 'COP')]}
      ctaLabel="Ver producto"
      onOpen={() => openHomeSection('market', item?.id)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'market');
        if (result?.message) window.alert(result.message);
      }}
    />
  );
});

// Renderer para formacion/tutoriales
const CourseCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const title = getSafeText(item?.title, 'Tutorial');
  const description = getSafeText(item?.description || item?.text, 'Contenido educativo para la comunidad');
  const level = getSafeText(item?.level || item?.nivel, 'Todos los niveles');
  const author = resolveAuthor(item, 'Formacion PROVIWEB');

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#10b981"
      category="Formacion"
      title={title}
      description={description}
      author={author}
      image={resolveImage(item)}
      icon={getSafeText(item?.icon, 'Libro')}
      badges={[level, getSafeText(item?.type, 'Tutorial')]}
      metrics={[getSafeText(item?.duration, ''), getSafeText(item?.category, '')]}
      ctaLabel="Abrir en home"
      onOpen={() => openHomeSection('learn', item?.id)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'learn');
        if (result?.message) window.alert(result.message);
      }}
    />
  );
});

// Renderer para aliados dentro del pabellon del hub
const AllyCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const allyName = getSafeText(item?.title || item?.authorName, 'Aliado PROVIWEB');
  const description = getSafeText(item?.content, 'Aliado activo en el ecosistema creativo.');
  const role = getSafeText(item?.role, 'ally');
  const city = getSafeText(item?.city, '');
  const country = getSafeText(item?.country, '');
  const website = getSafeText(item?.website, '');
  const author = resolveAuthor(item, allyName);
  const profileUid = getSafeText(item?.authorId || item?.uid || String(item?.id || '').replace(/^ally_/, ''), '');

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#22c55e"
      category="Aliado"
      title={allyName}
      description={description}
      author={author}
      image={resolveImage(item)}
      badges={[role, city, country]}
      metrics={[website ? 'Web activa' : 'Sin web publicada']}
      ctaLabel="Ver perfil"
      onOpen={() => openUserProfile(profileUid)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'ally');
        if (result?.message) window.alert(result.message);
      }}
      extraContent={(isSelected || layoutMode === 'rail') && website ? (
        <button
          type="button"
          className="ihc-action ihc-action-secondary"
          onClick={() => window.open(website, '_blank', 'noopener')}
        >
          Visitar web
        </button>
      ) : null}
    />
  );
});

// Renderer para convocatorias/oportunidades
const OpportunityCard = memo(({ item, hovered, isSelected, layoutMode = 'orbital' }) => {
  const [applyState, setApplyState] = useState({ status: 'idle', message: '' });
  const title = getSafeText(item?.title, 'Convocatoria');
  const description = getSafeText(item?.description || item?.content, 'Nueva oportunidad para la comunidad');
  const author = resolveAuthor(item, 'Aliado');
  const applicants = getSafeNumber(
    item?.applicationsCount ||
    item?.likes ||
    (item?.applications ? Object.keys(item.applications).length : 0)
  );
  const visibility = getSafeText(item?.visibility, '');
  const modality = getSafeText(item?.modality, '');
  const pricing = getSafeText(item?.pricingModel, '');
  const discipline = getSafeText(item?.discipline || item?.category, '');
  const city = getSafeText(item?.city || item?.location, '');
  const isOwner = item?.createdBy && getSafeText(localStorage.getItem('proviweb_userid'), '') === item.createdBy;

  const handleApply = async () => {
    if (applyState.status === 'loading') return;
    setApplyState({ status: 'loading', message: 'Enviando postulacion...' });
    try {
      const result = await applyOpportunityFromImmersive(item);
      setApplyState({
        status: result.ok ? 'success' : 'error',
        message: result.message
      });
    } catch (error) {
      setApplyState({ status: 'error', message: 'No se pudo enviar la postulacion.' });
    }
  };

  return (
    <HomeLikeCard
      item={item}
      hovered={hovered}
      isSelected={isSelected}
      layoutMode={layoutMode}
      accent="#06b6d4"
      category="Convocatoria"
      title={title}
      description={description}
      author={author}
      image={resolveImage(item)}
      badges={[discipline, visibility, modality, pricing]}
      metrics={[`Postulados ${applicants}`, city]}
      ctaLabel="Ver convocatoria"
      onOpen={() => openHomeSection('opportunity', item?.id)}
      onReport={async () => {
        const result = await reportItemFromImmersive(item, 'opportunity');
        if (result?.message) window.alert(result.message);
      }}
      extraContent={(isSelected || layoutMode === 'rail') ? (
        <div className="ihc-inline-actions">
          {!isOwner && (
            <button
              type="button"
              className="ihc-action ihc-action-secondary"
              onClick={handleApply}
              disabled={applyState.status === 'loading'}
            >
              {applyState.status === 'loading' ? 'Enviando...' : 'Postularme ahora'}
            </button>
          )}
          {applyState.message && (
            <p className={`ihc-status ${applyState.status === 'success' ? 'success' : applyState.status === 'error' ? 'error' : ''}`}>
              {applyState.message}
            </p>
          )}
        </div>
      ) : null}
    />
  );
});

// Funcion para preparar datos de items con colores
const prepareItems = (items, sectionType) => {
  if (!items || !Array.isArray(items)) return [];
  
  const colors = {
    feed: '#a855f7',
    social: '#8b5cf6',
    opportunities: '#06b6d4',
    music: '#f43f5e',
    art: '#ec4899',
    events: '#6366f1',
    market: '#f59e0b',
    learn: '#10b981',
    hub: '#a855f7'
  };
  
  return items.slice(0, 12).map((item, i) => ({
    ...item,
    id: item.id || `item-${i}`,
    color: colors[sectionType] || '#a855f7'
  }));
};

const MONUMENT_RAIL_META = {
  hub: {
    title: 'Centro Creativo',
    subtitle: 'Aliados, publicaciones destacadas y actividad central.',
    accent: '#a855f7'
  },
  feed: {
    title: 'Feed Creativo',
    subtitle: 'Publicaciones y conversaciones activas de la comunidad.',
    accent: '#a855f7'
  },
  music: {
    title: 'Zona Musica',
    subtitle: 'Lanzamientos, artistas y pistas destacadas.',
    accent: '#f43f5e'
  },
  art: {
    title: 'Galeria de Arte',
    subtitle: 'Obras visuales, estilos y autores de la comunidad.',
    accent: '#ec4899'
  },
  social: {
    title: 'Comunidad',
    subtitle: 'Talento activo, perfiles y conexiones creativas.',
    accent: '#8b5cf6'
  },
  learn: {
    title: 'Zona Aprende',
    subtitle: 'Tutoriales, formacion y recursos educativos.',
    accent: '#10b981'
  },
  market: {
    title: 'Marketplace',
    subtitle: 'Productos y servicios para artistas y aliados.',
    accent: '#f59e0b'
  },
  events: {
    title: 'Eventos',
    subtitle: 'Activaciones, encuentros y agenda cultural.',
    accent: '#6366f1'
  },
  opportunities: {
    title: 'Convocatorias',
    subtitle: 'Oportunidades para participar, audicionar o colaborar.',
    accent: '#06b6d4'
  }
};

const MONUMENT_SHORTCUTS = {
  '0': 'hub',
  '1': 'feed',
  '2': 'music',
  '3': 'art',
  '4': 'events',
  '5': 'market',
  '6': 'learn',
  '7': 'social',
  '8': 'opportunities'
};

const KEYBOARD_SCROLL_STEP = 420;

// ==================== COMPONENTE PRINCIPAL ====================

const ImmersiveWorld = memo(({ currentZone, onZoneChange, onPlayerPositionChange }) => {
  const [isReady, setIsReady] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelMessage, setTravelMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeMonumentSection, setActiveMonumentSection] = useState(null);
  const railTrackRef = useRef(null);
  
  const { content, loading } = useAllContentRealtime();

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Reset seleccion al cambiar de zona
  useEffect(() => {
    setSelectedItem(null);
    setActiveMonumentSection(null);
  }, [currentZone]);

  const handlePositionChange = useCallback((pos) => {
    if (onPlayerPositionChange) onPlayerPositionChange(pos);
  }, [onPlayerPositionChange]);

  const handleTravelStart = useCallback((zoneName) => {
    setIsTraveling(true);
    setTravelMessage(`Iniciando viaje a ${zoneName}...`);
    setSelectedItem(null);
    setActiveMonumentSection(null);
  }, []);

  const handleTravelEnd = useCallback(() => {
    setIsTraveling(false);
    setTravelMessage('');
  }, []);

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
    window.dispatchEvent(new CustomEvent('proviweb:immersive:item-view', {
      detail: {
        itemId: getSafeText(item?.id, ''),
        kind: getSafeText(item?.kind || item?.type, currentZone),
        zone: currentZone
      }
    }));
  }, [currentZone]);

  const handleDeselectItem = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const closeMonumentRail = useCallback(() => {
    setActiveMonumentSection(null);
  }, []);

  const handleMonumentClick = useCallback((sectionKey) => {
    setSelectedItem(null);
    setActiveMonumentSection((prev) => (prev === sectionKey ? null : sectionKey));
  }, []);

  const scrollActiveRailBy = useCallback((delta) => {
    if (!railTrackRef.current) return;
    railTrackRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const scrollActiveRailToEdge = useCallback((edge) => {
    if (!railTrackRef.current) return;
    const target = edge === 'end' ? railTrackRef.current.scrollWidth : 0;
    railTrackRef.current.scrollTo({ left: target, behavior: 'smooth' });
  }, []);

  // Preparar items para cada seccion
  const sectionItems = useMemo(() => ({
    feed: prepareItems(content.posts, 'feed'),
    music: prepareItems(content.songs, 'music'),
    art: prepareItems(content.artworks, 'art'),
    events: prepareItems(content.events, 'events'),
    market: prepareItems(content.products, 'market'),
    learn: prepareItems(content.tutorials, 'learn'),
    social: prepareItems(content.users?.slice(0, 8), 'social'),
    opportunities: prepareItems(content.opportunities, 'opportunities'),
    hub: prepareItems(content.hub, 'hub')
  }), [content]);

  const renderCardForSection = useCallback((sectionType, item, hovered, isSelected, layoutMode = 'orbital') => {
    if (sectionType === 'hub') {
      if (item?.kind === 'ally') {
        return <AllyCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
      }
      return <PostCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'feed' || sectionType === 'social') {
      return <PostCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'music') {
      return <MusicCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'art') {
      return <ArtCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'events') {
      return <EventCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'market') {
      return <ProductCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'learn') {
      return <CourseCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    if (sectionType === 'opportunities') {
      return <OpportunityCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
    }
    return <PostCard item={item} hovered={hovered} isSelected={isSelected} layoutMode={layoutMode} />;
  }, []);

  const activeRailMeta = activeMonumentSection
    ? (MONUMENT_RAIL_META[activeMonumentSection] || MONUMENT_RAIL_META.hub)
    : null;
  const activeRailItems = activeMonumentSection ? (sectionItems[activeMonumentSection] || []) : [];

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!target || !(target instanceof Element)) return false;
      if (target.isContentEditable) return true;
      const tagName = target.tagName?.toLowerCase?.() || '';
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    };

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key;
      const normalized = typeof key === 'string' ? key.toLowerCase() : '';

      if (key === 'Escape' && activeMonumentSection) {
        event.preventDefault();
        closeMonumentRail();
        return;
      }

      const shortcutSection = MONUMENT_SHORTCUTS[key];
      if (shortcutSection) {
        event.preventDefault();
        handleMonumentClick(shortcutSection);
        return;
      }

      if (!activeMonumentSection) return;

      if (key === 'ArrowRight' || key === 'PageDown' || normalized === 'd') {
        event.preventDefault();
        scrollActiveRailBy(KEYBOARD_SCROLL_STEP);
        return;
      }

      if (key === 'ArrowLeft' || key === 'PageUp' || normalized === 'a') {
        event.preventDefault();
        scrollActiveRailBy(-KEYBOARD_SCROLL_STEP);
        return;
      }

      if (key === 'Home') {
        event.preventDefault();
        scrollActiveRailToEdge('start');
        return;
      }

      if (key === 'End') {
        event.preventDefault();
        scrollActiveRailToEdge('end');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeMonumentSection,
    closeMonumentRail,
    handleMonumentClick,
    scrollActiveRailBy,
    scrollActiveRailToEdge
  ]);

  if (!isReady || loading) {
    return <LoadingScreen stats={content?.stats} />;
  }

  return (
    <>
      <BackgroundMusic src="/assets/torresdearenalucida.mp3" volume={0.25} />
      
      {/* Overlay de viaje epico */}
      {isTraveling && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.9) 100%)',
          zIndex: 10000,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', animation: 'pulse 2s ease infinite' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.8))' }}>
              {'>>'}
            </div>
            <div style={{ 
              color: '#fff', fontSize: '24px', fontWeight: 'bold',
              textShadow: '0 0 30px rgba(168,85,247,0.8)', letterSpacing: '3px'
            }}>
              {travelMessage}
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay para item seleccionado - fondo oscuro */}
      {selectedItem && !activeMonumentSection && (
        <div 
          onClick={handleDeselectItem}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100,
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
        />
      )}
      
      {/* Instrucciones */}
      <div style={{
        position: 'fixed',
        bottom: '104px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        padding: '12px 24px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '30px',
        color: '#fff',
        fontSize: '13px',
        pointerEvents: 'none',
        border: '1px solid rgba(168,85,247,0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        Click en un monumento o usa 0-8. Flechas para scroll, Esc para cerrar.
      </div>

      {activeMonumentSection && (
        <section className="immersive-monument-rail" role="dialog" aria-modal="true" aria-label="Carrusel de contenido del monumento">
          <button
            type="button"
            className="imr-backdrop"
            aria-label="Cerrar carrusel"
            onClick={closeMonumentRail}
          />
          <div className="imr-shell" style={{ '--rail-accent': activeRailMeta?.accent || '#a855f7' }}>
            <header className="imr-header">
              <div className="imr-title-wrap">
                <strong>{activeRailMeta?.title || 'Contenido'}</strong>
                <p>{activeRailMeta?.subtitle || 'Explora contenido de esta zona.'}</p>
                <p className="imr-shortcuts">Atajos: 0 Hub, 1 Feed, 2 Musica, 3 Arte, 4 Eventos, 5 Market, 6 Aprende, 7 Comunidad, 8 Convocatorias, flechas izquierda/derecha para scroll, Esc cerrar.</p>
              </div>
              <button type="button" className="imr-close" onClick={closeMonumentRail}>
                Cerrar
              </button>
            </header>
            <div className="imr-track" ref={railTrackRef} role="list" aria-label="Contenido horizontal del monumento">
              {activeRailItems.length > 0 ? (
                activeRailItems.map((item, index) => (
                  <div key={`${activeMonumentSection}-${item?.id || index}`} className="imr-item" role="listitem">
                    {renderCardForSection(activeMonumentSection, item, false, false, 'rail')}
                  </div>
                ))
              ) : (
                <div className="imr-empty">
                  <strong>Sin contenido disponible por ahora</strong>
                  <p>Esta zona aun no tiene items publicados.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {currentZone === 'hub' && (content.allies?.length || 0) > 0 && (
        <aside className="immersive-allies-pavilion">
          <div className="iap-head">
            <strong>Pabellon de aliados</strong>
            <span>{content.stats?.totalAllies || content.allies.length} activos</span>
          </div>
          <div className="iap-list">
            {content.allies.slice(0, 3).map((ally) => (
              <article key={ally.id} className="iap-item">
                <img src={ally.authorPhoto || FALLBACK_AVATAR} alt="" />
                <div className="iap-item-info">
                  <strong>{ally.title || ally.authorName || 'Aliado'}</strong>
                  <span>{ally.authorUsername ? `@${ally.authorUsername}` : 'Aliado PROVIWEB'}</span>
                </div>
                <div className="iap-actions">
                  <button type="button" onClick={() => openUserProfile(ally.authorId)}>Perfil</button>
                  {ally.website ? (
                    <button type="button" onClick={() => window.open(ally.website, '_blank', 'noopener')}>Web</button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </aside>
      )}

      <Canvas
        shadows={true}
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.1, far: 1000, position: [0, 25, 80] }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true }}
        style={{ position: 'fixed', inset: 0, background: '#020005' }}
        frameloop="always"
      >
        <SpaceFog />
        <Lighting />
        
        {/* EFECTOS COSMICOS */}
        <StarField count={2000} />
        <AuroraBorealis position={[0, 100, -200]} color="#00d9ff" />
        <AuroraBorealis position={[100, 80, -150]} color="#a855f7" />
        <AuroraBorealis position={[-100, 90, -180]} color="#f43f5e" />
        <NebulaPremium position={[-200, 50, -200]} color="#a855f7" scale={2} />
        <NebulaPremium position={[200, 30, -250]} color="#00d9ff" scale={1.5} />
        <NebulaPremium position={[0, 60, -300]} color="#f43f5e" scale={1.8} />
        <Comets count={6} />
        <ShootingStars count={4} />
        <VolumetricRays position={[0, 150, 0]} color="#a855f7" />
        
        {/* MONUMENTOS ARQUITECTONICOS + ITEMS ORBITALES */}
        
        {/* Hub Central */}
        <group position={[0, 0, 0]}>
          <HubMonument
            position={[0, 0, 0]}
            shortcut="0"
            label="CENTRO CREATIVO"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('hub');
            }}
          />
          <OrbitalSystem
            items={sectionItems.hub || []}
            sectionType="hub"
            centerPosition={[0, 12, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('hub', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Feed - Torre de Cristal */}
        <group position={[0, 0, -120]}>
          <FeedMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.stats?.totalPosts || 0 }}
            shortcut="1"
            label="Feed"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('feed');
            }}
          />
          <OrbitalSystem
            items={sectionItems.feed || []}
            sectionType="feed"
            centerPosition={[0, 15, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('feed', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Musica - Altavoz Gigante */}
        <group position={[120, 0, 0]}>
          <MusicMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.songs?.length || 0 }}
            shortcut="2"
            label="Musica"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('music');
            }}
          />
          <OrbitalSystem
            items={sectionItems.music || []}
            sectionType="music"
            centerPosition={[0, 12, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('music', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Arte - Lienzo Dorado */}
        <group position={[120, 0, -120]}>
          <ArtMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.artworks?.length || 0 }}
            shortcut="3"
            label="Arte"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('art');
            }}
          />
          <OrbitalSystem
            items={sectionItems.art || []}
            sectionType="art"
            centerPosition={[0, 15, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('art', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Social */}
        <group position={[0, 0, 120]}>
          <FeedMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.stats?.totalUsers || 0 }}
            shortcut="7"
            label="Comunidad"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('social');
            }}
          />
          <OrbitalSystem
            items={sectionItems.social || []}
            sectionType="social"
            centerPosition={[0, 12, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('social', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Aprendizaje - Torre de Libros */}
        <group position={[-120, 0, -120]}>
          <LearnMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.tutorials?.length || content.stats?.totalTutorials || 0 }}
            shortcut="6"
            label="Aprende"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('learn');
            }}
          />
          <OrbitalSystem
            items={sectionItems.learn || []}
            sectionType="learn"
            centerPosition={[0, 18, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('learn', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Market - Tienda */}
        <group position={[-120, 0, 120]}>
          <MarketMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.products?.length || 0 }}
            shortcut="5"
            label="Market"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('market');
            }}
          />
          <OrbitalSystem
            items={sectionItems.market || []}
            sectionType="market"
            centerPosition={[0, 12, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('market', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Eventos - Escenario */}
        <group position={[120, 0, 120]}>
          <EventsMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.events?.length || 0 }}
            shortcut="4"
            label="Eventos"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('events');
            }}
          />
          <OrbitalSystem
            items={sectionItems.events || []}
            sectionType="events"
            centerPosition={[0, 12, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('events', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Oportunidades */}
        <group position={[-120, 0, 0]}>
          <FeedMonument 
            position={[0, 0, 0]} 
            stats={{ items: content.opportunities?.length || content.stats?.totalOpportunities || 0 }}
            shortcut="8"
            label="Convocatorias"
            onClick={(event) => {
              event.stopPropagation();
              handleMonumentClick('opportunities');
            }}
          />
          <OrbitalSystem
            items={sectionItems.opportunities || []}
            sectionType="opportunities"
            centerPosition={[0, 12, 0]}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onDeselectItem={handleDeselectItem}
            renderItemContent={(item, hovered, isSelected) => (
              renderCardForSection('opportunities', item, hovered, isSelected)
            )}
          />
        </group>
        
        {/* Camara cinematografica */}
        <StaticCamera 
          currentZone={currentZone}
          onPositionChange={handlePositionChange}
          onTravelStart={handleTravelStart}
          onTravelEnd={handleTravelEnd}
        />
      </Canvas>
    </>
  );
});

export default ImmersiveWorld;
export { ZONE_POSITIONS };

