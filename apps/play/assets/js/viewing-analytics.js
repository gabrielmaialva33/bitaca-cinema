/**
 * Viewing Analytics for Bitaca Cinema
 * Features: Firebase Firestore tracking, watch time analytics,
 * recommendations engine, user behavior tracking
 */

import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export class ViewingAnalytics {
    debouncedUpdateEvents = this.debounce(async () => {
        if (this.currentSession) {
            await this.updateSession({
                events: this.watchEvents
            });
        }
    }, 5000);

    constructor(firebaseConfig) {
        // Initialize Firebase
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);

        this.currentUser = null;
        this.currentSession = null;
        this.sessionStartTime = null;
        this.totalWatchTime = 0;
        this.watchEvents = [];
        this.lastPosition = 0;
        this.maxPositionReached = 0;

        // Setup auth listener
        this.setupAuthListener();
    }

    async init() {
        console.log(' Initializing Viewing Analytics...');

        // Sign in anonymously if no user
        if (!this.currentUser) {
            await this.signInAnonymous();
        }

        console.log(' Viewing Analytics initialized');
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.currentUser = user;
                console.log('User authenticated:', user.uid);
            } else {
                this.currentUser = null;
            }
        });
    }

    async signInAnonymous() {
        try {
            const userCredential = await signInAnonymously(this.auth);
            this.currentUser = userCredential.user;
            console.log('Signed in anonymously:', this.currentUser.uid);
        } catch (error) {
            console.error('Error signing in anonymously:', error);
        }
    }

    /**
     * Start tracking a viewing session
     */
    async startSession(production, streamUrl) {
        try {
            this.sessionStartTime = Date.now();
            this.totalWatchTime = 0;
            this.watchEvents = [];
            this.lastPosition = 0;
            this.maxPositionReached = 0;

            const sessionData = {
                userId: this.currentUser?.uid || 'anonymous',
                productionId: production.id,
                productionTitle: production.title,
                productionDirector: production.director,
                productionGenre: production.genre,
                productionTheme: production.theme,
                streamUrl,
                startTime: serverTimestamp(),
                deviceType: this.getDeviceType(),
                browserInfo: this.getBrowserInfo(),
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                status: 'active',
                events: []
            };

            const docRef = await addDoc(collection(this.db, 'viewingSessions'), sessionData);
            this.currentSession = {
                id: docRef.id,
                ...sessionData
            };

            console.log('Started viewing session:', this.currentSession.id);

            // Track session start event
            this.trackEvent('session_start', {
                production_id: production.id,
                production_title: production.title
            });

            return this.currentSession;

        } catch (error) {
            console.error('Error starting session:', error);
            return null;
        }
    }

    /**
     * Track video playback events
     */
    async trackPlay(currentTime) {
        this.trackEvent('play', {currentTime});
        await this.updateSession({
            lastPlayTime: serverTimestamp(),
            lastPosition: currentTime
        });
    }

    async trackPause(currentTime, duration) {
        const watchTime = duration || 0;
        this.totalWatchTime += watchTime / 1000;

        this.trackEvent('pause', {
            currentTime,
            watchDuration: watchTime / 1000
        });

        await this.updateSession({
            lastPauseTime: serverTimestamp(),
            lastPosition: currentTime,
            totalWatchTime: this.totalWatchTime
        });
    }

    async trackSeek(fromTime, toTime) {
        this.trackEvent('seek', {
            from: fromTime,
            to: toTime,
            delta: toTime - fromTime
        });

        await this.updateSession({
            lastPosition: toTime
        });
    }

    async trackComplete(currentTime) {
        const completionRate = this.calculateCompletionRate(currentTime);

        this.trackEvent('complete', {
            currentTime,
            completionRate,
            totalWatchTime: this.totalWatchTime
        });

        await this.updateSession({
            status: 'completed',
            completionRate,
            completedAt: serverTimestamp(),
            totalWatchTime: this.totalWatchTime,
            maxPositionReached: this.maxPositionReached
        });

        // Store in watch history
        await this.addToWatchHistory(completionRate);
    }

    async trackQualityChange(oldQuality, newQuality) {
        this.trackEvent('quality_change', {
            from: oldQuality,
            to: newQuality
        });
    }

    async trackSpeedChange(oldSpeed, newSpeed) {
        this.trackEvent('speed_change', {
            from: oldSpeed,
            to: newSpeed
        });
    }

    async trackSkipIntro(fromTime, toTime) {
        this.trackEvent('skip_intro', {
            from: fromTime,
            to: toTime,
            saved: toTime - fromTime
        });

        await this.updateSession({
            introSkipped: true
        });
    }

    async trackError(error) {
        this.trackEvent('error', {
            message: error.message || 'Unknown error',
            type: error.type || 'playback_error'
        });
    }

    async trackFullscreen(isFullscreen) {
        this.trackEvent('fullscreen', {
            enabled: isFullscreen
        });
    }

    async trackPiP(isPiP) {
        this.trackEvent('pip', {
            enabled: isPiP
        });
    }

    /**
     * Update position tracking
     */
    updatePosition(currentTime) {
        this.lastPosition = currentTime;
        if (currentTime > this.maxPositionReached) {
            this.maxPositionReached = currentTime;
        }
    }

    /**
     * Track custom event
     */
    trackEvent(eventName, data = {}) {
        const event = {
            type: eventName,
            timestamp: Date.now(),
            ...data
        };

        this.watchEvents.push(event);
        console.log(`Analytics event: ${eventName}`, data);

        // Update session events in Firestore (debounced)
        this.debouncedUpdateEvents();
    }

    /**
     * Update current session in Firestore
     */
    async updateSession(updates) {
        if (!this.currentSession) return;

        try {
            const sessionRef = doc(this.db, 'viewingSessions', this.currentSession.id);
            await updateDoc(sessionRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            // Update local session data
            Object.assign(this.currentSession, updates);

        } catch (error) {
            console.error('Error updating session:', error);
        }
    }

    /**
     * End viewing session
     */
    async endSession() {
        if (!this.currentSession) return;

        const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;

        await this.updateSession({
            status: 'ended',
            endTime: serverTimestamp(),
            sessionDuration,
            totalWatchTime: this.totalWatchTime,
            maxPositionReached: this.maxPositionReached,
            events: this.watchEvents
        });

        console.log('Ended viewing session:', this.currentSession.id);
        console.log(`Total watch time: ${this.totalWatchTime.toFixed(1)}s`);
        console.log(`Session duration: ${sessionDuration.toFixed(1)}s`);

        this.currentSession = null;
    }

    /**
     * Add to watch history
     */
    async addToWatchHistory(completionRate) {
        if (!this.currentUser || !this.currentSession) return;

        try {
            await addDoc(collection(this.db, 'watchHistory'), {
                userId: this.currentUser.uid,
                productionId: this.currentSession.productionId,
                productionTitle: this.currentSession.productionTitle,
                productionTheme: this.currentSession.productionTheme,
                completionRate,
                totalWatchTime: this.totalWatchTime,
                sessionId: this.currentSession.id,
                watchedAt: serverTimestamp()
            });

            console.log('Added to watch history');

        } catch (error) {
            console.error('Error adding to watch history:', error);
        }
    }

    /**
     * Get user watch history
     */
    async getWatchHistory(userId = null) {
        const uid = userId || this.currentUser?.uid;
        if (!uid) return [];

        try {
            const q = query(
                collection(this.db, 'watchHistory'),
                where('userId', '==', uid),
                orderBy('watchedAt', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return history;

        } catch (error) {
            console.error('Error getting watch history:', error);
            return [];
        }
    }

    /**
     * Get recommendations based on watch history
     */
    async getRecommendations(limit = 10) {
        try {
            const history = await this.getWatchHistory();

            if (history.length === 0) {
                // No history - return popular productions
                return await this.getPopularProductions(limit);
            }

            // Get themes from watch history
            const watchedThemes = {};
            history.forEach(item => {
                if (item.productionTheme) {
                    watchedThemes[item.productionTheme] = (watchedThemes[item.productionTheme] || 0) + 1;
                }
            });

            // Get most watched theme
            const favoriteTheme = Object.entries(watchedThemes)
                .sort((a, b) => b[1] - a[1])[0]?.[0];

            if (favoriteTheme) {
                // Get productions from favorite theme
                const q = query(
                    collection(this.db, 'viewingSessions'),
                    where('productionTheme', '==', favoriteTheme),
                    where('status', '==', 'completed'),
                    orderBy('startTime', 'desc'),
                    limit(limit)
                );

                const snapshot = await getDocs(q);
                const recommendations = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                return recommendations;
            }

            return await this.getPopularProductions(limit);

        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    /**
     * Get popular productions (most watched)
     */
    async getPopularProductions(limit = 10) {
        try {
            const q = query(
                collection(this.db, 'viewingSessions'),
                where('status', 'in', ['completed', 'active']),
                orderBy('startTime', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(q);

            // Count views per production
            const viewCounts = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const prodId = data.productionId;
                if (!viewCounts[prodId]) {
                    viewCounts[prodId] = {
                        count: 0,
                        production: data
                    };
                }
                viewCounts[prodId].count++;
            });

            // Sort by view count
            const popular = Object.values(viewCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit)
                .map(item => ({
                    ...item.production,
                    viewCount: item.count
                }));

            return popular;

        } catch (error) {
            console.error('Error getting popular productions:', error);
            return [];
        }
    }

    /**
     * Get viewing statistics for a production
     */
    async getProductionStats(productionId) {
        try {
            const q = query(
                collection(this.db, 'viewingSessions'),
                where('productionId', '==', productionId)
            );

            const snapshot = await getDocs(q);

            let totalViews = 0;
            let completedViews = 0;
            let totalWatchTime = 0;
            let avgCompletionRate = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                totalViews++;

                if (data.status === 'completed') {
                    completedViews++;
                }

                if (data.totalWatchTime) {
                    totalWatchTime += data.totalWatchTime;
                }

                if (data.completionRate) {
                    avgCompletionRate += data.completionRate;
                }
            });

            if (totalViews > 0) {
                avgCompletionRate /= totalViews;
            }

            return {
                productionId,
                totalViews,
                completedViews,
                completionRate: (completedViews / totalViews) * 100,
                avgCompletionRate,
                totalWatchTime,
                avgWatchTime: totalWatchTime / totalViews
            };

        } catch (error) {
            console.error('Error getting production stats:', error);
            return null;
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(userId = null) {
        const uid = userId || this.currentUser?.uid;
        if (!uid) return null;

        try {
            const history = await this.getWatchHistory(uid);

            let totalWatchTime = 0;
            let completedCount = 0;
            const themeCounts = {};

            history.forEach(item => {
                if (item.totalWatchTime) {
                    totalWatchTime += item.totalWatchTime;
                }

                if (item.completionRate >= 90) {
                    completedCount++;
                }

                if (item.productionTheme) {
                    themeCounts[item.productionTheme] = (themeCounts[item.productionTheme] || 0) + 1;
                }
            });

            const favoriteTheme = Object.entries(themeCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0];

            return {
                userId: uid,
                totalProductions: history.length,
                completedProductions: completedCount,
                totalWatchTime,
                avgWatchTime: totalWatchTime / history.length,
                favoriteTheme,
                themeCounts
            };

        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    // Utility methods
    calculateCompletionRate(currentTime) {
        if (!this.currentSession || this.maxPositionReached === 0) return 0;

        // Estimate duration (if not provided)
        const estimatedDuration = Math.max(this.maxPositionReached, currentTime);
        const rate = (this.maxPositionReached / estimatedDuration) * 100;

        return Math.min(100, Math.max(0, rate));
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';

        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

        return browser;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Check if user is logged in (not anonymous)
     */
    isLoggedIn() {
        return this.currentUser && !this.currentUser.isAnonymous;
    }

    /**
     * Get current user ID
     */
    getUserId() {
        return this.currentUser?.uid;
    }
}

export default ViewingAnalytics;
