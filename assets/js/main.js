// ===============================================
// BITACA CINEMA - MAIN JAVASCRIPT
// Interatividade e Funcionalidades
// ===============================================

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    initAOS();
    initNavigation();
    initScrollEffects();
    initFilmesGrid();
    initFilters();
    initSearch();
    initModal();
    initLightbox();
    initEixosCards();
    initPodioShare();
    initPodioConfetti();
    initCharts();
    animateCounters();
});

// ===== AOS ANIMATION =====
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
}

// ===== NAVEGAÇÃO =====
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav__link');

    // Toggle menu mobile
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isOpen);
            navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
        });
    }

    // Fechar menu ao clicar em link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');

            // Adicionar classe active ao link clicado
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Sticky header
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scroll');
        } else {
            header.classList.remove('scroll');
        }
    });
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    const scrollTopBtn = document.getElementById('scroll-top');

    // Mostrar/esconder botão scroll to top
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    // Scroll to top
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== GRID DE FILMES =====
function initFilmesGrid() {
    // Mostrar skeletons inicialmente
    showSkeletonCards(6);

    // Simular loading (em produção, isso seria o carregamento real de dados)
    setTimeout(() => {
        renderFilmes(filmesData);
    }, 800);
}

function showSkeletonCards(count = 6) {
    const grid = document.getElementById('filmes-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const skeleton = createSkeletonCard();
        grid.appendChild(skeleton);
    }
}

function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'filme-card skeleton';

    card.innerHTML = `
    <div class="filme-card__poster">
      <i class="ki-filled ki-video"></i>
    </div>
    <div class="filme-card__body">
      <div class="skeleton-line skeleton-line--title"></div>
      <div class="skeleton-line skeleton-line--subtitle"></div>
      <div class="filme-card__badges">
        <div class="skeleton-badge"></div>
        <div class="skeleton-badge"></div>
      </div>
      <div class="skeleton-line skeleton-line--text"></div>
      <div class="skeleton-line skeleton-line--text skeleton-line--short"></div>
    </div>
  `;

    return card;
}

function renderFilmes(filmes) {
    const grid = document.getElementById('filmes-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (filmes.length === 0) {
        grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="font-size: 1.2rem; color: var(--marrom-terra);">
          Nenhum filme encontrado.
        </p>
      </div>
    `;
        return;
    }

    filmes.forEach(filme => {
        const card = createFilmeCard(filme);
        grid.appendChild(card);
    });

    // Inicializar lazy loading para os cards
    initLazyLoading();
}

// ===== LAZY LOADING COM INTERSECTION OBSERVER =====
function initLazyLoading() {
    const cards = document.querySelectorAll('.filme-card:not(.skeleton)');

    // Configuração do Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;

                // Adicionar classe para animação fade-in
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';

                // Animar entrada do card
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);

                // Parar de observar após carregar
                observer.unobserve(card);
            }
        });
    }, observerOptions);

    // Observar todos os cards
    cards.forEach(card => observer.observe(card));
}

function createFilmeCard(filme) {
    const card = document.createElement('div');
    card.className = `filme-card tema-${filme.tema}`;
    card.dataset.id = filme.id;

    // Determinar ícone baseado no gênero (KeenIcons)
    let iconName = 'video';
    if (filme.genero.toLowerCase().includes('documentário')) iconName = 'video';
    if (filme.genero.toLowerCase().includes('videoclipe')) iconName = 'music';
    if (filme.genero.toLowerCase().includes('animação')) iconName = 'color-swatch';

    // Status badge
    let statusBadge = '';
    if (filme.status === 'lancado') {
        statusBadge = '<span class="badge badge-success"><i class="ki-filled ki-check-circle"></i> Lançado</span>';
    } else {
        statusBadge = '<span class="badge badge-warning"><i class="ki-filled ki-loading"></i> Em Produção</span>';
    }

    // Badges de pontuação
    let pontuacaoBadges = '';
    if (filme.pontuacaoLPG) {
        let badgeClass = 'badge';
        if (filme.ranking && filme.ranking.lpg && filme.ranking.lpg.includes('1º')) {
            badgeClass = 'badge badge-gold';
        } else if (filme.ranking && filme.ranking.lpg && filme.ranking.lpg.includes('2º')) {
            badgeClass = 'badge badge-silver';
        }
        pontuacaoBadges += `<span class="${badgeClass}">LPG ${filme.pontuacaoLPG}</span>`;
    }
    if (filme.pontuacaoPNAB) {
        let badgeClass = 'badge';
        if (filme.ranking && filme.ranking.pnab && filme.ranking.pnab.includes('1º')) {
            badgeClass = 'badge badge-gold';
        } else if (filme.ranking && filme.ranking.pnab && filme.ranking.pnab.includes('2º')) {
            badgeClass = 'badge badge-silver';
        }
        pontuacaoBadges += `<span class="${badgeClass}">PNAB ${filme.pontuacaoPNAB}</span>`;
    }

    card.innerHTML = `
    <div class="filme-card__poster">
      <i class="ki-filled ki-${iconName}"></i>
    </div>
    <div class="filme-card__body">
      <h3 class="filme-card__title">${filme.titulo}</h3>
      <p class="filme-card__diretor"><i class="ki-filled ki-profile-circle"></i> Dir: ${filme.diretor}</p>
      <div class="filme-card__badges">
        ${statusBadge}
        ${pontuacaoBadges}
      </div>
      <p class="filme-card__sinopse">${filme.sinopse || 'Sinopse em breve...'}</p>
    </div>
  `;

    // Click para abrir modal
    card.addEventListener('click', () => {
        openModal(filme);
    });

    return card;
}

// ===== FILTROS =====
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos e atualizar aria-pressed
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            // Adicionar active ao clicado e atualizar aria-pressed
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Filtrar filmes
            const filter = btn.dataset.filter;
            const filmesFiltrados = filtrarPorCategoria(filter);
            renderFilmes(filmesFiltrados);
        });
    });
}

// ===== EIXOS CARDS CLICÁVEIS =====
function initEixosCards() {
    const eixosCards = document.querySelectorAll('.eixo-card');

    eixosCards.forEach(card => {
        card.addEventListener('click', () => {
            // Determinar o filtro baseado na classe do card
            let filterType = 'all';
            if (card.classList.contains('eixo-card--patrimonio')) {
                filterType = 'patrimonio';
            } else if (card.classList.contains('eixo-card--musica')) {
                filterType = 'musica';
            } else if (card.classList.contains('eixo-card--ambiente')) {
                filterType = 'ambiente';
            }

            // Scroll suave até o catálogo
            const catalogoSection = document.getElementById('catalogo');
            if (catalogoSection) {
                const offset = 80; // Header height
                const targetPosition = catalogoSection.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Aguardar o scroll e então aplicar o filtro
                setTimeout(() => {
                    // Encontrar e clicar no botão de filtro correspondente
                    const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
                    if (filterBtn) {
                        filterBtn.click();
                    }
                }, 500);
            }
        });

        // Adicionar indicação visual de que é clicável
        card.style.cursor = 'pointer';
    });
}

// ===== COMPARTILHAMENTO SOCIAL NO PÓDIO =====
function initPodioShare() {
    const shareBtns = document.querySelectorAll('.share-btn');

    shareBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar conflitos com outros eventos

            // Obter dados do card pai
            const card = btn.closest('.podio-card');
            if (!card) return;

            const producer = card.dataset.producer || 'Produtor';
            const project = card.dataset.project || 'Projeto';
            const position = card.dataset.position || '';

            // Montar mensagem de compartilhamento
            const message = `🏆 ${position} Lugar - Bitaca Cinema!\n\n` +
                          `Produtor: ${producer}\n` +
                          `Projeto: "${project}"\n\n` +
                          `Confira o catálogo completo de produções audiovisuais de Capão Bonito! 🎬\n` +
                          `#BitacaCinema #CapãoBonito #LeiPauloGustavo #PNAB`;

            const url = window.location.href;
            const encodedMessage = encodeURIComponent(message);
            const encodedUrl = encodeURIComponent(url);

            // Determinar qual rede social
            let shareUrl = '';

            if (btn.classList.contains('share-btn--twitter')) {
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
            } else if (btn.classList.contains('share-btn--facebook')) {
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
            } else if (btn.classList.contains('share-btn--whatsapp')) {
                shareUrl = `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`;
            }

            // Abrir em nova janela
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });
}

// ===== ANIMAÇÃO DE CONFETTI NO PÓDIO =====
function initPodioConfetti() {
    const podioSection = document.querySelector('.produtores-destaque-section');
    if (!podioSection) return;

    // Criar confetti quando a seção se torna visível
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                createConfetti(podioSection);
                observer.unobserve(entry.target); // Executar apenas uma vez
            }
        });
    }, {
        threshold: 0.3 // Ativar quando 30% da seção estiver visível
    });

    observer.observe(podioSection);
}

function createConfetti(container) {
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#FF6B35', '#2D5016', '#FFB700'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Posição inicial aleatória
        const startX = Math.random() * 100;
        const startDelay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const size = 8 + Math.random() * 8;
        const rotation = Math.random() * 360;
        const color = colors[Math.floor(Math.random() * colors.length)];

        confetti.style.cssText = `
            position: absolute;
            top: -20px;
            left: ${startX}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            opacity: 0.9;
            transform: rotate(${rotation}deg);
            animation: confettiFall ${duration}s ease-out ${startDelay}s forwards;
            pointer-events: none;
            z-index: 1;
        `;

        container.appendChild(confetti);

        // Remover confetti após animação
        setTimeout(() => {
            confetti.remove();
        }, (duration + startDelay) * 1000 + 100);
    }
}

// ===== BUSCA =====
function initSearch() {
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value;

            if (termo.trim() === '') {
                // Se vazio, mostrar todos
                renderFilmes(filmesData);
            } else {
                // Buscar
                const resultados = buscarFilmes(termo);
                renderFilmes(resultados);
            }
        });
    }
}

// ===== MODAL =====
function initModal() {
    const modal = document.getElementById('filme-modal');
    const modalClose = document.querySelector('.modal__close');
    const modalOverlay = document.querySelector('.modal__overlay');

    // Fechar modal
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openModal(filme) {
    const modal = document.getElementById('filme-modal');
    const modalBody = document.getElementById('modal-body');

    if (!modal || !modalBody) return;

    // Gerar conteúdo do modal
    let content = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <h2 style="font-family: var(--font-title); font-size: 2.5rem; color: var(--vermelho-bitaca); margin-bottom: 0.5rem;">
        <i class="ki-filled ki-video" style="display: inline-block; vertical-align: middle;"></i> ${filme.titulo}
      </h2>
      <p style="font-family: var(--font-script); font-size: 1.2rem; color: var(--marrom-terra);">
        ${filme.genero} | ${filme.duracao}
      </p>
    </div>
  `;

    // Badges
    if (filme.ranking) {
        content += '<div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">';
        if (filme.ranking.lpg) {
            content += `<span class="badge badge-gold">${filme.ranking.lpg} LPG</span>`;
        }
        if (filme.ranking.pnab) {
            content += `<span class="badge badge-gold">${filme.ranking.pnab} PNAB</span>`;
        }
        content += '</div>';
    }

    // Ficha técnica
    content += `
    <div style="background: var(--bege-acolhedor); border-radius: 15px; padding: 1.5rem; margin-bottom: 1.5rem;">
      <h3 style="font-family: var(--font-bold); color: var(--verde-folha); margin-bottom: 1rem; border-bottom: 2px solid var(--verde-folha); padding-bottom: 0.5rem;">
        <i class="ki-filled ki-clipboard" style="display: inline-block; vertical-align: middle;"></i> FICHA TÉCNICA
      </h3>
      <p style="margin-bottom: 0.5rem;"><strong>Direção:</strong> ${filme.diretor}</p>
  `;

    if (filme.equipeTecnica) {
        if (filme.equipeTecnica.roteiro) {
            content += `<p style="margin-bottom: 0.5rem;"><strong>Roteiro:</strong> ${filme.equipeTecnica.roteiro}</p>`;
        }
        if (filme.equipeTecnica.elenco) {
            content += `<p style="margin-bottom: 0.5rem;"><strong>Elenco:</strong> ${filme.equipeTecnica.elenco.join(', ')}</p>`;
        }
        if (filme.equipeTecnica.fotografia) {
            content += `<p style="margin-bottom: 0.5rem;"><strong>Dir. Fotografia:</strong> ${filme.equipeTecnica.fotografia}</p>`;
        }
        if (filme.equipeTecnica.trilha) {
            content += `<p style="margin-bottom: 0.5rem;"><strong>Trilha:</strong> ${filme.equipeTecnica.trilha}</p>`;
        }
        if (filme.equipeTecnica.producao) {
            content += `<p style="margin-bottom: 0.5rem;"><strong>Produção:</strong> ${filme.equipeTecnica.producao}</p>`;
        }
    }

    content += '</div>';

    // Sinopse
    if (filme.sinopse) {
        content += `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-family: var(--font-bold); color: var(--laranja-urbano); margin-bottom: 0.75rem;">
          <i class="ki-filled ki-book-open" style="display: inline-block; vertical-align: middle;"></i> SINOPSE
        </h3>
        <p style="line-height: 1.6;">${filme.sinopse}</p>
      </div>
    `;
    }

    // Propósito social
    if (filme.proposito) {
        content += `
      <div style="background: #E8F5E9; border-left: 4px solid var(--verde-folha); padding: 1rem; margin-bottom: 1.5rem; border-radius: 8px;">
        <h3 style="font-family: var(--font-bold); color: var(--verde-folha); margin-bottom: 0.75rem;">
          <i class="ki-filled ki-target" style="display: inline-block; vertical-align: middle;"></i> PROPÓSITO SOCIAL
        </h3>
        <p style="line-height: 1.6;">${filme.proposito}</p>
      </div>
    `;
    }

    // Status
    const statusIcon = filme.status === 'lancado' ? 'check-circle' : 'loading';
    const statusText = filme.status === 'lancado' ? 'Lançado' : 'Em Produção';
    const statusColor = filme.status === 'lancado' ? 'var(--verde-folha)' : 'var(--laranja-urbano)';

    content += `
    <div style="text-align: center; padding-top: 1rem; border-top: 1px solid var(--cinza-claro);">
      <p style="font-size: 1.1rem; color: ${statusColor}; font-weight: 600; margin-bottom: 1rem;">
        <i class="ki-filled ki-video" style="display: inline-block; vertical-align: middle;"></i> STATUS:
        <i class="ki-filled ki-${statusIcon}" style="display: inline-block; vertical-align: middle;"></i> ${statusText}
      </p>
  `;

    // Estreia
    if (filme.estreia) {
        content += `<p style="color: var(--marrom-terra); margin-bottom: 0.5rem;"><i class="ki-filled ki-calendar" style="display: inline-block; vertical-align: middle;"></i> Estreia: ${filme.estreia}</p>`;
    }

    // Local de estreia
    if (filme.local) {
        content += `<p style="color: var(--marrom-terra); margin-bottom: 1rem;"><i class="ki-filled ki-geolocation" style="display: inline-block; vertical-align: middle;"></i> ${filme.local}</p>`;
    }

    // Links
    if (filme.streaming) {
        content += `<p style="color: var(--verde-folha); font-weight: 600;"><i class="ki-filled ki-screen" style="display: inline-block; vertical-align: middle;"></i> Disponível em streaming</p>`;
    }

    if (filme.youtube) {
        content += `<a href="${filme.youtube}" target="_blank" class="btn btn-outline" style="margin-top: 1rem;"><i class="ki-filled ki-play" style="display: inline-block; vertical-align: middle;"></i> Ver no YouTube</a>`;
    }

    content += '</div>';

    modalBody.innerHTML = content;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('filme-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===== LIGHTBOX PARA GALERIA =====
let currentLightboxIndex = 0;
const galeriaImages = [];

function initLightbox() {
    const galeriaItems = document.querySelectorAll('.galeria-item');
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const lightboxClose = document.querySelector('.lightbox__close');
    const lightboxOverlay = document.querySelector('.lightbox__overlay');
    const lightboxPrev = document.querySelector('.lightbox__prev');
    const lightboxNext = document.querySelector('.lightbox__next');
    const lightboxCurrent = document.getElementById('lightbox-current');
    const lightboxTotal = document.getElementById('lightbox-total');

    if (!lightbox || !lightboxImage) return;

    // Coletar dados das imagens
    galeriaItems.forEach((item, index) => {
        const img = item.querySelector('img');
        const overlay = item.querySelector('.galeria-overlay');
        const title = overlay ? overlay.querySelector('h3')?.textContent : '';
        const description = overlay ? overlay.querySelector('p')?.textContent : '';

        galeriaImages.push({
            src: img.src,
            alt: img.alt,
            title: title,
            description: description
        });

        // Click para abrir lightbox
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    // Atualizar total de imagens
    if (lightboxTotal) {
        lightboxTotal.textContent = galeriaImages.length;
    }

    // Fechar lightbox
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', closeLightbox);
    }

    // Navegação
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreviousImage();
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextImage();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        }
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            showNextImage();
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            showPreviousImage();
        }
    }
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const lightboxCurrent = document.getElementById('lightbox-current');

    if (!lightbox || !lightboxImage) return;

    currentLightboxIndex = index;
    const imageData = galeriaImages[index];

    lightboxImage.src = imageData.src;
    lightboxImage.alt = imageData.alt;
    lightboxTitle.textContent = imageData.title;
    lightboxDescription.textContent = imageData.description;
    lightboxCurrent.textContent = index + 1;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox-modal');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showPreviousImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + galeriaImages.length) % galeriaImages.length;
    updateLightboxImage();
}

function showNextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % galeriaImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const lightboxCurrent = document.getElementById('lightbox-current');

    const imageData = galeriaImages[currentLightboxIndex];

    // Fade out
    lightboxImage.style.opacity = '0';

    setTimeout(() => {
        lightboxImage.src = imageData.src;
        lightboxImage.alt = imageData.alt;
        lightboxTitle.textContent = imageData.title;
        lightboxDescription.textContent = imageData.description;
        lightboxCurrent.textContent = currentLightboxIndex + 1;

        // Fade in
        lightboxImage.style.transition = 'opacity 0.3s ease';
        lightboxImage.style.opacity = '1';
    }, 150);
}

// ===== CONTADOR ANIMADO =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        // Iniciar animação quando visível
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });

        observer.observe(counter);
    });
}

// ===== GRÁFICOS =====
function initCharts() {
    if (typeof Chart === 'undefined') return;

    // Gráfico de Eixos Temáticos
    const eixosCanvas = document.getElementById('eixos-chart');
    if (eixosCanvas) {
        new Chart(eixosCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Patrimônio & Memória', 'Cultura Musical', 'Meio Ambiente'],
                datasets: [{
                    data: [38, 33, 29],
                    backgroundColor: [
                        '#2D5016', // Verde Folha
                        '#FF6B35', // Laranja Urbano
                        '#6B4423'  // Marrom Terra
                    ],
                    borderColor: '#FFFFFF',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                family: "'Inter', sans-serif"
                            },
                            color: '#0A0A0A'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offset = 80; // Header height
            const targetPosition = target.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
