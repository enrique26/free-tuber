class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const inputData = inputs[0][0]; // Get first channel of first input

    // Send audio data back to main thread
    this.port.postMessage({
      audioData: inputData,
      timestamp: Date.now(),
    });

    return true; // Keep the node alive
  }
}

registerProcessor('audio-processor', AudioProcessor);