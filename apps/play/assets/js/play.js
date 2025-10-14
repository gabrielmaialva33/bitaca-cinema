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

    console.log('Bitaca Play initialized');

    // Load initial content
    await loadContent();
});

/**
 * Load content from AnimeZey based on user preferences
 */
async function loadContent() {
    showLoading();

    try {
        // Load from both drives
        const [animes, movies] = await Promise.all([
            animezeyAPI.getPopularContent(0, 20), // Drive 0: Animes
            animezeyAPI.getPopularContent(1, 20)  // Drive 1: Filmes e Séries
        ]);

        // Populate grids
        populateGrid('featured-grid', [...animes.slice(0, 4), ...movies.slice(0, 4)]);
        populateGrid('animes-carousel', animes);
        populateGrid('filmes-carousel', movies.filter(v => !v.name.toLowerCase().includes('season' || 'ep' || 'episod')));
        populateGrid('series-carousel', movies.filter(v => v.name.toLowerCase().includes('season' || 'ep' || 'episod')));

        console.log('Content loaded - Animes:', animes.length, '| Movies:', movies.length);

    } catch (error) {
        console.error('Error loading content:', error);
        showErrorToast('Erro ao carregar conteúdo. Tente novamente.');
    } finally {
        hideLoading();
    }
}

/**
 * Load personalized content based on user preferences
 */
async function loadPersonalizedContent(preferences) {
    showLoading();

    try {
        console.log('Loading personalized content for:', preferences);

        // Get user's favorite genres from onboarding
        const genres = preferences.favoriteGenres || [];

        // Search for content matching user preferences
        const personalizedResults = [];

        for (const genre of genres.slice(0, 3)) {
            const results = await animezeyAPI.search(genre, 1);
            personalizedResults.push(...results.slice(0, 5));
        }

        // Update featured grid with personalized content
        if (personalizedResults.length > 0) {
            populateGrid('featured-grid', personalizedResults.slice(0, 8));
            console.log('Personalized content loaded:', personalizedResults.length);
        }

    } catch (error) {
        console.error('Error loading personalized content:', error);
    } finally {
        hideLoading();
    }
}

// Listen for preferences update event
window.addEventListener('preferences-updated', async () => {
    console.log('Preferences updated, reloading content...');
    await loadContent();
});

/**
 * Populate a grid with productions
 */
async function populateGrid(gridId, videos) {
    const grid = document.getElementById(gridId);
    if (!grid || !videos || videos.length === 0) return;

    grid.innerHTML = '';

    // Create all cards in parallel
    const cardPromises = videos.map(video => createProductionCard(video));
    const cards = await Promise.all(cardPromises);

    cards.forEach(card => {
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

    console.log('Playing:', video.name);
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
 * Search functionality with debounce
 */
let searchTimeout;
const searchInput = document.getElementById('search-input');

searchInput?.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('search-results');

    // Clear previous timeout
    clearTimeout(searchTimeout);

    if (!query || query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    // Show loading indicator
    resultsContainer.innerHTML = '<div class="search-loading"><div class="spinner"></div><p>Buscando...</p></div>';

    // Debounce search (wait 500ms after user stops typing)
    searchTimeout = setTimeout(async () => {
        try {
            // Search in both drives (anime and movies)
            const [animeResults, movieResults] = await Promise.all([
                animezeyAPI.search(query, 0).catch(() => []),
                animezeyAPI.search(query, 1).catch(() => [])
            ]);

            const allResults = [...animeResults, ...movieResults];

            if (allResults.length === 0) {
                resultsContainer.innerHTML = '<p class="search-empty">Nenhum resultado encontrado para "' + query + '"</p>';
                return;
            }

            resultsContainer.innerHTML = '';

            // Add results count
            const countElement = document.createElement('p');
            countElement.className = 'search-count';
            countElement.textContent = `${allResults.length} resultado(s) encontrado(s)`;
            resultsContainer.appendChild(countElement);

            const grid = document.createElement('div');
            grid.className = 'productions-grid';

            allResults.slice(0, 24).forEach(video => {
                const card = createProductionCard(video);
                grid.appendChild(card);
            });

            resultsContainer.appendChild(grid);

        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<p class="search-error">Erro ao buscar. Tente novamente.</p>';
        }
    }, 500);
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

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <i class="ki-filled ki-information-2"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export for other modules
export { animezeyAPI, playVideo, loadPersonalizedContent };
