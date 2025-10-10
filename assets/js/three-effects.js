// ===============================================
// BITACA CINEMA - THREE.JS EFFECTS
// Efeitos 3D sutis e coerentes
// ===============================================

class BitacaThreeEffects {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = [];
    this.particleCount = 80; // Sutil, não exagerado

    this.init();
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.createParticles();
    this.animate();
    this.handleResize();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
  }

  setupCamera() {
    const width = this.canvas.clientWidth || window.innerWidth * 0.5;
    const height = this.canvas.clientHeight || window.innerHeight * 0.5;

    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    this.camera.position.z = 20;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power' // Performance otimizada
    });

    const width = this.canvas.clientWidth || window.innerWidth * 0.5;
    const height = this.canvas.clientHeight || window.innerHeight * 0.5;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0); // Transparente
  }

  createParticles() {
    // Geometria de partículas
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    // Paleta Bitaca em RGB
    const colorPalette = [
      { r: 0.77, g: 0.12, b: 0.23 }, // Vermelho Crimson #C41E3A
      { r: 1.00, g: 0.42, b: 0.21 }, // Laranja #FF6B35
      { r: 0.96, g: 0.87, b: 0.70 }, // Bege #F5DEB3
      { r: 1.00, g: 0.72, b: 0.00 }, // Amarelo #FFB700
    ];

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Posições aleatórias
      positions[i3] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      // Cor aleatória da paleta Bitaca
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Tamanho sutil
      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material de partículas
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6, // Muito sutil
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Rotação MUITO sutil
    if (this.particleSystem) {
      this.particleSystem.rotation.y += 0.0005; // Quase imperceptível
      this.particleSystem.rotation.x += 0.0002;

      // Movimento flutuante sutil
      const positions = this.particleSystem.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        // Movimento vertical lento (como poeira flutuando)
        positions[i + 1] += Math.sin(Date.now() * 0.0003 + i) * 0.003;

        // Reset se sair muito do campo de visão
        if (positions[i + 1] > 20) {
          positions[i + 1] = -20;
        }
        if (positions[i + 1] < -20) {
          positions[i + 1] = 20;
        }
      }

      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    window.addEventListener('resize', () => {
      if (!this.canvas) return;

      const width = this.canvas.clientWidth || window.innerWidth * 0.5;
      const height = this.canvas.clientHeight || window.innerHeight * 0.5;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se Three.js está carregado
  if (typeof THREE !== 'undefined') {
    new BitacaThreeEffects();
  } else {
    console.warn('Three.js não carregado. Efeitos 3D desabilitados.');
  }
});
