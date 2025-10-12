// ===============================================
// BITACA CINEMA - 3D AVATAR COMPONENT
// Stylized 3D avatar with real-time lip-sync
// Stack: Three.js + Web Audio API + NVIDIA TTS
// ===============================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

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
     * Setup cinematic lighting
     */
    setupLighting() {
        // Key light (main light - warm)
        const keyLight = new THREE.DirectionalLight(0xffd4a3, 1.2);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        // Fill light (softer - cool)
        const fillLight = new THREE.DirectionalLight(0xa3c7ff, 0.5);
        fillLight.position.set(-5, 5, 5);
        this.scene.add(fillLight);

        // Back light (rim light)
        const backLight = new THREE.DirectionalLight(0xff5555, 0.3);
        backLight.position.set(0, 5, -5);
        this.scene.add(backLight);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Spotlight for dramatic effect
        const spotlight = new THREE.SpotLight(0xff3333, 0.5);
        spotlight.position.set(0, 10, 0);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.3;
        spotlight.castShadow = true;
        this.scene.add(spotlight);
    }

    /**
     * Create stylized avatar (geometric shapes)
     */
    createAvatar() {
        const avatarGroup = new THREE.Group();
        avatarGroup.position.y = -0.5;

        // Materials
        const skinMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            shininess: 10
        });

        const hairMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a1810,
            shininess: 30
        });

        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 100
        });

        const clothesMaterial = new THREE.MeshPhongMaterial({
            color: 0xc41e3a, // Bitaca red
            shininess: 20
        });

        // HEAD
        const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        this.avatar.head = new THREE.Mesh(headGeometry, skinMaterial);
        this.avatar.head.position.y = 1.5;
        this.avatar.head.castShadow = true;
        avatarGroup.add(this.avatar.head);

        // HAIR (top sphere)
        const hairGeometry = new THREE.SphereGeometry(0.85, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 0.3;
        this.avatar.head.add(hair);

        // JAW (lower part of head for animation)
        const jawGeometry = new THREE.SphereGeometry(0.6, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        this.avatar.jaw = new THREE.Mesh(jawGeometry, skinMaterial);
        this.avatar.jaw.position.y = -0.3;
        this.avatar.head.add(this.avatar.jaw);

        // EYES
        const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);

        this.avatar.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.avatar.leftEye.position.set(-0.25, 0.1, 0.6);
        this.avatar.head.add(this.avatar.leftEye);

        this.avatar.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.avatar.rightEye.position.set(0.25, 0.1, 0.6);
        this.avatar.head.add(this.avatar.rightEye);

        // BODY
        const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 32);
        this.avatar.body = new THREE.Mesh(bodyGeometry, clothesMaterial);
        this.avatar.body.position.y = 0;
        this.avatar.body.castShadow = true;
        avatarGroup.add(this.avatar.body);

        // ARMS
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.12, 1.2, 16);

        this.avatar.leftArm = new THREE.Mesh(armGeometry, clothesMaterial);
        this.avatar.leftArm.position.set(-0.75, 0.2, 0);
        this.avatar.leftArm.rotation.z = Math.PI / 8;
        this.avatar.leftArm.castShadow = true;
        avatarGroup.add(this.avatar.leftArm);

        this.avatar.rightArm = new THREE.Mesh(armGeometry, clothesMaterial);
        this.avatar.rightArm.position.set(0.75, 0.2, 0);
        this.avatar.rightArm.rotation.z = -Math.PI / 8;
        this.avatar.rightArm.castShadow = true;
        avatarGroup.add(this.avatar.rightArm);

        // Add group to scene
        this.scene.add(avatarGroup);

        // Floor (shadow receiver)
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
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
