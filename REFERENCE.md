# Developer Reference Card

## Module API Quick Reference

### main.js

```javascript
// Global state (read/write from any module)
window.appState = {
  testMode: "live",
  isMicEnabled: false,
  assets: Map,
  phonemeCategory: "silence",
  currentMouthState: "idle",
  currentEyeState: "open",
};

// Audio buffers queue
window.audioBufferQueue = [{ data: Float32Array, timestamp, sampleRate }];
```

### audio.js

```javascript
// Initialize WebAudio
await initAudio();
// Returns: { success: true }

// Start microphone
await startMicrophone();
// Returns: { success: bool, error?: string }

// Stop microphone
await stopMicrophone();

// Get audio level (0-100%)
const level = getAudioLevel();

// Check status
isMicrophoneRunning(); // boolean

// Get audio context
getAudioContext(); // AudioContext
```

### lipsync.js

```javascript
// Initialize lip sync
await initLipSync();
// Returns: { success: true, usingMock?: true }

// Process single audio buffer
const phonemes = await processAudioBuffer({
  data: Float32Array,
  sampleRate: 16000,
});
// Returns: [{ phoneme: 'A', start: 0.1, duration: 0.2 }]

// Map phoneme to animation category
const category = getPhonemeCategory({
  phoneme: "A",
});
// Returns: 'a' | 'e' | 'o' | 'u' | 'm' | 'f' | 'idle'

// Get diagnostic info
getDiagnosticInfo();
// Returns: { phoneme, history[], isUsingMock }

// Reset history
resetPhonemeHistory();

// Simulate for testing
simulatePhonemeSequence(["A", "E", "O"]);
```

### animation.js

```javascript
// Initialize animation system
await initAnimation(layers);
// Returns: { success: true }

// Update mouth sprite
updateMouthSprite(mouthLayer, "a" | "e" | "o" | "u" | "m" | "f" | "idle");

// Update eye (with auto-blinking)
updateEyeSprite(eyeLayer);

// Set eye state manually
setEyeState(eyeLayer, "open" | "closed");

// Trigger blink immediately
triggerBlink(eyeLayer);

// Load user PNG asset
await loadAssetSprite("mouth_a", "blob:...");

// Get current state
getAnimationState();
// Returns: { currentMouthType, currentEyeState, isBlinking, loadedMouth[], ... }

// Check if PixiJS ready
ensurePixiLoaded(); // boolean
```

### ui.js

```javascript
// Initialize UI (called from main.js)
initUI({
  appState,
  onMicToggle,
  onTestModeChange,
  onLoadAsset,
  onClearAssets,
  onMouthChange,
  onEyeOpen,
  onEyeClosed,
  onEyeBlink,
  onDiagnosticUpdate,
  getAppState,
});
```

## Event Flow Diagram

### Microphone Enable

```
User clicks "Enable Microphone"
  ↓
UI Handler
  ↓
Call onMicToggle(true)
  ↓
main.js calls startMicrophone()
  ↓
audio.js requests getUserMedia()
  ↓
Browser permission dialog
  ↓
User allows/denies
  ↓
Return success/error
  ↓
Update button state
  ↓
Update status indicator
```

### Sprite Loading

```
User selects "Mouth - A"
  ↓
User clicks "Load PNG Assets"
  ↓
File picker opens
  ↓
User selects PNG
  ↓
UI Handler
  ↓
Call onLoadAsset([file], 'mouth_a')
  ↓
main.js → FileReader.readAsArrayBuffer()
  ↓
Create blob URL
  ↓
Call animation.loadAssetSprite('mouth_a', blobUrl)
  ↓
Create Image element
  ↓
Wait for image.onload
  ↓
Create PixiJS texture
  ↓
Replace placeholder sprite
  ↓
Update asset count
```

### Live Animation Cycle

```
60 FPS Animation Loop
  ↓
Every frame (~16.67ms):
  ├─ Get audio buffer from queue
  ├─ Send to Rhubarb
  ├─ Get phoneme back
  ├─ Map to category
  ├─ Update appState.phonemeCategory
  ├─ Call updateMouthSprite()
  ├─ Call updateEyeSprite()
  ├─ app.render()
  ↓
Next frame
```

## Key Phoneme Categories

| Category | Phonemes         | Visual          | Sprite File    |
| -------- | ---------------- | --------------- | -------------- |
| `a`      | A, I, L          | Wide open smile | mouth_a.png    |
| `e`      | E                | Medium open     | mouth_e.png    |
| `o`      | O                | Rounded         | mouth_o.png    |
| `u`      | U                | Narrow          | mouth_u.png    |
| `m`      | M, B, P, N       | Closed pressed  | mouth_m.png    |
| `f`      | F, V, T, D, S, Z | Teeth visible   | mouth_f.png    |
| `idle`   | Silence/Rest     | Neutral closed  | mouth_idle.png |

## CSS Classes & IDs

### HTML Elements

```html
<!-- Main canvas -->
<canvas id="pixi-canvas"></canvas>

<!-- Microphone controls -->
<button id="mic-toggle-btn"></button>
<div id="mic-status-dot"></div>
<span id="mic-status-text"></span>
<span id="mic-volume"></span>

<!-- Asset controls -->
<input id="asset-file-input" type="file" />
<select id="asset-type-select"></select>
<button id="clear-assets-btn"></button>
<span id="asset-count"></span>

<!-- Test mode -->
<select id="test-mode-select"></select>

<!-- Animation controls -->
<div id="animation-control-section">
  <button class="mouth-btn" data-mouth="idle">Idle</button>
  <button id="eye-open-btn">Open</button>
  <button id="eye-closed-btn">Closed</button>
  <button id="eye-blink-btn">Blink</button>
</div>

<!-- Diagnostics -->
<div id="audio-diagnostic-section">
  <div id="diagnostic-text"></div>
</div>
```

### CSS Utilities

```css
/* Status indicator */
.status-dot.active {
  background: #33dd33;
  animation: pulse 1.5s infinite;
}

/* Button states */
button.success {
  background: #33cc33;
}
button.danger {
  background: #cc3333;
}
button.secondary {
  background: #444;
}
button:disabled {
  opacity: 0.6;
}

/* Loading spinner */
.spinner {
  animation: spin 0.8s linear infinite;
}
```

## Keyboard Shortcuts (Animation Test Mode)

| Key     | Action         |
| ------- | -------------- |
| `A`     | Mouth → A      |
| `E`     | Mouth → E      |
| `O`     | Mouth → O      |
| `U`     | Mouth → U      |
| `M`     | Mouth → M      |
| `F`     | Mouth → F      |
| `C`     | Mouth → Closed |
| `I`     | Mouth → Idle   |
| `Space` | Trigger Blink  |

## Browser Console Tricks

```javascript
// View app state
window.appState;

// View audio buffer queue
window.audioBufferQueue;

// Get current audio level
import { getAudioLevel } from "./src/audio.js";
getAudioLevel();

// Trigger phoneme
import { getPhonemeCategory } from "./src/lipsync.js";
getPhonemeCategory({ phoneme: "A" });

// Test animation
import { updateMouthSprite } from "./src/animation.js";
// (need reference to layers.mouth - not directly accessible)
```

## Performance Tips

### Optimize Sprite Loading

```javascript
// Do: Load once, cache
const sprite = await loadAssetSprite("mouth_a", url);

// Don't: Reload every frame
for (let i = 0; i < 60; i++) {
  loadAssetSprite("mouth_a", url); // Bad!
}
```

### Optimize Event Handlers

```javascript
// Do: Use debouncing for frequent updates
let updateTimer;
function onAudioData() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    // Update diagnostics
  }, 50);
}

// Don't: Update every single frame
onAudioprocess = () => {
  updateDOM(); // Heavy!
};
```

### Optimize Sprite Memory

```javascript
// Do: Reuse sprites, just change visibility
sprite.visible = false;

// Don't: Create new sprites
removeChild(sprite);
sprite = new Sprite(texture); // Memory leak!
```

## Test Checklist

- [ ] **Animation System**
  - [ ] Placeholders render correctly
  - [ ] Keyboard shortcuts work
  - [ ] All 8 mouth states switchable
  - [ ] Eye blink triggers correctly

- [ ] **Audio System**
  - [ ] Microphone permission dialog appears
  - [ ] Audio level updates
  - [ ] Audio buffers queued

- [ ] **Lip Sync**
  - [ ] Phonemes detected in test mode
  - [ ] Smooth transitions between states
  - [ ] No chattering/jitter

- [ ] **Asset Loading**
  - [ ] File picker opens
  - [ ] PNG loads correctly
  - [ ] Sprite replaces placeholder
  - [ ] Multiple assets can load
  - [ ] Clear all works

- [ ] **OBS Integration**
  - [ ] Browser source URL works
  - [ ] 1280×720 resolution correct
  - [ ] Canvas transparent
  - [ ] Animation visible in OBS

- [ ] **Performance**
  - [ ] Maintains 60 FPS
  - [ ] No memory leaks
  - [ ] CPU usage <50%
  - [ ] GPU usage <30%

## Common Code Patterns

### Reading Audio Buffers

```javascript
const audioBuffer = window.audioBufferQueue.shift();
if (!audioBuffer) return;

const { data, sampleRate } = audioBuffer;
// Use data (Float32Array) for analysis
```

### Updating UI from Animation Loop

```javascript
// Do: Update via state
appState.phonemeCategory = "a";
// Then render updates UI (in separate interval)

// Don't: Direct DOM manipulation in RAF
document.getElementById("x").textContent = "y";
```

### Handling Async Operations

```javascript
// Do: Use async/await
try {
  await startMicrophone();
  console.log("Microphone started");
} catch (error) {
  console.error("Failed:", error);
}

// Don't: Forget error handling
await startMicrophone(); // Could crash!
```

### Cleanup on Disable

```javascript
// Do: Properly stop resources
await stopMicrophone();
resetPhonemeHistory();
window.audioBufferQueue = [];

// Don't: Leave hanging listeners
// mediaStream keeps running...
```

## Deployment Checklist

- [ ] Run `npm install` and `npm run build`
- [ ] Test in Chrome, Firefox, Edge
- [ ] Test microphone permission flow
- [ ] Test asset loading with various PNGs
- [ ] Test OBS browser source
- [ ] Check console for errors
- [ ] Verify HTTPS working
- [ ] Profile performance (60 FPS)
- [ ] Test on target streaming setup
- [ ] Create sprite assets for your character
- [ ] Document custom phoneme mappings

---

**Keep this reference handy!** 📝
