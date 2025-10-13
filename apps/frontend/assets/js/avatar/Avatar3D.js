// ===============================================
// BITACA CINEMA - 3D AVATAR COMPONENT
// Stylized 3D avatar with real-time lip-sync
// Stack: Three.js + Web Audio API + NVIDIA TTS
// ===============================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

/**
 * BitacaAvatar3D - Stylized 3D avatar with voice animation
 */
class BitacaAvatar3D {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Avatar parts
        this.avatar = {
            head: null,
            jaw: null,
            leftEye: null,
            rightEye: null,
            body: null,
            leftArm: null,
            rightArm: null
        };

        // Animation state
        this.isSpeaking = false;
        this.mouthOpenness = 0;
        this.targetMouthOpenness = 0;
        this.blinkTimer = 0;
        this.idleAnimationTimer = 0;

        // Audio
        this.audioContext = null;
        this.audioAnalyser = null;
        this.audioSource = null;

        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        console.log('🎬 Initializing Bitaca 3D Avatar...');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a); // Dark background

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controls (orbital camera)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 1.5;

        // Lighting (cinematic)
        this.setupLighting();

        // Create avatar
        this.createAvatar();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();

        console.log('✅ Bitaca 3D Avatar ready!');
    }

    /**
     * Setup horror-style lighting (Bad Parenting aesthetic)
     */
    setupLighting() {
        // Dim key light from above (cold, unsettling)
        const keyLight = new THREE.DirectionalLight(0x9090aa, 0.6);
        keyLight.position.set(2, 8, 3);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        this.scene.add(keyLight);

        // Eerie red rim light (horror accent)
        const rimLight = new THREE.DirectionalLight(0x881111, 0.4);
        rimLight.position.set(-3, 2, -5);
        this.scene.add(rimLight);

        // Dim ambient (dark atmosphere)
        const ambientLight = new THREE.AmbientLight(0x303030, 0.4);
        this.scene.add(ambientLight);

        // Unsettling spotlight from below (horror technique)
        const spotlight = new THREE.SpotLight(0x6666ff, 0.3);
        spotlight.position.set(0, -2, 3);
        spotlight.angle = Math.PI / 4;
        spotlight.penumbra = 0.8;
        spotlight.castShadow = true;
        this.scene.add(spotlight);
    }

    /**
     * Create horror-style avatar (Bad Parenting aesthetic - retro 90s horror)
     */
    createAvatar() {
        const avatarGroup = new THREE.Group();
        avatarGroup.position.y = -0.5;

        // Materials - Flat/cel-shaded for retro 90s PS1 aesthetic
        const skinMaterial = new THREE.MeshToonMaterial({
            color: 0xd4c4b0, // Desaturated pale skin
            flatShading: true
        });

        const darkSkinMaterial = new THREE.MeshToonMaterial({
            color: 0xa89880, // Darker skin tone
            flatShading: true
        });

        const hairMaterial = new THREE.MeshLambertMaterial({
            color: 0x1a1410, // Very dark hair
            flatShading: true
        });

        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000 // Pure black eyes (unsettling)
        });

        const mouthMaterial = new THREE.MeshBasicMaterial({
            color: 0x330000 // Dark red mouth
        });

        const clothesMaterial = new THREE.MeshToonMaterial({
            color: 0x8b1a1a, // Dark, desaturated red
            flatShading: true
        });

        // HEAD - Box geometry for angular PS1-style look
        const headGeometry = new THREE.BoxGeometry(1, 1.2, 0.9);
        this.avatar.head = new THREE.Mesh(headGeometry, skinMaterial);
        this.avatar.head.position.y = 1.5;
        this.avatar.head.castShadow = true;
        avatarGroup.add(this.avatar.head);

        // HAIR - Blocky, angular hair
        const hairGeometry = new THREE.BoxGeometry(1.1, 0.4, 1);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 0.6;
        this.avatar.head.add(hair);

        // Hair sides (for more complete look)
        const hairSideGeometry = new THREE.BoxGeometry(1.1, 0.8, 0.3);
        const hairSide = new THREE.Mesh(hairSideGeometry, hairMaterial);
        hairSide.position.set(0, 0.2, -0.6);
        this.avatar.head.add(hairSide);

        // JAW (lower part of head for animation) - angular box
        const jawGeometry = new THREE.BoxGeometry(0.9, 0.6, 0.8);
        this.avatar.jaw = new THREE.Mesh(jawGeometry, darkSkinMaterial);
        this.avatar.jaw.position.y = -0.7;
        this.avatar.head.add(this.avatar.jaw);

        // MOUTH - dark cavity
        const mouthGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.1, 0.45);
        this.avatar.jaw.add(mouth);

        // EYES - large, unsettling black eyes (Bad Parenting style)
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8); // Low poly

        this.avatar.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.avatar.leftEye.position.set(-0.25, 0.15, 0.46);
        this.avatar.leftEye.scale.set(1, 1.3, 0.6); // Slightly elongated
        this.avatar.head.add(this.avatar.leftEye);

        this.avatar.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.avatar.rightEye.position.set(0.25, 0.15, 0.46);
        this.avatar.rightEye.scale.set(1, 1.3, 0.6); // Slightly elongated
        this.avatar.head.add(this.avatar.rightEye);

        // Tiny white pupils for unsettling effect
        const pupilMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        const pupilGeometry = new THREE.SphereGeometry(0.03, 6, 6);

        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.z = 0.1;
        this.avatar.leftEye.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.z = 0.1;
        this.avatar.rightEye.add(rightPupil);

        // BODY - Angular, blocky torso
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.7);
        this.avatar.body = new THREE.Mesh(bodyGeometry, clothesMaterial);
        this.avatar.body.position.y = 0;
        this.avatar.body.castShadow = true;
        avatarGroup.add(this.avatar.body);

        // ARMS - Simplified, angular arms
        const armGeometry = new THREE.BoxGeometry(0.25, 1.2, 0.25);

        this.avatar.leftArm = new THREE.Mesh(armGeometry, clothesMaterial);
        this.avatar.leftArm.position.set(-0.65, 0.2, 0);
        this.avatar.leftArm.rotation.z = Math.PI / 12;
        this.avatar.leftArm.castShadow = true;
        avatarGroup.add(this.avatar.leftArm);

        this.avatar.rightArm = new THREE.Mesh(armGeometry, clothesMaterial);
        this.avatar.rightArm.position.set(0.65, 0.2, 0);
        this.avatar.rightArm.rotation.z = -Math.PI / 12;
        this.avatar.rightArm.castShadow = true;
        avatarGroup.add(this.avatar.rightArm);

        // Add subtle rotation for unsettling effect
        avatarGroup.rotation.y = 0.05;

        // Add group to scene
        this.scene.add(avatarGroup);

        // Floor (shadow receiver) - darker
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.ShadowMaterial({opacity: 0.6});
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    /**
     * Start speaking animation
     */
    startSpeaking() {
        console.log('🗣️ Avatar started speaking');
        this.isSpeaking = true;
    }

    /**
     * Stop speaking animation
     */
    stopSpeaking() {
        console.log('🤐 Avatar stopped speaking');
        this.isSpeaking = false;
        this.targetMouthOpenness = 0;
    }

    /**
     * Update mouth animation based on audio amplitude
     * @param {number} amplitude - Audio amplitude (0-1)
     */
    updateMouthFromAudio(amplitude) {
        // Map amplitude to mouth openness (0 to 0.3 radians)
        this.targetMouthOpenness = amplitude * 0.3;
    }

    /**
     * Idle animations (breathing, blinking, micro-movements)
     */
    updateIdleAnimation(deltaTime) {
        this.idleAnimationTimer += deltaTime;

        // Breathing animation
        const breathingScale = 1 + Math.sin(this.idleAnimationTimer * 1.5) * 0.02;
        this.avatar.body.scale.y = breathingScale;

        // Head bobbing
        this.avatar.head.position.y = 1.5 + Math.sin(this.idleAnimationTimer * 0.5) * 0.02;

        // Blinking
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 3 + Math.random() * 2) {
            this.blink();
            this.blinkTimer = 0;
        }
    }

    /**
     * Blink animation
     */
    blink() {
        const blinkDuration = 0.1;
        const originalScaleY = this.avatar.leftEye.scale.y;

        // Close eyes
        this.avatar.leftEye.scale.y = 0.1;
        this.avatar.rightEye.scale.y = 0.1;

        // Open eyes after duration
        setTimeout(() => {
            this.avatar.leftEye.scale.y = originalScaleY;
            this.avatar.rightEye.scale.y = originalScaleY;
        }, blinkDuration * 1000);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60 FPS

        // Update mouth animation (smooth interpolation)
        if (this.isSpeaking) {
            this.mouthOpenness += (this.targetMouthOpenness - this.mouthOpenness) * 0.3;

            // Animate jaw
            if (this.avatar.jaw) {
                this.avatar.jaw.rotation.x = this.mouthOpenness;
            }
        } else {
            // Close mouth when not speaking
            this.mouthOpenness += (0 - this.mouthOpenness) * 0.2;
            if (this.avatar.jaw) {
                this.avatar.jaw.rotation.x = this.mouthOpenness;
            }
        }

        // Idle animations
        if (!this.isSpeaking) {
            this.updateIdleAnimation(deltaTime);
        }

        // Update controls
        this.controls.update();

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    /**
     * Play audio with lip-sync
     * @param {ArrayBuffer} audioBuffer - Audio data
     */
    async playAudioWithLipSync(audioBuffer) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        try {
            // Decode audio
            const decodedData = await this.audioContext.decodeAudioData(audioBuffer);

            // Create analyser for real-time audio analysis
            this.audioAnalyser = this.audioContext.createAnalyser();
            this.audioAnalyser.fftSize = 256;

            // Create audio source
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = decodedData;
            this.audioSource.connect(this.audioAnalyser);
            this.audioAnalyser.connect(this.audioContext.destination);

            // Start speaking animation
            this.startSpeaking();

            // Analyze audio and update mouth
            const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
            const analyzeAudio = () => {
                if (!this.isSpeaking) return;

                this.audioAnalyser.getByteFrequencyData(dataArray);

                // Calculate average amplitude (0-255)
                const sum = dataArray.reduce((a, b) => a + b, 0);
                const average = sum / dataArray.length;
                const normalizedAmplitude = average / 255;

                // Update mouth based on amplitude
                this.updateMouthFromAudio(normalizedAmplitude);

                requestAnimationFrame(analyzeAudio);
            };

            // Play audio
            this.audioSource.start(0);
            analyzeAudio();

            // Stop speaking when audio ends
            this.audioSource.onended = () => {
                this.stopSpeaking();
            };

        } catch (error) {
            console.error('❌ Audio playback error:', error);
            this.stopSpeaking();
        }
    }

    /**
     * Speak text using TTS
     * @param {string} text - Text to speak
     */
    async speak(text) {
        console.log('🎤 Avatar speaking:', text.substring(0, 50) + '...');

        try {
            // Call backend TTS endpoint
            const response = await fetch('https://api.abitaca.com.br/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: 'pt-BR',
                    format: 'audio/wav'
                })
            });

            if (!response.ok) {
                throw new Error(`TTS request failed: ${response.status}`);
            }

            const audioBuffer = await response.arrayBuffer();
            await this.playAudioWithLipSync(audioBuffer);

        } catch (error) {
            console.error('❌ TTS error:', error);
            console.log('⚠️ Falling back to Web Speech API...');

            // Fallback to Web Speech API
            this.speakWithWebSpeech(text);
        }
    }

    /**
     * Fallback: Speak using Web Speech API
     * @param {string} text - Text to speak
     */
    speakWithWebSpeech(text) {
        if (!('speechSynthesis' in window)) {
            console.error('❌ Web Speech API not supported');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            this.startSpeaking();
            // Simulate mouth movement
            const interval = setInterval(() => {
                if (!this.isSpeaking) {
                    clearInterval(interval);
                    return;
                }
                this.targetMouthOpenness = Math.random() * 0.2 + 0.1;
            }, 100);
        };

        utterance.onend = () => {
            this.stopSpeaking();
        };

        window.speechSynthesis.speak(utterance);
    }

    /**
     * Destroy avatar and cleanup
     */
    destroy() {
        console.log('🗑️ Destroying Bitaca 3D Avatar');

        // Stop audio
        if (this.audioSource) {
            this.audioSource.stop();
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        // Remove renderer
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }

        // Cleanup scene
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitacaAvatar3D;
}

export default BitacaAvatar3D;
