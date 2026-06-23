import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { CymaticCanvas } from './visualization/components/CymaticCanvas';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { useAppStore } from './store/useAppStore';
import { Menu } from 'lucide-react';

function App() {
  const isLeftSidebarOpen = useAppStore((state) => state.isLeftSidebarOpen);
  const setLeftSidebarOpen = useAppStore((state) => state.setLeftSidebarOpen);
  const isRightSidebarOpen = useAppStore((state) => state.isRightSidebarOpen);
  const setRightSidebarOpen = useAppStore((state) => state.setRightSidebarOpen);
  const isMobile = useAppStore((state) => state.isMobile);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#020202] text-white flex select-none font-sans relative">
      
      {/* Left Sidebar (Audio Generator) */}
      <LeftSidebar />
      
      {/* Center Visualizer Area */}
      <div className="flex-1 h-full flex flex-col relative">
        
        {/* Floating Toggle Generator Button (Top Left) */}
        {!isLeftSidebarOpen && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Generator</span>
          </button>
        )}

        {/* Floating Toggle Inspector Button (Top Right) */}
        {!isRightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute top-6 right-6 z-30 flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
        )}

        {/* Full-Screen WebGL Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#010102]">
          <CymaticCanvas />
          
          {/* Subtle HUD Overlay (positioned lower to prevent toggle button overlap) */}
          {!isMobile && (
            <div className="absolute top-20 right-6 z-10 pointer-events-none flex flex-col items-end gap-1 font-mono text-[9px] text-zinc-600 bg-black/30 backdrop-blur-sm p-3 rounded border border-zinc-800/40">
              <span className="text-cyan-400 font-bold">CYMATRIX ACTIVE</span>
              <span>ENGINE: WEBGL GLSL SHADERS</span>
              <span>BLENDING: ADDITIVE BLOOM</span>
              <span>RENDER SPEED: 60 FPS (TARGET)</span>
            </div>
          )}
        </div>

        {/* Real-Time Spectrum Analyzer Panel */}
        {!isMobile && <SpectrumAnalyzer />}
      </div>

      {/* Right Sidebar (Visual Controls) */}
      <RightSidebar />
    </div>
  );
}

export default App;
