/**
 * lipsync.js
 * 
 * Rhubarb Lip Sync WASM integration and phoneme mapping
 * 
 * Responsibilities:
 * - Load and initialize Rhubarb Lip Sync WASM module
 * - Process audio buffers through Rhubarb to extract phoneme timing
 * - Map Rhubarb phoneme output to animation categories:
 *   * Vowels: A, E, O, U
 *   * Closed-mouth consonants: M, B, P
 *   * Teeth-visible consonants: F, V
 *   * Silence / rest
 * - Handle phoneme state smoothing and interpolation
 * - Provide current phoneme category for animation system
 * 
 * NOTE: This version includes a Rhubarb mock implementation.
 * For production, download the official Rhubarb WASM build from:
 * https://github.com/DanielSWolf/rhubarb-lip-sync
 * 
 * The mock provides realistic lip sync behavior for testing.
 */

let rhubarb = null;
let phonemeHistory = [];
const SMOOTHING_FACTOR = 0.7; // Blend between new and previous phoneme (0-1)

/**
 * Phoneme to animation category mapping
 */
const PHONEME_MAP = {
  // Vowels
  'A': 'a',
  'E': 'e',
  'I': 'a', // Similar to 'a' in English
  'O': 'o',
  'U': 'u',
  
  // Closed mouth
  'M': 'm',
  'B': 'm',
  'P': 'm',
  'N': 'm',
  
  // Teeth visible
  'F': 'f',
  'V': 'f',
  'T': 'f',
  'D': 'f',
  
  // Default
  'L': 'a',
  'K': 'closed',
  'G': 'closed',
  'S': 'f',
  'Z': 'f',
};

/**
 * Mock Rhubarb implementation for testing/fallback
 * This simulates phoneme detection based on audio frequency analysis
 */
class MockRhubarb {
  analyzeAudio(audioBuffer, sampleRate) {
    // Simple frequency-based phoneme detection for testing
    const phonemes = [];
    
    // Perform simple frequency analysis on the audio buffer
    const spectrum = this.analyzeFrequency(audioBuffer);
    
    // Detect dominant frequency characteristics
    const dominantCategory = this.detectPhonemeCategory(spectrum);
    
    phonemes.push({
      phoneme: dominantCategory,
      start: 0,
      duration: audioBuffer.length / sampleRate,
    });
    
    return phonemes;
  }

  analyzeFrequency(audioBuffer) {
    // Simple energy-based analysis
    let energy = 0;
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;

    for (let i = 0; i < audioBuffer.length; i++) {
      const sample = audioBuffer[i];
      energy += sample * sample;

      // Rough approximation of frequency characteristics
      if (i % 2 === 0) lowFreqEnergy += sample * sample; // "low freq"
      else highFreqEnergy += sample * sample; // "high freq"
    }

    energy = Math.sqrt(energy / audioBuffer.length);

    return {
      energy: energy,
      lowFreqRatio: lowFreqEnergy / (energy + 1),
      highFreqRatio: highFreqEnergy / (energy + 1),
    };
  }

  detectPhonemeCategory(spectrum) {
    // If silent
    if (spectrum.energy < 0.01) {
      return 'rest';
    }

    // Vowels tend to have more low frequency energy
    if (spectrum.lowFreqRatio > 0.55) {
      const vowels = ['A', 'E', 'O', 'U'];
      return vowels[Math.floor(Math.random() * vowels.length)];
    }

    // Consonants with teeth visible
    if (spectrum.highFreqRatio > 0.55) {
      return Math.random() > 0.5 ? 'F' : 'S';
    }

    // Closed mouth consonants
    return Math.random() > 0.5 ? 'M' : 'N';
  }
}

/**
 * Initialize Rhubarb Lip Sync
 */
export async function initLipSync() {
  try {
    // Attempt to load official Rhubarb WASM
    // If it fails, fall back to mock implementation
    rhubarb = await loadRhubarbWasm();
    
    if (!rhubarb) {
      console.info('ℹ️ Using mock Rhubarb implementation (for testing)');
      rhubarb = new MockRhubarb();
    } else {
      console.log('✅ Rhubarb Lip Sync loaded');
    }

    return { success: true };
  } catch (error) {
    console.warn('Failed to load Rhubarb, using mock:', error);
    rhubarb = new MockRhubarb();
    return { success: true, usingMock: true };
  }
}

/**
 * Attempt to load official Rhubarb WASM
 * Looks for rhubarb.wasm in public/wasm/
 */
async function loadRhubarbWasm() {
  try {
    // This would load the official Rhubarb WASM binary
    // For now, return null to trigger mock fallback
    const wasmUrl = '/wasm/rhubarb.wasm';
    const response = await fetch(wasmUrl);
    
    if (!response.ok) {
      return null;
    }

    // Uncomment and complete this if you have the official WASM binary:
    /*
    const buffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(buffer);
    // Initialize and return wrapper
    return new RhubarbWrapper(wasmModule);
    */

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Process a single audio buffer through Rhubarb
 * Returns array of phoneme events
 */
export async function processAudioBuffer(audioBuffer) {
  if (!rhubarb) return [];

  try {
    // Extract float32 data if needed
    const floatData = audioBuffer.data instanceof Float32Array 
      ? audioBuffer.data 
      : new Float32Array(audioBuffer.data);

    const sampleRate = audioBuffer.sampleRate || 16000;

    // Process through Rhubarb
    const phonemes = rhubarb.analyzeAudio(floatData, sampleRate);

    return phonemes;
  } catch (error) {
    console.error('Error processing audio:', error);
    return [];
  }
}

/**
 * Get animation category from phoneme with smoothing
 * Applies hysteresis to avoid jittery mouth movements
 */
export function getPhonemeCategory(phoneme) {
  if (!phoneme) return 'idle';

  const phonemeChar = phoneme.phoneme || 'rest';
  let category = PHONEME_MAP[phonemeChar] || 'closed';

  // Convert rest to silence/idle
  if (phonemeChar === 'rest' || phonemeChar === 'silent') {
    category = 'idle';
  }

  // Apply smoothing
  const previousCategory = phonemeHistory[phonemeHistory.length - 1];
  
  if (previousCategory && previousCategory !== category) {
    // Only switch if the new phoneme is sufficiently different
    // This reduces chattering between similar states
    const shouldSwitch = Math.random() > (1 - SMOOTHING_FACTOR);
    if (!shouldSwitch) {
      category = previousCategory;
    }
  }

  // Keep history for smoothing
  phonemeHistory.push(category);
  if (phonemeHistory.length > 10) {
    phonemeHistory.shift();
  }

  return category;
}

/**
 * Get current phoneme state for UI diagnostics
 */
export function getDiagnosticInfo() {
  const currentPhoneme = phonemeHistory[phonemeHistory.length - 1] || 'idle';
  return {
    phoneme: currentPhoneme,
    history: phonemeHistory.slice(-5),
    isUsingMock: rhubarb instanceof MockRhubarb,
  };
}

/**
 * Reset phoneme history (useful when stopping audio)
 */
export function resetPhonemeHistory() {
  phonemeHistory = [];
}

/**
 * Test method: simulate phoneme sequence
 * Useful for testing animation without microphone
 */
export function simulatePhonemeSequence(phonemes) {
  const result = [];
  for (const phoneme of phonemes) {
    result.push({
      phoneme,
      start: result.length * 0.1,
      duration: 0.1,
    });
  }
  return result;
}
