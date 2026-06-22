import React, { useRef, useState, useEffect } from 'react';
import { useAppStore, type VisMode, PRESETS } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';
import { 
  Play, 
  Square, 
  Mic, 
  Upload, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Activity, 
  Sun, 
  Zap, 
  Volume2,
  Disc
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    visualizationMode,
    frequency,
    symmetry,
    damping,
    brightness,
    gain,
    thickness,
    speed,
    isPlaying,
    
    setVisualizationMode,
    setFrequency,
    setSymmetry,
    setDamping,
    setBrightness,
    setGain,
    setThickness,
    setSpeed,
    setIsPlaying,
    applyPreset,
    resetSettings,
  } = useAppStore();

  // Local state for decoupled text input typing
  const [freqText, setFreqText] = useState<string>(frequency.toString());

  // Sync local text input when global frequency changes (sliders or presets)
  useEffect(() => {
    setFreqText(frequency.toString());
  }, [frequency]);

  const handleToggleOscillator = () => {
    if (isPlaying && audioEngine.inputMode === 'oscillator') {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.playTestTone(frequency);
      setIsPlaying(true);
    }
  };

  const handleMicToggle = async () => {
    if (isPlaying && audioEngine.inputMode === 'microphone') {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      try {
        await audioEngine.startMicrophone();
        setIsPlaying(true);
      } catch (err) {
        alert('Could not access microphone');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audioEngine.playUploadedFile(file);
      setIsPlaying(true);
    }
  };

  // Sync changes to store from slider immediately
  const handleFrequencySliderChange = (val: number) => {
    setFrequency(val);
    if (isPlaying && audioEngine.inputMode === 'oscillator') {
      audioEngine.setFrequency(val);
    }
  };

  // Commit text input to store on blur or Enter press
  const commitFrequencyText = () => {
    const parsed = parseInt(freqText, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(20, Math.min(2000, parsed));
      setFrequency(clamped);
      setFreqText(clamped.toString()); // Update local text to clamped value
      if (isPlaying && audioEngine.inputMode === 'oscillator') {
        audioEngine.setFrequency(clamped);
      }
    } else {
      // Revert to current valid value if input is invalid/blank
      setFreqText(frequency.toString());
    }
  };

  const handleFrequencyTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitFrequencyText();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="w-80 h-full bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-white/10 flex flex-col z-10 text-gray-200 overflow-y-auto select-none font-sans scrollbar-thin">
      {/* App Logo & Title */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Disc className="w-6 h-6 text-white animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            CYMATRIX
          </h1>
          <p className="text-[10px] text-gray-500 font-mono">MVP REAL-TIME VISUALIZER</p>
        </div>
      </div>

      {/* Input Sources Selection */}
      <div className="p-5 border-b border-white/5 flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Audio Sources</span>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Oscillator trigger */}
          <button
            onClick={handleToggleOscillator}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
              isPlaying && audioEngine.inputMode === 'oscillator'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
            }`}
          >
            {isPlaying && audioEngine.inputMode === 'oscillator' ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Tone</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Sine Wave</span>
              </>
            )}
          </button>

          {/* Microphone trigger */}
          <button
            onClick={handleMicToggle}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
              isPlaying && audioEngine.inputMode === 'microphone'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isPlaying && audioEngine.inputMode === 'microphone' ? 'Mute Mic' : 'Microphone'}</span>
          </button>
        </div>

        {/* Drag-and-drop Audio Upload */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-white/5 rounded-lg p-4 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-[11px] text-gray-400">Drag file or click to upload</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="audio/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Settings / Parameters controls */}
      <div className="p-5 flex-1 flex flex-col gap-6">
        
        {/* Preset Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Acoustic Presets</span>
          <div className="flex gap-1.5">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((pName) => (
              <button
                key={pName}
                onClick={() => applyPreset(pName)}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded text-[11px] font-semibold transition-colors"
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Visualization Modes */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Modes</span>
          <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            {(['mandala', 'chladni', 'ripple'] as VisMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setVisualizationMode(mode)}
                className={`py-1.5 rounded-md text-[11px] font-bold capitalize transition-all ${
                  visualizationMode === mode
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-400 font-extrabold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Precise Frequency Control */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Frequency
            </span>
            <input 
              type="text" 
              value={freqText} 
              onChange={(e) => setFreqText(e.target.value)}
              onBlur={commitFrequencyText}
              onKeyDown={handleFrequencyTextKeyDown}
              className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500"
            />
          </div>
          <input
            type="range"
            min="20"
            max="2000"
            value={frequency}
            onChange={(e) => handleFrequencySliderChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Volume/Gain control */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Volume / Gain
            </span>
            <span className="font-mono text-gray-400">{(gain * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Symmetry count */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Symmetry Reps
            </span>
            <span className="font-mono text-gray-400">{symmetry}</span>
          </div>
          <input
            type="range"
            min="2"
            max="24"
            step="1"
            value={symmetry}
            onChange={(e) => setSymmetry(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Line Thickness */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Line Thickness
            </span>
            <span className="font-mono text-gray-400">{thickness.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.08"
            step="0.001"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Global Brightness */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Glow Brightness
            </span>
            <span className="font-mono text-gray-400">{brightness.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Damping */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Damping / Decay
            </span>
            <span className="font-mono text-gray-400">{damping.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.98"
            step="0.01"
            value={damping}
            onChange={(e) => setDamping(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Speed */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Animation Speed
            </span>
            <span className="font-mono text-gray-400">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="4.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-4 border-t border-white/5 flex gap-2">
        <button
          onClick={resetSettings}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-lg text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>
    </div>
  );
};
