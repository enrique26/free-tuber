# Architecture Overview

## System Design

The VTuber 2D Animator is built using a modular, event-driven architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Environment                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │              HTML UI (index.html)                  │ │
│  │  - Canvas container (1280×720)                    │ │
│  │  - Control panel                                  │ │
│  │  - Diagnostic displays                            │ │
│  └────────────────────────────────────────────────────┘ │
│                           ↑                              │
│                    Event Handlers                        │
│                           ↓                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │              UI Module (ui.js)                     │ │
│  │  - Event listeners setup                          │ │
│  │  - Microphone toggle                              │ │
│  │  - Asset file loading                             │ │
│  │  - Test mode switching                            │ │
│  │  - Manual animation controls                      │ │
│  └────────────────────────────────────────────────────┘ │
│           ↑                  ↑                  ↑       │
│     Callbacks          State Updates      Diagnostics  │
│           ↓                  ↓                  ↓       │
│  ┌────────────────────────────────────────────────────┐ │
│  │       Main Orchestrator (main.js)                 │ │
│  │                                                    │ │
│  │  - PixiJS Application init                        │ │
│  │  - Animation loop (60 FPS RAF)                    │ │
│  │  - Global app state management                    │ │
│  │  - Module initialization                          │ │
│  │  - Cross-module communication                     │ │
│  └────────────────────────────────────────────────────┘ │
│     ↑            ↑              ↑              ↑       │
│     │            │              │              │       │
│  Audio      Animation        LipSync        State      │
│  Buffer      Update          Phonemes      Update     │
│     │            │              │              │       │
│  ┌──┴──┐  ┌──────┴──────┐  ┌───┴────┐      ┌─┴──┐  │
│  │     │  │             │  │        │      │    │  │
│  ▼     ▼  ▼             ▼  ▼        ▼      ▼    ▼  │
│ ┌──────────────┐  ┌───────────────┐  ┌─────────────┐ │
│ │ Audio (JS)   │  │Animation (JS) │  │LipSync (JS) │ │
│ │              │  │               │  │             │ │
│ │- WebAudio    │  │- Sprite mgmt  │  │- WASM load  │ │
│ │  API         │  │- Blinking     │  │- Phoneme    │ │
│ │- Microphone  │  │- Visibility   │  │  mapping    │ │
│ │- Permission  │  │- Position     │  │- Smoothing  │ │
│ │- Buffering   │  │- Layering     │  │             │ │
│ │- Level meter │  │               │  │             │ │
│ └──────────────┘  └───────────────┘  └─────────────┘ │
│        ↑                  ↑                  ↑       │
│        │                  │                  │       │
│   Audio Buffers      PixiJS Layers      Phoneme     │
│   Level Data         Container          Events      │
│        │                  │                  │       │
└────────┼──────────────────┼──────────────────┼───────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
         ▼                                     ▼
    ┌─────────────────┐              ┌─────────────────┐
    │   WebAudio API  │              │   PixiJS        │
    │                 │              │                 │
    │- getUserMedia  │              │- Application    │
    │- ScriptProc.   │              │- Sprites        │
    │- Analyser      │              │- Renderer       │
    │- Destination   │              │- Canvas         │
    └─────────────────┘              └─────────────────┘
         │                                     │
         ▼                                     ▼
    ┌─────────────────┐              ┌─────────────────┐
    │  Microphone     │              │  Screen Canvas  │
    │  (OS-level)     │              │  1280×720       │
    └─────────────────┘              └─────────────────┘
```

## Module Responsibilities

### main.js - Orchestration & Bootstrap

**Purpose**: Central hub that ties all systems together

**Key Responsibilities:**

- Initialize PixiJS with correct settings (1280×720, transparent, 60 FPS)
- Create sprite layer hierarchy
- Start animation loop via `requestAnimationFrame`
- Manage global application state (`appState`)
- Orchestrate module initialization
- Provide callbacks to UI module
- Process audio buffers in animation loop

**Key Functions:**

```javascript
initializePixiJS(); // Create PixiJS app
startAnimationLoop(); // RAF 60 FPS loop
createAudioProcessor(); // Closure for audio handling
main(); // Bootstrap entire system
```

**Data Flow:**

```
UI Event → main.js callback → Update appState
                           ↓
                    Animation Loop
                           ↓
                    audioProcessor()
                           ↓
                  Read audio buffer
                    ↓
                  Send to lipsync
                    ↓
                  Get phoneme
                    ↓
                  Update appState
                    ↓
                  Next frame renders
```

### audio.js - Microphone Input

**Purpose**: Real-time microphone audio capture

**Key Responsibilities:**

- Initialize WebAudio context (16kHz for speech)
- Request microphone with proper constraints
- Handle permission denial gracefully
- Capture audio via ScriptProcessorNode
- Buffer audio frames for Rhubarb
- Provide audio level metering
- Clean shutdown on disable

**Key Functions:**

```javascript
initAudio(); // Create AudioContext
startMicrophone(); // Request permission & start capture
stopMicrophone(); // Cleanup and stop
getAudioLevel(); // Return 0-100% for UI display
```

**Audio Pipeline:**

```
Microphone
   ↓
getUserMedia() with constraints
   ↓
MediaStreamSource node
   ↓
ScriptProcessorNode (4096 sample chunks)
   ↓
onaudioprocess callback
   ↓
Buffer audio data
   ↓
window.audioBufferQueue (global queue)
   ↓
Animation loop processes queue
```

**Constraints Applied:**

- `echoCancellation: true` - Remove speaker audio
- `noiseSuppression: true` - Reduce background noise
- `autoGainControl: false` - Preserve volume dynamics (important for lip sync!)
- `sampleRate: 16000` - Optimal for speech analysis

### lipsync.js - Rhubarb Integration

**Purpose**: Convert audio to phoneme events

**Key Responsibilities:**

- Load Rhubarb WASM or fallback to mock
- Process audio buffers → phoneme extraction
- Map 25 phonemes to 8 animation categories
- Apply smoothing to avoid jittery transitions
- Provide diagnostic information

**Key Functions:**

```javascript
initLipSync(); // Load WASM or mock
processAudioBuffer(); // Process single audio chunk
getPhonemeCategory(); // Map phoneme to animation state
getDiagnosticInfo(); // Return current state for UI
resetPhonemeHistory(); // Clear history
```

**Phoneme Mapping:**

| Input Phonemes   | Category | Animation  | Visual          |
| ---------------- | -------- | ---------- | --------------- |
| A, I, L          | `a`      | mouth_a    | Wide open smile |
| E                | `e`      | mouth_e    | Medium open     |
| O                | `o`      | mouth_o    | Rounded lips    |
| U                | `u`      | mouth_u    | Narrow lips     |
| M, B, P, N       | `m`      | mouth_m    | Closed pressed  |
| F, V, T, D, S, Z | `f`      | mouth_f    | Teeth visible   |
| Silence/Rest     | `idle`   | mouth_idle | Neutral closed  |

**Processing Pipeline:**

```
Audio Buffer (Float32Array)
   ↓
Rhubarb WASM analyzeAudio()
   ↓
Phoneme Event Array
   {
     phoneme: 'A',
     start: 0.1,
     duration: 0.2
   }
   ↓
getPhonemeCategory()
   ↓
Apply smoothing (history-based)
   ↓
Return animation category
   ↓
appState.phonemeCategory = 'a'
```

**Smoothing Algorithm:**

```javascript
// Hysteresis to prevent chattering
if (newCategory !== previousCategory) {
  if (Math.random() > SMOOTHING_FACTOR) {
    // Keep previous category
    category = previousCategory;
  }
}
// Keep 10-frame history for analysis
```

### animation.js - Sprite Rendering

**Purpose**: Manage character sprite layers

**Key Responsibilities:**

- Create placeholder sprites for all sprite types
- Manage mouth sprite visibility based on phoneme
- Implement automatic eye blinking
- Load user PNG assets
- Handle sprite positioning and layering
- Provide manual control for testing

**Key Functions:**

```javascript
initAnimation(); // Create all placeholder sprites
updateMouthSprite(); // Switch mouth based on phoneme
updateEyeSprite(); // Handle automatic blinking
setEyeState(); // Manual eye open/close
triggerBlink(); // Force immediate blink
loadAssetSprite(); // Load user PNG into system
getAnimationState(); // Return current state
```

**Sprite Hierarchy:**

```
PixiJS Stage (1280×720)
   └── Main Container
       ├── Body Layer
       │   └── body sprite
       ├── Eyes Layer
       │   ├── eye_open sprite (visible initially)
       │   └── eye_closed sprite (hidden)
       └── Mouth Layer
           ├── mouth_idle sprite (visible initially)
           ├── mouth_a sprite (hidden)
           ├── mouth_e sprite (hidden)
           ├── mouth_o sprite (hidden)
           ├── mouth_u sprite (hidden)
           ├── mouth_m sprite (hidden)
           ├── mouth_f sprite (hidden)
           └── mouth_closed sprite (hidden)
```

**Eye Blinking Algorithm:**

```javascript
// Ran every frame (16.67ms at 60 FPS)

if (isBlinking) {
  blinkTimer += deltaTime;
  if (blinkTimer > blinkDuration) {
    // Blink finished
    isBlinking = false;
    nextBlinkTime = random(2-5 seconds);
  }
} else {
  timeSinceLastBlink += deltaTime;
  if (timeSinceLastBlink > nextBlinkTime) {
    // Trigger blink
    isBlinking = true;
  }
}

// Show/hide eyes based on state
eyeOpen.visible = !isBlinking;
eyeClosed.visible = isBlinking;
```

### ui.js - Event Handling

**Purpose**: User interface and event management

**Key Responsibilities:**

- Setup DOM event listeners
- Manage microphone toggle button state
- Handle asset file loading
- Switch between test modes
- Manual animation control (buttons + keyboard)
- Update diagnostic displays
- Provide keyboard shortcuts

**Key Functions:**

```javascript
initUI(); // Setup all event handlers
```

**Event Handlers Connected:**

- Microphone button → `onMicToggle()`
- File input → `onLoadAsset()`
- Test mode select → `onTestModeChange()`
- Mouth buttons → `onMouthChange()`
- Eye buttons → `onEyeOpen()`, `onEyeClosed()`, `onEyeBlink()`
- Keyboard shortcuts (animation test mode)

**Test Mode UI Switching:**

```javascript
if (mode === "animation") {
  // Show: manual animation controls
  // Hide: diagnostic display
} else if (mode === "audio") {
  // Show: diagnostic display
  // Hide: manual animation controls
} else if (mode === "live") {
  // Show: only canvas
  // Hide: all controls
}
```

## Data Flow - Complete Example

### Real-Time Lip Sync Flow (100ms interval)

```
1. USER SPEAKS INTO MICROPHONE
   ↓
2. WebAudio captures 16kHz audio
   audio.js → ScriptProcessorNode
   ↓
3. Audio buffers queued
   window.audioBufferQueue = [{ data: Float32Array, sampleRate: 16000 }]
   ↓
4. Animation Loop (60 FPS)
   main.js → startAnimationLoop()
   ↓
5. Process Audio
   main.js → audioProcessor() → lipsync.processAudioBuffer()
   ↓
6. Rhubarb Analysis
   lipsync.js → rhubarb.analyzeAudio(buffer)
   Returns: [{ phoneme: 'A', start: 0.1, duration: 0.2 }]
   ↓
7. Map Phoneme
   lipsync.js → getPhonemeCategory('A')
   Returns: 'a' with smoothing applied
   ↓
8. Update State
   main.js → appState.phonemeCategory = 'a'
   ↓
9. Render Frame
   animation.js → updateMouthSprite(layers.mouth, 'a')
   Sets mouth_a visible, hides others
   ↓
10. PixiJS renders
    app.render() → Canvas updates
    ↓
11. Display on Screen (16.67ms later at 60 FPS)
```

## State Management

### Global appState (main.js)

```javascript
const appState = {
  testMode: "live", // 'animation' | 'audio' | 'live'
  isMicEnabled: false, // Microphone is on
  isAudioTestMode: false, // Audio test mode active
  assets: new Map(), // Loaded PNG sprites
  phonemeCategory: "silence", // Current phoneme: 'a'|'e'|'o'|'u'|'m'|'f'|'idle'
  currentMouthState: "idle", // Current mouth sprite visible
  currentEyeState: "open", // Current eye: 'open'|'closed'
};
```

This is the single source of truth shared between:

- UI module (reads/updates via callbacks)
- Animation loop (reads for sprite updates)
- Audio processor (updates phoneme)

## Performance Considerations

### Animation Loop (60 FPS)

```javascript
requestAnimationFrame(animate);  // Browser targets 60 FPS

// ~16.67ms per frame
deltaTime ≈ 16.67ms

// If frame takes longer, warning logged
if (deltaTime > 16.67 * 1.5) {
  console.warn('Slow frame detected');
}
```

### Audio Processing

```javascript
// Separate from render loop
// ScriptProcessorNode: 4096 samples = ~256ms of audio
// Queued in window.audioBufferQueue
// Processed once per animation frame
// Asymmetric: audio slower than render, but that's OK
```

### Asset Loading

```javascript
// Asynchronous FileReader
FileReader.readAsArrayBuffer()   // Non-blocking

// Convert to blob URL
URL.createObjectURL(blob)        // Instant

// Image texture load
new Image() → onload             // May take 10-50ms
// Scheduled after file is ready

// No blocking on main thread
```

## Error Handling

### Microphone Permission Denied

```
startMicrophone()
   ↓
getUserMedia() rejects
   ↓
Catch error
   ↓
Return { success: false, error: message }
   ↓
UI callback updates button state
   ↓
User informed via status indicator
```

### Invalid Asset File

```
File loaded
   ↓
FileReader reads OK
   ↓
Image element errors on load
   ↓
Catch error in loadSpriteImage()
   ↓
Log to console
   ↓
Placeholder remains
```

### Rhubarb WASM Load Failure

```
loadRhubarbWasm()
   ↓
fetch('/wasm/rhubarb.wasm') fails
   ↓
Return null
   ↓
Use MockRhubarb fallback
   ↓
App continues with basic lip sync
   ↓
User still sees animation (less accurate)
```

## Browser APIs Used

| API                   | Purpose                    | Fallback               |
| --------------------- | -------------------------- | ---------------------- |
| WebAudio              | Audio capture & processing | Required (no fallback) |
| MediaDevices          | Microphone permission      | Required               |
| FileReader            | Asset loading              | Required               |
| Canvas                | Rendering by PixiJS        | Required               |
| requestAnimationFrame | Animation loop             | setTimeout (worse)     |
| Blob API              | Asset URL generation       | Required               |
| WebAssembly           | Rhubarb WASM               | Mock implementation    |

## Browser Compatibility

| Feature      | Chrome  | Firefox | Safari    | Edge    |
| ------------ | ------- | ------- | --------- | ------- |
| WebAudio API | ✅ Full | ✅ Full | ⚠️ webkit | ✅ Full |
| getUserMedia | ✅ Full | ✅ Full | ✅ Full   | ✅ Full |
| WASM         | ✅ Full | ✅ Full | ✅ Full   | ✅ Full |
| PixiJS       | ✅ Full | ✅ Full | ✅ Full   | ✅ Full |
| Canvas       | ✅ Full | ✅ Full | ✅ Full   | ✅ Full |

**Tested & Recommended**: Chrome/Chromium 90+, Firefox 88+, Edge 90+

## Testing Strategy

### Unit Testing Modules

```javascript
// lipsync.js - Phoneme mapping
simulatePhonemeSequence(["A", "E", "O"]);
// Returns correctly mapped categories

// audio.js - Level detection
getAudioLevel(); // Returns 0-100

// animation.js - Sprite state
getAnimationState();
// Returns loaded sprites and current state
```

### Integration Testing

```javascript
// Audio Test Mode
Enable Microphone
→ Speak
→ Watch phoneme output in diagnostic
→ Verify animation matches expected phoneme

// Animation Test Mode
Load PNG files
→ Click mouth buttons
→ Verify sprite displays
→ Press keyboard shortcuts
→ Verify smooth transitions
```

### Performance Testing

```javascript
// DevTools Performance tab
1. Record 5 seconds of runtime
2. Look for 60 FPS (16.67ms frames)
3. Check GPU vs CPU workload
4. Profile PixiJS render time
5. Verify no memory leaks
```

---

**Architecture is stable and production-ready!** ✅
