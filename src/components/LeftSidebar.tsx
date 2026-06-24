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
  let sidebarClasses = "bg-[#121212] border-[#2a2a2a]/80 flex flex-col z-40 text-gray-200 select-none font-sans custom-scrollbar transition-all duration-300 ";

  if (isMobile) {
    if (isPortrait) {
      sidebarClasses += `fixed bottom-0 left-0 w-full h-[55vh] rounded-t-2xl border-t border-[#2a2a2a] ${
        isLeftSidebarOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`;
    } else {
      sidebarClasses += `fixed top-0 left-0 w-72 h-full border-r border-[#2a2a2a] ${
        isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`;
    }
  } else {
    sidebarClasses += `relative h-full border-r border-[#2a2a2a] ${
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

        <hr className="border-[#2a2a2a]" />

        {/* Polyphonic Mixer Panel */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Oscillator Mixer</span>
          <div className="flex flex-col divide-y divide-[#2a2a2a]">
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

import { type OscillatorConfig } from '../store/useAppStore';

interface OscillatorRowProps {
  name: string;
  config: OscillatorConfig;
  setConfig: (config: Partial<OscillatorConfig>) => void;
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

  const waveTypes: Array<{ id: OscillatorConfig['type']; label: string; svg: React.ReactNode }> = [
    {
      id: 'sine',
      label: 'Sine',
      svg: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12 C 5 4, 7 20, 12 12 C 17 4, 19 20, 22 12" />
        </svg>
      )
    },
    {
      id: 'triangle',
      label: 'Triangle',
      svg: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12 L 7 6 L 17 18 L 22 12" />
        </svg>
      )
    },
    {
      id: 'sawtooth',
      label: 'Saw',
      svg: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 18 L 14 6 V 18 L 22 10" />
        </svg>
      )
    },
    {
      id: 'square',
      label: 'Square',
      svg: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12 H 7 V 6 H 12 V 18 H 17 V 12 H 22" />
        </svg>
      )
    }
  ];

  return (
    <div className={`flex gap-3 py-3 select-none transition-opacity duration-200 ${!config.enabled ? 'opacity-50' : 'opacity-100'}`}>
      {/* Left side: Grid layout */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        
        {/* Header Row: [Toggle] [OSC Name] [Waveform Segmented Control] */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.enabled}
                onChange={(e) => setConfig({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-3.5 bg-zinc-800 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 peer-checked:after:bg-cyan-400 after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-cyan-950/40 border border-zinc-700 peer-checked:border-cyan-800/80"></div>
            </label>
            <span className={`text-[10px] font-mono font-bold tracking-wider ${config.enabled ? 'text-cyan-400' : 'text-zinc-500'}`}>
              {name}
            </span>
          </div>

          {/* Segmented Waveform Selector */}
          <div className="flex rounded bg-[#18181a] border border-[#2a2a2a] overflow-hidden">
            {waveTypes.map((wave) => (
              <button
                key={wave.id}
                disabled={!config.enabled}
                onClick={() => setConfig({ type: wave.id })}
                className={`w-6 h-5 flex items-center justify-center transition-all cursor-pointer border-r last:border-r-0 border-[#2a2a2a] ${
                  !config.enabled 
                    ? 'text-zinc-700 opacity-30 cursor-not-allowed'
                    : config.type === wave.id
                      ? 'bg-cyan-950/20 text-[#22d3ee]'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#1f1f22]'
                }`}
                title={wave.label}
              >
                {wave.svg}
              </button>
            ))}
          </div>
        </div>

        {/* Main Row: Large Numeric Freq + Hairline Slider */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-widest">FREQ</span>
            <div className="flex items-baseline gap-0.5">
              <input 
                type="text"
                value={tempFreqText}
                disabled={!config.enabled}
                onChange={(e) => setTempFreqText(e.target.value)}
                onBlur={commitFreq}
                onKeyDown={handleKeyDown}
                className={`bg-transparent text-right text-xl font-mono font-bold outline-none transition-all ${
                  !config.enabled ? 'text-zinc-600 cursor-not-allowed' : 'text-[#22d3ee]'
                }`}
                style={{ width: '48px' }}
              />
              <span className="text-[8px] text-zinc-600 font-mono">HZ</span>
            </div>
          </div>
          <input
            type="range"
            min={20}
            max={2000}
            step={1}
            value={config.frequency}
            disabled={!config.enabled}
            onChange={(e) => setConfig({ frequency: parseInt(e.target.value) })}
            className={`minimal-slider touch-none mt-1 ${!config.enabled && 'opacity-25'}`}
          />
        </div>

        {/* Secondary Row (Trio): Fine, Phase, LFO */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#1c1c1f]">
          {/* Fine */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-full">
              <input
                type="number"
                min={-50}
                max={50}
                value={config.detune}
                disabled={!config.enabled}
                onChange={(e) => setConfig({ detune: parseInt(e.target.value) || 0 })}
                className="w-10 bg-transparent border-b border-transparent focus:border-cyan-500/50 text-center text-xs font-mono text-[#22d3ee] outline-none disabled:text-zinc-600"
              />
              <span className="text-[9px] text-zinc-600 font-mono">c</span>
            </div>
            <span className="text-[7px] text-zinc-500 font-mono font-bold tracking-wider mt-0.5">FINE</span>
          </div>

          {/* Phase */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-full">
              <input
                type="number"
                min={0}
                max={360}
                value={config.phase}
                disabled={!config.enabled}
                onChange={(e) => setConfig({ phase: parseInt(e.target.value) || 0 })}
                className="w-10 bg-transparent border-b border-transparent focus:border-cyan-500/50 text-center text-xs font-mono text-[#22d3ee] outline-none disabled:text-zinc-600"
              />
              <span className="text-[9px] text-zinc-600 font-mono">°</span>
            </div>
            <span className="text-[7px] text-zinc-500 font-mono font-bold tracking-wider mt-0.5">PHASE</span>
          </div>

          {/* LFO */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 w-full h-5">
              <button
                type="button"
                disabled={!config.enabled}
                onClick={() => setConfig({ lfoEnabled: !config.lfoEnabled })}
                className={`p-0.5 rounded transition-all cursor-pointer ${
                  !config.enabled
                    ? 'text-zinc-700 opacity-30 cursor-not-allowed'
                    : config.lfoEnabled
                      ? 'bg-cyan-950/20 text-[#22d3ee]'
                      : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Toggle LFO"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 12 Q 6 4, 10 12 T 18 12 T 22 12" />
                </svg>
              </button>
              
              {config.lfoEnabled && (
                <div className="flex items-baseline gap-0.5">
                  <input
                    type="number"
                    min={0.1}
                    max={10.0}
                    step={0.1}
                    value={config.lfoRate}
                    disabled={!config.enabled || !config.lfoEnabled}
                    onChange={(e) => setConfig({ lfoRate: parseFloat(e.target.value) || 1.0 })}
                    className="w-8 bg-transparent border-b border-transparent focus:border-cyan-500/50 text-center text-[10px] font-mono text-[#22d3ee] outline-none disabled:text-zinc-600"
                  />
                  <span className="text-[8px] text-zinc-600 font-mono">Hz</span>
                </div>
              )}
            </div>
            <span className="text-[7px] text-zinc-500 font-mono font-bold tracking-wider mt-0.5">LFO</span>
          </div>
        </div>
      </div>

      {/* Right side: Volume Fader */}
      <div className="w-8 shrink-0 flex flex-col items-center justify-between border-l border-[#2a2a2a] pl-2 h-full py-0.5">
        <span className="text-[7px] text-zinc-500 font-mono font-bold tracking-wider">VOL</span>
        <div className="flex-1 flex items-center justify-center my-1.5 h-16">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={config.gain}
            disabled={!config.enabled}
            onChange={(e) => setConfig({ gain: parseFloat(e.target.value) })}
            className={`vertical-slider touch-none ${!config.enabled && 'opacity-25'}`}
          />
        </div>
        <span className={`text-[8px] font-mono text-center shrink-0 ${config.enabled ? 'text-[#22d3ee]' : 'text-zinc-600'}`}>
          {Math.round(config.gain * 100)}%
        </span>
      </div>
    </div>
  );
};
