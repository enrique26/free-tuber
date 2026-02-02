/**
 * ui.js
 * 
 * UI controls and test modes management
 * 
 * Responsibilities:
 * - Initialize UI event handlers and DOM elements
 * - Manage asset loading UI and drag-drop
 * - Handle microphone toggle and permission UI
 * - Manage test mode switching and visibility
 * - Update diagnostic displays in real-time
 * - Provide manual animation control for testing
 * - Display audio level metering
 */

import { getAudioLevel } from './audio.js';
import { getDiagnosticInfo } from './lipsync.js';
import { getAnimationState } from './animation.js';

/**
 * Initialize UI system
 */
export function initUI(callbacks) {
  const {
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
  } = callbacks;

  // ==================== Microphone Controls ====================

  const micToggleBtn = document.getElementById('mic-toggle-btn');
  const micStatusDot = document.getElementById('mic-status-dot');
  const micStatusText = document.getElementById('mic-status-text');
  const micVolumeDisplay = document.getElementById('mic-volume');

  micToggleBtn.addEventListener('click', async () => {
    const enabled = !appState.isMicEnabled;

    if (enabled) {
      micToggleBtn.disabled = true;
      micToggleBtn.textContent = 'Enabling...';

      const success = await onMicToggle(true);
      
      if (success) {
        micToggleBtn.textContent = 'Disable Microphone';
        micToggleBtn.classList.remove('success');
        micToggleBtn.classList.add('danger');
        micStatusDot.classList.add('active');
        micStatusText.textContent = 'Microphone: Active';
      } else {
        micToggleBtn.textContent = 'Enable Microphone';
        micToggleBtn.classList.add('success');
        micToggleBtn.classList.remove('danger');
        micStatusDot.classList.remove('active');
        micStatusText.textContent = 'Microphone: Permission Denied';
      }

      micToggleBtn.disabled = false;
    } else {
      await onMicToggle(false);
      micToggleBtn.textContent = 'Enable Microphone';
      micToggleBtn.classList.add('success');
      micToggleBtn.classList.remove('danger');
      micStatusDot.classList.remove('active');
      micStatusText.textContent = 'Microphone: Off';
    }
  });

  // Update microphone volume display
  setInterval(() => {
    if (appState.isMicEnabled) {
      const level = getAudioLevel();
      micVolumeDisplay.textContent = level;
    }
  }, 100);

  // ==================== Asset Loading ====================

  const assetFileInput = document.getElementById('asset-file-input');
  const assetTypeSelect = document.getElementById('asset-type-select');
  const clearAssetsBtn = document.getElementById('clear-assets-btn');

  assetFileInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    const assetType = assetTypeSelect.value;

    if (!assetType) {
      alert('Please select an asset type first');
      assetFileInput.value = '';
      return;
    }

    if (files.length === 0) return;

    // Show loading state
    clearAssetsBtn.disabled = true;

    try {
      await onLoadAsset(files, assetType);
      console.log(`✅ Loaded ${files.length} asset(s) as ${assetType}`);
    } catch (error) {
      console.error('Failed to load assets:', error);
      alert(`Failed to load assets: ${error.message}`);
    } finally {
      assetFileInput.value = '';
      clearAssetsBtn.disabled = false;
      assetTypeSelect.value = '';
    }
  });

  clearAssetsBtn.addEventListener('click', () => {
    if (confirm('Clear all loaded assets?')) {
      onClearAssets();
    }
  });

  // ==================== Test Mode Selection ====================

  const testModeSelect = document.getElementById('test-mode-select');

  testModeSelect.addEventListener('change', (event) => {
    const newMode = event.target.value;
    onTestModeChange(newMode);
  });

  // ==================== Manual Animation Controls ====================

  const mouthBtns = document.querySelectorAll('.mouth-btn');
  mouthBtns.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const mouthType = event.target.dataset.mouth;
      onMouthChange(mouthType);
      
      // Visual feedback
      mouthBtns.forEach(b => b.style.opacity = '0.6');
      event.target.style.opacity = '1';
    });
  });

  const eyeOpenBtn = document.getElementById('eye-open-btn');
  const eyeClosedBtn = document.getElementById('eye-closed-btn');
  const eyeBlinkBtn = document.getElementById('eye-blink-btn');

  eyeOpenBtn.addEventListener('click', () => {
    onEyeOpen();
    eyeOpenBtn.style.opacity = '1';
    eyeClosedBtn.style.opacity = '0.6';
  });

  eyeClosedBtn.addEventListener('click', () => {
    onEyeClosed();
    eyeClosedBtn.style.opacity = '1';
    eyeOpenBtn.style.opacity = '0.6';
  });

  eyeBlinkBtn.addEventListener('click', () => {
    onEyeBlink();
  });

  // ==================== Diagnostic Display ====================

  // Update diagnostics in audio test mode
  setInterval(() => {
    if (appState.testMode === 'audio') {
      const diagnosticInfo = getDiagnosticInfo();
      const animationInfo = getAnimationState();

      const diagnosticLines = [
        `[${new Date().toLocaleTimeString()}]`,
        '',
        'PHONEME DETECTION',
        `Current: ${diagnosticInfo.phoneme.toUpperCase()}`,
        `History: ${diagnosticInfo.history.join(' → ')}`,
        `Using: ${diagnosticInfo.isUsingMock ? 'Mock Rhubarb' : 'Official Rhubarb'}`,
        '',
        'ANIMATION STATE',
        `Mouth: ${animationInfo.currentMouthType}`,
        `Eyes: ${animationInfo.currentEyeState}${animationInfo.isBlinking ? ' (blinking)' : ''}`,
        '',
        'AUDIO INPUT',
        `Level: ${getAudioLevel()}%`,
        '',
        'ASSETS',
        `Loaded Mouth Sprites: ${animationInfo.loadedMouth.length}`,
        `Loaded Eye States: ${animationInfo.loadedEyes.length}`,
        `Body Asset: ${animationInfo.bodyLoaded ? 'Loaded' : 'Placeholder'}`,
      ];

      onDiagnosticUpdate(diagnosticLines.join('\n'));
    }
  }, 250);

  // ==================== Keyboard Shortcuts ====================

  document.addEventListener('keydown', (event) => {
    // Spacebar to trigger microphone
    if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
      event.preventDefault();
      // Could be used for push-to-talk mode in future
    }

    // Test shortcuts
    if (appState.testMode === 'animation') {
      switch (event.key.toLowerCase()) {
        case 'a': onMouthChange('a'); break;
        case 'e': onMouthChange('e'); break;
        case 'o': onMouthChange('o'); break;
        case 'u': onMouthChange('u'); break;
        case 'm': onMouthChange('m'); break;
        case 'f': onMouthChange('f'); break;
        case 'c': onMouthChange('closed'); break;
        case 'i': onMouthChange('idle'); break;
        case ' ': onEyeBlink(); break;
      }
    }
  });

  console.log('✅ UI initialized');
}
