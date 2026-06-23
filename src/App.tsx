import { Sidebar } from './components/Sidebar';
import { CymaticCanvas } from './visualization/components/CymaticCanvas';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { useAppStore } from './store/useAppStore';
import { Menu } from 'lucide-react';

function App() {
  const isControlsOpen = useAppStore((state) => state.isControlsOpen);
  const setControlsOpen = useAppStore((state) => state.setControlsOpen);
  const isMobile = useAppStore((state) => state.isMobile);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#020202] text-white flex select-none font-sans relative">
      
      {/* Floating Toggle Controls Button (Minimal Studio Style, no glows) */}
      {!isControlsOpen && (
        <button
          onClick={() => setControlsOpen(true)}
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Controls</span>
        </button>
      )}

      {/* Left Sidebar Inspector Controls (handles its own responsive placement) */}
      <Sidebar />
      
      {/* Right Visualizer Area (fills full viewport on mobile) */}
      <div className="flex-1 h-full flex flex-col relative">
        
        {/* Full-Screen WebGL Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#010102]">
          <CymaticCanvas />
          
          {/* Subtle HUD Overlay (hidden on mobile to save screen estate) */}
          {!isMobile && (
            <div className="absolute top-6 right-6 z-10 pointer-events-none flex flex-col items-end gap-1 font-mono text-[9px] text-zinc-600 bg-black/30 backdrop-blur-sm p-3 rounded border border-zinc-800/40">
              <span className="text-cyan-400 font-bold">CYMATRIX ACTIVE</span>
              <span>ENGINE: WEBGL GLSL SHADERS</span>
              <span>BLENDING: ADDITIVE BLOOM</span>
              <span>RENDER SPEED: 60 FPS (TARGET)</span>
            </div>
          )}
        </div>

        {/* Real-Time Spectrum Analyzer Panel (unmounted on mobile to save CPU/GPU cycles) */}
        {!isMobile && <SpectrumAnalyzer />}
      </div>
    </div>
  );
}

export default App;
