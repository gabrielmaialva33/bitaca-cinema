/**
 * ========================================
 * POST-PROCESSING MANAGER
 * Professional pipeline with adaptive quality
 * ========================================
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

/**
 * Quality presets for different performance tiers
 */
const QUALITY_PRESETS = {
    low: {
        bloom: {
            enabled: true,
            strength: 0.3,
            radius: 0.2,
            threshold: 0.9
        },
        ssao: {
            enabled: false
        },
        fxaa: {
            enabled: true
        },
        filmGrain: {
            enabled: false
        },
        vignette: {
            enabled: false
        },
        pixelRatio: 1.0
    },
    medium: {
        bloom: {
            enabled: true,
            strength: 0.5,
            radius: 0.4,
            threshold: 0.85
        },
        ssao: {
            enabled: true,
            kernelRadius: 8,
            minDistance: 0.005,
            maxDistance: 0.1,
            output: 0 // Default output
        },
        fxaa: {
            enabled: true
        },
        filmGrain: {
            enabled: true,
            intensity: 0.15
        },
        vignette: {
            enabled: true,
            offset: 0.5,
            darkness: 0.5
        },
        pixelRatio: 1.5
    },
    high: {
        bloom: {
            enabled: true,
            strength: 0.8,
            radius: 0.5,
            threshold: 0.8
        },
        ssao: {
            enabled: true,
            kernelRadius: 16,
            minDistance: 0.005,
            maxDistance: 0.15,
            output: 0
        },
        fxaa: {
            enabled: true
        },
        filmGrain: {
            enabled: true,
            intensity: 0.2
        },
        vignette: {
            enabled: true,
            offset: 0.6,
            darkness: 0.6
        },
        pixelRatio: 2.0
    }
};

/**
 * Per-world effect configurations
 */
const WORLD_CONFIGS = {
    patrimonio: {
        bloom: {
            strength: 0.6,
            threshold: 0.85
        },
        filmGrain: {
            intensity: 0.25 // More vintage feel
        },
        vignette: {
            darkness: 0.7
        }
    },
    musica: {
        bloom: {
            strength: 1.2, // More bloom for musical vibes
            threshold: 0.75
        },
        filmGrain: {
            intensity: 0.1 // Less grain for cleaner look
        },
        vignette: {
            darkness: 0.4
        }
    },
    ambiente: {
        bloom: {
            strength: 0.4,
            threshold: 0.9
        },
        ssao: {
            kernelRadius: 20, // More AO for environmental depth
            maxDistance: 0.2
        },
        filmGrain: {
            intensity: 0.15
        },
        vignette: {
            darkness: 0.5
        }
    }
};

/**
 * Custom shaders for additional effects
 */
const FilmGrainShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        intensity: { value: 0.2 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;

        float random(vec2 coords) {
            return fract(sin(dot(coords.xy + time, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            float noise = random(vUv) * intensity;
            color.rgb += noise;
            gl_FragColor = color;
        }
    `
};

const VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        offset: { value: 0.5 },
        darkness: { value: 0.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
            float vignette = 1.0 - dot(uv, uv);
            vignette = clamp(pow(vignette, darkness), 0.0, 1.0);
            color.rgb *= vignette;
            gl_FragColor = color;
        }
    `
};

/**
 * PostProcessingManager - Handles all post-processing effects
 */
export class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.composer = null;
        this.passes = {};

        this.enabled = true;
        this.currentQuality = this.detectOptimalQuality();
        this.currentWorld = null;

        // Performance monitoring
        this.fpsHistory = [];
        this.fpsMonitorInterval = null;
        this.adaptiveQualityEnabled = true;

        // Time for animated shaders
        this.time = 0;

        this.init();
        this.startPerformanceMonitoring();
    }

    /**
     * Detect optimal quality based on device capabilities
     */
    detectOptimalQuality() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);

        if (isMobile) {
            return 'low';
        } else if (isTablet) {
            return 'medium';
        } else {
            // Desktop - check GPU tier via renderer info
            const gl = this.renderer.getContext();
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                console.log('GPU:', renderer);

                // Simple heuristic - check for integrated graphics
                if (renderer.includes('Intel')) {
                    return 'medium';
                }
            }
            return 'high';
        }
    }

    /**
     * Initialize the post-processing pipeline
     */
    init() {
        console.log(`🎨 Initializing post-processing pipeline (${this.currentQuality} quality)`);

        const preset = QUALITY_PRESETS[this.currentQuality];
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update renderer pixel ratio
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));

        // Create composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(width, height);

        // 1. Render pass (base scene)
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this.passes.render = renderPass;

        // 2. SSAO Pass (ambient occlusion)
        if (preset.ssao.enabled) {
            const ssaoPass = new SSAOPass(
                this.scene,
                this.camera,
                width,
                height
            );
            ssaoPass.kernelRadius = preset.ssao.kernelRadius;
            ssaoPass.minDistance = preset.ssao.minDistance;
            ssaoPass.maxDistance = preset.ssao.maxDistance;
            ssaoPass.output = preset.ssao.output;

            this.composer.addPass(ssaoPass);
            this.passes.ssao = ssaoPass;
            console.log('✓ SSAO enabled');
        }

        // 3. Bloom Pass (selective glow)
        if (preset.bloom.enabled) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(width, height),
                preset.bloom.strength,
                preset.bloom.radius,
                preset.bloom.threshold
            );

            this.composer.addPass(bloomPass);
            this.passes.bloom = bloomPass;
            console.log('✓ Bloom enabled');
        }

        // 4. Film Grain Pass
        if (preset.filmGrain.enabled) {
            const filmGrainPass = new ShaderPass(FilmGrainShader);
            filmGrainPass.uniforms.intensity.value = preset.filmGrain.intensity;

            this.composer.addPass(filmGrainPass);
            this.passes.filmGrain = filmGrainPass;
            console.log('✓ Film grain enabled');
        }

        // 5. Vignette Pass
        if (preset.vignette.enabled) {
            const vignettePass = new ShaderPass(VignetteShader);
            vignettePass.uniforms.offset.value = preset.vignette.offset;
            vignettePass.uniforms.darkness.value = preset.vignette.darkness;

            this.composer.addPass(vignettePass);
            this.passes.vignette = vignettePass;
            console.log('✓ Vignette enabled');
        }

        // 6. FXAA Pass (anti-aliasing)
        if (preset.fxaa.enabled) {
            const fxaaPass = new ShaderPass(FXAAShader);
            const pixelRatio = this.renderer.getPixelRatio();
            fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
            fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);

            this.composer.addPass(fxaaPass);
            this.passes.fxaa = fxaaPass;
            console.log('✓ FXAA enabled');
        }

        // 7. Output Pass (color correction)
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
        this.passes.output = outputPass;

        console.log('✅ Post-processing pipeline initialized');
    }

    /**
     * Apply world-specific effect configurations
     */
    applyWorldConfig(worldName) {
        if (!WORLD_CONFIGS[worldName]) {
            console.warn(`No post-processing config for world: ${worldName}`);
            return;
        }

        console.log(`🎨 Applying ${worldName} post-processing config`);
        this.currentWorld = worldName;

        const worldConfig = WORLD_CONFIGS[worldName];

        // Update bloom settings
        if (this.passes.bloom && worldConfig.bloom) {
            Object.assign(this.passes.bloom, worldConfig.bloom);
        }

        // Update SSAO settings
        if (this.passes.ssao && worldConfig.ssao) {
            Object.assign(this.passes.ssao, worldConfig.ssao);
        }

        // Update film grain settings
        if (this.passes.filmGrain && worldConfig.filmGrain) {
            this.passes.filmGrain.uniforms.intensity.value = worldConfig.filmGrain.intensity;
        }

        // Update vignette settings
        if (this.passes.vignette && worldConfig.vignette) {
            this.passes.vignette.uniforms.darkness.value = worldConfig.vignette.darkness;
        }
    }

    /**
     * Set quality preset
     */
    setQuality(quality) {
        if (!QUALITY_PRESETS[quality]) {
            console.error(`Invalid quality preset: ${quality}`);
            return;
        }

        console.log(`🎨 Changing quality from ${this.currentQuality} to ${quality}`);
        this.currentQuality = quality;

        // Rebuild the pipeline
        this.dispose();
        this.init();

        // Reapply world config if any
        if (this.currentWorld) {
            this.applyWorldConfig(this.currentWorld);
        }
    }

    /**
     * Toggle individual effects
     */
    toggleEffect(effectName, enabled) {
        if (!this.passes[effectName]) {
            console.warn(`Effect not found: ${effectName}`);
            return;
        }

        this.passes[effectName].enabled = enabled;
        console.log(`${effectName} ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Start FPS monitoring for adaptive quality
     */
    startPerformanceMonitoring() {
        if (!this.adaptiveQualityEnabled) return;

        let lastTime = performance.now();
        let frames = 0;

        this.fpsMonitorInterval = setInterval(() => {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            const fps = (frames * 1000) / delta;

            this.fpsHistory.push(fps);
            if (this.fpsHistory.length > 10) {
                this.fpsHistory.shift();
            }

            // Calculate average FPS
            const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

            // Adaptive quality adjustment
            if (avgFps < 30 && this.currentQuality !== 'low') {
                console.warn(`⚠️ Low FPS detected (${avgFps.toFixed(1)}), reducing quality`);
                if (this.currentQuality === 'high') {
                    this.setQuality('medium');
                } else if (this.currentQuality === 'medium') {
                    this.setQuality('low');
                }
            } else if (avgFps > 55 && this.currentQuality === 'low') {
                console.log(`✓ Good FPS (${avgFps.toFixed(1)}), increasing quality`);
                this.setQuality('medium');
            }

            lastTime = currentTime;
            frames = 0;
        }, 2000); // Check every 2 seconds

        // Frame counter
        const countFrame = () => {
            frames++;
            requestAnimationFrame(countFrame);
        };
        countFrame();
    }

    /**
     * Update and render
     */
    render(delta) {
        if (!this.enabled) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Update time for animated shaders
        this.time += delta;
        if (this.passes.filmGrain) {
            this.passes.filmGrain.uniforms.time.value = this.time;
        }

        // Render with post-processing
        this.composer.render(delta);
    }

    /**
     * Handle window resize
     */
    onWindowResize(width, height) {
        this.composer.setSize(width, height);

        // Update FXAA resolution
        if (this.passes.fxaa) {
            const pixelRatio = this.renderer.getPixelRatio();
            this.passes.fxaa.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
            this.passes.fxaa.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
        }

        // Update SSAO resolution
        if (this.passes.ssao) {
            this.passes.ssao.setSize(width, height);
        }
    }

    /**
     * Get current state for UI display
     */
    getState() {
        return {
            enabled: this.enabled,
            quality: this.currentQuality,
            world: this.currentWorld,
            effects: {
                bloom: this.passes.bloom?.enabled ?? false,
                ssao: this.passes.ssao?.enabled ?? false,
                fxaa: this.passes.fxaa?.enabled ?? false,
                filmGrain: this.passes.filmGrain?.enabled ?? false,
                vignette: this.passes.vignette?.enabled ?? false
            },
            fps: this.fpsHistory.length > 0
                ? (this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length).toFixed(1)
                : 0
        };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.fpsMonitorInterval) {
            clearInterval(this.fpsMonitorInterval);
        }

        if (this.composer) {
            this.composer.dispose();
        }

        this.passes = {};
        console.log('🗑️ Post-processing disposed');
    }

    /**
     * Enable/disable entire pipeline
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Post-processing ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Enable/disable adaptive quality
     */
    setAdaptiveQuality(enabled) {
        this.adaptiveQualityEnabled = enabled;
        if (enabled) {
            this.startPerformanceMonitoring();
        } else if (this.fpsMonitorInterval) {
            clearInterval(this.fpsMonitorInterval);
        }
    }
}
