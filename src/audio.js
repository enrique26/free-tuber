/**
 * audio.js
 * 
 * Microphone audio capture and real-time buffering
 * 
 * Responsibilities:
 * - Initialize WebAudio API context and constraints
 * - Request microphone permissions with proper error handling
 * - Capture real-time microphone audio via ScriptProcessorNode / AudioWorklet
 * - Buffer audio frames for Rhubarb processing
 * - Apply proper audio constraints (echo cancellation, noise suppression)
 * - Provide audio level metering for UI feedback
 * - Handle microphone enable/disable gracefully
 */

let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let analyser = null;
let isAudioRunning = false;
let audioBuffers = []; // Global buffer for audio data

/**
 * Initialize WebAudio API (called once at startup)
 */
export async function initAudio() {
  try {
    // Check browser support
    const audioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!audioContextClass) {
      throw new Error('WebAudio API not supported in this browser');
    }

    // Create audio context with sample rate suitable for speech
    audioContext = new audioContextClass({ sampleRate: 16000 });
    console.log(`🔊 AudioContext initialized at ${audioContext.sampleRate}Hz`);

    return { success: true };
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Start microphone capture
 */
export async function startMicrophone() {
  try {
    if (mediaStream) {
      console.warn('Microphone already running');
      return { success: true };
    }

    // Request microphone with proper constraints
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        sampleRate: 16000,
      },
      video: false,
    });

    console.log('✅ Microphone permission granted');

    // Create audio nodes
    const source = audioContext.createMediaStreamSource(mediaStream);

    // Create analyser for volume metering
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    // Create script processor for audio capture (deprecated but widely supported)
    // For better performance, AudioWorklet would be preferred, but this works reliably
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    // Process audio data
    scriptProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      
      // Copy audio data (convert Float32Array to Array for serialization if needed)
      const audioArray = new Float32Array(inputData.length);
      audioArray.set(inputData);

      audioBuffers.push({
        data: audioArray,
        timestamp: Date.now(),
        sampleRate: audioContext.sampleRate,
      });

      // Keep only recent buffers (~1 second worth)
      if (audioBuffers.length > 15) {
        audioBuffers.shift();
      }
    };

    // Connect to destination to ensure the audio graph is active
    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    isAudioRunning = true;

    // Store buffer queue globally for animation loop access
    window.audioBufferQueue = audioBuffers;

    return { success: true };
  } catch (error) {
    console.error('Microphone access denied or failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop microphone capture
 */
export async function stopMicrophone() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }

  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }

  isAudioRunning = false;
  window.audioBufferQueue = [];
  console.log('🛑 Microphone stopped');
}

/**
 * Get current audio level (0-100) for UI feedback
 * Useful for showing microphone activity
 */
export function getAudioLevel() {
  if (!analyser || !isAudioRunning) return 0;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Calculate average frequency magnitude
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }

  const average = sum / dataArray.length;
  
  // Normalize to 0-100
  return Math.min(100, Math.floor((average / 255) * 100));
}

/**
 * Check if microphone is currently running
 */
export function isMicrophoneRunning() {
  return isAudioRunning;
}

/**
 * Get current audio context
 */
export function getAudioContext() {
  return audioContext;
}
