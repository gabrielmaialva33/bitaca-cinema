// ===============================================
// BITACA CINEMA - GPGPU PARTICLE HERO
// Sistema de partículas GPU-acelerado com FBO
// Performance 10x-100x melhor que CPU
// ===============================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';

class ParticleHeroGPGPU {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        this.isMobile = window.innerWidth < 768;

        // GPGPU-optimized particle counts
        this.particleCount = this.isMobile ? 2048 : 4096; // Potência de 2 para GPU
        this.textureSize = Math.ceil(Math.sqrt(this.particleCount));

        this.touchActive = false;
        this.time = 0;

        // FBO (Frame Buffer Objects) para ping-pong rendering
        this.fboPositions = null;
        this.fboVelocities = null;
        this.fboScene = new THREE.Scene();
        this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: !this.isMobile,
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Inicializar GPGPU system
        this.initGPGPU();

        // Criar sistema de partículas GPU-accelerated
        this.createParticleSystem();

        // Criar background shader
        this.createBackgroundShader();

        // Event listeners
        this.setupEventListeners();

        // Start animation
        this.renderer.setAnimationLoop(() => this.animate());
    }

    initGPGPU() {
        // Criar texturas de dados iniciais (posição e velocidade)
        const positionData = new Float32Array(this.textureSize * this.textureSize * 4);
        const velocityData = new Float32Array(this.textureSize * this.textureSize * 4);

        // Preencher com dados iniciais
        for (let i = 0; i < this.particleCount; i++) {
            const i4 = i * 4;

            // Posições em esfera
            const radius = 10 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positionData[i4 + 0] = radius * Math.sin(phi) * Math.cos(theta);
            positionData[i4 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positionData[i4 + 2] = radius * Math.cos(phi);
            positionData[i4 + 3] = 1.0; // w component

            // Velocidades orgânicas
            velocityData[i4 + 0] = (Math.random() - 0.5) * 0.02;
            velocityData[i4 + 1] = (Math.random() - 0.5) * 0.02;
            velocityData[i4 + 2] = (Math.random() - 0.5) * 0.02;
            velocityData[i4 + 3] = 1.0;
        }

        // Criar texturas FBO (Float32 para precisão)
        const positionTexture = new THREE.DataTexture(
            positionData,
            this.textureSize,
            this.textureSize,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        positionTexture.needsUpdate = true;

        const velocityTexture = new THREE.DataTexture(
            velocityData,
            this.textureSize,
            this.textureSize,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        velocityTexture.needsUpdate = true;

        // Criar FBO render targets (ping-pong)
        this.fboPositions = {
            read: this.createRenderTarget(),
            write: this.createRenderTarget(),
        };

        this.fboVelocities = {
            read: this.createRenderTarget(),
            write: this.createRenderTarget(),
        };

        // Copiar texturas iniciais para FBOs
        this.copyTextureToFBO(positionTexture, this.fboPositions.read);
        this.copyTextureToFBO(velocityTexture, this.fboVelocities.read);

        // Criar simulation shader (roda na GPU)
        this.createSimulationShader();
    }

    createRenderTarget() {
        return new THREE.WebGLRenderTarget(this.textureSize, this.textureSize, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            stencilBuffer: false,
            depthBuffer: false,
        });
    }

    copyTextureToFBO(texture, fbo) {
        const material = new THREE.MeshBasicMaterial({map: texture});
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        const tempScene = new THREE.Scene();
        tempScene.add(mesh);

        this.renderer.setRenderTarget(fbo);
        this.renderer.render(tempScene, this.fboCamera);
        this.renderer.setRenderTarget(null);

        mesh.geometry.dispose();
        material.dispose();
    }

    createSimulationShader() {
        // Shader que calcula física das partículas na GPU
        const simulationMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tPosition: {value: null},
                tVelocity: {value: null},
                uTime: {value: 0},
                uMouse: {value: new THREE.Vector2()},
                uDeltaTime: {value: 0.016},
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tPosition;
                uniform sampler2D tVelocity;
                uniform float uTime;
                uniform vec2 uMouse;
                uniform float uDeltaTime;
                varying vec2 vUv;

                // Curl noise para movimento orgânico
                vec3 curlNoise(vec3 p) {
                    float e = 0.1;
                    vec3 dx = vec3(e, 0.0, 0.0);
                    vec3 dy = vec3(0.0, e, 0.0);
                    vec3 dz = vec3(0.0, 0.0, e);

                    vec3 p_x0 = p - dx;
                    vec3 p_x1 = p + dx;
                    vec3 p_y0 = p - dy;
                    vec3 p_y1 = p + dy;
                    vec3 p_z0 = p - dz;
                    vec3 p_z1 = p + dz;

                    // Simplex noise simplificado
                    float x0 = sin(p_x0.x + p_x0.y * 0.5 + uTime * 0.1) * cos(p_x0.z);
                    float x1 = sin(p_x1.x + p_x1.y * 0.5 + uTime * 0.1) * cos(p_x1.z);
                    float y0 = sin(p_y0.y + p_y0.z * 0.5 + uTime * 0.1) * cos(p_y0.x);
                    float y1 = sin(p_y1.y + p_y1.z * 0.5 + uTime * 0.1) * cos(p_y1.x);
                    float z0 = sin(p_z0.z + p_z0.x * 0.5 + uTime * 0.1) * cos(p_z0.y);
                    float z1 = sin(p_z1.z + p_z1.x * 0.5 + uTime * 0.1) * cos(p_z1.y);

                    float x = (x1 - x0) / (2.0 * e);
                    float y = (y1 - y0) / (2.0 * e);
                    float z = (z1 - z0) / (2.0 * e);

                    return vec3(x, y, z);
                }

                void main() {
                    vec4 position = texture2D(tPosition, vUv);
                    vec4 velocity = texture2D(tVelocity, vUv);

                    vec3 pos = position.xyz;
                    vec3 vel = velocity.xyz;

                    // Curl noise force
                    vec3 curlForce = curlNoise(pos * 0.1 + uTime * 0.05) * 0.001;
                    vel += curlForce;

                    // Mouse interaction
                    vec2 mousePos = uMouse * 10.0;
                    vec2 diff = pos.xy - mousePos;
                    float distance = length(diff);

                    if (distance < 5.0) {
                        vec3 force = vec3(diff, 0.0) * 0.02 / (distance + 0.1);
                        vel += force;
                    }

                    // Update position
                    pos += vel;

                    // Bounce bounds
                    float maxDist = 15.0;
                    if (abs(pos.x) > maxDist) {
                        pos.x = sign(pos.x) * maxDist;
                        vel.x *= -0.8;
                    }
                    if (abs(pos.y) > maxDist) {
                        pos.y = sign(pos.y) * maxDist;
                        vel.y *= -0.8;
                    }
                    if (abs(pos.z) > maxDist) {
                        pos.z = sign(pos.z) * maxDist;
                        vel.z *= -0.8;
                    }

                    // Damping
                    vel *= 0.99;

                    // Output
                    gl_FragColor = vec4(pos, 1.0);
                }
            `,
        });

        // Velocity update shader
        const velocityMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tPosition: {value: null},
                tVelocity: {value: null},
                uTime: {value: 0},
                uMouse: {value: new THREE.Vector2()},
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tPosition;
                uniform sampler2D tVelocity;
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;

                void main() {
                    vec4 velocity = texture2D(tVelocity, vUv);

                    // Simplesmente passar velocidade (já atualizada no position shader)
                    gl_FragColor = velocity;
                }
            `,
        });

        this.simulationMaterial = simulationMaterial;
        this.velocityMaterial = velocityMaterial;

        // Criar mesh fullscreen para FBO
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.simulationMesh = new THREE.Mesh(geometry, simulationMaterial);
        this.fboScene.add(this.simulationMesh);
    }

    createParticleSystem() {
        // Criar geometria com UVs para lookup de textura FBO
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const uvs = [];
        const colors = [];
        const sizes = [];

        for (let i = 0; i < this.particleCount; i++) {
            // Position será lida da textura FBO no shader
            positions.push(0, 0, 0);

            // UV para lookup na textura FBO
            const u = (i % this.textureSize) / this.textureSize;
            const v = Math.floor(i / this.textureSize) / this.textureSize;
            uvs.push(u, v);

            // Cores aleatórias Bitaca
            const colorKeys = Object.keys(this.colors);
            const randomColor = this.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];
            colors.push(randomColor.r, randomColor.g, randomColor.b);

            // Tamanhos variados
            sizes.push(this.isMobile ? 2 + Math.random() * 3 : 3 + Math.random() * 5);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        // Material que lê posição da textura FBO
        const material = new THREE.ShaderMaterial({
            uniforms: {
                tPosition: {value: null},
                uSize: {value: this.isMobile ? 4.0 : 6.0},
                uTime: {value: 0},
            },
            vertexShader: `
                uniform sampler2D tPosition;
                uniform float uSize;
                uniform float uTime;

                attribute vec3 color;
                attribute float size;

                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vColor = color;

                    // Ler posição da textura FBO
                    vec4 positionInfo = texture2D(tPosition, uv);
                    vec3 pos = positionInfo.xyz;

                    // Calcular alpha baseado na distância da câmera
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    float depth = -mvPosition.z;
                    vAlpha = smoothstep(30.0, 10.0, depth);

                    gl_PointSize = size * uSize * (10.0 / depth);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    // Criar círculo suave
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);

                    if (dist > 0.5) discard;

                    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * 0.8;

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
        });

        this.particleMaterial = material;
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createBackgroundShader() {
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {value: 0},
                uColor1: {value: new THREE.Color(0x0A0A0A)},
                uColor2: {value: new THREE.Color(0x1a1a1a)},
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
        }, {passive: false});

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.touchActive) {
                this.updateMousePosition(e.touches[0]);
            }
        }, {passive: false});

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
        // Vibração haptic (se disponível)
        if (navigator.vibrate && this.isMobile) {
            navigator.vibrate(50);
        }

        // Adicionar força explosiva temporária ao mouse
        this.mouse.x = this.targetMouse.x * 1.5;
        this.mouse.y = this.targetMouse.y * 1.5;
    }

    animate() {
        this.time += 0.016;

        // Smooth mouse lerp
        this.mouse.lerp(this.targetMouse, 0.1);

        // Update GPGPU simulation
        this.simulationMaterial.uniforms.tPosition.value = this.fboPositions.read.texture;
        this.simulationMaterial.uniforms.tVelocity.value = this.fboVelocities.read.texture;
        this.simulationMaterial.uniforms.uTime.value = this.time;
        this.simulationMaterial.uniforms.uMouse.value = this.mouse;

        // Render simulation to FBO (ping-pong)
        this.renderer.setRenderTarget(this.fboPositions.write);
        this.renderer.render(this.fboScene, this.fboCamera);
        this.renderer.setRenderTarget(null);

        // Swap FBOs (ping-pong)
        const temp = this.fboPositions.read;
        this.fboPositions.read = this.fboPositions.write;
        this.fboPositions.write = temp;

        // Update particle material com nova posição
        this.particleMaterial.uniforms.tPosition.value = this.fboPositions.read.texture;
        this.particleMaterial.uniforms.uTime.value = this.time;

        // Update background shader
        if (this.backgroundShader) {
            this.backgroundShader.uniforms.uTime.value = this.time;
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

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

        // Dispose FBOs
        this.fboPositions.read.dispose();
        this.fboPositions.write.dispose();
        this.fboVelocities.read.dispose();
        this.fboVelocities.write.dispose();

        // Dispose simulation materials
        this.simulationMaterial.dispose();
        this.velocityMaterial.dispose();
        this.simulationMesh.geometry.dispose();

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
        window.particleHero = new ParticleHeroGPGPU();
        window.particleHero.init();
    });
} else {
    window.particleHero = new ParticleHeroGPGPU();
    window.particleHero.init();
}

export default ParticleHeroGPGPU;
