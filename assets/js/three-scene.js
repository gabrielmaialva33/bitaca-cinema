// ===============================================
// BITACA CINEMA - THREE.JS 3D SCENE
// Cena 3D interativa para o hero section
// ===============================================

let scene, camera, renderer, filmReel, lights;
let animationId = null;

function initThreeScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.z = 8;

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create film reel geometry
  const reelGroup = new THREE.Group();

  // Main reel body (torus)
  const reelGeometry = new THREE.TorusGeometry(1.5, 0.15, 16, 100);
  const reelMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B0000, // Vermelho Bitaca
    metalness: 0.7,
    roughness: 0.3
  });
  const reel = new THREE.Mesh(reelGeometry, reelMaterial);
  reelGroup.add(reel);

  // Film strip (center disc)
  const filmDiscGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32);
  const filmDiscMaterial = new THREE.MeshStandardMaterial({
    color: 0x2D5016, // Verde Folha
    metalness: 0.5,
    roughness: 0.4
  });
  const filmDisc = new THREE.Mesh(filmDiscGeometry, filmDiscMaterial);
  filmDisc.rotation.x = Math.PI / 2;
  reelGroup.add(filmDisc);

  // Spokes (raios da bobina)
  const spokeGeometry = new THREE.BoxGeometry(0.1, 2.4, 0.05);
  const spokeMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF6B35, // Laranja Urbano
    metalness: 0.6,
    roughness: 0.3
  });

  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    spoke.rotation.z = (Math.PI / 3) * i;
    reelGroup.add(spoke);
  }

  // Small perforations around the edge
  const perfGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const perfMaterial = new THREE.MeshStandardMaterial({
    color: 0x6B4423, // Marrom Terra
    metalness: 0.8,
    roughness: 0.2
  });

  const perfCount = 24;
  for (let i = 0; i < perfCount; i++) {
    const angle = (Math.PI * 2 / perfCount) * i;
    const perf = new THREE.Mesh(perfGeometry, perfMaterial);
    perf.position.x = Math.cos(angle) * 1.5;
    perf.position.y = Math.sin(angle) * 1.5;
    perf.position.z = 0.1;
    reelGroup.add(perf);
  }

  filmReel = reelGroup;
  scene.add(filmReel);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xFF6B35, 1, 100); // Laranja
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x2D5016, 0.8, 100); // Verde
  pointLight2.position.set(-5, -5, 3);
  scene.add(pointLight2);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  lights = { pointLight1, pointLight2 };

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation
  animate();
}

function animate() {
  animationId = requestAnimationFrame(animate);

  // Rotate film reel
  if (filmReel) {
    filmReel.rotation.z += 0.005;

    // Subtle floating animation
    filmReel.position.y = Math.sin(Date.now() * 0.001) * 0.2;

    // Subtle tilt
    filmReel.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
    filmReel.rotation.y = Math.cos(Date.now() * 0.0007) * 0.1;
  }

  // Animate lights
  if (lights) {
    lights.pointLight1.position.x = Math.cos(Date.now() * 0.001) * 5;
    lights.pointLight1.position.z = Math.sin(Date.now() * 0.001) * 5;

    lights.pointLight2.position.x = Math.sin(Date.now() * 0.0008) * -5;
    lights.pointLight2.position.z = Math.cos(Date.now() * 0.0008) * 3;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Three.js to load
  setTimeout(() => {
    initThreeScene();
  }, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
});
