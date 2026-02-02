/**
 * main.js
 * 
 * Entry point and PixiJS bootstrap
 * 
 * Responsibilities:
 * - Initialize PixiJS Application with correct canvas settings
 * - Set up the main animation loop (60 FPS via RAF)
 * - Create sprite layers and scene graph
 * - Orchestrate interaction between audio, lipsync, animation, and UI modules
 * - Manage global application state and communication between modules
 * - Handle canvas resizing and responsive behavior
 */

import { Application, Container, Sprite } from 'pixi.js';
import { initAudio, startMicrophone, stopMicrophone, getAudioLevel } from './audio.js';
import { initLipSync, processAudioBuffer, getPhonemeCategory } from './lipsync.js';
import { initAnimation, updateMouthSprite, updateEyeSprite, setEyeState, triggerBlink, loadAssetSprite, loadDefaultAssets } from './animation.js';
import { initUI } from './ui.js';

/**
 * Global application state
 */
const appState = {
  testMode: 'live',
  isMicEnabled: false,
  isAudioTestMode: false,
  assets: new Map(),
  phonemeCategory: 'idle',
  currentMouthState: 'idle',
  currentEyeState: 'open',
};

/**
 * Initialize PixiJS Application
 */
async function initializePixiJS() {
  const canvas = document.getElementById('pixi-canvas');
  
  if (!canvas) {
    throw new Error('Canvas element #pixi-canvas not found in DOM');
  }

  try {
    const app = new Application();
    
    // Wait for app to be ready
    await app.init({
      canvas: canvas,
      width: 1280,
      height: 720,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    console.log('✅ PixiJS app initialized');

    // Create main container for sprites
    const mainContainer = new Container();
    app.stage.addChild(mainContainer);

    // Create layers for z-ordering
    const layers = {
      body: new Container(),
      eyes: new Container(),
      mouth: new Container(),
    };

    Object.values(layers).forEach(layer => mainContainer.addChild(layer));

    return { app, mainContainer, layers };
  } catch (error) {
    console.error('Failed to initialize PixiJS:', error);
    throw error;
  }
}

/**
 * Main animation loop
 */
function startAnimationLoop(app, layers, audioProcessor) {
  function animate() {
    // Process audio if microphone is enabled
    if (appState.isMicEnabled && !appState.isAudioTestMode) {
      audioProcessor();
    }

    // Update mouth animation based on phoneme
    updateMouthSprite(layers.mouth, appState.phonemeCategory);

    // Update natural eye blinking
    updateEyeSprite(layers.eyes);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/**
 * Audio processing callback for animation loop
 */
function createAudioProcessor() {
  let bufferQueue = [];

  return async function processAudio() {
    // Get current audio buffer from microphone (this is populated by audio.js)
    const audioBuffer = window.audioBufferQueue?.shift();
    if (!audioBuffer) return;

    // Send to Rhubarb for lip sync analysis
    const phonemes = await processAudioBuffer(audioBuffer);
    
    if (phonemes && phonemes.length > 0) {
      // Get the most recent phoneme
      const latestPhoneme = phonemes[phonemes.length - 1];
      appState.phonemeCategory = getPhonemeCategory(latestPhoneme);
      appState.currentMouthState = appState.phonemeCategory;
    }
  };
}

/**
 * Load asset file and categorize it
 */
async function loadAssetFile(file, assetType) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const blob = new Blob([e.target.result], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        appState.assets.set(assetType, {
          url,
          type: assetType,
          fileName: file.name,
        });

        // Update asset count in UI
        document.getElementById('asset-count').textContent = appState.assets.size;
        
        // Immediately load the sprite
        await loadAssetSprite(assetType, url);
        console.log(`✅ Sprite loaded: ${assetType}`);
        
        resolve();
      } catch (error) {
        console.error(`Failed to load sprite ${assetType}:`, error);
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Main initialization
 */
async function main() {
  console.log('🎬 VTuber 2D Animator - Initializing...');

  try {
    // Initialize PixiJS
    const { app, mainContainer, layers } = await initializePixiJS();
    console.log('✅ PixiJS initialized');

    // Initialize audio system
    const audioState = await initAudio();
    console.log('✅ Audio system initialized');

    // Initialize lip sync (Rhubarb WASM)
    const lipSyncState = await initLipSync();
    console.log('✅ Lip sync system initialized');

    // Initialize animation system
    await initAnimation(layers);
    console.log('✅ Animation system initialized');

    // Load default assets from assets folder
    await loadDefaultAssets('/assets');
    console.log('✅ Default assets loaded');

    // Create audio processor
    const audioProcessor = createAudioProcessor();

    // Start animation loop
    startAnimationLoop(app, layers, audioProcessor);
    console.log('✅ Animation loop started');

    // Initialize UI and set up event handlers
    initUI({
      appState,
      onMicToggle: async (enabled) => {
        if (enabled) {
          const result = await startMicrophone();
          if (result.success) {
            appState.isMicEnabled = true;
            console.log('✅ Microphone started');
            return true;
          } else {
            console.error('❌ Microphone permission denied:', result.error);
            appState.isMicEnabled = false;
            return false;
          }
        } else {
          await stopMicrophone();
          appState.isMicEnabled = false;
          console.log('🛑 Microphone stopped');
          return true;
        }
      },

      onTestModeChange: (newMode) => {
        appState.testMode = newMode;
        appState.isAudioTestMode = newMode === 'audio';

        // Update UI visibility
        const animControlSection = document.getElementById('animation-control-section');
        const audioDiagnosticSection = document.getElementById('audio-diagnostic-section');

        if (newMode === 'animation') {
          animControlSection.style.display = 'flex';
          audioDiagnosticSection.style.display = 'none';
        } else if (newMode === 'audio') {
          animControlSection.style.display = 'none';
          audioDiagnosticSection.style.display = 'flex';
        } else {
          animControlSection.style.display = 'none';
          audioDiagnosticSection.style.display = 'none';
        }

        console.log(`📋 Test mode changed to: ${newMode}`);
      },

      onLoadAsset: async (files, assetType) => {
        for (const file of files) {
          await loadAssetFile(file, assetType);
        }
        console.log(`📦 Loaded ${files.length} asset(s)`);
      },

      onClearAssets: () => {
        appState.assets.forEach(asset => URL.revokeObjectURL(asset.url));
        appState.assets.clear();
        document.getElementById('asset-count').textContent = '0';
        console.log('🗑️ All assets cleared');
      },

      onMouthChange: (mouthType) => {
        // For manual testing
        updateMouthSprite(layers.mouth, mouthType);
        appState.currentMouthState = mouthType;
        console.log(`👄 Mouth changed to: ${mouthType}`);
      },

      onEyeOpen: () => {
        setEyeState(layers.eyes, 'open');
        appState.currentEyeState = 'open';
      },

      onEyeClosed: () => {
        setEyeState(layers.eyes, 'closed');
        appState.currentEyeState = 'closed';
      },

      onEyeBlink: () => {
        triggerBlink(layers.eyes);
        console.log('👁️ Blink triggered');
      },

      onDiagnosticUpdate: (diagnostics) => {
        const diagnosticText = document.getElementById('diagnostic-text');
        if (diagnosticText) {
          diagnosticText.textContent = diagnostics;
        }
      },

      getAppState: () => appState,
    });

    console.log('✅ UI initialized');
    console.log('🎬 Application ready!');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

// Start the application
main();

// Export for debugging
window.appState = appState;
