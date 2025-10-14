/**
 * Analytics Tracker with Click Heatmap & RL Feedback
 * Tracks user behavior for continuous learning and personalization
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export class AnalyticsTracker {
    constructor() {
        this.db = getFirestore(window.firebaseApp);
        this.auth = getAuth(window.firebaseApp);
        this.sessionId = this.generateSessionId();
        this.clicks = [];
        this.events = [];
        this.deviceInfo = this.getDeviceInfo();
        this.startTime = Date.now();
        this.currentContent = null;
        this.heatmapCanvas = null;

        // RL State
        this.rlState = {
            actions: [],
            rewards: [],
            states: []
        };

        this.setupTracking();
        console.log('Analytics Tracker initialized', this.deviceInfo);
    }

    /**
     * Generate unique session ID
     * @returns {string}
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Get device information (fingerprinting)
     * @returns {Object}
     */
    getDeviceInfo() {
        const ua = navigator.userAgent;
        const screen = window.screen;

        return {
            // Device type
            deviceType: this.getDeviceType(),
            isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
            isTablet: /iPad|Android.*Tablet/i.test(ua),

            // Browser info
            browser: this.getBrowserInfo(),
            os: this.getOS(),

            // Screen info
            screenWidth: screen.width,
            screenHeight: screen.height,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,

            // Viewport
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,

            // Device fingerprint (simplified)
            fingerprint: this.generateFingerprint(),

            // Language & timezone
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Connection
            connection: this.getConnectionInfo(),

            // Touch support
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    }

    /**
     * Get device type
     * @returns {string}
     */
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobile|Android.*Mobile|iPhone/i.test(ua)) return 'mobile';
        if (/iPad|Android.*Tablet/i.test(ua)) return 'tablet';
        return 'desktop';
    }

    /**
     * Get browser info
     * @returns {Object}
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';

        if (ua.includes('Firefox/')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/([\d.]+)/)?.[1];
        } else if (ua.includes('Chrome/') && !ua.includes('Edg')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/([\d.]+)/)?.[1];
        } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.match(/Version\/([\d.]+)/)?.[1];
        } else if (ua.includes('Edg/')) {
            browser = 'Edge';
            version = ua.match(/Edg\/([\d.]+)/)?.[1];
        }

        return { name: browser, version };
    }

    /**
     * Get OS
     * @returns {string}
     */
    getOS() {
        const ua = navigator.userAgent;
        if (ua.includes('Win')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        return 'Unknown';
    }

    /**
     * Generate device fingerprint
     * @returns {string}
     */
    generateFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ];

        const fingerprint = components.join('|');
        return this.hashCode(fingerprint).toString();
    }

    /**
     * Simple hash function
     * @param {string} str
     * @returns {number}
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    /**
     * Get connection info
     * @returns {Object}
     */
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return { type: 'unknown' };

        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
    }

    /**
     * Setup tracking listeners
     */
    setupTracking() {
        // Click tracking with heatmap
        document.addEventListener('click', (e) => this.trackClick(e), true);

        // Scroll tracking
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScroll();
            }, 500);
        });

        // Visibility tracking (user leaves tab)
        document.addEventListener('visibilitychange', () => {
            this.trackVisibility();
        });

        // Before unload - save session data
        window.addEventListener('beforeunload', () => {
            this.saveSession();
        });

        // Mouse movement heatmap (throttled)
        let moveTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => {
                this.trackMousePosition(e);
            }, 100);
        });

        // Content interaction tracking
        this.setupContentTracking();

        // Auto-save every 30 seconds
        setInterval(() => this.saveSession(), 30000);
    }

    /**
     * Track click event
     * @param {MouseEvent} e
     */
    trackClick(e) {
        const clickData = {
            x: e.clientX,
            y: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY,
            timestamp: Date.now(),
            target: {
                tag: e.target.tagName,
                id: e.target.id,
                classes: e.target.className,
                text: e.target.textContent?.substring(0, 50)
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        this.clicks.push(clickData);

        // RL Action: click
        this.recordRLAction('click', {
            element: clickData.target,
            position: { x: clickData.x, y: clickData.y }
        });

        // Update heatmap
        this.updateHeatmap(clickData);

        console.log('Click tracked:', clickData);
    }

    /**
     * Track scroll depth
     */
    trackScroll() {
        const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

        this.trackEvent('scroll', {
            depth: Math.round(scrollDepth),
            position: window.scrollY
        });
    }

    /**
     * Track visibility changes
     */
    trackVisibility() {
        const isVisible = !document.hidden;
        this.trackEvent('visibility_change', {
            visible: isVisible,
            duration: Date.now() - this.startTime
        });
    }

    /**
     * Track mouse position for heatmap
     * @param {MouseEvent} e
     */
    trackMousePosition(e) {
        // Store position for heatmap (lighter weight than clicks)
        if (this.clicks.length < 1000) { // Limit storage
            this.clicks.push({
                x: e.clientX,
                y: e.clientY,
                type: 'hover',
                timestamp: Date.now()
            });
        }
    }

    /**
     * Track generic event
     * @param {string} eventName
     * @param {Object} data
     */
    trackEvent(eventName, data = {}) {
        this.events.push({
            name: eventName,
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Setup content interaction tracking
     */
    setupContentTracking() {
        // Track video plays
        window.addEventListener('content-play', (e) => {
            this.trackContentInteraction('play', e.detail);
        });

        // Track video completion
        window.addEventListener('content-complete', (e) => {
            this.trackContentInteraction('complete', e.detail);
        });

        // Track content skip
        window.addEventListener('content-skip', (e) => {
            this.trackContentInteraction('skip', e.detail);
        });

        // Track search
        window.addEventListener('search-query', (e) => {
            this.trackEvent('search', { query: e.detail.query });
        });
    }

    /**
     * Track content interaction (RL)
     * @param {string} action
     * @param {Object} content
     */
    trackContentInteraction(action, content) {
        this.currentContent = content;

        // Calculate reward based on action
        let reward = 0;
        if (action === 'play') reward = 1;
        if (action === 'complete') reward = 5;
        if (action === 'skip') reward = -2;

        this.recordRLAction(action, content, reward);

        this.trackEvent('content_interaction', {
            action: action,
            contentId: content.id,
            contentTitle: content.title
        });
    }

    /**
     * Record RL action for learning
     * @param {string} action
     * @param {Object} data
     * @param {number} reward
     */
    recordRLAction(action, data = {}, reward = 0) {
        const state = this.getCurrentState();

        this.rlState.actions.push({
            action: action,
            data: data,
            timestamp: Date.now()
        });

        this.rlState.rewards.push(reward);
        this.rlState.states.push(state);

        console.log('RL Action:', action, 'Reward:', reward);
    }

    /**
     * Get current user state for RL
     * @returns {Object}
     */
    getCurrentState() {
        return {
            timeOnPage: Date.now() - this.startTime,
            clickCount: this.clicks.length,
            scrollDepth: window.scrollY,
            deviceType: this.deviceInfo.deviceType,
            currentContent: this.currentContent?.id || null
        };
    }

    /**
     * Update heatmap visualization
     * @param {Object} clickData
     */
    updateHeatmap(clickData) {
        if (!this.heatmapCanvas) {
            this.createHeatmapCanvas();
        }

        // Draw click point on canvas
        const ctx = this.heatmapCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(
            clickData.x, clickData.y, 0,
            clickData.x, clickData.y, 30
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(clickData.x - 30, clickData.y - 30, 60, 60);
    }

    /**
     * Create heatmap canvas overlay
     */
    createHeatmapCanvas() {
        this.heatmapCanvas = document.createElement('canvas');
        this.heatmapCanvas.width = window.innerWidth;
        this.heatmapCanvas.height = window.innerHeight;
        this.heatmapCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            display: none;
        `;
        this.heatmapCanvas.id = 'analytics-heatmap';
        document.body.appendChild(this.heatmapCanvas);
    }

    /**
     * Toggle heatmap visibility
     */
    toggleHeatmap() {
        if (this.heatmapCanvas) {
            const isVisible = this.heatmapCanvas.style.display !== 'none';
            this.heatmapCanvas.style.display = isVisible ? 'none' : 'block';
            console.log(`Heatmap ${isVisible ? 'hidden' : 'visible'}`);
        }
    }

    /**
     * Save session data to Firebase
     */
    async saveSession() {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const sessionData = {
                sessionId: this.sessionId,
                userId: user.uid,
                device: this.deviceInfo,
                clicks: this.clicks.slice(-100), // Last 100 clicks
                events: this.events,
                rlState: this.rlState,
                duration: Date.now() - this.startTime,
                timestamp: serverTimestamp(),
                url: window.location.href
            };

            await addDoc(collection(this.db, 'analytics_sessions'), sessionData);

            // Also send to backend for processing if available
            try {
                await fetch('/api/analytics/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await user.getIdToken()}`
                    },
                    body: JSON.stringify(sessionData)
                });
            } catch (error) {
                console.warn('Could not sync to backend:', error);
            }

            console.log('Session saved:', this.sessionId);
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    /**
     * Get RL feedback summary
     * @returns {Object}
     */
    getRLSummary() {
        const totalReward = this.rlState.rewards.reduce((sum, r) => sum + r, 0);
        const avgReward = totalReward / Math.max(this.rlState.rewards.length, 1);

        return {
            totalActions: this.rlState.actions.length,
            totalReward: totalReward,
            avgReward: avgReward,
            actions: this.rlState.actions.slice(-10) // Last 10 actions
        };
    }

    /**
     * Get session summary
     * @returns {Object}
     */
    getSessionSummary() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            clicks: this.clicks.length,
            events: this.events.length,
            device: this.deviceInfo.deviceType,
            browser: this.deviceInfo.browser.name,
            rl: this.getRLSummary()
        };
    }
}

// Global instance
let analyticsTracker = null;

// Initialize analytics when auth is ready
window.addEventListener('auth-ready', () => {
    if (!analyticsTracker) {
        analyticsTracker = new AnalyticsTracker();
        window.analyticsTracker = analyticsTracker;

        // Expose toggle heatmap function
        window.toggleHeatmap = () => analyticsTracker.toggleHeatmap();

        console.log('Analytics ready. Type toggleHeatmap() to see click heatmap!');
    }
});

export default AnalyticsTracker;
