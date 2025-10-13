# Virtual Cinema Component

Production-ready 3D virtual cinema room for streaming Bitaca productions via stream-winx-api.

## Features

- **Immersive 3D Cinema Room**
    - Large 16:9 cinema screen with proper aspect ratio
    - Multiple rows of cinema seating (6 rows × 10 seats)
    - Acoustic dampening walls
    - Cinema carpet floor
    - Recessed ceiling lighting

- **Video Streaming**
    - Direct integration with stream-winx-api (FastAPI + Telethon)
    - Range request support for efficient streaming
    - Automatic video texture mapping
    - Hardware-accelerated playback

- **Spatial Audio**
    - 3D positional audio attached to screen
    - Audio follows screen position in 3D space
    - Distance-based attenuation
    - Directional sound cone

- **Cinematic Lighting**
    - Ambient cinema lighting (dims during playback)
    - Screen fill light (simulates screen glow)
    - Ceiling spotlights for ambiance
    - Aisle lights with red glow

- **Multiple Viewing Modes**
    - **Cinema**: Standard middle-row viewing (default)
    - **VR**: Close-up VR-style experience
    - **Close-up**: Detailed screen viewing
    - **Back Row**: Traditional back-row perspective

- **Full Video Controls**
    - Play/Pause (Space key)
    - Progress scrubbing
    - Volume control
    - Mute toggle (M key)
    - Fullscreen (F key)
    - Seek controls (Arrow keys: ±10s)
    - Time display (current/duration)

- **Production Catalog**
    - Interactive menu with all 23 Bitaca productions
    - Filter by theme (Patrimônio, Música, Ambiente)
    - Beautiful card-based layout
    - Click to load and play

## Installation

```javascript
import { VirtualCinema } from './components/virtual-cinema.js';

// Initialize
const cinema = new VirtualCinema(scene, camera, renderer);
await cinema.init();
```

## Basic Usage

### 1. Create Cinema Instance

```javascript
const cinema = new VirtualCinema(scene, camera, renderer);
await cinema.init();
```

### 2. Load a Production

```javascript
// Get production from catalog
const production = cinema.productions.find(p => p.id === 1);

// Load and prepare for playback
await cinema.loadProduction(production);
```

### 3. Control Playback

```javascript
// Play
cinema.play();

// Pause
cinema.pause();

// Toggle
cinema.togglePlayPause();

// Seek
cinema.seek(120); // 2 minutes in

// Volume
cinema.setVolume(0.5); // 50%
```

### 4. Change Viewing Mode

```javascript
// Available modes: 'cinema', 'vr', 'closeup', 'back'
cinema.setCameraPosition('vr');
```

### 5. Show Production Menu

```javascript
cinema.showMenu();
```

### 6. Update Loop

```javascript
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    cinema.update(delta);

    renderer.render(scene, camera);
}
```

## Stream API Integration

The component connects to stream-winx-api for video streaming:

```javascript
// API Configuration
const streamAPI = {
    baseURL: 'https://stream-api.abitaca.com.br/api/v1',
    endpoint: '/posts/{message_id}/video'
};

// Stream URL format
const streamURL = `${streamAPI.baseURL}/posts/${messageId}/video`;

// Video element setup
const videoElement = document.createElement('video');
videoElement.src = streamURL;
videoElement.crossOrigin = 'anonymous';

// Video texture
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
```

## Keyboard Shortcuts

| Key     | Action            |
|---------|-------------------|
| `Space` | Play/Pause        |
| `F`     | Fullscreen toggle |
| `M`     | Mute/Unmute       |
| `←`     | Seek backward 10s |
| `→`     | Seek forward 10s  |
| `↑`     | Volume up         |
| `↓`     | Volume down       |

## Production Data Structure

```javascript
{
    id: 1,
    titulo: 'Ponteia Viola',
    diretor: 'Margarida Chaves de Oliveira Scuoteguazza',
    duracao: '15-20 min',
    genero: 'Documentário',
    status: 'producao',
    tema: 'musica',
    telegram_message_id: 'MESSAGE_ID_HERE', // Required for streaming
    sinopse: 'Description...',
    estreia: '2025'
}
```

## Integration with Main App

### Option 1: As a World

```javascript
// In main.js
import { CinemaWorld } from './scenes/cinema-world.js';

// Initialize worlds
this.worlds = {
    patrimonio: new PatrimonioWorld(this.scene, this.camera),
    musica: new MusicaWorld(this.scene, this.camera),
    ambiente: new AmbienteWorld(this.scene, this.camera),
    cinema: new CinemaWorld(this.scene, this.camera, this.renderer) // NEW
};

// Load cinema world
this.loadWorld('cinema');
```

### Option 2: Direct Integration

```javascript
// In main.js init()
this.virtualCinema = new VirtualCinema(this.scene, this.camera, this.renderer);
await this.virtualCinema.init();

// In animate loop
this.virtualCinema.update(delta);

// Add menu button
document.getElementById('btn-cinema').addEventListener('click', () => {
    this.virtualCinema.showMenu();
});
```

## Advanced Usage

### Custom Lighting During Playback

```javascript
// The cinema automatically dims lights during playback
// You can customize this behavior:

cinema.dimLights(true);  // Dim lights
cinema.dimLights(false); // Restore lights
```

### Camera Animation

```javascript
// Smooth camera transitions with custom duration
cinema.animateCameraTo(
    new THREE.Vector3(0, 5, -5),  // target position
    new THREE.Vector3(0, 5, -10), // look at point
    2000 // duration in ms
);
```

### Event Handling

```javascript
// Listen to video events
cinema.videoElement.addEventListener('play', () => {
    console.log('Video started');
});

cinema.videoElement.addEventListener('ended', () => {
    console.log('Video ended');
    // Load next production, show credits, etc.
});

cinema.videoElement.addEventListener('error', (e) => {
    console.error('Stream error:', e);
});
```

### Custom UI Styling

The component injects CSS automatically, but you can override styles:

```css
/* Override control styles */
.cinema-controls {
    background: linear-gradient(to top, rgba(196, 30, 58, 0.9), transparent);
}

.control-btn {
    background: rgba(139, 21, 40, 0.9);
}

/* Override menu styles */
.production-menu {
    background: rgba(10, 10, 10, 0.98);
}

.production-card:hover {
    border-color: #8B1528;
}
```

## Performance Optimization

### Video Texture Updates

```javascript
// The component only updates video texture when playing
update(delta) {
    if (this.videoTexture && !this.videoElement.paused) {
        this.videoTexture.needsUpdate = true;
    }
}
```

### Instanced Seating

Cinema seats use efficient geometry cloning for 60 seats with minimal performance impact.

### Texture Settings

```javascript
// Optimized texture settings for video
videoTexture.minFilter = THREE.LinearFilter; // Fast filtering
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false; // Not needed for video
```

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features

- WebGL 2.0
- HTML5 Video
- Web Audio API
- Fullscreen API
- ES6 Modules

### Mobile Support

- Touch-friendly controls
- `playsinline` attribute for iOS
- Responsive progress bar

## Troubleshooting

### Video Not Playing

1. **CORS Issues**
   ```javascript
   // Ensure stream-api sends proper CORS headers
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, HEAD, OPTIONS
   ```

2. **Browser Autoplay Policy**
   ```javascript
   // First user interaction required
   cinema.videoElement.muted = true;
   await cinema.play();
   cinema.videoElement.muted = false;
   ```

3. **Stream API Issues**
   ```javascript
   // Check stream URL
   console.log(cinema.videoElement.src);

   // Test direct access
   fetch(streamURL, { method: 'HEAD' })
       .then(r => console.log('Stream accessible:', r.ok));
   ```

### Audio Not Working

1. **Check Spatial Audio Setup**
   ```javascript
   // Verify audio listener is attached
   console.log(cinema.camera.children); // Should include AudioListener
   ```

2. **Volume Settings**
   ```javascript
   // Check volume levels
   console.log(cinema.videoElement.volume); // 0-1
   console.log(cinema.videoElement.muted);  // boolean
   ```

### Performance Issues

1. **Reduce Shadow Quality**
   ```javascript
   renderer.shadowMap.enabled = false;
   ```

2. **Lower Resolution**
   ```javascript
   renderer.setPixelRatio(1); // Instead of window.devicePixelRatio
   ```

3. **Disable Post-Processing**
   ```javascript
   // During video playback
   postProcessing.setEnabled(false);
   ```

## API Reference

### Constructor

```javascript
new VirtualCinema(scene, camera, renderer)
```

### Methods

#### `init(): Promise<VirtualCinema>`

Initialize and build the cinema room.

#### `loadProduction(production): Promise<void>`

Load a production for playback.

#### `play(): void`

Start video playback.

#### `pause(): void`

Pause video playback.

#### `togglePlayPause(): void`

Toggle between play and pause.

#### `seek(timeInSeconds): void`

Seek to specific time.

#### `setVolume(volume): void`

Set volume (0-1).

#### `toggleFullscreen(): void`

Toggle fullscreen mode.

#### `setCameraPosition(mode): void`

Change viewing mode ('cinema', 'vr', 'closeup', 'back').

#### `showMenu(): void`

Display production selection menu.

#### `hideMenu(): void`

Hide production selection menu.

#### `update(delta): void`

Update loop (call every frame).

#### `dispose(): void`

Cleanup and remove cinema.

### Properties

#### `videoElement: HTMLVideoElement`

The underlying video element.

#### `currentProduction: Object`

Currently loaded production data.

#### `isPlaying: boolean`

Playback state.

#### `productions: Array`

Full catalog of productions.

#### `viewingMode: string`

Current viewing mode.

## Production Deployment

### Requirements

1. **stream-winx-api** must be running and accessible
2. Productions must have `telegram_message_id` field
3. Telegram bot must have access to content
4. CORS must be configured properly

### Stream API Configuration

```python
# FastAPI CORS setup
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Integration

```javascript
// Fetch productions from API instead of static data
async getProductions() {
    const response = await fetch('https://api.abitaca.com.br/api/productions');
    this.productions = await response.json();
}
```

## Future Enhancements

- [ ] VR headset support (WebXR)
- [ ] Multi-user synchronized viewing
- [ ] Live chat overlay
- [ ] Subtitle support
- [ ] Quality selection (720p, 1080p)
- [ ] Watch history tracking
- [ ] Recommendations from Derona AI
- [ ] Social sharing
- [ ] Screenshot capture
- [ ] 360° video support

## Credits

Built for **Bitaca Cinema** - Celebrating Capão Bonito's audiovisual culture.

**Technologies:**

- Three.js (3D rendering)
- stream-winx-api (Video streaming)
- Telegram (Content delivery)

**Author:** Bitaca Development Team
**License:** Proprietary
