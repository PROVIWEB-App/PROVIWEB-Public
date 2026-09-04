/**
 * PROVIWEB - Sistema Universal de Multimedia para Publicaciones
 * Soporte completo y unificado para:
 * 1. Imagen única (con zoom y lightbox)
 * 2. Múltiples imágenes (carrusel táctil, flechas, contador 📷 1/N, lightbox fullscreen)
 * 3. Video (reproductor HTML5 optimizado, thumbnail de portada, playsinline)
 * 4. Audio (reproductor moderno con onda animada, barra interactiva, tiempo, volumen)
 * 5. Partituras / Sheet Music (previsualización y visor de PDF)
 * 6. Fondos / Background posts
 */

(function (global) {
    'use strict';

    // Lista global de reproductores activos para pausar automáticamente al reproducir otro
    const activeMediaElements = new Set();

    function pauseAllOtherMedia(currentElement) {
        activeMediaElements.forEach((el) => {
            if (el && el !== currentElement) {
                try {
                    if (typeof el.pause === 'function') el.pause();
                } catch (e) {
                    console.warn('[PostMedia] Error pausando elemento:', e);
                }
            }
        });
        if (currentElement) {
            activeMediaElements.add(currentElement);
        }
    }

    function isUsableUrl(value) {
        if (typeof value !== 'string') return false;
        const trimmed = value.trim();
        return trimmed !== '' &&
            trimmed !== 'noImage' &&
            trimmed !== 'noVideo' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined' &&
            !trimmed.startsWith('blob:null');
    }

    function isAudioUrl(url) {
        if (!isUsableUrl(url)) return false;
        const clean = url.split('?')[0].toLowerCase();
        return clean.endsWith('.mp3') ||
            clean.endsWith('.wav') ||
            clean.endsWith('.m4a') ||
            clean.endsWith('.ogg') ||
            clean.endsWith('.aac') ||
            clean.endsWith('.flac') ||
            clean.endsWith('.opus') ||
            url.includes('post_audio') ||
            url.includes('reel_audio');
    }

    function isVideoUrl(url) {
        if (!isUsableUrl(url)) return false;
        const clean = url.split('?')[0].toLowerCase();
        return clean.endsWith('.mp4') ||
            clean.endsWith('.webm') ||
            clean.endsWith('.mkv') ||
            clean.endsWith('.mov') ||
            clean.endsWith('.3gp') ||
            url.includes('post_video') ||
            url.includes('reel_videos') ||
            url.includes('series_video');
    }

    /**
     * Normaliza los datos de cualquier post (tanto de Android como de Web)
     */
    function normalizePostMedia(post) {
        if (!post || typeof post !== 'object') {
            return {
                type: 'text',
                images: [],
                singleImage: '',
                videoUrl: '',
                videoThumbnail: '',
                audioUrl: '',
                sheetContent: '',
                sheetCover: '',
                text: ''
            };
        }

        const rawType = String(post.type || '').trim().toLowerCase();
        const text = String(post.text || post.caption || post.description || '').trim();

        // 1. Extraer imágenes (compatible con Array y Objetos de Firebase {0: "...", 1: "..."})
        const imageList = [];
        if (Array.isArray(post.memes)) {
            post.memes.forEach((url) => {
                if (isUsableUrl(url) && !isAudioUrl(url) && !isVideoUrl(url)) {
                    imageList.push(String(url).trim());
                }
            });
        } else if (post.memes && typeof post.memes === 'object') {
            Object.values(post.memes).forEach((url) => {
                if (isUsableUrl(url) && !isAudioUrl(url) && !isVideoUrl(url)) {
                    imageList.push(String(url).trim());
                }
            });
        }

        if (isUsableUrl(post.meme) && !isAudioUrl(post.meme) && !isVideoUrl(post.meme)) {
            if (!imageList.includes(post.meme)) {
                // Si memes estaba vacío o no incluía el meme principal, agregarlo al inicio
                imageList.unshift(post.meme);
            }
        }

        // Si hay campos alternativos como imageUrl / photo / image
        [post.imageUrl, post.image, post.photo].forEach((altUrl) => {
            if (isUsableUrl(altUrl) && !isAudioUrl(altUrl) && !isVideoUrl(altUrl)) {
                if (!imageList.includes(altUrl)) imageList.push(altUrl);
            }
        });

        // 2. Extraer Video
        let videoUrl = '';
        const videoCandidates = [
            post.vine,
            post.videoUrl,
            post.videoURL,
            post.video_url,
            post.video,
            post.mediaUrl,
            post.mediaURL,
            post.url
        ];
        for (const candidate of videoCandidates) {
            if (isUsableUrl(candidate) && (isVideoUrl(candidate) || rawType === 'video' || rawType === 'videoserie')) {
                videoUrl = candidate;
                break;
            }
        }

        let videoThumbnail = '';
        if (isUsableUrl(post.thumbnail)) {
            videoThumbnail = post.thumbnail;
        } else if (isUsableUrl(post.meme) && !isAudioUrl(post.meme) && !isVideoUrl(post.meme)) {
            videoThumbnail = post.meme;
        }

        // 3. Extraer Audio
        let audioUrl = '';
        const audioCandidates = [
            post.audio,
            post.audioUrl,
            post.audioURL,
            post.songUrl,
            post.url,
            rawType === 'audio' ? post.meme : null,
            isAudioUrl(post.meme) ? post.meme : null
        ];
        for (const candidate of audioCandidates) {
            if (isUsableUrl(candidate) && (isAudioUrl(candidate) || rawType === 'audio')) {
                audioUrl = candidate;
                break;
            }
        }

        // 4. Partituras / Sheet Music
        const sheetContent = isUsableUrl(post.sheetContent) ? post.sheetContent : '';
        const sheetCover = isUsableUrl(post.sheetCover) ? post.sheetCover : (imageList[0] || '');

        // 5. Determinar tipo efectivo
        let effectiveType = 'text';
        if (rawType === 'audio' || (audioUrl && rawType !== 'video')) {
            effectiveType = 'audio';
        } else if (rawType === 'video' || rawType === 'videoserie' || videoUrl) {
            effectiveType = 'video';
        } else if (rawType === 'sheet_music' || sheetContent) {
            effectiveType = 'sheet_music';
        } else if (rawType === 'serie') {
            effectiveType = 'serie';
        } else if (rawType === 'bg' || rawType === 'party') {
            effectiveType = 'bg';
        } else if (rawType === 'gif') {
            effectiveType = 'gif';
        } else if (imageList.length > 1) {
            effectiveType = 'images';
        } else if (imageList.length === 1 || rawType === 'image') {
            effectiveType = 'image';
        } else {
            effectiveType = 'text';
        }

        return {
            type: effectiveType,
            rawType,
            images: imageList,
            singleImage: imageList[0] || '',
            videoUrl,
            videoThumbnail,
            audioUrl,
            sheetContent,
            sheetCover,
            text,
            isSeries: Boolean(post.isSeries || rawType === 'serie')
        };
    }

    function getVideoUrl(post) {
        return normalizePostMedia(post).videoUrl;
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Crea un reproductor de audio moderno con waveform animada, seekbar y contador de tiempo
     */
    function createAudioPlayer(audioUrl, options = {}) {
        const container = document.createElement('div');
        container.className = 'post-audio-player-card';

        const title = options.title || 'Pista de Audio';
        const subtitle = options.subtitle || 'PROVIWEB Audio';

        container.innerHTML = `
            <div class="audio-player-main">
                <button type="button" class="audio-play-btn" aria-label="Reproducir audio">
                    <span class="play-icon">▶</span>
                    <span class="pause-icon" style="display:none;">⏸</span>
                </button>
                <div class="audio-info-track">
                    <div class="audio-header-row">
                        <div class="audio-title-text" title="${title}">🎵 ${title}</div>
                        <div class="audio-wave-bars">
                            <span></span><span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                    <div class="audio-progress-wrap">
                        <input type="range" class="audio-seek-slider" min="0" max="100" value="0" step="0.1" aria-label="Progreso del audio">
                    </div>
                    <div class="audio-time-row">
                        <span class="audio-current-time">0:00</span>
                        <span class="audio-subtitle-text">${subtitle}</span>
                        <span class="audio-duration-time">--:--</span>
                    </div>
                </div>
            </div>
            <audio preload="metadata" src="${audioUrl}"></audio>
        `;

        const audio = container.querySelector('audio');
        const playBtn = container.querySelector('.audio-play-btn');
        const playIcon = container.querySelector('.play-icon');
        const pauseIcon = container.querySelector('.pause-icon');
        const seekSlider = container.querySelector('.audio-seek-slider');
        const currentTimeLabel = container.querySelector('.audio-current-time');
        const durationLabel = container.querySelector('.audio-duration-time');
        const waveBars = container.querySelector('.audio-wave-bars');

        let isSeeking = false;

        function updatePlayState(isPlaying) {
            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline';
                playBtn.classList.add('playing');
                waveBars.classList.add('active');
                pauseAllOtherMedia(audio);
            } else {
                playIcon.style.display = 'inline';
                pauseIcon.style.display = 'none';
                playBtn.classList.remove('playing');
                waveBars.classList.remove('active');
            }
        }

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play().then(() => updatePlayState(true)).catch((err) => {
                    console.warn('[PostMedia] Error reproduciendo audio:', err);
                });
            } else {
                audio.pause();
                updatePlayState(false);
            }
        });

        audio.addEventListener('play', () => updatePlayState(true));
        audio.addEventListener('pause', () => updatePlayState(false));
        audio.addEventListener('ended', () => {
            updatePlayState(false);
            seekSlider.value = 0;
            currentTimeLabel.textContent = '0:00';
        });

        audio.addEventListener('loadedmetadata', () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                durationLabel.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener('timeupdate', () => {
            if (!isSeeking && audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                seekSlider.value = progress;
                currentTimeLabel.textContent = formatTime(audio.currentTime);
                // Actualizar gradiente visual del slider
                seekSlider.style.background = `linear-gradient(to right, #a855f7 ${progress}%, rgba(255,255,255,0.15) ${progress}%)`;
            }
        });

        seekSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            isSeeking = true;
            if (audio.duration) {
                const targetTime = (seekSlider.value / 100) * audio.duration;
                currentTimeLabel.textContent = formatTime(targetTime);
                seekSlider.style.background = `linear-gradient(to right, #a855f7 ${seekSlider.value}%, rgba(255,255,255,0.15) ${seekSlider.value}%)`;
            }
        });

        seekSlider.addEventListener('change', (e) => {
            e.stopPropagation();
            if (audio.duration) {
                audio.currentTime = (seekSlider.value / 100) * audio.duration;
            }
            isSeeking = false;
        });

        return container;
    }

    /**
     * Modal Lightbox global para ver imágenes en tamaño completo con navegación
     */
    let lightboxModal = null;
    let currentLightboxImages = [];
    let currentLightboxIndex = 0;

    function initGlobalLightbox() {
        if (lightboxModal) return;

        lightboxModal = document.createElement('div');
        lightboxModal.className = 'proviweb-lightbox-modal';
        lightboxModal.id = 'proviwebGlobalLightbox';
        lightboxModal.style.display = 'none';

        lightboxModal.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content-box">
                <button type="button" class="lightbox-btn-close" title="Cerrar (Esc)">&times;</button>
                <button type="button" class="lightbox-btn-nav prev" title="Anterior (←)">&#10094;</button>
                <div class="lightbox-image-wrapper">
                    <img class="lightbox-main-img" src="" alt="Vista previa">
                </div>
                <button type="button" class="lightbox-btn-nav next" title="Siguiente (→)">&#10095;</button>
                <div class="lightbox-counter-footer">
                    <span class="lightbox-counter-text">1 / 1</span>
                    <a class="lightbox-download-link" href="#" target="_blank" rel="noopener" title="Abrir original">↗ Abrir</a>
                </div>
            </div>
        `;

        document.body.appendChild(lightboxModal);

        const closeBtn = lightboxModal.querySelector('.lightbox-btn-close');
        const prevBtn = lightboxModal.querySelector('.lightbox-btn-nav.prev');
        const nextBtn = lightboxModal.querySelector('.lightbox-btn-nav.next');
        const backdrop = lightboxModal.querySelector('.lightbox-backdrop');

        function updateLightboxView() {
            if (!currentLightboxImages.length) return;
            if (currentLightboxIndex < 0) currentLightboxIndex = currentLightboxImages.length - 1;
            if (currentLightboxIndex >= currentLightboxImages.length) currentLightboxIndex = 0;

            const url = currentLightboxImages[currentLightboxIndex];
            const img = lightboxModal.querySelector('.lightbox-main-img');
            const counter = lightboxModal.querySelector('.lightbox-counter-text');
            const download = lightboxModal.querySelector('.lightbox-download-link');

            img.src = url;
            counter.textContent = `${currentLightboxIndex + 1} de ${currentLightboxImages.length}`;
            download.href = url;

            prevBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';
            nextBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';
        }

        function closeLightbox() {
            lightboxModal.style.display = 'none';
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeLightbox);
        backdrop.addEventListener('click', closeLightbox);

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxIndex--;
            updateLightboxView();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxIndex++;
            updateLightboxView();
        });

        document.addEventListener('keydown', (e) => {
            if (lightboxModal.style.display === 'flex' || lightboxModal.style.display === 'block') {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') {
                    currentLightboxIndex--;
                    updateLightboxView();
                }
                if (e.key === 'ArrowRight') {
                    currentLightboxIndex++;
                    updateLightboxView();
                }
            }
        });

        // Swipe táctil en lightbox
        let touchStartX = 0;
        lightboxModal.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightboxModal.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) currentLightboxIndex--;
                else currentLightboxIndex++;
                updateLightboxView();
            }
        }, { passive: true });
    }

    function openLightbox(images, startIndex = 0) {
        initGlobalLightbox();
        currentLightboxImages = Array.isArray(images) ? images : [images];
        currentLightboxIndex = Math.max(0, Math.min(startIndex, currentLightboxImages.length - 1));

        if (!currentLightboxImages.length) return;

        const img = lightboxModal.querySelector('.lightbox-main-img');
        const counter = lightboxModal.querySelector('.lightbox-counter-text');
        const download = lightboxModal.querySelector('.lightbox-download-link');
        const prevBtn = lightboxModal.querySelector('.lightbox-btn-nav.prev');
        const nextBtn = lightboxModal.querySelector('.lightbox-btn-nav.next');

        const url = currentLightboxImages[currentLightboxIndex];
        img.src = url;
        counter.textContent = `${currentLightboxIndex + 1} de ${currentLightboxImages.length}`;
        download.href = url;

        prevBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = currentLightboxImages.length > 1 ? 'flex' : 'none';

        lightboxModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Crea un carrusel interactivo para múltiples imágenes
     */
    function createImageCarousel(images, options = {}) {
        const container = document.createElement('div');
        container.className = 'post-media-carousel-wrap';

        let currentIndex = 0;
        const total = images.length;

        container.innerHTML = `
            <div class="carousel-slide-viewport">
                <div class="carousel-track"></div>
                <button type="button" class="carousel-arrow prev" aria-label="Anterior">&#10094;</button>
                <button type="button" class="carousel-arrow next" aria-label="Siguiente">&#10095;</button>
                <div class="carousel-badge-counter">📷 1 / ${total}</div>
                <div class="carousel-dots-indicator"></div>
            </div>
        `;

        const track = container.querySelector('.carousel-track');
        const prevBtn = container.querySelector('.carousel-arrow.prev');
        const nextBtn = container.querySelector('.carousel-arrow.next');
        const badge = container.querySelector('.carousel-badge-counter');
        const dotsWrap = container.querySelector('.carousel-dots-indicator');

        images.forEach((url, idx) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide-item';
            const img = document.createElement('img');
            img.src = url;
            img.alt = `Foto ${idx + 1}`;
            img.loading = idx === 0 ? 'eager' : 'lazy';
            img.className = 'carousel-img';
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(images, idx);
            });
            slide.appendChild(img);
            track.appendChild(slide);

            const dot = document.createElement('span');
            dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                goToSlide(idx);
            });
            dotsWrap.appendChild(dot);
        });

        function goToSlide(index) {
            currentIndex = (index + total) % total;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            badge.textContent = `📷 ${currentIndex + 1} / ${total}`;
            const dots = dotsWrap.querySelectorAll('.carousel-dot');
            dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
        }

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(currentIndex - 1);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(currentIndex + 1);
        });

        // Soporte Swipe táctil en móvil
        let startX = 0;
        track.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].screenX;
            if (startX - endX > 40) goToSlide(currentIndex + 1);
            else if (endX - startX > 40) goToSlide(currentIndex - 1);
        }, { passive: true });

        return container;
    }

    /**
     * Renderiza cualquier tipo de multimedia en un contenedor dado
     */
    function renderPostMedia(post, targetContainer, options = {}) {
        if (!targetContainer) return null;
        const norm = normalizePostMedia(post);

        targetContainer.innerHTML = '';
        targetContainer.dataset.mediaType = norm.type;

        switch (norm.type) {
            case 'audio': {
                const audioPlayer = createAudioPlayer(norm.audioUrl, {
                    title: post.text || post.title || 'Audio de publicación',
                    subtitle: options.authorName || 'PROVIWEB'
                });
                targetContainer.appendChild(audioPlayer);
                return audioPlayer;
            }

            case 'images': {
                const carousel = createImageCarousel(norm.images, options);
                targetContainer.appendChild(carousel);
                return carousel;
            }

            case 'image': {
                const wrapper = document.createElement('div');
                wrapper.className = 'post-single-image-wrap';
                const img = document.createElement('img');
                img.src = norm.singleImage;
                img.alt = 'Imagen de publicación';
                img.className = 'post-media post-image-main';
                img.loading = 'lazy';
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightbox([norm.singleImage], 0);
                });
                wrapper.appendChild(img);
                targetContainer.appendChild(wrapper);
                return wrapper;
            }

            case 'video': {
                const wrapper = document.createElement('div');
                wrapper.className = 'post-video-player-wrap';

                const video = document.createElement('video');
                video.src = norm.videoUrl;
                video.controls = true;
                video.playsInline = true;
                video.preload = 'metadata';
                video.className = 'post-media video-player';
                if (norm.videoThumbnail) {
                    video.poster = norm.videoThumbnail;
                }

                video.addEventListener('play', () => {
                    pauseAllOtherMedia(video);
                    if (options.onVideoPlay) options.onVideoPlay();
                });

                wrapper.appendChild(video);
                targetContainer.appendChild(wrapper);
                return wrapper;
            }

            case 'sheet_music': {
                const wrapper = document.createElement('div');
                wrapper.className = 'post-sheet-music-card';

                const coverUrl = norm.sheetCover || './assets/logotransparente.png';
                wrapper.innerHTML = `
                    <div class="sheet-music-preview-box">
                        <img src="${coverUrl}" alt="Portada de partitura" class="sheet-cover-img">
                        <div class="sheet-overlay-badge">🎼 Partitura Musical</div>
                    </div>
                    <div class="sheet-actions-row">
                        <a href="${norm.sheetContent || '#'}" target="_blank" rel="noopener" class="sheet-view-btn">
                            📄 Ver / Descargar Partitura (PDF)
                        </a>
                    </div>
                `;
                targetContainer.appendChild(wrapper);
                return wrapper;
            }

            case 'bg': {
                const wrapper = document.createElement('div');
                wrapper.className = 'post-bg-card';
                if (norm.singleImage) {
                    wrapper.style.backgroundImage = `url("${norm.singleImage}")`;
                }
                const textDiv = document.createElement('div');
                textDiv.className = 'post-bg-text';
                textDiv.textContent = norm.text;
                wrapper.appendChild(textDiv);
                targetContainer.appendChild(wrapper);
                return wrapper;
            }

            case 'gif': {
                const wrapper = document.createElement('div');
                wrapper.className = 'post-gif-wrap';
                const img = document.createElement('img');
                img.src = norm.singleImage;
                img.alt = 'GIF';
                img.className = 'post-media post-gif';
                wrapper.appendChild(img);
                targetContainer.appendChild(wrapper);
                return wrapper;
            }

            case 'serie': {
                const wrapper = document.createElement('div');
                wrapper.className = 'post-serie-preview-wrap';
                const coverUrl = norm.singleImage || './assets/logotransparente.png';
                wrapper.innerHTML = `
                    <div class="serie-cover-box" style="cursor:pointer;">
                        <img src="${coverUrl}" alt="Serie" class="post-media">
                        <div class="serie-badge">🎬 Serie de Videos</div>
                    </div>
                `;
                const postId = post.pId || post.id || '';
                const authorId = post.id || post.uid || '';
                wrapper.addEventListener('click', () => {
                    window.location.href = `viewserie.html?pId=${postId}&id=${authorId}`;
                });
                targetContainer.appendChild(wrapper);
                return wrapper;
            }

            default:
                return null;
        }
    }

    function prepareVideo(video) {
        if (!video || video.dataset.postMediaReady === 'true') return;
        video.dataset.postMediaReady = 'true';
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.addEventListener('play', () => pauseAllOtherMedia(video));
        video.addEventListener('error', () => {
            video.dataset.postMediaError = 'true';
        });
    }

    function revealVideoForPreview(image) {
        const wrapper = image && image.parentElement;
        if (!wrapper) return;
        const video = wrapper.querySelector('video');
        if (!video) return;
        prepareVideo(video);
        image.style.display = 'none';
        const overlay = Array.from(wrapper.children).find((child) => child !== video && child !== image && child.textContent.trim() === '▶');
        if (overlay) overlay.style.display = 'none';
        video.style.display = 'block';
        video.muted = false;
    }

    function enhance(root) {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
        if (root.matches && root.matches('video')) prepareVideo(root);
        if (root.querySelectorAll) root.querySelectorAll('video').forEach(prepareVideo);

        const previews = [];
        if (root.matches && root.matches('img[id^="videoThumbnail_"]')) previews.push(root);
        if (root.querySelectorAll) root.querySelectorAll('img[id^="videoThumbnail_"]').forEach((image) => previews.push(image));
        previews.forEach((image) => {
            image.addEventListener('error', () => revealVideoForPreview(image), { once: true });
            const video = image.parentElement && image.parentElement.querySelector('video');
            if (video && image.src && video.src && image.src === video.src) {
                revealVideoForPreview(image);
            }
        });
    }

    // Exponer API global
    global.ProviwebPostMedia = {
        isUsableUrl,
        isAudioUrl,
        isVideoUrl,
        normalizePostMedia,
        getVideoUrl,
        createAudioPlayer,
        createImageCarousel,
        createSheetMusicCard: (content, cover, title) => renderPostMedia({ sheetContent: content, sheetCover: cover, text: title, type: 'sheet_music' }, document.createElement('div')),
        openLightbox,
        renderPostMedia,
        pauseAllOtherMedia,
        prepareVideo,
        enhance
    };

    document.addEventListener('DOMContentLoaded', () => {
        initGlobalLightbox();
        enhance(document.documentElement);
        new MutationObserver((records) => {
            records.forEach((record) => record.addedNodes.forEach(enhance));
        }).observe(document.body, { childList: true, subtree: true });
    });
})(typeof window !== 'undefined' ? window : this);



    // Helper to render Promoted badge & CTA button
    global.renderPromotedBadge = function(post, container) {
        if (!post || (!post.promoted && !post.promoData)) return;
        const promo = post.promoData || {};
        const badge = document.createElement('div');
        badge.className = 'post-promoted-badge';
        badge.style.cssText = 'display:inline-flex; align-items:center; gap:4px; background:rgba(251,191,36,0.15); border:1px solid rgba(251,191,36,0.4); color:#fbbf24; font-size:10px; font-weight:800; padding:2px 8px; border-radius:6px; margin-left:6px;';
        badge.innerHTML = '⭐ Patrocinado';
        
        if (container) container.appendChild(badge);
    };
    
