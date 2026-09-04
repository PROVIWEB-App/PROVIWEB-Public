/**
 * Helpers Firebase para música - rutas compatibles con la app Android.
 * Songs, UserSongs, Playlists, UserPlaylists, SongLikes, MusicComments, ShareCodes, Users.
 * Uso: pasar db (getDatabase()) y las funciones ref, onValue, get, set, push, remove desde la página.
 */

(function (global) {
    function noop() {}

    /**
     * Convierte snapshot de canción (Songs/{id} o AudiosPlay/uid/id) a objeto normalizado.
     */
    function mapToSong(snap, idOverride) {
        const key = idOverride != null ? idOverride : (snap && snap.key);
        const data = (snap && typeof snap.val === 'function' ? snap.val() : snap) || {};
        const getStr = (obj, k) => {
            const val = obj[k];
            return val != null ? String(val) : '';
        };
        const getNum = (obj, k, def) => {
            const val = obj[k];
            return val != null ? Number(val) : def;
        };
        return {
            id: key,
            pId: getStr(data, 'pId') || getStr(data, 'userId') || '',
            userId: getStr(data, 'pId') || getStr(data, 'userId') || '',
            title: getStr(data, 'title'),
            artist: getStr(data, 'artist'),
            album: getStr(data, 'album'),
            audioUrl: getStr(data, 'audioUrl') || getStr(data, 'url'),
            url: getStr(data, 'audioUrl') || getStr(data, 'url'),
            coverUrl: getStr(data, 'coverUrl') || getStr(data, 'cover'),
            duration: getStr(data, 'duration'),
            durationMs: getNum(data, 'durationMs', 0),
            likeCount: getNum(data, 'likeCount', 0),
            commentCount: getNum(data, 'commentCount', 0),
            playCount: getNum(data, 'playCount', 0),
            verificationStatus: getStr(data, 'verificationStatus'),
            rejectionReason: getStr(data, 'rejectionReason'),
            genre: getStr(data, 'genre'),
            timestamp: getStr(data, 'timestamp') || getNum(data, 'timestamp', 0)
        };
    }

    /**
     * Carga canciones del usuario desde UserSongs -> Songs (Android) o AudiosPlay (legacy).
     * Si db tiene Songs, usa ref(db, 'UserSongs', uid) y luego Songs por cada id.
     * Si no, usa ref(db, 'AudiosPlay', uid) y mapea cada hijo.
     */
    function loadUserSongs(db, ref, onValue, get, uid, onResult) {
        const out = [];
        const userSongsRef = ref(db, `UserSongs/${uid}`);
        onValue(userSongsRef, (snap) => {
            if (!snap.exists()) {
                tryLegacyAudiosPlay();
                return;
            }
            const ids = Object.keys(snap.val() || {});
            if (ids.length === 0) {
                onResult(out);
                return;
            }
            let done = 0;
            ids.forEach((songId) => {
                const songRef = ref(db, `Songs/${songId}`);
                get(songRef).then((songSnap) => {
                    if (songSnap.exists()) {
                        const s = mapToSong(songSnap);
                        if (s.audioUrl) out.push(s);
                    }
                    done++;
                    if (done === ids.length) onResult(out);
                }).catch(() => {
                    done++;
                    if (done === ids.length) onResult(out);
                });
            });
        }, { onlyOnce: true });

        function tryLegacyAudiosPlay() {
            const audiosRef = ref(db, `AudiosPlay/${uid}`);
            onValue(audiosRef, (snap) => {
                if (!snap.exists()) {
                    onResult(out);
                    return;
                }
                snap.forEach((child) => {
                    const s = mapToSong(child, child.key);
                    s.userId = uid;
                    s.songKey = `${uid}_${child.key}`;
                    if (s.audioUrl || s.url) out.push(s);
                });
                onResult(out);
            }, { onlyOnce: true });
        }
    }

    /**
     * Carga todas las canciones desde Songs (Android) o desde Users -> AudiosPlay (legacy).
     */
    function loadAllSongs(db, ref, onValue, get, onResult) {
        const songsRef = ref(db, 'Songs');
        onValue(songsRef, (snap) => {
            const out = [];
            if (snap.exists()) {
                snap.forEach((child) => {
                    const s = mapToSong(child);
                    if (s.audioUrl) out.push(s);
                });
            }
            if (out.length > 0) {
                onResult(out);
                return;
            }
            loadAllSongsLegacy(db, ref, onValue, onResult);
        }, { onlyOnce: true });
    }

    function loadAllSongsLegacy(db, ref, onValue, onResult) {
        const usersRef = ref(db, 'Users');
        const out = [];
        let total = 0;
        let done = 0;
        onValue(usersRef, (usersSnap) => {
            if (!usersSnap.exists()) {
                onResult(out);
                return;
            }
            const uids = Object.keys(usersSnap.val() || {});
            total = uids.length;
            if (total === 0) {
                onResult(out);
                return;
            }
            uids.forEach((userId) => {
                const musicRef = ref(db, `AudiosPlay/${userId}`);
                onValue(musicRef, (musicSnap) => {
                    if (musicSnap.exists()) {
                        musicSnap.forEach((songSnap) => {
                            const s = mapToSong(songSnap, songSnap.key);
                            s.userId = userId;
                            s.songKey = `${userId}_${songSnap.key}`;
                            if (s.audioUrl || s.url) out.push(s);
                        });
                    }
                    done++;
                    if (done === total) onResult(out);
                }, { onlyOnce: true });
            });
        }, { onlyOnce: true });
    }

    /**
     * Carga playlists del usuario: UserPlaylists -> Playlists.
     */
    function loadUserPlaylists(db, ref, onValue, get, uid, onResult) {
        const out = [];
        const userPlRef = ref(db, `UserPlaylists/${uid}`);
        onValue(userPlRef, (snap) => {
            if (!snap.exists()) {
                onResult(out);
                return;
            }
            const ids = Object.keys(snap.val() || {});
            if (ids.length === 0) {
                onResult(out);
                return;
            }
            let done = 0;
            ids.forEach((plId) => {
                const plRef = ref(db, `Playlists/${plId}`);
                get(plRef).then((plSnap) => {
                    if (plSnap.exists()) {
                        const d = plSnap.val();
                        out.push({
                            id: plSnap.key,
                            pId: d.pId || '',
                            name: d.name || '',
                            description: d.description || '',
                            coverUrl: d.coverUrl || '',
                            shareCode: d.shareCode || '',
                            songCount: d.songCount != null ? d.songCount : 0,
                            songIds: d.songIds ? Object.keys(d.songIds) : []
                        });
                    }
                    done++;
                    if (done === ids.length) onResult(out);
                }).catch(() => {
                    done++;
                    if (done === ids.length) onResult(out);
                });
            });
        }, { onlyOnce: true });
        return out;
    }

    /**
     * Carga detalle de una playlist por id y opcionalmente las canciones.
     */
    function loadPlaylistDetail(db, ref, get, playlistId, onPlaylist, onSongs) {
        const plRef = ref(db, `Playlists/${playlistId}`);
        get(plRef).then((plSnap) => {
            if (!plSnap.exists()) {
                if (onPlaylist) onPlaylist(null);
                if (onSongs) onSongs([]);
                return;
            }
            const d = plSnap.val();
            const playlist = {
                id: plSnap.key,
                pId: d.pId || '',
                name: d.name || '',
                description: d.description || '',
                coverUrl: d.coverUrl || '',
                shareCode: d.shareCode || '',
                songCount: d.songCount != null ? d.songCount : 0,
                songIds: d.songIds ? Object.keys(d.songIds) : []
            };
            if (onPlaylist) onPlaylist(playlist);
            if (!onSongs || !playlist.songIds.length) {
                if (onSongs) onSongs([]);
                return;
            }
            const songs = [];
            let done = 0;
            playlist.songIds.forEach((songId) => {
                get(ref(db, `Songs/${songId}`)).then((songSnap) => {
                    if (songSnap.exists()) {
                        const s = mapToSong(songSnap);
                        if (s.audioUrl) songs.push(s);
                    }
                    done++;
                    if (done === playlist.songIds.length) onSongs(songs);
                }).catch(() => {
                    done++;
                    if (done === playlist.songIds.length) onSongs(songs);
                });
            });
        });
    }

    /**
     * Abrir playlist por código de compartir: ShareCodes -> playlistId.
     */
    function loadPlaylistByShareCode(db, ref, get, code, onResult) {
        const codeRef = ref(db, `ShareCodes/${String(code).trim().toUpperCase()}`);
        get(codeRef).then((snap) => {
            const playlistId = snap.exists() ? snap.val() : null;
            onResult(playlistId);
        }).catch(() => onResult(null));
    }

    /**
     * Canciones y álbumes por artista (pId). Devuelve { songList, albumNames, albumsMap }.
     */
    function loadArtistSongsAndAlbums(db, ref, onValue, artistId, onResult) {
        const songsRef = ref(db, 'Songs');
        const songList = [];
        const albumsMap = {};
        const albumNames = [];
        onValue(songsRef, (snap) => {
            if (!snap.exists()) {
                onResult({ songList, albumNames, albumsMap });
                return;
            }
            snap.forEach((child) => {
                const s = mapToSong(child);
                if (s.pId !== artistId || !s.audioUrl) return;
                songList.push(s);
                const album = (s.album || '').trim() || 'Sin álbum';
                if (!albumsMap[album]) {
                    albumsMap[album] = [];
                    albumNames.push(album);
                }
                albumsMap[album].push(s);
            });
            onResult({ songList, albumNames, albumsMap });
        }, { onlyOnce: true });
    }

    /**
     * Comentarios de una canción: MusicComments/{songId}, tipo "song".
     */
    function loadMusicComments(db, ref, onValue, songId, onResult) {
        const commentsRef = ref(db, `MusicComments/${songId}`);
        const list = [];
        onValue(commentsRef, (snap) => {
            if (!snap.exists()) {
                onResult(list);
                return;
            }
            snap.forEach((child) => {
                const d = child.val();
                if (d.type === 'song') {
                    list.push({
                        cId: child.key,
                        songId,
                        id: d.id || '',
                        comment: d.comment || '',
                        timestamp: d.timestamp || ''
                    });
                }
            });
            list.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
            onResult(list);
        });
    }

    /**
     * Cargar usuario (Users/{uid}) para nombre/foto.
     */
    function loadUser(db, ref, get, uid, onResult) {
        if (!uid) {
            onResult({ name: '', photo: '' });
            return;
        }
        get(ref(db, `Users/${uid}`)).then((snap) => {
            if (!snap.exists()) {
                onResult({ name: '', photo: '' });
                return;
            }
            const d = snap.val();
            onResult({ name: d.name || '', photo: d.photo || '' });
        }).catch(() => onResult({ name: '', photo: '' }));
    }

    const api = {
        mapToSong,
        loadUserSongs,
        loadAllSongs,
        loadUserPlaylists,
        loadPlaylistDetail,
        loadPlaylistByShareCode,
        loadArtistSongsAndAlbums,
        loadMusicComments,
        loadUser
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.MusicFirebase = api;
    }
})(typeof window !== 'undefined' ? window : this);
