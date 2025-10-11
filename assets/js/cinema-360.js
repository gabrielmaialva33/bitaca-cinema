// ===============================================
// BITACA CINEMA - CINEMA 360 DEGREES
// Epic Three.js 3D Cinema Experience
// ===============================================

/**
 * Cinema360 Class
 * Creates an immersive 3D cinema room with seats, screen, curtains, and cinematic lighting
 */
class Cinema360 {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);

    if (!this.canvas || typeof THREE === 'undefined') {
      console.warn('Canvas not found or Three.js not loaded');
      return;
    }

    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Objects
    this.seats = [];
    this.particles = null;
    this.screen = null;
    this.curtains = [];
    this.lights = {};

    // Animation control
    this.animationId = null;
    this.mouse = { x: 0, y: 0 };
    this.targetCameraPosition = { x: 0, y: 1.5 };

    // Performance settings - Enhanced
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isLowEnd = this.isMobile || navigator.hardwareConcurrency <= 4;
    this.qualityLevel = this.isLowEnd ? 'low' : 'high';

    // Optimized counts
    this.config = {
      seats: {
        rows: this.isMobile ? 2 : (this.isLowEnd ? 3 : 4),
        perRow: this.isMobile ? 4 : (this.isLowEnd ? 5 : 7)
      },
      particles: this.isMobile ? 100 : (this.isLowEnd ? 200 : 300),
      lights: this.isMobile ? 2 : (this.isLowEnd ? 4 : 6),
      shadows: !this.isMobile && !this.isLowEnd,
      antialias: !this.isMobile && !this.isLowEnd,
      pixelRatio: this.isMobile ? 1 : (this.isLowEnd ? 1.5 : 2)
    };

    // Color palette
    this.COLORS = {
      vermelhoBitaca: 0xC41E3A,
      vermelhoAssento: 0x8B0000,
      douradoMoldura: 0xFFB700,
      pretoUnderground: 0x0A0A0A,
      brancoPérola: 0xF5DEB3,
      verdeFollha: 0x2D5016,
      laranjaUrbano: 0xFF6B35,
      marromTerra: 0x6B4423
    };

    this.init();
  }

  /**
   * Initialize the entire 3D scene
   */
  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.createCinemaRoom();
    this.createSeatsInstanced(); // OPTIMIZED: Using InstancedMesh
    this.createScreen();
    this.createCurtains();
    this.setupLighting();
    this.createParticles();
    this.setupControls();
    this.setupEventListeners();
    this.animate();

    console.log(`Cinema 360 initialized (${this.qualityLevel} quality)!`);
  }

  /**
   * Setup WebGL Renderer with optimal settings
   */
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
      stencil: false // Disable if not needed
    });

    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.pixelRatio));
    this.renderer.shadowMap.enabled = this.config.shadows;

    if (this.config.shadows) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.info.autoReset = false; // Performance optimization
  }

  /**
   * Setup perspective camera with cinematic FOV
   */
  setupCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 50); // Reduced far plane
    this.camera.position.set(0, 1.5, 5);
    this.camera.lookAt(0, 1.5, -5);
  }

  /**
   * Setup 3D scene with fog for atmosphere
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(this.COLORS.pretoUnderground, 10, 25); // Reduced fog distance
  }

  /**
   * Create cinema room (floor, walls, ceiling)
   */
  createCinemaRoom() {
    const roomGroup = new THREE.Group();
    roomGroup.name = 'Cinema Room';

    // FLOOR - Dark gradient with subtle pattern
    const floorGeometry = new THREE.PlaneGeometry(20, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: this.COLORS.pretoUnderground,
      roughness: 0.9,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // WALLS - Side walls with subtle texture
    const wallHeight = 5;
    const wallGeometry = new THREE.PlaneGeometry(30, wallHeight);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.05
    });

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-10, wallHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(10, wallHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // CEILING - with recessed lighting spots
    const ceilingGeometry = new THREE.PlaneGeometry(20, 30);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f0f,
      roughness: 0.7,
      metalness: 0.1
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    ceiling.receiveShadow = true;
    roomGroup.add(ceiling);

    // Ceiling light fixtures (decorative)
    const fixtureGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.1, 8);
    const fixtureMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2,
      emissive: this.COLORS.douradoMoldura,
      emissiveIntensity: 0.1
    });

    const fixturePositions = [
      { x: -5, z: -8 },
      { x: 5, z: -8 },
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: 0, z: 8 }
    ];

    fixturePositions.forEach(pos => {
      const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
      fixture.position.set(pos.x, wallHeight - 0.1, pos.z);
      roomGroup.add(fixture);
    });

    this.scene.add(roomGroup);
  }

  /**
   * Create cinema seats using InstancedMesh - MAJOR OPTIMIZATION
   * Single draw call for all seats instead of one per seat
   */
  createSeatsInstanced() {
    const rows = this.config.seats.rows;
    const seatsPerRow = this.config.seats.perRow;
    const totalSeats = rows * seatsPerRow;

    // Create simplified seat geometry
    const seatGeometry = this.createSeatGeometry();
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: this.COLORS.vermelhoAssento,
      roughness: 0.6,
      metalness: 0.2
    });

    // Create InstancedMesh (single draw call for all seats!)
    const instancedSeats = new THREE.InstancedMesh(
      seatGeometry,
      seatMaterial,
      totalSeats
    );

    instancedSeats.castShadow = this.config.shadows;
    instancedSeats.receiveShadow = this.config.shadows;

    // Position each seat instance
    const matrix = new THREE.Matrix4();
    const seatSpacing = 1.2;
    const rowSpacing = 1.5;
    const startZ = 2;
    let instanceIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < seatsPerRow; col++) {
        const xOffset = (col - (seatsPerRow - 1) / 2) * seatSpacing;
        const zOffset = startZ + row * rowSpacing;
        const yOffset = 0.3;

        matrix.makeTranslation(xOffset, yOffset, zOffset);
        instancedSeats.setMatrixAt(instanceIndex, matrix);
        instanceIndex++;
      }
    }

    this.seats = instancedSeats;
    this.scene.add(instancedSeats);
  }

  /**
   * Create simplified seat geometry - OPTIMIZED
   * No subdivision for better performance
   */
  createSeatGeometry() {
    const seatGroup = new THREE.Group();

    // Seat base - No subdivision
    const baseGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.8, 1, 1, 1);
    const baseMesh = new THREE.Mesh(baseGeometry);
    baseMesh.position.y = 0;
    seatGroup.add(baseMesh);

    // Backrest - No subdivision
    const backrestGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.15, 1, 1, 1);
    const backrestMesh = new THREE.Mesh(backrestGeometry);
    backrestMesh.position.set(0, 0.45, -0.325);
    seatGroup.add(backrestMesh);

    // Armrests only on desktop
    if (!this.isMobile) {
      const armrestGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.6, 1, 1, 1);

      const leftArmrest = new THREE.Mesh(armrestGeometry);
      leftArmrest.position.set(-0.45, 0.25, -0.1);
      seatGroup.add(leftArmrest);

      const rightArmrest = new THREE.Mesh(armrestGeometry);
      rightArmrest.position.set(0.45, 0.25, -0.1);
      seatGroup.add(rightArmrest);
    }

    // Merge geometries
    const geometries = [];
    seatGroup.children.forEach(child => {
      const cloned = child.geometry.clone();
      cloned.applyMatrix4(child.matrix);
      geometries.push(cloned);
    });

    return THREE.BufferGeometryUtils
      ? THREE.BufferGeometryUtils.mergeBufferGeometries(geometries)
      : geometries[0];
  }

  /**
   * Create cinema screen with glowing Bitaca logo
   */
  createScreen() {
    const screenGroup = new THREE.Group();
    screenGroup.name = 'Cinema Screen';

    // Main screen
    const screenGeometry = new THREE.PlaneGeometry(8, 4.5);
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      emissive: this.COLORS.brancoPérola,
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 0.05
    });

    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 2.5, -10);
    screenGroup.add(screen);
    this.screen = screen;

    // Golden frame around screen
    const frameThickness = 0.2;
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: this.COLORS.douradoMoldura,
      metalness: 0.9,
      roughness: 0.1,
      emissive: this.COLORS.douradoMoldura,
      emissiveIntensity: 0.2
    });

    // Top frame
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, frameThickness, frameThickness),
      frameMaterial
    );
    topFrame.position.set(0, 4.85, -9.9);
    screenGroup.add(topFrame);

    // Bottom frame
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, frameThickness, frameThickness),
      frameMaterial
    );
    bottomFrame.position.set(0, 0.15, -9.9);
    screenGroup.add(bottomFrame);

    // Left frame
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, 4.9, frameThickness),
      frameMaterial
    );
    leftFrame.position.set(-4.3, 2.5, -9.9);
    screenGroup.add(leftFrame);

    // Right frame
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, 4.9, frameThickness),
      frameMaterial
    );
    rightFrame.position.set(4.3, 2.5, -9.9);
    screenGroup.add(rightFrame);

    // Logo on screen (glowing text - placeholder for actual logo texture)
    const logoGeometry = new THREE.PlaneGeometry(3, 1.5);
    const logoMaterial = new THREE.MeshBasicMaterial({
      color: this.COLORS.vermelhoBitaca,
      transparent: true,
      opacity: 0.4
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, 2.5, -9.8);
    screenGroup.add(logo);

    this.scene.add(screenGroup);
  }

  /**
   * Create red velvet curtains on sides
   */
  createCurtains() {
    const curtainGroup = new THREE.Group();
    curtainGroup.name = 'Curtains';

    const curtainMaterial = new THREE.MeshStandardMaterial({
      color: this.COLORS.vermelhoBitaca,
      roughness: 0.8,
      metalness: 0.1
    });

    // Left curtain
    const leftCurtainGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 16, 8, false);
    const leftCurtain = new THREE.Mesh(leftCurtainGeometry, curtainMaterial);
    leftCurtain.position.set(-5, 2.5, -10);
    leftCurtain.rotation.z = Math.PI / 12; // Slight angle
    leftCurtain.castShadow = !this.isMobile;
    curtainGroup.add(leftCurtain);
    this.curtains.push(leftCurtain);

    // Right curtain
    const rightCurtainGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 16, 8, false);
    const rightCurtain = new THREE.Mesh(rightCurtainGeometry, curtainMaterial);
    rightCurtain.position.set(5, 2.5, -10);
    rightCurtain.rotation.z = -Math.PI / 12; // Opposite angle
    rightCurtain.castShadow = !this.isMobile;
    curtainGroup.add(rightCurtain);
    this.curtains.push(rightCurtain);

    // Curtain rods (golden)
    const rodMaterial = new THREE.MeshStandardMaterial({
      color: this.COLORS.douradoMoldura,
      metalness: 0.9,
      roughness: 0.2
    });

    const rodGeometry = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
    const rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.set(0, 5, -10);
    rod.rotation.z = Math.PI / 2;
    curtainGroup.add(rod);

    this.scene.add(curtainGroup);
  }

  /**
   * Setup cinematic lighting - HIGHLY OPTIMIZED
   * Adaptive light count based on device capability
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // PROJECTOR LIGHT - Main light (only if lights >= 2)
    if (this.config.lights >= 2) {
      const projectorLight = new THREE.SpotLight(0xffffff, 1.5);
      projectorLight.position.set(0, 3, 10);
      projectorLight.target.position.set(0, 2.5, -10);
      projectorLight.angle = Math.PI / 6;
      projectorLight.penumbra = 0.3;
      projectorLight.decay = 2;
      projectorLight.distance = 25;
      projectorLight.castShadow = this.config.shadows;

      if (this.config.shadows) {
        projectorLight.shadow.mapSize.width = this.isMobile ? 512 : 1024;
        projectorLight.shadow.mapSize.height = this.isMobile ? 512 : 1024;
        projectorLight.shadow.camera.near = 0.5;
        projectorLight.shadow.camera.far = 30;
      }

      this.scene.add(projectorLight);
      this.scene.add(projectorLight.target);
      this.lights.projector = projectorLight;
    }

    // Screen glow (always present)
    const screenLight = new THREE.PointLight(this.COLORS.brancoPérola, 0.8, 15);
    screenLight.position.set(0, 2.5, -9);
    this.scene.add(screenLight);
    this.lights.screen = screenLight;

    // Ceiling spots (only if lights >= 4)
    if (this.config.lights >= 4) {
      const spotPositions = [
        { x: -5, y: 4.8, z: -8 },
        { x: 5, y: 4.8, z: -8 }
      ];

      spotPositions.forEach((pos, index) => {
        const spotLight = new THREE.PointLight(this.COLORS.douradoMoldura, 0.3, 8);
        spotLight.position.set(pos.x, pos.y, pos.z);
        this.scene.add(spotLight);
        this.lights[`spot${index}`] = spotLight;
      });
    }

    // Curtain accent lights (only if lights >= 6 and not mobile)
    if (this.config.lights >= 6 && !this.isMobile) {
      const curtainLight1 = new THREE.PointLight(this.COLORS.vermelhoBitaca, 0.5, 5);
      curtainLight1.position.set(-5, 2, -9);
      this.scene.add(curtainLight1);
      this.lights.curtain1 = curtainLight1;

      const curtainLight2 = new THREE.PointLight(this.COLORS.vermelhoBitaca, 0.5, 5);
      curtainLight2.position.set(5, 2, -9);
      this.scene.add(curtainLight2);
      this.lights.curtain2 = curtainLight2;
    }
  }

  /**
   * Create floating dust particles - OPTIMIZED
   */
  createParticles() {
    const particleCount = this.config.particles;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 8;
      positions[i3 + 1] = Math.random() * 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 20 - 5;

      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: this.isMobile ? 0.02 : 0.04,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);
  }

  /**
   * Setup mouse/touch controls - THROTTLED for performance
   */
  setupControls() {
    let mouseTicking = false;

    // Mouse move parallax (throttled)
    window.addEventListener('mousemove', (e) => {
      if (!mouseTicking) {
        window.requestAnimationFrame(() => {
          this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
          mouseTicking = false;
        });
        mouseTicking = true;
      }
    }, { passive: true });

    // Touch move (throttled)
    window.addEventListener('touchmove', (e) => {
      if (!mouseTicking && e.touches.length > 0) {
        window.requestAnimationFrame(() => {
          const touch = e.touches[0];
          this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
          this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
          mouseTicking = false;
        });
        mouseTicking = true;
      }
    }, { passive: true });

    // Scroll zoom (throttled)
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          const scrollPercent = Math.min(window.scrollY / window.innerHeight, 1);
          if (this.camera) {
            this.camera.fov = 75 - scrollPercent * 10;
            this.camera.updateProjectionMatrix();
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  }

  /**
   * Setup event listeners - DEBOUNCED resize
   */
  setupEventListeners() {
    // Debounced resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.onWindowResize(), 150);
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clock.stop();
      } else {
        this.clock.start();
      }
    });
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    if (!this.camera || !this.renderer || !this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Main animation loop - OPTIMIZED
   * Reduced update frequency for non-critical animations
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Camera parallax (always smooth)
    if (this.camera) {
      this.targetCameraPosition.x = this.mouse.x * 2;
      this.targetCameraPosition.y = 1.5 + this.mouse.y * 0.5;

      this.camera.position.x += (this.targetCameraPosition.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (this.targetCameraPosition.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 1.5, -5);
    }

    // Animate curtains (less frequent, only if visible)
    if (this.curtains.length > 0 && elapsed % 0.1 < delta) {
      this.curtains.forEach((curtain, index) => {
        const offset = index * Math.PI;
        curtain.rotation.x = Math.sin(elapsed * 0.5 + offset) * 0.05;
      });
    }

    // Animate particles (optimized update frequency)
    if (this.particles && elapsed % 0.05 < delta) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Wrap particles
        if (positions[i] > 10) positions[i] = -10;
        if (positions[i] < -10) positions[i] = 10;
        if (positions[i + 1] > 5) positions[i + 1] = 0;
        if (positions[i + 1] < 0) positions[i + 1] = 5;
        if (positions[i + 2] > 10) positions[i + 2] = -20;
        if (positions[i + 2] < -20) positions[i + 2] = 10;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Screen glow animation
    if (this.screen) {
      this.screen.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 2) * 0.1;
    }

    // Light animation (less frequent)
    if (this.lights.screen && elapsed % 0.1 < delta) {
      this.lights.screen.intensity = 0.8 + Math.sin(elapsed * 1.5) * 0.2;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Dispose geometries and materials
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
    }

    console.log('Cinema 360 disposed');
  }
}

// ===============================================
// AUTO-INITIALIZATION
// ===============================================

let cinema360Instance = null;

/**
 * Initialize Cinema 360 when DOM is ready
 */
function initCinema360() {
  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded. Waiting...');
    setTimeout(initCinema360, 500);
    return;
  }

  // Check if canvas exists
  const canvas = document.getElementById('cinema-canvas');
  if (!canvas) {
    console.warn('Cinema canvas not found');
    return;
  }

  // Create instance
  cinema360Instance = new Cinema360('cinema-canvas');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCinema360);
} else {
  initCinema360();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (cinema360Instance) {
    cinema360Instance.dispose();
  }
});

// Export for external access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cinema360;
}
