/**
 * MusicPlayerManager - Adaptado de Android para proyecto HTML.
 * Gestiona cola, reproducción, shuffle, repeat y recientes (localStorage).
 */
const MusicPlayerManager = (function () {
    const REPEAT_OFF = 0;
    const REPEAT_ALL = 1;
    const REPEAT_ONE = 2;
    const STORAGE_RECENT_KEY = 'music_recent_ids';
    const MAX_RECENT = 30;

    let instance = null;
    let audio = null;
    let currentSong = null;
    let queue = [];
    let currentIndex = 0;
    let isPlaying = false;
    let shuffleMode = false;
    let repeatMode = REPEAT_OFF;
    let listener = null;
    const extraListeners = [];
    const queueListeners = [];
    let progressInterval = null;

    /**
     * Normaliza un objeto canción del proyecto (web uid/id o Android Songs).
     * @param {Object} raw - { id, url|audioUrl, title, artist, coverUrl, duration, userId|pId }
     * @returns {{ id, audioUrl, title, artist, coverUrl, duration, pId }}
     */
    function normalizeSong(raw) {
        if (!raw || !raw.id) return null;
        return {
            id: raw.id,
            audioUrl: raw.audioUrl || raw.url || '',
            title: raw.title || 'Sin título',
            artist: raw.artist || 'Artista',
            coverUrl: raw.coverUrl || '',
            duration: raw.duration || '0:00',
            durationMs: raw.durationMs || 0,
            pId: raw.pId || raw.userId || ''
        };
    }

    function notifyPlayStateChanged(playing) {
        isPlaying = playing;
        if (listener) listener.onPlayStateChanged(playing);
        extraListeners.forEach(l => l.onPlayStateChanged(playing));
    }

    function notifySongChanged(song) {
        if (listener) listener.onSongChanged(song);
        extraListeners.forEach(l => l.onSongChanged(song));
    }

    function notifyProgress(currentMs, totalMs) {
        if (listener) listener.onProgress(currentMs, totalMs);
        extraListeners.forEach(l => l.onProgress(currentMs, totalMs));
    }

    function notifyQueueChanged() {
        queueListeners.forEach(l => l.onQueueChanged());
    }

    function saveRecentlyPlayed(songId) {
        try {
            let ids = [];
            const stored = localStorage.getItem(STORAGE_RECENT_KEY);
            if (stored) ids = stored.split(',').map(s => s.trim()).filter(Boolean);
            ids = [songId, ...ids.filter(id => id !== songId)].slice(0, MAX_RECENT);
            localStorage.setItem(STORAGE_RECENT_KEY, ids.join(','));
        } catch (e) { /* ignore */ }
    }

    function getRecentIds() {
        try {
            const stored = localStorage.getItem(STORAGE_RECENT_KEY);
            return stored ? stored.split(',').map(s => s.trim()).filter(Boolean) : [];
        } catch (e) {
            return [];
        }
    }

    function startProgressUpdates() {
        stopProgressUpdates();
        progressInterval = setInterval(() => {
            if (!audio || !isPlaying) return;
            const current = Math.floor(audio.currentTime * 1000);
            const total = isFinite(audio.duration) ? Math.floor(audio.duration * 1000) : 0;
            notifyProgress(current, total);
        }, 500);
    }

    function stopProgressUpdates() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function playNextInternal() {
        if (repeatMode === REPEAT_ONE && currentSong) {
            play(currentSong, queue);
            return;
        }
        if (currentIndex + 1 < queue.length) {
            currentIndex++;
            play(queue[currentIndex], queue);
        } else if (repeatMode === REPEAT_ALL && queue.length) {
            currentIndex = 0;
            play(queue[0], queue);
        } else {
            isPlaying = false;
            stopProgressUpdates();
            notifyPlayStateChanged(false);
        }
    }

    class Manager {
        static get REPEAT_OFF() { return REPEAT_OFF; }
        static get REPEAT_ALL() { return REPEAT_ALL; }
        static get REPEAT_ONE() { return REPEAT_ONE; }

        static getInstance() {
            if (!instance) instance = new Manager();
            return instance;
        }

        setListener(l) { listener = l; }
        addExtraListener(l) {
            if (l && !extraListeners.includes(l)) extraListeners.push(l);
        }
        removeExtraListener(l) {
            const i = extraListeners.indexOf(l);
            if (i !== -1) extraListeners.splice(i, 1);
        }
        addQueueListener(l) {
            if (l && !queueListeners.includes(l)) queueListeners.push(l);
        }
        removeQueueListener(l) {
            const i = queueListeners.indexOf(l);
            if (i !== -1) queueListeners.splice(i, 1);
        }

        isShuffleMode() { return shuffleMode; }
        setShuffleMode(on) { shuffleMode = !!on; }
        toggleShuffle() { shuffleMode = !shuffleMode; }

        getRepeatMode() { return repeatMode; }
        setRepeatMode(mode) { repeatMode = mode; }
        cycleRepeat() { repeatMode = (repeatMode + 1) % 3; }

        getQueue() { return queue.slice(); }
        getCurrentIndex() { return currentIndex; }
        getCurrentSong() { return currentSong; }
        isPlaying() { return isPlaying; }
        getCurrentPosition() {
            return audio ? Math.floor(audio.currentTime * 1000) : 0;
        }
        getDuration() {
            return audio && isFinite(audio.duration) ? Math.floor(audio.duration * 1000) : 0;
        }

        addToQueue(song) {
            const s = normalizeSong(song);
            if (s && s.audioUrl) {
                queue.push(s);
                notifyQueueChanged();
            }
        }

        removeFromQueue(index) {
            if (index >= 0 && index < queue.length && index !== currentIndex) {
                queue.splice(index, 1);
                if (index < currentIndex) currentIndex--;
                notifyQueueChanged();
            }
        }

        clearQueue() {
            if (currentSong && currentIndex < queue.length) {
                const keep = queue[currentIndex];
                queue = [keep];
                currentIndex = 0;
            } else {
                queue = [];
                currentIndex = 0;
            }
            notifyQueueChanged();
        }

        play(song, playlist) {
            const s = normalizeSong(song);
            if (!s || !s.audioUrl) return;

            if (!audio) audio = new Audio();

            queue = Array.isArray(playlist) && playlist.length
                ? playlist.map(normalizeSong).filter(Boolean)
                : [s];
            currentIndex = 0;
            for (let i = 0; i < queue.length; i++) {
                if (queue[i].id === s.id) {
                    currentIndex = i;
                    break;
                }
            }
            if (queue.length === 0) queue = [s];

            if (shuffleMode && queue.length > 1) {
                const current = queue[currentIndex];
                for (let i = queue.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [queue[i], queue[j]] = [queue[j], queue[i]];
                }
                const idx = queue.findIndex(item => item.id === current.id);
                if (idx > 0) {
                    queue.splice(idx, 1);
                    queue.unshift(current);
                    currentIndex = 0;
                }
            }

            currentSong = s;
            audio.src = s.audioUrl;
            audio.load();
            audio.play().then(() => {
                saveRecentlyPlayed(s.id);
                notifyPlayStateChanged(true);
                notifySongChanged(currentSong);
                notifyQueueChanged();
                startProgressUpdates();
            }).catch(() => {
                notifyPlayStateChanged(false);
            });

            audio.onended = () => {
                isPlaying = false;
                stopProgressUpdates();
                notifyPlayStateChanged(false);
                playNextInternal();
            };
        }

        togglePlayPause() {
            if (!audio) return;
            if (isPlaying) {
                audio.pause();
                stopProgressUpdates();
            } else {
                audio.play();
                startProgressUpdates();
            }
            isPlaying = !isPlaying;
            notifyPlayStateChanged(isPlaying);
        }

        seekTo(ms) {
            if (audio) audio.currentTime = ms / 1000;
        }

        playNext() {
            if (currentIndex + 1 < queue.length) {
                currentIndex++;
                this.play(queue[currentIndex], queue);
            }
        }

        playPrevious() {
            if (audio && audio.currentTime > 3) {
                audio.currentTime = 0;
                return;
            }
            if (repeatMode === REPEAT_ONE && currentSong) {
                this.play(currentSong, queue);
                return;
            }
            if (currentIndex > 0) {
                currentIndex--;
                this.play(queue[currentIndex], queue);
            } else if (repeatMode === REPEAT_ALL && queue.length) {
                currentIndex = queue.length - 1;
                this.play(queue[currentIndex], queue);
            } else if (currentSong) {
                audio.currentTime = 0;
            }
        }

        release() {
            stopProgressUpdates();
            if (audio) {
                audio.pause();
                audio.src = '';
            }
            currentSong = null;
            isPlaying = false;
            notifyPlayStateChanged(false);
        }

        hasActiveSession() {
            return currentSong != null;
        }

        static getRecentlyPlayedIds() {
            return getRecentIds();
        }

        normalizeSong(song) {
            return normalizeSong(song);
        }
    }

    return Manager;
})();

// UMD / global para uso en HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MusicPlayerManager };
}
if (typeof window !== 'undefined') {
    window.MusicPlayerManager = MusicPlayerManager;
}
