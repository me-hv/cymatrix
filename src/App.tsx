
import { Sidebar } from './components/Sidebar';
import { CymaticCanvas } from './visualization/components/CymaticCanvas';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#020202] text-white flex select-none font-sans">
      {/* Left Sidebar Inspector Controls */}
      <Sidebar />
      
      {/* Right Visualizer Area */}
      <div className="flex-1 h-full flex flex-col relative">
        
        {/* Full-Screen WebGL Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#010102]">
          <CymaticCanvas />
          
          {/* Subtle HUD Overlay */}
          <div className="absolute top-6 right-6 z-10 pointer-events-none flex flex-col items-end gap-1 font-mono text-[10px] text-gray-500 bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-white/5">
            <span className="text-cyan-400 font-bold">CYMATRIX ACTIVE</span>
            <span>ENGINE: WEBGL GLSL SHADERS</span>
            <span>BLENDING: ADDITIVE BLOOM</span>
            <span>RENDER SPEED: 60 FPS (TARGET)</span>
          </div>
        </div>

        {/* Real-Time Spectrum Analyzer Panel */}
        <SpectrumAnalyzer />
      </div>
    </div>
  );
}

export default App;
