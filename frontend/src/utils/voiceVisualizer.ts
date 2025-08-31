// This class helps create a voice visualization by analyzing audio input
export class VoiceVisualizer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private visualizerCallback: (data: Uint8Array) => void;
  private isInitialized: boolean = false;

  constructor(callback: (data: Uint8Array) => void) {
    this.visualizerCallback = callback;
  }

  public async initialize(): Promise<boolean> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context and analyzer
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      
      // Connect microphone to analyzer
      this.microphone.connect(this.analyser);
      
      // Configure analyzer
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize voice visualizer:', error);
      return false;
    }
  }

  public start(): void {
    if (!this.isInitialized) {
      console.warn('Voice visualizer not initialized');
      return;
    }

    // Animation loop to continuously get audio data
    const updateVisualizer = () => {
      if (!this.analyser || !this.dataArray) return;
      
      try {
        // Use non-null assertion and try-catch to handle any potential issues
        // @ts-ignore: Type compatibility with Web Audio API
        this.analyser.getByteFrequencyData(this.dataArray!);
        // Copy data to avoid type reference issues
        const dataToSend = new Uint8Array(this.dataArray);
        this.visualizerCallback(dataToSend);
      } catch (error) {
        console.error('Error getting audio data:', error);
      }
      
      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(updateVisualizer);
    };

    // Start the animation loop
    updateVisualizer();
  }

  public stop(): void {
    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop and disconnect microphone
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Disconnect and clean up audio nodes
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.isInitialized = false;
  }

  public isActive(): boolean {
    return this.animationFrameId !== null;
  }
}

// Utility function to get a normalized subset of frequency data
export function getVisualizerData(data: Uint8Array, barCount: number): number[] {
  const result: number[] = [];
  const step = Math.floor(data.length / barCount);
  
  for (let i = 0; i < barCount; i++) {
    const dataIndex = i * step;
    // Normalize values to a range suitable for visualization (0-1)
    const normalizedValue = data[dataIndex] / 255;
    result.push(normalizedValue);
  }
  
  return result;
}
