/**
 * Bitaca Play - Main Application
 * Integração com AnimeZey API
 */

// Wait for window.animezeyAPI to be available
let animezeyAPI;
let loadingSpinner;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Get API instance
    animezeyAPI = window.animezeyAPI;
    loadingSpinner = document.getElementById('loading-spinner');

    if (!animezeyAPI) {
        console.error('AnimeZeyAPI not initialized');
        return;
    }

    console.log('🎬 Bitaca Play initialized');

    // Load initial content
    await loadContent();
});

/**
 * Load content from AnimeZey
 */
async function loadContent() {
    showLoading();

    try {
        // Get content from "Filmes e Séries" drive (driveId = 1)
        const featured = await animezeyAPI.getPopularContent(1, 20);

        // Populate grids
        populateGrid('featured-grid', featured.slice(0, 8));
        populateGrid('patrimonio-carousel', featured.filter(v => v.name.toLowerCase().includes('patrimônio' || 'memorial' || 'história')).slice(0, 8));
        populateGrid('musica-carousel', featured.filter(v => v.name.toLowerCase().includes('música' || 'clipe' || 'show')).slice(0, 8));
        populateGrid('ambiente-carousel', featured.filter(v => v.name.toLowerCase().includes('ambiente' || 'natureza' || 'paisagem')).slice(0, 8));

        console.log('✅ Content loaded:', featured.length, 'videos');

    } catch (error) {
        console.error('Error loading content:', error);
    } finally {
        hideLoading();
    }
}

/**
 * Populate a grid with productions
 */
function populateGrid(gridId, videos) {
    const grid = document.getElementById(gridId);
    if (!grid || !videos || videos.length === 0) return;

    grid.innerHTML = '';

    videos.forEach(video => {
        const card = createProductionCard(video);
        grid.appendChild(card);
    });
}

/**
 * Create a production card element
 */
function createProductionCard(video) {
    const card = document.createElement('div');
    card.className = 'production-card';
    card.dataset.url = video.url;
    card.dataset.name = video.name;

    // Extract thumbnail from video (placeholder for now)
    const thumbnailUrl = 'https://images.unsplash.com/photo-1574267432644-f74f3d76d53a?w=400&h=225&fit=crop';

    card.innerHTML = `
        <div class="card-image">
            <img alt="${video.name}" class="card-thumbnail" src="${thumbnailUrl}">
            <div class="card-overlay">
                <button class="card-play-btn">
                    <i class="ki-filled ki-play"></i>
                </button>
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${truncateText(video.name, 40)}</h3>
            <p class="card-meta">
                <i class="ki-filled ki-video"></i>
                Vídeo
            </p>
        </div>
    `;

    // Add click listener
    card.addEventListener('click', () => {
        playVideo(video);
    });

    return card;
}

/**
 * Play a video
 */
function playVideo(video) {
    const modal = document.getElementById('player-modal');
    const videoElement = document.getElementById('player-video');
    const playerInfo = document.getElementById('player-info');

    if (!modal || !videoElement) return;

    // Set video source
    videoElement.src = animezeyAPI.getVideoUrl(video.path);

    // Update player info
    playerInfo.innerHTML = `
        <h2 class="player-title">${video.name}</h2>
        <div class="player-meta">
            <span><i class="ki-filled ki-video"></i> Vídeo</span>
            <span><i class="ki-filled ki-eye"></i> Streaming</span>
        </div>
        <div class="player-actions">
            <button class="action-btn" onclick="window.open('${video.url}', '_blank')">
                <i class="ki-filled ki-file-down"></i>
                Download
            </button>
            <button class="action-btn" onclick="navigator.share({title: '${video.name}', url: '${video.url}'})">
                <i class="ki-filled ki-share"></i>
                Compartilhar
            </button>
        </div>
    `;

    // Show modal
    modal.classList.add('active');

    // Play video
    videoElement.play();

    console.log('▶️ Playing:', video.name);
}

/**
 * Close player modal
 */
document.getElementById('player-close')?.addEventListener('click', () => {
    const modal = document.getElementById('player-modal');
    const videoElement = document.getElementById('player-video');

    modal.classList.remove('active');
    videoElement.pause();
    videoElement.src = '';
});

document.getElementById('player-overlay')?.addEventListener('click', () => {
    const modal = document.getElementById('player-modal');
    const videoElement = document.getElementById('player-video');

    modal.classList.remove('active');
    videoElement.pause();
    videoElement.src = '';
});

/**
 * Search functionality
 */
document.getElementById('search-input')?.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('search-results');

    if (!query || query.length < 3) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        const results = await animezeyAPI.search(query, 1);

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Nenhum resultado encontrado</p>';
            return;
        }

        resultsContainer.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'productions-grid';

        results.slice(0, 12).forEach(video => {
            const card = createProductionCard(video);
            grid.appendChild(card);
        });

        resultsContainer.appendChild(grid);

    } catch (error) {
        console.error('Search error:', error);
    }
});

// Utility functions
function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.classList.add('active');
    }
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.classList.remove('active');
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Export for other modules
export { animezeyAPI, playVideo };
