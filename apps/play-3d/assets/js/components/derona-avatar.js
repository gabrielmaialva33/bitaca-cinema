/**
 * ========================================
 * DERONA AVATAR - 3D Character
 * Animated guide for Bitaca Play 3D
 * ========================================
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class DeronaAvatar {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.isVisible = false;
        this.position = new THREE.Vector3(5, 0, 5);
    }

    async load() {
        console.log('👤 Loading Derona avatar...');

        // Create placeholder avatar (geometric character)
        // In production, replace with GLTFLoader for custom model
        return this.createPlaceholderAvatar();
    }

    createPlaceholderAvatar() {
        const group = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xC41E3A,
            roughness: 0.5,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.position.y = 1.2;
        group.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5DEB3,
            roughness: 0.6,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.castShadow = true;
        head.position.y = 2.3;
        group.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x0A0A0A,
            emissive: 0xC41E3A,
            emissiveIntensity: 0.5
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.12, 2.35, 0.25);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.12, 2.35, 0.25);
        group.add(rightEye);

        // Hair (stylized)
        const hairGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            roughness: 0.8
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0, 2.7, 0);
        hair.rotation.y = Math.PI / 4;
        group.add(hair);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(1, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xC41E3A,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 1.5;
        glow.scale.setScalar(1.2);
        group.add(glow);

        this.model = group;
        this.model.position.copy(this.position);
        this.model.visible = false;
        this.scene.add(this.model);

        // Store references for animation
        this.body = body;
        this.head = head;
        this.eyes = [leftEye, rightEye];
        this.glow = glow;

        console.log('✅ Derona avatar created');
        return Promise.resolve();
    }

    show() {
        if (this.model) {
            this.model.visible = true;
            this.isVisible = true;
            this.playAnimation('idle');
        }
    }

    hide() {
        if (this.model) {
            this.model.visible = false;
            this.isVisible = false;
        }
    }

    speak(message) {
        console.log(`💬 Derona says: "${message}"`);

        // Animate speaking
        if (this.head) {
            const speakAnimation = () => {
                this.head.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.05;
            };

            const duration = Math.min(message.length * 50, 3000);
            const endTime = Date.now() + duration;

            const animate = () => {
                if (Date.now() < endTime) {
                    speakAnimation();
                    requestAnimationFrame(animate);
                } else {
                    this.head.scale.y = 1;
                }
            };

            animate();
        }
    }

    playAnimation(name) {
        this.currentAnimation = name;

        switch (name) {
            case 'idle':
                this.animateIdle();
                break;
            case 'wave':
                this.animateWave();
                break;
            case 'think':
                this.animateThink();
                break;
        }
    }

    animateIdle() {
        // Gentle floating animation
        if (!this.model) return;

        const idleAnimation = () => {
            if (this.currentAnimation !== 'idle') return;

            const time = Date.now() * 0.001;
            this.model.position.y = this.position.y + Math.sin(time) * 0.1;
            this.model.rotation.y = Math.sin(time * 0.5) * 0.1;

            if (this.glow) {
                this.glow.scale.setScalar(1.2 + Math.sin(time * 2) * 0.1);
            }

            requestAnimationFrame(idleAnimation);
        };

        idleAnimation();
    }

    animateWave() {
        // Wave hand animation
        console.log('👋 Derona waves');
    }

    animateThink() {
        // Thinking animation
        console.log('🤔 Derona thinks');
    }

    lookAt(target) {
        if (this.head) {
            this.head.lookAt(target);
        }
    }

    update(delta) {
        if (!this.isVisible || !this.model) return;

        // Update animations via mixer if using GLTF
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Make eyes blink occasionally
        if (Math.random() < 0.01) {
            this.blink();
        }
    }

    blink() {
        this.eyes.forEach(eye => {
            eye.scale.y = 0.1;
            setTimeout(() => {
                eye.scale.y = 1;
            }, 100);
        });
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.model) {
            this.model.position.copy(this.position);
        }
    }
}
