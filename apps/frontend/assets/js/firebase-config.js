// ===============================================
// FIREBASE CONFIGURATION
// Initialize Firebase App and Analytics
// ===============================================

import {initializeApp} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {getAnalytics, logEvent} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyBSkRy1LyKbBXvyvoOCZx5t0bIDldTityk",
    authDomain: "abitaca-8451c.firebaseapp.com",
    projectId: "abitaca-8451c",
    storageBucket: "abitaca-8451c.firebasestorage.app",
    messagingSenderId: "31455523643",
    appId: "1:31455523643:web:3f8590a2e5181ee9ef3d1e",
    measurementId: "G-3RHX80J2V7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Analytics helper functions
export const trackEvent = (eventName, params = {}) => {
    try {
        logEvent(analytics, eventName, params);
        console.log(`Analytics: ${eventName}`, params);
    } catch (error) {
        console.error('Analytics error:', error);
    }
};

// Predefined tracking events
export const analytics_events = {
    // Chatbot events
    chatbot_opened: () => trackEvent('chatbot_opened'),
    chatbot_message_sent: (messageLength) => trackEvent('chatbot_message_sent', {message_length: messageLength}),
    chatbot_rag_search: (query, resultsCount) => trackEvent('chatbot_rag_search', {
        query_length: query.length,
        results_count: resultsCount
    }),
    production_card_clicked: (productionId, productionTitle) => trackEvent('production_card_clicked', {
        production_id: productionId,
        production_title: productionTitle
    }),

    // Video recorder events
    video_recorder_opened: () => trackEvent('video_recorder_opened'),
    video_recording_started: () => trackEvent('video_recording_started'),
    video_recording_stopped: (duration) => trackEvent('video_recording_stopped', {duration_seconds: duration}),

    // Page events
    page_view: (pageName) => trackEvent('page_view', {page_name: pageName}),
    section_viewed: (sectionName) => trackEvent('section_viewed', {section_name: sectionName}),
};

export {app, analytics};
