import React from 'react';
import { useAppStore, type VisMode, PRESETS } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';
import { useOrientation } from '../hooks/useOrientation';
import { ControlRow } from './ControlRow';
import { exportSnapshot } from '../utils/export';
import { 
  Camera, 
  Check, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Activity, 
  Sun, 
  Volume2,
  SlidersHorizontal,
  Menu
} from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const isPortrait = useOrientation();
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  
  const {
    visualizationMode,
    frequency,
    symmetry,
    damping,
    brightness,
    gain,
    thickness,
    speed,
    isMobile,
    isRightSidebarOpen,
    oscA,
    oscB,
    oscC,
    
    setVisualizationMode,
    setSymmetry,
    setDamping,
    setBrightness,
    setGain,
    setThickness,
    setSpeed,
    setRightSidebarOpen,
    applyPreset,
    resetSettings,
  } = useAppStore();

  const handleSaveImage = async () => {
    setSaveStatus('saving');
    try {
      // Small timeout to allow the DOM/UI to render "Saving..." before canvas operation blocks thread
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      let freqText = '';
      let filename = 'cymatrix-snapshot';
      if (audioEngine.inputMode === 'oscillator') {
        const activeOscs = [];
        const activeFreqs = [];
        if (oscA.enabled) {
          activeOscs.push(`A: ${oscA.frequency.toFixed(1)}Hz`);
          activeFreqs.push(`${Math.round(oscA.frequency)}hz`);
        }
        if (oscB.enabled) {
          activeOscs.push(`B: ${oscB.frequency.toFixed(1)}Hz`);
          activeFreqs.push(`${Math.round(oscB.frequency)}hz`);
        }
        if (oscC.enabled) {
          activeOscs.push(`C: ${oscC.frequency.toFixed(1)}Hz`);
          activeFreqs.push(`${Math.round(oscC.frequency)}hz`);
        }
        
        freqText = activeOscs.length > 0 ? activeOscs.join(' | ') : 'Silent';
        filename += `-${activeFreqs.length > 0 ? activeFreqs.join('-') : 'silent'}`;
      } else {
        freqText = `${frequency.toFixed(1)} Hz`;
        filename += `-${Math.round(frequency)}hz`;
      }
      filename += '.png';
      
      await exportSnapshot(freqText, filename);
      setSaveStatus('saved');
    } catch {
      alert('Failed to save image.');
      setSaveStatus('idle');
    }
  };

  React.useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Build responsive styling dynamically (sliding from the right in landscape/desktop)
  let sidebarClasses = "bg-[#08080a] border-zinc-800/80 flex flex-col z-40 text-gray-200 select-none font-sans custom-scrollbar transition-all duration-300 ";

  if (isMobile) {
    if (isPortrait) {
      sidebarClasses += `fixed bottom-0 left-0 w-full h-[55vh] rounded-t-2xl border-t border-zinc-800 ${
        isRightSidebarOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`;
    } else {
      sidebarClasses += `fixed top-0 right-0 w-72 h-full border-l ${
        isRightSidebarOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`;
    }
  } else {
    sidebarClasses += `relative h-full border-l ${
      isRightSidebarOpen ? "w-[300px] opacity-100" : "w-0 opacity-0 border-l-0 overflow-hidden pointer-events-none"
    }`;
  }

  return (
    <div className={sidebarClasses}>
      {/* Mobile Top Grab Handle */}
      {isMobile && isPortrait && (
        <div 
          className="w-full flex justify-center py-3 bg-black/10 cursor-pointer" 
          onClick={() => setRightSidebarOpen(false)}
        >
          <div className="w-12 h-1 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"></div>
        </div>
      )}

      {/* Header Area */}
      <div className="px-6 py-4 md:py-6 border-b border-zinc-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-widest text-cyan-400">
              INSPECTOR
            </h1>
            <p className="text-[9px] text-zinc-600 font-mono tracking-wider">VISUAL CONTROLS</p>
          </div>
        </div>
        
        {/* Collapse Button */}
        <button 
          onClick={() => setRightSidebarOpen(false)}
          className="p-2 rounded-md border border-zinc-800 bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
          title="Collapse Panel"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Content Panel */}
      <div className="p-6 flex-1 flex flex-col gap-7 overflow-y-auto custom-scrollbar">
        
        {/* Preset Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Presets</span>
          <div className="flex gap-1.5">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((pName) => (
              <button
                key={pName}
                onClick={() => applyPreset(pName)}
                className="flex-1 py-1.5 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-semibold text-zinc-300 transition-colors active:scale-95 cursor-pointer"
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
                className={`py-1.5 rounded text-[10px] font-bold capitalize transition-all active:scale-95 cursor-pointer ${
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
          onClick={handleSaveImage}
          disabled={saveStatus === 'saving'}
          className={`flex-1 flex items-center justify-center gap-2 py-2 bg-transparent border rounded text-xs font-bold transition-all active:scale-95 ${
            saveStatus === 'saved'
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/10'
              : 'border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/5 cursor-pointer'
          }`}
        >
          {saveStatus === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Image Saved!</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Image'}</span>
            </>
          )}
        </button>
        <button
          onClick={resetSettings}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-xs font-bold transition-all active:scale-95 text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>
    </div>
  );
};
