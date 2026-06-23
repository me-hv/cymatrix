import React, { useRef, useState, useEffect } from 'react';
import { useAppStore, type VisMode, PRESETS } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';
import { useOrientation } from '../hooks/useOrientation';
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
  Disc,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPortrait = useOrientation();
  
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
    isMobile,
    isControlsOpen,
    
    setVisualizationMode,
    setFrequency,
    setSymmetry,
    setDamping,
    setBrightness,
    setGain,
    setThickness,
    setSpeed,
    setIsPlaying,
    setControlsOpen,
    applyPreset,
    resetSettings,
  } = useAppStore();

  // Local state for decoupled text input typing
  const [freqText, setFreqText] = useState<string>(frequency.toString());

  // Sync local text input when global frequency changes (sliders or presets)
  useEffect(() => {
    setFreqText(frequency.toString());
  }, [frequency]);

  const handleToggleOscillator = async () => {
    await audioEngine.resumeContext();
    if (isPlaying && audioEngine.inputMode === 'oscillator') {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.playTestTone(frequency);
      setIsPlaying(true);
    }
  };

  const handleMicToggle = async () => {
    await audioEngine.resumeContext();
    if (isPlaying && audioEngine.inputMode === 'microphone') {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      // Clear permission alert prompt for mobile users
      const confirmAllow = window.confirm(
        "Cymatrix wants to access your Microphone to visualize live sound frequencies.\n\nTap OK to allow access."
      );
      if (!confirmAllow) return;

      try {
        await audioEngine.startMicrophone();
        setIsPlaying(true);
      } catch (err) {
        alert('Could not access microphone. Please check permissions in your browser settings.');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await audioEngine.resumeContext();
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

  // Build responsive styling dynamically
  let sidebarClasses = "bg-[#0a0a0c]/90 backdrop-blur-2xl flex flex-col z-40 text-gray-200 select-none font-sans scrollbar-thin transition-all duration-300 border-white/10 ";

  if (isMobile) {
    if (isPortrait) {
      // Portrait bottom sheet
      sidebarClasses += `fixed bottom-0 left-0 w-full h-[55vh] rounded-t-3xl border-t shadow-[0_-15px_30px_rgba(0,0,0,0.8)] ${
        isControlsOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`;
    } else {
      // Landscape left sidebar overlay
      sidebarClasses += `fixed top-0 left-0 w-72 h-full border-r shadow-[15px_0_30px_rgba(0,0,0,0.8)] ${
        isControlsOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`;
    }
  } else {
    // Desktop layout - relative with clean transition
    sidebarClasses += `relative h-full border-r ${
      isControlsOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-r-0 overflow-hidden pointer-events-none"
    }`;
  }

  return (
    <div className={sidebarClasses}>
      {/* Mobile Top Grab Handle */}
      {isMobile && isPortrait && (
        <div 
          className="w-full flex justify-center py-3 bg-black/20 cursor-pointer" 
          onClick={() => setControlsOpen(false)}
        >
          <div className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"></div>
        </div>
      )}

      {/* App Logo & Title */}
      <div className="px-6 py-4 md:py-6 border-b border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Disc className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              CYMATRIX
            </h1>
            <p className="text-[10px] text-gray-500 font-mono">MVP REAL-TIME VISUALIZER</p>
          </div>
        </div>
        
        {/* Collapse button */}
        <button 
          onClick={() => setControlsOpen(false)}
          className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all active:scale-95"
          title="Collapse Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings / Parameters controls */}
      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        
        {/* Audio Sources */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Audio Sources</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleOscillator}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border text-xs font-semibold transition-all active:scale-98 ${
                isPlaying && audioEngine.inputMode === 'oscillator'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50 font-bold'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
              }`}
            >
              {isPlaying && audioEngine.inputMode === 'oscillator' ? (
                <>
                  <Square className="w-4.5 h-4.5 fill-current" />
                  <span>Stop Tone</span>
                </>
              ) : (
                <>
                  <Play className="w-4.5 h-4.5 fill-current" />
                  <span>Sine Wave</span>
                </>
              )}
            </button>

            <button
              onClick={handleMicToggle}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border text-xs font-semibold transition-all active:scale-98 ${
                isPlaying && audioEngine.inputMode === 'microphone'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50 font-bold'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
              }`}
            >
              <Mic className="w-4.5 h-4.5" />
              <span>{isPlaying && audioEngine.inputMode === 'microphone' ? 'Mute Mic' : 'Microphone'}</span>
            </button>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-white/5 rounded-lg p-3 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-[11px] text-gray-400">Upload MP3/WAV/FLAC</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="audio/*" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Presets</span>
          <div className="flex gap-1.5">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((pName) => (
              <button
                key={pName}
                onClick={() => applyPreset(pName)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded text-[11px] font-semibold transition-colors active:scale-95"
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
                className={`py-2 rounded-md text-[11px] font-bold capitalize transition-all active:scale-95 ${
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
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Frequency
            </span>
            <input 
              type="text" 
              value={freqText} 
              onChange={(e) => setFreqText(e.target.value)}
              onBlur={commitFrequencyText}
              onKeyDown={handleFrequencyTextKeyDown}
              className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-right text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500"
            />
          </div>
          <div className="py-1">
            <input
              type="range"
              min="20"
              max="2000"
              value={frequency}
              onChange={(e) => handleFrequencySliderChange(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

        {/* Volume/Gain control */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Volume / Gain
            </span>
            <span className="font-mono text-gray-400">{(gain * 100).toFixed(0)}%</span>
          </div>
          <div className="py-1">
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.01"
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

        {/* Symmetry count */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Symmetry Reps
            </span>
            <span className="font-mono text-gray-400">{symmetry}</span>
          </div>
          <div className="py-1">
            <input
              type="range"
              min="2"
              max="24"
              step="1"
              value={symmetry}
              onChange={(e) => setSymmetry(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

        {/* Line Thickness */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Line Thickness
            </span>
            <span className="font-mono text-gray-400">{thickness.toFixed(3)}</span>
          </div>
          <div className="py-1">
            <input
              type="range"
              min="0.005"
              max="0.08"
              step="0.001"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

        {/* Global Brightness */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Sun className="w-4 h-4" /> Glow Brightness
            </span>
            <span className="font-mono text-gray-400">{brightness.toFixed(1)}x</span>
          </div>
          <div className="py-1">
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

        {/* Damping */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Damping / Decay
            </span>
            <span className="font-mono text-gray-400">{damping.toFixed(2)}</span>
          </div>
          <div className="py-1">
            <input
              type="range"
              min="0.5"
              max="0.98"
              step="0.01"
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

        {/* Speed */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Animation Speed
            </span>
            <span className="font-mono text-gray-400">{speed.toFixed(1)}x</span>
          </div>
          <div className="py-1">
            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer touch-none"
            />
          </div>
        </div>

      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-4 border-t border-white/5 flex gap-2">
        <button
          onClick={resetSettings}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-lg text-xs font-bold transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>
    </div>
  );
};
