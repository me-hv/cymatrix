import { create } from 'zustand';

export type VisMode = 'mandala' | 'chladni' | 'ripple' | 'fluid';

export interface Preset {
  name: string;
  frequency: number;
  symmetry: number;
  thickness: number;
  speed: number;
  damping: number;
  brightness: number;
}

export const PRESETS: Record<string, Preset> = {
  Harmonic: {
    name: 'Harmonic',
    frequency: 256,
    symmetry: 8,
    thickness: 0.015,
    speed: 0.5,
    damping: 0.9,
    brightness: 1.2,
  },
  Geometric: {
    name: 'Geometric',
    frequency: 440,
    symmetry: 12,
    thickness: 0.025,
    speed: 1.0,
    damping: 0.8,
    brightness: 1.0,
  },
  Chaotic: {
    name: 'Chaotic',
    frequency: 880,
    symmetry: 5,
    thickness: 0.045,
    speed: 2.2,
    damping: 0.6,
    brightness: 1.5,
  },
};

export interface OscillatorConfig {
  enabled: boolean;
  frequency: number;
  gain: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  detune: number;      // -50 to 50 cents
  phase: number;       // 0 to 360 degrees
  lfoEnabled: boolean;
  lfoRate: number;     // 0.1 to 10 Hz
}

export interface ResonanceBookmark {
  id: string;
  frequency: number;
  target: 'A' | 'B' | 'C' | 'all';
  timestamp: number;
}

interface AppState {
  visualizationMode: VisMode;
  frequency: number;
  symmetry: number;
  damping: number;
  brightness: number;
  gain: number;
  thickness: number;
  speed: number;
  isPlaying: boolean;
  fftSize: number;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isMobile: boolean;

  // 3D Visualizer Settings
  is3D: boolean;
  exaggeration: number;
  smoothing: number;
  meshDetail: 'low' | 'med' | 'high';
  viewMode: 'solid' | 'wireframe' | 'points';
  colorMode: 'neon' | 'metallic';
  heatMap: boolean;
  cameraPreset: 'top' | 'isometric' | 'low' | null;
  activePaletteId: 'neon' | 'gold' | 'sea' | 'thermal' | 'mono';
  colorContrast: number;
  chromaticAberration: boolean;
  
  // Audio Input Module Settings
  inputMode: 'oscillator' | 'microphone' | 'file';
  sensitivity: number;
  audioSmoothing: number;
  freqFocus: number;
  uploadedFileName: string | null;
  trackDuration: number;
  trackProgress: number;

  // Video Recording
  isRecording: boolean;
  recordingElapsed: number;
  recordingAspect: '16:9' | '9:16' | '1:1';
  recordingStatus: 'idle' | 'recording' | 'processing' | 'done';

  // Plate Settings
  plateShape: 'circle' | 'square' | 'hexagon' | 'triangle';
  plateDamping: number;
  plateMaterial: 'steel' | 'brass' | 'rubber' | 'custom';

  // Fluid Settings
  fluidViscosity: number;
  fluidity: number;
  fluidGrowthRate: number;

  // Immersive Mode & Camera settings
  showBottomPanel: boolean;
  zenMode: boolean;
  cameraZoom: number;
  prevUIState: { left: boolean; right: boolean; bottom: boolean } | null;

  // Polyphonic Oscillator State
  oscA: OscillatorConfig;
  oscB: OscillatorConfig;
  oscC: OscillatorConfig;

  // Sweep State
  sweepActive: boolean;
  sweepTarget: 'A' | 'B' | 'C' | 'all';
  sweepStart: number;
  sweepEnd: number;
  sweepSpeed: number; // Hz/second
  sweepDirection: number; // 1 (up) or -1 (down)
  sweepMode: 'loop' | 'bounce';
  bookmarks: ResonanceBookmark[];
  autoSaveOnPin: boolean;
  
  // Actions
  setVisualizationMode: (mode: VisMode) => void;
  setFrequency: (freq: number) => void;
  setSymmetry: (sym: number) => void;
  setDamping: (damping: number) => void;
  setBrightness: (brightness: number) => void;
  setGain: (gain: number) => void;
  setThickness: (thickness: number) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setFftSize: (size: number) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  applyPreset: (presetName: keyof typeof PRESETS) => void;
  resetSettings: () => void;

  setIs3D: (is3D: boolean) => void;
  setExaggeration: (exaggeration: number) => void;
  setSmoothing: (smoothing: number) => void;
  setMeshDetail: (detail: 'low' | 'med' | 'high') => void;
  setViewMode: (mode: 'solid' | 'wireframe' | 'points') => void;
  setColorMode: (mode: 'neon' | 'metallic') => void;
  setHeatMap: (heatMap: boolean) => void;
  setCameraPreset: (preset: 'top' | 'isometric' | 'low' | null) => void;
  setActivePaletteId: (id: 'neon' | 'gold' | 'sea' | 'thermal' | 'mono') => void;
  setColorContrast: (contrast: number) => void;
  setChromaticAberration: (active: boolean) => void;

  setInputMode: (mode: 'oscillator' | 'microphone' | 'file') => void;
  setSensitivity: (s: number) => void;
  setAudioSmoothing: (s: number) => void;
  setFreqFocus: (f: number) => void;
  setUploadedFileName: (name: string | null) => void;
  setTrackDuration: (d: number) => void;
  setTrackProgress: (p: number) => void;

  setIsRecording: (r: boolean) => void;
  setRecordingElapsed: (e: number) => void;
  setRecordingAspect: (a: '16:9' | '9:16' | '1:1') => void;
  setRecordingStatus: (s: 'idle' | 'recording' | 'processing' | 'done') => void;

  setPlateShape: (shape: 'circle' | 'square' | 'hexagon' | 'triangle') => void;
  setPlateDamping: (damping: number) => void;
  setPlateMaterial: (material: 'steel' | 'brass' | 'rubber' | 'custom') => void;

  setFluidViscosity: (v: number) => void;
  setFluidity: (f: number) => void;
  setFluidGrowthRate: (g: number) => void;

  setOscA: (config: Partial<OscillatorConfig>) => void;
  setOscB: (config: Partial<OscillatorConfig>) => void;
  setOscC: (config: Partial<OscillatorConfig>) => void;

  setSweepActive: (active: boolean) => void;
  setSweepTarget: (target: 'A' | 'B' | 'C' | 'all') => void;
  setSweepStart: (start: number) => void;
  setSweepEnd: (end: number) => void;
  setSweepSpeed: (speed: number) => void;
  setSweepMode: (mode: 'loop' | 'bounce') => void;
  addBookmark: (bookmark: ResonanceBookmark) => void;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  setAutoSaveOnPin: (val: boolean) => void;
  updateSweep: (delta: number) => void;
  setHarmonicInterval: (interval: 'fifth' | 'third' | 'octave') => void;
  setSweepFrequencies: (freqs: { oscA: number; oscB: number; oscC: number; sweepDirection: number }) => void;
  loadDnaState: (loadedState: Partial<AppState>) => void;
  setShowBottomPanel: (show: boolean) => void;
  setZenMode: (zenMode: boolean) => void;
  setCameraZoom: (zoom: number) => void;
}

const DEFAULT_STATE = {
  visualizationMode: 'chladni' as VisMode,
  frequency: 440,
  symmetry: 6,
  damping: 0.8,
  brightness: 1.0,
  gain: 0.1,
  thickness: 0.02,
  speed: 1.0,
  isPlaying: false,
  fftSize: 2048,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  isMobile: false,

  // 3D settings
  is3D: false,
  exaggeration: 0.3,
  smoothing: 0.4,
  meshDetail: 'low' as const,
  viewMode: 'solid' as const,
  colorMode: 'neon' as const,
  heatMap: false,
  cameraPreset: null as 'top' | 'isometric' | 'low' | null,
  activePaletteId: 'neon' as const,
  colorContrast: 1.0,
  chromaticAberration: true,

  // Audio Input Module Defaults
  inputMode: 'oscillator' as const,
  sensitivity: 1.0,
  audioSmoothing: 0.8,
  freqFocus: 1000,
  uploadedFileName: null,
  trackDuration: 0,
  trackProgress: 0,

  // Video Recording Defaults
  isRecording: false,
  recordingElapsed: 0,
  recordingAspect: '16:9' as const,
  recordingStatus: 'idle' as const,

  // Plate Settings Defaults
  plateShape: 'circle' as const,
  plateDamping: 0.1,
  plateMaterial: 'steel' as const,

  // Fluid Settings Defaults
  fluidViscosity: 1.0,
  fluidity: 0.5,
  fluidGrowthRate: 1.0,

  oscA: { enabled: true, frequency: 440, gain: 0.5, type: 'sine' as const, detune: 0, phase: 0, lfoEnabled: false, lfoRate: 1.0 },
  oscB: { enabled: false, frequency: 660, gain: 0.5, type: 'sine' as const, detune: 0, phase: 0, lfoEnabled: false, lfoRate: 1.0 },
  oscC: { enabled: false, frequency: 880, gain: 0.5, type: 'sine' as const, detune: 0, phase: 0, lfoEnabled: false, lfoRate: 1.0 },

  sweepActive: false,
  sweepTarget: 'A' as const,
  sweepStart: 100,
  sweepEnd: 2000,
  sweepSpeed: 50,
  sweepDirection: 1,
  sweepMode: 'loop' as const,
  bookmarks: [] as ResonanceBookmark[],
  autoSaveOnPin: false,
  showBottomPanel: true,
  zenMode: false,
  cameraZoom: 1.0,
  prevUIState: null as { left: boolean; right: boolean; bottom: boolean } | null,
};

export const useAppStore = create<AppState>((set) => ({
  ...DEFAULT_STATE,
  
  setVisualizationMode: (visualizationMode) => set({ visualizationMode }),
  setFrequency: (frequency) => set((state) => ({ 
    frequency,
    // Keep oscA frequency in sync if master frequency updates
    oscA: { ...state.oscA, frequency },
  })),
  setSymmetry: (symmetry) => set({ symmetry }),
  setDamping: (damping) => set({ damping }),
  setBrightness: (brightness) => set({ brightness }),
  setGain: (gain) => set({ gain }),
  setThickness: (thickness) => set({ thickness }),
  setSpeed: (speed) => set({ speed }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setFftSize: (fftSize) => set({ fftSize }),
  setLeftSidebarOpen: (isLeftSidebarOpen) => set({ isLeftSidebarOpen }),
  setRightSidebarOpen: (isRightSidebarOpen) => set({ isRightSidebarOpen }),
  setIsMobile: (isMobile) => set({ isMobile }),

  setIs3D: (is3D) => set({ is3D }),
  setExaggeration: (exaggeration) => set({ exaggeration }),
  setSmoothing: (smoothing) => set({ smoothing }),
  setMeshDetail: (meshDetail) => set({ meshDetail }),
  setViewMode: (viewMode) => set({ viewMode }),
  setColorMode: (colorMode) => set({ colorMode }),
  setHeatMap: (heatMap) => set({ heatMap }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setActivePaletteId: (activePaletteId) => set({ activePaletteId }),
  setColorContrast: (colorContrast) => set({ colorContrast }),
  setChromaticAberration: (chromaticAberration) => set({ chromaticAberration }),

  setInputMode: (inputMode) => set({ inputMode }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setAudioSmoothing: (audioSmoothing) => set({ audioSmoothing }),
  setFreqFocus: (freqFocus) => set({ freqFocus }),
  setUploadedFileName: (uploadedFileName) => set({ uploadedFileName }),
  setTrackDuration: (trackDuration) => set({ trackDuration }),
  setTrackProgress: (trackProgress) => set({ trackProgress }),

  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingElapsed: (recordingElapsed) => set({ recordingElapsed }),
  setRecordingAspect: (recordingAspect) => set({ recordingAspect }),
  setRecordingStatus: (recordingStatus) => set({ recordingStatus }),

  setPlateShape: (plateShape) => set({ plateShape }),
  setPlateDamping: (plateDamping) => set({ plateDamping, plateMaterial: 'custom' }),
  setPlateMaterial: (plateMaterial) => set((state) => {
    if (plateMaterial === 'custom') return { plateMaterial };
    const dampingMap = { steel: 0.1, brass: 0.6, rubber: 2.0 };
    return {
      plateMaterial,
      plateDamping: dampingMap[plateMaterial] ?? state.plateDamping
    };
  }),

  setFluidViscosity: (fluidViscosity) => set({ fluidViscosity }),
  setFluidity: (fluidity) => set({ fluidity }),
  setFluidGrowthRate: (fluidGrowthRate) => set({ fluidGrowthRate }),
  
  applyPreset: (presetName) => {
    const preset = PRESETS[presetName];
    if (preset) {
      set({
        frequency: preset.frequency,
        symmetry: preset.symmetry,
        thickness: preset.thickness,
        speed: preset.speed,
        damping: preset.damping,
        brightness: preset.brightness,
        oscA: { enabled: true, frequency: preset.frequency, gain: 0.5, type: 'sine' as const, detune: 0, phase: 0, lfoEnabled: false, lfoRate: 1.0 },
        oscB: { enabled: true, frequency: Math.round(preset.frequency * 1.5), gain: 0.35, type: 'sine' as const, detune: 0, phase: 0, lfoEnabled: false, lfoRate: 1.0 },
        oscC: { enabled: true, frequency: Math.round(preset.frequency * 2.0), gain: 0.25, type: 'sine' as const, detune: 0, phase: 0, lfoEnabled: false, lfoRate: 1.0 },
      });
    }
  },
  
  resetSettings: () => set(DEFAULT_STATE),

  setOscA: (oscA) => set((state) => ({ oscA: { ...state.oscA, ...oscA } })),
  setOscB: (oscB) => set((state) => ({ oscB: { ...state.oscB, ...oscB } })),
  setOscC: (oscC) => set((state) => ({ oscC: { ...state.oscC, ...oscC } })),
  
  setHarmonicInterval: (interval) => set((state) => {
    const baseFreq = state.oscA.frequency;
    if (interval === 'fifth') {
      return {
        oscB: { ...state.oscB, enabled: true, frequency: Math.round(baseFreq * 1.5) },
        oscC: { ...state.oscC, enabled: true, frequency: Math.round(baseFreq * 2.0) },
      };
    } else if (interval === 'third') {
      return {
        oscB: { ...state.oscB, enabled: true, frequency: Math.round(baseFreq * 1.25) },
        oscC: { ...state.oscC, enabled: true, frequency: Math.round(baseFreq * 1.5) },
      };
    } else { // octave
      return {
        oscB: { ...state.oscB, enabled: true, frequency: Math.round(baseFreq * 2.0) },
        oscC: { ...state.oscC, enabled: true, frequency: Math.round(baseFreq * 4.0) },
      };
    }
  }),

  setSweepActive: (sweepActive) => set({ sweepActive }),
  setSweepTarget: (sweepTarget) => set({ sweepTarget }),
  setSweepStart: (sweepStart) => set({ sweepStart }),
  setSweepEnd: (sweepEnd) => set({ sweepEnd }),
  setSweepSpeed: (sweepSpeed) => set({ sweepSpeed }),
  setSweepMode: (sweepMode) => set({ sweepMode }),
  addBookmark: (bookmark) => set((state) => ({
    bookmarks: [...state.bookmarks.filter(b => b.frequency !== bookmark.frequency), bookmark]
  })),
  removeBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.filter((b) => b.id !== id)
  })),
  clearBookmarks: () => set({ bookmarks: [] }),
  setAutoSaveOnPin: (autoSaveOnPin) => set({ autoSaveOnPin }),
  
  updateSweep: (delta) => set((state) => {
    if (!state.sweepActive) return {};
    
    let leadOscKey: 'oscA' | 'oscB' | 'oscC' = 'oscA';
    if (state.sweepTarget === 'B') leadOscKey = 'oscB';
    else if (state.sweepTarget === 'C') leadOscKey = 'oscC';
    
    const leadOsc = state[leadOscKey];
    const f = leadOsc.frequency;
    
    let nextF = f + state.sweepDirection * state.sweepSpeed * delta;
    let newDirection = state.sweepDirection;
    
    if (nextF >= state.sweepEnd) {
      if (state.sweepMode === 'bounce') {
        nextF = state.sweepEnd;
        newDirection = -1;
      } else {
        nextF = state.sweepStart;
      }
    } else if (nextF <= state.sweepStart) {
      if (state.sweepMode === 'bounce') {
        nextF = state.sweepStart;
        newDirection = 1;
      } else {
        nextF = state.sweepEnd;
      }
    }
    
    const actualIncrement = nextF - f;
    
    if (state.sweepTarget === 'all') {
      const updates: Partial<AppState> = {
        sweepDirection: newDirection,
      };
      if (state.oscA.enabled) {
        const nextA = Math.max(20, Math.min(2000, state.oscA.frequency + actualIncrement));
        updates.oscA = { ...state.oscA, frequency: nextA };
        updates.frequency = nextA;
      }
      if (state.oscB.enabled) {
        updates.oscB = { ...state.oscB, frequency: Math.max(20, Math.min(2000, state.oscB.frequency + actualIncrement)) };
      }
      if (state.oscC.enabled) {
        updates.oscC = { ...state.oscC, frequency: Math.max(20, Math.min(2000, state.oscC.frequency + actualIncrement)) };
      }
      return updates;
    } else {
      const updates: Partial<AppState> = {
        sweepDirection: newDirection,
      };
      const clampedF = Math.max(20, Math.min(2000, nextF));
      if (state.sweepTarget === 'A') {
        updates.oscA = { ...state.oscA, frequency: clampedF };
        updates.frequency = clampedF;
      } else if (state.sweepTarget === 'B') {
        updates.oscB = { ...state.oscB, frequency: clampedF };
      } else if (state.sweepTarget === 'C') {
        updates.oscC = { ...state.oscC, frequency: clampedF };
      }
      return updates;
    }
  }),
  setSweepFrequencies: (freqs) => set((state) => ({
    sweepDirection: freqs.sweepDirection,
    oscA: { ...state.oscA, frequency: freqs.oscA },
    oscB: { ...state.oscB, frequency: freqs.oscB },
    oscC: { ...state.oscC, frequency: freqs.oscC },
    frequency: freqs.oscA,
  })),
  loadDnaState: (loadedState) => set((state) => {
    const updates: Partial<AppState> = { ...loadedState };
    if (loadedState.oscA) updates.oscA = { ...state.oscA, ...loadedState.oscA };
    if (loadedState.oscB) updates.oscB = { ...state.oscB, ...loadedState.oscB };
    if (loadedState.oscC) updates.oscC = { ...state.oscC, ...loadedState.oscC };
    return updates;
  }),
  setShowBottomPanel: (showBottomPanel) => set({ showBottomPanel }),
  setZenMode: (zenMode) => set((state) => {
    if (zenMode) {
      return {
        zenMode: true,
        prevUIState: {
          left: state.isLeftSidebarOpen,
          right: state.isRightSidebarOpen,
          bottom: state.showBottomPanel,
        },
        isLeftSidebarOpen: false,
        isRightSidebarOpen: false,
        showBottomPanel: false,
      };
    } else {
      const restore = state.prevUIState || { left: true, right: true, bottom: true };
      return {
        zenMode: false,
        prevUIState: null,
        isLeftSidebarOpen: restore.left,
        isRightSidebarOpen: restore.right,
        showBottomPanel: restore.bottom,
      };
    }
  }),
  setCameraZoom: (cameraZoom) => set({ cameraZoom }),
}));
