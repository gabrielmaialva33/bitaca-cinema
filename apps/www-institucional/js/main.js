/**
 * main.js - Core functionality for Bitaca institutional homepage
 * Features: mobile nav, smooth scroll, scroll reveals, carousel
 */

// ============================================================================
// Mobile Navigation
// ============================================================================
function initMobileNav() {
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');
    const navLinks = document.querySelectorAll('.header__link');

    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
        const isOpen = burger.classList.toggle('active');
        nav.classList.toggle('active');
        burger.setAttribute('aria-expanded', isOpen);

        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            nav.classList.remove('active');
            burger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && burger.classList.contains('active')) {
            burger.classList.remove('active');
            nav.classList.remove('active');
            burger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
}

// ============================================================================
// Smooth Scroll for Anchor Links
// ============================================================================
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Skip if href is just "#"
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const headerHeight = document.querySelector('.header')?.offsetHeight || 64;
                const targetPosition = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================================================
// Header Glassmorphism on Scroll
// ============================================================================
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add shadow when scrolled past hero
        if (currentScroll > 100) {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
        } else {
            header.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });
}

// ============================================================================
// Scroll Reveal Animations
// ============================================================================
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections, cards, and animated elements
    const elements = document.querySelectorAll(`
        .sobre,
        .stats,
        .plataformas,
        .comunidade,
        .eixos,
        .apoio,
        .localizacao,
        .cta-final,
        .stat-card,
        .plataforma-card,
        .eixo-card
    `);

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add revealed class styles
    const style = document.createElement('style');
    style.textContent = `
        .revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// Image Carousel for Comunidade Section
// ============================================================================
function initCarousel() {
    const carousel = document.querySelector('.comunidade__carousel');
    if (!carousel) return;

    const images = carousel.querySelectorAll('img');
    const totalImages = images.length;
    let currentIndex = 0;
    let autoplayInterval;

    // Create dots indicator
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel__dots';
    carousel.appendChild(dotsContainer);

    images.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', `Slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    function updateCarousel() {
        // Update image positions
        images.forEach((img, index) => {
            img.style.transform = `translateX(-${currentIndex * 100}%)`;
        });

        // Update dots
        const dots = dotsContainer.querySelectorAll('.carousel__dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
        resetAutoplay();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalImages;
        updateCarousel();
    }

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Add carousel styles
    const style = document.createElement('style');
    style.textContent = `
        .comunidade__carousel {
            position: relative;
            overflow: hidden;
        }

        .comunidade__carousel img {
            transition: transform 0.5s ease;
        }

        .carousel__dots {
            position: absolute;
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 0.5rem;
            z-index: 10;
        }

        .carousel__dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid white;
            background: transparent;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 0;
        }

        .carousel__dot:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        .carousel__dot.active {
            background: white;
            width: 30px;
            border-radius: 5px;
        }
    `;
    document.head.appendChild(style);

    // Initialize
    updateCarousel();
    startAutoplay();

    // Pause on hover
    carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
    carousel.addEventListener('mouseleave', startAutoplay);
}

// ============================================================================
// Initialize All Features
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initSmoothScroll();
    initHeaderScroll();
    initScrollReveal();
    initCarousel();
});
