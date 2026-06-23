import React, { useRef } from 'react';
import { useAppStore, type VisMode, PRESETS } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';
import { useOrientation } from '../hooks/useOrientation';
import { ControlRow } from './ControlRow';
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
  Menu
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

  const handleFrequencyChange = (val: number) => {
    setFrequency(val);
    if (isPlaying && audioEngine.inputMode === 'oscillator') {
      audioEngine.setFrequency(val);
    }
  };

  // Build responsive styling dynamically (removed glows and neon borders)
  let sidebarClasses = "bg-[#08080a] border-zinc-800/80 flex flex-col z-40 text-gray-200 select-none font-sans custom-scrollbar transition-all duration-300 ";

  if (isMobile) {
    if (isPortrait) {
      // Portrait bottom sheet (flat design, no active shadow glows)
      sidebarClasses += `fixed bottom-0 left-0 w-full h-[55vh] rounded-t-2xl border-t border-zinc-800 ${
        isControlsOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`;
    } else {
      // Landscape left sidebar overlay
      sidebarClasses += `fixed top-0 left-0 w-72 h-full border-r ${
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
          className="w-full flex justify-center py-3 bg-black/10 cursor-pointer" 
          onClick={() => setControlsOpen(false)}
        >
          <div className="w-12 h-1 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"></div>
        </div>
      )}

      {/* Header Area (Flat design, no glows) */}
      <div className="px-6 py-4 md:py-6 border-b border-zinc-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800">
            <Disc className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-widest text-cyan-400">
              CYMATRIX
            </h1>
            <p className="text-[9px] text-zinc-600 font-mono tracking-wider">STUDIO VISUALIZER</p>
          </div>
        </div>
        
        {/* Toggle/Collapse Menu Hamburger Icon */}
        <button 
          onClick={() => setControlsOpen(false)}
          className="p-2 rounded-md border border-zinc-800 bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95"
          title="Collapse Panel"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Settings / Parameters controls with increased whitespace spacing */}
      <div className="p-6 flex-1 flex flex-col gap-7 overflow-y-auto custom-scrollbar">
        
        {/* Audio Sources */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Audio Sources</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleOscillator}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded border text-xs font-semibold transition-all active:scale-98 ${
                isPlaying && audioEngine.inputMode === 'oscillator'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'
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

            <button
              onClick={handleMicToggle}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded border text-xs font-semibold transition-all active:scale-98 ${
                isPlaying && audioEngine.inputMode === 'microphone'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isPlaying && audioEngine.inputMode === 'microphone' ? 'Mute Mic' : 'Microphone'}</span>
            </button>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 rounded p-3 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] text-zinc-400">Upload audio file (MP3/WAV)</span>
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
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Presets</span>
          <div className="flex gap-1.5">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((pName) => (
              <button
                key={pName}
                onClick={() => applyPreset(pName)}
                className="flex-1 py-1.5 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-semibold text-zinc-300 transition-colors active:scale-95"
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Visualization Modes */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Modes</span>
          <div className="grid grid-cols-3 gap-1 bg-[#0c0c0e] p-1 rounded border border-zinc-800/80">
            {(['mandala', 'chladni', 'ripple'] as VisMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setVisualizationMode(mode)}
                className={`py-1.5 rounded text-[10px] font-bold capitalize transition-all active:scale-95 ${
                  visualizationMode === mode
                    ? 'bg-cyan-500 text-black border border-cyan-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-zinc-900" />

        {/* Reusable ControlRows for all parameters */}
        <div className="flex flex-col gap-6">
          <ControlRow
            label="Frequency"
            icon={<Zap className="w-3.5 h-3.5" />}
            value={frequency}
            min={20}
            max={2000}
            step={1}
            onChange={handleFrequencyChange}
            displayPrecision={0}
          />

          <ControlRow
            label="Volume / Gain"
            icon={<Volume2 className="w-3.5 h-3.5" />}
            value={gain}
            min={0}
            max={1.0}
            step={0.01}
            onChange={setGain}
            displayPrecision={2}
          />

          <ControlRow
            label="Symmetry Reps"
            icon={<Layers className="w-3.5 h-3.5" />}
            value={symmetry}
            min={2}
            max={24}
            step={1}
            onChange={setSymmetry}
            displayPrecision={0}
          />

          <ControlRow
            label="Line Thickness"
            icon={<Sliders className="w-3.5 h-3.5" />}
            value={thickness}
            min={0.005}
            max={0.08}
            step={0.001}
            onChange={setThickness}
            displayPrecision={3}
          />

          <ControlRow
            label="Glow Brightness"
            icon={<Sun className="w-3.5 h-3.5" />}
            value={brightness}
            min={0.1}
            max={3.0}
            step={0.1}
            onChange={setBrightness}
            displayPrecision={1}
          />

          <ControlRow
            label="Damping / Decay"
            icon={<Activity className="w-3.5 h-3.5" />}
            value={damping}
            min={0.5}
            max={0.98}
            step={0.01}
            onChange={setDamping}
            displayPrecision={2}
          />

          <ControlRow
            label="Animation Speed"
            icon={<Activity className="w-3.5 h-3.5" />}
            value={speed}
            min={0.1}
            max={4.0}
            step={0.1}
            onChange={setSpeed}
            displayPrecision={1}
          />
        </div>

      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-4 border-t border-zinc-900 flex gap-2">
        <button
          onClick={resetSettings}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-xs font-bold transition-all active:scale-95 text-zinc-400 hover:text-zinc-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>
    </div>
  );
};
