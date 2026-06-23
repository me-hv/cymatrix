import React, { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';
import { useOrientation } from '../hooks/useOrientation';
import { 
  Play, 
  Square, 
  Mic, 
  Upload, 
  Disc,
  Menu
} from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPortrait = useOrientation();
  
  const {
    isPlaying,
    isMobile,
    isLeftSidebarOpen,
    oscA,
    oscB,
    oscC,
    
    setIsPlaying,
    setLeftSidebarOpen,
    setOscA,
    setOscB,
    setOscC,
    setHarmonicInterval,
  } = useAppStore();

  const handleToggleOscillator = async () => {
    await audioEngine.resumeContext();
    if (isPlaying && audioEngine.inputMode === 'oscillator') {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.playTestTone({ oscA, oscB, oscC });
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
      } catch {
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

  // Build responsive styling dynamically (flat design, matching scrollbars)
  let sidebarClasses = "bg-[#08080a] border-zinc-800/80 flex flex-col z-40 text-gray-200 select-none font-sans custom-scrollbar transition-all duration-300 ";

  if (isMobile) {
    if (isPortrait) {
      sidebarClasses += `fixed bottom-0 left-0 w-full h-[55vh] rounded-t-2xl border-t border-zinc-800 ${
        isLeftSidebarOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`;
    } else {
      sidebarClasses += `fixed top-0 left-0 w-72 h-full border-r ${
        isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`;
    }
  } else {
    sidebarClasses += `relative h-full border-r ${
      isLeftSidebarOpen ? "w-[300px] opacity-100" : "w-0 opacity-0 border-r-0 overflow-hidden pointer-events-none"
    }`;
  }

  return (
    <div className={sidebarClasses}>
      {/* Mobile Top Grab Handle */}
      {isMobile && isPortrait && (
        <div 
          className="w-full flex justify-center py-3 bg-black/10 cursor-pointer" 
          onClick={() => setLeftSidebarOpen(false)}
        >
          <div className="w-12 h-1 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"></div>
        </div>
      )}

      {/* Header Area */}
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
        
        {/* Collapse Button */}
        <button 
          onClick={() => setLeftSidebarOpen(false)}
          className="p-2 rounded-md border border-zinc-800 bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
          title="Collapse Panel"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Audio Content Panel */}
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        
        {/* Audio Sources */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Audio Sources</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleOscillator}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded border text-xs font-semibold transition-all active:scale-98 cursor-pointer ${
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
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded border text-xs font-semibold transition-all active:scale-98 cursor-pointer ${
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

        <hr className="border-zinc-900" />

        {/* Polyphonic Mixer Panel */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Oscillator Mixer</span>
          <div className="flex flex-col gap-2.5">
            <OscillatorRow name="OSC A" config={oscA} setConfig={setOscA} />
            <OscillatorRow name="OSC B" config={oscB} setConfig={setOscB} />
            <OscillatorRow name="OSC C" config={oscC} setConfig={setOscC} />
          </div>
        </div>

        {/* Harmonic Interval Shortcuts */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Harmonic Intervals</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setHarmonicInterval('fifth')}
              className="flex-1 py-1.5 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-[9px] font-semibold text-zinc-300 transition-colors active:scale-95 cursor-pointer"
            >
              Perfect 5th
            </button>
            <button
              onClick={() => setHarmonicInterval('third')}
              className="flex-1 py-1.5 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-[9px] font-semibold text-zinc-300 transition-colors active:scale-95 cursor-pointer"
            >
              Major 3rd
            </button>
            <button
              onClick={() => setHarmonicInterval('octave')}
              className="flex-1 py-1.5 bg-transparent hover:bg-zinc-900 active:bg-zinc-800 border border-zinc-800 rounded text-[9px] font-semibold text-zinc-300 transition-colors active:scale-95 cursor-pointer"
            >
              Octave
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

interface OscillatorRowProps {
  name: string;
  config: { enabled: boolean; frequency: number; gain: number };
  setConfig: (config: Partial<{ enabled: boolean; frequency: number; gain: number }>) => void;
}

const OscillatorRow: React.FC<OscillatorRowProps> = ({ name, config, setConfig }) => {
  const [tempFreqText, setTempFreqText] = React.useState<string>(config.frequency.toString());

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempFreqText(config.frequency.toString());
  }, [config.frequency]);

  const commitFreq = () => {
    const parsed = parseInt(tempFreqText);
    if (!isNaN(parsed)) {
      const clamped = Math.max(20, Math.min(2000, parsed));
      setConfig({ frequency: clamped });
      setTempFreqText(clamped.toString());
    } else {
      setTempFreqText(config.frequency.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitFreq();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900/10 border border-zinc-900 rounded">
      {/* Header: Toggle and Freq Input */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={config.enabled}
              onChange={(e) => setConfig({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 peer-checked:after:bg-cyan-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-950/40 border border-zinc-700 peer-checked:border-cyan-800/80"></div>
          </label>
          <span className={`text-[11px] font-bold tracking-widest ${config.enabled ? 'text-cyan-400' : 'text-zinc-500'}`}>
            {name}
          </span>
        </div>
        
        {/* Frequency numeric input */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Freq</span>
          <input 
            type="text"
            value={tempFreqText}
            onChange={(e) => setTempFreqText(e.target.value)}
            onBlur={commitFreq}
            onKeyDown={handleKeyDown}
            className="w-14 bg-[#040406] border border-zinc-800 rounded px-1.5 py-0.5 text-right text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-1.5 mt-0.5">
        {/* Pitch Slider */}
        <div className="flex items-center gap-3">
          <span className="w-7 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Pitch</span>
          <input
            type="range"
            min={20}
            max={2000}
            step={1}
            value={config.frequency}
            disabled={!config.enabled}
            onChange={(e) => setConfig({ frequency: parseInt(e.target.value) })}
            className={`minimal-slider flex-1 touch-none ${!config.enabled && 'opacity-25'}`}
          />
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3">
          <span className="w-7 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={config.gain}
            disabled={!config.enabled}
            onChange={(e) => setConfig({ gain: parseFloat(e.target.value) })}
            className={`minimal-slider flex-1 touch-none ${!config.enabled && 'opacity-25'}`}
          />
          <span className="w-8 text-[9px] font-mono text-zinc-400 text-right">
            {Math.round(config.gain * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
