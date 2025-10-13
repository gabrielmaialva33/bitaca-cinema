/**
 * ========================================
 * PATRIMÔNIO WORLD - Museum/Heritage Theme
 * 3D scene representing cultural heritage
 * ========================================
 */

import * as THREE from 'three';

export class PatrimonioWorld {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.objects = [];
        this.isLoaded = false;
    }

    load() {
        console.log('🏛️ Loading Patrimônio World...');

        this.createEnvironment();
        this.createPortals();
        this.createProductionCards();
        this.createInteractiveElements();

        this.isLoaded = true;
    }

    createEnvironment() {
        // Museum-like environment
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8,
            metalness: 0.1
        });

        // Walls
        const wallGeometry = new THREE.BoxGeometry(50, 10, 1);

        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.position.set(0, 5, -25);
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);
        this.objects.push(frontWall);

        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 5, 25);
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        this.objects.push(backWall);

        // Side walls
        const sideWallGeometry = new THREE.BoxGeometry(1, 10, 50);

        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.set(-25, 5, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        this.objects.push(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.set(25, 5, 0);
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
        this.objects.push(rightWall);

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(50, 50);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5DEB3,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
        this.objects.push(ceiling);

        // Spotlights
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                const spotlight = new THREE.SpotLight(0xF5DEB3, 0.8, 20, Math.PI / 6, 0.5, 1);
                spotlight.position.set(i * 10, 9, j * 10);
                spotlight.target.position.set(i * 10, 0, j * 10);
                spotlight.castShadow = true;
                this.scene.add(spotlight);
                this.scene.add(spotlight.target);
                this.objects.push(spotlight);
            }
        }

        // Decorative pillars
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.6, 10, 16);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            roughness: 0.3,
            metalness: 0.7
        });

        const pillarPositions = [
            [-20, 5, -20],
            [20, 5, -20],
            [-20, 5, 20],
            [20, 5, 20]
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(...pos);
            pillar.castShadow = true;
            this.scene.add(pillar);
            this.objects.push(pillar);

            // Pillar top
            const capGeometry = new THREE.CylinderGeometry(0.7, 0.5, 0.5, 16);
            const cap = new THREE.Mesh(capGeometry, pillarMaterial);
            cap.position.set(pos[0], 10.3, pos[2]);
            this.scene.add(cap);
            this.objects.push(cap);
        });

        console.log('✅ Patrimônio environment created');
    }

    createPortals() {
        // Portal frames to other worlds
        const portalFrameGeometry = new THREE.TorusGeometry(2, 0.2, 16, 100);
        const portalFrameMaterial = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            emissive: 0xC41E3A,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.8
        });

        // Portal to Música World
        const musicaPortal = new THREE.Mesh(portalFrameGeometry, portalFrameMaterial);
        musicaPortal.position.set(-15, 3, 0);
        musicaPortal.rotation.y = Math.PI / 2;
        musicaPortal.userData = {
            interactable: true,
            type: 'portal',
            world: 'musica',
            name: 'Portal para Mundo da Música'
        };
        this.scene.add(musicaPortal);
        this.objects.push(musicaPortal);

        // Portal to Ambiente World
        const ambientePortal = new THREE.Mesh(portalFrameGeometry, portalFrameMaterial);
        ambientePortal.position.set(15, 3, 0);
        ambientePortal.rotation.y = -Math.PI / 2;
        ambientePortal.userData = {
            interactable: true,
            type: 'portal',
            world: 'ambiente',
            name: 'Portal para Mundo do Meio Ambiente'
        };
        this.scene.add(ambientePortal);
        this.objects.push(ambientePortal);

        // Portal inner glow
        const glowGeometry = new THREE.CircleGeometry(1.8, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xC41E3A,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        const musicaGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        musicaGlow.position.copy(musicaPortal.position);
        musicaGlow.rotation.y = Math.PI / 2;
        this.scene.add(musicaGlow);
        this.objects.push(musicaGlow);

        const ambienteGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        ambienteGlow.position.copy(ambientePortal.position);
        ambienteGlow.rotation.y = -Math.PI / 2;
        this.scene.add(ambienteGlow);
        this.objects.push(ambienteGlow);

        console.log('✅ Portals created');
    }

    createProductionCards() {
        // 3D cards representing patrimônio productions
        // These would be populated from the productions data

        const patrimonioProductions = [
            {
                id: 1,
                titulo: 'Memórias da Minha Terra',
                categoria: 'Patrimônio',
                position: [-10, 2, -10]
            },
            {
                id: 2,
                titulo: 'Gastronomia Regional',
                categoria: 'Patrimônio',
                position: [0, 2, -10]
            },
            {
                id: 3,
                titulo: 'Arquitetura Histórica',
                categoria: 'Patrimônio',
                position: [10, 2, -10]
            }
        ];

        patrimonioProductions.forEach(prod => {
            const card = this.createProductionCard(prod);
            this.scene.add(card);
            this.objects.push(card);
        });

        console.log('✅ Production cards created');
    }

    createProductionCard(production) {
        const group = new THREE.Group();

        // Card frame
        const frameGeometry = new THREE.BoxGeometry(3, 4, 0.2);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            roughness: 0.3,
            metalness: 0.8
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.castShadow = true;
        group.add(frame);

        // Card content (would be a texture in production)
        const contentGeometry = new THREE.PlaneGeometry(2.8, 3.8);
        const contentMaterial = new THREE.MeshStandardMaterial({
            color: 0x2A2A2A,
            roughness: 0.7
        });
        const content = new THREE.Mesh(contentGeometry, contentMaterial);
        content.position.z = 0.11;
        group.add(content);

        // Title text (simplified, would use TextGeometry or canvas texture)
        const titleGeometry = new THREE.BoxGeometry(2.5, 0.5, 0.05);
        const titleMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5DEB3,
            emissive: 0xC41E3A,
            emissiveIntensity: 0.3
        });
        const title = new THREE.Mesh(titleGeometry, titleMaterial);
        title.position.set(0, 1.5, 0.15);
        group.add(title);

        // Set position and metadata
        group.position.set(...production.position);
        group.userData = {
            interactable: true,
            type: 'production',
            production: production
        };

        return group;
    }

    createInteractiveElements() {
        // Add interactive pedestals, info points, etc.
        console.log('✅ Interactive elements created');
    }

    update(delta) {
        if (!this.isLoaded) return;

        // Animate portals
        this.objects.forEach(obj => {
            if (obj.userData.type === 'portal') {
                obj.rotation.z += delta * 0.5;
            }
        });
    }

    unload() {
        console.log('🏛️ Unloading Patrimônio World...');

        // Remove all objects from scene
        this.objects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });

        this.objects = [];
        this.isLoaded = false;
    }
}
