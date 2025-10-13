// ===============================================
// BITACA CINEMA - VOTING SYSTEM MAIN
// Initialize and Coordinate All Voting Components
// ===============================================

import {getCurrentUser, initAuthUI, isUserAuthenticated, openAuthModal} from './auth-ui.js';
import {checkQuizStatus, initQuizUI, openQuizModal} from './quiz-ui.js';
import {initVotingUI, openVotingModal} from './vote-ui.js';

// ===== INIT VOTING SYSTEM =====
export function initVotingSystem() {
    console.log('Initializing Bitaca Voting System...');

    // Initialize all components
    initAuthUI();
    initQuizUI();
    initVotingUI();

    // Add voting buttons to film cards
    addVotingButtonsToCards();

    // Add main voting trigger button to header
    addMainVotingButton();
}

// ===== ADD VOTING BUTTONS TO FILM CARDS =====
function addVotingButtonsToCards() {
    // Wait for film cards to be rendered
    const observer = new MutationObserver((mutations) => {
        const filmCards = document.querySelectorAll('.filme-card:not(.has-vote-btn)');

        if (filmCards.length > 0) {
            filmCards.forEach(card => {
                const filmId = parseInt(card.dataset.id);
                if (!filmId) return;

                // Add vote button to card footer
                const cardBody = card.querySelector('.filme-card__body');
                if (!cardBody) return;

                const voteButton = document.createElement('button');
                voteButton.className = 'filme-vote-btn';
                voteButton.innerHTML = `
                    <i class="ki-filled ki-star"></i>
                    <span>Votar</span>
                `;
                voteButton.setAttribute('aria-label', `Votar em ${card.querySelector('.filme-card__title')?.textContent}`);

                voteButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await handleVoteClick(filmId);
                });

                cardBody.appendChild(voteButton);
                card.classList.add('has-vote-btn');
            });
        }
    });

    // Observe the films grid
    const filmesGrid = document.getElementById('filmes-grid');
    if (filmesGrid) {
        observer.observe(filmesGrid, {
            childList: true,
            subtree: true
        });
    }
}

// ===== ADD MAIN VOTING BUTTON TO HEADER =====
function addMainVotingButton() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    // Create voting button container
    const votingContainer = document.createElement('div');
    votingContainer.className = 'nav__voting';

    // Auth trigger button
    const authBtn = document.createElement('button');
    authBtn.id = 'auth-trigger-btn';
    authBtn.className = 'nav-voting-btn';
    authBtn.innerHTML = `
        <i class="ki-filled ki-user-square"></i>
        <span>Entrar</span>
    `;
    authBtn.setAttribute('aria-label', 'Abrir autenticação');

    authBtn.addEventListener('click', () => {
        openAuthModal();
    });

    votingContainer.appendChild(authBtn);
    nav.appendChild(votingContainer);

    // Add CSS for nav voting button
    const style = document.createElement('style');
    style.textContent = `
        .nav__voting {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-left: 2rem;
        }

        .nav-voting-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, var(--vermelho-bitaca), #9B1B30);
            color: var(--branco);
            border-radius: 25px;
            font-family: var(--font-bold);
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .nav-voting-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(196, 30, 58, 0.3);
        }

        .nav-voting-btn i {
            font-size: 1.2rem;
        }

        .auth-btn-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            object-fit: cover;
        }

        .filme-vote-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 0.875rem 1.5rem;
            background: linear-gradient(135deg, var(--verde-folha), #1a3d0d);
            color: var(--branco);
            border-radius: 12px;
            font-family: var(--font-bold);
            font-size: 0.9rem;
            font-weight: 600;
            margin-top: 1rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .filme-vote-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(45, 80, 22, 0.3);
        }

        .filme-vote-btn i {
            font-size: 1.1rem;
        }

        @media (max-width: 768px) {
            .nav__voting {
                margin-left: auto;
            }

            .nav-voting-btn span {
                display: none;
            }

            .nav-voting-btn {
                padding: 0.75rem;
                border-radius: 50%;
                width: 44px;
                height: 44px;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== HANDLE VOTE CLICK =====
async function handleVoteClick(filmId) {
    // Check if user is authenticated
    if (!isUserAuthenticated()) {
        openAuthModal();
        return;
    }

    const user = getCurrentUser();

    // Check if user passed quiz
    const hasPassedQuiz = await checkQuizStatus(user.uid);

    if (!hasPassedQuiz) {
        // User needs to take quiz
        openQuizModal();
    } else {
        // User can vote directly
        openVotingModal();
    }
}

// ===== EXPORT PUBLIC API =====
export {
    openAuthModal,
    openQuizModal,
    openVotingModal,
    isUserAuthenticated,
    getCurrentUser
};

// Make initVotingSystem available globally for main.js
window.initVotingSystem = initVotingSystem;
