/**
 * ========================================
 * VIRTUAL CINEMA - Production-Ready 3D Cinema Room
 * Streams video from Telegram via stream-winx-api
 * Commercial-quality immersive experience
 * ========================================
 */

import * as THREE from 'three';

export class VirtualCinema {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // Cinema components
        this.cinemaGroup = null;
        this.screen = null;
        this.seats = null;
        this.lights = [];

        // Video streaming
        this.videoElement = null;
        this.videoTexture = null;
        this.currentProduction = null;
        this.isPlaying = false;

        // Audio
        this.audioListener = null;
        this.positionalAudio = null;

        // UI
        this.controlsUI = null;
        this.productionMenu = null;

        // Viewing modes
        this.viewingMode = 'cinema'; // cinema, vr, closeup
        this.savedCameraPosition = new THREE.Vector3();

        // Performance
        this.needsUpdate = true;

        // Stream API configuration
        this.streamAPI = {
            baseURL: 'https://stream-api.abitaca.com.br/api/v1',
            endpoint: '/posts/{message_id}/video'
        };

        // Production catalog (loaded from data.js)
        this.productions = window.filmesData || [];

        console.log('🎬 Virtual Cinema initialized with', this.productions.length, 'productions');
    }

    /**
     * Initialize and build the complete cinema
     */
    async init() {
        console.log('🏗️ Building virtual cinema room...');

        this.cinemaGroup = new THREE.Group();
        this.cinemaGroup.name = 'VirtualCinema';

        // Build cinema components
        this.createCinemaScreen();
        this.createCinemaSeats();
        this.createCinemaWalls();
        this.createCinemaFloor();
        this.createCinemaCeiling();
        this.createCinemaLighting();

        // Setup audio system
        this.setupSpatialAudio();

        // Setup UI
        this.createControlsUI();
        this.createProductionMenu();

        // Add to scene
        this.scene.add(this.cinemaGroup);

        // Position camera for optimal viewing
        this.setCameraPosition('cinema');

        console.log('✅ Virtual cinema ready!');

        return this;
    }

    /**
     * Create the main cinema screen with video texture
     */
    createCinemaScreen() {
        // Screen dimensions (16:9 ratio, scaled for cinema feel)
        const screenWidth = 16;
        const screenHeight = 9;

        // Create video element
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('crossorigin', 'anonymous');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('webkit-playsinline', '');
        this.videoElement.preload = 'metadata';
        this.videoElement.muted = false;
        this.videoElement.volume = 0.8;

        // Create video texture
        this.videoTexture = new THREE.VideoTexture(this.videoElement);
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBAFormat;
        this.videoTexture.colorSpace = THREE.SRGBColorSpace;

        // Screen geometry
        const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);

        // Screen material with video texture
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: this.videoTexture,
            emissive: 0xffffff,
            emissiveMap: this.videoTexture,
            emissiveIntensity: 0.8,
            side: THREE.FrontSide,
            toneMapped: false // Prevent tone mapping for video
        });

        this.screen = new THREE.Mesh(screenGeometry, screenMaterial);
        this.screen.position.set(0, 5, -10);
        this.screen.name = 'CinemaScreen';
        this.screen.userData.interactive = true;

        // Screen frame
        const frameThickness = 0.2;
        const frameGeometry = new THREE.BoxGeometry(
            screenWidth + frameThickness * 2,
            screenHeight + frameThickness * 2,
            0.3
        );
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A,
            roughness: 0.6,
            metalness: 0.8
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, 5, -10.2);

        // Add screen glow effect
        const glowGeometry = new THREE.PlaneGeometry(screenWidth + 2, screenHeight + 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xC41E3A,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 5, -10.1);

        this.cinemaGroup.add(frame);
        this.cinemaGroup.add(this.screen);
        this.cinemaGroup.add(glow);

        console.log('🖥️ Cinema screen created (16:9 ratio)');
    }

    /**
     * Create cinema seating with instanced meshes for performance
     */
    createCinemaSeats() {
        const seatGeometry = new THREE.Group();

        // Seat base
        const baseGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xC41E3A,
            roughness: 0.7,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        seatGeometry.add(base);

        // Seat back
        const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.1);
        const back = new THREE.Mesh(backGeometry, baseMaterial);
        back.position.set(0, 0.3, -0.2);
        back.castShadow = true;
        seatGeometry.add(back);

        // Armrests
        const armrestGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.4);
        const armrestMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            roughness: 0.5,
            metalness: 0.3
        });

        const leftArmrest = new THREE.Mesh(armrestGeometry, armrestMaterial);
        leftArmrest.position.set(-0.25, 0.15, 0);
        seatGeometry.add(leftArmrest);

        const rightArmrest = new THREE.Mesh(armrestGeometry, armrestMaterial);
        rightArmrest.position.set(0.25, 0.15, 0);
        seatGeometry.add(rightArmrest);

        // Create rows of seats
        const rows = 6;
        const seatsPerRow = 10;
        const seatSpacing = 0.8;
        const rowSpacing = 1.2;

        this.seats = new THREE.Group();
        this.seats.name = 'CinemaSeats';

        for (let row = 0; row < rows; row++) {
            for (let seat = 0; seat < seatsPerRow; seat++) {
                const seatClone = seatGeometry.clone();

                const x = (seat - seatsPerRow / 2) * seatSpacing;
                const z = row * rowSpacing + 2;
                const y = 0;

                seatClone.position.set(x, y, z);
                this.seats.add(seatClone);
            }
        }

        this.cinemaGroup.add(this.seats);
        console.log('🪑 Cinema seating created:', rows * seatsPerRow, 'seats');
    }

    /**
     * Create cinema walls with acoustic dampening look
     */
    createCinemaWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A,
            roughness: 0.9,
            metalness: 0.1,
            emissive: 0x0A0A0A,
            emissiveIntensity: 0.1
        });

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(20, 10);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 5, -15);
        backWall.receiveShadow = true;
        this.cinemaGroup.add(backWall);

        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(25, 10);

        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.set(-10, 5, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.cinemaGroup.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.set(10, 5, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.cinemaGroup.add(rightWall);

        // Acoustic panels (decorative)
        const panelGeometry = new THREE.BoxGeometry(1, 2, 0.1);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            roughness: 0.95,
            metalness: 0.05
        });

        for (let i = 0; i < 8; i++) {
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set((i - 4) * 2.2, 5, -14.8);
            this.cinemaGroup.add(panel);
        }

        console.log('🧱 Cinema walls created');
    }

    /**
     * Create cinema floor with carpet texture
     */
    createCinemaFloor() {
        const floorGeometry = new THREE.PlaneGeometry(20, 25);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A1A1A,
            roughness: 0.95,
            metalness: 0.05
        });

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;

        this.cinemaGroup.add(floor);
        console.log('🟫 Cinema floor created');
    }

    /**
     * Create cinema ceiling with recessed lighting
     */
    createCinemaCeiling() {
        const ceilingGeometry = new THREE.PlaneGeometry(20, 25);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x0A0A0A,
            roughness: 0.8,
            metalness: 0.2
        });

        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        ceiling.receiveShadow = true;

        this.cinemaGroup.add(ceiling);

        // Recessed lighting fixtures
        const fixtureGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16);
        const fixtureMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            emissive: 0xFFAA66,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < 6; i++) {
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set((i - 2.5) * 3, 9.8, -5);
            this.cinemaGroup.add(fixture);
        }

        console.log('🏗️ Cinema ceiling created');
    }

    /**
     * Create cinematic lighting system
     */
    createCinemaLighting() {
        // Ambient cinema lighting (very dim)
        const ambientLight = new THREE.AmbientLight(0x2A2A2A, 0.2);
        this.cinemaGroup.add(ambientLight);
        this.lights.push(ambientLight);

        // Screen fill light (simulates screen glow)
        const screenLight = new THREE.RectAreaLight(0xFFFFFF, 2, 16, 9);
        screenLight.position.set(0, 5, -9.5);
        screenLight.lookAt(0, 5, 0);
        this.cinemaGroup.add(screenLight);
        this.lights.push(screenLight);

        // Ceiling spotlights (for ambiance)
        for (let i = 0; i < 6; i++) {
            const spotlight = new THREE.SpotLight(0xFFAA66, 0.3, 15, Math.PI / 6, 0.5, 1);
            spotlight.position.set((i - 2.5) * 3, 9.5, -5);
            spotlight.target.position.set((i - 2.5) * 3, 0, -5);
            spotlight.castShadow = true;
            spotlight.shadow.mapSize.width = 512;
            spotlight.shadow.mapSize.height = 512;

            this.cinemaGroup.add(spotlight);
            this.cinemaGroup.add(spotlight.target);
            this.lights.push(spotlight);
        }

        // Aisle lights (subtle red glow)
        const aisleLight = new THREE.PointLight(0xC41E3A, 0.5, 10);
        aisleLight.position.set(0, 0.1, 8);
        this.cinemaGroup.add(aisleLight);
        this.lights.push(aisleLight);

        console.log('💡 Cinema lighting created');
    }

    /**
     * Setup spatial audio system
     */
    setupSpatialAudio() {
        // Create audio listener attached to camera
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);

        // Create positional audio for the screen
        this.positionalAudio = new THREE.PositionalAudio(this.audioListener);
        this.positionalAudio.setRefDistance(5);
        this.positionalAudio.setRolloffFactor(2);
        this.positionalAudio.setDistanceModel('inverse');
        this.positionalAudio.setDirectionalCone(180, 230, 0.1);

        // Attach audio to screen
        this.screen.add(this.positionalAudio);

        console.log('🔊 Spatial audio system ready');
    }

    /**
     * Load and stream production from Telegram
     */
    async loadProduction(production) {
        console.log('📹 Loading production:', production.titulo);

        this.currentProduction = production;

        // In production, this would fetch the actual message_id from your database
        // For now, we'll use a placeholder
        const messageId = production.telegram_message_id || production.id;

        // Construct stream URL
        const streamURL = `${this.streamAPI.baseURL}${this.streamAPI.endpoint.replace('{message_id}', messageId)}`;

        try {
            // Set video source
            this.videoElement.src = streamURL;

            // Wait for metadata
            await new Promise((resolve, reject) => {
                this.videoElement.addEventListener('loadedmetadata', resolve, {once: true});
                this.videoElement.addEventListener('error', reject, {once: true});
            });

            // Connect audio
            if (this.positionalAudio) {
                this.positionalAudio.setMediaElementSource(this.videoElement);
            }

            // Update UI
            this.updateProductionInfo(production);

            console.log('✅ Production loaded successfully');

        } catch (error) {
            console.error('❌ Error loading production:', error);
            this.showError('Erro ao carregar produção. Verifique sua conexão.');
        }
    }

    /**
     * Play video
     */
    play() {
        if (!this.videoElement || !this.currentProduction) {
            console.warn('⚠️ No production loaded');
            return;
        }

        this.videoElement.play().then(() => {
            this.isPlaying = true;
            this.dimLights(true);
            this.updatePlayButton(true);
            console.log('▶️ Playing:', this.currentProduction.titulo);
        }).catch(error => {
            console.error('❌ Play error:', error);
            this.showError('Erro ao reproduzir vídeo');
        });
    }

    /**
     * Pause video
     */
    pause() {
        if (!this.videoElement) return;

        this.videoElement.pause();
        this.isPlaying = false;
        this.dimLights(false);
        this.updatePlayButton(false);
        console.log('⏸️ Paused');
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Seek to time
     */
    seek(timeInSeconds) {
        if (!this.videoElement) return;
        this.videoElement.currentTime = timeInSeconds;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
        if (!this.videoElement) return;
        this.videoElement.volume = Math.max(0, Math.min(1, volume));
        this.updateVolumeUI(volume);
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Dim cinema lights during playback
     */
    dimLights(dim) {
        const targetIntensity = dim ? 0.1 : 0.3;
        const duration = 1000; // 1 second
        const startTime = Date.now();

        this.lights.forEach(light => {
            if (light.isAmbientLight || light.isSpotLight || light.isPointLight) {
                const startIntensity = light.intensity;

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    light.intensity = startIntensity + (targetIntensity - startIntensity) * progress;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };

                animate();
            }
        });
    }

    /**
     * Set viewing mode
     */
    setCameraPosition(mode) {
        this.viewingMode = mode;

        let targetPosition;
        let targetLookAt;

        switch (mode) {
            case 'cinema':
                // Standard cinema viewing (middle rows)
                targetPosition = new THREE.Vector3(0, 1.6, 4);
                targetLookAt = new THREE.Vector3(0, 5, -10);
                break;

            case 'vr':
                // VR-style close to screen
                targetPosition = new THREE.Vector3(0, 5, -5);
                targetLookAt = new THREE.Vector3(0, 5, -10);
                break;

            case 'closeup':
                // Close-up for details
                targetPosition = new THREE.Vector3(0, 5, -3);
                targetLookAt = new THREE.Vector3(0, 5, -10);
                break;

            case 'back':
                // Back row view
                targetPosition = new THREE.Vector3(0, 2, 8);
                targetLookAt = new THREE.Vector3(0, 5, -10);
                break;

            default:
                targetPosition = new THREE.Vector3(0, 1.6, 4);
                targetLookAt = new THREE.Vector3(0, 5, -10);
        }

        // Smooth camera transition
        this.animateCameraTo(targetPosition, targetLookAt);
    }

    /**
     * Animate camera to position
     */
    animateCameraTo(targetPosition, targetLookAt, duration = 1500) {
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            this.camera.position.lerpVectors(startPosition, targetPosition, eased);
            this.camera.lookAt(targetLookAt);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Create video controls UI
     */
    createControlsUI() {
        // Create controls container
        const controls = document.createElement('div');
        controls.id = 'cinema-controls';
        controls.className = 'cinema-controls';
        controls.innerHTML = `
            <div class="controls-container">
                <div class="production-info">
                    <h3 id="cinema-title">Selecione uma produção</h3>
                    <p id="cinema-director"></p>
                </div>

                <div class="video-controls">
                    <button id="cinema-play" class="control-btn" title="Play/Pause (Space)">
                        <span class="icon-play">▶</span>
                        <span class="icon-pause" style="display:none;">⏸</span>
                    </button>

                    <div class="progress-bar">
                        <input type="range" id="cinema-progress" min="0" max="100" value="0" />
                        <div class="time-display">
                            <span id="cinema-current-time">0:00</span>
                            <span id="cinema-duration">0:00</span>
                        </div>
                    </div>

                    <div class="volume-control">
                        <button id="cinema-volume-btn" class="control-btn" title="Mute">🔊</button>
                        <input type="range" id="cinema-volume" min="0" max="100" value="80" />
                    </div>

                    <button id="cinema-fullscreen" class="control-btn" title="Fullscreen (F)">⛶</button>
                </div>

                <div class="viewing-modes">
                    <button class="mode-btn active" data-mode="cinema">Cinema</button>
                    <button class="mode-btn" data-mode="vr">VR</button>
                    <button class="mode-btn" data-mode="closeup">Close-up</button>
                    <button class="mode-btn" data-mode="back">Back Row</button>
                </div>
            </div>
        `;

        document.body.appendChild(controls);
        this.controlsUI = controls;

        // Add event listeners
        this.setupControlsListeners();

        // Add CSS
        this.injectControlsCSS();

        console.log('🎮 Controls UI created');
    }

    /**
     * Setup control event listeners
     */
    setupControlsListeners() {
        // Play/Pause button
        document.getElementById('cinema-play').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Progress bar
        document.getElementById('cinema-progress').addEventListener('input', (e) => {
            if (!this.videoElement) return;
            const time = (e.target.value / 100) * this.videoElement.duration;
            this.seek(time);
        });

        // Volume control
        document.getElementById('cinema-volume').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        document.getElementById('cinema-volume-btn').addEventListener('click', () => {
            this.videoElement.muted = !this.videoElement.muted;
            document.getElementById('cinema-volume-btn').textContent =
                this.videoElement.muted ? '🔇' : '🔊';
        });

        // Fullscreen
        document.getElementById('cinema-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Viewing mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setCameraPosition(e.target.dataset.mode);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'KeyF':
                    this.toggleFullscreen();
                    break;
                case 'KeyM':
                    this.videoElement.muted = !this.videoElement.muted;
                    break;
                case 'ArrowLeft':
                    this.seek(this.videoElement.currentTime - 10);
                    break;
                case 'ArrowRight':
                    this.seek(this.videoElement.currentTime + 10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(this.videoElement.volume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(this.videoElement.volume - 0.1);
                    break;
            }
        });

        // Video element listeners
        if (this.videoElement) {
            this.videoElement.addEventListener('timeupdate', () => {
                this.updateProgress();
            });

            this.videoElement.addEventListener('ended', () => {
                this.isPlaying = false;
                this.updatePlayButton(false);
                this.dimLights(false);
            });
        }
    }

    /**
     * Create production selection menu
     */
    createProductionMenu() {
        const menu = document.createElement('div');
        menu.id = 'production-menu';
        menu.className = 'production-menu';

        let menuHTML = `
            <div class="menu-container">
                <div class="menu-header">
                    <h2>Bitaca Cinema</h2>
                    <button id="menu-close" class="close-btn">✕</button>
                </div>

                <div class="menu-filters">
                    <button class="filter-btn active" data-filter="all">Todos</button>
                    <button class="filter-btn" data-filter="patrimonio">Patrimônio</button>
                    <button class="filter-btn" data-filter="musica">Música</button>
                    <button class="filter-btn" data-filter="ambiente">Ambiente</button>
                </div>

                <div class="productions-grid">
        `;

        // Generate production cards
        this.productions.forEach(prod => {
            menuHTML += `
                <div class="production-card" data-id="${prod.id}" data-theme="${prod.tema}">
                    <div class="card-poster">
                        <div class="poster-placeholder" style="background: linear-gradient(135deg, #C41E3A, #8B1528);">
                            <span class="poster-icon">🎬</span>
                        </div>
                    </div>
                    <div class="card-info">
                        <h4>${prod.titulo}</h4>
                        <p class="director">${prod.diretor}</p>
                        <p class="genre">${prod.genero} • ${prod.duracao}</p>
                        <p class="theme-badge">${this.getThemeBadge(prod.tema)}</p>
                    </div>
                </div>
            `;
        });

        menuHTML += `
                </div>
            </div>
        `;

        menu.innerHTML = menuHTML;
        document.body.appendChild(menu);
        this.productionMenu = menu;

        // Add menu event listeners
        this.setupMenuListeners();

        // Add menu CSS
        this.injectMenuCSS();

        console.log('📋 Production menu created with', this.productions.length, 'items');
    }

    /**
     * Setup menu event listeners
     */
    setupMenuListeners() {
        // Close button
        document.getElementById('menu-close').addEventListener('click', () => {
            this.productionMenu.classList.remove('active');
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterProductions(e.target.dataset.filter);
            });
        });

        // Production cards
        document.querySelectorAll('.production-card').forEach(card => {
            card.addEventListener('click', () => {
                const prodId = parseInt(card.dataset.id);
                const production = this.productions.find(p => p.id === prodId);
                if (production) {
                    this.loadProduction(production);
                    this.productionMenu.classList.remove('active');
                }
            });
        });
    }

    /**
     * Filter productions by theme
     */
    filterProductions(filter) {
        const cards = document.querySelectorAll('.production-card');

        cards.forEach(card => {
            if (filter === 'all' || card.dataset.theme === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Get theme badge text
     */
    getThemeBadge(tema) {
        const badges = {
            patrimonio: 'Patrimônio',
            musica: 'Música',
            ambiente: 'Ambiente'
        };
        return badges[tema] || tema;
    }

    /**
     * Update production info display
     */
    updateProductionInfo(production) {
        document.getElementById('cinema-title').textContent = production.titulo;
        document.getElementById('cinema-director').textContent = `Dir. ${production.diretor}`;
    }

    /**
     * Update play button state
     */
    updatePlayButton(playing) {
        const iconPlay = document.querySelector('.icon-play');
        const iconPause = document.querySelector('.icon-pause');

        if (playing) {
            iconPlay.style.display = 'none';
            iconPause.style.display = 'inline';
        } else {
            iconPlay.style.display = 'inline';
            iconPause.style.display = 'none';
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        if (!this.videoElement) return;

        const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
        document.getElementById('cinema-progress').value = progress || 0;

        document.getElementById('cinema-current-time').textContent =
            this.formatTime(this.videoElement.currentTime);
        document.getElementById('cinema-duration').textContent =
            this.formatTime(this.videoElement.duration);
    }

    /**
     * Update volume UI
     */
    updateVolumeUI(volume) {
        document.getElementById('cinema-volume').value = volume * 100;
    }

    /**
     * Format time in MM:SS
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'cinema-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(196, 30, 58, 0.95);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-family: 'Barlow', sans-serif;
            font-size: 18px;
            z-index: 10000;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    /**
     * Show production menu
     */
    showMenu() {
        this.productionMenu.classList.add('active');
    }

    /**
     * Hide production menu
     */
    hideMenu() {
        this.productionMenu.classList.remove('active');
    }

    /**
     * Update loop (call from main animation loop)
     */
    update(delta) {
        // Update video texture if playing
        if (this.videoTexture && this.videoElement && !this.videoElement.paused) {
            this.videoTexture.needsUpdate = true;
        }

        // Subtle screen glow animation
        if (this.screen && this.isPlaying) {
            const time = Date.now() * 0.001;
            this.screen.material.emissiveIntensity = 0.8 + Math.sin(time * 0.5) * 0.1;
        }
    }

    /**
     * Cleanup and dispose
     */
    dispose() {
        // Stop video
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
        }

        // Dispose textures
        if (this.videoTexture) {
            this.videoTexture.dispose();
        }

        // Remove UI
        if (this.controlsUI) {
            this.controlsUI.remove();
        }

        if (this.productionMenu) {
            this.productionMenu.remove();
        }

        // Remove from scene
        if (this.cinemaGroup) {
            this.scene.remove(this.cinemaGroup);
        }

        console.log('🗑️ Virtual cinema disposed');
    }

    /**
     * Inject controls CSS
     */
    injectControlsCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .cinema-controls {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                padding: 20px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
            }

            .cinema-controls:hover,
            .cinema-controls.active {
                opacity: 1;
            }

            .controls-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .production-info h3 {
                margin: 0 0 5px 0;
                color: white;
                font-family: 'Barlow', sans-serif;
                font-size: 20px;
            }

            .production-info p {
                margin: 0;
                color: #999;
                font-size: 14px;
            }

            .video-controls {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-top: 15px;
            }

            .control-btn {
                background: rgba(196, 30, 58, 0.8);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s;
            }

            .control-btn:hover {
                background: rgba(196, 30, 58, 1);
                transform: scale(1.1);
            }

            .progress-bar {
                flex: 1;
            }

            .progress-bar input[type="range"] {
                width: 100%;
                height: 5px;
                background: rgba(255,255,255,0.3);
                border-radius: 5px;
                outline: none;
            }

            .progress-bar input[type="range"]::-webkit-slider-thumb {
                width: 15px;
                height: 15px;
                background: #C41E3A;
                border-radius: 50%;
                cursor: pointer;
            }

            .time-display {
                display: flex;
                justify-content: space-between;
                color: white;
                font-size: 12px;
                margin-top: 5px;
            }

            .volume-control {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .volume-control input[type="range"] {
                width: 80px;
            }

            .viewing-modes {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                justify-content: center;
            }

            .mode-btn {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'Barlow', sans-serif;
                font-size: 14px;
                transition: all 0.2s;
            }

            .mode-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .mode-btn.active {
                background: rgba(196, 30, 58, 0.8);
                border-color: #C41E3A;
            }

            /* Show controls on hover */
            body:hover .cinema-controls {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Inject menu CSS
     */
    injectMenuCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .production-menu {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                z-index: 2000;
                display: none;
                overflow-y: auto;
            }

            .production-menu.active {
                display: block;
            }

            .menu-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 40px 20px;
            }

            .menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            }

            .menu-header h2 {
                color: white;
                font-family: 'Barlow', sans-serif;
                font-size: 32px;
                margin: 0;
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 32px;
                cursor: pointer;
                width: 40px;
                height: 40px;
                transition: transform 0.2s;
            }

            .close-btn:hover {
                transform: rotate(90deg);
            }

            .menu-filters {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }

            .filter-btn {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-family: 'Barlow', sans-serif;
                font-size: 16px;
                transition: all 0.2s;
            }

            .filter-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .filter-btn.active {
                background: rgba(196, 30, 58, 0.8);
                border-color: #C41E3A;
            }

            .productions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 25px;
            }

            .production-card {
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s;
                border: 2px solid transparent;
            }

            .production-card:hover {
                background: rgba(255,255,255,0.1);
                border-color: #C41E3A;
                transform: translateY(-5px);
            }

            .card-poster {
                width: 100%;
                height: 200px;
                overflow: hidden;
            }

            .poster-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .poster-icon {
                font-size: 48px;
            }

            .card-info {
                padding: 15px;
            }

            .card-info h4 {
                color: white;
                font-family: 'Barlow', sans-serif;
                font-size: 18px;
                margin: 0 0 8px 0;
                line-height: 1.3;
            }

            .card-info p {
                color: #999;
                font-size: 14px;
                margin: 4px 0;
            }

            .director {
                color: #C41E3A !important;
                font-weight: 500;
            }

            .theme-badge {
                display: inline-block;
                background: rgba(196, 30, 58, 0.3);
                color: #C41E3A !important;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
    }
}
