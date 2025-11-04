/**
 * lazy-loading.js - Progressive image loading for performance
 * Lazy loads all images except hero for optimal LCP score
 */

(function() {
    'use strict';

    // ============================================================================
    // Configuration
    // ============================================================================
    const config = {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
        excludeSelectors: [
            '.hero__bg', // Hero background loads immediately for LCP
            '.hero__logo' // Logo loads immediately
        ]
    };

    // ============================================================================
    // Lazy Load Implementation
    // ============================================================================
    function lazyLoad() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            loadAllImages();
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Get all images except excluded ones
        const images = getImagesToLazyLoad();

        images.forEach(img => {
            // Store original src
            if (img.src && !img.dataset.src) {
                img.dataset.src = img.src;
                img.src = ''; // Clear src to prevent loading
            }

            // Store original srcset
            if (img.srcset && !img.dataset.srcset) {
                img.dataset.srcset = img.srcset;
                img.srcset = '';
            }

            // Add loading class
            img.classList.add('lazy-loading');

            // Observe the image
            imageObserver.observe(img);
        });
    }

    // ============================================================================
    // Get Images to Lazy Load
    // ============================================================================
    function getImagesToLazyLoad() {
        const allImages = document.querySelectorAll('img');
        const imagesToLoad = [];

        allImages.forEach(img => {
            // Skip if image matches excluded selector
            let shouldExclude = false;
            config.excludeSelectors.forEach(selector => {
                if (img.matches(selector) || img.closest(selector)) {
                    shouldExclude = true;
                }
            });

            if (!shouldExclude) {
                imagesToLoad.push(img);
            }
        });

        return imagesToLoad;
    }

    // ============================================================================
    // Load Single Image
    // ============================================================================
    function loadImage(img) {
        // Restore src
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }

        // Restore srcset
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }

        // Handle load event
        img.addEventListener('load', () => {
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
        });

        // Handle error event
        img.addEventListener('error', () => {
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
            console.warn('Failed to load image:', img.dataset.src || img.src);
        });
    }

    // ============================================================================
    // Fallback: Load All Images
    // ============================================================================
    function loadAllImages() {
        const images = getImagesToLazyLoad();
        images.forEach(img => loadImage(img));
    }

    // ============================================================================
    // Add Lazy Loading Styles
    // ============================================================================
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            img.lazy-loading {
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            img.lazy-loaded {
                opacity: 1;
            }

            img.lazy-error {
                opacity: 0.5;
                border: 2px dashed #ccc;
            }

            /* Placeholder background while loading */
            img.lazy-loading::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    90deg,
                    #f0f0f0 25%,
                    #e0e0e0 50%,
                    #f0f0f0 75%
                );
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }

            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // Initialize
    // ============================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addStyles();
            lazyLoad();
        });
    } else {
        addStyles();
        lazyLoad();
    }

    // ============================================================================
    // Export for manual control if needed
    // ============================================================================
    window.BitacaLazyLoad = {
        reload: lazyLoad,
        loadAll: loadAllImages
    };

})();
