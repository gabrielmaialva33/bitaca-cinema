/**
 * Bitaca Play - Main Application
 * Modern streaming interface with Animezey Worker integration
 */

import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm';

class BitacaPlay {
    constructor() {
        // API Configuration
        this.streamAPI = 'https://stream-api.abitaca.com.br';
        this.animezeyWorker = 'https://animezey16082023.animezey16082023.workers.dev';

        // State
        this.productions = [];
        this.currentProduction = null;
        this.isPlaying = false;
        this.continueWatching = [];

        // Elements
        this.elements = {
            heroBanner: document.getElementById('hero-banner'),
            searchOverlay: document.getElementById('search-overlay'),
            searchInput: document.getElementById('search-input'),
            searchResults: document.getElementById('search-results'),
            playerModal: document.getElementById('player-modal'),
            playerVideo: document.getElementById('player-video'),
            navbar: document.querySelector('.navbar'),
            loadingSpinner: document.getElementById('loading-spinner')
        };

        this.init();
    }

    async init() {
        console.log('🎬 Initializing Bitaca Play...');

        // Show loading
        this.showLoading();

        // Load productions
        await this.loadProductions();

        // Setup UI
        this.setupEventListeners();
        this.setupHeroBanner();
        this.renderFeaturedGrid();
        this.renderCarousels();
        this.setupScrollEffects();

        // Hide loading
        this.hideLoading();

        // Load continue watching from localStorage
        this.loadContinueWatching();

        console.log('✅ Bitaca Play initialized');
    }

    async loadProductions() {
        try {
            const response = await fetch(`${this.streamAPI}/api/productions?limit=24`);
            const data = await response.json();

            this.productions = data.productions.map(prod => ({
                ...prod,
                streamUrl: this.getAnimezeyStreamUrl(prod.id),
                thumbnailUrl: this.getThumbnailUrl(prod.id),
                theme: this.getTheme(prod.genre)
            }));

            console.log(`📚 Loaded ${this.productions.length} productions`);

        } catch (error) {
            console.error('Error loading productions:', error);
            this.showToast('Erro ao carregar produções. Usando dados locais.', 'error');
            this.productions = this.getMockProductions();
        }
    }

    getAnimezeyStreamUrl(productionId) {
        const streamUrl = `${this.streamAPI}/api/productions/${productionId}/stream`;
        return `${this.animezeyWorker}/proxy?url=${encodeURIComponent(streamUrl)}`;
    }

    getThumbnailUrl(productionId) {
        // Use placeholder for now
        return `https://via.placeholder.com/400x225/1a1a1a/C41E3A?text=Produção+${productionId}`;
    }

    getTheme(genre) {
        const lowerGenre = genre.toLowerCase();
        if (lowerGenre.includes('documentário') && lowerGenre.includes('etnográfico')) return 'patrimonio';
        if (lowerGenre.includes('música') || lowerGenre.includes('musical')) return 'musica';
        if (lowerGenre.includes('ambiental') || lowerGenre.includes('urbano')) return 'ambiente';
        if (lowerGenre.includes('patrimônio')) return 'patrimonio';
        return 'other';
    }

    setupEventListeners() {
        // Search
        document.getElementById('search-btn')?.addEventListener('click', () => this.openSearch());
        document.getElementById('search-close')?.addEventListener('click', () => this.closeSearch());
        this.elements.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // 3D Mode button
        document.getElementById('3d-btn')?.addEventListener('click', () => {
            window.location.href = 'https://play-3d.abitaca.com.br';
        });

        // Menu toggle (mobile)
        document.getElementById('menu-toggle')?.addEventListener('click', () => this.toggleMobileMenu());

        // Hero buttons
        document.getElementById('hero-play-btn')?.addEventListener('click', () => {
            if (this.productions.length > 0) {
                this.openPlayer(this.productions[0]);
            }
        });

        // Player controls
        document.getElementById('player-close')?.addEventListener('click', () => this.closePlayer());
        document.getElementById('player-overlay')?.addEventListener('click', () => this.closePlayer());
        document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlayPause());
        document.getElementById('backward-btn')?.addEventListener('click', () => this.skipBackward());
        document.getElementById('forward-btn')?.addEventListener('click', () => this.skipForward());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Navbar scroll effect
        window.addEventListener('scroll', () => this.handleScroll());
    }

    setupHeroBanner() {
        if (!this.elements.heroBanner || this.productions.length === 0) return;

        // Set hero banner to feature a production
        const featured = this.productions[0];
        this.elements.heroBanner.style.backgroundImage = `
            linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 10, 10, 0.8) 50%, rgba(10, 10, 10, 0.95) 100%),
            url('${featured.thumbnailUrl}')
        `;

        // Animate hero content
        gsap.from('.hero-title', { opacity: 0, y: 50, duration: 1, delay: 0.3 });
        gsap.from('.hero-subtitle', { opacity: 0, y: 30, duration: 1, delay: 0.5 });
        gsap.from('.hero-actions', { opacity: 0, y: 30, duration: 1, delay: 0.7 });
        gsap.from('.hero-stats', { opacity: 0, y: 30, duration: 1, delay: 0.9 });
    }

    renderFeaturedGrid() {
        const grid = document.getElementById('featured-grid');
        if (!grid) return;

        // Get top 12 productions
        const featured = this.productions.slice(0, 12);

        grid.innerHTML = featured.map(prod => this.createProductionCard(prod)).join('');

        // Add click listeners
        grid.querySelectorAll('.production-card').forEach(card => {
            card.addEventListener('click', () => {
                const prodId = parseInt(card.dataset.id);
                const production = this.productions.find(p => p.id === prodId);
                if (production) this.openPlayer(production);
            });
        });

        // Animate cards
        gsap.from('.production-card', {
            opacity: 0,
            y: 50,
            stagger: 0.05,
            duration: 0.6,
            ease: 'power2.out'
        });
    }

    renderCarousels() {
        // Patrimônio carousel
        this.renderCarousel('patrimonio-carousel', this.productions.filter(p => p.theme === 'patrimonio'));

        // Música carousel
        this.renderCarousel('musica-carousel', this.productions.filter(p => p.theme === 'musica'));

        // Ambiente carousel
        this.renderCarousel('ambiente-carousel', this.productions.filter(p => p.theme === 'ambiente'));

        // Top rated carousel
        const topRated = [...this.productions].sort((a, b) => b.score - a.score).slice(0, 8);
        this.renderCarousel('toprated-carousel', topRated);
    }

    renderCarousel(containerId, productions) {
        const container = document.getElementById(containerId);
        if (!container || productions.length === 0) return;

        const track = document.createElement('div');
        track.className = 'carousel-track';

        track.innerHTML = productions.map(prod => this.createProductionCard(prod)).join('');

        container.innerHTML = '';
        container.appendChild(track);

        // Add click listeners
        track.querySelectorAll('.production-card').forEach(card => {
            card.addEventListener('click', () => {
                const prodId = parseInt(card.dataset.id);
                const production = this.productions.find(p => p.id === prodId);
                if (production) this.openPlayer(production);
            });
        });
    }

    createProductionCard(production) {
        const template = document.getElementById('production-card-template');
        if (!template) {
            // Fallback if template doesn't exist
            return `
                <div class="production-card" data-id="${production.id}">
                    <div class="card-image">
                        <img src="${production.thumbnailUrl}" alt="${production.title}" class="card-thumbnail">
                        <div class="card-overlay">
                            <button class="card-play-btn">
                                <i class="ki-filled ki-play-circle"></i>
                            </button>
                        </div>
                        <div class="card-badge">${production.status}</div>
                        <div class="card-score">${production.score}</div>
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${production.title}</h3>
                        <p class="card-meta">
                            <span class="card-director">${production.director}</span>
                        </p>
                    </div>
                </div>
            `;
        }

        const card = template.content.cloneNode(true);
        const cardEl = card.querySelector('.production-card');

        cardEl.dataset.id = production.id;
        card.querySelector('.card-thumbnail').src = production.thumbnailUrl;
        card.querySelector('.card-thumbnail').alt = production.title;
        card.querySelector('.card-badge').textContent = production.status;
        card.querySelector('.card-score').textContent = production.score;
        card.querySelector('.card-title').textContent = production.title;
        card.querySelector('.card-director').textContent = production.director;

        return cardEl.outerHTML;
    }

    handleFilter(filter) {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Filter productions
        let filtered = this.productions;

        if (filter === 'documentary') {
            filtered = this.productions.filter(p => p.genre.toLowerCase().includes('documentário'));
        } else if (filter === 'videoclipe') {
            filtered = this.productions.filter(p => p.genre.toLowerCase().includes('videoclipe') || p.genre.toLowerCase().includes('clipe'));
        } else if (filter === 'short') {
            filtered = this.productions.filter(p => p.genre.toLowerCase().includes('curta'));
        }

        // Re-render grid
        const grid = document.getElementById('featured-grid');
        if (grid) {
            grid.innerHTML = filtered.slice(0, 12).map(prod => this.createProductionCard(prod)).join('');

            // Re-add click listeners
            grid.querySelectorAll('.production-card').forEach(card => {
                card.addEventListener('click', () => {
                    const prodId = parseInt(card.dataset.id);
                    const production = this.productions.find(p => p.id === prodId);
                    if (production) this.openPlayer(production);
                });
            });

            // Animate
            gsap.from('.production-card', {
                opacity: 0,
                scale: 0.9,
                stagger: 0.03,
                duration: 0.4
            });
        }
    }

    openSearch() {
        this.elements.searchOverlay.classList.add('active');
        this.elements.searchInput.focus();
        gsap.from(this.elements.searchOverlay, { opacity: 0, duration: 0.3 });
    }

    closeSearch() {
        gsap.to(this.elements.searchOverlay, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
                this.elements.searchOverlay.classList.remove('active');
                this.elements.searchInput.value = '';
                this.elements.searchResults.innerHTML = '';
            }
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.elements.searchResults.innerHTML = '';
            return;
        }

        const results = this.productions.filter(prod =>
            prod.title.toLowerCase().includes(query.toLowerCase()) ||
            prod.director.toLowerCase().includes(query.toLowerCase()) ||
            prod.genre.toLowerCase().includes(query.toLowerCase())
        );

        this.elements.searchResults.innerHTML = results.map(prod => this.createProductionCard(prod)).join('');

        // Add click listeners
        this.elements.searchResults.querySelectorAll('.production-card').forEach(card => {
            card.addEventListener('click', () => {
                const prodId = parseInt(card.dataset.id);
                const production = this.productions.find(p => p.id === prodId);
                if (production) {
                    this.closeSearch();
                    this.openPlayer(production);
                }
            });
        });
    }

    openPlayer(production) {
        console.log('🎬 Opening player for:', production.title);

        this.currentProduction = production;
        this.elements.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Set video source
        this.elements.playerVideo.src = production.streamUrl;

        // Set info
        document.getElementById('player-title').textContent = production.title;
        document.getElementById('player-director').textContent = `Dir: ${production.director}`;
        document.getElementById('player-genre').textContent = production.genre;
        document.getElementById('player-duration').textContent = production.duration || '15 min';
        document.getElementById('player-synopsis').textContent = production.synopsis || 'Sinopse em breve...';

        // Load related productions
        this.loadRelatedProductions(production);

        // Play video
        this.elements.playerVideo.play().catch(err => {
            console.error('Error playing video:', err);
            this.showToast('Erro ao carregar vídeo. Tente novamente.', 'error');
        });

        this.isPlaying = true;

        // Track view
        this.trackView(production);

        // Animate modal
        gsap.from(this.elements.playerModal, { opacity: 0, duration: 0.3 });
    }

    closePlayer() {
        gsap.to(this.elements.playerModal, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
                this.elements.playerModal.classList.remove('active');
                this.elements.playerVideo.pause();
                this.elements.playerVideo.src = '';
                document.body.style.overflow = '';
                this.isPlaying = false;
            }
        });
    }

    togglePlayPause() {
        if (this.elements.playerVideo.paused) {
            this.elements.playerVideo.play();
            document.querySelector('#play-pause-btn i').className = 'ki-filled ki-pause';
        } else {
            this.elements.playerVideo.pause();
            document.querySelector('#play-pause-btn i').className = 'ki-filled ki-play';
        }
    }

    skipBackward() {
        this.elements.playerVideo.currentTime = Math.max(0, this.elements.playerVideo.currentTime - 10);
    }

    skipForward() {
        this.elements.playerVideo.currentTime = Math.min(
            this.elements.playerVideo.duration,
            this.elements.playerVideo.currentTime + 10
        );
    }

    loadRelatedProductions(production) {
        const related = this.productions
            .filter(p => p.id !== production.id && p.theme === production.theme)
            .slice(0, 6);

        const relatedGrid = document.getElementById('related-grid');
        if (relatedGrid) {
            relatedGrid.innerHTML = related.map(prod => this.createProductionCard(prod)).join('');

            relatedGrid.querySelectorAll('.production-card').forEach(card => {
                card.addEventListener('click', () => {
                    const prodId = parseInt(card.dataset.id);
                    const nextProduction = this.productions.find(p => p.id === prodId);
                    if (nextProduction) {
                        this.closePlayer();
                        setTimeout(() => this.openPlayer(nextProduction), 300);
                    }
                });
            });
        }
    }

    trackView(production) {
        // Add to continue watching
        const continueItem = {
            id: production.id,
            title: production.title,
            thumbnailUrl: production.thumbnailUrl,
            timestamp: Date.now()
        };

        this.continueWatching = this.continueWatching.filter(item => item.id !== production.id);
        this.continueWatching.unshift(continueItem);
        this.continueWatching = this.continueWatching.slice(0, 8);

        localStorage.setItem('bitaca_continue_watching', JSON.stringify(this.continueWatching));

        // Send analytics to backend
        fetch(`${this.streamAPI}/api/analytics/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                production_id: production.id,
                viewer_id: this.getViewerId(),
                duration_seconds: 0,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.warn('Analytics tracking failed:', err));
    }

    loadContinueWatching() {
        const stored = localStorage.getItem('bitaca_continue_watching');
        if (!stored) return;

        try {
            this.continueWatching = JSON.parse(stored);
            if (this.continueWatching.length > 0) {
                this.renderContinueWatchingCarousel();
            }
        } catch (e) {
            console.error('Error loading continue watching:', e);
        }
    }

    renderContinueWatchingCarousel() {
        const section = document.getElementById('continue-watching');
        if (!section) return;

        section.style.display = 'block';

        const carousel = document.getElementById('continue-carousel');
        const track = document.createElement('div');
        track.className = 'carousel-track';

        track.innerHTML = this.continueWatching.map(item => {
            const production = this.productions.find(p => p.id === item.id);
            return production ? this.createProductionCard(production) : '';
        }).filter(Boolean).join('');

        carousel.innerHTML = '';
        carousel.appendChild(track);

        // Add click listeners
        track.querySelectorAll('.production-card').forEach(card => {
            card.addEventListener('click', () => {
                const prodId = parseInt(card.dataset.id);
                const production = this.productions.find(p => p.id === prodId);
                if (production) this.openPlayer(production);
            });
        });
    }

    getViewerId() {
        let viewerId = localStorage.getItem('bitaca_viewer_id');
        if (!viewerId) {
            viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('bitaca_viewer_id', viewerId);
        }
        return viewerId;
    }

    handleKeyboard(e) {
        if (!this.isPlaying) return;

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                this.skipBackward();
                break;
            case 'ArrowRight':
                this.skipForward();
                break;
            case 'Escape':
                this.closePlayer();
                break;
            case 'f':
                if (this.elements.playerVideo.requestFullscreen) {
                    this.elements.playerVideo.requestFullscreen();
                }
                break;
        }
    }

    handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 100) {
            this.elements.navbar.classList.add('scrolled');
        } else {
            this.elements.navbar.classList.remove('scrolled');
        }
    }

    setupScrollEffects() {
        // Parallax effect on hero
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (this.elements.heroBanner) {
                this.elements.heroBanner.style.transform = `translateY(${scrollY * 0.5}px)`;
            }
        });
    }

    toggleMobileMenu() {
        const menu = document.querySelector('.navbar-menu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    showLoading() {
        this.elements.loadingSpinner.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingSpinner.classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        gsap.from(toast, { opacity: 0, y: 50, duration: 0.3 });

        setTimeout(() => {
            gsap.to(toast, {
                opacity: 0,
                y: -50,
                duration: 0.3,
                onComplete: () => toast.remove()
            });
        }, 3000);
    }

    getMockProductions() {
        // Fallback mock data
        return Array.from({ length: 24 }, (_, i) => ({
            id: i + 1,
            title: `Produção ${i + 1}`,
            director: `Diretor ${i + 1}`,
            genre: ['Documentário', 'Videoclipe', 'Curta'][i % 3],
            duration: '15 min',
            score: 150 + i * 5,
            status: 'Em Produção',
            synopsis: 'Produção audiovisual em desenvolvimento.',
            streamUrl: `${this.animezeyWorker}/mock-stream-${i + 1}`,
            thumbnailUrl: `https://via.placeholder.com/400x225/1a1a1a/C41E3A?text=Produção+${i + 1}`,
            theme: ['patrimonio', 'musica', 'ambiente'][i % 3]
        }));
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bitacaPlay = new BitacaPlay();
    });
} else {
    window.bitacaPlay = new BitacaPlay();
}

export default BitacaPlay;
