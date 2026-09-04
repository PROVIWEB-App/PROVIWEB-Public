/**
 * PROVIWEB - Previews de Contenido con Órbitas
 * Música, Arte, Eventos, Market - Items orbitales interactivos
 */

import React, { useState, useCallback, memo } from 'react';
import { Html } from '@react-three/drei';
import { OrbitalSystem, ORBIT_CONFIGS } from './OrbitalItems.jsx';
import { FocusOverlay } from '../effects/FocusOverlay.jsx';
import { useSongsRealtime, useEventsRealtime, useProductsRealtime, useArtworksRealtime } from '../../hooks/useFirebaseData.js';

// ==================== RENDERERS DE CONTENIDO ====================

const MusicItemContent = (song, isHovered, isSelected) => (
  <div style={{
    width: isSelected ? '350px' : '200px',
    padding: isSelected ? '24px' : '16px',
    background: 'linear-gradient(180deg, rgba(244,63,94,0.95), rgba(0,0,0,0.95))',
    borderRadius: '16px',
    border: `2px solid ${isSelected ? '#f43f5e' : isHovered ? '#f43f5e' : 'transparent'}`,
    boxShadow: isSelected ? '0 0 60px rgba(244,63,94,0.6)' : isHovered ? '0 0 30px rgba(244,63,94,0.4)' : 'none',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    pointerEvents: 'none'
  }}>
    <div style={{ fontSize: isSelected ? '48px' : '32px', marginBottom: '8px' }}>🎵</div>
    <div style={{ 
      fontSize: isSelected ? '18px' : '14px', 
      fontWeight: 'bold', 
      color: '#fff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      {song.title}
    </div>
    <div style={{ fontSize: isSelected ? '14px' : '12px', color: '#f43f5e', marginTop: '4px' }}>
      {song.artist}
    </div>
    {isSelected && (
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '8px' }}>
          🎼 {song.genre} • ⏱️ {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
        </div>
        <button style={{
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
          border: 'none',
          borderRadius: '25px',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          ▶ Reproducir
        </button>
      </div>
    )}
  </div>
);

const ArtItemContent = (artwork, isHovered, isSelected) => (
  <div style={{
    width: isSelected ? '400px' : '180px',
    padding: isSelected ? '20px' : '12px',
    background: 'linear-gradient(180deg, rgba(236,72,153,0.95), rgba(0,0,0,0.95))',
    borderRadius: '16px',
    border: `2px solid ${isSelected ? '#ec4899' : isHovered ? '#ec4899' : 'transparent'}`,
    boxShadow: isSelected ? '0 0 60px rgba(236,72,153,0.6)' : isHovered ? '0 0 30px rgba(236,72,153,0.4)' : 'none',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ 
      width: isSelected ? '360px' : '156px',
      height: isSelected ? '240px' : '120px',
      background: '#1a1a2e',
      borderRadius: '12px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isSelected ? '64px' : '40px'
    }}>
      🎨
    </div>
    <div style={{ 
      fontSize: isSelected ? '18px' : '13px', 
      fontWeight: 'bold', 
      color: '#fff' 
    }}>
      {artwork.title}
    </div>
    <div style={{ fontSize: isSelected ? '14px' : '11px', color: '#ec4899', marginTop: '4px' }}>
      por {artwork.artist}
    </div>
    {isSelected && (
      <div style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <span style={{ color: '#ccc', fontSize: '13px' }}>👁️ {artwork.views || 0}</span>
        <span style={{ color: '#ccc', fontSize: '13px' }}>❤️ {artwork.likes || 0}</span>
      </div>
    )}
  </div>
);

const EventItemContent = (event, isHovered, isSelected) => (
  <div style={{
    width: isSelected ? '380px' : '220px',
    padding: isSelected ? '24px' : '16px',
    background: 'linear-gradient(180deg, rgba(99,102,241,0.95), rgba(0,0,0,0.95))',
    borderRadius: '16px',
    border: `2px solid ${isSelected ? '#6366f1' : isHovered ? '#6366f1' : 'transparent'}`,
    boxShadow: isSelected ? '0 0 60px rgba(99,102,241,0.6)' : isHovered ? '0 0 30px rgba(99,102,241,0.4)' : 'none',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ fontSize: isSelected ? '40px' : '28px', marginBottom: '8px' }}>📅</div>
    <div style={{ fontSize: isSelected ? '12px' : '10px', color: '#6366f1', fontWeight: 'bold' }}>
      {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
    </div>
    <div style={{ 
      fontSize: isSelected ? '20px' : '14px', 
      fontWeight: 'bold', 
      color: '#fff',
      marginTop: '4px'
    }}>
      {event.title}
    </div>
    <div style={{ fontSize: isSelected ? '13px' : '11px', color: '#aaa', marginTop: '4px' }}>
      📍 {event.location}
    </div>
    {isSelected && (
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '12px' }}>
          👥 {event.attendees || 0} asistentes confirmados
        </div>
        <button style={{
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          border: 'none',
          borderRadius: '25px',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Ver detalles
        </button>
      </div>
    )}
  </div>
);

const ProductItemContent = (product, isHovered, isSelected) => (
  <div style={{
    width: isSelected ? '320px' : '180px',
    padding: isSelected ? '20px' : '14px',
    background: 'linear-gradient(180deg, rgba(245,158,11,0.95), rgba(0,0,0,0.95))',
    borderRadius: '16px',
    border: `2px solid ${isSelected ? '#f59e0b' : isHovered ? '#f59e0b' : 'transparent'}`,
    boxShadow: isSelected ? '0 0 60px rgba(245,158,11,0.6)' : isHovered ? '0 0 30px rgba(245,158,11,0.4)' : 'none',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ fontSize: isSelected ? '48px' : '32px', marginBottom: '8px' }}>🛍️</div>
    <div style={{ 
      fontSize: isSelected ? '18px' : '13px', 
      fontWeight: 'bold', 
      color: '#fff' 
    }}>
      {product.name}
    </div>
    <div style={{ 
      fontSize: isSelected ? '24px' : '18px', 
      color: '#f59e0b', 
      fontWeight: 'bold',
      marginTop: '8px' 
    }}>
      ${product.price}
    </div>
    {isSelected && (
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
          {product.category} • {product.condition}
        </div>
        <button style={{
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none',
          borderRadius: '25px',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          🛒 Ver producto
        </button>
      </div>
    )}
  </div>
);

// ==================== COMPONENTES DE PREVIEW ====================

export const MusicPreview = memo(({ position = [0, 0, 0] }) => {
  const { songs, loading } = useSongsRealtime(6);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSelect = useCallback((item) => setSelectedItem(item), []);
  const handleDeselect = useCallback(() => setSelectedItem(null), []);
  
  if (loading || !songs.length) return null;
  
  // Añadir color a cada canción
  const itemsWithColors = songs.map((song, i) => ({
    ...song,
    color: ['#f43f5e', '#ec4899', '#8b5cf6', '#a855f7'][i % 4]
  }));
  
  return (
    <group position={position}>
      <FocusOverlay isActive={!!selectedItem} />
      <OrbitalSystem
        items={itemsWithColors}
        sectionType="music"
        selectedItem={selectedItem}
        onSelectItem={handleSelect}
        onDeselectItem={handleDeselect}
        renderItemContent={MusicItemContent}
      />
    </group>
  );
});

export const ArtPreview = memo(({ position = [0, 0, 0] }) => {
  const { artworks, loading } = useArtworksRealtime(5);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSelect = useCallback((item) => setSelectedItem(item), []);
  const handleDeselect = useCallback(() => setSelectedItem(null), []);
  
  if (loading || !artworks.length) return null;
  
  const itemsWithColors = artworks.map((art) => ({
    ...art,
    color: '#ec4899'
  }));
  
  return (
    <group position={position}>
      <FocusOverlay isActive={!!selectedItem} />
      <OrbitalSystem
        items={itemsWithColors}
        sectionType="art"
        selectedItem={selectedItem}
        onSelectItem={handleSelect}
        onDeselectItem={handleDeselect}
        renderItemContent={ArtItemContent}
      />
    </group>
  );
});

export const EventsPreview = memo(({ position = [0, 0, 0] }) => {
  const { events, loading } = useEventsRealtime(4);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSelect = useCallback((item) => setSelectedItem(item), []);
  const handleDeselect = useCallback(() => setSelectedItem(null), []);
  
  if (loading || !events.length) return null;
  
  const itemsWithColors = events.map((evt) => ({
    ...evt,
    color: '#6366f1'
  }));
  
  return (
    <group position={position}>
      <FocusOverlay isActive={!!selectedItem} />
      <OrbitalSystem
        items={itemsWithColors}
        sectionType="events"
        selectedItem={selectedItem}
        onSelectItem={handleSelect}
        onDeselectItem={handleDeselect}
        renderItemContent={EventItemContent}
      />
    </group>
  );
});

export const MarketPreview = memo(({ position = [0, 0, 0] }) => {
  const { products, loading } = useProductsRealtime(6);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSelect = useCallback((item) => setSelectedItem(item), []);
  const handleDeselect = useCallback(() => setSelectedItem(null), []);
  
  if (loading || !products.length) return null;
  
  const itemsWithColors = products.map((prod) => ({
    ...prod,
    color: '#f59e0b'
  }));
  
  return (
    <group position={position}>
      <FocusOverlay isActive={!!selectedItem} />
      <OrbitalSystem
        items={itemsWithColors}
        sectionType="market"
        selectedItem={selectedItem}
        onSelectItem={handleSelect}
        onDeselectItem={handleDeselect}
        renderItemContent={ProductItemContent}
      />
    </group>
  );
});

export default { MusicPreview, ArtPreview, EventsPreview, MarketPreview };
