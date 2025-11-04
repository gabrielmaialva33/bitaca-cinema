/**
 * ========================================
 * AUDIO VISUALIZER 3D - Real-time Audio Reactive Component
 * Interactive 3D visualization with Web Audio API integration
 * ========================================
 *
 * Features:
 * - Real-time frequency analysis (bass, mid, treble)
 * - Multiple visualization modes (orb, particles, waves)
 * - Smooth GSAP animations (60 FPS target)
 * - Supports streaming audio sources (URL, MediaStream)
 * - Interactive controls (play/pause, volume, source)
 *
 * @author Frontend Developer - Bitaca Play 3D
 * @version 1.0.0
 */

import * as THREE from 'three';
import {gsap} from 'gsap';

export class AudioVisualizer3D {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;

        // Configuration
        this.config = {
            position: options.position || new THREE.Vector3(0, 2, 0),
            visualMode: options.visualMode || 'orb', // 'orb', 'particles', 'waves'
            orbRadius: options.orbRadius || 2.5,
            particleCount: options.particleCount || 1000,
            waveSegments: options.waveSegments || 128,
            smoothing: options.smoothing || 0.8,
            fftSize: options.fftSize || 1024,
            minDecibels: options.minDecibels || -90,
            maxDecibels: options.maxDecibels || -10,
            ...options
        };

        // Web Audio API
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.audioSource = null;
        this.audioElement = null;
        this.gainNode = null;

        // Audio state
        this.isPlaying = false;
        this.isInitialized = false;
        this.currentVolume = 0.7;
        this.currentSource = null;

        // Frequency bands
        this.bassRange = {start: 0, end: 0};
        this.midRange = {start: 0, end: 0};
        this.trebleRange = {start: 0, end: 0};

        // Visualization objects
        this.visualizerGroup = null;
        this.orbMesh = null;
        this.particles = null;
        this.waves = null;

        // Animation state
        this.animationId = null;
        this.time = 0;

        // Performance tracking
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;

        this.init();
    }

    /**
     * Initialize the audio visualizer
     */
    async init() {
        console.log('🎵 Initializing Audio Visualizer 3D...');

        try {
            // Create visualizer group
            this.visualizerGroup = new THREE.Group();
            this.visualizerGroup.position.copy(this.config.position);
            this.scene.add(this.visualizerGroup);

            // Initialize Web Audio API
            await this.initAudioContext();

            // Create visualization based on mode
            this.createVisualization();

            // Setup UI controls
            this.setupControls();

            this.isInitialized = true;
            console.log('✅ Audio Visualizer 3D initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Audio Visualizer 3D:', error);
            throw error;
        }
    }

    /**
     * Initialize Web Audio API context and analyser
     */
    async initAudioContext() {
        // Create audio context (lazy initialization for browser compatibility)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create analyser node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.config.fftSize;
        this.analyser.smoothingTimeConstant = this.config.smoothing;
        this.analyser.minDecibels = this.config.minDecibels;
        this.analyser.maxDecibels = this.config.maxDecibels;

        // Get frequency data array
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.currentVolume;

        // Connect nodes
        this.gainNode.connect(this.audioContext.destination);

        // Calculate frequency band ranges
        this.calculateFrequencyRanges();

        console.log('🔊 Web Audio API initialized', {
            sampleRate: this.audioContext.sampleRate,
            fftSize: this.analyser.fftSize,
            bufferLength: bufferLength
        });
    }

    /**
     * Calculate frequency band ranges for bass, mid, treble
     */
    calculateFrequencyRanges() {
        const nyquist = this.audioContext.sampleRate / 2;
        const binCount = this.analyser.frequencyBinCount;

        // Frequency boundaries (Hz)
        const bassCutoff = 250;
        const midCutoff = 2000;

        // Convert Hz to bin indices
        this.bassRange = {
            start: 0,
            end: Math.floor((bassCutoff / nyquist) * binCount)
        };

        this.midRange = {
            start: this.bassRange.end,
            end: Math.floor((midCutoff / nyquist) * binCount)
        };

        this.trebleRange = {
            start: this.midRange.end,
            end: binCount
        };

        console.log('🎼 Frequency ranges calculated:', {
            bass: `${this.bassRange.start}-${this.bassRange.end} bins`,
            mid: `${this.midRange.start}-${this.midRange.end} bins`,
            treble: `${this.trebleRange.start}-${this.trebleRange.end} bins`
        });
    }

    /**
     * Create visualization based on selected mode
     */
    createVisualization() {
        switch (this.config.visualMode) {
            case 'orb':
                this.createOrbVisualization();
                break;
            case 'particles':
                this.createParticleVisualization();
                break;
            case 'waves':
                this.createWaveVisualization();
                break;
            default:
                this.createOrbVisualization();
        }
    }

    /**
     * Create orb visualization (sphere that reacts to audio)
     */
    createOrbVisualization() {
        const radius = this.config.orbRadius;

        // Main orb geometry with higher subdivisions for smooth deformation
        const geometry = new THREE.IcosahedronGeometry(radius, 4);

        // Store original positions for morphing
        const positionAttribute = geometry.attributes.position;
        const originalPositions = new Float32Array(positionAttribute.array);
        geometry.userData.originalPositions = originalPositions;

        // Shader material for dynamic colors
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: {value: 0},
                bassIntensity: {value: 0},
                midIntensity: {value: 0},
                trebleIntensity: {value: 0},
                colorBass: {value: new THREE.Color(0xFF3355)}, // Red/warm
                colorMid: {value: new THREE.Color(0x55FF88)},  // Green/cool
                colorTreble: {value: new THREE.Color(0x5588FF)} // Blue/bright
            },
            vertexShader: `
                uniform float time;
                uniform float bassIntensity;
                uniform float midIntensity;
                uniform float trebleIntensity;

                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vDisplacement;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;

                    // Audio-reactive displacement
                    float displacement = bassIntensity * 0.3 + midIntensity * 0.2 + trebleIntensity * 0.15;
                    vec3 newPosition = position + normal * displacement;

                    // Add subtle wave motion
                    float wave = sin(position.y * 2.0 + time) * 0.1 * midIntensity;
                    newPosition += normal * wave;

                    vDisplacement = displacement;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float bassIntensity;
                uniform float midIntensity;
                uniform float trebleIntensity;
                uniform vec3 colorBass;
                uniform vec3 colorMid;
                uniform vec3 colorTreble;

                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vDisplacement;

                void main() {
                    // Mix colors based on frequency intensities
                    vec3 color = colorBass * bassIntensity +
                                colorMid * midIntensity +
                                colorTreble * trebleIntensity;

                    // Normalize color
                    color = color / (bassIntensity + midIntensity + trebleIntensity + 0.1);

                    // Add fresnel rim lighting
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    color += vec3(fresnel) * 0.3;

                    // Add glow based on displacement
                    color += vec3(1.0) * vDisplacement * 0.5;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            wireframe: false,
            transparent: false
        });

        this.orbMesh = new THREE.Mesh(geometry, material);
        this.orbMesh.castShadow = true;
        this.orbMesh.receiveShadow = true;
        this.visualizerGroup.add(this.orbMesh);

        // Add wireframe overlay
        const wireframeGeometry = new THREE.IcosahedronGeometry(radius * 1.02, 2);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.visualizerGroup.add(wireframe);
        this.orbMesh.userData.wireframe = wireframe;

        // Add glow effect
        const glowGeometry = new THREE.IcosahedronGeometry(radius * 1.2, 3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF3355,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.visualizerGroup.add(glow);
        this.orbMesh.userData.glow = glow;

        console.log('🔮 Orb visualization created');
    }

    /**
     * Create particle visualization
     */
    createParticleVisualization() {
        const count = this.config.particleCount;
        const radius = this.config.orbRadius;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        // Initialize particle positions in sphere formation
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random colors
            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();

            sizes[i] = Math.random() * 0.1 + 0.05;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Store original positions
        geometry.userData.originalPositions = new Float32Array(positions);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: {value: 0},
                bassIntensity: {value: 0},
                midIntensity: {value: 0},
                trebleIntensity: {value: 0},
                pixelRatio: {value: Math.min(window.devicePixelRatio, 2)}
            },
            vertexShader: `
                uniform float time;
                uniform float bassIntensity;
                uniform float midIntensity;
                uniform float trebleIntensity;
                uniform float pixelRatio;

                attribute float size;
                attribute vec3 color;

                varying vec3 vColor;

                void main() {
                    vColor = color;

                    vec3 pos = position;

                    // Audio-reactive expansion
                    float expansion = 1.0 + bassIntensity * 0.5 + midIntensity * 0.3;
                    pos *= expansion;

                    // Rotation based on treble
                    float angle = trebleIntensity * time * 0.1;
                    mat3 rotation = mat3(
                        cos(angle), 0.0, sin(angle),
                        0.0, 1.0, 0.0,
                        -sin(angle), 0.0, cos(angle)
                    );
                    pos = rotation * pos;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;

                    // Dynamic size based on audio
                    float audioSize = bassIntensity * 2.0 + midIntensity * 1.5 + trebleIntensity;
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z) * (1.0 + audioSize);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;

                void main() {
                    // Circular particle shape
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);

                    if (dist > 0.5) discard;

                    // Soft edges
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.visualizerGroup.add(this.particles);

        console.log('✨ Particle visualization created');
    }

    /**
     * Create wave visualization
     */
    createWaveVisualization() {
        const segments = this.config.waveSegments;
        const radius = this.config.orbRadius;

        // Create multiple circular waves
        this.waves = new THREE.Group();

        for (let w = 0; w < 3; w++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array((segments + 1) * 3);
            const colors = new Float32Array((segments + 1) * 3);

            // Create circular wave
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * radius * (1 + w * 0.3);
                const y = w * 0.5 - 0.5;
                const z = Math.sin(angle) * radius * (1 + w * 0.3);

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                // Color gradient
                const t = i / segments;
                colors[i * 3] = 1.0 - t; // R
                colors[i * 3 + 1] = t; // G
                colors[i * 3 + 2] = 0.5; // B
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.userData.originalPositions = new Float32Array(positions);

            const material = new THREE.LineBasicMaterial({
                vertexColors: true,
                linewidth: 2,
                transparent: true,
                opacity: 0.8 - w * 0.2
            });

            const line = new THREE.Line(geometry, material);
            this.waves.add(line);
        }

        this.visualizerGroup.add(this.waves);

        console.log('🌊 Wave visualization created');
    }

    /**
     * Load audio from URL or file
     */
    async loadAudioSource(source) {
        try {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Disconnect previous source
            if (this.audioSource) {
                this.audioSource.disconnect();
            }

            if (typeof source === 'string') {
                // Load from URL
                this.audioElement = new Audio(source);
                this.audioElement.crossOrigin = 'anonymous';
                this.audioElement.loop = true;

                this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            } else if (source instanceof MediaStream) {
                // Load from MediaStream (microphone, etc.)
                this.audioSource = this.audioContext.createMediaStreamSource(source);
            } else {
                throw new Error('Invalid audio source type');
            }

            // Connect audio source
            this.audioSource.connect(this.analyser);
            this.audioSource.connect(this.gainNode);

            this.currentSource = source;

            console.log('🎵 Audio source loaded:', typeof source === 'string' ? source : 'MediaStream');

            return true;
        } catch (error) {
            console.error('❌ Failed to load audio source:', error);
            throw error;
        }
    }

    /**
     * Load audio from microphone
     */
    async loadMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            await this.loadAudioSource(stream);
            console.log('🎤 Microphone connected');
            return true;
        } catch (error) {
            console.error('❌ Failed to access microphone:', error);
            throw error;
        }
    }

    /**
     * Play audio
     */
    play() {
        if (!this.isInitialized) {
            console.warn('⚠️ Visualizer not initialized');
            return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.audioElement) {
            this.audioElement.play();
        }

        this.isPlaying = true;
        this.startVisualization();

        console.log('▶️ Audio playing');
    }

    /**
     * Pause audio
     */
    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
        }

        this.isPlaying = false;

        console.log('⏸️ Audio paused');
    }

    /**
     * Stop audio and visualization
     */
    stop() {
        this.pause();

        if (this.audioElement) {
            this.audioElement.currentTime = 0;
        }

        this.stopVisualization();

        console.log('⏹️ Audio stopped');
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume) {
        this.currentVolume = Math.max(0, Math.min(1, volume));

        if (this.gainNode) {
            gsap.to(this.gainNode.gain, {
                value: this.currentVolume,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        console.log(`🔊 Volume set to ${Math.round(this.currentVolume * 100)}%`);
    }

    /**
     * Change visualization mode
     */
    setVisualizationMode(mode) {
        if (mode === this.config.visualMode) return;

        console.log(`🎨 Switching to ${mode} mode`);

        // Remove old visualization
        this.visualizerGroup.clear();

        // Update mode
        this.config.visualMode = mode;

        // Create new visualization
        this.createVisualization();
    }

    /**
     * Start visualization loop
     */
    startVisualization() {
        if (this.animationId) return;

        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.updateVisualization();
        };

        animate();
    }

    /**
     * Stop visualization loop
     */
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Update visualization based on audio data
     */
    updateVisualization() {
        if (!this.isPlaying || !this.analyser) return;

        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate frequency band averages
        const bass = this.getAverageFrequency(this.bassRange.start, this.bassRange.end);
        const mid = this.getAverageFrequency(this.midRange.start, this.midRange.end);
        const treble = this.getAverageFrequency(this.trebleRange.start, this.trebleRange.end);

        // Normalize to 0-1 range
        const bassIntensity = bass / 255;
        const midIntensity = mid / 255;
        const trebleIntensity = treble / 255;

        // Update time
        this.time += 0.016; // ~60 FPS

        // Update visualization based on mode
        switch (this.config.visualMode) {
            case 'orb':
                this.updateOrbVisualization(bassIntensity, midIntensity, trebleIntensity);
                break;
            case 'particles':
                this.updateParticleVisualization(bassIntensity, midIntensity, trebleIntensity);
                break;
            case 'waves':
                this.updateWaveVisualization(bassIntensity, midIntensity, trebleIntensity);
                break;
        }

        // Track FPS
        this.trackFPS();
    }

    /**
     * Update orb visualization
     */
    updateOrbVisualization(bass, mid, treble) {
        if (!this.orbMesh) return;

        // Update shader uniforms
        this.orbMesh.material.uniforms.time.value = this.time;
        this.orbMesh.material.uniforms.bassIntensity.value = bass;
        this.orbMesh.material.uniforms.midIntensity.value = mid;
        this.orbMesh.material.uniforms.trebleIntensity.value = treble;

        // Rotate orb
        this.orbMesh.rotation.y += 0.002 + treble * 0.01;
        this.orbMesh.rotation.x += 0.001 + mid * 0.005;

        // Pulse wireframe
        const wireframe = this.orbMesh.userData.wireframe;
        if (wireframe) {
            wireframe.rotation.y = -this.orbMesh.rotation.y;
            wireframe.material.opacity = 0.1 + treble * 0.3;
        }

        // Pulse glow
        const glow = this.orbMesh.userData.glow;
        if (glow) {
            const scale = 1.2 + bass * 0.3 + mid * 0.2;
            glow.scale.setScalar(scale);
            glow.material.opacity = 0.15 + bass * 0.2;
        }
    }

    /**
     * Update particle visualization
     */
    updateParticleVisualization(bass, mid, treble) {
        if (!this.particles) return;

        // Update shader uniforms
        this.particles.material.uniforms.time.value = this.time;
        this.particles.material.uniforms.bassIntensity.value = bass;
        this.particles.material.uniforms.midIntensity.value = mid;
        this.particles.material.uniforms.trebleIntensity.value = treble;

        // Update particle colors based on frequencies
        const colors = this.particles.geometry.attributes.color;
        for (let i = 0; i < colors.count; i++) {
            const r = Math.min(1, bass * 2);
            const g = Math.min(1, mid * 2);
            const b = Math.min(1, treble * 2);

            colors.setXYZ(i, r, g, b);
        }
        colors.needsUpdate = true;

        // Rotate particle system
        this.particles.rotation.y += 0.001 + treble * 0.005;
    }

    /**
     * Update wave visualization
     */
    updateWaveVisualization(bass, mid, treble) {
        if (!this.waves) return;

        this.waves.children.forEach((wave, waveIndex) => {
            const geometry = wave.geometry;
            const positions = geometry.attributes.position;
            const originalPositions = geometry.userData.originalPositions;

            for (let i = 0; i < positions.count; i++) {
                const x = originalPositions[i * 3];
                const y = originalPositions[i * 3 + 1];
                const z = originalPositions[i * 3 + 2];

                // Apply audio-reactive displacement
                const angle = (i / positions.count) * Math.PI * 2;
                const displacement = (
                    Math.sin(angle * 2 + this.time) * bass * 0.5 +
                    Math.sin(angle * 4 + this.time * 2) * mid * 0.3 +
                    Math.sin(angle * 8 + this.time * 4) * treble * 0.2
                );

                const newY = y + displacement;

                positions.setXYZ(i, x, newY, z);
            }

            positions.needsUpdate = true;

            // Rotate wave
            wave.rotation.y += 0.002 + treble * 0.01;
        });
    }

    /**
     * Get average frequency in range
     */
    getAverageFrequency(start, end) {
        let sum = 0;
        const count = end - start;

        for (let i = start; i < end; i++) {
            sum += this.dataArray[i];
        }

        return sum / count;
    }

    /**
     * Track FPS for performance monitoring
     */
    trackFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastFrameTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Setup UI controls
     */
    setupControls() {
        // Create controls container if it doesn't exist
        let controlsContainer = document.getElementById('audio-visualizer-controls');

        if (!controlsContainer) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'audio-visualizer-controls';
            controlsContainer.className = 'audio-visualizer-controls';
            controlsContainer.innerHTML = `
                <div class="audio-controls-panel">
                    <h3>🎵 Audio Visualizer</h3>

                    <div class="control-group">
                        <label>Source</label>
                        <input type="text" id="audio-source-url" placeholder="Enter audio URL" />
                        <button id="btn-load-audio">Load</button>
                        <button id="btn-use-microphone">Use Mic</button>
                    </div>

                    <div class="control-group">
                        <button id="btn-play-audio">▶️ Play</button>
                        <button id="btn-pause-audio">⏸️ Pause</button>
                        <button id="btn-stop-audio">⏹️ Stop</button>
                    </div>

                    <div class="control-group">
                        <label>Volume</label>
                        <input type="range" id="audio-volume" min="0" max="100" value="70" />
                        <span id="volume-value">70%</span>
                    </div>

                    <div class="control-group">
                        <label>Visualization</label>
                        <select id="visual-mode">
                            <option value="orb">Orb</option>
                            <option value="particles">Particles</option>
                            <option value="waves">Waves</option>
                        </select>
                    </div>

                    <div class="control-group">
                        <label>FPS: <span id="fps-counter">60</span></label>
                    </div>
                </div>
            `;
            document.body.appendChild(controlsContainer);
        }

        // Add event listeners
        document.getElementById('btn-load-audio')?.addEventListener('click', () => {
            const url = document.getElementById('audio-source-url').value;
            if (url) {
                this.loadAudioSource(url).catch(console.error);
            }
        });

        document.getElementById('btn-use-microphone')?.addEventListener('click', () => {
            this.loadMicrophone().catch(console.error);
        });

        document.getElementById('btn-play-audio')?.addEventListener('click', () => {
            this.play();
        });

        document.getElementById('btn-pause-audio')?.addEventListener('click', () => {
            this.pause();
        });

        document.getElementById('btn-stop-audio')?.addEventListener('click', () => {
            this.stop();
        });

        document.getElementById('audio-volume')?.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            this.setVolume(volume);
            document.getElementById('volume-value').textContent = `${e.target.value}%`;
        });

        document.getElementById('visual-mode')?.addEventListener('change', (e) => {
            this.setVisualizationMode(e.target.value);
        });

        // Update FPS counter
        setInterval(() => {
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = this.getFPS();
                fpsElement.style.color = this.fps >= 55 ? '#55FF88' : '#FF3355';
            }
        }, 1000);
    }

    /**
     * Show visualizer
     */
    show() {
        if (this.visualizerGroup) {
            gsap.to(this.visualizerGroup.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 1,
                ease: 'elastic.out(1, 0.5)'
            });
        }

        document.getElementById('audio-visualizer-controls')?.classList.add('visible');
    }

    /**
     * Hide visualizer
     */
    hide() {
        if (this.visualizerGroup) {
            gsap.to(this.visualizerGroup.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.5,
                ease: 'power2.in'
            });
        }

        document.getElementById('audio-visualizer-controls')?.classList.remove('visible');
    }

    /**
     * Update method for main animation loop
     */
    update(delta) {
        // Continuous rotation even when not playing
        if (this.visualizerGroup && !this.isPlaying) {
            this.visualizerGroup.rotation.y += delta * 0.1;
        }
    }

    /**
     * Set position
     */
    setPosition(x, y, z) {
        this.config.position.set(x, y, z);
        if (this.visualizerGroup) {
            gsap.to(this.visualizerGroup.position, {
                x, y, z,
                duration: 1,
                ease: 'power2.inOut'
            });
        }
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        console.log('🗑️ Disposing Audio Visualizer 3D...');

        this.stop();
        this.stopVisualization();

        // Disconnect audio nodes
        if (this.audioSource) {
            this.audioSource.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }

        // Remove from scene
        if (this.visualizerGroup) {
            this.scene.remove(this.visualizerGroup);
        }

        // Remove UI controls
        const controls = document.getElementById('audio-visualizer-controls');
        if (controls) {
            controls.remove();
        }

        console.log('✅ Audio Visualizer 3D disposed');
    }
}

// Export for use in other modules
export default AudioVisualizer3D;
