import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { CymaticCanvas } from './visualization/components/CymaticCanvas';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { useAppStore } from './store/useAppStore';
import { Menu } from 'lucide-react';

import { useEffect } from 'react';

function App() {
  const isLeftSidebarOpen = useAppStore((state) => state.isLeftSidebarOpen);
  const setLeftSidebarOpen = useAppStore((state) => state.setLeftSidebarOpen);
  const isRightSidebarOpen = useAppStore((state) => state.isRightSidebarOpen);
  const setRightSidebarOpen = useAppStore((state) => state.setRightSidebarOpen);
  const isMobile = useAppStore((state) => state.isMobile);

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
        {!isLeftSidebarOpen && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute top-6 left-6 z-30 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Generator</span>
          </button>
        )}
        
        {/* Floating Toggle Inspector Button (Top Right) */}
        {!isRightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute top-6 right-6 z-30 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded border border-zinc-800 bg-[#08080a] hover:bg-[#0c0c0e] text-cyan-400 hover:text-cyan-300 font-bold text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
        )}

        {/* Floating HUD info */}
        <div className="flex-1 relative overflow-hidden pointer-events-none">
          {!isMobile && (
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
          <div className="pointer-events-auto">
            <SpectrumAnalyzer />
          </div>
        )}
      </div>

      {/* Right Sidebar (Visual Controls) */}
      <RightSidebar />
    </div>
  );
}

export default App;
