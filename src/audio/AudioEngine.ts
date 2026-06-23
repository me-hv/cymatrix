export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private oscC: OscillatorNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;
  private gainC: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  
  // File upload nodes
  private fileSource: AudioBufferSourceNode | null = null;
  private fileBuffer: AudioBuffer | null = null;

  public isPlaying: boolean = false;
  public inputMode: 'oscillator' | 'microphone' | 'file' = 'oscillator';
  
  // Direct refs for the shader/render loop
  public frequency: number = 440;
  public amplitude: number = 0; // RMS value
  public bassEnergy: number = 0;
  public midEnergy: number = 0;
  public trebleEnergy: number = 0;

  // Internal arrays for FFT analysis
  public freqDataArray: Uint8Array = new Uint8Array(0);
  private timeDataArray: Uint8Array = new Uint8Array(0);

  // Settings
  private volume: number = 0.5;
  private damping: number = 0.8; // Smoothing factor
  private fftSize: number = 2048;

  public async init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
    this.analyzer = this.audioContext.createAnalyser();
    this.setFftSize(this.fftSize);
  }

  public setFftSize(size: number) {
    this.fftSize = size;
    if (this.analyzer) {
      this.analyzer.fftSize = size;
      this.freqDataArray = new Uint8Array(this.analyzer.frequencyBinCount);
      this.timeDataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    }
  }

  public setVolume(vol: number) {
    this.volume = vol;
    if (this.gainNode) {
      // Smooth volume transitions
      this.gainNode.gain.setTargetAtTime(vol, this.audioContext!.currentTime, 0.05);
    }
  }

  public setDamping(damp: number) {
    this.damping = damp;
  }

  public async resumeContext() {
    await this.init();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public setFrequency(freq: number) {
    this.frequency = freq;
    if (this.oscA && this.inputMode === 'oscillator') {
      this.oscA.frequency.setTargetAtTime(freq, this.audioContext!.currentTime, 0.05);
    }
  }

  public setOscillatorParams(
    id: 'A' | 'B' | 'C',
    enabled: boolean,
    frequency: number,
    gainVal: number
  ) {
    const osc = id === 'A' ? this.oscA : id === 'B' ? this.oscB : this.oscC;
    const gainNode = id === 'A' ? this.gainA : id === 'B' ? this.gainB : this.gainC;

    if (this.audioContext && this.inputMode === 'oscillator') {
      const time = this.audioContext.currentTime;
      if (osc) {
        osc.frequency.setTargetAtTime(frequency, time, 0.05);
      }
      if (gainNode) {
        const targetGain = enabled ? gainVal : 0;
        gainNode.gain.setTargetAtTime(targetGain, time, 0.05);
      }
    }
  }

  public playTestTone(
    oscConfigs: {
      oscA: { enabled: boolean; frequency: number; gain: number };
      oscB: { enabled: boolean; frequency: number; gain: number };
      oscC: { enabled: boolean; frequency: number; gain: number };
    } = {
      oscA: { enabled: true, frequency: 440, gain: 0.5 },
      oscB: { enabled: false, frequency: 660, gain: 0.5 },
      oscC: { enabled: false, frequency: 880, gain: 0.5 },
    }
  ) {
    this.init();
    this.stopAllSources();
    this.inputMode = 'oscillator';
    this.frequency = oscConfigs.oscA.frequency;

    if (this.audioContext!.state === 'suspended') {
      this.audioContext!.resume();
    }

    this.gainNode = this.audioContext!.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.audioContext!.currentTime);

    // Set up OSC A
    this.oscA = this.audioContext!.createOscillator();
    this.gainA = this.audioContext!.createGain();
    this.oscA.type = 'sine';
    this.oscA.frequency.setValueAtTime(oscConfigs.oscA.frequency, this.audioContext!.currentTime);
    this.gainA.gain.setValueAtTime(oscConfigs.oscA.enabled ? oscConfigs.oscA.gain : 0, this.audioContext!.currentTime);
    this.oscA.connect(this.gainA);
    this.gainA.connect(this.gainNode);

    // Set up OSC B
    this.oscB = this.audioContext!.createOscillator();
    this.gainB = this.audioContext!.createGain();
    this.oscB.type = 'sine';
    this.oscB.frequency.setValueAtTime(oscConfigs.oscB.frequency, this.audioContext!.currentTime);
    this.gainB.gain.setValueAtTime(oscConfigs.oscB.enabled ? oscConfigs.oscB.gain : 0, this.audioContext!.currentTime);
    this.oscB.connect(this.gainB);
    this.gainB.connect(this.gainNode);

    // Set up OSC C
    this.oscC = this.audioContext!.createOscillator();
    this.gainC = this.audioContext!.createGain();
    this.oscC.type = 'sine';
    this.oscC.frequency.setValueAtTime(oscConfigs.oscC.frequency, this.audioContext!.currentTime);
    this.gainC.gain.setValueAtTime(oscConfigs.oscC.enabled ? oscConfigs.oscC.gain : 0, this.audioContext!.currentTime);
    this.oscC.connect(this.gainC);
    this.gainC.connect(this.gainNode);

    this.gainNode.connect(this.analyzer!);
    this.analyzer!.connect(this.audioContext!.destination);

    this.oscA.start();
    this.oscB.start();
    this.oscC.start();

    this.isPlaying = true;
  }

  public async startMicrophone() {
    await this.init();
    this.stopAllSources();
    this.inputMode = 'microphone';

    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.microphoneSource = this.audioContext!.createMediaStreamSource(this.mediaStream);
      this.gainNode = this.audioContext!.createGain();
      
      // Keep volume zero to prevent acoustic feedback, but route it through analyzer
      this.gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);

      this.microphoneSource.connect(this.analyzer!);
      // Do not connect to destination to prevent feedback, but let the analyzer parse it.
      
      this.isPlaying = true;
    } catch (err) {
      console.error('Error opening microphone:', err);
      this.stop();
      throw err;
    }
  }

  public async playUploadedFile(file: File) {
    await this.init();
    this.stopAllSources();
    this.inputMode = 'file';

    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        this.fileBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.startFilePlayback();
      } catch (err) {
        console.error('Error decoding audio:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private startFilePlayback() {
    if (!this.fileBuffer || !this.audioContext || !this.analyzer) return;

    this.fileSource = this.audioContext.createBufferSource();
    this.fileSource.buffer = this.fileBuffer;
    this.fileSource.loop = true;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    this.fileSource.connect(this.gainNode);
    this.gainNode.connect(this.analyzer);
    this.analyzer.connect(this.audioContext.destination);

    this.fileSource.start(0);
    this.isPlaying = true;
  }

  private stopAllSources() {
    if (this.oscA) {
      try { this.oscA.stop(); } catch { /* ignore */ }
      this.oscA.disconnect();
      this.oscA = null;
    }
    if (this.oscB) {
      try { this.oscB.stop(); } catch { /* ignore */ }
      this.oscB.disconnect();
      this.oscB = null;
    }
    if (this.oscC) {
      try { this.oscC.stop(); } catch { /* ignore */ }
      this.oscC.disconnect();
      this.oscC = null;
    }
    if (this.gainA) {
      this.gainA.disconnect();
      this.gainA = null;
    }
    if (this.gainB) {
      this.gainB.disconnect();
      this.gainB = null;
    }
    if (this.gainC) {
      this.gainC.disconnect();
      this.gainC = null;
    }
    if (this.fileSource) {
      try { this.fileSource.stop(); } catch { /* ignore */ }
      this.fileSource.disconnect();
      this.fileSource = null;
    }
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  public stop() {
    this.stopAllSources();
  }

  // Update loop called every frame (e.g. inside useFrame)
  public update() {
    if (!this.isPlaying || !this.analyzer || !this.freqDataArray.length) {
      // Settle/decay values based on damping
      const decay = this.damping;
      this.amplitude *= decay;
      this.bassEnergy *= decay;
      this.midEnergy *= decay;
      this.trebleEnergy *= decay;
      if (this.amplitude < 0.001) this.amplitude = 0;
      return;
    }

    // Grab data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyzer.getByteFrequencyData(this.freqDataArray as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyzer.getByteTimeDomainData(this.timeDataArray as any);

    // 1. Calculate RMS Amplitude
    let sum = 0;
    for (let i = 0; i < this.timeDataArray.length; i++) {
      const v = (this.timeDataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rawRms = Math.sqrt(sum / this.timeDataArray.length);
    // Smooth using damping settings
    this.amplitude = this.amplitude * this.damping + rawRms * (1.0 - this.damping);

    // 2. Extract frequency band energies (normalized 0.0 to 1.0)
    const nyquist = this.audioContext!.sampleRate / 2;
    const binSize = nyquist / this.freqDataArray.length;

    let bassSum = 0, bassCount = 0;
    let midSum = 0, midCount = 0;
    let trebleSum = 0, trebleCount = 0;

    for (let i = 0; i < this.freqDataArray.length; i++) {
      const hz = i * binSize;
      const val = this.freqDataArray[i] / 255.0; // Normalise to 0-1

      if (hz < 250) {
        bassSum += val;
        bassCount++;
      } else if (hz < 2000) {
        midSum += val;
        midCount++;
      } else {
        trebleSum += val;
        trebleCount++;
      }
    }

    const rawBass = bassCount > 0 ? bassSum / bassCount : 0;
    const rawMid = midCount > 0 ? midSum / midCount : 0;
    const rawTreble = trebleCount > 0 ? trebleSum / trebleCount : 0;

    // Apply damping
    this.bassEnergy = this.bassEnergy * this.damping + rawBass * (1.0 - this.damping);
    this.midEnergy = this.midEnergy * this.damping + rawMid * (1.0 - this.damping);
    this.trebleEnergy = this.trebleEnergy * this.damping + rawTreble * (1.0 - this.damping);

    // 3. Find Dominant Frequency (if in microphone or file mode)
    if (this.inputMode !== 'oscillator') {
      let maxVal = -1;
      let maxIndex = -1;
      for (let i = 0; i < this.freqDataArray.length; i++) {
        if (this.freqDataArray[i] > maxVal) {
          maxVal = this.freqDataArray[i];
          maxIndex = i;
        }
      }
      if (maxIndex !== -1 && maxVal > 10) { // Only update if there is actual sound
        const targetFreq = maxIndex * binSize;
        // Smooth frequency changes to prevent visual popping
        this.frequency = this.frequency * 0.95 + targetFreq * 0.05;
      }
    }
  }
}

export const audioEngine = new AudioEngine();
