/**
 * ========================================
 * CINEMA WORLD - Virtual Cinema Experience
 * Integration example for VirtualCinema component
 * ========================================
 */

import {VirtualCinema} from '../components/virtual-cinema.js';

export class CinemaWorld {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.virtualCinema = null;
        this.isActive = false;
    }

    /**
     * Load and activate cinema world
     */
    async load() {
        console.log('🎬 Loading Cinema World...');

        // Create virtual cinema
        this.virtualCinema = new VirtualCinema(this.scene, this.camera, this.renderer);
        await this.virtualCinema.init();

        // Show production menu on load
        setTimeout(() => {
            this.virtualCinema.showMenu();
        }, 500);

        this.isActive = true;

        console.log('✅ Cinema World loaded!');
    }

    /**
     * Unload cinema world
     */
    unload() {
        console.log('👋 Unloading Cinema World...');

        if (this.virtualCinema) {
            this.virtualCinema.dispose();
            this.virtualCinema = null;
        }

        this.isActive = false;
    }

    /**
     * Update loop
     */
    update(delta) {
        if (!this.isActive || !this.virtualCinema) return;

        this.virtualCinema.update(delta);
    }

    /**
     * Open production menu
     */
    openMenu() {
        if (this.virtualCinema) {
            this.virtualCinema.showMenu();
        }
    }

    /**
     * Play specific production by ID
     */
    playProduction(productionId) {
        if (!this.virtualCinema) return;

        const production = this.virtualCinema.productions.find(p => p.id === productionId);
        if (production) {
            this.virtualCinema.loadProduction(production);
        }
    }
}
