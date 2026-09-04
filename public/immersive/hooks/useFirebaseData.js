/**
 * PROVIWEB - Hooks de datos Firebase para modo inmersivo
 * Alineado con la estructura real usada en home.html.
 */

import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast, equalTo } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toTimestamp = (...values) => {
  for (const value of values) {
    const parsed = toNumber(value, NaN);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return Date.now();
};

const firstImageFromPost = (post) => {
  if (!post || typeof post !== 'object') return '';
  if (post.meme && post.meme !== 'noImage') return post.meme;
  if (Array.isArray(post.memes) && post.memes.length > 0) {
    return String(post.memes[0] || '');
  }
  if (post.memes && typeof post.memes === 'object') {
    const first = Object.values(post.memes).find(Boolean);
    if (first) return String(first);
  }
  if (post.imageUrl) return String(post.imageUrl);
  if (post.image) return String(post.image);
  return '';
};

const hasVideo = (post) => Boolean(post?.vine && post.vine !== 'noVideo');

const levelFromTutorial = (tutorial) => {
  const raw = String(tutorial?.level || tutorial?.nivel || '').toLowerCase();
  if (raw.includes('avanz')) return 'Avanzado';
  if (raw.includes('inter')) return 'Intermedio';
  return 'Básico';
};

const iconFromTutorial = (tutorial) => {
  const text = `${tutorial?.title || ''} ${tutorial?.category || ''} ${tutorial?.text || ''}`.toLowerCase();
  if (text.includes('guit') || text.includes('piano') || text.includes('music')) return '🎼';
  if (text.includes('foto')) return '📷';
  if (text.includes('arte') || text.includes('dibujo') || text.includes('paint')) return '🎨';
  if (text.includes('video') || text.includes('edición')) return '🎬';
  return '📚';
};

const dedupeById = (items) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = String(item?.id || '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};

// ==================== USUARIOS ====================

export const useUsersRealtime = (limit = 400) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'Users');

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([id, user]) => ({
          id,
          uid: id,
          name: user?.name || user?.username || 'Usuario',
          username: user?.username || '',
          photo: user?.photo || '/assets/avatar.png',
          bio: user?.bio || user?.description || '',
          role: user?.role || user?.accountType || 'user',
          accountType: user?.accountType || '',
          allyRole: user?.allyRole || '',
          allyStatus: user?.allyStatus || '',
          verified: user?.verified || '',
          city: user?.city || user?.location || '',
          country: user?.country || '',
          website: user?.website || user?.link || '',
          businessName: user?.businessName || user?.organization || '',
          timestamp: toTimestamp(user?.createdAt, user?.timestamp, user?.pTime, id)
        }));

        list.sort((a, b) => b.timestamp - a.timestamp);
        setUsers(list.slice(0, limit));
        setLoading(false);
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando usuarios:', err);
        setUsers([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limit]);

  return { users, loading };
};

// ==================== POSTS (FEED) ====================

export const usePostsRealtime = (limit = 20) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getDatabase();
    const postsRef = query(ref(db, 'Posts'), orderByChild('pTime'), limitToLast(limit));

    const unsubscribe = onValue(
      postsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([postId, post]) => {
          const authorId = post?.id || post?.uid || '';
          const image = firstImageFromPost(post);
          return {
            ...post,
            id: postId, // id del post (clave real)
            postId,
            authorId,
            content: post?.text || post?.caption || '',
            image,
            video: hasVideo(post) ? post.vine : '',
            likes: toNumber(post?.likes),
            comments: toNumber(post?.comments),
            timestamp: toTimestamp(post?.pTime, post?.timestamp, postId)
          };
        }).sort((a, b) => b.timestamp - a.timestamp);

        setPosts(list);
        setLoading(false);
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando posts:', err);
        setError(err);
        setPosts([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limit]);

  return { posts, loading, error };
};

// ==================== MUSICA (AUDIOSPLAY) ====================

export const useSongsRealtime = (limit = 20) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const audiosRef = ref(db, 'AudiosPlay');

    const unsubscribe = onValue(
      audiosRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = [];

        Object.entries(data).forEach(([ownerId, songsNode]) => {
          if (!songsNode || typeof songsNode !== 'object') return;
          Object.entries(songsNode).forEach(([songId, song]) => {
            if (!song || typeof song !== 'object') return;
            const audioUrl = song?.url || song?.audioUrl || song?.songUrl || song?.song || '';
            if (!audioUrl) return;

            list.push({
              ...song,
              id: `${ownerId}_${songId}`,
              songId,
              ownerId,
              audioUrl,
              cover: song?.coverUrl || song?.cover || '',
              title: song?.title || 'Sin título',
              artist: song?.artist || 'Artista',
              timestamp: toTimestamp(song?.timestamp, song?.createdAt, songId)
            });
          });
        });

        list.sort((a, b) => b.timestamp - a.timestamp);
        setSongs(list.slice(0, limit));
        setLoading(false);
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando música:', err);
        setSongs([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limit]);

  return { songs, loading };
};

// ==================== ARTE (DESDE POSTS) ====================

export const useArtworksRealtime = (limit = 20) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const postsRef = query(ref(db, 'Posts'), orderByChild('pTime'), limitToLast(limit * 6));

    const unsubscribe = onValue(
      postsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data)
          .map(([postId, post]) => {
            const image = firstImageFromPost(post);
            return {
              ...post,
              id: postId,
              postId,
              authorId: post?.id || post?.uid || '',
              imageUrl: image,
              image,
              title: post?.text || 'Obra',
              artist: post?.userName || '',
              timestamp: toTimestamp(post?.pTime, post?.timestamp, postId)
            };
          })
          .filter((item) => Boolean(item.imageUrl))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);

        setArtworks(list);
        setLoading(false);
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando arte:', err);
        setArtworks([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limit]);

  return { artworks, loading };
};

// ==================== EVENTOS ====================

export const useEventsRealtime = (limit = 20) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const eventsRef = query(ref(db, 'Events'), limitToLast(limit));

    const unsubscribe = onValue(
      eventsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([id, event]) => ({
          ...event,
          id,
          title: event?.title || event?.name || 'Evento',
          date: event?.date || event?.eventDate || '',
          location: event?.location || event?.city || event?.place || 'Ubicación por confirmar',
          attendees: toNumber(event?.attendeesCount || (event?.attendees ? Object.keys(event.attendees).length : 0)),
          timestamp: toTimestamp(event?.timestamp, event?.createdAt, id)
        }));

        list.sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp));
        setEvents(list.slice(0, limit));
        setLoading(false);
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando eventos:', err);
        setEvents([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limit]);

  return { events, loading };
};

// ==================== PRODUCTOS (MARKETPLACE + POSTS) ====================

export const useProductsRealtime = (limit = 20) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    let marketplaceProducts = [];
    let postProducts = [];
    let loadedMarketplace = false;
    let loadedPosts = false;

    const emit = () => {
      const merged = dedupeById([...marketplaceProducts, ...postProducts])
        .sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp))
        .slice(0, limit);
      setProducts(merged);
      if (loadedMarketplace || loadedPosts) setLoading(false);
    };

    const marketplaceUnsub = onValue(
      ref(db, 'Marketplace'),
      (snapshot) => {
        const data = snapshot.val() || {};
        marketplaceProducts = Object.entries(data).map(([id, product]) => ({
          ...product,
          id,
          name: product?.name || product?.title || 'Producto',
          title: product?.title || product?.name || 'Producto',
          image: product?.image || product?.imageUrl || '',
          price: product?.price || product?.value || 0,
          timestamp: toTimestamp(product?.timestamp, product?.createdAt, id)
        }));
        loadedMarketplace = true;
        emit();
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando Marketplace:', err);
        loadedMarketplace = true;
        emit();
      }
    );

    const postsMarketplaceQuery = query(ref(db, 'Posts'), orderByChild('type'), equalTo('marketplace'));
    const postsUnsub = onValue(
      postsMarketplaceQuery,
      (snapshot) => {
        const data = snapshot.val() || {};
        postProducts = Object.entries(data).map(([id, post]) => ({
          ...post,
          id,
          name: post?.title || post?.text || 'Producto',
          title: post?.title || post?.text || 'Producto',
          image: firstImageFromPost(post),
          price: post?.price || 0,
          timestamp: toTimestamp(post?.pTime, post?.timestamp, id)
        }));
        loadedPosts = true;
        emit();
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando productos desde posts:', err);
        loadedPosts = true;
        emit();
      }
    );

    return () => {
      marketplaceUnsub();
      postsUnsub();
    };
  }, [limit]);

  return { products, loading };
};

// ==================== OPORTUNIDADES ====================

export const useOpportunitiesRealtime = (limit = 20) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const opportunitiesRef = ref(db, 'Opportunities');

    const unsubscribe = onValue(
      opportunitiesRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([id, item]) => {
          const applicationsCount = item?.applications ? Object.keys(item.applications).length : 0;
          return {
            ...item,
            id,
            title: item?.title || 'Convocatoria',
            content: item?.description || item?.summary || '',
            image: item?.imageUrl || '',
            authorId: item?.createdBy || item?.id || '',
            likes: applicationsCount,
            comments: 0,
            timestamp: toTimestamp(item?.updatedAt, item?.createdAt, item?.timestamp, id)
          };
        });

        list.sort((a, b) => b.timestamp - a.timestamp);
        setOpportunities(list.slice(0, limit));
        setLoading(false);
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando oportunidades:', err);
        setOpportunities([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limit]);

  return { opportunities, loading };
};

// ==================== TUTORIALES (TUTORIALES + POSTS EDUCATIVOS) ====================

export const useTutorialsRealtime = (limit = 20) => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    let tutorialsNode = [];
    let tutorialsFromPosts = [];
    let loadedTutorialNode = false;
    let loadedPostsFallback = false;

    const emit = () => {
      const merged = dedupeById([...tutorialsNode, ...tutorialsFromPosts])
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      setTutorials(merged);
      if (loadedTutorialNode || loadedPostsFallback) setLoading(false);
    };

    const tutorialsUnsub = onValue(
      ref(db, 'Tutoriales'),
      (snapshot) => {
        const data = snapshot.val() || {};
        tutorialsNode = Object.entries(data).map(([id, tutorial]) => ({
          ...tutorial,
          id,
          title: tutorial?.title || tutorial?.name || 'Tutorial',
          description: tutorial?.description || tutorial?.text || '',
          level: levelFromTutorial(tutorial),
          icon: iconFromTutorial(tutorial),
          timestamp: toTimestamp(tutorial?.timestamp, tutorial?.createdAt, id)
        }));
        loadedTutorialNode = true;
        emit();
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando Tutoriales:', err);
        loadedTutorialNode = true;
        emit();
      }
    );

    const postsTutorialQuery = query(ref(db, 'Posts'), orderByChild('type'), equalTo('educativo'));
    const postsUnsub = onValue(
      postsTutorialQuery,
      (snapshot) => {
        const data = snapshot.val() || {};
        tutorialsFromPosts = Object.entries(data).map(([id, post]) => ({
          ...post,
          id,
          title: post?.text ? String(post.text).slice(0, 80) : 'Tutorial',
          description: post?.text || '',
          level: levelFromTutorial(post),
          icon: iconFromTutorial(post),
          timestamp: toTimestamp(post?.pTime, post?.timestamp, id)
        }));
        loadedPostsFallback = true;
        emit();
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando tutoriales desde posts:', err);
        loadedPostsFallback = true;
        emit();
      }
    );

    return () => {
      tutorialsUnsub();
      postsUnsub();
    };
  }, [limit]);

  return { tutorials, loading };
};

// ==================== ESTADISTICAS ====================

export const useStatsRealtime = () => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalSongs: 0,
    totalArtworks: 0,
    totalEvents: 0,
    loading: true
  });

  useEffect(() => {
    const db = getDatabase();
    const statsRef = ref(db, 'Stats');

    const unsubscribe = onValue(
      statsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setStats({
          totalPosts: toNumber(data.totalPosts),
          totalUsers: toNumber(data.totalUsers),
          totalSongs: toNumber(data.totalSongs),
          totalArtworks: toNumber(data.totalArtworks),
          totalEvents: toNumber(data.totalEvents),
          loading: false
        });
      },
      (err) => {
        console.error('[ImmersiveData] Error cargando stats:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    );

    return () => unsubscribe();
  }, []);

  return stats;
};

// ==================== TODO EL CONTENIDO ====================

export const useAllContentRealtime = () => {
  const [content, setContent] = useState({
    posts: [],
    songs: [],
    artworks: [],
    events: [],
    products: [],
    opportunities: [],
    tutorials: [],
    users: [],
    allies: [],
    hub: [],
    stats: {},
    loading: true
  });

  const users = useUsersRealtime(500);
  const posts = usePostsRealtime(32);
  const songs = useSongsRealtime(32);
  const artworks = useArtworksRealtime(24);
  const events = useEventsRealtime(24);
  const products = useProductsRealtime(24);
  const opportunities = useOpportunitiesRealtime(24);
  const tutorials = useTutorialsRealtime(24);
  const stats = useStatsRealtime();

  useEffect(() => {
    const usersById = new Map((users.users || []).map((user) => [user.id, user]));
    const normalize = (value) => String(value || '').toLowerCase();

    const postsEnriched = (posts.posts || []).map((post) => {
      const author = usersById.get(post.authorId);
      return {
        ...post,
        authorName: post.authorName || author?.name || post.authorId || 'Usuario',
        authorPhoto: post.authorPhoto || author?.photo || '/assets/avatar.png'
      };
    });

    const songsEnriched = (songs.songs || []).map((song) => {
      const owner = usersById.get(song.ownerId);
      return {
        ...song,
        artist: song.artist || owner?.name || 'Artista',
        cover: song.cover || owner?.photo || ''
      };
    });

    const artworksEnriched = (artworks.artworks || []).map((art) => {
      const author = usersById.get(art.authorId);
      return {
        ...art,
        authorName: art.authorName || author?.name || 'Artista',
        artist: art.artist || author?.name || 'Artista'
      };
    });

    const opportunitiesEnriched = (opportunities.opportunities || []).map((item) => {
      const author = usersById.get(item.authorId);
      return {
        ...item,
        authorName: item.authorName || author?.name || 'Entidad',
        authorPhoto: item.authorPhoto || author?.photo || '/assets/avatar.png'
      };
    });

    const socialCards = (users.users || []).slice(0, 24).map((user) => ({
      id: user.id,
      authorName: user.name || 'Usuario',
      authorUsername: user.username || '',
      authorPhoto: user.photo || '/assets/avatar.png',
      content: user.bio || `@${user.username || 'usuario'}`,
      likes: 0,
      comments: 0,
      timestamp: user.timestamp || Date.now()
    }));

    const alliesCards = (users.users || [])
      .filter((user) => {
        const role = normalize(user.role);
        const accountType = normalize(user.accountType);
        const allyStatus = normalize(user.allyStatus);
        const verified = normalize(user.verified);

        return (
          role === 'ally' ||
          role === 'partner' ||
          role === 'admin' ||
          accountType === 'ally' ||
          Boolean(user.allyRole) ||
          allyStatus === 'active' ||
          verified === 'ally'
        );
      })
      .slice(0, 24)
      .map((user) => ({
        id: `ally_${user.id}`,
        kind: 'ally',
        authorId: user.id,
        authorName: user.name || user.businessName || 'Aliado',
        authorUsername: user.username || '',
        authorPhoto: user.photo || '/assets/avatar.png',
        title: user.businessName || user.name || 'Aliado PROVIWEB',
        content: user.bio || 'Aliado activo de la red PROVIWEB.',
        city: user.city || '',
        country: user.country || '',
        website: user.website || '',
        role: user.role || user.accountType || 'ally',
        timestamp: user.timestamp || Date.now()
      }));

    const hubItems = dedupeById([
      ...alliesCards.slice(0, 6),
      ...postsEnriched.slice(0, 8).map((item) => ({ ...item, title: item.content || 'Publicación' })),
      ...opportunitiesEnriched.slice(0, 4)
    ]).sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp));

    const calculatedStats = {
      totalPosts: postsEnriched.length,
      totalUsers: users.users.length,
      totalSongs: songsEnriched.length,
      totalArtworks: artworksEnriched.length,
      totalEvents: events.events.length,
      totalProducts: products.products.length,
      totalOpportunities: opportunitiesEnriched.length,
      totalTutorials: tutorials.tutorials.length,
      totalAllies: alliesCards.length
    };

    setContent({
      posts: postsEnriched,
      songs: songsEnriched,
      artworks: artworksEnriched,
      events: events.events,
      products: products.products,
      opportunities: opportunitiesEnriched,
      tutorials: tutorials.tutorials,
      users: socialCards,
      allies: alliesCards,
      hub: hubItems,
      stats: {
        ...calculatedStats,
        totalUsers: stats.totalUsers || calculatedStats.totalUsers
      },
      loading:
        users.loading ||
        posts.loading ||
        songs.loading ||
        artworks.loading ||
        events.loading ||
        products.loading ||
        opportunities.loading ||
        tutorials.loading
    });
  }, [
    users.users, users.loading,
    posts.posts, posts.loading,
    songs.songs, songs.loading,
    artworks.artworks, artworks.loading,
    events.events, events.loading,
    products.products, products.loading,
    opportunities.opportunities, opportunities.loading,
    tutorials.tutorials, tutorials.loading,
    stats.totalUsers
  ]);

  return { content, loading: content.loading };
};

// ==================== USUARIO ACTUAL ====================

export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const username = localStorage.getItem('proviweb_username');
      const userId = localStorage.getItem('proviweb_userid');
      const role = localStorage.getItem('proviweb_role') || 'user';

      if (username && userId) {
        setUser({
          id: userId,
          name: username,
          role,
          color: localStorage.getItem('proviweb_usercolor') || '#a855f7'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  return { user, loading };
};

// Hook genérico para cualquier referencia
export const useFirebaseRef = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const dataRef = ref(db, path);

    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        setData(snapshot.val());
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
};

export default {
  useUsersRealtime,
  usePostsRealtime,
  useSongsRealtime,
  useArtworksRealtime,
  useEventsRealtime,
  useProductsRealtime,
  useOpportunitiesRealtime,
  useTutorialsRealtime,
  useStatsRealtime,
  useAllContentRealtime,
  useCurrentUser,
  useFirebaseRef
};
