/**
 * ========================================
 * CINEMATIC LIGHTING SYSTEM
 * Production-Quality 3-Point Lighting with HDR
 * ========================================
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// ========================================
// CINEMATIC LIGHTING PRESETS
// ========================================
export const LightingPresets = {
    default: {
        name: 'Default Scene',
        exposure: 1.2,
        envMapIntensity: 0.8,
        ambientIntensity: 0.3,
        ambientColor: 0xF5DEB3,
        keyLight: {
            color: 0xFFFAF0,
            intensity: 2.5,
            position: [40, 35, 30],
            elevation: 30
        },
        fillLight: {
            color: 0xFFE5B4,
            intensity: 0.8,
            position: [-30, 20, 20]
        },
        rimLight: {
            color: 0xC8D5E8,
            intensity: 1.2,
            position: [-20, 15, -30]
        },
        accentLights: [
            { color: 0xC41E3A, intensity: 1.5, position: [-10, 5, 0], distance: 30 },
            { color: 0xC41E3A, intensity: 1.5, position: [10, 5, 0], distance: 30 }
        ]
    },
    patrimonio: {
        name: 'Patrimônio Cultural',
        exposure: 1.4,
        envMapIntensity: 1.0,
        ambientIntensity: 0.4,
        ambientColor: 0xFFE4C4,
        keyLight: {
            color: 0xFFF8DC,
            intensity: 3.0,
            position: [50, 40, 40],
            elevation: 35
        },
        fillLight: {
            color: 0xF5DEB3,
            intensity: 1.2,
            position: [-35, 25, 25]
        },
        rimLight: {
            color: 0xD4AF37,
            intensity: 1.5,
            position: [-25, 20, -35]
        },
        areaLights: [
            { color: 0xFFD700, intensity: 2.0, position: [0, 8, -15], width: 10, height: 6 }
        ],
        accentLights: [
            { color: 0xFFD700, intensity: 2.0, position: [-8, 4, 5], distance: 25 },
            { color: 0xDAA520, intensity: 1.8, position: [8, 4, 5], distance: 25 }
        ]
    },
    musica: {
        name: 'Música & Performance',
        exposure: 1.6,
        envMapIntensity: 0.6,
        ambientIntensity: 0.2,
        ambientColor: 0x1A1A2E,
        keyLight: {
            color: 0xFF1493,
            intensity: 3.5,
            position: [30, 50, 20],
            elevation: 45
        },
        fillLight: {
            color: 0x8B00FF,
            intensity: 1.5,
            position: [-40, 30, 15]
        },
        rimLight: {
            color: 0x00FFFF,
            intensity: 2.0,
            position: [-15, 25, -40]
        },
        areaLights: [
            { color: 0xFF1493, intensity: 3.0, position: [0, 10, -20], width: 12, height: 8 },
            { color: 0x8B00FF, intensity: 2.5, position: [0, 5, 20], width: 10, height: 6 }
        ],
        accentLights: [
            { color: 0xFF1493, intensity: 3.0, position: [-12, 6, 0], distance: 35 },
            { color: 0x8B00FF, intensity: 2.8, position: [12, 6, 0], distance: 35 },
            { color: 0x00FFFF, intensity: 2.5, position: [0, 8, -12], distance: 30 }
        ],
        spotlights: [
            { color: 0xFFFFFF, intensity: 4.0, position: [0, 15, 0], target: [0, 0, 0], angle: Math.PI / 6 }
        ]
    },
    ambiente: {
        name: 'Meio Ambiente',
        exposure: 1.3,
        envMapIntensity: 1.2,
        ambientIntensity: 0.5,
        ambientColor: 0xE0F7FA,
        keyLight: {
            color: 0xFFFAFA,
            intensity: 2.8,
            position: [45, 45, 35],
            elevation: 40
        },
        fillLight: {
            color: 0xB0E0E6,
            intensity: 1.4,
            position: [-32, 28, 22]
        },
        rimLight: {
            color: 0x7FFF00,
            intensity: 1.8,
            position: [-22, 18, -32]
        },
        areaLights: [
            { color: 0x87CEEB, intensity: 2.2, position: [0, 12, 0], width: 15, height: 10 }
        ],
        accentLights: [
            { color: 0x00FF7F, intensity: 2.2, position: [-10, 5, 8], distance: 28 },
            { color: 0x32CD32, intensity: 2.0, position: [10, 5, 8], distance: 28 },
            { color: 0x87CEEB, intensity: 1.8, position: [0, 8, -10], distance: 32 }
        ]
    }
};

// ========================================
// CINEMATIC LIGHTING MANAGER
// ========================================
export class CinematicLighting {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;

        // HDR environment
        this.pmremGenerator = null;
        this.envMap = null;

        // Lights
        this.lights = {
            ambient: null,
            key: null,
            fill: null,
            rim: null,
            accents: [],
            areas: [],
            spotlights: []
        };

        this.currentPreset = 'default';
    }

    /**
     * Initialize cinematic lighting system
     */
    async init() {
        console.log('🎬 Initializing cinematic lighting system...');

        // Initialize RectAreaLight uniforms
        RectAreaLightUniformsLib.init();

        // Setup 3-point lighting
        this.setupThreePointLighting();

        // Load HDR environment
        await this.loadHDREnvironment();

        console.log('✅ Cinematic lighting system ready');
    }

    /**
     * Setup 3-point lighting (key, fill, rim)
     */
    setupThreePointLighting() {
        const preset = LightingPresets[this.currentPreset];

        // 1. AMBIENT LIGHT - Base illumination
        this.lights.ambient = new THREE.AmbientLight(
            preset.ambientColor,
            preset.ambientIntensity
        );
        this.scene.add(this.lights.ambient);

        // 2. KEY LIGHT - Main directional light (sun/primary source)
        const keyLight = new THREE.DirectionalLight(
            preset.keyLight.color,
            preset.keyLight.intensity
        );
        keyLight.position.set(...preset.keyLight.position);
        keyLight.castShadow = true;

        // High-quality shadow configuration
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 250;
        keyLight.shadow.camera.left = -60;
        keyLight.shadow.camera.right = 60;
        keyLight.shadow.camera.top = 60;
        keyLight.shadow.camera.bottom = -60;
        keyLight.shadow.bias = -0.0001;
        keyLight.shadow.normalBias = 0.02;

        this.lights.key = keyLight;
        this.scene.add(keyLight);

        // Key light target
        keyLight.target.position.set(0, 0, 0);
        this.scene.add(keyLight.target);

        // 3. FILL LIGHT - Soft secondary light
        const fillLight = new THREE.DirectionalLight(
            preset.fillLight.color,
            preset.fillLight.intensity
        );
        fillLight.position.set(...preset.fillLight.position);
        fillLight.castShadow = false;

        this.lights.fill = fillLight;
        this.scene.add(fillLight);

        // 4. RIM LIGHT - Backlight for depth and separation
        const rimLight = new THREE.DirectionalLight(
            preset.rimLight.color,
            preset.rimLight.intensity
        );
        rimLight.position.set(...preset.rimLight.position);
        rimLight.castShadow = false;

        this.lights.rim = rimLight;
        this.scene.add(rimLight);

        // 5. ACCENT LIGHTS - Brand color highlights
        preset.accentLights.forEach((lightConfig) => {
            const accentLight = new THREE.PointLight(
                lightConfig.color,
                lightConfig.intensity,
                lightConfig.distance
            );
            accentLight.position.set(...lightConfig.position);
            accentLight.decay = 2; // Physically accurate decay

            this.lights.accents.push(accentLight);
            this.scene.add(accentLight);
        });

        console.log('✅ 3-point lighting configured');
    }

    /**
     * Load HDR environment map
     */
    async loadHDREnvironment() {
        console.log('🌐 Loading HDR environment map...');

        try {
            // Initialize PMREM generator
            this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            this.pmremGenerator.compileEquirectangularShader();

            const rgbeLoader = new RGBELoader();

            // HDR sources (try multiple URLs)
            const hdrUrls = [
                'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
                'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/photo_studio_loft_hall_1k.hdr',
                'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr'
            ];

            // Try loading HDR
            let hdrTexture = null;
            for (const url of hdrUrls) {
                try {
                    hdrTexture = await rgbeLoader.loadAsync(url);
                    console.log(`✅ HDR loaded from: ${url}`);
                    break;
                } catch (error) {
                    console.warn(`⚠️ Failed to load HDR from ${url}, trying next...`);
                }
            }

            if (!hdrTexture) {
                console.warn('⚠️ HDR environment map not available, using fallback');
                this.setupFallbackEnvironment();
                return;
            }

            // Generate environment map
            this.envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture;
            hdrTexture.dispose();
            this.pmremGenerator.dispose();

            // Apply to scene
            this.scene.environment = this.envMap;

            // Configure intensity
            const preset = LightingPresets[this.currentPreset];
            this.updateEnvironmentIntensity(preset.envMapIntensity);

            console.log('✅ HDR environment map configured');

        } catch (error) {
            console.error('❌ Error loading HDR environment:', error);
            this.setupFallbackEnvironment();
        }
    }

    /**
     * Fallback environment if HDR fails
     */
    setupFallbackEnvironment() {
        console.log('🔄 Setting up fallback environment...');

        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
        const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);

        this.scene.environment = cubeRenderTarget.texture;
        console.log('✅ Fallback environment configured');
    }

    /**
     * Update environment map intensity for all materials
     */
    updateEnvironmentIntensity(intensity) {
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => {
                        if (mat.envMapIntensity !== undefined) {
                            mat.envMapIntensity = intensity;
                        }
                    });
                } else {
                    if (object.material.envMapIntensity !== undefined) {
                        object.material.envMapIntensity = intensity;
                    }
                }
            }
        });
    }

    /**
     * Transition to world-specific lighting preset
     */
    transitionToPreset(worldName) {
        console.log(`🎨 Transitioning to ${worldName} lighting preset...`);

        const presetName = worldName in LightingPresets ? worldName : 'default';
        const newPreset = LightingPresets[presetName];

        // Remove old dynamic lights
        this.lights.areas.forEach(light => this.scene.remove(light));
        this.lights.areas = [];

        this.lights.spotlights.forEach(light => {
            this.scene.remove(light);
            if (light.target) this.scene.remove(light.target);
        });
        this.lights.spotlights = [];

        this.lights.accents.forEach(light => this.scene.remove(light));
        this.lights.accents = [];

        // Update renderer exposure
        this.renderer.toneMappingExposure = newPreset.exposure;

        // Update ambient light
        this.lights.ambient.color.setHex(newPreset.ambientColor);
        this.lights.ambient.intensity = newPreset.ambientIntensity;

        // Update key light
        this.lights.key.color.setHex(newPreset.keyLight.color);
        this.lights.key.intensity = newPreset.keyLight.intensity;
        this.lights.key.position.set(...newPreset.keyLight.position);

        // Update fill light
        this.lights.fill.color.setHex(newPreset.fillLight.color);
        this.lights.fill.intensity = newPreset.fillLight.intensity;
        this.lights.fill.position.set(...newPreset.fillLight.position);

        // Update rim light
        this.lights.rim.color.setHex(newPreset.rimLight.color);
        this.lights.rim.intensity = newPreset.rimLight.intensity;
        this.lights.rim.position.set(...newPreset.rimLight.position);

        // Add new accent lights
        newPreset.accentLights.forEach((lightConfig) => {
            const accentLight = new THREE.PointLight(
                lightConfig.color,
                lightConfig.intensity,
                lightConfig.distance
            );
            accentLight.position.set(...lightConfig.position);
            accentLight.decay = 2;

            this.lights.accents.push(accentLight);
            this.scene.add(accentLight);
        });

        // Add area lights if specified
        if (newPreset.areaLights) {
            newPreset.areaLights.forEach((lightConfig) => {
                const areaLight = new THREE.RectAreaLight(
                    lightConfig.color,
                    lightConfig.intensity,
                    lightConfig.width,
                    lightConfig.height
                );
                areaLight.position.set(...lightConfig.position);
                areaLight.lookAt(0, 0, 0);

                this.lights.areas.push(areaLight);
                this.scene.add(areaLight);
            });
        }

        // Add spotlights if specified
        if (newPreset.spotlights) {
            newPreset.spotlights.forEach((lightConfig) => {
                const spotlight = new THREE.SpotLight(
                    lightConfig.color,
                    lightConfig.intensity,
                    0, // distance (0 = infinite)
                    lightConfig.angle,
                    0.5, // penumbra
                    2 // decay
                );
                spotlight.position.set(...lightConfig.position);
                spotlight.target.position.set(...lightConfig.target);
                spotlight.castShadow = true;
                spotlight.shadow.mapSize.width = 2048;
                spotlight.shadow.mapSize.height = 2048;

                this.lights.spotlights.push(spotlight);
                this.scene.add(spotlight);
                this.scene.add(spotlight.target);
            });
        }

        // Update environment intensity
        this.updateEnvironmentIntensity(newPreset.envMapIntensity);

        this.currentPreset = presetName;
        console.log(`✅ Lighting preset "${newPreset.name}" applied`);
    }

    /**
     * Get current preset name
     */
    getCurrentPreset() {
        return this.currentPreset;
    }

    /**
     * Get all available presets
     */
    getAvailablePresets() {
        return Object.keys(LightingPresets);
    }
}
