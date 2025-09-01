class VoiceVisualizer {
  private callback: (data: number[]) => void;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isActive: boolean = false;
  private animationFrame: number | null = null;
  
  constructor(callback: (data: number[]) => void) {
    this.callback = callback;
  }
  
  public async initialize(): Promise<boolean> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.7;
      
      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio visualizer:', error);
      return false;
    }
  }
  
  public start(): void {
    if (!this.analyser) return;
    
    this.isActive = true;
    this.update();
  }
  
  public stop(): void {
    this.isActive = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.callback(Array(20).fill(0));
  }
  
  public isRunning(): boolean {
    return this.isActive;
  }
  
  private update(): void {
    if (!this.isActive || !this.analyser) return;
    
    // Get frequency data
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Process data and send to callback
    const normalizedData = Array.from(dataArray).map(value => value / 255);
    this.callback(normalizedData);
    
    // Schedule next update
    this.animationFrame = requestAnimationFrame(() => this.update());
  }
}

export default VoiceVisualizer;

// Helper function to extract visualization data
export const getVisualizerData = (frequencyData: number[], numBars: number): number[] => {
  if (!frequencyData || frequencyData.length === 0) {
    return Array(numBars).fill(0);
  }
  
  // Downsample the frequency data to the number of bars
  const step = Math.floor(frequencyData.length / numBars);
  const result = Array(numBars).fill(0);
  
  for (let i = 0; i < numBars; i++) {
    const startIndex = i * step;
    const endIndex = startIndex + step;
    
    // Average the values in this range
    let sum = 0;
    for (let j = startIndex; j < endIndex && j < frequencyData.length; j++) {
      sum += frequencyData[j];
    }
    
    result[i] = sum / step;
  }
  
  return result;
};
