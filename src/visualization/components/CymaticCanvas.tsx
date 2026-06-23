import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';
import { useAppStore } from '../../store/useAppStore';
import { CymaticMaterial } from '../materials/CymaticMaterial';
import { isMobileDevice } from '../../utils/device';

const CymaticPlane = () => {
  const materialRef = useRef<any>(null);
  const { size } = useThree();

  // Cache resolution vector
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);

  // Instantiate the custom shader material
  const material = useMemo(() => new CymaticMaterial(), []);

  useFrame((state) => {
    // 1. Get latest audio values
    audioEngine.update();

    // 2. Fetch latest UI settings from Zustand store without triggering re-renders
    const settings = useAppStore.getState();

    // 3. Update audio engine configuration dynamically
    audioEngine.setFftSize(settings.fftSize);
    audioEngine.setDamping(settings.damping);
    audioEngine.setVolume(settings.gain);
    
    // In oscillator mode, ensure the engine frequency matches the slider/UI value
    if (audioEngine.inputMode === 'oscillator') {
      audioEngine.setFrequency(settings.frequency);
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
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <CymaticPlane />
        
        {/* Post-processing Bloom for glowing lines */}
        <EffectComposer>
          <Bloom 
            intensity={isMobile ? 0.7 : 1.5} 
            luminanceThreshold={0.15} 
            luminanceSmoothing={0.9} 
            mipmapBlur={!isMobile}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
