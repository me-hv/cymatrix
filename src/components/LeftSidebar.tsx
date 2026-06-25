import React, { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { audioEngine } from '../audio/AudioEngine';
import { useOrientation } from '../hooks/useOrientation';
import { exportSnapshot } from '../utils/export';
import { 
  Play, 
  Square, 
  Upload, 
  Disc,
  Menu,
  Eye
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
    sweepActive,
    sweepTarget,
    sweepStart,
    sweepEnd,
    sweepSpeed,
    sweepMode,
    bookmarks,
    autoSaveOnPin,
    
    inputMode,
    sensitivity,
    audioSmoothing,
    freqFocus,
    uploadedFileName,
    trackDuration,
    trackProgress,
    setZenMode,
    setIsPlaying,
    setLeftSidebarOpen,
    setOscA,
    setOscB,
    setOscC,
    setHarmonicInterval,
    setSweepActive,
    setSweepTarget,
    setSweepStart,
    setSweepEnd,
    setSweepSpeed,
    setSweepMode,
    addBookmark,
    removeBookmark,
    setAutoSaveOnPin,
    setSensitivity,
    setAudioSmoothing,
    setFreqFocus,
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

  const handleSourceChange = async (mode: 'oscillator' | 'microphone' | 'file') => {
    await audioEngine.resumeContext();
    
    if (mode === 'microphone') {
      const confirmAllow = window.confirm(
        "Cymatrix wants to access your Microphone to visualize live sound frequencies.\n\nTap OK to allow access."
      );
      if (!confirmAllow) return;

      try {
        await audioEngine.setInputSource('microphone');
        setIsPlaying(true);
      } catch {
        alert('Could not access microphone. Please check permissions in your browser settings.');
      }
    } else {
      await audioEngine.setInputSource(mode);
      setIsPlaying(audioEngine.isPlaying);
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

  const handleFilePlayPauseToggle = () => {
    if (audioEngine.isPaused) {
      audioEngine.resumeFilePlayback();
      setIsPlaying(true);
    } else {
      audioEngine.pauseFilePlayback();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getCurrentSweepProgress = () => {
    if (sweepTarget === 'B') return oscB.frequency;
    if (sweepTarget === 'C') return oscC.frequency;
    return oscA.frequency;
  };

  const handlePinResonance = async () => {
    let freq = oscA.frequency;
    const target = sweepTarget;
    if (target === 'B') freq = oscB.frequency;
    else if (target === 'C') freq = oscC.frequency;
    
    addBookmark({
      id: Math.random().toString(36).substring(2, 11),
      frequency: freq,
      target: target,
      timestamp: Date.now()
    });

    if (autoSaveOnPin) {
      const filename = `cymatrix-resonance-${Math.round(freq)}hz`;
      const freqText = target === 'all'
        ? `A: ${oscA.frequency}Hz | B: ${oscB.frequency}Hz | C: ${oscC.frequency}Hz`
        : `OSC ${target.toUpperCase()}: ${freq.toFixed(1)} Hz`;
      try {
        await exportSnapshot(freqText, `${filename}.png`);
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }
  };

  const [isOverlay, setIsOverlay] = React.useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsOverlay(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build responsive styling dynamically (flat design, matching scrollbars)
  let sidebarClasses = "border-[#2a2a2a]/80 flex flex-col z-50 text-gray-200 select-none font-sans custom-scrollbar transition-all duration-300 ";

  if (isOverlay) {
    if (isPortrait) {
      sidebarClasses += `fixed bottom-0 left-0 w-full h-[55dvh] rounded-t-2xl border-t border-[#2a2a2a] backdrop-blur-md bg-[#121212]/75 ${
        isLeftSidebarOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`;
    } else {
      sidebarClasses += `fixed top-0 left-0 w-72 h-[100dvh] border-r border-[#2a2a2a] backdrop-blur-md bg-[#121212]/75 ${
        isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`;
    }
  } else {
    sidebarClasses += `relative h-full border-r border-[#2a2a2a] bg-[#121212] ${
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
        
        {/* Actions (Zen Mode + Collapse) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZenMode(true)}
            className="p-2 rounded-md border border-zinc-800 bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
            title="Zen Mode (Hide All UI)"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setLeftSidebarOpen(false)}
            className="p-2 rounded-md border border-zinc-800 bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
            title="Collapse Panel"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audio Content Panel */}
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        
        {/* Audio Input Switcher */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Input Source</span>
          <div className="flex rounded bg-[#18181a] border border-[#2a2a2a] overflow-hidden text-[10px] font-mono font-bold">
            <button
              onClick={() => handleSourceChange('oscillator')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer ${
                inputMode === 'oscillator' ? 'bg-cyan-950/20 text-[#22d3ee] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              INTERNAL
            </button>
            <button
              onClick={() => handleSourceChange('microphone')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer ${
                inputMode === 'microphone' ? 'bg-cyan-950/20 text-[#22d3ee] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              MICROPHONE
            </button>
            <button
              onClick={() => handleSourceChange('file')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer ${
                inputMode === 'file' ? 'bg-cyan-950/20 text-[#22d3ee] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              FILE
            </button>
          </div>
        </div>

        <hr className="border-[#2a2a2a]" />

        {inputMode === 'oscillator' ? (
          <>
            {/* Master Oscillator Tone Controller */}
            <div className="flex justify-between items-center bg-zinc-950/25 border border-zinc-900 rounded p-3">
              <span className="text-[10px] font-mono font-bold text-zinc-400">MASTER AUDIO TONE</span>
              <button
                onClick={handleToggleOscillator}
                className={`px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider border transition-all cursor-pointer ${
                  isPlaying && audioEngine.inputMode === 'oscillator'
                    ? 'bg-cyan-950/20 border-cyan-500 text-[#22d3ee]'
                    : 'bg-transparent border-[#2a2a2a] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isPlaying && audioEngine.inputMode === 'oscillator' ? 'ACTIVE' : 'MUTED'}
              </button>
            </div>

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

            <hr className="border-[#2a2a2a]" />

            {/* Sweep Controller Panel */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Sweep Controller</span>
                <div className="flex rounded bg-[#18181a] border border-[#2a2a2a] overflow-hidden text-[8px] font-mono font-bold">
                  <button
                    onClick={() => setSweepMode('loop')}
                    className={`px-2 py-0.5 border-r border-[#2a2a2a] ${
                      sweepMode === 'loop' ? 'bg-cyan-950/20 text-[#22d3ee]' : 'text-zinc-500'
                    }`}
                  >
                    LOOP
                  </button>
                  <button
                    onClick={() => setSweepMode('bounce')}
                    className={`px-2 py-0.5 ${
                      sweepMode === 'bounce' ? 'bg-cyan-950/20 text-[#22d3ee]' : 'text-zinc-500'
                    }`}
                  >
                    BOUNCE
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Row 1: Power Toggle & Target Selector */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSweepActive(!sweepActive)}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider border transition-all cursor-pointer ${
                      sweepActive 
                        ? 'bg-cyan-950/20 border-cyan-500 text-[#22d3ee]' 
                        : 'bg-transparent border-[#2a2a2a] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {sweepActive ? 'RUNNING' : 'SWEEP'}
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">TARGET</span>
                    <div className="flex rounded bg-[#18181a] border border-[#2a2a2a] overflow-hidden text-[8px] font-mono font-bold">
                      {(['A', 'B', 'C', 'all'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSweepTarget(t)}
                          className={`px-2 py-1 border-r last:border-r-0 border-[#2a2a2a] ${
                            sweepTarget === t ? 'bg-cyan-950/20 text-[#22d3ee]' : 'text-zinc-500'
                          }`}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Range Inputs (Start & End) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">START</span>
                    <div className="flex items-baseline gap-1 border-b border-[#2a2a2a] focus-within:border-cyan-500/50 pb-0.5">
                      <input
                        type="number"
                        min={20}
                        max={2000}
                        value={sweepStart}
                        onChange={(e) => setSweepStart(Math.max(20, Math.min(2000, parseInt(e.target.value) || 20)))}
                        className="w-full bg-transparent text-xs font-mono text-[#22d3ee] outline-none"
                      />
                      <span className="text-[8px] text-zinc-600 font-mono">Hz</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">END</span>
                    <div className="flex items-baseline gap-1 border-b border-[#2a2a2a] focus-within:border-cyan-500/50 pb-0.5">
                      <input
                        type="number"
                        min={20}
                        max={2000}
                        value={sweepEnd}
                        onChange={(e) => setSweepEnd(Math.max(20, Math.min(2000, parseInt(e.target.value) || 2000)))}
                        className="w-full bg-transparent text-xs font-mono text-[#22d3ee] outline-none"
                      />
                      <span className="text-[8px] text-zinc-600 font-mono">Hz</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Speed Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">SPEED</span>
                    <span className="text-[9px] font-mono text-[#22d3ee]">{sweepSpeed} Hz/s</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={500}
                    step={1}
                    value={sweepSpeed}
                    onChange={(e) => setSweepSpeed(parseInt(e.target.value))}
                    className="minimal-slider touch-none mt-1"
                  />
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="w-full h-1 bg-[#18181a] border border-[#2a2a2a] rounded-sm overflow-hidden">
                    <div 
                      className="h-full bg-[#22d3ee] transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.max(0, ((getCurrentSweepProgress() - sweepStart) / (sweepEnd - sweepStart)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Live Panel Controls */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Live Panel</span>
              
              {/* Sensitivity (Gain) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">SENSITIVITY (GAIN)</span>
                  <span className="text-[9px] font-mono text-[#22d3ee]">{sensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="minimal-slider touch-none mt-1"
                />
              </div>

              {/* Smoothing (Inertia) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">SMOOTHING (INERTIA)</span>
                  <span className="text-[9px] font-mono text-[#22d3ee]">{audioSmoothing.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={0.98}
                  step={0.01}
                  value={audioSmoothing}
                  onChange={(e) => setAudioSmoothing(parseFloat(e.target.value))}
                  className="minimal-slider touch-none mt-1"
                />
              </div>

              {/* Frequency Range Focus */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[8px] text-zinc-500 font-mono font-bold tracking-wider">FREQ RANGE FOCUS</span>
                  <span className="text-[9px] font-mono text-[#22d3ee]">{freqFocus} Hz</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={4000}
                  step={50}
                  value={freqFocus}
                  onChange={(e) => setFreqFocus(parseInt(e.target.value))}
                  className="minimal-slider touch-none mt-1"
                />
              </div>
            </div>

            {/* File Upload & Control Panel */}
            {inputMode === 'file' && (
              <>
                <hr className="border-[#2a2a2a]" />
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Audio File Player</span>
                  
                  {/* File Upload Dropzone */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-950/5 rounded p-4 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                  >
                    <Upload className="w-5 h-5 text-zinc-500 group-hover:text-[#22d3ee] transition-colors" />
                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 text-center">
                      {uploadedFileName ? 'Change Audio File' : 'Click to Upload MP3/WAV'}
                    </span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="audio/*" 
                      className="hidden" 
                    />
                  </div>

                  {uploadedFileName && (
                    <div className="flex flex-col gap-2 p-3 bg-zinc-950/40 border border-zinc-900 rounded">
                      {/* Filename feedback */}
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Disc className="w-3.5 h-3.5 text-[#22d3ee] shrink-0 animate-spin-slow" />
                        <span className="text-[10px] font-mono text-zinc-300 truncate" title={uploadedFileName}>
                          {uploadedFileName}
                        </span>
                      </div>

                      {/* Progress Bar & Timers */}
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="w-full h-1 bg-zinc-900 rounded-sm overflow-hidden relative border border-zinc-800">
                          <div 
                            className="h-full bg-[#22d3ee] transition-all duration-75"
                            style={{ width: `${trackProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                          <span>{formatTime(trackDuration * (trackProgress / 100))}</span>
                          <span>{formatTime(trackDuration)}</span>
                        </div>
                      </div>

                      {/* Play/Pause Button */}
                      <button
                        onClick={handleFilePlayPauseToggle}
                        className="w-full mt-1 py-1.5 rounded bg-cyan-950/20 border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono font-bold text-[#22d3ee] tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>PAUSE TRACK</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>PLAY TRACK</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <hr className="border-[#2a2a2a]" />

        {/* Resonance Bookmarks Panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Resonance Bookmarks</span>
            
            {/* Auto-Save Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSaveOnPin}
                onChange={(e) => setAutoSaveOnPin(e.target.checked)}
                className="w-2.5 h-2.5 rounded bg-zinc-900 border-zinc-800 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
              />
              <span className="text-[7px] text-zinc-500 font-mono font-bold tracking-wider">AUTO-SNAP</span>
            </label>
          </div>

          {/* Pin Button */}
          <button
            onClick={handlePinResonance}
            className="w-full py-2 bg-transparent hover:bg-cyan-950/10 border border-[#2a2a2a] hover:border-cyan-500/50 rounded flex items-center justify-center gap-2 text-xs font-mono font-bold text-cyan-400 tracking-wider transition-all active:scale-98 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>PIN RESONANCE</span>
          </button>

          {/* Bookmarked Gallery List */}
          {bookmarks.length > 0 ? (
            <div className="flex flex-col border border-[#2a2a2a] rounded bg-[#121212] max-h-36 overflow-y-auto custom-scrollbar divide-y divide-[#2a2a2a]">
              {bookmarks.map((bookmark) => (
                <div 
                  key={bookmark.id}
                  className="flex items-center justify-between p-2 hover:bg-[#18181a] transition-colors group cursor-pointer"
                  onClick={() => {
                    if (bookmark.target === 'all') {
                      setOscA({ frequency: bookmark.frequency });
                      setOscB({ frequency: Math.round(bookmark.frequency * 1.5) });
                      setOscC({ frequency: Math.round(bookmark.frequency * 2.0) });
                    } else if (bookmark.target === 'A') {
                      setOscA({ frequency: bookmark.frequency });
                    } else if (bookmark.target === 'B') {
                      setOscB({ frequency: bookmark.frequency });
                    } else if (bookmark.target === 'C') {
                      setOscC({ frequency: bookmark.frequency });
                    }
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-[#22d3ee] font-bold">
                      {bookmark.frequency.toFixed(1)} Hz
                    </span>
                    <span className="text-[6px] text-zinc-500 font-mono uppercase tracking-wider">
                      OSC {bookmark.target.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bookmark.id);
                    }}
                    className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 border border-[#2a2a2a] border-dashed rounded flex flex-col items-center justify-center gap-1">
              <span className="text-[8px] text-zinc-600 font-mono tracking-wider">NO PINNED RESONANCES</span>
            </div>
          )}
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
