// ===============================================
// BITACA CINEMA - VOTING UI
// Film Voting Interface with Star Ratings
// ===============================================

import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from '../firebase-config.js';
import { getCurrentUser } from './auth-ui.js';

const db = getFirestore(app);

// ===== INIT VOTING UI =====
export function initVotingUI() {
    renderVotingModal();
    setupVotingListeners();

    // Listen for quiz passed event
    document.addEventListener('quizPassed', () => {
        openVotingModal();
    });
}

// ===== RENDER VOTING MODAL =====
function renderVotingModal() {
    const modalHTML = `
        <div id="voting-modal" class="voting-modal voting-modal--fullscreen" role="dialog" aria-labelledby="voting-modal-title" aria-modal="true">
            <div class="voting-modal__overlay" aria-hidden="true"></div>
            <div class="voting-modal__content voting-modal__content--fullscreen">
                <button class="voting-modal__close" aria-label="Fechar votação">
                    <i class="ki-filled ki-cross"></i>
                </button>

                <div class="voting-header">
                    <div class="voting-header-content">
                        <i class="ki-filled ki-star" aria-hidden="true"></i>
                        <h2 id="voting-modal-title" class="voting-title">Vote nos Filmes</h2>
                        <p class="voting-subtitle">Avalie os projetos audiovisuais de Capão Bonito</p>
                    </div>

                    <!-- Voting Stats -->
                    <div class="voting-stats">
                        <div class="voting-stat">
                            <span id="user-total-votes">0</span>
                            <label>Seus Votos</label>
                        </div>
                        <div class="voting-stat">
                            <span id="remaining-votes">23</span>
                            <label>Restantes</label>
                        </div>
                    </div>
                </div>

                <!-- Films List -->
                <div id="voting-films-list" class="voting-films-list">
                    <!-- Films will be inserted here -->
                </div>

                <!-- Loading State -->
                <div id="voting-loading" class="voting-loading" style="display: none;">
                    <div class="voting-spinner"></div>
                    <p>Carregando filmes...</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== SETUP VOTING LISTENERS =====
function setupVotingListeners() {
    const modal = document.getElementById('voting-modal');
    const closeBtn = modal.querySelector('.voting-modal__close');
    const overlay = modal.querySelector('.voting-modal__overlay');

    // Close modal
    closeBtn.addEventListener('click', closeVotingModal);
    overlay.addEventListener('click', closeVotingModal);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeVotingModal();
        }
    });
}

// ===== OPEN VOTING MODAL =====
export async function openVotingModal() {
    const user = getCurrentUser();

    if (!user) {
        alert('Você precisa estar logado para votar!');
        return;
    }

    const modal = document.getElementById('voting-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load films and user votes
    await loadFilmsAndVotes(user.uid);
}

function closeVotingModal() {
    const modal = document.getElementById('voting-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== LOAD FILMS AND VOTES =====
async function loadFilmsAndVotes(userId) {
    const filmsList = document.getElementById('voting-films-list');
    const loading = document.getElementById('voting-loading');

    // Show loading
    filmsList.style.display = 'none';
    loading.style.display = 'flex';

    try {
        // Get films from global data
        const films = window.filmesData || [];

        // Get user votes
        const userVotes = await getUserVotes(userId);

        // Get vote counts for all films
        const voteCounts = await getVoteCounts();

        // Render films
        renderFilms(films, userVotes, voteCounts);

        // Update stats
        updateVotingStats(userVotes, films.length);

    } catch (error) {
        console.error('Error loading films:', error);
        filmsList.innerHTML = `
            <div class="voting-error">
                <i class="ki-filled ki-information-2"></i>
                <p>Erro ao carregar filmes. Tente novamente.</p>
            </div>
        `;
    } finally {
        loading.style.display = 'none';
        filmsList.style.display = 'block';
    }
}

// ===== RENDER FILMS =====
function renderFilms(films, userVotes, voteCounts) {
    const filmsList = document.getElementById('voting-films-list');

    filmsList.innerHTML = films.map(film => {
        const userVote = userVotes[film.id];
        const voteCount = voteCounts[film.id] || 0;
        const hasVoted = userVote !== undefined;

        return `
            <div class="voting-film-card ${hasVoted ? 'voted' : ''}" data-film-id="${film.id}">
                <div class="voting-film-header">
                    <div class="voting-film-icon">
                        <i class="ki-filled ki-video"></i>
                    </div>
                    <div class="voting-film-info">
                        <h3 class="voting-film-title">${film.titulo}</h3>
                        <p class="voting-film-director">Dir: ${film.diretor}</p>
                        <p class="voting-film-meta">${film.genero} • ${film.duracao}</p>
                    </div>
                </div>

                <div class="voting-film-body">
                    <p class="voting-film-description">${film.sinopse || 'Sinopse em breve...'}</p>
                </div>

                <div class="voting-film-footer">
                    <!-- Star Rating -->
                    <div class="star-rating" data-film-id="${film.id}" role="radiogroup" aria-label="Avaliação de ${film.titulo}">
                        ${renderStars(film.id, userVote)}
                    </div>

                    <!-- Vote Count -->
                    <div class="vote-count">
                        <i class="ki-filled ki-users" aria-hidden="true"></i>
                        <span>${voteCount} ${voteCount === 1 ? 'voto' : 'votos'}</span>
                    </div>

                    <!-- Voted Badge -->
                    ${hasVoted ? `
                        <div class="voted-badge">
                            <i class="ki-filled ki-check-circle"></i>
                            Você votou ${userVote} ${userVote === 1 ? 'estrela' : 'estrelas'}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add star click listeners
    setupStarListeners();
}

// ===== RENDER STARS =====
function renderStars(filmId, currentRating = 0) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const isActive = i <= currentRating;
        starsHTML += `
            <button
                class="star ${isActive ? 'active' : ''}"
                data-rating="${i}"
                aria-label="${i} ${i === 1 ? 'estrela' : 'estrelas'}"
                role="radio"
                aria-checked="${isActive}"
            >
                <i class="ki-filled ki-star"></i>
            </button>
        `;
    }
    return starsHTML;
}

// ===== STAR RATING LISTENERS =====
function setupStarListeners() {
    const starContainers = document.querySelectorAll('.star-rating');

    starContainers.forEach(container => {
        const filmId = parseInt(container.dataset.filmId);
        const stars = container.querySelectorAll('.star');

        stars.forEach(star => {
            // Hover effect
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                highlightStars(stars, rating);
            });

            // Click to vote
            star.addEventListener('click', async () => {
                const rating = parseInt(star.dataset.rating);
                await submitVote(filmId, rating);
            });
        });

        // Reset on mouse leave
        container.addEventListener('mouseleave', () => {
            const currentRating = getCurrentRating(stars);
            highlightStars(stars, currentRating);
        });
    });
}

function highlightStars(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active', 'hover');
        } else {
            star.classList.remove('active', 'hover');
        }
    });
}

function getCurrentRating(stars) {
    const activeStar = Array.from(stars).find(s => s.getAttribute('aria-checked') === 'true');
    return activeStar ? parseInt(activeStar.dataset.rating) : 0;
}

// ===== SUBMIT VOTE =====
async function submitVote(filmId, rating) {
    const user = getCurrentUser();
    if (!user) {
        alert('Você precisa estar logado para votar!');
        return;
    }

    try {
        // Save user vote
        await setDoc(doc(db, 'votes', `${user.uid}_${filmId}`), {
            userId: user.uid,
            filmId: filmId,
            rating: rating,
            timestamp: new Date().toISOString()
        });

        // Update film vote count and average
        const filmRef = doc(db, 'filmVotes', filmId.toString());
        const filmDoc = await getDoc(filmRef);

        if (filmDoc.exists()) {
            // Update existing
            const data = filmDoc.data();
            const newCount = data.count + 1;
            const newTotal = data.totalRating + rating;
            const newAverage = newTotal / newCount;

            await updateDoc(filmRef, {
                count: newCount,
                totalRating: newTotal,
                averageRating: newAverage
            });
        } else {
            // Create new
            await setDoc(filmRef, {
                filmId: filmId,
                count: 1,
                totalRating: rating,
                averageRating: rating
            });
        }

        // Show success feedback
        showVoteSuccess(filmId, rating);

        // Reload films to update UI
        await loadFilmsAndVotes(user.uid);

    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('Erro ao enviar voto. Tente novamente.');
    }
}

// ===== VOTE SUCCESS FEEDBACK =====
function showVoteSuccess(filmId, rating) {
    const filmCard = document.querySelector(`[data-film-id="${filmId}"]`);
    if (!filmCard) return;

    // Add success animation
    filmCard.classList.add('vote-success');
    setTimeout(() => {
        filmCard.classList.remove('vote-success');
    }, 1000);

    // Show toast notification (could be enhanced)
    console.log(`Vote submitted: ${rating} stars for film ${filmId}`);
}

// ===== GET USER VOTES =====
async function getUserVotes(userId) {
    try {
        const votesQuery = query(
            collection(db, 'votes'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(votesQuery);
        const votes = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            votes[data.filmId] = data.rating;
        });

        return votes;
    } catch (error) {
        console.error('Error getting user votes:', error);
        return {};
    }
}

// ===== GET VOTE COUNTS =====
async function getVoteCounts() {
    try {
        const snapshot = await getDocs(collection(db, 'filmVotes'));
        const counts = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            counts[data.filmId] = data.count || 0;
        });

        return counts;
    } catch (error) {
        console.error('Error getting vote counts:', error);
        return {};
    }
}

// ===== UPDATE VOTING STATS =====
function updateVotingStats(userVotes, totalFilms) {
    const votedCount = Object.keys(userVotes).length;
    const remainingCount = totalFilms - votedCount;

    document.getElementById('user-total-votes').textContent = votedCount;
    document.getElementById('remaining-votes').textContent = remainingCount;
}
