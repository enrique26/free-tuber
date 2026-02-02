# VTuber 2D Animator

A professional-grade, real-time 2D character animator with microphone-driven lip sync, designed for VTuber-style usage and live streaming via OBS.

## ✨ Features

- **PixiJS Rendering**: High-performance 2D sprite-based animation
- **Real-Time Lip Sync**: Microphone audio processed through Rhubarb Lip Sync (WASM)
- **Sprite Asset Management**: Hot-swappable PNG assets at runtime
- **Natural Eye Blinking**: Automatic blink timing with manual override
- **Layered Animation**: Body, eyes, and mouth layers with proper z-ordering
- **Dual Test Modes**:
  - Animation Test: Manual sprite control for alignment
  - Audio/Lip Sync Test: Real-time phoneme diagnostics
- **OBS Compatible**: Transparent canvas, exact 1280x720 resolution
- **WebAudio Integration**: Professional audio constraints (echo cancellation, noise suppression)

## 🛠️ Technology Stack

| Component     | Technology            |
| ------------- | --------------------- |
| Rendering     | PixiJS 8.x            |
| Audio Capture | WebAudio API          |
| Lip Sync      | Rhubarb (WASM) / Mock |
| Build Tool    | Vite 5.x              |
| Runtime       | Modern ES6 modules    |

## 📁 Project Structure

```
vtuber-2d-animator/
├── index.html              # Main HTML entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js             # PixiJS bootstrap & state management
│   ├── audio.js            # WebAudio microphone capture
│   ├── lipsync.js          # Rhubarb WASM integration & phoneme mapping
│   ├── animation.js        # Sprite control & blinking logic
│   └── ui.js               # Event handlers & test modes
└── public/
    └── assets/             # User-loaded PNG sprites
```

## 📋 File Responsibilities

### `main.js`

- Initialize PixiJS Application (1280x720, transparent, 60 FPS)
- Create sprite layer hierarchy (body → eyes → mouth)
- Orchestrate animation loop using `requestAnimationFrame`
- Manage global application state
- Bridge audio/lipsync/animation/UI modules
- Handle asset loading and caching

### `audio.js`

- Initialize WebAudio API context (16kHz sample rate)
- Request microphone permission with proper constraints:
  - `echoCancellation: true`
  - `noiseSuppression: true`
  - `autoGainControl: false`
- Implement ScriptProcessorNode for real-time audio capture
- Buffer audio frames for Rhubarb processing
- Provide audio level metering (0-100%)
- Handle graceful microphone enable/disable

### `lipsync.js`

- Load Rhubarb WASM module (or fallback to mock)
- Process audio buffers → phoneme extraction
- Map 25 phonemes to 8 animation categories:
  - `A`, `E`, `O`, `U` (vowels)
  - `M` (closed mouth)
  - `F` (teeth visible)
  - `idle` (silence)
- Apply smoothing to avoid jittery mouth transitions
- Provide diagnostic information for testing

### `animation.js`

- Create placeholder sprites for all sprite types
- Manage sprite visibility and switching
- Implement automatic eye blinking (2-5 second intervals)
- Manual eye/mouth control for testing
- Sprite state tracking and diagnostics

### `ui.js`

- Initialize DOM event handlers
- Manage test mode UI visibility
- Real-time audio level display
- Asset loading UI (file input + type selector)
- Manual animation controls (keyboard shortcuts + buttons)
- Live diagnostic panel for audio/lipsync testing

## 🚀 Quick Start

### 1. Installation

```bash
cd vtuber-2d-animator
npm install
```

### 2. Development Server

```bash
npm run dev
```

Open `https://localhost:5173` in your browser.

### 3. Asset Loading

1. Click **Load PNG Assets**
2. Select asset type (e.g., "Mouth - A")
3. Choose your PNG file(s)
4. Asset will be cached and ready for use

## default assets

add the basic sounds for mouth movement, eyes and body, in the public/assets folder, with this names:

- body.png
- eye_closed.png
- eye_open.png
- mouth_a.png
- mouth_e.png
- mouth_u.png
- mouth_o.png
- mouth_f.png
- mouth_m.png
- mouth_closed.png
- mouth_idle.png

**Recommended Asset Dimensions:**

- Body: 400×600 pixels
- Eyes: 100×60 pixels each
- Mouth: 200×150 pixels each

### 4. Microphone Setup

1. Click **Enable Microphone**
2. Grant browser permission
3. Microphone indicator will turn green
4. Start speaking to see real-time lip sync

### 5. Test Modes

#### Animation Test Mode

- Manual mouth/eye control
- No microphone input
- Perfect for sprite alignment testing
- Keyboard shortcuts: `A`, `E`, `O`, `U`, `M`, `F`, `C` (closed), `I` (idle), `Space` (blink)

#### Audio/Lip Sync Test Mode

- Real-time phoneme detection display
- Audio level monitoring
- No character rendering
- Useful for microphone tuning

## 🎬 OBS Integration

### Browser Source Setup

1. **OBS → Sources → Browser**
2. **URL**: `https://localhost:5173`
3. **Width**: 1280
4. **Height**: 720
5. **CSS**: Leave empty (already styled)

### Audio Routing

- Canvas audio is NOT captured by OBS browser source
- Configure microphone separately in OBS:
  - **OBS → Audio Input Capture**
  - Select your microphone device
  - OBS will process audio independently

### Streaming

The application:

- ✅ Renders character with transparent background
- ✅ Responds to real-time microphone input
- ✅ Maintains 60 FPS stability
- ✅ Works with any OBS scene composition

## 🧬 Sprite Format & Categories

### Mouth Sprites

| Phoneme          | Category       | Visual Description     |
| ---------------- | -------------- | ---------------------- |
| A, I, L          | `mouth_a`      | Wide open, smiling     |
| E                | `mouth_e`      | Slight smile, jaw open |
| O                | `mouth_o`      | Rounded lips           |
| U                | `mouth_u`      | Narrow lips            |
| M, B, P, N       | `mouth_m`      | Closed lips pressed    |
| F, V, T, D, S, Z | `mouth_f`      | Top teeth visible      |
| Silence          | `mouth_idle`   | Neutral, closed        |
| Silence          | `mouth_closed` | Alternative rest pose  |

### Eye Sprites

| State  | Type         | Visual Description   |
| ------ | ------------ | -------------------- |
| Open   | `eye_open`   | Standard awake state |
| Closed | `eye_closed` | Blink frame          |

### Body Sprite

| Type           | Category | Visual Description             |
| -------------- | -------- | ------------------------------ |
| Full Character | `body`   | Base character body (optional) |

## 🔍 Diagnostics & Debugging

### Console Logging

All modules log to browser console with status:

- ✅ Successful operations
- ❌ Errors
- ⚠️ Warnings
- 🔊, 🎬, 📦, 🛑 Module-specific icons

### Audio Test Mode Display

```
PHONEME DETECTION
Current: A
History: REST → M → A → E

ANIMATION STATE
Mouth: a
Eyes: open

AUDIO INPUT
Level: 67%

ASSETS
Loaded Mouth Sprites: 6
Loaded Eye States: 2
Body Asset: Placeholder
```

### Global State Access

```javascript
// In browser console
window.appState;
// Shows: { testMode, isMicEnabled, assets, phonemeCategory, ... }
```

## 📱 Responsive Design

- **Desktop Layout**: Canvas left, control panel right
- **Mobile Layout**: Canvas top, control panel bottom (full width)
- Scaling handled automatically by PixiJS
- Canvas maintains 16:9 aspect ratio

## 🎮 Keyboard Shortcuts (Animation Test Mode)

| Key     | Action         |
| ------- | -------------- |
| `A`     | Mouth → A      |
| `E`     | Mouth → E      |
| `O`     | Mouth → O      |
| `U`     | Mouth → U      |
| `M`     | Mouth → M/B/P  |
| `F`     | Mouth → F/V    |
| `C`     | Mouth → Closed |
| `I`     | Mouth → Idle   |
| `Space` | Trigger Blink  |

## 🐛 Troubleshooting

### Microphone Not Working

- Check browser permissions: Chrome → Settings → Privacy → Microphone
- Ensure HTTPS or localhost (WebAudio requires secure context)
- Check audio input device in OS settings

### Sprites Not Loading

- Verify file format (PNG only)
- Check file dimensions (recommended sizes above)
- Check browser console for file loading errors
- Try placeholder test first (should always work)

### Lip Sync Not Detecting

- Ensure microphone volume is adequate (>20%)
- Check **Audio/Lip Sync Test Mode** for real-time diagnostics
- Mock Rhubarb provides basic fallback
- Consider background noise level

### Performance Issues

- Check browser console for frame rate warnings
- Reduce background browser tabs
- Ensure GPU acceleration is enabled
- Monitor CPU usage with DevTools Performance tab

## 🔧 Advanced Configuration

### Adjusting Blink Timing

Edit in [animation.js](src/animation.js):

```javascript
nextBlinkTime: Math.random() * 3 + 2, // 2-5 seconds
blinkDuration: 0.15, // 150ms
```

### Tweaking Phoneme Smoothing

Edit in [lipsync.js](src/lipsync.js):

```javascript
const SMOOTHING_FACTOR = 0.7; // 0-1 (higher = stickier)
```

### Audio Constraints

Edit in [audio.js](src/audio.js):

```javascript
audio: {
  echoCancellation: true,    // Remove speaker audio
  noiseSuppression: true,    // Remove background noise
  autoGainControl: false,    // Don't auto-normalize volume
  sampleRate: 16000,        // Optimal for speech
}
```

## 📦 Building for Production

```bash
npm run build
```

Output: `dist/` folder ready for deployment

### Deployment Considerations

- Use HTTPS (required for WebAudio/Microphone)
- Serve with proper CORS headers if hosting remotely
- Test in OBS browser source before streaming
- Consider CDN for PixiJS library
- Cache assets locally or use CloudFront

## 🚀 Adding Official Rhubarb

1. Download WASM binary from [Rhubarb GitHub](https://github.com/DanielSWolf/rhubarb-lip-sync)
2. Place `rhubarb.wasm` in `public/wasm/`
3. Uncomment WASM loading in [lipsync.js](src/lipsync.js)
4. Update phoneme mapping as needed for official output

## 📝 License

This project is provided as-is for VTuber and streaming use.

## 🤝 Contributing

For improvements or bug fixes, consider:

- Sprite quality optimization
- Additional language support
- Performance profiling
- OBS plugin integration

---

**Ready to stream!** 🎬✨
