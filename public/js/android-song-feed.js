import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getDatabase, onValue, ref } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

// El feed Android guarda las canciones en Songs/{songId}. Este módulo reemplaza
// el lector histórico de AudiosPlay solamente en la pantalla de inicio.
const firebaseConfig = {
    apiKey: 'AIzaSyAxtXQ3a4azqY5yww9TetxouSr7jUdzdNw',
    authDomain: 'proviweb-d8764.firebaseapp.com',
    databaseURL: 'https://proviweb-d8764-default-rtdb.firebaseio.com',
    projectId: 'proviweb-d8764',
    storageBucket: 'proviweb-d8764.appspot.com',
    messagingSenderId: '475963980955',
    appId: '1:475963980955:web:8444288d8ba13e428e1a3e'
};

const existingApp = getApps().find((app) => app.options.projectId === firebaseConfig.projectId);
const app = existingApp || initializeApp(firebaseConfig, 'android-song-feed');
const db = getDatabase(app);
let songs = [];
let activeSongId = '';
let audio = null;

function asNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function normalizeSong(id, value) {
    if (!value || typeof value !== 'object') return null;
    const audioUrl = String(value.audioUrl || value.url || '');
    if (!audioUrl) return null;

    return {
        id,
        pId: String(value.pId || value.userId || ''),
        title: String(value.title || 'Sin título'),
        artist: String(value.artist || 'Artista'),
        coverUrl: String(value.coverUrl || value.cover || ''),
        audioUrl,
        duration: String(value.duration || ''),
        durationMs: asNumber(value.durationMs),
        playCount: asNumber(value.playCount),
        likeCount: asNumber(value.likeCount),
        commentCount: asNumber(value.commentCount),
        timestamp: asNumber(value.timestamp)
    };
}

function formatDuration(song) {
    if (song.duration) return song.duration;
    if (!song.durationMs) return '';
    const totalSeconds = Math.floor(song.durationMs / 1000);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function getAudio() {
    if (audio) return audio;
    audio = document.createElement('audio');
    audio.id = 'androidSongFeedAudio';
    audio.preload = 'metadata';
    audio.addEventListener('ended', () => {
        activeSongId = '';
        renderAll();
    });
    document.body.appendChild(audio);
    return audio;
}

async function toggleSong(song) {
    const player = getAudio();
    if (activeSongId === song.id && !player.paused) {
        player.pause();
        activeSongId = '';
        renderAll();
        return;
    }

    activeSongId = song.id;
    if (player.src !== song.audioUrl) {
        player.src = song.audioUrl;
    }
    try {
        await player.play();
    } catch (error) {
        console.error('No fue posible reproducir la canción', error);
        activeSongId = '';
    }
    renderAll();
}

function createCover(song, size) {
    const cover = document.createElement('div');
    cover.style.cssText = `width:${size}px;height:${size}px;flex:0 0 ${size}px;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#a855f7,#007bff);font-size:24px;`;
    if (!song.coverUrl) {
        cover.textContent = '🎵';
        return cover;
    }
    const image = document.createElement('img');
    image.src = song.coverUrl;
    image.alt = `Carátula de ${song.title}`;
    image.loading = 'lazy';
    image.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    image.addEventListener('error', () => {
        cover.replaceChildren('🎵');
    }, { once: true });
    cover.appendChild(image);
    return cover;
}

function createSongCard(song, compact) {
    const card = document.createElement('article');
    card.className = 'android-song-feed-item';
    card.dataset.androidSongId = song.id;
    card.style.cssText = compact
        ? 'min-width:205px;max-width:220px;padding:12px;border:1px solid var(--border-glass);border-radius:14px;background:var(--bg-card);display:flex;flex-direction:column;gap:10px;'
        : 'min-width:270px;padding:12px;border:1px solid var(--border-glass);border-radius:14px;background:var(--bg-card);display:flex;align-items:center;gap:12px;';

    const cover = createCover(song, compact ? 196 : 54);
    if (compact) cover.style.width = '100%';
    const info = document.createElement('div');
    info.style.cssText = 'min-width:0;flex:1;';

    const title = document.createElement('div');
    title.textContent = song.title;
    title.style.cssText = 'font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

    const artist = document.createElement('div');
    artist.textContent = song.artist;
    artist.style.cssText = 'margin-top:3px;font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

    const stats = document.createElement('div');
    const duration = formatDuration(song);
    stats.textContent = `${duration ? `${duration} · ` : ''}▶ ${song.playCount} · ❤️ ${song.likeCount} · 💬 ${song.commentCount}`;
    stats.style.cssText = 'margin-top:7px;font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

    const play = document.createElement('button');
    play.type = 'button';
    play.textContent = activeSongId === song.id ? '⏸ Pausar' : '▶ Reproducir';
    play.style.cssText = 'margin-top:10px;border:0;border-radius:9px;padding:8px 10px;cursor:pointer;background:var(--gradient-primary);color:#fff;font-weight:700;font-size:12px;';
    play.addEventListener('click', (event) => {
        event.stopPropagation();
        void toggleSong(song);
    });

    info.append(title, artist, stats, play);
    card.append(cover, info);
    card.addEventListener('click', () => void toggleSong(song));
    return card;
}

function renderContainer(container, items, compact) {
    if (!container) return;
    container.replaceChildren();
    container.dataset.androidSongFeed = 'true';
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'android-song-feed-empty';
        empty.textContent = 'No hay música disponible por ahora.';
        empty.style.cssText = 'padding:14px;color:var(--text-muted);font-size:13px;';
        container.appendChild(empty);
        return;
    }
    items.forEach((song) => container.appendChild(createSongCard(song, compact)));
}

function renderAll() {
    const recent = songs.slice(0, 12);
    const byPlays = [...songs].sort((a, b) => b.playCount - a.playCount).slice(0, 8);
    const byLikes = [...songs].sort((a, b) => b.likeCount - a.likeCount).slice(0, 8);
    const featured = [...songs].sort((a, b) => (b.playCount + b.likeCount * 2) - (a.playCount + a.likeCount * 2)).slice(0, 8);

    renderContainer(document.getElementById('musicContainer'), recent, false);
    renderContainer(document.getElementById('featuredMusicContainer'), featured, true);
    renderContainer(document.getElementById('topPlaysList'), byPlays, false);
    renderContainer(document.getElementById('topLikesList'), byLikes, false);
}

function preserveAndroidFeed(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let scheduled = false;
    const observer = new MutationObserver(() => {
        const ownsContent = container.querySelector('.android-song-feed-item, .android-song-feed-empty');
        if (ownsContent || scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            renderAll();
        });
    });
    observer.observe(container, { childList: true });
}

document.addEventListener('DOMContentLoaded', () => {
    ['musicContainer', 'featuredMusicContainer', 'topPlaysList', 'topLikesList'].forEach(preserveAndroidFeed);
    onValue(ref(db, 'Songs'), (snapshot) => {
        const list = [];
        snapshot.forEach((child) => {
            const song = normalizeSong(child.key, child.val());
            if (song && String(child.val()?.privacy || 'public').toLowerCase() === 'public') {
                list.push(song);
            }
        });
        songs = list.sort((a, b) => b.timestamp - a.timestamp);
        renderAll();
    }, (error) => {
        console.error('No fue posible cargar Songs', error);
    });
});
