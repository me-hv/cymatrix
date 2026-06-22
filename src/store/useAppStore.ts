import { create } from 'zustand';

export type VisMode = 'mandala' | 'chladni' | 'ripple';

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
  applyPreset: (presetName: keyof typeof PRESETS) => void;
  resetSettings: () => void;
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
};

export const useAppStore = create<AppState>((set) => ({
  ...DEFAULT_STATE,
  
  setVisualizationMode: (visualizationMode) => set({ visualizationMode }),
  setFrequency: (frequency) => set({ frequency }),
  setSymmetry: (symmetry) => set({ symmetry }),
  setDamping: (damping) => set({ damping }),
  setBrightness: (brightness) => set({ brightness }),
  setGain: (gain) => set({ gain }),
  setThickness: (thickness) => set({ thickness }),
  setSpeed: (speed) => set({ speed }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setFftSize: (fftSize) => set({ fftSize }),
  
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
      });
    }
  },
  
  resetSettings: () => set(DEFAULT_STATE),
}));
