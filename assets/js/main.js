// ===============================================
// BITACA CINEMA - MAIN JAVASCRIPT
// Interatividade e Funcionalidades
// ===============================================

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
  initAOS();
  initNavigation();
  initScrollEffects();
  initFilmesGrid();
  initFilters();
  initSearch();
  initModal();
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
      navMenu.classList.toggle('active');
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
  renderFilmes(filmesData);
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
}

function createFilmeCard(filme) {
  const card = document.createElement('div');
  card.className = `filme-card tema-${filme.tema}`;
  card.dataset.id = filme.id;

  // Determinar ícone baseado no gênero
  let icon = '🎬';
  if (filme.genero.toLowerCase().includes('documentário')) icon = '📽️';
  if (filme.genero.toLowerCase().includes('videoclipe')) icon = '🎵';
  if (filme.genero.toLowerCase().includes('animação')) icon = '🎨';

  // Status badge
  let statusBadge = '';
  if (filme.status === 'lancado') {
    statusBadge = '<span class="badge badge-success">✅ Lançado</span>';
  } else {
    statusBadge = '<span class="badge badge-warning">🔄 Em Produção</span>';
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
      ${icon}
    </div>
    <div class="filme-card__body">
      <h3 class="filme-card__title">${filme.titulo}</h3>
      <p class="filme-card__diretor">Dir: ${filme.diretor}</p>
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
      // Remover active de todos
      filterBtns.forEach(b => b.classList.remove('active'));
      // Adicionar active ao clicado
      btn.classList.add('active');

      // Filtrar filmes
      const filter = btn.dataset.filter;
      const filmesFiltrados = filtrarPorCategoria(filter);
      renderFilmes(filmesFiltrados);
    });
  });
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
        🎬 ${filme.titulo}
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
        📋 FICHA TÉCNICA
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
          📝 SINOPSE
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
          🎯 PROPÓSITO SOCIAL
        </h3>
        <p style="line-height: 1.6;">${filme.proposito}</p>
      </div>
    `;
  }

  // Status
  const statusText = filme.status === 'lancado' ? '✅ Lançado' : '🔄 Em Produção';
  const statusColor = filme.status === 'lancado' ? 'var(--verde-folha)' : 'var(--laranja-urbano)';

  content += `
    <div style="text-align: center; padding-top: 1rem; border-top: 1px solid var(--cinza-claro);">
      <p style="font-size: 1.1rem; color: ${statusColor}; font-weight: 600; margin-bottom: 1rem;">
        🎬 STATUS: ${statusText}
      </p>
  `;

  // Estreia
  if (filme.estreia) {
    content += `<p style="color: var(--marrom-terra); margin-bottom: 0.5rem;">📅 Estreia: ${filme.estreia}</p>`;
  }

  // Local de estreia
  if (filme.local) {
    content += `<p style="color: var(--marrom-terra); margin-bottom: 1rem;">📍 ${filme.local}</p>`;
  }

  // Links
  if (filme.streaming) {
    content += `<p style="color: var(--verde-folha); font-weight: 600;">📺 Disponível em streaming</p>`;
  }

  if (filme.youtube) {
    content += `<a href="${filme.youtube}" target="_blank" class="btn btn-outline" style="margin-top: 1rem;">▶️ Ver no YouTube</a>`;
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
              label: function(context) {
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
