// ===============================================
// BITACA CINEMA - PARTICLE HERO (Mobile-First)
// Sistema de partículas interativo com Three.js
// Touch-responsive + Performance otimizada
// ===============================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';

class ParticleHero {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        this.isMobile = window.innerWidth < 768;
        this.particleCount = this.isMobile ? 150 : 500;
        this.touchActive = false;
        this.explosionParticles = [];

        // Cores Bitaca
        this.colors = {
            vermelho: new THREE.Color(0xC41E3A),
            verde: new THREE.Color(0x2D5016),
            laranja: new THREE.Color(0xFF6B35),
            amarelo: new THREE.Color(0xFFB700),
        };
    }

    init() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;

        // Setup scene
        this.scene = new THREE.Scene();

        // Camera setup (mobile-optimized FOV)
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.isMobile ? 60 : 50,
            aspect,
            0.1,
            1000
        );
        this.camera.position.z = this.isMobile ? 25 : 20;

        // Renderer setup (PixelRatio limitado para performance)
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: !this.isMobile, // Desabilitar AA em mobile
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Criar sistema de partículas
        this.createParticleSystem();

        // Criar background shader
        this.createBackgroundShader();

        // Event listeners
        this.setupEventListeners();

        // Start animation (setAnimationLoop é o padrão moderno)
        this.renderer.setAnimationLoop(() => this.animate());
    }

    createParticleSystem() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const velocities = [];

        for (let i = 0; i < this.particleCount; i++) {
            // Posições em esfera
            const radius = 10 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );

            // Cores aleatórias Bitaca
            const colorKeys = Object.keys(this.colors);
            const randomColor = this.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
            colors.push(randomColor.r, randomColor.g, randomColor.b);

            // Tamanhos variados
            sizes.push(this.isMobile ? 2 + Math.random() * 3 : 3 + Math.random() * 5);

            // Velocidades para movimento orgânico
            velocities.push(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        this.velocities = velocities;

        // Material com vertex colors
        const material = new THREE.PointsMaterial({
            size: this.isMobile ? 4 : 6,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createBackgroundShader() {
        // Background com gradiente animado
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor1: { value: new THREE.Color(0x0A0A0A) },
                uColor2: { value: new THREE.Color(0x1a1a1a) },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                varying vec2 vUv;

                void main() {
                    vec3 color = mix(uColor1, uColor2, vUv.y + sin(vUv.x * 3.0 + uTime * 0.5) * 0.1);
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -30;
        this.scene.add(mesh);
        this.backgroundShader = material;
    }

    setupEventListeners() {
        const canvas = this.renderer.domElement;

        // Touch events (mobile)
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchActive = true;
            this.updateMousePosition(e.touches[0]);
            this.createExplosion(e.touches[0]);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.touchActive) {
                this.updateMousePosition(e.touches[0]);
            }
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            this.touchActive = false;
        });

        // Mouse events (desktop)
        if (!this.isMobile) {
            canvas.addEventListener('mousemove', (e) => {
                this.updateMousePosition(e);
            });

            canvas.addEventListener('click', (e) => {
                this.createExplosion(e);
            });
        }

        // Window resize
        window.addEventListener('resize', () => this.onResize());
    }

    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.targetMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.targetMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    createExplosion(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Criar partículas de explosão
        const explosionCount = this.isMobile ? 10 : 20;

        for (let i = 0; i < explosionCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? this.colors.laranja : this.colors.amarelo,
                transparent: true,
                opacity: 1,
            });

            const particle = new THREE.Mesh(geometry, material);

            // Posição no espaço 3D
            const vector = new THREE.Vector3(x, y, 0);
            vector.unproject(this.camera);
            particle.position.copy(vector);

            // Velocidade aleatória
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );

            particle.life = 1.0;

            this.scene.add(particle);
            this.explosionParticles.push(particle);
        }

        // Vibração haptic (se disponível)
        if (navigator.vibrate && this.isMobile) {
            navigator.vibrate(50);
        }
    }

    animate() {
        // Smooth mouse lerp
        this.mouse.lerp(this.targetMouse, 0.1);

        // Update particles
        const positions = this.particles.geometry.attributes.position.array;

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Movimento orgânico
            positions[i3] += this.velocities[i3];
            positions[i3 + 1] += this.velocities[i3 + 1];
            positions[i3 + 2] += this.velocities[i3 + 2];

            // Interação com mouse
            const dx = positions[i3] - this.mouse.x * 10;
            const dy = positions[i3 + 1] - this.mouse.y * 10;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                positions[i3] += dx * 0.02;
                positions[i3 + 1] += dy * 0.02;
            }

            // Bounce bounds
            const maxDist = 15;
            if (Math.abs(positions[i3]) > maxDist) this.velocities[i3] *= -1;
            if (Math.abs(positions[i3 + 1]) > maxDist) this.velocities[i3 + 1] *= -1;
            if (Math.abs(positions[i3 + 2]) > maxDist) this.velocities[i3 + 2] *= -1;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.rotation.y += 0.001;

        // Update explosion particles
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const particle = this.explosionParticles[i];

            particle.position.add(particle.velocity);
            particle.life -= 0.02;
            particle.material.opacity = particle.life;
            particle.scale.multiplyScalar(0.95);

            if (particle.life <= 0) {
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
                this.explosionParticles.splice(i, 1);
            }
        }

        // Update background shader
        if (this.backgroundShader) {
            this.backgroundShader.uniforms.uTime.value += 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        // Atualizar flag mobile
        this.isMobile = window.innerWidth < 768;
    }

    dispose() {
        // Stop animation loop
        this.renderer.setAnimationLoop(null);

        // Dispose particles
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }

        // Dispose explosion particles
        this.explosionParticles.forEach(particle => {
            particle.geometry.dispose();
            particle.material.dispose();
            this.scene.remove(particle);
        });

        // Dispose background shader
        if (this.backgroundShader) {
            this.backgroundShader.dispose();
        }

        // Dispose renderer
        this.renderer.dispose();
    }
}

// Auto-inicializar quando DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.particleHero = new ParticleHero();
        window.particleHero.init();
    });
} else {
    window.particleHero = new ParticleHero();
    window.particleHero.init();
}

export default ParticleHero;
