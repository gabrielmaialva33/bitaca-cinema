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
 * Fallback mock data for when API is unavailable (CORS issues)
 */
const MOCK_DATA = {
    animes: [
        { name: 'Naruto Shippuden', url: '#', path: '/naruto.mp4' },
        { name: 'One Piece', url: '#', path: '/onepiece.mp4' },
        { name: 'Attack on Titan', url: '#', path: '/aot.mp4' },
        { name: 'My Hero Academia', url: '#', path: '/mha.mp4' },
        { name: 'Demon Slayer', url: '#', path: '/demonslayer.mp4' },
        { name: 'Jujutsu Kaisen', url: '#', path: '/jjk.mp4' },
        { name: 'Death Note', url: '#', path: '/deathnote.mp4' },
        { name: 'Tokyo Ghoul', url: '#', path: '/tokyoghoul.mp4' }
    ],
    movies: [
        { name: 'Spider-Man: No Way Home', url: '#', path: '/spiderman.mp4' },
        { name: 'The Batman', url: '#', path: '/batman.mp4' },
        { name: 'Top Gun: Maverick', url: '#', path: '/topgun.mp4' },
        { name: 'Avatar: The Way of Water', url: '#', path: '/avatar.mp4' },
        { name: 'John Wick 4', url: '#', path: '/johnwick.mp4' },
        { name: 'Oppenheimer', url: '#', path: '/oppenheimer.mp4' }
    ]
};

/**
 * Load content from AnimeZey based on user preferences
 */
async function loadContent() {
    showLoading();

    try {
        // Try to load from API
        const [animes, movies] = await Promise.all([
            animezeyAPI.getPopularContent(0, 20).catch(() => []), // Drive 0: Animes
            animezeyAPI.getPopularContent(1, 20).catch(() => [])  // Drive 1: Filmes e Séries
        ]);

        // If API fails (CORS or network error), use mock data
        const finalAnimes = animes.length > 0 ? animes : MOCK_DATA.animes;
        const finalMovies = movies.length > 0 ? movies : MOCK_DATA.movies;

        // Populate grids
        populateGrid('featured-grid', [...finalAnimes.slice(0, 4), ...finalMovies.slice(0, 4)]);
        populateGrid('animes-carousel', finalAnimes);
        populateGrid('filmes-carousel', finalMovies.filter(v => !v.name.toLowerCase().includes('season' || 'ep' || 'episod')));
        populateGrid('series-carousel', finalMovies.filter(v => v.name.toLowerCase().includes('season' || 'ep' || 'episod')));

        console.log('Content loaded - Animes:', finalAnimes.length, '| Movies:', finalMovies.length);

        if (animes.length === 0 && movies.length === 0) {
            console.warn('Using fallback mock data due to API unavailability (CORS)');
        }

    } catch (error) {
        console.error('Error loading content:', error);
        showErrorToast('Usando conteúdo de demonstração. API indisponível.');
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
async function createProductionCard(video) {
    const card = document.createElement('div');
    card.className = 'production-card';
    card.dataset.url = video.url;
    card.dataset.name = video.name;

    // Get TMDB metadata for thumbnail
    let thumbnailUrl = window.tmdbAPI ? window.tmdbAPI.getPlaceholderImage() : 'https://images.unsplash.com/photo-1574267432644-f74f3d76d53a?w=500&h=750&fit=crop';
    let metadata = null;

    if (window.tmdbAPI) {
        try {
            metadata = await window.tmdbAPI.getMetadataForVideo(video.name);
            if (metadata && metadata.posterURL) {
                thumbnailUrl = metadata.posterURL;
            }
        } catch (error) {
            console.error('Error fetching TMDB metadata:', error);
        }
    }

    card.innerHTML = `
        <div class="card-image">
            <img alt="${video.name}" class="card-thumbnail" src="${thumbnailUrl}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1574267432644-f74f3d76d53a?w=500&h=750&fit=crop'">
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
                ${metadata && metadata.mediaType ? (metadata.mediaType === 'tv' ? 'Série' : 'Filme') : 'Vídeo'}
            </p>
        </div>
    `;

    // Add click listener
    card.addEventListener('click', () => {
        playVideo(video, metadata);
    });

    return card;
}

/**
 * Play a video
 */
function playVideo(video, metadata = null) {
    const modal = document.getElementById('player-modal');
    const videoElement = document.getElementById('player-video');
    const playerInfo = document.getElementById('player-info');

    if (!modal || !videoElement) return;

    // Set video source
    videoElement.src = animezeyAPI.getVideoUrl(video.path);

    // Build player info with metadata
    const mediaType = metadata && metadata.mediaType ? (metadata.mediaType === 'tv' ? 'Série' : 'Filme') : 'Vídeo';
    const overview = metadata && metadata.overview ? `<p class="player-synopsis">${metadata.overview}</p>` : '';
    const rating = metadata && metadata.voteAverage ? `<span><i class="ki-filled ki-star"></i> ${metadata.voteAverage.toFixed(1)}</span>` : '';

    // Update player info
    playerInfo.innerHTML = `
        <h2 class="player-title">${video.name}</h2>
        <div class="player-meta">
            <span><i class="ki-filled ki-video"></i> ${mediaType}</span>
            ${rating}
            <span><i class="ki-filled ki-eye"></i> Streaming</span>
        </div>
        ${overview}
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
