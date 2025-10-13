// ===============================================
// BITACA CINEMA - VOTING STATISTICS DASHBOARD
// Real-time voting analytics with D3.js visualizations
// ===============================================

import D3Visualizations from './d3-visualizations.js';
import {
    collection,
    getFirestore,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {app} from '../firebase-config.js';

const db = getFirestore(app);

export class VotingStatsDashboard {
    constructor() {
        this.visualizations = null;
        this.unsubscribers = [];
        this.statsData = {
            totalVotes: 0,
            averageRating: 0,
            mostVotedFilm: null,
            recentVotes: [],
            filmRatings: [],
            themeDistribution: {},
            votingTimeline: []
        };
    }

    async init() {
        console.log('🔍 Initializing Voting Statistics Dashboard...');

        // Create dashboard UI
        this.createDashboardUI();

        // Initialize D3 visualizations
        const vizContainer = document.getElementById('d3-viz-container');
        if (vizContainer) {
            this.visualizations = new D3Visualizations('d3-viz-container');
        }

        // Load initial data
        await this.loadAllStats();

        // Setup real-time listeners
        this.setupRealtimeListeners();

        console.log('✅ Dashboard initialized');
    }

    createDashboardUI() {
        // Check if dashboard already exists
        if (document.getElementById('voting-stats-dashboard')) {
            return;
        }

        const dashboardHTML = `
            <div id="voting-stats-dashboard" class="stats-dashboard hidden">
                <!-- Dashboard Header -->
                <div class="dashboard-header">
                    <div class="dashboard-title">
                        <i class="ki-filled ki-chart-simple-3"></i>
                        <h2>Painel de Estatísticas</h2>
                    </div>
                    <button class="dashboard-close" id="close-dashboard">
                        <i class="ki-filled ki-cross"></i>
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="stats-cards-grid">
                    <div class="stat-card stat-card--primary">
                        <div class="stat-icon">
                            <i class="ki-filled ki-star"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="total-votes-stat">0</span>
                            <span class="stat-label">Total de Votos</span>
                        </div>
                    </div>

                    <div class="stat-card stat-card--success">
                        <div class="stat-icon">
                            <i class="ki-filled ki-chart-line-up-2"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="avg-rating-stat">0</span>
                            <span class="stat-label">Média Geral</span>
                        </div>
                    </div>

                    <div class="stat-card stat-card--info">
                        <div class="stat-icon">
                            <i class="ki-filled ki-cup"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="top-film-stat">-</span>
                            <span class="stat-label">Filme Mais Votado</span>
                        </div>
                    </div>

                    <div class="stat-card stat-card--warning">
                        <div class="stat-icon">
                            <i class="ki-filled ki-users"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value" id="active-users-stat">0</span>
                            <span class="stat-label">Usuários Ativos</span>
                        </div>
                    </div>
                </div>

                <!-- Visualization Tabs -->
                <div class="dashboard-tabs">
                    <button class="tab-btn active" data-tab="ratings">
                        <i class="ki-filled ki-chart-line-star"></i> Avaliações
                    </button>
                    <button class="tab-btn" data-tab="themes">
                        <i class="ki-filled ki-graph"></i> Eixos Temáticos
                    </button>
                    <button class="tab-btn" data-tab="timeline">
                        <i class="ki-filled ki-calendar"></i> Linha do Tempo
                    </button>
                    <button class="tab-btn" data-tab="network">
                        <i class="ki-filled ki-category"></i> Relações
                    </button>
                </div>

                <!-- Visualization Container -->
                <div class="dashboard-viz-wrapper">
                    <div id="d3-viz-container" class="d3-viz-container"></div>

                    <!-- Tab Content Containers -->
                    <div id="viz-ratings" class="viz-panel active"></div>
                    <div id="viz-themes" class="viz-panel"></div>
                    <div id="viz-timeline" class="viz-panel"></div>
                    <div id="viz-network" class="viz-panel"></div>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <h3>
                        <i class="ki-filled ki-pulse"></i> Atividade Recente
                    </h3>
                    <div id="recent-votes-list" class="activity-list">
                        <!-- Real-time votes will appear here -->
                    </div>
                </div>

                <!-- Voice Mode Integration -->
                <div class="voice-mode-section" id="voice-mode-section" style="display: none;">
                    <div class="voice-mode-header">
                        <i class="ki-filled ki-microphone-2"></i>
                        <h3>Modo de Voz Ativo</h3>
                    </div>
                    <div class="voice-viz-container">
                        <!-- Voice-activated visualizations -->
                        <div id="voice-current-viz"></div>
                    </div>
                    <div class="voice-controls">
                        <button class="voice-btn" data-command="show-ratings">
                            <i class="ki-filled ki-star"></i> Ver Avaliações
                        </button>
                        <button class="voice-btn" data-command="show-themes">
                            <i class="ki-filled ki-graph"></i> Ver Temas
                        </button>
                        <button class="voice-btn" data-command="show-top">
                            <i class="ki-filled ki-cup"></i> Ver Top 5
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dashboardHTML);

        // Add CSS
        this.injectDashboardStyles();

        // Setup event listeners
        this.setupDashboardListeners();
    }

    setupDashboardListeners() {
        // Close dashboard
        const closeBtn = document.getElementById('close-dashboard');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDashboard());
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Voice mode buttons
        const voiceBtns = document.querySelectorAll('.voice-btn');
        voiceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.currentTarget.dataset.command;
                this.handleVoiceCommand(command);
            });
        });
    }

    async loadAllStats() {
        try {
            // Load film votes
            const votesSnapshot = await getDocs(collection(db, 'filmVotes'));
            const filmRatings = [];
            const themeDistribution = { patrimonio: 0, musica: 0, ambiente: 0 };

            let totalVotes = 0;
            let sumRatings = 0;
            let mostVoted = { count: 0, film: null };

            votesSnapshot.forEach(doc => {
                const data = doc.data();
                const filmId = data.filmId;
                const film = this.getFilmById(filmId);

                if (film) {
                    filmRatings.push({
                        filmId,
                        title: film.titulo,
                        averageRating: data.averageRating || 0,
                        voteCount: data.count || 0,
                        theme: film.tema
                    });

                    totalVotes += data.count || 0;
                    sumRatings += (data.averageRating || 0) * (data.count || 0);

                    // Track most voted
                    if (data.count > mostVoted.count) {
                        mostVoted = { count: data.count, film: film.titulo };
                    }

                    // Count themes
                    if (film.tema === 'patrimonio') themeDistribution.patrimonio++;
                    else if (film.tema === 'musica') themeDistribution.musica++;
                    else if (film.tema === 'meio-ambiente') themeDistribution.ambiente++;
                }
            });

            // Update stats data
            this.statsData.totalVotes = totalVotes;
            this.statsData.averageRating = totalVotes > 0 ? sumRatings / totalVotes : 0;
            this.statsData.mostVotedFilm = mostVoted.film;
            this.statsData.filmRatings = filmRatings;
            this.statsData.themeDistribution = themeDistribution;

            // Update UI
            this.updateStatsCards();
            this.renderCurrentVisualization();

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsCards() {
        document.getElementById('total-votes-stat').textContent = this.statsData.totalVotes;
        document.getElementById('avg-rating-stat').textContent = this.statsData.averageRating.toFixed(1);
        document.getElementById('top-film-stat').textContent = this.statsData.mostVotedFilm || '-';
        document.getElementById('active-users-stat').textContent = this.calculateActiveUsers();
    }

    calculateActiveUsers() {
        // Count unique voters (simplified)
        return Math.floor(this.statsData.totalVotes / 5); // Estimate: avg 5 votes per user
    }

    renderCurrentVisualization() {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'ratings';

        // Clear all panels
        document.querySelectorAll('.viz-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Show active panel
        const activePanel = document.getElementById(`viz-${activeTab}`);
        if (activePanel) {
            activePanel.classList.add('active');
        }

        // Render visualization based on tab
        switch (activeTab) {
            case 'ratings':
                this.renderRatingsVisualization(activePanel);
                break;
            case 'themes':
                this.renderThemesVisualization(activePanel);
                break;
            case 'timeline':
                this.renderTimelineVisualization(activePanel);
                break;
            case 'network':
                this.renderNetworkVisualization(activePanel);
                break;
        }
    }

    renderRatingsVisualization(container) {
        if (!this.visualizations) return;
        this.visualizations.createFilmRatingsChart(this.statsData.filmRatings, container);
    }

    renderThemesVisualization(container) {
        if (!this.visualizations) return;
        this.visualizations.createThemeDistributionChart(this.statsData.themeDistribution, container);
    }

    renderTimelineVisualization(container) {
        if (!this.visualizations) return;

        // Generate mock timeline data (in production, fetch from Firestore)
        const timelineData = this.generateTimelineData();
        this.visualizations.createVotingTimelineChart(timelineData, container);
    }

    renderNetworkVisualization(container) {
        if (!this.visualizations) return;

        // Prepare network data
        const nodes = this.statsData.filmRatings.map(film => ({
            id: film.filmId,
            title: film.title.substring(0, 20),
            voteCount: film.voteCount,
            rating: film.averageRating,
            theme: film.theme
        }));

        // Create links based on similar vote patterns (simplified)
        const links = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].theme === nodes[j].theme) {
                    links.push({
                        source: nodes[i].id,
                        target: nodes[j].id,
                        value: Math.random() * 5 + 1
                    });
                }
            }
        }

        this.visualizations.createFilmNetworkGraph(nodes, links, container);
    }

    generateTimelineData() {
        // Generate 30 days of mock data
        const data = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            data.push({
                date,
                votes: Math.floor(Math.random() * 50) + 10
            });
        }
        return data;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Render new visualization
        this.renderCurrentVisualization();
    }

    handleVoiceCommand(command) {
        console.log(`Voice command: ${command}`);

        switch (command) {
            case 'show-ratings':
                this.switchTab('ratings');
                break;
            case 'show-themes':
                this.switchTab('themes');
                break;
            case 'show-top':
                this.showTopFilms();
                break;
        }
    }

    showTopFilms() {
        const top5 = this.statsData.filmRatings
            .sort((a, b) => b.voteCount - a.voteCount)
            .slice(0, 5);

        const voiceViz = document.getElementById('voice-current-viz');
        if (voiceViz) {
            voiceViz.innerHTML = `
                <h4>Top 5 Filmes Mais Votados</h4>
                <ol class="top-films-list">
                    ${top5.map(film => `
                        <li>
                            <strong>${film.title}</strong><br>
                            ⭐ ${film.averageRating.toFixed(1)}/5 (${film.voteCount} votos)
                        </li>
                    `).join('')}
                </ol>
            `;
        }
    }

    setupRealtimeListeners() {
        // Listen to new votes
        const votesQuery = query(
            collection(db, 'votes'),
            orderBy('timestamp', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(votesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    this.addRecentVote(data);
                }
            });
        });

        this.unsubscribers.push(unsubscribe);
    }

    addRecentVote(voteData) {
        const film = this.getFilmById(voteData.filmId);
        if (!film) return;

        const activityList = document.getElementById('recent-votes-list');
        if (!activityList) return;

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item animate-fade-in';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="ki-filled ki-star"></i>
            </div>
            <div class="activity-info">
                <strong>${film.titulo}</strong>
                <span>${voteData.rating} estrelas</span>
                <span class="activity-time">agora</span>
            </div>
        `;

        activityList.prepend(activityItem);

        // Remove old items (keep max 10)
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }

        // Reload stats
        this.loadAllStats();
    }

    getFilmById(filmId) {
        return window.filmesData?.find(f => f.id === filmId);
    }

    openDashboard() {
        const dashboard = document.getElementById('voting-stats-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            this.loadAllStats();
        }
    }

    closeDashboard() {
        const dashboard = document.getElementById('voting-stats-dashboard');
        if (dashboard) {
            dashboard.classList.add('hidden');
        }
    }

    enableVoiceMode() {
        const voiceSection = document.getElementById('voice-mode-section');
        if (voiceSection) {
            voiceSection.style.display = 'block';
        }
    }

    disableVoiceMode() {
        const voiceSection = document.getElementById('voice-mode-section');
        if (voiceSection) {
            voiceSection.style.display = 'none';
        }
    }

    destroy() {
        // Unsubscribe from all listeners
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];

        // Clear visualizations
        if (this.visualizations) {
            this.visualizations.clearAll();
        }
    }

    injectDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .stats-dashboard {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(10, 10, 10, 0.95);
                z-index: 10000;
                overflow-y: auto;
                padding: 2rem;
                transition: opacity 0.3s ease;
            }

            .stats-dashboard.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .dashboard-title {
                display: flex;
                align-items: center;
                gap: 1rem;
                color: #F5DEB3;
            }

            .dashboard-title i {
                font-size: 2rem;
                color: #C41E3A;
            }

            .dashboard-title h2 {
                font-size: 2rem;
                margin: 0;
            }

            .dashboard-close {
                background: #C41E3A;
                color: #F5DEB3;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                transition: transform 0.2s;
            }

            .dashboard-close:hover {
                transform: scale(1.1);
            }

            .stats-cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .stat-card {
                background: #1A1A1A;
                border-radius: 12px;
                padding: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }

            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(196, 30, 58, 0.2);
            }

            .stat-card--primary { border-color: #C41E3A; }
            .stat-card--success { border-color: #2D5016; }
            .stat-card--info { border-color: #8B4513; }
            .stat-card--warning { border-color: #FFB700; }

            .stat-icon {
                font-size: 2.5rem;
                color: #C41E3A;
            }

            .stat-info {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #F5DEB3;
            }

            .stat-label {
                font-size: 0.9rem;
                color: #A0A0A0;
            }

            .dashboard-tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                border-bottom: 2px solid #2A2A2A;
            }

            .tab-btn {
                background: transparent;
                border: none;
                color: #A0A0A0;
                padding: 1rem 1.5rem;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .tab-btn.active {
                color: #C41E3A;
                border-bottom-color: #C41E3A;
            }

            .tab-btn:hover {
                color: #F5DEB3;
            }

            .dashboard-viz-wrapper {
                background: #1A1A1A;
                border-radius: 12px;
                padding: 2rem;
                margin-bottom: 2rem;
                min-height: 500px;
            }

            .viz-panel {
                display: none;
            }

            .viz-panel.active {
                display: block;
            }

            .recent-activity {
                background: #1A1A1A;
                border-radius: 12px;
                padding: 1.5rem;
            }

            .recent-activity h3 {
                color: #F5DEB3;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .activity-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .activity-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                background: #0A0A0A;
                padding: 1rem;
                border-radius: 8px;
                border-left: 3px solid #C41E3A;
            }

            .activity-icon {
                font-size: 1.5rem;
                color: #C41E3A;
            }

            .activity-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                color: #F5DEB3;
            }

            .activity-time {
                font-size: 0.8rem;
                color: #A0A0A0;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .animate-fade-in {
                animation: fadeIn 0.5s ease;
            }

            .voice-mode-section {
                background: #1A1A1A;
                border-radius: 12px;
                padding: 2rem;
                margin-top: 2rem;
                border: 2px solid #C41E3A;
            }

            .voice-mode-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
                color: #F5DEB3;
            }

            .voice-mode-header i {
                font-size: 2rem;
                color: #C41E3A;
            }

            .voice-controls {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }

            .voice-btn {
                flex: 1;
                background: linear-gradient(135deg, #C41E3A, #9B1B30);
                color: #F5DEB3;
                border: none;
                border-radius: 8px;
                padding: 1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: transform 0.2s;
            }

            .voice-btn:hover {
                transform: translateY(-2px);
            }

            @media (max-width: 768px) {
                .stats-dashboard {
                    padding: 1rem;
                }

                .dashboard-tabs {
                    flex-wrap: wrap;
                }

                .voice-controls {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export singleton instance
export const votingStatsDashboard = new VotingStatsDashboard();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        votingStatsDashboard.init();
    });
} else {
    votingStatsDashboard.init();
}

export default VotingStatsDashboard;
