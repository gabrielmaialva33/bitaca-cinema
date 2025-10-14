/**
 * Advanced Video Player for Bitaca Cinema
 * Features: HLS.js adaptive streaming, quality selector, playback speed,
 * PiP mode, gesture controls, analytics tracking
 */

export class AdvancedVideoPlayer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }

        this.options = {
            autoplay: false,
            controls: true,
            responsive: true,
            fluid: true,
            preload: 'metadata',
            playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
            enableHLS: true,
            enableAnalytics: true,
            analyticsCallback: null,
            ...options
        };

        this.player = null;
        this.hls = null;
        this.currentProduction = null;
        this.watchStartTime = null;
        this.totalWatchTime = 0;
        this.qualityLevels = [];
        this.currentQuality = 'auto';

        // Gesture tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastTouchTime = 0;
        this.doubleTapTimeout = null;

        this.init();
    }

    async init() {
        console.log(' Initializing Advanced Video Player...');

        // Create video element
        this.createVideoElement();

        // Initialize Video.js
        await this.initializeVideoJS();

        // Setup HLS if supported
        if (this.options.enableHLS) {
            this.setupHLS();
        }

        // Setup custom controls
        this.setupCustomControls();

        // Setup gesture controls
        this.setupGestureControls();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Setup analytics
        if (this.options.enableAnalytics) {
            this.setupAnalytics();
        }

        console.log(' Advanced Video Player initialized');
    }

    createVideoElement() {
        this.container.innerHTML = `
            <video
                id="bitaca-video-player"
                class="video-js vjs-default-skin vjs-big-play-centered"
                playsinline
                webkit-playsinline
            >
                <p class="vjs-no-js">
                    Para visualizar este vídeo, habilite JavaScript ou use um navegador que suporte vídeos HTML5.
                </p>
            </video>

            <!-- Custom overlay controls -->
            <div class="player-overlay" id="player-overlay">
                <!-- Quality selector -->
                <div class="quality-selector" id="quality-selector">
                    <button class="quality-btn" id="quality-btn" title="Qualidade">
                        <i class="ki-filled ki-setting-2"></i>
                        <span class="quality-label">Auto</span>
                    </button>
                    <div class="quality-menu" id="quality-menu">
                        <div class="quality-option active" data-quality="auto">
                            <i class="ki-filled ki-check"></i> Auto
                        </div>
                    </div>
                </div>

                <!-- Playback speed -->
                <div class="speed-selector" id="speed-selector">
                    <button class="speed-btn" id="speed-btn" title="Velocidade">
                        <i class="ki-filled ki-speedometer"></i>
                        <span class="speed-label">1x</span>
                    </button>
                    <div class="speed-menu" id="speed-menu">
                        ${this.options.playbackRates.map(rate => `
                            <div class="speed-option ${rate === 1 ? 'active' : ''}" data-speed="${rate}">
                                <i class="ki-filled ki-check"></i> ${rate}x
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- PiP button -->
                <button class="pip-btn" id="pip-btn" title="Picture-in-Picture">
                    <i class="ki-filled ki-picture-in-picture"></i>
                </button>

                <!-- Theatre mode button -->
                <button class="theatre-btn" id="theatre-btn" title="Modo Cinema">
                    <i class="ki-filled ki-monitor"></i>
                </button>

                <!-- Skip intro button (appears when available) -->
                <button class="skip-intro-btn hidden" id="skip-intro-btn">
                    Pular Introdução →
                </button>

                <!-- Buffering indicator -->
                <div class="buffering-indicator hidden" id="buffering-indicator">
                    <div class="spinner"></div>
                    <span>Carregando...</span>
                </div>

                <!-- Gesture feedback -->
                <div class="gesture-feedback hidden" id="gesture-feedback">
                    <i class="ki-filled ki-play"></i>
                    <span>+10s</span>
                </div>
            </div>
        `;
    }

    async initializeVideoJS() {
        return new Promise((resolve) => {
            // Check if Video.js is loaded
            if (typeof videojs === 'undefined') {
                console.warn('Video.js not loaded, using native HTML5 video');
                this.player = document.getElementById('bitaca-video-player');
                resolve();
                return;
            }

            this.player = videojs('bitaca-video-player', {
                controls: true,
                autoplay: this.options.autoplay,
                preload: this.options.preload,
                responsive: this.options.responsive,
                fluid: this.options.fluid,
                playbackRates: this.options.playbackRates,
                controlBar: {
                    children: [
                        'playToggle',
                        'volumePanel',
                        'currentTimeDisplay',
                        'timeDivider',
                        'durationDisplay',
                        'progressControl',
                        'remainingTimeDisplay',
                        'qualitySelector',
                        'playbackRateMenuButton',
                        'chaptersButton',
                        'subtitlesButton',
                        'captionsButton',
                        'fullscreenToggle'
                    ]
                }
            });

            // Player ready
            this.player.ready(() => {
                console.log('Video.js player ready');
                resolve();
            });
        });
    }

    setupHLS() {
        // Check if HLS.js is supported
        if (typeof Hls === 'undefined') {
            console.warn('HLS.js not loaded');
            return;
        }

        if (!Hls.isSupported()) {
            console.warn('HLS.js not supported in this browser');
            return;
        }

        this.hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 3,
            maxFragLookUpTolerance: 0.25,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            liveDurationInfinity: false,
            enableSoftwareAES: true,
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 3,
            levelLoadingTimeOut: 10000,
            levelLoadingMaxRetry: 4,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
        });

        // HLS events
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('HLS manifest parsed:', data.levels.length, 'quality levels');
            this.qualityLevels = data.levels;
            this.updateQualityMenu();
        });

        this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            const level = this.hls.levels[data.level];
            console.log('Quality switched to:', level.height + 'p');
            this.updateQualityLabel(level.height + 'p');
        });

        this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('Fatal network error, trying to recover...');
                        this.hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('Fatal media error, trying to recover...');
                        this.hls.recoverMediaError();
                        break;
                    default:
                        console.log('Fatal error, destroying HLS...');
                        this.hls.destroy();
                        break;
                }
            }
        });

        // Buffering events
        this.hls.on(Hls.Events.FRAG_LOADING, () => {
            this.showBuffering();
        });

        this.hls.on(Hls.Events.FRAG_LOADED, () => {
            this.hideBuffering();
        });
    }

    updateQualityMenu() {
        const menu = document.getElementById('quality-menu');
        if (!menu) return;

        // Add auto option
        let html = `
            <div class="quality-option active" data-quality="auto">
                <i class="ki-filled ki-check"></i> Auto
            </div>
        `;

        // Add quality levels
        this.qualityLevels.forEach((level, index) => {
            html += `
                <div class="quality-option" data-quality="${index}">
                    <i class="ki-filled ki-check"></i> ${level.height}p
                </div>
            `;
        });

        menu.innerHTML = html;

        // Add click listeners
        menu.querySelectorAll('.quality-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.setQuality(option.dataset.quality);
            });
        });
    }

    setQuality(quality) {
        if (!this.hls) return;

        if (quality === 'auto') {
            this.hls.currentLevel = -1; // Auto
            this.currentQuality = 'auto';
            this.updateQualityLabel('Auto');
        } else {
            const level = parseInt(quality);
            this.hls.currentLevel = level;
            this.currentQuality = level;
            const height = this.qualityLevels[level].height;
            this.updateQualityLabel(height + 'p');
        }

        // Update active state
        document.querySelectorAll('.quality-option').forEach(option => {
            option.classList.toggle('active', option.dataset.quality === quality);
        });
    }

    updateQualityLabel(label) {
        const labelEl = document.querySelector('.quality-label');
        if (labelEl) {
            labelEl.textContent = label;
        }
    }

    setupCustomControls() {
        // Quality selector toggle
        const qualityBtn = document.getElementById('quality-btn');
        const qualityMenu = document.getElementById('quality-menu');

        qualityBtn?.addEventListener('click', () => {
            qualityMenu.classList.toggle('active');
        });

        // Speed selector toggle
        const speedBtn = document.getElementById('speed-btn');
        const speedMenu = document.getElementById('speed-menu');

        speedBtn?.addEventListener('click', () => {
            speedMenu.classList.toggle('active');
        });

        // Speed options
        document.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed);
                this.setPlaybackSpeed(speed);

                // Update active state
                document.querySelectorAll('.speed-option').forEach(opt => {
                    opt.classList.toggle('active', opt === option);
                });

                speedMenu.classList.remove('active');
            });
        });

        // PiP button
        const pipBtn = document.getElementById('pip-btn');
        pipBtn?.addEventListener('click', () => {
            this.togglePiP();
        });

        // Theatre mode button
        const theatreBtn = document.getElementById('theatre-btn');
        theatreBtn?.addEventListener('click', () => {
            this.toggleTheatreMode();
        });

        // Skip intro button
        const skipIntroBtn = document.getElementById('skip-intro-btn');
        skipIntroBtn?.addEventListener('click', () => {
            this.skipIntro();
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quality-selector')) {
                qualityMenu?.classList.remove('active');
            }
            if (!e.target.closest('.speed-selector')) {
                speedMenu?.classList.remove('active');
            }
        });
    }

    setupGestureControls() {
        const overlay = document.getElementById('player-overlay');
        if (!overlay) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let isSeeking = false;

        overlay.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isSeeking = false;
        }, {passive: true});

        overlay.addEventListener('touchmove', (e) => {
            if (isSeeking) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;

            // Horizontal swipe for seeking
            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                isSeeking = true;
                const seekAmount = deltaX > 0 ? 10 : -10;
                this.seek(seekAmount);
                this.showGestureFeedback(seekAmount > 0 ? 'forward' : 'backward', Math.abs(seekAmount));
            }
        }, {passive: true});

        overlay.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;

            // Double tap to skip
            if (touchDuration < 300 && !isSeeking) {
                const now = Date.now();
                if (now - this.lastTouchTime < 300) {
                    // Double tap detected
                    const rect = overlay.getBoundingClientRect();
                    const tapX = e.changedTouches[0].clientX - rect.left;
                    const screenWidth = rect.width;

                    if (tapX < screenWidth / 3) {
                        // Left side - backward
                        this.seek(-10);
                        this.showGestureFeedback('backward', 10);
                    } else if (tapX > screenWidth * 2 / 3) {
                        // Right side - forward
                        this.seek(10);
                        this.showGestureFeedback('forward', 10);
                    } else {
                        // Center - play/pause
                        this.togglePlay();
                    }
                }
                this.lastTouchTime = now;
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when player is active
            if (!this.container.classList.contains('active')) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    this.seek(-10);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    this.seek(10);
                    break;
                case 'j':
                    this.seek(-10);
                    break;
                case 'l':
                    this.seek(10);
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case 'm':
                    this.toggleMute();
                    break;
                case 'arrowup':
                    e.preventDefault();
                    this.adjustVolume(0.1);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    this.adjustVolume(-0.1);
                    break;
                case 'i':
                    this.togglePiP();
                    break;
                case 't':
                    this.toggleTheatreMode();
                    break;
                case ',':
                    this.previousFrame();
                    break;
                case '.':
                    this.nextFrame();
                    break;
                case '<':
                    this.decreaseSpeed();
                    break;
                case '>':
                    this.increaseSpeed();
                    break;
                case '0':
                case 'home':
                    this.seekTo(0);
                    break;
                case 'end':
                    this.seekTo(this.getDuration());
                    break;
                default:
                    // Number keys 0-9 for percentage seeking
                    if (e.key >= '0' && e.key <= '9') {
                        const percent = parseInt(e.key) * 10;
                        this.seekToPercent(percent);
                    }
                    break;
            }
        });
    }

    setupAnalytics() {
        if (typeof this.player.on === 'function') {
            // Video.js events
            this.player.on('play', () => {
                this.watchStartTime = Date.now();
                this.trackEvent('video_play');
            });

            this.player.on('pause', () => {
                this.updateWatchTime();
                this.trackEvent('video_pause');
            });

            this.player.on('ended', () => {
                this.updateWatchTime();
                this.trackEvent('video_complete', {
                    completion_rate: 100,
                    total_watch_time: this.totalWatchTime
                });
            });

            this.player.on('timeupdate', () => {
                this.checkSkipIntro();
            });

            this.player.on('error', (error) => {
                this.trackEvent('video_error', {error: error.message});
            });
        } else {
            // Native HTML5 video events
            this.player.addEventListener('play', () => {
                this.watchStartTime = Date.now();
                this.trackEvent('video_play');
            });

            this.player.addEventListener('pause', () => {
                this.updateWatchTime();
                this.trackEvent('video_pause');
            });

            this.player.addEventListener('ended', () => {
                this.updateWatchTime();
                this.trackEvent('video_complete', {
                    completion_rate: 100,
                    total_watch_time: this.totalWatchTime
                });
            });
        }
    }

    loadProduction(production, streamUrl) {
        console.log('Loading production:', production.title);

        this.currentProduction = production;
        this.totalWatchTime = 0;

        if (this.hls && streamUrl.includes('.m3u8')) {
            // HLS stream
            this.hls.loadSource(streamUrl);
            const videoElement = typeof this.player.el === 'function'
                ? this.player.el().querySelector('video')
                : this.player;
            this.hls.attachMedia(videoElement);
        } else {
            // Regular video
            if (typeof this.player.src === 'function') {
                this.player.src({src: streamUrl, type: 'video/mp4'});
            } else {
                this.player.src = streamUrl;
            }
        }

        this.trackEvent('video_load', {
            production_id: production.id,
            production_title: production.title
        });
    }

    // Playback controls
    togglePlay() {
        if (typeof this.player.paused === 'function') {
            if (this.player.paused()) {
                this.player.play();
            } else {
                this.player.pause();
            }
        } else {
            if (this.player.paused) {
                this.player.play();
            } else {
                this.player.pause();
            }
        }
    }

    seek(seconds) {
        const currentTime = this.getCurrentTime();
        const duration = this.getDuration();
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        this.seekTo(newTime);
    }

    seekTo(time) {
        if (typeof this.player.currentTime === 'function') {
            this.player.currentTime(time);
        } else {
            this.player.currentTime = time;
        }
    }

    seekToPercent(percent) {
        const duration = this.getDuration();
        const time = (duration * percent) / 100;
        this.seekTo(time);
    }

    setPlaybackSpeed(speed) {
        if (typeof this.player.playbackRate === 'function') {
            this.player.playbackRate(speed);
        } else {
            this.player.playbackRate = speed;
        }

        const speedLabel = document.querySelector('.speed-label');
        if (speedLabel) {
            speedLabel.textContent = speed + 'x';
        }

        this.trackEvent('playback_speed_change', {speed});
    }

    increaseSpeed() {
        const currentSpeed = typeof this.player.playbackRate === 'function'
            ? this.player.playbackRate()
            : this.player.playbackRate;
        const rates = this.options.playbackRates;
        const currentIndex = rates.findIndex(r => r >= currentSpeed);
        if (currentIndex < rates.length - 1) {
            this.setPlaybackSpeed(rates[currentIndex + 1]);
        }
    }

    decreaseSpeed() {
        const currentSpeed = typeof this.player.playbackRate === 'function'
            ? this.player.playbackRate()
            : this.player.playbackRate;
        const rates = this.options.playbackRates;
        const currentIndex = rates.findIndex(r => r >= currentSpeed);
        if (currentIndex > 0) {
            this.setPlaybackSpeed(rates[currentIndex - 1]);
        }
    }

    adjustVolume(delta) {
        const currentVolume = typeof this.player.volume === 'function'
            ? this.player.volume()
            : this.player.volume;
        const newVolume = Math.max(0, Math.min(1, currentVolume + delta));

        if (typeof this.player.volume === 'function') {
            this.player.volume(newVolume);
        } else {
            this.player.volume = newVolume;
        }
    }

    toggleMute() {
        if (typeof this.player.muted === 'function') {
            this.player.muted(!this.player.muted());
        } else {
            this.player.muted = !this.player.muted;
        }
    }

    toggleFullscreen() {
        if (typeof this.player.requestFullscreen === 'function') {
            this.player.requestFullscreen();
        } else if (this.player.requestFullscreen) {
            this.player.requestFullscreen();
        }
    }

    async togglePiP() {
        const videoElement = typeof this.player.el === 'function'
            ? this.player.el().querySelector('video')
            : this.player;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoElement.requestPictureInPicture();
            }
            this.trackEvent('pip_toggle');
        } catch (error) {
            console.error('PiP error:', error);
        }
    }

    toggleTheatreMode() {
        this.container.classList.toggle('theatre-mode');
        this.trackEvent('theatre_mode_toggle');
    }

    skipIntro() {
        if (this.currentProduction?.intro_end_time) {
            this.seekTo(this.currentProduction.intro_end_time);
            document.getElementById('skip-intro-btn')?.classList.add('hidden');
            this.trackEvent('intro_skipped');
        }
    }

    checkSkipIntro() {
        const skipBtn = document.getElementById('skip-intro-btn');
        if (!skipBtn || !this.currentProduction?.intro_end_time) return;

        const currentTime = this.getCurrentTime();
        const introStart = this.currentProduction.intro_start_time || 0;
        const introEnd = this.currentProduction.intro_end_time;

        if (currentTime >= introStart && currentTime < introEnd) {
            skipBtn.classList.remove('hidden');
        } else {
            skipBtn.classList.add('hidden');
        }
    }

    previousFrame() {
        const fps = 30; // Assume 30 fps
        this.seek(-1 / fps);
    }

    nextFrame() {
        const fps = 30;
        this.seek(1 / fps);
    }

    // Helpers
    getCurrentTime() {
        return typeof this.player.currentTime === 'function'
            ? this.player.currentTime()
            : this.player.currentTime;
    }

    getDuration() {
        return typeof this.player.duration === 'function'
            ? this.player.duration()
            : this.player.duration;
    }

    showBuffering() {
        document.getElementById('buffering-indicator')?.classList.remove('hidden');
    }

    hideBuffering() {
        document.getElementById('buffering-indicator')?.classList.add('hidden');
    }

    showGestureFeedback(type, amount) {
        const feedback = document.getElementById('gesture-feedback');
        if (!feedback) return;

        const icon = feedback.querySelector('i');
        const text = feedback.querySelector('span');

        if (type === 'forward') {
            icon.className = 'ki-filled ki-arrow-right';
            text.textContent = `+${amount}s`;
        } else {
            icon.className = 'ki-filled ki-arrow-left';
            text.textContent = `-${amount}s`;
        }

        feedback.classList.remove('hidden');

        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 1000);
    }

    updateWatchTime() {
        if (this.watchStartTime) {
            const sessionTime = Date.now() - this.watchStartTime;
            this.totalWatchTime += sessionTime / 1000; // Convert to seconds
            this.watchStartTime = null;
        }
    }

    trackEvent(eventName, data = {}) {
        if (this.options.analyticsCallback) {
            this.options.analyticsCallback(eventName, {
                ...data,
                production: this.currentProduction,
                timestamp: new Date().toISOString()
            });
        }
        console.log(`Analytics: ${eventName}`, data);
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
        }

        if (typeof this.player.dispose === 'function') {
            this.player.dispose();
        }

        this.updateWatchTime();
        this.trackEvent('player_destroyed', {
            total_watch_time: this.totalWatchTime
        });
    }
}

export default AdvancedVideoPlayer;
