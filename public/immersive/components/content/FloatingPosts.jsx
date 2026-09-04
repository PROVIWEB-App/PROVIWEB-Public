/**
 * PROVIWEB - Posts Flotantes con Órbitas
 * Posts que orbitan alrededor del centro/zona
 */

import React, { useState, useCallback, memo } from 'react';
import { Html } from '@react-three/drei';
import { OrbitalSystem } from './OrbitalItems.jsx';
import { FocusOverlay } from '../effects/FocusOverlay.jsx';
import { usePostsRealtime } from '../../hooks/useFirebaseData.js';

// Renderer de contenido para posts
const PostItemContent = (post, isHovered, isSelected) => (
  <div style={{
    width: isSelected ? '420px' : '280px',
    maxHeight: isSelected ? '500px' : '180px',
    padding: isSelected ? '20px' : '14px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: '16px',
    border: `2px solid ${isSelected ? '#a855f7' : isHovered ? '#a855f7' : 'transparent'}`,
    boxShadow: isSelected ? '0 0 50px rgba(168,85,247,0.6)' : isHovered ? '0 0 25px rgba(168,85,247,0.4)' : 'none',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    pointerEvents: isSelected ? 'auto' : 'none'
  }}>
    {/* Header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      paddingBottom: '10px'
    }}>
      <div style={{
        width: isSelected ? '44px' : '36px',
        height: isSelected ? '44px' : '36px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${post.userColor || '#a855f7'}, ${post.userColor2 || '#00d9ff'})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isSelected ? '18px' : '14px',
        fontWeight: 'bold',
        color: '#fff',
        flexShrink: 0
      }}>
        {post.userName ? post.userName[0].toUpperCase() : '?'}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ 
          fontSize: isSelected ? '15px' : '13px', 
          fontWeight: '600', 
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {post.userName || 'Usuario'}
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>
          {new Date(post.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
    
    {/* Contenido */}
    <div style={{
      fontSize: isSelected ? '15px' : '13px',
      color: '#e0e0e0',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: isSelected ? 'unset' : 3,
      WebkitBoxOrient: 'vertical'
    }}>
      {post.content}
    </div>
    
    {/* Imagen si existe */}
    {post.imageUrl && isSelected && (
      <div style={{
        marginTop: '12px',
        width: '100%',
        height: '180px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#000'
      }}>
        <img 
          src={post.imageUrl} 
          alt="Post"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    )}
    
    {/* Stats */}
    <div style={{
      display: 'flex',
      gap: '16px',
      marginTop: '12px',
      paddingTop: '10px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      fontSize: '12px',
      color: '#888'
    }}>
      <span>❤️ {post.likes || 0}</span>
      <span>💬 {post.comments || 0}</span>
      <span>👁️ {post.views || 0}</span>
    </div>
    
    {isSelected && (
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button 
          onClick={() => window.open(`/home.html?post=${post.id}`, '_blank')}
          style={{
            padding: '10px 28px',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            border: 'none',
            borderRadius: '25px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Ver post completo →
        </button>
      </div>
    )}
  </div>
);

// Componente principal
const FloatingPosts = memo(({ position = [0, 0, 0], count = 6, orbitType = 'feed', onPostClick }) => {
  const { posts, loading } = usePostsRealtime(count);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSelect = useCallback((item) => {
    setSelectedItem(item);
    if (onPostClick) onPostClick(item);
  }, [onPostClick]);
  
  const handleDeselect = useCallback(() => {
    setSelectedItem(null);
  }, []);
  
  if (loading || !posts.length) return null;
  
  const itemsWithColors = posts.map((post) => ({
    ...post,
    color: '#a855f7'
  }));
  
  return (
    <group position={position}>
      <FocusOverlay isActive={!!selectedItem} intensity={0.6} />
      <OrbitalSystem
        items={itemsWithColors}
        sectionType={orbitType}
        selectedItem={selectedItem}
        onSelectItem={handleSelect}
        onDeselectItem={handleDeselect}
        renderItemContent={PostItemContent}
      />
    </group>
  );
});

export default FloatingPosts;
