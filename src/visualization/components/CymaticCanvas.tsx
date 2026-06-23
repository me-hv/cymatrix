import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';
import { useAppStore } from '../../store/useAppStore';
import { CymaticMaterial } from '../materials/CymaticMaterial';
import { isMobileDevice } from '../../utils/device';
import { registerWebGLContext } from '../../utils/export';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CymaticPlane = ({ composerRef }: { composerRef: React.RefObject<any> }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const { size } = useThree();

  // Cache resolution vector
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);

  // Instantiate the custom shader material
  const material = useMemo(() => new CymaticMaterial(), []);

  useFrame((state) => {
    // 1. Get latest audio values
    audioEngine.update();

    // Register WebGL elements for snapshot utility
    registerWebGLContext(state.gl, state.scene, state.camera, composerRef.current);

    // 2. Fetch latest UI settings from Zustand store without triggering re-renders
    const settings = useAppStore.getState();

    // 3. Update audio engine configuration dynamically
    audioEngine.setFftSize(settings.fftSize);
    audioEngine.setDamping(settings.damping);
    audioEngine.setVolume(settings.gain);
    
    // In oscillator mode, ensure the engine parameters match the mixer/UI values
    if (audioEngine.inputMode === 'oscillator') {
      audioEngine.setOscillatorParams('A', settings.oscA.enabled, settings.oscA.frequency, settings.oscA.gain);
      audioEngine.setOscillatorParams('B', settings.oscB.enabled, settings.oscB.frequency, settings.oscB.gain);
      audioEngine.setOscillatorParams('C', settings.oscC.enabled, settings.oscC.frequency, settings.oscC.gain);
    }

    // 4. Update shader uniforms directly on the GPU
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uFrequency = audioEngine.frequency;
      materialRef.current.uAmplitude = audioEngine.amplitude;
      materialRef.current.uResolution.copy(resolution);
      materialRef.current.uSymmetry = settings.symmetry;
      materialRef.current.uThickness = settings.thickness;
      materialRef.current.uBrightness = settings.brightness;
      materialRef.current.uSpeed = settings.speed;

      const globalAmp = audioEngine.amplitude;
      if (audioEngine.inputMode === 'oscillator') {
        materialRef.current.uFreqA = settings.oscA.enabled ? settings.oscA.frequency : 0.0;
        materialRef.current.uFreqB = settings.oscB.enabled ? settings.oscB.frequency : 0.0;
        materialRef.current.uFreqC = settings.oscC.enabled ? settings.oscC.frequency : 0.0;

        materialRef.current.uAmpA = settings.oscA.enabled ? settings.oscA.gain * globalAmp : 0.0;
        materialRef.current.uAmpB = settings.oscB.enabled ? settings.oscB.gain * globalAmp : 0.0;
        materialRef.current.uAmpC = settings.oscC.enabled ? settings.oscC.gain * globalAmp : 0.0;
      } else {
        // Fallback for mic / file upload modes
        materialRef.current.uFreqA = audioEngine.frequency;
        materialRef.current.uAmpA = globalAmp;
        materialRef.current.uFreqB = 0.0;
        materialRef.current.uAmpB = 0.0;
        materialRef.current.uFreqC = 0.0;
        materialRef.current.uAmpC = 0.0;
      }

      // Map string mode to integer: mandala=0, chladni=1, ripple=2
      let modeInt = 1;
      if (settings.visualizationMode === 'mandala') modeInt = 0;
      else if (settings.visualizationMode === 'ripple') modeInt = 2;
      materialRef.current.uMode = modeInt;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      {/* 
        Using <primitive> with an instantiated material is the most robust, 
        type-safe way to use custom shaders in React 19 / R3F without 
        facing IntrinsicElements declaration issues.
      */}
      <primitive 
        object={material} 
        ref={materialRef} 
        attach="material" 
        transparent 
        depthWrite={false} 
      />
    </mesh>
  );
};

export const CymaticCanvas: React.FC = () => {
  const isMobile = useAppStore((state) => state.isMobile);
  const setIsMobile = useAppStore((state) => state.setIsMobile);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const composerRef = useRef<any>(null);

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [setIsMobile]);

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#020202]">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={isMobile ? 1.0 : [1, 1.5]}
        gl={{ 
          antialias: false, 
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: false,
          preserveDrawingBuffer: true,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <CymaticPlane composerRef={composerRef} />
        
        {/* Post-processing Bloom for glowing lines */}
        <EffectComposer ref={composerRef}>
          <Bloom 
            intensity={isMobile ? 0.45 : 0.8} 
            luminanceThreshold={0.55} 
            luminanceSmoothing={0.45} 
            mipmapBlur={!isMobile}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
