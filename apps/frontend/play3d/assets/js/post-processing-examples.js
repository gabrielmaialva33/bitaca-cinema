/**
 * ========================================
 * POST-PROCESSING USAGE EXAMPLES
 * ========================================
 *
 * This file contains examples of how to use the PostProcessingManager
 * in different scenarios. Copy and adapt these examples to your needs.
 */

// ========================================
// EXAMPLE 1: Basic Setup
// ========================================
/*
import { PostProcessingManager } from './post-processing.js';

// After creating renderer, scene, and camera
const postProcessing = new PostProcessingManager(renderer, scene, camera);

// In your animation loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // ... update your scene ...

    // Render with post-processing
    postProcessing.render(delta);
}
*/

// ========================================
// EXAMPLE 2: Manual Quality Control
// ========================================
/*
// Start with low quality for maximum compatibility
postProcessing.setQuality('low');

// Let user choose quality via UI
document.getElementById('quality-high').addEventListener('click', () => {
    postProcessing.setQuality('high');
});

document.getElementById('quality-medium').addEventListener('click', () => {
    postProcessing.setQuality('medium');
});

document.getElementById('quality-low').addEventListener('click', () => {
    postProcessing.setQuality('low');
});
*/

// ========================================
// EXAMPLE 3: Disable Adaptive Quality
// ========================================
/*
// If you want manual control only
postProcessing.setAdaptiveQuality(false);

// Force a specific quality
postProcessing.setQuality('medium');
*/

// ========================================
// EXAMPLE 4: Toggle Individual Effects
// ========================================
/*
// Create UI toggles for effects
document.getElementById('toggle-bloom').addEventListener('change', (e) => {
    postProcessing.toggleEffect('bloom', e.target.checked);
});

document.getElementById('toggle-ssao').addEventListener('change', (e) => {
    postProcessing.toggleEffect('ssao', e.target.checked);
});

document.getElementById('toggle-grain').addEventListener('change', (e) => {
    postProcessing.toggleEffect('filmGrain', e.target.checked);
});

document.getElementById('toggle-vignette').addEventListener('change', (e) => {
    postProcessing.toggleEffect('vignette', e.target.checked);
});
*/

// ========================================
// EXAMPLE 5: Debug Panel UI
// ========================================
/*
// Add debug panel to HTML
const debugPanel = document.createElement('div');
debugPanel.className = 'pp-debug-panel';
debugPanel.innerHTML = `
    <h4>Post-Processing</h4>
    <div class="stat">
        <span class="stat-label">Status:</span>
        <span class="stat-value" id="pp-status">ON</span>
    </div>
    <div class="stat">
        <span class="stat-label">Quality:</span>
        <span class="stat-value" id="pp-quality">HIGH</span>
    </div>
    <div class="stat">
        <span class="stat-label">World:</span>
        <span class="stat-value" id="pp-world">-</span>
    </div>
    <div class="stat">
        <span class="stat-label">FPS:</span>
        <span class="stat-value" id="pp-fps">60.0</span>
    </div>
    <div class="stat">
        <span class="stat-label">Bloom:</span>
        <span class="stat-value" id="pp-bloom">ON</span>
    </div>
    <div class="stat">
        <span class="stat-label">SSAO:</span>
        <span class="stat-value" id="pp-ssao">ON</span>
    </div>
`;
document.body.appendChild(debugPanel);

// Update debug panel every frame
function updateDebugPanel() {
    const state = postProcessing.getState();

    document.getElementById('pp-status').textContent = state.enabled ? 'ON' : 'OFF';
    document.getElementById('pp-quality').textContent = state.quality.toUpperCase();
    document.getElementById('pp-world').textContent = state.world || '-';

    const fpsElement = document.getElementById('pp-fps');
    fpsElement.textContent = state.fps;
    fpsElement.className = 'stat-value';
    if (parseFloat(state.fps) < 30) {
        fpsElement.classList.add('error');
    } else if (parseFloat(state.fps) < 45) {
        fpsElement.classList.add('warning');
    }

    document.getElementById('pp-bloom').textContent = state.effects.bloom ? 'ON' : 'OFF';
    document.getElementById('pp-ssao').textContent = state.effects.ssao ? 'ON' : 'OFF';
}

// Call in animation loop
function animate() {
    // ...
    updateDebugPanel();
    postProcessing.render(delta);
}
*/

// ========================================
// EXAMPLE 6: Custom World Configuration
// ========================================
/*
// Edit WORLD_CONFIGS in post-processing.js
const WORLD_CONFIGS = {
    // Add your custom world
    myCustomWorld: {
        bloom: {
            strength: 1.5,     // Very strong bloom
            threshold: 0.7     // Lower threshold = more bloom
        },
        ssao: {
            kernelRadius: 24,  // Very strong AO
            maxDistance: 0.25
        },
        filmGrain: {
            intensity: 0.3     // Heavy grain
        },
        vignette: {
            darkness: 0.8      // Very dark edges
        }
    }
};

// Apply it
postProcessing.applyWorldConfig('myCustomWorld');
*/

// ========================================
// EXAMPLE 7: Performance Monitoring
// ========================================
/*
// Get current performance state
const state = postProcessing.getState();
console.log('Current FPS:', state.fps);
console.log('Quality level:', state.quality);
console.log('Active effects:', state.effects);

// React to performance changes
setInterval(() => {
    const fps = parseFloat(postProcessing.getState().fps);

    if (fps < 25) {
        console.warn('Performance critically low!');
        // Maybe disable some heavy effects
        postProcessing.toggleEffect('ssao', false);
        postProcessing.toggleEffect('filmGrain', false);
    }
}, 5000);
*/

// ========================================
// EXAMPLE 8: Mobile-Specific Setup
// ========================================
/*
// Detect mobile and optimize
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
    // Force low quality
    postProcessing.setQuality('low');

    // Disable adaptive quality to save battery
    postProcessing.setAdaptiveQuality(false);

    // Disable specific effects
    postProcessing.toggleEffect('ssao', false);
    postProcessing.toggleEffect('filmGrain', false);

    console.log('Mobile optimizations applied');
}
*/

// ========================================
// EXAMPLE 9: Dynamic Effect Intensity
// ========================================
/*
// Change bloom intensity based on music or time of day
function updateBloomIntensity(intensity) {
    if (postProcessing.passes.bloom) {
        postProcessing.passes.bloom.strength = intensity;
    }
}

// Example: Pulsing bloom with music
audioAnalyzer.on('beat', (energy) => {
    updateBloomIntensity(0.5 + energy * 0.5);
});

// Example: Time-based effects
const hour = new Date().getHours();
if (hour >= 20 || hour <= 6) {
    // Night mode - stronger vignette
    if (postProcessing.passes.vignette) {
        postProcessing.passes.vignette.uniforms.darkness.value = 0.8;
    }
}
*/

// ========================================
// EXAMPLE 10: Temporary Effect Changes
// ========================================
/*
// Temporarily boost effects for dramatic moment
function cinematicMode(enable) {
    if (enable) {
        // Store original values
        const originalBloom = postProcessing.passes.bloom?.strength;
        const originalVignette = postProcessing.passes.vignette?.uniforms.darkness.value;

        // Boost effects
        if (postProcessing.passes.bloom) {
            postProcessing.passes.bloom.strength = 1.5;
        }
        if (postProcessing.passes.vignette) {
            postProcessing.passes.vignette.uniforms.darkness.value = 0.9;
        }

        // Restore after 3 seconds
        setTimeout(() => {
            if (postProcessing.passes.bloom) {
                postProcessing.passes.bloom.strength = originalBloom;
            }
            if (postProcessing.passes.vignette) {
                postProcessing.passes.vignette.uniforms.darkness.value = originalVignette;
            }
        }, 3000);
    }
}

// Trigger during important moments
document.getElementById('play-trailer').addEventListener('click', () => {
    cinematicMode(true);
});
*/

// ========================================
// EXAMPLE 11: A/B Testing Effects
// ========================================
/*
// Compare with and without post-processing
let testMode = 0;
const testModes = ['off', 'low', 'medium', 'high'];

document.getElementById('test-effects').addEventListener('click', () => {
    testMode = (testMode + 1) % testModes.length;
    const mode = testModes[testMode];

    if (mode === 'off') {
        postProcessing.setEnabled(false);
        console.log('Post-processing: OFF');
    } else {
        postProcessing.setEnabled(true);
        postProcessing.setQuality(mode);
        console.log(`Post-processing: ${mode.toUpperCase()}`);
    }
});
*/

// ========================================
// EXAMPLE 12: Loading Screen Integration
// ========================================
/*
// Show quality settings during loading
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.innerHTML += `
        <div class="quality-selector">
            <h3>Select Graphics Quality</h3>
            <button onclick="startWithQuality('high')">High</button>
            <button onclick="startWithQuality('medium')">Medium</button>
            <button onclick="startWithQuality('low')">Low</button>
            <button onclick="startWithQuality('auto')">Auto (Recommended)</button>
        </div>
    `;
}

function startWithQuality(quality) {
    if (quality === 'auto') {
        // Use default auto-detection
        postProcessing = new PostProcessingManager(renderer, scene, camera);
    } else {
        postProcessing = new PostProcessingManager(renderer, scene, camera);
        postProcessing.setAdaptiveQuality(false);
        postProcessing.setQuality(quality);
    }

    hideLoadingScreen();
    startExperience();
}
*/

// ========================================
// EXAMPLE 13: Cleanup on Page Unload
// ========================================
/*
// Properly dispose resources
window.addEventListener('beforeunload', () => {
    if (postProcessing) {
        postProcessing.dispose();
    }
});
*/

export default {
    // Export examples if needed
};
