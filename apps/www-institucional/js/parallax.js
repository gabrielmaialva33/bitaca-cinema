/**
 * parallax.js - Parallax scroll effect for hero section
 * Creates depth by moving hero background slower than scroll
 */

(function() {
    'use strict';

    // ============================================================================
    // Configuration
    // ============================================================================
    const config = {
        speed: 0.5, // 0.5 = background moves at 50% of scroll speed (slower)
        maxTranslate: 300, // Maximum pixels to translate (prevents extreme values)
        throttleDelay: 10 // Throttle scroll events (ms)
    };

    let ticking = false;
    let lastScrollY = 0;

    // ============================================================================
    // Parallax Effect
    // ============================================================================
    function initParallax() {
        const hero = document.querySelector('.hero');
        const heroBackground = document.querySelector('.hero__bg');

        if (!hero || !heroBackground) {
            console.warn('Parallax: Hero or hero background not found');
            return;
        }

        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            console.log('Parallax: Disabled due to user motion preferences');
            return;
        }

        // Optimize: use requestAnimationFrame for smooth 60fps
        function updateParallax() {
            const scrollY = window.pageYOffset;
            const heroHeight = hero.offsetHeight;

            // Only apply parallax while hero is in viewport
            if (scrollY < heroHeight) {
                // Calculate parallax offset
                let translateY = scrollY * config.speed;

                // Clamp to max translate to prevent excessive movement
                translateY = Math.min(translateY, config.maxTranslate);

                // Apply transform with GPU acceleration
                heroBackground.style.transform = `translate3d(0, ${translateY}px, 0)`;
            }

            ticking = false;
        }

        // Throttled scroll handler using requestAnimationFrame
        function onScroll() {
            lastScrollY = window.pageYOffset;

            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        // Add scroll listener
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initial call
        updateParallax();

        // Recalculate on resize (throttled)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateParallax, 150);
        });
    }

    // ============================================================================
    // Enhanced Parallax Styles
    // ============================================================================
    function addParallaxStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Ensure hero can contain parallax movement */
            .hero {
                overflow: hidden;
            }

            /* Optimize parallax background for GPU */
            .hero__bg {
                will-change: transform;
                transform: translate3d(0, 0, 0);
                transition: none; /* Disable any existing transitions */
            }

            /* Ensure background covers even when translated */
            .hero__bg {
                height: 120%; /* Extra height for parallax movement */
                top: -10%; /* Offset to center */
            }

            /* Disable parallax on mobile for performance */
            @media (max-width: 768px) {
                .hero__bg {
                    transform: none !important;
                    height: 100% !important;
                    top: 0 !important;
                }
            }

            /* Respect user motion preferences */
            @media (prefers-reduced-motion: reduce) {
                .hero__bg {
                    transform: none !important;
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // Initialize
    // ============================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addParallaxStyles();
            initParallax();
        });
    } else {
        addParallaxStyles();
        initParallax();
    }

    // ============================================================================
    // Export for manual control if needed
    // ============================================================================
    window.BitacaParallax = {
        setSpeed: (speed) => {
            config.speed = speed;
        },
        disable: () => {
            window.removeEventListener('scroll', initParallax);
            const heroBackground = document.querySelector('.hero__bg');
            if (heroBackground) {
                heroBackground.style.transform = 'none';
            }
        }
    };

})();
