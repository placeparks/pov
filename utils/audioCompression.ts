// utils/audioCompression.ts

export async function compressAudio(audioBlob: Blob): Promise<Uint8Array> {
  console.log('🔧 Starting audio compression...');
  console.log(`  Input blob size: ${(audioBlob.size / 1024).toFixed(2)} KB (${audioBlob.size} bytes)`);
  console.log(`  Input blob type: ${audioBlob.type}`);
  
  // Convert to ArrayBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  console.log(`  ArrayBuffer size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB (${arrayBuffer.byteLength} bytes)`);
  
  // Use Opus codec for maximum compression
  // Target: < 20KB for 1-3 second clips
  const compressed = await compressWithOpus(arrayBuffer);
  const result = new Uint8Array(compressed);
  
  console.log(`  Compressed result size: ${(result.length / 1024).toFixed(2)} KB (${result.length} bytes)`);
  const ratio = ((1 - result.length / audioBlob.size) * 100).toFixed(1);
  console.log(`  Compression: ${ratio}% ${result.length < audioBlob.size ? 'smaller' : 'larger'}`);
  
  return result;
}

async function compressWithOpus(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  console.log('  📦 Processing audio data...');
  
  // Create audio context
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass({
    sampleRate: 16000 // Lower sample rate for compression
  });
  
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  console.log(`  Decoded audio: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channel(s)`);
  console.log(`  Audio buffer length: ${audioBuffer.length} samples`);
  
  const channelData = audioBuffer.getChannelData(0);
  
  // Convert float32 to int16 for better compression
  const int16Data = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(channelData[i] * 32768)));
  }
  
  console.log(`  Converted to int16: ${(int16Data.byteLength / 1024).toFixed(2)} KB (${int16Data.byteLength} bytes)`);
  console.log(`  Note: This is raw PCM data, not compressed. For actual compression, consider using Web Audio API encoding.`);
  
  await audioContext.close();
  return int16Data.buffer;
}

export function audioToHex(uint8Array: Uint8Array): string {
  return '0x' + Array.from(uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToAudio(hexString: string): Uint8Array {
  const hex = hexString.replace('0x', '');
  const bytes = new Uint8Array(hex.length / 2);
  
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  
  return bytes;
}

export async function playAudioFromBytes(audioBytes: Uint8Array): Promise<void> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  
  // Convert int16 back to float32
  const int16Array = new Int16Array(audioBytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768;
  }
  
  // Create audio buffer
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, 16000);
  audioBuffer.copyToChannel(float32Array, 0);
  
  // Play
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return new Promise<void>((resolve) => {
    source.onended = () => {
      audioContext.close();
      resolve();
    };
  });
}