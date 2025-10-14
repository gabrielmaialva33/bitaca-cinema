/**
 * Onboarding System
 * First-time user experience with tag/genre selection
 * Stores preferences in Firebase + MongoDB for personalized recommendations
 */

import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class OnboardingSystem {
    constructor() {
        this.auth = getAuth(window.firebaseApp);
        this.db = getFirestore(window.firebaseApp);
        this.currentStep = 0;
        this.userPreferences = {
            favoriteGenres: [],
            favoriteMoods: [],
            targetAudience: [],
            completedAt: null
        };

        // Available tags organized by category
        this.availableTags = {
            genres: [
                { id: 'action', name: 'Ação', icon: '', color: '#FF6B6B' },
                { id: 'adventure', name: 'Aventura', icon: '', color: '#4ECDC4' },
                { id: 'comedy', name: 'Comédia', icon: '', color: '#FFE66D' },
                { id: 'drama', name: 'Drama', icon: '', color: '#A8DADC' },
                { id: 'fantasy', name: 'Fantasia', icon: '', color: '#C77DFF' },
                { id: 'horror', name: 'Terror', icon: '', color: '#8B4513' },
                { id: 'mystery', name: 'Mistério', icon: '', color: '#457B9D' },
                { id: 'romance', name: 'Romance', icon: '', color: '#F72585' },
                { id: 'sci-fi', name: 'Ficção Científica', icon: '', color: '#4361EE' },
                { id: 'slice-of-life', name: 'Slice of Life', icon: '', color: '#FFB5A7' },
                { id: 'sports', name: 'Esportes', icon: '', color: '#06FFA5' },
                { id: 'thriller', name: 'Suspense', icon: '', color: '#2B2D42' }
            ],
            moods: [
                { id: 'dark', name: 'Sombrio', icon: '', color: '#2B2D42' },
                { id: 'lighthearted', name: 'Leve', icon: '', color: '#FFE66D' },
                { id: 'intense', name: 'Intenso', icon: '', color: '#FF6B6B' },
                { id: 'emotional', name: 'Emocional', icon: '', color: '#A8DADC' },
                { id: 'inspiring', name: 'Inspirador', icon: '', color: '#FFD700' },
                { id: 'relaxing', name: 'Relaxante', icon: '', color: '#90EE90' }
            ],
            audience: [
                { id: 'kids', name: 'Infantil', icon: '', color: '#FFB5A7' },
                { id: 'teen', name: 'Adolescente', icon: '', color: '#4ECDC4' },
                { id: 'adult', name: 'Adulto', icon: '', color: '#457B9D' },
                { id: 'family', name: 'Família', icon: '', color: '#90EE90' }
            ]
        };
    }

    /**
     * Check if user has completed onboarding
     * @returns {Promise<boolean>}
     */
    async hasCompletedOnboarding() {
        try {
            const user = this.auth.currentUser;
            if (!user) return false;

            const userDoc = await getDoc(doc(this.db, 'user_preferences', user.uid));

            if (!userDoc.exists()) {
                return false;
            }

            const data = userDoc.data();
            return data.completedAt !== null && data.completedAt !== undefined;
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            return false;
        }
    }

    /**
     * Show onboarding modal
     */
    async showOnboarding() {
        const completed = await this.hasCompletedOnboarding();
        if (completed) {
            console.log('User has already completed onboarding');
            return;
        }

        this.createOnboardingModal();
        this.showStep(0);
    }

    /**
     * Create onboarding modal HTML
     */
    createOnboardingModal() {
        // Check if modal already exists
        if (document.getElementById('onboarding-modal')) {
            return;
        }

        const modalHTML = `
            <div class="onboarding-modal" id="onboarding-modal">
                <div class="onboarding-container">
                    <div class="onboarding-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="onboarding-progress"></div>
                        </div>
                        <span class="progress-text" id="onboarding-step-text">Passo 1 de 3</span>
                    </div>

                    <div class="onboarding-content" id="onboarding-content">
                        <!-- Dynamic content will be inserted here -->
                    </div>

                    <div class="onboarding-actions">
                        <button class="btn-secondary" id="onboarding-skip">
                            Pular
                        </button>
                        <div class="action-buttons-right">
                            <button class="btn-secondary hidden" id="onboarding-back">
                                <i class="ki-filled ki-arrow-left"></i>
                                Voltar
                            </button>
                            <button class="btn-primary" id="onboarding-next">
                                Próximo
                                <i class="ki-filled ki-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to onboarding buttons
     */
    attachEventListeners() {
        document.getElementById('onboarding-next')?.addEventListener('click', () => this.nextStep());
        document.getElementById('onboarding-back')?.addEventListener('click', () => this.previousStep());
        document.getElementById('onboarding-skip')?.addEventListener('click', () => this.skipOnboarding());
    }

    /**
     * Show specific onboarding step
     * @param {number} step - Step number (0, 1, 2)
     */
    showStep(step) {
        this.currentStep = step;
        const totalSteps = 3;

        // Update progress bar
        const progress = ((step + 1) / totalSteps) * 100;
        document.getElementById('onboarding-progress').style.width = `${progress}%`;
        document.getElementById('onboarding-step-text').textContent = `Passo ${step + 1} de ${totalSteps}`;

        // Update back button visibility
        const backBtn = document.getElementById('onboarding-back');
        if (step === 0) {
            backBtn?.classList.add('hidden');
        } else {
            backBtn?.classList.remove('hidden');
        }

        // Update next button text
        const nextBtn = document.getElementById('onboarding-next');
        if (step === totalSteps - 1) {
            nextBtn.innerHTML = 'Finalizar <i class="ki-filled ki-check"></i>';
        } else {
            nextBtn.innerHTML = 'Próximo <i class="ki-filled ki-arrow-right"></i>';
        }

        // Show step content
        const content = document.getElementById('onboarding-content');
        if (content) {
            content.innerHTML = this.getStepContent(step);
            this.attachTagListeners();
        }
    }

    /**
     * Get content HTML for specific step
     * @param {number} step - Step number
     * @returns {string} - HTML content
     */
    getStepContent(step) {
        switch (step) {
            case 0:
                return this.getWelcomeStep();
            case 1:
                return this.getGenreSelectionStep();
            case 2:
                return this.getMoodSelectionStep();
            default:
                return '';
        }
    }

    /**
     * Welcome step content
     * @returns {string}
     */
    getWelcomeStep() {
        return `
            <div class="onboarding-step welcome-step">
                <div class="welcome-icon"></div>
                <h2 class="welcome-title">Bem-vindo ao Bitaca Play!</h2>
                <p class="welcome-subtitle">
                    Vamos personalizar sua experiência para recomendar os melhores animes e filmes para você.
                </p>
                <div class="welcome-features">
                    <div class="feature">
                        <i class="ki-filled ki-star"></i>
                        <span>Recomendações personalizadas</span>
                    </div>
                    <div class="feature">
                        <i class="ki-filled ki-search-list"></i>
                        <span>Busca inteligente com IA</span>
                    </div>
                    <div class="feature">
                        <i class="ki-filled ki-chart-line"></i>
                        <span>Acompanhe seu progresso</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genre selection step
     * @returns {string}
     */
    getGenreSelectionStep() {
        const genreTags = this.availableTags.genres.map(tag => `
            <button class="tag-button" data-tag-id="${tag.id}" data-tag-category="genres">
                <span class="tag-icon">${tag.icon}</span>
                <span class="tag-name">${tag.name}</span>
                <i class="tag-check ki-filled ki-check hidden"></i>
            </button>
        `).join('');

        return `
            <div class="onboarding-step selection-step">
                <h2 class="step-title">Quais gêneros você mais gosta?</h2>
                <p class="step-subtitle">Selecione pelo menos 3 gêneros</p>
                <div class="tags-grid">
                    ${genreTags}
                </div>
            </div>
        `;
    }

    /**
     * Mood selection step
     * @returns {string}
     */
    getMoodSelectionStep() {
        const moodTags = this.availableTags.moods.map(tag => `
            <button class="tag-button" data-tag-id="${tag.id}" data-tag-category="moods">
                <span class="tag-icon">${tag.icon}</span>
                <span class="tag-name">${tag.name}</span>
                <i class="tag-check ki-filled ki-check hidden"></i>
            </button>
        `).join('');

        const audienceTags = this.availableTags.audience.map(tag => `
            <button class="tag-button" data-tag-id="${tag.id}" data-tag-category="audience">
                <span class="tag-icon">${tag.icon}</span>
                <span class="tag-name">${tag.name}</span>
                <i class="tag-check ki-filled ki-check hidden"></i>
            </button>
        `).join('');

        return `
            <div class="onboarding-step selection-step">
                <h2 class="step-title">Que tipo de clima você prefere?</h2>
                <p class="step-subtitle">Selecione os estilos que mais combinam com você</p>
                <div class="tags-section">
                    <h3 class="section-label">Clima/Mood</h3>
                    <div class="tags-grid">
                        ${moodTags}
                    </div>
                </div>
                <div class="tags-section">
                    <h3 class="section-label">Público</h3>
                    <div class="tags-grid">
                        ${audienceTags}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach click listeners to tag buttons
     */
    attachTagListeners() {
        const tagButtons = document.querySelectorAll('.tag-button');
        tagButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleTag(e.currentTarget));
        });
    }

    /**
     * Toggle tag selection
     * @param {HTMLElement} button - Tag button element
     */
    toggleTag(button) {
        const tagId = button.dataset.tagId;
        const category = button.dataset.tagCategory;
        const check = button.querySelector('.tag-check');

        if (button.classList.contains('selected')) {
            // Deselect
            button.classList.remove('selected');
            check?.classList.add('hidden');

            // Remove from preferences
            const categoryKey = category === 'genres' ? 'favoriteGenres' :
                              category === 'moods' ? 'favoriteMoods' : 'targetAudience';
            const index = this.userPreferences[categoryKey].indexOf(tagId);
            if (index > -1) {
                this.userPreferences[categoryKey].splice(index, 1);
            }
        } else {
            // Select
            button.classList.add('selected');
            check?.classList.remove('hidden');

            // Add to preferences
            const categoryKey = category === 'genres' ? 'favoriteGenres' :
                              category === 'moods' ? 'favoriteMoods' : 'targetAudience';
            if (!this.userPreferences[categoryKey].includes(tagId)) {
                this.userPreferences[categoryKey].push(tagId);
            }
        }
    }

    /**
     * Go to next step
     */
    async nextStep() {
        // Validate current step
        if (this.currentStep === 1) {
            if (this.userPreferences.favoriteGenres.length < 3) {
                alert('Por favor, selecione pelo menos 3 gêneros');
                return;
            }
        }

        if (this.currentStep === 2) {
            // Final step - save preferences
            await this.savePreferences();
            this.closeOnboarding();
            this.showWelcomeToast();
            return;
        }

        this.showStep(this.currentStep + 1);
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Skip onboarding
     */
    async skipOnboarding() {
        if (confirm('Tem certeza que deseja pular? Você pode configurar suas preferências depois.')) {
            this.userPreferences.completedAt = null; // Mark as skipped
            await this.savePreferences();
            this.closeOnboarding();
        }
    }

    /**
     * Save user preferences to Firebase
     */
    async savePreferences() {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                console.error('No user logged in');
                return;
            }

            this.userPreferences.completedAt = new Date().toISOString();

            await setDoc(doc(this.db, 'user_preferences', user.uid), this.userPreferences, { merge: true });

            console.log('✅ Preferences saved:', this.userPreferences);

            // Also send to backend for MongoDB storage (if available)
            try {
                await fetch('/api/user/preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await user.getIdToken()}`
                    },
                    body: JSON.stringify({
                        userId: user.uid,
                        preferences: this.userPreferences
                    })
                });
            } catch (error) {
                console.warn('Could not sync to MongoDB:', error);
                // Not critical - continue
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Erro ao salvar preferências. Tente novamente.');
        }
    }

    /**
     * Close onboarding modal
     */
    closeOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        modal?.classList.add('closing');
        setTimeout(() => {
            modal?.remove();
        }, 300);
    }

    /**
     * Show welcome toast after completing onboarding
     */
    showWelcomeToast() {
        const toast = document.createElement('div');
        toast.className = 'welcome-toast';
        toast.innerHTML = `
            <i class="ki-filled ki-check-circle"></i>
            <span>Preferências salvas! Preparando recomendações personalizadas...</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        // Trigger reload of personalized content
        window.dispatchEvent(new CustomEvent('preferences-updated'));
    }
}

export default OnboardingSystem;
