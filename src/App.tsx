import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { CymaticCanvas } from './visualization/components/CymaticCanvas';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { useAppStore } from './store/useAppStore';
import { Menu } from 'lucide-react';
import { useEffect } from 'react';
import { deserializeState } from './utils/dna';

function App() {
  const isLeftSidebarOpen = useAppStore((state) => state.isLeftSidebarOpen);
  const setLeftSidebarOpen = useAppStore((state) => state.setLeftSidebarOpen);
  const isRightSidebarOpen = useAppStore((state) => state.isRightSidebarOpen);
  const setRightSidebarOpen = useAppStore((state) => state.setRightSidebarOpen);
  const isMobile = useAppStore((state) => state.isMobile);

  const showBottomPanel = useAppStore((state) => state.showBottomPanel);
  const setShowBottomPanel = useAppStore((state) => state.setShowBottomPanel);
  const zenMode = useAppStore((state) => state.zenMode);
  const setZenMode = useAppStore((state) => state.setZenMode);

  // Hydrate preset from DNA query parameter if present on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dna = params.get('dna');
    if (dna) {
      const loadedState = deserializeState(dna);
      if (loadedState) {
        useAppStore.getState().loadDnaState(loadedState);
      }
    }
  }, []);

  // Listen for Escape key to exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, setZenMode]);

  // Auto-collapse sidebars on screens smaller than 1024px (mobile & tablet)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };
    handleResize(); // Run once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setLeftSidebarOpen, setRightSidebarOpen]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#020202] text-white flex select-none font-sans relative">
      
      {/* Full-Screen WebGL Canvas (Absolute background for screen-centered pattern) */}
      <div className="absolute inset-0 z-0">
        <CymaticCanvas />
      </div>
      
      {/* Left Sidebar (Audio Generator) */}
      <LeftSidebar />
      
      {/* Center Visualizer Area (Overlay overlaying the Canvas) */}
      <div className="flex-1 h-full flex flex-col relative pointer-events-none z-10">
        
        {/* Floating Toggle Generator Button (Top Left) */}
        {!isLeftSidebarOpen && !zenMode && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute top-6 left-6 z-30 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Generator</span>
          </button>
        )}
        
        {/* Floating Toggle Inspector Button (Top Right) */}
        {!isRightSidebarOpen && !zenMode && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute top-6 right-6 z-30 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-[#0c0c0e] text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
        )}

        {/* Floating Toggle Spectrum Panel Button (Bottom Center) */}
        {!showBottomPanel && !zenMode && !isMobile && (
          <button
            onClick={() => setShowBottomPanel(true)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <span>Spectrum</span>
          </button>
        )}

        {/* Floating HUD info */}
        <div className="flex-1 relative overflow-hidden pointer-events-none">
          {!isMobile && !zenMode && (
            <div className="absolute top-20 right-6 z-10 pointer-events-auto flex flex-col items-end gap-1 font-mono text-[9px] text-zinc-600 bg-black/30 backdrop-blur-sm p-3 rounded border border-zinc-800/40">
              <span className="text-cyan-400 font-bold">CYMATRIX ACTIVE</span>
              <span>ENGINE: WEBGL GLSL SHADERS</span>
              <span>BLENDING: ADDITIVE BLOOM</span>
              <span>RENDER SPEED: 60 FPS (TARGET)</span>
            </div>
          )}
        </div>

        {/* Real-Time Spectrum Analyzer Panel */}
        {!isMobile && (
          <div 
            className={`pointer-events-auto w-full transition-all duration-500 ease-in-out origin-bottom ${
              showBottomPanel ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 h-0 overflow-hidden'
            }`}
          >
            <SpectrumAnalyzer />
          </div>
        )}
      </div>

      {/* Right Sidebar (Visual Controls) */}
      <RightSidebar />

      {/* Zen Mode Active Overlay */}
      {zenMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-4 bg-black/80 backdrop-blur-md px-4 py-2 border border-zinc-800 rounded font-mono text-[10px] tracking-wider text-zinc-400">
          <span>ZEN MODE ACTIVE</span>
          <span className="text-zinc-600">|</span>
          <span>PRESS ESC TO EXIT</span>
          <button
            onClick={() => setZenMode(false)}
            className="text-zinc-500 hover:text-red-400 font-bold ml-1 transition-colors cursor-pointer"
            title="Exit Zen Mode"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
