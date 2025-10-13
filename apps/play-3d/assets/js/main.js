/**
 * ========================================
 * BITACA PLAY 3D - MAIN ENTRY POINT
 * Three.js Interactive Experience
 * ========================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DeronaAvatar } from './components/derona-avatar.js';
import { PatrimonioWorld } from './scenes/patrimonio-world.js';
import { MusicaWorld } from './scenes/musica-world.js';
import { AmbienteWorld } from './scenes/ambiente-world.js';
import { PostProcessingManager } from './post-processing.js';
import { CinematicLighting, LightingPresets } from './cinematic-lighting.js';

console.log('🎮 Bitaca Play 3D initializing...');

// ========================================
// GLOBAL STATE
// ========================================
const AppState = {
    isLoading: true,
    currentWorld: null,
    isMenuOpen: false,
    isDeronaVisible: false,
    selectedProduction: null,
    loadingProgress: 0
};

// ========================================
// THREE.JS SETUP
// ========================================
class BitacaPlay3D {
    constructor() {
        this.canvas = document.getElementById('play3d-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.postProcessing = null;
        this.cinematicLighting = null;
        this.controls = null;
        this.pointerLockControls = null;
        this.clock = new THREE.Clock();
        this.worlds = {};
        this.currentWorldInstance = null;
        this.derona = null;

        // Input
        this.keys = {};
        this.moveSpeed = 5.0;

        this.init();
    }

    async init() {
        console.log('🎬 Initializing Three.js scene...');
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupPostProcessing();
        this.setupControls();
        this.setupEnvironment();
        await this.setupCinematicLighting();
        this.setupEventListeners();
        this.loadAssets();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0A0A0A, 50, 200);
        this.scene.background = new THREE.Color(0x0A0A0A);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 15);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false, // FXAA will handle anti-aliasing
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shadow configuration
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Physically-based lighting
        this.renderer.physicallyCorrectLights = true;

        // Tone mapping for cinematic look
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Output encoding for accurate colors
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        console.log('✅ Renderer configured with physically correct lights');
    }

    setupPostProcessing() {
        this.postProcessing = new PostProcessingManager(
            this.renderer,
            this.scene,
            this.camera
        );
        console.log('✅ Post-processing pipeline ready');
    }

    setupControls() {
        // Orbit controls for menu/selection
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Pointer lock for first-person navigation
        this.pointerLockControls = new PointerLockControls(this.camera, this.renderer.domElement);
        this.pointerLockControls.isLocked = false;
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xF5DEB3, 0.4);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Hemisphere light
        const hemisphereLight = new THREE.HemisphereLight(0xFFE5B4, 0x080820, 0.5);
        this.scene.add(hemisphereLight);

        // Accent lights (Bitaca red)
        const accentLight1 = new THREE.PointLight(0xC41E3A, 1, 30);
        accentLight1.position.set(-10, 5, 0);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0xC41E3A, 1, 30);
        accentLight2.position.set(10, 5, 0);
        this.scene.add(accentLight2);
    }

    setupEnvironment() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid helper
        const gridHelper = new THREE.GridHelper(200, 50, 0xC41E3A, 0x2A2A2A);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // UI Events
        this.setupUIEvents();
    }

    setupUIEvents() {
        // World selection
        document.querySelectorAll('.world-card').forEach(card => {
            card.addEventListener('click', () => {
                const worldName = card.dataset.world;
                this.loadWorld(worldName);
            });
        });

        // Menu toggle
        document.getElementById('btn-menu').addEventListener('click', () => {
            this.toggleMenu();
        });

        document.getElementById('btn-close-menu').addEventListener('click', () => {
            this.toggleMenu();
        });

        // Fullscreen
        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Help
        document.getElementById('btn-help').addEventListener('click', () => {
            this.showHelp();
        });

        // Derona
        document.getElementById('btn-close-derona').addEventListener('click', () => {
            this.hideDerona();
        });

        document.getElementById('btn-ask-derona').addEventListener('click', () => {
            this.openChatWithDerona();
        });

        // Production card
        document.getElementById('btn-close-card').addEventListener('click', () => {
            this.closeProductionCard();
        });

        // Post-processing UI
        this.setupPostProcessingUI();
    }

    setupPostProcessingUI() {
        // Add keyboard shortcut for toggling effects
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' && e.shiftKey) {
                this.postProcessing.setEnabled(!this.postProcessing.enabled);
                this.showNotification(
                    `Post-processing ${this.postProcessing.enabled ? 'ON' : 'OFF'}`
                );
            }
            if (e.code === 'KeyQ' && e.shiftKey) {
                const qualities = ['low', 'medium', 'high'];
                const currentIndex = qualities.indexOf(this.postProcessing.currentQuality);
                const nextQuality = qualities[(currentIndex + 1) % qualities.length];
                this.postProcessing.setQuality(nextQuality);
                this.showNotification(`Quality: ${nextQuality.toUpperCase()}`);
            }
        });

        // Log current state every 5 seconds (debug)
        setInterval(() => {
            const state = this.postProcessing.getState();
            console.log('📊 Post-processing state:', state);
        }, 5000);
    }

    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(196, 30, 58, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: 'Barlow', sans-serif;
            font-weight: 600;
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    async loadAssets() {
        console.log('📦 Loading 3D assets...');

        const loader = new GLTFLoader();
        const loadingScreen = document.getElementById('loading-screen');
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');

        try {
            // Simulate loading progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 95) progress = 95;

                loadingProgress.style.width = `${progress}%`;
                loadingText.textContent = `Carregando experiência 3D... ${Math.floor(progress)}%`;
            }, 200);

            // Load Derona avatar
            this.derona = new DeronaAvatar(this.scene);
            await this.derona.load();

            // Initialize world instances
            this.worlds = {
                patrimonio: new PatrimonioWorld(this.scene, this.camera),
                musica: new MusicaWorld(this.scene, this.camera),
                ambiente: new AmbienteWorld(this.scene, this.camera)
            };

            clearInterval(interval);
            loadingProgress.style.width = '100%';
            loadingText.textContent = 'Pronto! Bem-vindo ao Bitaca Play 3D';

            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                AppState.isLoading = false;
                console.log('✅ Assets loaded successfully!');
            }, 800);

        } catch (error) {
            console.error('❌ Error loading assets:', error);
            loadingText.textContent = 'Erro ao carregar. Recarregue a página.';
        }
    }

    loadWorld(worldName) {
        console.log(`🌍 Loading world: ${worldName}`);

        // Hide world selector
        document.getElementById('world-selector').style.display = 'none';

        // Unload current world
        if (this.currentWorldInstance) {
            this.currentWorldInstance.unload();
        }

        // Load new world
        this.currentWorldInstance = this.worlds[worldName];
        if (this.currentWorldInstance) {
            this.currentWorldInstance.load();
            AppState.currentWorld = worldName;

            // Apply world-specific post-processing
            if (this.postProcessing) {
                this.postProcessing.applyWorldConfig(worldName);
            }

            // Show Derona
            setTimeout(() => {
                this.showDerona(`Bem-vindo ao mundo ${worldName}! Explore livremente ou me pergunte sobre as produções.`);
            }, 1000);
        }
    }

    showDerona(message = '') {
        const deronaDialog = document.getElementById('derona-dialog');
        const deronaMessage = document.getElementById('derona-message');

        if (message) {
            deronaMessage.textContent = message;
        }

        deronaDialog.style.display = 'block';
        AppState.isDeronaVisible = true;

        if (this.derona) {
            this.derona.show();
            this.derona.speak(message);
        }
    }

    hideDerona() {
        const deronaDialog = document.getElementById('derona-dialog');
        deronaDialog.style.display = 'none';
        AppState.isDeronaVisible = false;

        if (this.derona) {
            this.derona.hide();
        }
    }

    openChatWithDerona() {
        // Open chatbot integration (connect to existing Bitaca AI)
        window.open('https://chat.abitaca.com.br', '_blank');
    }

    showProductionCard(production) {
        const card = document.getElementById('production-card');
        document.getElementById('card-title').textContent = production.titulo;
        document.getElementById('card-director').textContent = production.diretor;
        document.getElementById('card-sinopse').textContent = production.sinopse;
        document.getElementById('card-status').textContent = production.status;
        document.getElementById('card-category').textContent = production.categoria;

        card.style.display = 'block';
        AppState.selectedProduction = production;
    }

    closeProductionCard() {
        document.getElementById('production-card').style.display = 'none';
        AppState.selectedProduction = null;
    }

    toggleMenu() {
        const menu = document.getElementById('menu-sidebar');
        menu.classList.toggle('active');
        AppState.isMenuOpen = !AppState.isMenuOpen;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    showHelp() {
        alert(`🎮 CONTROLES BITACA PLAY 3D

Navegação:
• W A S D ou Setas - Mover
• Mouse - Olhar ao redor
• E - Interagir com objetos
• ESC - Abrir menu

Dicas:
• Clique nos portais para entrar nos mundos temáticos
• Aproxime-se dos cartões de filmes para ver detalhes
• Chame a Derona para ajuda e recomendações

Divirta-se explorando o universo Bitaca! 🎬✨`);
    }

    onKeyDown(event) {
        this.keys[event.code] = true;

        if (event.code === 'Escape') {
            this.toggleMenu();
        }

        if (event.code === 'KeyE') {
            this.interact();
        }
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    interact() {
        // Raycast to check for interactable objects
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.interactable) {
                console.log('🎯 Interacting with:', object.userData);

                if (object.userData.type === 'production') {
                    this.showProductionCard(object.userData.production);
                } else if (object.userData.type === 'portal') {
                    this.loadWorld(object.userData.world);
                }
            }
        }
    }

    updateMovement(delta) {
        if (!this.pointerLockControls.isLocked) return;

        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();

        if (this.keys['KeyW'] || this.keys['ArrowUp']) direction.z = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) direction.z = 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) direction.x = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) direction.x = 1;

        direction.normalize();
        velocity.add(direction.multiplyScalar(this.moveSpeed * delta));

        this.pointerLockControls.moveRight(velocity.x);
        this.pointerLockControls.moveForward(velocity.z);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Update post-processing
        if (this.postProcessing) {
            this.postProcessing.onWindowResize(window.innerWidth, window.innerHeight);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Update controls
        if (!AppState.isLoading) {
            this.controls.update();
            this.updateMovement(delta);
        }

        // Update current world
        if (this.currentWorldInstance) {
            this.currentWorldInstance.update(delta);
        }

        // Update Derona
        if (this.derona) {
            this.derona.update(delta);
        }

        // Render with post-processing
        if (this.postProcessing) {
            this.postProcessing.render(delta);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// ========================================
// INITIALIZE APP
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Bitaca Play 3D...');
    const app = new BitacaPlay3D();

    // Expose to window for debugging
    window.bitacaPlay3D = app;
});
