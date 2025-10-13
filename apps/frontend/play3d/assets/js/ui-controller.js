/**
 * Bitaca Play 3D - UI Controller
 * Modern, production-ready UI control system with animations and interactions
 * @version 3.0.0
 */

class BitacaUIController {
    constructor() {
        this.state = {
            isFullscreen: false,
            isCinemaMode: false,
            isRadialMenuOpen: false,
            isSettingsOpen: false,
            isHelpOpen: false,
            isLoading: false,
            currentQuality: 'high',
            volume: 0.7,
            showFPS: false,
            touchStartX: 0,
            touchStartY: 0,
            joystickActive: false
        };

        this.fps = {
            frames: 0,
            lastTime: performance.now(),
            fps: 0
        };

        this.shortcuts = {
            'f': 'Toggle Fullscreen',
            'c': 'Toggle Cinema Mode',
            'm': 'Toggle Minimap',
            's': 'Open Settings',
            'h': 'Toggle Help',
            '?': 'Show Shortcuts',
            'Escape': 'Close Menus'
        };

        this.init();
    }

    init() {
        this.createUIElements();
        this.attachEventListeners();
        this.initAnimations();
        this.startFPSCounter();
        this.checkMobile();
        this.showWelcomeAnimation();
    }

    createUIElements() {
        const uiHTML = `
            <!-- Main UI Container -->
            <div id="bitaca-ui-system" class="bitaca-ui-system">

                <!-- Loading Overlay -->
                <div id="loading-overlay" class="loading-overlay">
                    <div class="loading-content">
                        <div class="loading-logo">
                            <div class="logo-circle"></div>
                            <div class="logo-text">BITACA</div>
                        </div>
                        <div class="loading-progress">
                            <div class="progress-bar"></div>
                        </div>
                        <div class="loading-text">Loading Experience...</div>
                    </div>
                </div>

                <!-- Top Bar -->
                <div id="top-bar" class="top-bar glass-effect">
                    <div class="top-bar-left">
                        <div class="logo-mini">
                            <span class="logo-icon">▶</span>
                            <span class="logo-name">BITACA PLAY 3D</span>
                        </div>
                    </div>
                    <div class="top-bar-center">
                        <div class="world-info">
                            <span class="world-name">Cinema Lobby</span>
                            <span class="world-status">● Online</span>
                        </div>
                    </div>
                    <div class="top-bar-right">
                        <button class="icon-btn" id="fps-toggle" title="Toggle FPS Counter">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12v9H3v-9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M3 12L12 3l9 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="icon-btn" id="settings-btn" title="Settings">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="3" stroke-width="2"/>
                                <path d="M12 1v6m0 6v6M1 12h6m6 0h6" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- FPS Counter -->
                <div id="fps-counter" class="fps-counter glass-effect hidden">
                    <div class="fps-value">0</div>
                    <div class="fps-label">FPS</div>
                    <div class="performance-bars">
                        <div class="perf-bar">
                            <span>CPU</span>
                            <div class="bar"><div class="bar-fill" style="width: 45%"></div></div>
                        </div>
                        <div class="perf-bar">
                            <span>GPU</span>
                            <div class="bar"><div class="bar-fill gpu" style="width: 62%"></div></div>
                        </div>
                    </div>
                </div>

                <!-- Minimap -->
                <div id="minimap" class="minimap glass-effect">
                    <div class="minimap-header">
                        <span>MAP</span>
                        <button class="minimap-close">×</button>
                    </div>
                    <div class="minimap-canvas-container">
                        <canvas id="minimap-canvas" width="200" height="200"></canvas>
                        <div class="player-marker"></div>
                    </div>
                </div>

                <!-- Floating Action Button (FAB) -->
                <div id="fab-container" class="fab-container">
                    <button id="fab-main" class="fab-main">
                        <svg class="fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="1" fill="currentColor"/>
                            <circle cx="12" cy="5" r="1" fill="currentColor"/>
                            <circle cx="12" cy="19" r="1" fill="currentColor"/>
                        </svg>
                    </button>

                    <!-- Radial Menu Items -->
                    <div id="radial-menu" class="radial-menu hidden">
                        <button class="radial-item" data-action="cinema" title="Cinema Mode">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="7" width="20" height="15" rx="2" stroke-width="2"/>
                                <polyline points="17 2 12 7 7 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="radial-item" data-action="fullscreen" title="Fullscreen">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="radial-item" data-action="audio" title="Audio Visualizer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M9 18V5l12-2v13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="6" cy="18" r="3" stroke-width="2"/>
                                <circle cx="18" cy="16" r="3" stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="radial-item" data-action="worlds" title="World Selector">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                                <line x1="2" y1="12" x2="22" y2="12" stroke-width="2"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="radial-item" data-action="help" title="Help">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Settings Panel -->
                <div id="settings-panel" class="settings-panel glass-effect hidden">
                    <div class="settings-header">
                        <h3>Settings</h3>
                        <button class="close-btn" id="settings-close">×</button>
                    </div>
                    <div class="settings-content">

                        <!-- Quality Preset -->
                        <div class="setting-group">
                            <label class="setting-label">Graphics Quality</label>
                            <div class="quality-presets">
                                <button class="quality-btn" data-quality="low">Low</button>
                                <button class="quality-btn" data-quality="medium">Medium</button>
                                <button class="quality-btn active" data-quality="high">High</button>
                                <button class="quality-btn" data-quality="ultra">Ultra</button>
                            </div>
                        </div>

                        <!-- Volume Control -->
                        <div class="setting-group">
                            <label class="setting-label">
                                <span>Volume</span>
                                <span class="setting-value">70%</span>
                            </label>
                            <input type="range" class="slider" id="volume-slider" min="0" max="100" value="70">
                        </div>

                        <!-- Effects Toggles -->
                        <div class="setting-group">
                            <label class="setting-label">Visual Effects</label>
                            <div class="toggle-list">
                                <div class="toggle-item">
                                    <span>Shadows</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-item">
                                    <span>Reflections</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-item">
                                    <span>Bloom</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-item">
                                    <span>Anti-aliasing</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- FOV Slider -->
                        <div class="setting-group">
                            <label class="setting-label">
                                <span>Field of View</span>
                                <span class="setting-value">75°</span>
                            </label>
                            <input type="range" class="slider" id="fov-slider" min="60" max="110" value="75">
                        </div>

                        <!-- Mouse Sensitivity -->
                        <div class="setting-group">
                            <label class="setting-label">
                                <span>Mouse Sensitivity</span>
                                <span class="setting-value">50%</span>
                            </label>
                            <input type="range" class="slider" id="sensitivity-slider" min="0" max="100" value="50">
                        </div>

                    </div>
                </div>

                <!-- World Selector Modal -->
                <div id="world-modal" class="modal hidden">
                    <div class="modal-overlay"></div>
                    <div class="modal-content glass-effect">
                        <div class="modal-header">
                            <h2>Select World</h2>
                            <button class="close-btn" id="world-close">×</button>
                        </div>
                        <div class="world-grid">
                            <div class="world-card" data-world="lobby">
                                <div class="world-thumbnail">
                                    <div class="world-preview"></div>
                                </div>
                                <div class="world-info">
                                    <h4>Cinema Lobby</h4>
                                    <p>Main entrance and ticket booth</p>
                                    <div class="world-stats">
                                        <span>👥 24 online</span>
                                    </div>
                                </div>
                            </div>
                            <div class="world-card" data-world="theater">
                                <div class="world-thumbnail">
                                    <div class="world-preview theater"></div>
                                </div>
                                <div class="world-info">
                                    <h4>Theater Room</h4>
                                    <p>Watch movies with friends</p>
                                    <div class="world-stats">
                                        <span>👥 8 online</span>
                                    </div>
                                </div>
                            </div>
                            <div class="world-card" data-world="arcade">
                                <div class="world-thumbnail">
                                    <div class="world-preview arcade"></div>
                                </div>
                                <div class="world-info">
                                    <h4>Arcade Zone</h4>
                                    <p>Retro gaming area</p>
                                    <div class="world-stats">
                                        <span>👥 15 online</span>
                                    </div>
                                </div>
                            </div>
                            <div class="world-card" data-world="lounge">
                                <div class="world-thumbnail">
                                    <div class="world-preview lounge"></div>
                                </div>
                                <div class="world-info">
                                    <h4>VIP Lounge</h4>
                                    <p>Exclusive relaxation area</p>
                                    <div class="world-stats">
                                        <span>👥 5 online</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Help Overlay -->
                <div id="help-overlay" class="help-overlay hidden">
                    <div class="help-content glass-effect">
                        <div class="help-header">
                            <h2>Keyboard Shortcuts</h2>
                            <button class="close-btn" id="help-close">×</button>
                        </div>
                        <div class="shortcuts-grid">
                            ${Object.entries(this.shortcuts).map(([key, action]) => `
                                <div class="shortcut-item">
                                    <kbd class="key">${key}</kbd>
                                    <span class="action">${action}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="help-footer">
                            <h3>Movement</h3>
                            <div class="movement-keys">
                                <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                                <span>Move around</span>
                            </div>
                            <div class="movement-keys">
                                <kbd>Space</kbd>
                                <span>Jump</span>
                            </div>
                            <div class="movement-keys">
                                <kbd>Shift</kbd>
                                <span>Sprint</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notifications Container -->
                <div id="toast-container" class="toast-container"></div>

                <!-- Mobile Virtual Joystick -->
                <div id="mobile-joystick" class="mobile-joystick hidden">
                    <div class="joystick-base">
                        <div class="joystick-stick"></div>
                    </div>
                </div>

                <!-- Mobile Bottom Navigation -->
                <div id="mobile-nav" class="mobile-nav glass-effect hidden">
                    <button class="mobile-nav-btn" data-action="jump">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Jump</span>
                    </button>
                    <button class="mobile-nav-btn" data-action="interact">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5l0 14m-7-7l14 0" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Interact</span>
                    </button>
                    <button class="mobile-nav-btn" data-action="menu">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="3" y1="12" x2="21" y2="12" stroke-width="2" stroke-linecap="round"/>
                            <line x1="3" y1="6" x2="21" y2="6" stroke-width="2" stroke-linecap="round"/>
                            <line x1="3" y1="18" x2="21" y2="18" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Menu</span>
                    </button>
                </div>

            </div>
        `;

        // Inject UI HTML
        const container = document.createElement('div');
        container.innerHTML = uiHTML;
        document.body.appendChild(container.firstElementChild);

        // Inject CSS
        this.injectStyles();
    }

    injectStyles() {
        const styles = `
            <style id="bitaca-ui-styles">
                @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

                :root {
                    --bitaca-red: #C41E3A;
                    --bitaca-wheat: #F5DEB3;
                    --bg-dark: #0A0A0A;
                    --glass-bg: rgba(10, 10, 10, 0.75);
                    --glass-border: rgba(245, 222, 179, 0.15);
                    --text-primary: #FFFFFF;
                    --text-secondary: #F5DEB3;
                    --shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.6);
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .bitaca-ui-system {
                    font-family: 'Barlow', 'Inter', sans-serif;
                    color: var(--text-primary);
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10000;
                }

                .bitaca-ui-system * {
                    pointer-events: auto;
                }

                /* Glass Effect */
                .glass-effect {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    box-shadow: var(--shadow);
                }

                /* Loading Overlay */
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--bg-dark) 0%, #1a0a0f 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    opacity: 1;
                    transition: opacity 0.6s ease;
                }

                .loading-overlay.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .loading-content {
                    text-align: center;
                }

                .loading-logo {
                    position: relative;
                    margin-bottom: 40px;
                }

                .logo-circle {
                    width: 120px;
                    height: 120px;
                    border: 3px solid var(--bitaca-red);
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    border-top-color: transparent;
                    animation: spin 1.5s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .logo-text {
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: 4px;
                    color: var(--bitaca-wheat);
                }

                .loading-progress {
                    width: 300px;
                    height: 4px;
                    background: rgba(245, 222, 179, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 0 auto 20px;
                }

                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, var(--bitaca-red) 0%, var(--bitaca-wheat) 100%);
                    width: 0%;
                    animation: loadProgress 2s ease-in-out infinite;
                }

                @keyframes loadProgress {
                    0%, 100% { width: 0%; }
                    50% { width: 100%; }
                }

                .loading-text {
                    color: var(--text-secondary);
                    font-size: 14px;
                    letter-spacing: 2px;
                }

                /* Top Bar */
                .top-bar {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    height: 60px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    opacity: 0;
                    transform: translateY(-20px);
                    animation: slideDown 0.6s ease forwards 0.2s;
                }

                @keyframes slideDown {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .top-bar-left, .top-bar-center, .top-bar-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .logo-mini {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-icon {
                    color: var(--bitaca-red);
                    font-size: 24px;
                }

                .logo-name {
                    font-weight: 600;
                    font-size: 14px;
                    letter-spacing: 1px;
                }

                .world-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                }

                .world-name {
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .world-status {
                    color: #4ade80;
                    font-size: 12px;
                }

                .icon-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: none;
                    background: rgba(245, 222, 179, 0.05);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .icon-btn:hover {
                    background: rgba(196, 30, 58, 0.2);
                    color: var(--bitaca-red);
                    transform: scale(1.1);
                }

                .icon-btn:active {
                    transform: scale(0.95);
                }

                /* FPS Counter */
                .fps-counter {
                    position: absolute;
                    top: 100px;
                    right: 20px;
                    width: 180px;
                    padding: 16px;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }

                .fps-counter.hidden {
                    opacity: 0;
                    transform: translateX(20px);
                    pointer-events: none;
                }

                .fps-value {
                    font-size: 48px;
                    font-weight: 700;
                    color: var(--bitaca-red);
                    line-height: 1;
                }

                .fps-label {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-bottom: 12px;
                }

                .performance-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .perf-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                }

                .perf-bar span {
                    width: 35px;
                    color: var(--text-secondary);
                }

                .bar {
                    flex: 1;
                    height: 6px;
                    background: rgba(245, 222, 179, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    background: var(--bitaca-red);
                    transition: width 0.3s ease;
                }

                .bar-fill.gpu {
                    background: var(--bitaca-wheat);
                }

                /* Minimap */
                .minimap {
                    position: absolute;
                    top: 100px;
                    left: 20px;
                    width: 220px;
                    border-radius: 12px;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateX(-20px);
                    animation: slideRight 0.6s ease forwards 0.4s;
                }

                @keyframes slideRight {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .minimap-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    border-bottom: 1px solid var(--glass-border);
                }

                .minimap-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 20px;
                    cursor: pointer;
                    transition: color 0.3s ease;
                }

                .minimap-close:hover {
                    color: var(--bitaca-red);
                }

                .minimap-canvas-container {
                    position: relative;
                    padding: 10px;
                }

                #minimap-canvas {
                    width: 100%;
                    height: auto;
                    border-radius: 8px;
                    background: rgba(0, 0, 0, 0.5);
                }

                .player-marker {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 12px;
                    height: 12px;
                    background: var(--bitaca-red);
                    border: 2px solid var(--bitaca-wheat);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.2); }
                }

                /* Floating Action Button */
                .fab-container {
                    position: absolute;
                    bottom: 40px;
                    right: 40px;
                    opacity: 0;
                    transform: scale(0);
                    animation: fabAppear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards 0.6s;
                }

                @keyframes fabAppear {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .fab-main {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--bitaca-red) 0%, #a01730 100%);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: var(--shadow-lg);
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    position: relative;
                    z-index: 10;
                }

                .fab-main:hover {
                    transform: scale(1.1);
                    box-shadow: 0 20px 60px rgba(196, 30, 58, 0.4);
                }

                .fab-main:active {
                    transform: scale(0.95);
                }

                .fab-main.active {
                    transform: rotate(45deg);
                }

                .fab-icon {
                    transition: transform 0.3s ease;
                }

                /* Radial Menu */
                .radial-menu {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 64px;
                    height: 64px;
                    transition: all 0.3s ease;
                }

                .radial-menu.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .radial-item {
                    position: absolute;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--glass-bg) 0%, rgba(196, 30, 58, 0.1) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: translate(0, 0) scale(0);
                    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .radial-menu:not(.hidden) .radial-item:nth-child(1) {
                    animation: radialItem1 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }

                .radial-menu:not(.hidden) .radial-item:nth-child(2) {
                    animation: radialItem2 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards 0.05s;
                }

                .radial-menu:not(.hidden) .radial-item:nth-child(3) {
                    animation: radialItem3 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards 0.1s;
                }

                .radial-menu:not(.hidden) .radial-item:nth-child(4) {
                    animation: radialItem4 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards 0.15s;
                }

                .radial-menu:not(.hidden) .radial-item:nth-child(5) {
                    animation: radialItem5 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards 0.2s;
                }

                @keyframes radialItem1 {
                    to {
                        opacity: 1;
                        transform: translate(-110px, -40px) scale(1);
                    }
                }

                @keyframes radialItem2 {
                    to {
                        opacity: 1;
                        transform: translate(-80px, -100px) scale(1);
                    }
                }

                @keyframes radialItem3 {
                    to {
                        opacity: 1;
                        transform: translate(-20px, -120px) scale(1);
                    }
                }

                @keyframes radialItem4 {
                    to {
                        opacity: 1;
                        transform: translate(40px, -100px) scale(1);
                    }
                }

                @keyframes radialItem5 {
                    to {
                        opacity: 1;
                        transform: translate(70px, -40px) scale(1);
                    }
                }

                .radial-item:hover {
                    background: linear-gradient(135deg, var(--bitaca-red) 0%, #a01730 100%);
                    color: white;
                    transform: translate(var(--tx), var(--ty)) scale(1.2) !important;
                }

                /* Settings Panel */
                .settings-panel {
                    position: absolute;
                    top: 50%;
                    right: 20px;
                    transform: translateY(-50%) translateX(400px);
                    width: 360px;
                    max-height: 80vh;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .settings-panel:not(.hidden) {
                    transform: translateY(-50%) translateX(0);
                }

                .settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--glass-border);
                }

                .settings-header h3 {
                    font-size: 20px;
                    font-weight: 600;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 28px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    line-height: 1;
                }

                .close-btn:hover {
                    color: var(--bitaca-red);
                    transform: rotate(90deg);
                }

                .settings-content {
                    padding: 24px;
                    overflow-y: auto;
                    max-height: calc(80vh - 80px);
                }

                .setting-group {
                    margin-bottom: 32px;
                }

                .setting-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .setting-value {
                    color: var(--bitaca-red);
                    font-weight: 600;
                }

                /* Quality Presets */
                .quality-presets {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }

                .quality-btn {
                    padding: 12px;
                    border: 1px solid var(--glass-border);
                    background: rgba(245, 222, 179, 0.05);
                    color: var(--text-secondary);
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .quality-btn:hover {
                    background: rgba(196, 30, 58, 0.1);
                    border-color: var(--bitaca-red);
                    transform: translateY(-2px);
                }

                .quality-btn.active {
                    background: var(--bitaca-red);
                    color: white;
                    border-color: var(--bitaca-red);
                }

                /* Slider */
                .slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(245, 222, 179, 0.1);
                    outline: none;
                    -webkit-appearance: none;
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--bitaca-red);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .slider::-webkit-slider-thumb:hover {
                    background: #d92845;
                    transform: scale(1.2);
                }

                .slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--bitaca-red);
                    cursor: pointer;
                    border: none;
                    transition: all 0.3s ease;
                }

                .slider::-moz-range-thumb:hover {
                    background: #d92845;
                    transform: scale(1.2);
                }

                /* Toggle Switch */
                .toggle-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .toggle-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: rgba(245, 222, 179, 0.05);
                    border-radius: 8px;
                }

                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(245, 222, 179, 0.1);
                    transition: 0.4s;
                    border-radius: 24px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: var(--text-secondary);
                    transition: 0.4s;
                    border-radius: 50%;
                }

                .toggle-switch input:checked + .toggle-slider {
                    background-color: var(--bitaca-red);
                }

                .toggle-switch input:checked + .toggle-slider:before {
                    transform: translateX(20px);
                    background-color: white;
                }

                /* Modal */
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 20000;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .modal:not(.hidden) {
                    opacity: 1;
                    pointer-events: auto;
                }

                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                }

                .modal-content {
                    position: relative;
                    width: 90%;
                    max-width: 900px;
                    max-height: 80vh;
                    border-radius: 20px;
                    overflow: hidden;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }

                .modal:not(.hidden) .modal-content {
                    transform: scale(1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 32px;
                    border-bottom: 1px solid var(--glass-border);
                }

                .modal-header h2 {
                    font-size: 24px;
                    font-weight: 600;
                }

                /* World Grid */
                .world-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                    padding: 32px;
                    overflow-y: auto;
                    max-height: calc(80vh - 100px);
                }

                .world-card {
                    background: rgba(245, 222, 179, 0.03);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .world-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--bitaca-red);
                    box-shadow: 0 12px 32px rgba(196, 30, 58, 0.3);
                }

                .world-thumbnail {
                    height: 160px;
                    overflow: hidden;
                    position: relative;
                }

                .world-preview {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--bitaca-red) 0%, #1a0a0f 100%);
                    transition: transform 0.3s ease;
                }

                .world-preview.theater {
                    background: linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%);
                }

                .world-preview.arcade {
                    background: linear-gradient(135deg, #f59e0b 0%, #451a03 100%);
                }

                .world-preview.lounge {
                    background: linear-gradient(135deg, #8b5cf6 0%, #2e1065 100%);
                }

                .world-card:hover .world-preview {
                    transform: scale(1.1);
                }

                .world-info {
                    padding: 16px;
                }

                .world-info h4 {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .world-info p {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-bottom: 12px;
                }

                .world-stats {
                    font-size: 12px;
                    color: #4ade80;
                }

                /* Help Overlay */
                .help-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(20px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 20000;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .help-overlay:not(.hidden) {
                    opacity: 1;
                    pointer-events: auto;
                }

                .help-content {
                    width: 90%;
                    max-width: 700px;
                    border-radius: 20px;
                    padding: 32px;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }

                .help-overlay:not(.hidden) .help-content {
                    transform: scale(1);
                }

                .help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .help-header h2 {
                    font-size: 24px;
                    font-weight: 600;
                }

                .shortcuts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .shortcut-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(245, 222, 179, 0.05);
                    border-radius: 8px;
                }

                kbd {
                    display: inline-block;
                    padding: 6px 12px;
                    background: var(--bitaca-red);
                    color: white;
                    border-radius: 6px;
                    font-family: 'Barlow', monospace;
                    font-size: 12px;
                    font-weight: 600;
                    min-width: 32px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .key {
                    text-transform: uppercase;
                }

                .action {
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .help-footer {
                    border-top: 1px solid var(--glass-border);
                    padding-top: 24px;
                }

                .help-footer h3 {
                    font-size: 18px;
                    margin-bottom: 16px;
                }

                .movement-keys {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .movement-keys kbd {
                    margin-right: 4px;
                }

                .movement-keys span {
                    color: var(--text-secondary);
                    font-size: 13px;
                }

                /* Toast Notifications */
                .toast-container {
                    position: fixed;
                    bottom: 120px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 30000;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: none;
                }

                .toast {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    padding: 16px 24px;
                    color: white;
                    font-size: 14px;
                    box-shadow: var(--shadow);
                    animation: toastIn 0.3s ease;
                    pointer-events: auto;
                }

                @keyframes toastIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .toast.success {
                    border-left: 4px solid #4ade80;
                }

                .toast.error {
                    border-left: 4px solid #ef4444;
                }

                .toast.info {
                    border-left: 4px solid var(--bitaca-wheat);
                }

                /* Mobile Controls */
                .mobile-joystick {
                    position: absolute;
                    bottom: 100px;
                    left: 40px;
                    width: 120px;
                    height: 120px;
                }

                .mobile-joystick.hidden {
                    display: none;
                }

                .joystick-base {
                    width: 100%;
                    height: 100%;
                    background: rgba(245, 222, 179, 0.1);
                    backdrop-filter: blur(10px);
                    border: 2px solid var(--glass-border);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .joystick-stick {
                    width: 50px;
                    height: 50px;
                    background: var(--bitaca-red);
                    border-radius: 50%;
                    position: absolute;
                    transition: all 0.1s ease;
                    pointer-events: none;
                }

                /* Mobile Navigation */
                .mobile-nav {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 12px;
                    padding: 12px 20px;
                    border-radius: 16px;
                }

                .mobile-nav.hidden {
                    display: none;
                }

                .mobile-nav-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 16px;
                    background: rgba(245, 222, 179, 0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .mobile-nav-btn:active {
                    background: var(--bitaca-red);
                    color: white;
                    transform: scale(0.95);
                }

                .mobile-nav-btn span {
                    font-size: 11px;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .top-bar {
                        left: 10px;
                        right: 10px;
                        padding: 0 16px;
                    }

                    .logo-name {
                        display: none;
                    }

                    .world-info {
                        font-size: 12px;
                    }

                    .fps-counter {
                        width: 140px;
                        right: 10px;
                    }

                    .minimap {
                        width: 160px;
                        left: 10px;
                    }

                    .fab-container {
                        bottom: 120px;
                        right: 20px;
                    }

                    .settings-panel {
                        width: calc(100% - 40px);
                        right: 20px;
                    }

                    .world-grid {
                        grid-template-columns: 1fr;
                        padding: 20px;
                    }

                    .help-content {
                        padding: 24px;
                    }

                    .shortcuts-grid {
                        grid-template-columns: 1fr;
                    }
                }

                /* Utility Classes */
                .hidden {
                    opacity: 0 !important;
                    pointer-events: none !important;
                }

                /* Ripple Effect */
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    transform: scale(0);
                    animation: rippleEffect 0.6s ease-out;
                    pointer-events: none;
                }

                @keyframes rippleEffect {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }

                /* Scrollbar Styles */
                .settings-content::-webkit-scrollbar,
                .world-grid::-webkit-scrollbar {
                    width: 8px;
                }

                .settings-content::-webkit-scrollbar-track,
                .world-grid::-webkit-scrollbar-track {
                    background: rgba(245, 222, 179, 0.05);
                    border-radius: 4px;
                }

                .settings-content::-webkit-scrollbar-thumb,
                .world-grid::-webkit-scrollbar-thumb {
                    background: var(--bitaca-red);
                    border-radius: 4px;
                }

                .settings-content::-webkit-scrollbar-thumb:hover,
                .world-grid::-webkit-scrollbar-thumb:hover {
                    background: #d92845;
                }
            </style>
        `;

        const styleElement = document.createElement('div');
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement.firstElementChild);
    }

    attachEventListeners() {
        // FAB and Radial Menu
        const fabMain = document.getElementById('fab-main');
        const radialMenu = document.getElementById('radial-menu');

        fabMain.addEventListener('click', () => {
            this.toggleRadialMenu();
        });

        // Radial Menu Actions
        document.querySelectorAll('.radial-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleRadialAction(action);
                this.createRipple(e);
            });
        });

        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const settingsClose = document.getElementById('settings-close');

        settingsBtn.addEventListener('click', () => this.toggleSettings());
        settingsClose.addEventListener('click', () => this.toggleSettings());

        // Quality Presets
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.currentQuality = e.target.dataset.quality;
                this.showToast(`Quality set to ${e.target.dataset.quality}`, 'success');
            });
        });

        // Volume Slider
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            this.state.volume = e.target.value / 100;
            e.target.closest('.setting-group').querySelector('.setting-value').textContent = `${e.target.value}%`;
        });

        // FOV Slider
        const fovSlider = document.getElementById('fov-slider');
        fovSlider.addEventListener('input', (e) => {
            e.target.closest('.setting-group').querySelector('.setting-value').textContent = `${e.target.value}°`;
        });

        // Sensitivity Slider
        const sensitivitySlider = document.getElementById('sensitivity-slider');
        sensitivitySlider.addEventListener('input', (e) => {
            e.target.closest('.setting-group').querySelector('.setting-value').textContent = `${e.target.value}%`;
        });

        // FPS Toggle
        const fpsToggle = document.getElementById('fps-toggle');
        fpsToggle.addEventListener('click', () => this.toggleFPS());

        // World Modal
        const worldModal = document.getElementById('world-modal');
        const worldClose = document.getElementById('world-close');
        worldClose.addEventListener('click', () => this.closeWorldModal());
        worldModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeWorldModal());

        // World Cards
        document.querySelectorAll('.world-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const world = e.currentTarget.dataset.world;
                this.loadWorld(world);
            });
        });

        // Help Overlay
        const helpOverlay = document.getElementById('help-overlay');
        const helpClose = document.getElementById('help-close');
        helpClose.addEventListener('click', () => this.toggleHelp());
        helpOverlay.addEventListener('click', (e) => {
            if (e.target === helpOverlay) this.toggleHelp();
        });

        // Minimap Close
        const minimapClose = document.querySelector('.minimap-close');
        minimapClose.addEventListener('click', () => {
            document.getElementById('minimap').classList.add('hidden');
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Mobile Touch Events
        this.setupMobileControls();

        // Click Outside to Close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container') &&
                !e.target.closest('.settings-panel') &&
                this.state.isRadialMenuOpen) {
                this.toggleRadialMenu();
            }
        });
    }

    initAnimations() {
        // Initialize minimap drawing
        this.drawMinimap();
    }

    toggleRadialMenu() {
        const fabMain = document.getElementById('fab-main');
        const radialMenu = document.getElementById('radial-menu');

        this.state.isRadialMenuOpen = !this.state.isRadialMenuOpen;

        if (this.state.isRadialMenuOpen) {
            fabMain.classList.add('active');
            radialMenu.classList.remove('hidden');
        } else {
            fabMain.classList.remove('active');
            radialMenu.classList.add('hidden');
        }
    }

    handleRadialAction(action) {
        switch (action) {
            case 'cinema':
                this.toggleCinemaMode();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'audio':
                this.showToast('Audio visualizer toggled', 'info');
                break;
            case 'worlds':
                this.openWorldModal();
                break;
            case 'help':
                this.toggleHelp();
                break;
        }
        this.toggleRadialMenu();
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        this.state.isSettingsOpen = !this.state.isSettingsOpen;
        settingsPanel.classList.toggle('hidden');
    }

    toggleFPS() {
        const fpsCounter = document.getElementById('fps-counter');
        this.state.showFPS = !this.state.showFPS;
        fpsCounter.classList.toggle('hidden');
    }

    toggleCinemaMode() {
        this.state.isCinemaMode = !this.state.isCinemaMode;
        const topBar = document.getElementById('top-bar');
        const minimap = document.getElementById('minimap');
        const fabContainer = document.getElementById('fab-container');

        if (this.state.isCinemaMode) {
            topBar.style.opacity = '0';
            topBar.style.pointerEvents = 'none';
            minimap.style.opacity = '0';
            minimap.style.pointerEvents = 'none';
            fabContainer.style.opacity = '0.3';
            this.showToast('Cinema mode enabled', 'success');
        } else {
            topBar.style.opacity = '1';
            topBar.style.pointerEvents = 'auto';
            minimap.style.opacity = '1';
            minimap.style.pointerEvents = 'auto';
            fabContainer.style.opacity = '1';
            this.showToast('Cinema mode disabled', 'info');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.state.isFullscreen = true;
            this.showToast('Fullscreen enabled', 'success');
        } else {
            document.exitFullscreen();
            this.state.isFullscreen = false;
            this.showToast('Fullscreen disabled', 'info');
        }
    }

    openWorldModal() {
        const worldModal = document.getElementById('world-modal');
        worldModal.classList.remove('hidden');
    }

    closeWorldModal() {
        const worldModal = document.getElementById('world-modal');
        worldModal.classList.add('hidden');
    }

    loadWorld(world) {
        this.closeWorldModal();
        this.showLoading();

        setTimeout(() => {
            this.hideLoading();
            this.showToast(`Loaded ${world} world`, 'success');
            document.querySelector('.world-name').textContent = world.charAt(0).toUpperCase() + world.slice(1);
        }, 2000);
    }

    toggleHelp() {
        const helpOverlay = document.getElementById('help-overlay');
        this.state.isHelpOpen = !this.state.isHelpOpen;
        helpOverlay.classList.toggle('hidden');
    }

    handleKeyboard(e) {
        switch (e.key.toLowerCase()) {
            case 'f':
                if (!e.target.matches('input, textarea')) {
                    this.toggleFullscreen();
                }
                break;
            case 'c':
                if (!e.target.matches('input, textarea')) {
                    this.toggleCinemaMode();
                }
                break;
            case 's':
                if (!e.target.matches('input, textarea')) {
                    this.toggleSettings();
                }
                break;
            case 'h':
                if (!e.target.matches('input, textarea')) {
                    this.toggleHelp();
                }
                break;
            case '?':
                this.toggleHelp();
                break;
            case 'escape':
                if (this.state.isHelpOpen) this.toggleHelp();
                if (this.state.isSettingsOpen) this.toggleSettings();
                if (this.state.isRadialMenuOpen) this.toggleRadialMenu();
                this.closeWorldModal();
                break;
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    createRipple(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.add('hidden');
    }

    showWelcomeAnimation() {
        setTimeout(() => {
            this.hideLoading();
            this.showToast('Welcome to Bitaca Play 3D!', 'success');
        }, 2500);
    }

    startFPSCounter() {
        const updateFPS = () => {
            this.fps.frames++;
            const now = performance.now();
            const delta = now - this.fps.lastTime;

            if (delta >= 1000) {
                this.fps.fps = Math.round((this.fps.frames * 1000) / delta);
                this.fps.frames = 0;
                this.fps.lastTime = now;

                const fpsValue = document.querySelector('.fps-value');
                if (fpsValue) {
                    fpsValue.textContent = this.fps.fps;

                    // Update color based on performance
                    if (this.fps.fps >= 50) {
                        fpsValue.style.color = '#4ade80';
                    } else if (this.fps.fps >= 30) {
                        fpsValue.style.color = '#f59e0b';
                    } else {
                        fpsValue.style.color = '#ef4444';
                    }
                }
            }

            requestAnimationFrame(updateFPS);
        };

        updateFPS();
    }

    drawMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Draw simple map
        ctx.fillStyle = 'rgba(196, 30, 58, 0.3)';
        ctx.fillRect(50, 50, 100, 100);

        ctx.strokeStyle = 'rgba(245, 222, 179, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, 100, 100);

        // Draw some obstacles
        ctx.fillStyle = 'rgba(245, 222, 179, 0.2)';
        ctx.fillRect(70, 70, 30, 30);
        ctx.fillRect(120, 100, 20, 40);
    }

    checkMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            document.getElementById('mobile-joystick').classList.remove('hidden');
            document.getElementById('mobile-nav').classList.remove('hidden');
        }
    }

    setupMobileControls() {
        const joystickBase = document.querySelector('.joystick-base');
        const joystickStick = document.querySelector('.joystick-stick');

        if (!joystickBase || !joystickStick) return;

        let joystickActive = false;
        let startX = 0;
        let startY = 0;

        joystickBase.addEventListener('touchstart', (e) => {
            joystickActive = true;
            const touch = e.touches[0];
            const rect = joystickBase.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        });

        joystickBase.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            const maxDistance = 35;
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
            const angle = Math.atan2(deltaY, deltaX);

            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            joystickStick.style.transform = `translate(${x}px, ${y}px)`;
        });

        joystickBase.addEventListener('touchend', () => {
            joystickActive = false;
            joystickStick.style.transform = 'translate(0, 0)';
        });

        // Mobile nav buttons
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                switch (action) {
                    case 'jump':
                        this.showToast('Jump!', 'info');
                        break;
                    case 'interact':
                        this.showToast('Interact', 'info');
                        break;
                    case 'menu':
                        this.toggleRadialMenu();
                        break;
                }
            });
        });
    }

    // Public API for external control
    updateWorldInfo(worldName, onlineCount) {
        document.querySelector('.world-name').textContent = worldName;
        document.querySelector('.world-status').textContent = `● ${onlineCount} online`;
    }

    setLoadingProgress(percentage) {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    destroy() {
        const uiSystem = document.getElementById('bitaca-ui-system');
        const uiStyles = document.getElementById('bitaca-ui-styles');

        if (uiSystem) uiSystem.remove();
        if (uiStyles) uiStyles.remove();
    }
}

// Initialize UI Controller when DOM is ready
if (typeof window !== 'undefined') {
    window.BitacaUIController = BitacaUIController;

    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.bitacaUI = new BitacaUIController();
        });
    } else {
        window.bitacaUI = new BitacaUIController();
    }
}

export default BitacaUIController;
