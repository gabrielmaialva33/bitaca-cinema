/**
 * Bitaca Cinema - Animezey Catalog Integration
 * 3D catalog powered by Animezey Worker + Telegram streaming
 *
 * Features:
 * - 3D grid layout with animated cards
 * - Smooth scrolling and navigation
 * - Video preview on hover
 * - Fullscreen video player
 * - Animezey Worker proxy for CORS-free streaming
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export class AnimezeyCatalog {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // Animezey Worker URL
        this.animezeyWorker = 'https://animezey16082023.animezey16082023.workers.dev';
        this.streamAPI = 'https://stream-api.abitaca.com.br';

        // Catalog state
        this.productions = [];
        this.catalogCards = [];
        this.selectedCard = null;
        this.hoveredCard = null;

        // Layout settings
        this.gridColumns = 5;
        this.cardWidth = 4;
        this.cardHeight = 6;
        this.cardSpacing = 1;

        // Navigation
        this.scrollOffset = 0;
        this.scrollTarget = 0;
        this.scrollSpeed = 0.1;

        // Video player
        this.videoPlayer = null;
        this.isPlaying = false;

        this.init();
    }

    async init() {
        console.log('🎬 Initializing Animezey Catalog...');

        // Load productions from stream API
        await this.loadProductions();

        // Create 3D catalog cards
        this.createCatalogCards();

        // Setup interaction
        this.setupInteraction();

        // Setup video player
        this.setupVideoPlayer();

        console.log('✅ Animezey Catalog initialized with', this.productions.length, 'productions');
    }

    async loadProductions() {
        try {
            const response = await fetch(`${this.streamAPI}/api/productions?limit=24`);
            const data = await response.json();

            this.productions = data.productions.map((prod, index) => ({
                ...prod,
                // Generate Animezey Worker URL
                streamUrl: this.getAnimezeyStreamUrl(prod.id),
                thumbnailUrl: this.getAnimezeyThumbnailUrl(prod.id),
                position: this.calculateCardPosition(index)
            }));

        } catch (error) {
            console.error('Error loading productions:', error);
            // Fallback: use mock data
            this.productions = this.getMockProductions();
        }
    }

    getAnimezeyStreamUrl(productionId) {
        // Proxy stream through Animezey Worker for CORS-free access
        const streamUrl = `${this.streamAPI}/api/productions/${productionId}/stream`;
        return `${this.animezeyWorker}/proxy?url=${encodeURIComponent(streamUrl)}`;
    }

    getAnimezeyThumbnailUrl(productionId) {
        const thumbUrl = `${this.streamAPI}/api/productions/${productionId}/thumbnail`;
        return `${this.animezeyWorker}/proxy?url=${encodeURIComponent(thumbUrl)}`;
    }

    calculateCardPosition(index) {
        const row = Math.floor(index / this.gridColumns);
        const col = index % this.gridColumns;

        const totalWidth = this.gridColumns * (this.cardWidth + this.cardSpacing);
        const startX = -totalWidth / 2 + this.cardWidth / 2;

        return new THREE.Vector3(
            startX + col * (this.cardWidth + this.cardSpacing),
            -row * (this.cardHeight + this.cardSpacing),
            0
        );
    }

    createCatalogCards() {
        const catalogGroup = new THREE.Group();
        catalogGroup.name = 'catalogGroup';

        this.productions.forEach((production, index) => {
            const card = this.createProductionCard(production, index);
            this.catalogCards.push(card);
            catalogGroup.add(card);
        });

        this.scene.add(catalogGroup);

        // Animate cards entrance
        this.animateCardsEntrance();
    }

    createProductionCard(production, index) {
        const cardGroup = new THREE.Group();
        cardGroup.userData = {
            production,
            index,
            isHovered: false,
            originalPosition: production.position.clone()
        };

        // Card background
        const cardGeometry = new THREE.PlaneGeometry(this.cardWidth, this.cardHeight);
        const cardMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            emissive: 0x0a0a0a,
            roughness: 0.5,
            metalness: 0.1
        });

        const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
        cardGroup.add(cardMesh);

        // Border
        const borderGeometry = new THREE.EdgesGeometry(cardGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({
            color: 0xC41E3A,
            linewidth: 2
        });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        cardGroup.add(border);

        // Thumbnail (will be loaded async)
        this.loadCardThumbnail(cardGroup, production);

        // Title text (using sprite)
        const titleSprite = this.createTextSprite(production.title, 32);
        titleSprite.position.set(0, -this.cardHeight / 2 + 0.5, 0.1);
        titleSprite.scale.set(3, 1, 1);
        cardGroup.add(titleSprite);

        // Genre badge
        const genreSprite = this.createTextSprite(production.genre, 16);
        genreSprite.position.set(0, this.cardHeight / 2 - 0.5, 0.1);
        genreSprite.scale.set(2, 0.5, 1);
        cardGroup.add(genreSprite);

        // Score indicator
        const scoreGeometry = new THREE.CircleGeometry(0.4, 32);
        const scoreMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFB700,
            transparent: true,
            opacity: 0.9
        });
        const scoreMesh = new THREE.Mesh(scoreGeometry, scoreMaterial);
        scoreMesh.position.set(this.cardWidth / 2 - 0.6, this.cardHeight / 2 - 0.6, 0.2);
        cardGroup.add(scoreMesh);

        const scoreText = this.createTextSprite(production.score.toString(), 20);
        scoreText.position.copy(scoreMesh.position);
        scoreText.position.z += 0.1;
        scoreText.scale.set(0.8, 0.4, 1);
        cardGroup.add(scoreText);

        // Set initial position
        cardGroup.position.copy(production.position);

        // Initially hidden for entrance animation
        cardGroup.scale.set(0.01, 0.01, 0.01);
        cardGroup.visible = false;

        return cardGroup;
    }

    async loadCardThumbnail(cardGroup, production) {
        try {
            const textureLoader = new THREE.TextureLoader();
            const texture = await textureLoader.loadAsync(production.thumbnailUrl);

            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            // Update card material with thumbnail
            const cardMesh = cardGroup.children.find(c => c.type === 'Mesh');
            if (cardMesh) {
                cardMesh.material.map = texture;
                cardMesh.material.needsUpdate = true;
            }

        } catch (error) {
            console.warn(`Failed to load thumbnail for ${production.title}:`, error);
            // Keep default color
        }
    }

    createTextSprite(text, fontSize = 32) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = 512;
        canvas.height = 128;

        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        context.fillStyle = '#F5DEB3';
        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Truncate long text
        const maxWidth = canvas.width - 20;
        let displayText = text;
        while (context.measureText(displayText).width > maxWidth && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
        }
        if (displayText !== text) displayText += '...';

        context.fillText(displayText, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        return sprite;
    }

    animateCardsEntrance() {
        this.catalogCards.forEach((card, index) => {
            card.visible = true;

            gsap.to(card.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.6,
                delay: index * 0.05,
                ease: 'back.out(1.7)'
            });

            gsap.from(card.position, {
                z: -10,
                duration: 0.8,
                delay: index * 0.05,
                ease: 'power3.out'
            });
        });
    }

    setupInteraction() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => this.onMouseMove(event));
        window.addEventListener('click', (event) => this.onMouseClick(event));
        window.addEventListener('wheel', (event) => this.onMouseWheel(event));
    }

    onMouseMove(event) {
        // Update mouse position
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to find hovered card
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.catalogCards, true);

        // Reset previous hover
        if (this.hoveredCard && !intersects.length) {
            this.unhoverCard(this.hoveredCard);
            this.hoveredCard = null;
        }

        // Apply hover to new card
        if (intersects.length > 0) {
            const cardGroup = intersects[0].object.parent;
            if (cardGroup !== this.hoveredCard) {
                if (this.hoveredCard) this.unhoverCard(this.hoveredCard);
                this.hoverCard(cardGroup);
                this.hoveredCard = cardGroup;
            }
        }
    }

    hoverCard(cardGroup) {
        if (!cardGroup.userData) return;

        cardGroup.userData.isHovered = true;

        // Scale up animation
        gsap.to(cardGroup.scale, {
            x: 1.1,
            y: 1.1,
            z: 1.1,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Move forward
        gsap.to(cardGroup.position, {
            z: 1,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Glow effect
        const cardMesh = cardGroup.children.find(c => c.type === 'Mesh');
        if (cardMesh) {
            gsap.to(cardMesh.material.emissive, {
                r: 0.3,
                g: 0.1,
                b: 0.1,
                duration: 0.3
            });
        }

        // Change cursor
        document.body.style.cursor = 'pointer';

        // Show video preview after 500ms
        this.previewTimeout = setTimeout(() => {
            if (cardGroup.userData.isHovered) {
                this.showVideoPreview(cardGroup.userData.production);
            }
        }, 500);
    }

    unhoverCard(cardGroup) {
        if (!cardGroup.userData) return;

        cardGroup.userData.isHovered = false;
        clearTimeout(this.previewTimeout);

        // Reset scale
        gsap.to(cardGroup.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Reset position
        gsap.to(cardGroup.position, {
            z: cardGroup.userData.originalPosition.z,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Reset glow
        const cardMesh = cardGroup.children.find(c => c.type === 'Mesh');
        if (cardMesh) {
            gsap.to(cardMesh.material.emissive, {
                r: 0.04,
                g: 0.04,
                b: 0.04,
                duration: 0.3
            });
        }

        // Reset cursor
        document.body.style.cursor = 'default';

        // Hide video preview
        this.hideVideoPreview();
    }

    onMouseClick(event) {
        if (this.hoveredCard) {
            const production = this.hoveredCard.userData.production;
            this.openFullscreenPlayer(production);
        }
    }

    onMouseWheel(event) {
        // Smooth scrolling
        const delta = event.deltaY * 0.001;
        this.scrollTarget += delta;

        // Clamp scroll
        const maxScroll = Math.max(0, (Math.ceil(this.productions.length / this.gridColumns) - 3) * (this.cardHeight + this.cardSpacing));
        this.scrollTarget = Math.max(0, Math.min(this.scrollTarget, maxScroll));
    }

    showVideoPreview(production) {
        // Create small preview window in bottom right
        const previewDiv = document.getElementById('video-preview') || this.createPreviewDiv();

        const previewVideo = document.getElementById('preview-video');
        previewVideo.src = production.streamUrl;
        previewVideo.muted = true;
        previewVideo.loop = true;
        previewVideo.play().catch(console.error);

        previewDiv.style.display = 'block';
        gsap.from(previewDiv, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            ease: 'power2.out'
        });
    }

    hideVideoPreview() {
        const previewDiv = document.getElementById('video-preview');
        if (previewDiv) {
            gsap.to(previewDiv, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                onComplete: () => {
                    previewDiv.style.display = 'none';
                    const video = document.getElementById('preview-video');
                    video.pause();
                    video.src = '';
                }
            });
        }
    }

    createPreviewDiv() {
        const div = document.createElement('div');
        div.id = 'video-preview';
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            height: 180px;
            background: #000;
            border: 3px solid #C41E3A;
            border-radius: 12px;
            overflow: hidden;
            z-index: 9999;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
            display: none;
        `;

        const video = document.createElement('video');
        video.id = 'preview-video';
        video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

        div.appendChild(video);
        document.body.appendChild(div);

        return div;
    }

    setupVideoPlayer() {
        // Create fullscreen video player overlay
        const playerHTML = `
            <div id="fullscreen-player" class="fullscreen-player" style="display: none;">
                <div class="player-overlay"></div>
                <div class="player-container">
                    <button class="player-close" id="close-player">
                        <i class="ki-filled ki-cross"></i>
                    </button>
                    <video id="fullscreen-video" class="player-video" controls></video>
                    <div class="player-info">
                        <h2 id="player-title"></h2>
                        <p id="player-description"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', playerHTML);

        document.getElementById('close-player').addEventListener('click', () => {
            this.closeFullscreenPlayer();
        });

        this.injectPlayerStyles();
    }

    openFullscreenPlayer(production) {
        console.log('🎬 Opening player for:', production.title);

        const player = document.getElementById('fullscreen-player');
        const video = document.getElementById('fullscreen-video');
        const title = document.getElementById('player-title');
        const description = document.getElementById('player-description');

        // Set content
        video.src = production.streamUrl;
        title.textContent = production.title;
        description.textContent = production.synopsis || `Dirigido por ${production.director}`;

        // Show player
        player.style.display = 'flex';
        gsap.from(player, {
            opacity: 0,
            duration: 0.3
        });

        // Play video
        video.play().catch(console.error);

        this.isPlaying = true;
    }

    closeFullscreenPlayer() {
        const player = document.getElementById('fullscreen-player');
        const video = document.getElementById('fullscreen-video');

        gsap.to(player, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
                player.style.display = 'none';
                video.pause();
                video.src = '';
                this.isPlaying = false;
            }
        });
    }

    update(delta) {
        if (!this.catalogCards.length) return;

        // Smooth scroll
        this.scrollOffset += (this.scrollTarget - this.scrollOffset) * this.scrollSpeed;

        // Update catalog group position
        const catalogGroup = this.scene.getObjectByName('catalogGroup');
        if (catalogGroup) {
            catalogGroup.position.y = this.scrollOffset;
        }
    }

    injectPlayerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .fullscreen-player {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .player-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
            }

            .player-container {
                position: relative;
                width: 90%;
                max-width: 1200px;
                z-index: 1;
            }

            .player-close {
                position: absolute;
                top: -50px;
                right: 0;
                background: #C41E3A;
                color: #F5DEB3;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 20px;
                transition: transform 0.2s;
            }

            .player-close:hover {
                transform: scale(1.1);
            }

            .player-video {
                width: 100%;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(196, 30, 58, 0.5);
            }

            .player-info {
                margin-top: 1rem;
                color: #F5DEB3;
            }

            .player-info h2 {
                font-size: 2rem;
                margin: 0 0 0.5rem 0;
            }

            .player-info p {
                font-size: 1.1rem;
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }

    getMockProductions() {
        // Fallback mock data if API fails
        return Array.from({ length: 24 }, (_, i) => ({
            id: i + 1,
            title: `Produção ${i + 1}`,
            director: `Diretor ${i + 1}`,
            genre: ['Documentário', 'Videoclipe', 'Curta'][i % 3],
            score: 150 + i * 5,
            synopsis: 'Produção audiovisual em desenvolvimento.',
            streamUrl: this.getAnimezeyStreamUrl(i + 1),
            thumbnailUrl: this.getAnimezeyThumbnailUrl(i + 1),
            position: this.calculateCardPosition(i)
        }));
    }

    dispose() {
        // Cleanup
        this.catalogCards.forEach(card => {
            card.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });

        this.catalogCards = [];
    }
}

export default AnimezeyCatalog;
