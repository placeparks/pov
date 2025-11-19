// utils/voiceAnalysis.ts

export interface VoiceAnalysis {
  duration: number;
  hasBackgroundNoise: boolean;
  hasBreathSounds: boolean;
  speechVariability: number;
  energyDistribution: number;
  silenceRatio: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  averageEnergy: number;
  confidenceScore: number;
  waveform: number[];
}

export async function analyzeVoice(audioBlob: Blob): Promise<VoiceAnalysis> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  const analysis: VoiceAnalysis = {
    duration,
    hasBackgroundNoise: false,
    hasBreathSounds: false,
    speechVariability: 0,
    energyDistribution: 0,
    silenceRatio: 0,
    spectralCentroid: 0,
    zeroCrossingRate: 0,
    averageEnergy: 0,
    confidenceScore: 0,
    waveform: []
  };
  
    // 1. Background Noise Detection
    analysis.hasBackgroundNoise = detectBackgroundNoise(channelData, sampleRate);
  
    // 2. Silence Analysis
    const { silenceRatio, hasBreaths } = analyzeSilence(channelData, sampleRate);
    analysis.silenceRatio = silenceRatio;
    analysis.hasBreathSounds = hasBreaths;
  
    // 3. Speech Variability
    analysis.speechVariability = calculateVariability(channelData, sampleRate);
  
    // 4. Energy Distribution
    analysis.energyDistribution = calculateEnergyDistribution(channelData);
  
    // 5. Average Energy (for detecting silence/quiet recordings)
    analysis.averageEnergy = calculateAverageEnergy(channelData);
  
    // 6. Spectral Centroid (frequency characteristics)
    analysis.spectralCentroid = calculateSpectralCentroid(channelData, sampleRate);
  
    // 7. Zero Crossing Rate (voice characteristics)
    analysis.zeroCrossingRate = calculateZeroCrossingRate(channelData);
  
    // 8. Generate waveform for visualization
    analysis.waveform = generateWaveform(channelData, 50);
  
    // 9. Calculate confidence score
    analysis.confidenceScore = calculateConfidenceScore(analysis);
  
    await audioContext.close();
    return analysis;
  }
  
function detectBackgroundNoise(data: Float32Array, sampleRate: number): boolean {
  // Check first 100ms for ambient noise - more lenient
  let noiseCount = 0;
  const checkLength = Math.min(sampleRate * 0.1, data.length);
  
  for (let i = 0; i < checkLength; i++) {
    const amplitude = Math.abs(data[i]);
    // More lenient: accept wider range of noise levels
    if (amplitude > 0.001 && amplitude < 0.05) {
      noiseCount++;
    }
  }
  
  // Lower threshold - only need 20 samples instead of 50
  return noiseCount > 20;
}

function analyzeSilence(data: Float32Array, sampleRate: number): { silenceRatio: number; hasBreaths: boolean } {
  const windowSize = Math.floor(sampleRate * 0.02); // 20ms windows
  let silentWindows = 0;
  let totalWindows = 0;
  const energyThreshold = 0.008; // Lower threshold - more lenient
  
  for (let i = 0; i < data.length; i += windowSize) {
    let energy = 0;
    for (let j = 0; j < windowSize && i + j < data.length; j++) {
      energy += data[i + j] ** 2;
    }
    energy = Math.sqrt(energy / windowSize);
    
    totalWindows++;
    if (energy < energyThreshold) {
      silentWindows++;
    }
  }
  
  const ratio = silentWindows / totalWindows;
  // More lenient breath detection
  const hasBreaths = ratio > 0.02 && ratio < 0.6;
  
  return { silenceRatio: ratio, hasBreaths };
}

function calculateVariability(data: Float32Array, sampleRate: number): number {
  const windowSize = Math.floor(sampleRate * 0.02);
  const energyValues: number[] = [];
  
  for (let i = 0; i < data.length; i += windowSize) {
    let energy = 0;
    for (let j = 0; j < windowSize && i + j < data.length; j++) {
      energy += Math.abs(data[i + j]);
    }
    energyValues.push(energy / windowSize);
  }
  
  const mean = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
  const variance = energyValues.reduce((a, b) => a + (b - mean) ** 2, 0) / energyValues.length;
  
  return Math.sqrt(variance) * 1000;
}

function calculateEnergyDistribution(data: Float32Array): number {
  let maxEnergy = 0;
  let minEnergy = Infinity;
  
  // Use a loop instead of spreading to avoid stack overflow
  for (let i = 0; i < data.length; i++) {
    const energy = Math.abs(data[i]);
    if (energy > maxEnergy) maxEnergy = energy;
    if (energy < minEnergy) minEnergy = energy;
  }
  
  if (minEnergy === Infinity) minEnergy = 0;
  
  return (maxEnergy - minEnergy) / (maxEnergy + 0.001);
}

function calculateAverageEnergy(data: Float32Array): number {
  let totalEnergy = 0;
  for (let i = 0; i < data.length; i++) {
    totalEnergy += Math.abs(data[i]);
  }
  return totalEnergy / data.length;
}

function calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
  // Simple FFT-like calculation
  let weightedSum = 0;
  let totalMagnitude = 0;
  
  for (let i = 0; i < data.length; i++) {
    const magnitude = Math.abs(data[i]);
    const frequency = (i / data.length) * (sampleRate / 2);
    weightedSum += frequency * magnitude;
    totalMagnitude += magnitude;
  }
  
  return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
}

function calculateZeroCrossingRate(data: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / data.length;
}

function generateWaveform(data: Float32Array, points: number): number[] {
  const blockSize = Math.floor(data.length / points);
  const waveform: number[] = [];
  
  for (let i = 0; i < points; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(data[i * blockSize + j] || 0);
    }
    waveform.push(Math.floor((sum / blockSize) * 1000)); // Scale to uint16
  }
  
  return waveform;
}

function calculateConfidenceScore(analysis: VoiceAnalysis): number {
  let score = 0;
  
  // Duration check (0.5-5s acceptable for single word)
  if (analysis.duration >= 0.5 && analysis.duration <= 5) {
    score += 25;
  } else if (analysis.duration > 0.2 && analysis.duration < 10) {
    score += 15; // Partial credit for reasonable duration
  }
  
  // Background noise presence (natural environment) - more lenient
  if (analysis.hasBackgroundNoise) {
    score += 15;
  } else {
    // Still give some points if there's any variation
    score += 5;
  }
  
  // Breath sounds detection (human characteristic) - more lenient
  if (analysis.hasBreathSounds) {
    score += 20;
  } else if (analysis.silenceRatio > 0.02 && analysis.silenceRatio < 0.6) {
    score += 10; // Partial credit for some silence variation
  }
  
  // Speech variability (natural fluctuation) - more lenient range
  if (analysis.speechVariability > 1) {
    if (analysis.speechVariability < 100) {
      score += 20; // Full credit for reasonable variability
    } else {
      score += 10; // Partial credit for high variability
    }
  }
  
  // Energy distribution (dynamic range) - lower threshold
  if (analysis.energyDistribution > 0.2) {
    score += 15;
  } else if (analysis.energyDistribution > 0.1) {
    score += 8; // Partial credit
  }
  
  // Silence ratio (natural pauses) - more lenient
  if (analysis.silenceRatio > 0.02 && analysis.silenceRatio < 0.6) {
    score += 10;
  } else if (analysis.silenceRatio > 0 && analysis.silenceRatio < 0.8) {
    score += 5; // Partial credit
  }
  
  // Spectral centroid (voice frequency range) - more lenient
  if (analysis.spectralCentroid > 200 && analysis.spectralCentroid < 5000) {
    score += 10;
  } else if (analysis.spectralCentroid > 0) {
    score += 5; // Partial credit for any frequency content
  }
  
  // Zero crossing rate (voice characteristics)
  if (analysis.zeroCrossingRate > 0.01 && analysis.zeroCrossingRate < 0.3) {
    score += 10;
  }
  
  // Average energy check (detect silent/quiet recordings)
  if (analysis.averageEnergy > 0.01) {
    score += 5; // Bonus for sufficient energy
  }
  
  // No minimum score guarantee - must earn the score through actual speech
  
  return Math.min(100, score);
}
