/**
 * Adaptadores de música - equivalentes HTML a los RecyclerView.Adapter de Android.
 * Renderizan: álbumes (grid), canciones, artistas, comentarios, playlists.
 */

(function (global) {
    const DEFAULT_AVATAR = 'assets/avatar.png';
    const SONGS_LABEL = 'canciones';

    function songLink(song, options) {
        const opt = options || {};
        if (opt.songPageBase === false) return '#';
        const base = opt.songPageBase || 'song.html';
        if (opt.useSongIdOnly && song.id) {
            return `${base}?id=${encodeURIComponent(song.id)}`;
        }
        const uid = song.pId || song.userId || '';
        const id = song.id || '';
        return `${base}?uid=${encodeURIComponent(uid)}&id=${encodeURIComponent(id)}`;
    }

    /**
     * AdapterAlbumGrid: grid de álbumes (nombre, portada primera canción, cantidad).
     * albumNames: string[], albumsMap: { [albumName]: ModelSong[] }, artistId: string
     */
    function renderAlbumGrid(container, albumNames, albumsMap, artistId, options) {
        if (!container) return;
        container.innerHTML = '';
        const manager = global.MusicPlayerManager && global.MusicPlayerManager.getInstance();
        const opt = options || {};

        (albumNames || []).forEach(albumName => {
            const songs = (albumsMap && albumsMap[albumName]) || [];
            if (!songs.length) return;

            const first = songs[0];
            const coverUrl = first.coverUrl || first.cover || '';
            const card = document.createElement('div');
            card.className = 'album-card';
            card.style.cssText = 'border-radius:16px;overflow:hidden;background:var(--card-bg, #f8fafc);box-shadow:0 4px 12px rgba(0,0,0,0.06);cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;';
            card.innerHTML = `
                <div class="album-cover" style="aspect-ratio:1;overflow:hidden;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);">
                    ${coverUrl ? `<img src="${coverUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">` : '<span style="font-size:48px;display:flex;align-items:center;justify-content:center;height:100%;">🎵</span>'}
                </div>
                <div class="album-info" style="padding:12px;">
                    <div class="album-name" style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(albumName || 'Sin álbum').replace(/</g, '&lt;')}</div>
                    <div class="album-song-count" style="font-size:12px;color:#64748b;">${songs.length} ${SONGS_LABEL}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                if (manager) manager.play(first, songs);
                window.location.href = songLink(first, opt);
            });
            container.appendChild(card);
        });
    }

    /**
     * AdapterAlbumSong / AdapterSong: lista de canciones (cover, título, artista, play).
     * songList: ModelSong[], onSongClick(song, index)
     */
    function renderSongList(container, songList, options) {
        if (!container) return;
        container.innerHTML = '';
        const manager = global.MusicPlayerManager && global.MusicPlayerManager.getInstance();
        const opt = options || {};
        const onSongClick = opt.onSongClick || (() => {});

        (songList || []).forEach((song, index) => {
            const coverUrl = song.coverUrl || song.cover || '';
            const item = document.createElement('div');
            item.className = 'song-row';
            item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer;transition:background 0.2s;';
            item.innerHTML = `
                <div class="song-cover" style="width:48px;height:48px;border-radius:10px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);">
                    ${coverUrl ? `<img src="${coverUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">` : '<span style="font-size:24px;display:flex;align-items:center;justify-content:center;height:100%;">🎵</span>'}
                </div>
                <div style="flex:1;min-width:0;">
                    <div class="song-title" style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(song.title || 'Sin título').replace(/</g, '&lt;')}</div>
                    <div class="song-artist" style="font-size:12px;color:#64748b;">${(song.artist || '').replace(/</g, '&lt;')}</div>
                </div>
                <button type="button" class="btn-play-song" style="width:40px;height:40px;border-radius:50%;border:none;background:var(--primary-color,#007bff);color:#fff;cursor:pointer;flex-shrink:0;">▶</button>
            `;
            const playBtn = item.querySelector('.btn-play-song');
            const goToSong = () => {
                if (manager) manager.play(song, songList);
                onSongClick(song, index);
                const link = songLink(song, opt);
                if (opt.openSongPage !== false) window.location.href = link;
            };
            item.addEventListener('click', (e) => { if (!e.target.classList.contains('btn-play-song')) goToSong(); });
            playBtn.addEventListener('click', (e) => { e.stopPropagation(); goToSong(); });
            container.appendChild(item);
        });
    }

    /**
     * AdapterArtist: lista de artistas (avatar, nombre). Click -> perfil artista.
     * artistList: { id, name, photo }[]
     */
    function renderArtistList(container, artistList, options) {
        if (!container) return;
        container.innerHTML = '';
        const opt = options || {};
        const profileBase = opt.profileBase || 'userprofile.html';

        (artistList || []).forEach(artist => {
            const photo = artist.photo || artist.photoURL || '';
            const item = document.createElement('div');
            item.className = 'artist-item';
            item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer;transition:background 0.2s;flex-shrink:0;';
            item.innerHTML = `
                <div class="artist-avatar" style="width:56px;height:56px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);">
                    ${photo ? `<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;">` : `<img src="${DEFAULT_AVATAR}" alt="" style="width:100%;height:100%;object-fit:cover;">`}
                </div>
                <div class="artist-name" style="font-weight:600;font-size:14px;">${(artist.name || 'Artista').replace(/</g, '&lt;')}</div>
            `;
            item.addEventListener('click', () => {
                window.location.href = `${profileBase}?uid=${encodeURIComponent(artist.id)}`;
            });
            container.appendChild(item);
        });
    }

    /**
     * AdapterMusicComment: lista de comentarios (avatar, nombre, texto, tiempo).
     * commentList: { id (userId), comment, timestamp, cId }[]
     * loadUser(uid, callback) opcional para cargar name/photo desde Firebase
     */
    function renderMusicComments(container, commentList, options) {
        if (!container) return;
        container.innerHTML = '';
        const opt = options || {};
        const profileBase = opt.profileBase || 'userprofile.html';
        const loadUser = opt.loadUser || (() => {});

        (commentList || []).forEach(comment => {
            const item = document.createElement('div');
            item.className = 'music-comment-item';
            item.style.cssText = 'display:flex;gap:12px;padding:12px;border-radius:12px;cursor:pointer;transition:background 0.2s;';
            item.innerHTML = `
                <div class="comment-avatar" style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#e2e8f0;">
                    <img src="${DEFAULT_AVATAR}" alt="" style="width:100%;height:100%;object-fit:cover;">
                </div>
                <div style="flex:1;min-width:0;">
                    <div class="comment-username" style="font-weight:600;font-size:13px;">Cargando...</div>
                    <div class="comment-text" style="font-size:13px;color:#334155;">${(comment.comment || '').replace(/</g, '&lt;')}</div>
                    <div class="comment-time" style="font-size:11px;color:#94a3b8;"></div>
                </div>
            `;
            const timeStr = formatTimeAgo(comment.timestamp);
            item.querySelector('.comment-time').textContent = timeStr || '';

            loadUser(comment.id, (user) => {
                const usernameEl = item.querySelector('.comment-username');
                const avatarImg = item.querySelector('.comment-avatar img');
                if (usernameEl) usernameEl.textContent = user.name || 'Usuario';
                if (avatarImg && user.photo) avatarImg.src = user.photo;
            });

            item.addEventListener('click', () => {
                if (comment.id) window.location.href = `${profileBase}?uid=${encodeURIComponent(comment.id)}`;
            });
            container.appendChild(item);
        });
    }

    function formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        if (isNaN(ts)) return '';
        const sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 60) return 'Ahora';
        if (sec < 3600) return Math.floor(sec / 60) + ' min';
        if (sec < 86400) return Math.floor(sec / 3600) + ' h';
        if (sec < 2592000) return Math.floor(sec / 86400) + ' d';
        if (sec < 31536000) return Math.floor(sec / 2592000) + ' mes';
        return Math.floor(sec / 31536000) + ' a';
    }

    /**
     * AdapterPlaylist: lista de playlists (portada, nombre, cantidad, abrir, compartir).
     * playlistList: { id, name, coverUrl, songCount, shareCode }[]
     */
    function renderPlaylistList(container, playlistList, options) {
        if (!container) return;
        container.innerHTML = '';
        const opt = options || {};
        const detailBase = opt.playlistDetailBase || 'playlist-detail.html';
        const onSelect = opt.onPlaylistSelect || null;

        (playlistList || []).forEach(playlist => {
            const coverUrl = playlist.coverUrl || playlist.cover || '';
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.style.cssText = 'border-radius:16px;overflow:hidden;background:var(--card-bg,#f8fafc);box-shadow:0 4px 12px rgba(0,0,0,0.06);cursor:pointer;transition:transform 0.2s;';
            card.innerHTML = `
                <div class="playlist-cover" style="aspect-ratio:1;overflow:hidden;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);">
                    ${coverUrl ? `<img src="${coverUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">` : '<span style="font-size:48px;display:flex;align-items:center;justify-content:center;height:100%;">📀</span>'}
                </div>
                <div style="padding:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <div style="flex:1;min-width:0;">
                        <div class="playlist-name" style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(playlist.name || 'Playlist').replace(/</g, '&lt;')}</div>
                        <div class="playlist-song-count" style="font-size:12px;color:#64748b;">${playlist.songCount != null ? playlist.songCount : 0} ${SONGS_LABEL}</div>
                    </div>
                    <button type="button" class="btn-open-playlist" style="width:36px;height:36px;border-radius:50%;border:none;background:var(--primary-color,#007bff);color:#fff;cursor:pointer;">▶</button>
                </div>
            `;
            const openBtn = card.querySelector('.btn-open-playlist');
            const open = () => {
                if (onSelect) onSelect(playlist);
                else window.location.href = `${detailBase}?id=${encodeURIComponent(playlist.id)}`;
            };
            card.addEventListener('click', (e) => { if (e.target !== openBtn) open(); });
            openBtn.addEventListener('click', (e) => { e.stopPropagation(); open(); });
            container.appendChild(card);
        });
    }

    /**
     * AdapterPlaylistFeed: playlists con dueño (foto, nombre). Para feed compartido.
     */
    function renderPlaylistFeed(container, playlistList, options) {
        if (!container) return;
        container.innerHTML = '';
        const opt = options || {};
        const detailBase = opt.playlistDetailBase || 'playlist-detail.html';
        const loadOwner = opt.loadOwner || (() => {});

        (playlistList || []).forEach(playlist => {
            const coverUrl = playlist.coverUrl || playlist.cover || '';
            const card = document.createElement('div');
            card.className = 'playlist-feed-card';
            card.style.cssText = 'border-radius:16px;overflow:hidden;background:var(--card-bg,#f8fafc);box-shadow:0 4px 12px rgba(0,0,0,0.06);cursor:pointer;transition:transform 0.2s;';
            card.innerHTML = `
                <div class="playlist-cover" style="aspect-ratio:1;overflow:hidden;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);">
                    ${coverUrl ? `<img src="${coverUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">` : '<span style="font-size:48px;display:flex;align-items:center;justify-content:center;height:100%;">📀</span>'}
                </div>
                <div style="padding:12px;">
                    <div class="playlist-name" style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(playlist.name || 'Playlist').replace(/</g, '&lt;')}</div>
                    <div class="playlist-song-count" style="font-size:12px;color:#64748b;">${playlist.songCount != null ? playlist.songCount : 0} ${SONGS_LABEL}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                        <div class="owner-photo" style="width:24px;height:24px;border-radius:50%;overflow:hidden;background:#e2e8f0;"><img src="${DEFAULT_AVATAR}" alt="" style="width:100%;height:100%;object-fit:cover;"></div>
                        <div class="owner-name" style="font-size:12px;color:#64748b;">...</div>
                    </div>
                </div>
            `;
            const ownerPhoto = card.querySelector('.owner-photo img');
            const ownerName = card.querySelector('.owner-name');
            loadOwner(playlist.pId || playlist.ownerId, (user) => {
                if (ownerName) ownerName.textContent = user.name || 'Usuario';
                if (ownerPhoto && user.photo) ownerPhoto.src = user.photo;
            });
            card.addEventListener('click', () => {
                window.location.href = `${detailBase}?id=${encodeURIComponent(playlist.id)}`;
            });
            container.appendChild(card);
        });
    }

    const api = {
        renderAlbumGrid,
        renderSongList,
        renderArtistList,
        renderMusicComments,
        renderPlaylistList,
        renderPlaylistFeed,
        songLink,
        formatTimeAgo
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.MusicAdapters = api;
    }
})(typeof window !== 'undefined' ? window : this);
