import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';
import { useAppStore } from '../../store/useAppStore';
import { CymaticMaterial } from '../materials/CymaticMaterial';
import { isMobileDevice } from '../../utils/device';
import { registerWebGLContext } from '../../utils/export';
import { COLOR_PALETTES, hexToRgb } from '../palettes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CymaticPlane = ({ composerRef }: { composerRef: React.RefObject<any> }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);
  const { size } = useThree();

  // Cache resolution vector
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);

  // Instantiate the custom shader material
  const material = useMemo(() => new CymaticMaterial(), []);

  // Fetch visualizer settings from Zustand store
  const is3D = useAppStore((state) => state.is3D);
  const meshDetail = useAppStore((state) => state.meshDetail);
  const viewMode = useAppStore((state) => state.viewMode);

  const activePaletteId = useAppStore((state) => state.activePaletteId);
  const colorContrast = useAppStore((state) => state.colorContrast);

  // Look up and memoize colors for the active palette to maintain high performance
  const activePalette = useMemo(() => {
    return COLOR_PALETTES.find(p => p.id === activePaletteId) || COLOR_PALETTES[0];
  }, [activePaletteId]);

  const colorNodeVec = useMemo(() => hexToRgb(activePalette.node), [activePalette]);
  const colorAccentVec = useMemo(() => hexToRgb(activePalette.accent), [activePalette]);
  const colorPeakVec = useMemo(() => hexToRgb(activePalette.peak), [activePalette]);

  const u3DActiveRef = useRef(0);

  // Leaky Integrator Refs for Visual Inertia
  const uFreqARef = useRef(440.0);
  const uFreqBRef = useRef(0.0);
  const uFreqCRef = useRef(0.0);
  const uAmpARef = useRef(0.0);
  const uAmpBRef = useRef(0.0);
  const uAmpCRef = useRef(0.0);
  const uSymmetryRef = useRef(6.0);
  const uThicknessRef = useRef(0.02);
  const uBrightnessRef = useRef(1.0);
  const uExaggerationRef = useRef(0.3);

  // Sweeper interpolation & throttling refs
  const sweepFreqARef = useRef(440.0);
  const sweepFreqBRef = useRef(660.0);
  const sweepFreqCRef = useRef(880.0);
  const sweepDirectionRef = useRef(1);
  const lastSweepActiveRef = useRef(false);
  const lastStoreUpdateRef = useRef(0);

  // Reduced mesh density for high performance:
  // Low (default) = 128x128, Med = 256x256, High = 384x384
  const segments = useMemo(() => {
    if (meshDetail === 'low') return 128;
    if (meshDetail === 'high') return 384;
    return 256; // med
  }, [meshDetail]);

  // Explicit resource cleanup for geometry & material
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    const currentGeom = geomRef.current;
    return () => {
      if (currentGeom) {
        currentGeom.dispose();
      }
    };
  }, [segments]);

  useFrame((state, delta) => {
    // 1. Get latest audio values
    audioEngine.update();

    // Register WebGL elements for snapshot utility
    registerWebGLContext(state.gl, state.scene, state.camera, composerRef.current);

    // 2. Fetch latest UI settings from Zustand store without triggering re-renders
    const settings = useAppStore.getState();

    // Local Sweeper Calculation to prevent high-frequency Zustand store updates
    if (settings.sweepActive && audioEngine.inputMode === 'oscillator') {
      if (!lastSweepActiveRef.current) {
        sweepFreqARef.current = settings.oscA.frequency;
        sweepFreqBRef.current = settings.oscB.frequency;
        sweepFreqCRef.current = settings.oscC.frequency;
        sweepDirectionRef.current = settings.sweepDirection;
        lastSweepActiveRef.current = true;
      }

      let leadFreq = sweepFreqARef.current;
      if (settings.sweepTarget === 'B') leadFreq = sweepFreqBRef.current;
      else if (settings.sweepTarget === 'C') leadFreq = sweepFreqCRef.current;

      let nextF = leadFreq + sweepDirectionRef.current * settings.sweepSpeed * delta;
      let newDirection = sweepDirectionRef.current;

      if (nextF >= settings.sweepEnd) {
        if (settings.sweepMode === 'bounce') {
          nextF = settings.sweepEnd;
          newDirection = -1;
        } else {
          nextF = settings.sweepStart;
        }
      } else if (nextF <= settings.sweepStart) {
        if (settings.sweepMode === 'bounce') {
          nextF = settings.sweepStart;
          newDirection = 1;
        } else {
          nextF = settings.sweepEnd;
        }
      }

      const actualIncrement = nextF - leadFreq;
      sweepDirectionRef.current = newDirection;

      if (settings.sweepTarget === 'all') {
        if (settings.oscA.enabled) {
          sweepFreqARef.current = Math.max(20, Math.min(2000, sweepFreqARef.current + actualIncrement));
        }
        if (settings.oscB.enabled) {
          sweepFreqBRef.current = Math.max(20, Math.min(2000, sweepFreqBRef.current + actualIncrement));
        }
        if (settings.oscC.enabled) {
          sweepFreqCRef.current = Math.max(20, Math.min(2000, sweepFreqCRef.current + actualIncrement));
        }
      } else {
        const clampedF = Math.max(20, Math.min(2000, nextF));
        if (settings.sweepTarget === 'A') {
          sweepFreqARef.current = clampedF;
        } else if (settings.sweepTarget === 'B') {
          sweepFreqBRef.current = clampedF;
        } else if (settings.sweepTarget === 'C') {
          sweepFreqCRef.current = clampedF;
        }
      }

      // Throttled Zustand store update to prevent React render floods (every 150ms)
      const now = performance.now();
      if (now - lastStoreUpdateRef.current > 150) {
        useAppStore.getState().setSweepFrequencies({
          oscA: sweepFreqARef.current,
          oscB: sweepFreqBRef.current,
          oscC: sweepFreqCRef.current,
          sweepDirection: sweepDirectionRef.current
        });
        lastStoreUpdateRef.current = now;
      }
    } else {
      if (lastSweepActiveRef.current) {
        lastSweepActiveRef.current = false;
      }
      // Sync local sweeper refs with user mixer interactions
      sweepFreqARef.current = settings.oscA.frequency;
      sweepFreqBRef.current = settings.oscB.frequency;
      sweepFreqCRef.current = settings.oscC.frequency;
      sweepDirectionRef.current = settings.sweepDirection;
    }

    const freqA = settings.sweepActive ? sweepFreqARef.current : settings.oscA.frequency;
    const freqB = settings.sweepActive ? sweepFreqBRef.current : settings.oscB.frequency;
    const freqC = settings.sweepActive ? sweepFreqCRef.current : settings.oscC.frequency;

    // 3. Update audio engine configuration dynamically
    audioEngine.setFftSize(settings.fftSize);
    audioEngine.setDamping(settings.damping);
    audioEngine.setVolume(settings.gain);
    
    // In oscillator mode, ensure the engine parameters match the mixer/UI values
    if (audioEngine.inputMode === 'oscillator') {
      audioEngine.updateOscillator('A', settings.oscA.enabled, freqA, settings.oscA.gain, settings.oscA.type, settings.oscA.detune, settings.oscA.lfoEnabled, settings.oscA.lfoRate, state.clock.elapsedTime);
      audioEngine.updateOscillator('B', settings.oscB.enabled, freqB, settings.oscB.gain, settings.oscB.type, settings.oscB.detune, settings.oscB.lfoEnabled, settings.oscB.lfoRate, state.clock.elapsedTime);
      audioEngine.updateOscillator('C', settings.oscC.enabled, freqC, settings.oscC.gain, settings.oscC.type, settings.oscC.detune, settings.oscC.lfoEnabled, settings.oscC.lfoRate, state.clock.elapsedTime);
    }

    // Lerp u3DActive float uniform
    const target3D = is3D ? 1.0 : 0.0;
    u3DActiveRef.current = THREE.MathUtils.lerp(u3DActiveRef.current, target3D, 5 * delta);

    // Leaky Integrator Lerp Speed
    const lerpSpeed = Math.min(1.0, 6.0 * delta);

    // Lerp master settings
    uSymmetryRef.current = THREE.MathUtils.lerp(uSymmetryRef.current, settings.symmetry, lerpSpeed);
    uThicknessRef.current = THREE.MathUtils.lerp(uThicknessRef.current, settings.thickness, lerpSpeed);
    uBrightnessRef.current = THREE.MathUtils.lerp(uBrightnessRef.current, settings.brightness, lerpSpeed);
    uExaggerationRef.current = THREE.MathUtils.lerp(uExaggerationRef.current, settings.exaggeration, lerpSpeed);

    // 4. Update shader uniforms directly on the GPU
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uFrequency = audioEngine.frequency;
      materialRef.current.uAmplitude = audioEngine.amplitude;
      materialRef.current.uResolution.copy(resolution);
      materialRef.current.uSymmetry = uSymmetryRef.current;
      materialRef.current.uThickness = uThicknessRef.current;
      materialRef.current.uBrightness = uBrightnessRef.current;
      materialRef.current.uSpeed = settings.speed;

      // 3D parameters
      materialRef.current.u3DActive = u3DActiveRef.current;
      materialRef.current.uExaggeration = uExaggerationRef.current;
      materialRef.current.uSmoothing = settings.smoothing;
      materialRef.current.uViewMode = settings.viewMode === 'solid' ? 0 : (settings.viewMode === 'wireframe' ? 1 : 2);
      materialRef.current.uColorMode = settings.colorMode === 'neon' ? 0 : 1;
      materialRef.current.uHeatMap = settings.heatMap ? 1 : 0;
      materialRef.current.wireframe = settings.viewMode === 'wireframe';

      // Set color grading uniforms
      materialRef.current.uColorNode.copy(colorNodeVec);
      materialRef.current.uColorAccent.copy(colorAccentVec);
      materialRef.current.uColorPeak.copy(colorPeakVec);
      materialRef.current.uColorContrast = colorContrast;

      materialRef.current.uInputMode = settings.inputMode === 'oscillator' ? 0 : (settings.inputMode === 'microphone' ? 1 : 2);
      materialRef.current.uBassEnergy = audioEngine.bassEnergy;
      materialRef.current.uMidEnergy = audioEngine.midEnergy;
      materialRef.current.uTrebleEnergy = audioEngine.trebleEnergy;

      const globalAmp = audioEngine.amplitude;
      const typeMap = { sine: 0, square: 1, sawtooth: 2, triangle: 3 };

      if (audioEngine.inputMode === 'oscillator') {
        // Calculate detuned frequencies
        const detunedFreqA = freqA * Math.pow(2, settings.oscA.detune / 1200);
        const detunedFreqB = freqB * Math.pow(2, settings.oscB.detune / 1200);
        const detunedFreqC = freqC * Math.pow(2, settings.oscC.detune / 1200);

        const targetFreqA = settings.oscA.enabled ? detunedFreqA : 0.0;
        const targetFreqB = settings.oscB.enabled ? detunedFreqB : 0.0;
        const targetFreqC = settings.oscC.enabled ? detunedFreqC : 0.0;

        uFreqARef.current = THREE.MathUtils.lerp(uFreqARef.current, targetFreqA, lerpSpeed);
        uFreqBRef.current = THREE.MathUtils.lerp(uFreqBRef.current, targetFreqB, lerpSpeed);
        uFreqCRef.current = THREE.MathUtils.lerp(uFreqCRef.current, targetFreqC, lerpSpeed);

        materialRef.current.uFreqA = uFreqARef.current;
        materialRef.current.uFreqB = uFreqBRef.current;
        materialRef.current.uFreqC = uFreqCRef.current;

        // Calculate LFO modulated gains
        let gainA = settings.oscA.gain;
        if (settings.oscA.lfoEnabled) {
          gainA *= 0.5 + 0.5 * Math.sin(2 * Math.PI * settings.oscA.lfoRate * state.clock.elapsedTime);
        }
        let gainB = settings.oscB.gain;
        if (settings.oscB.lfoEnabled) {
          gainB *= 0.5 + 0.5 * Math.sin(2 * Math.PI * settings.oscB.lfoRate * state.clock.elapsedTime);
        }
        let gainC = settings.oscC.gain;
        if (settings.oscC.lfoEnabled) {
          gainC *= 0.5 + 0.5 * Math.sin(2 * Math.PI * settings.oscC.lfoRate * state.clock.elapsedTime);
        }

        const targetAmpA = settings.oscA.enabled ? gainA * globalAmp : 0.0;
        const targetAmpB = settings.oscB.enabled ? gainB * globalAmp : 0.0;
        const targetAmpC = settings.oscC.enabled ? gainC * globalAmp : 0.0;

        uAmpARef.current = THREE.MathUtils.lerp(uAmpARef.current, targetAmpA, lerpSpeed);
        uAmpBRef.current = THREE.MathUtils.lerp(uAmpBRef.current, targetAmpB, lerpSpeed);
        uAmpCRef.current = THREE.MathUtils.lerp(uAmpCRef.current, targetAmpC, lerpSpeed);

        materialRef.current.uAmpA = uAmpARef.current;
        materialRef.current.uAmpB = uAmpBRef.current;
        materialRef.current.uAmpC = uAmpCRef.current;

        // Set type and phase uniforms
        materialRef.current.uTypeA = typeMap[settings.oscA.type] ?? 0;
        materialRef.current.uTypeB = typeMap[settings.oscB.type] ?? 0;
        materialRef.current.uTypeC = typeMap[settings.oscC.type] ?? 0;

        materialRef.current.uPhaseA = settings.oscA.phase;
        materialRef.current.uPhaseB = settings.oscB.phase;
        materialRef.current.uPhaseC = settings.oscC.phase;
      } else {
        // Fallback for mic / file upload modes
        uFreqARef.current = THREE.MathUtils.lerp(uFreqARef.current, audioEngine.frequency, lerpSpeed);
        uAmpARef.current = THREE.MathUtils.lerp(uAmpARef.current, globalAmp, lerpSpeed);

        uFreqBRef.current = THREE.MathUtils.lerp(uFreqBRef.current, 0.0, lerpSpeed);
        uAmpBRef.current = THREE.MathUtils.lerp(uAmpBRef.current, 0.0, lerpSpeed);
        uFreqCRef.current = THREE.MathUtils.lerp(uFreqCRef.current, 0.0, lerpSpeed);
        uAmpCRef.current = THREE.MathUtils.lerp(uAmpCRef.current, 0.0, lerpSpeed);

        materialRef.current.uFreqA = uFreqARef.current;
        materialRef.current.uAmpA = uAmpARef.current;
        materialRef.current.uFreqB = uFreqBRef.current;
        materialRef.current.uAmpB = uAmpBRef.current;
        materialRef.current.uFreqC = uFreqCRef.current;
        materialRef.current.uAmpC = uAmpCRef.current;

        materialRef.current.uTypeA = 0;
        materialRef.current.uTypeB = 0;
        materialRef.current.uTypeC = 0;

        materialRef.current.uPhaseA = 0.0;
        materialRef.current.uPhaseB = 0.0;
        materialRef.current.uPhaseC = 0.0;
      }

      // Map string mode to integer: mandala=0, chladni=1, ripple=2
      let modeInt = 1;
      if (settings.visualizationMode === 'mandala') modeInt = 0;
      else if (settings.visualizationMode === 'ripple') modeInt = 2;
      materialRef.current.uMode = modeInt;
    }
  });

  const geometryElement = (
    <planeGeometry ref={geomRef} key={`plane-${meshDetail}`} args={[2, 2, segments, segments]} />
  );

  const materialElement = (
    <primitive 
      object={material} 
      ref={materialRef} 
      attach="material" 
      transparent 
      depthWrite={is3D}
      side={THREE.DoubleSide}
    />
  );

  if (viewMode === 'points') {
    return (
      <points>
        {geometryElement}
        {materialElement}
      </points>
    );
  }

  return (
    <mesh>
      {geometryElement}
      {materialElement}
    </mesh>
  );
};

// CameraController handles smooth camera transitions between 2D and 3D states,
// enabling OrbitControls only when the camera transition is complete.
const CameraController = ({ is3D }: { is3D: boolean }) => {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(0, 0, 2.0));
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cameraPreset = useAppStore((state) => state.cameraPreset);
  const setCameraPreset = useAppStore((state) => state.setCameraPreset);

  useEffect(() => {
    setTimeout(() => setIsTransitioning(true), 0);
    if (is3D) {
      // Perspective camera position: looking down at the plate from a 3D angle (Isometric)
      targetPos.current.set(0, -1.6, 1.6);
    } else {
      // Centered top-down 2D position
      targetPos.current.set(0, 0, 2.0);
    }
  }, [is3D]);

  useEffect(() => {
    if (cameraPreset) {
      setTimeout(() => setIsTransitioning(true), 0);
      if (cameraPreset === 'top') {
        targetPos.current.set(0, 0, 2.0);
      } else if (cameraPreset === 'isometric') {
        targetPos.current.set(0, -1.6, 1.6);
      } else if (cameraPreset === 'low') {
        // Dramatic low angle looking slightly up from the edge of the plate
        targetPos.current.set(0, -1.9, 0.4);
      }
      setCameraPreset(null);
    }
  }, [cameraPreset, setCameraPreset]);

  useFrame((_, delta) => {
    if (!is3D || isTransitioning) {
      // Lerp camera position smoothly
      camera.position.lerp(targetPos.current, 5 * delta);
      
      // Ensure camera's up direction is correct and look at the center of the plate
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);

      // Stop transition when close enough to destination
      if (camera.position.distanceTo(targetPos.current) < 0.01) {
        camera.position.copy(targetPos.current);
        setIsTransitioning(false);
        if (controlsRef.current && is3D) {
          // Sync OrbitControls target
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    }
  });

  return is3D && !isTransitioning ? (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.04}
      maxPolarAngle={Math.PI / 2.1} // Restrict camera from looking below the plate
      minDistance={1.0}
      maxDistance={4.0}
    />
  ) : null;
};

export const CymaticCanvas: React.FC = () => {
  const isMobile = useAppStore((state) => state.isMobile);
  const setIsMobile = useAppStore((state) => state.setIsMobile);
  const is3D = useAppStore((state) => state.is3D);
  const chromaticAberration = useAppStore((state) => state.chromaticAberration);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const composerRef = useRef<any>(null);

  useEffect(() => {
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
        camera={{ position: [0, 0, 2.0] }}
        dpr={isMobile ? 1.0 : [1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ 
          antialias: false, 
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true, // Must be true for 3D depth buffer sorting
          preserveDrawingBuffer: true,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <CameraController is3D={is3D} />
          
          {/* Ambient and Point lighting for 3D depth and chrome highlights */}
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 0, 1.2]} intensity={2.0} distance={5} />
          
          <CymaticPlane composerRef={composerRef} />
          
          {/* Post-processing Bloom for glowing lines & Cinematic effects */}
          <EffectComposer ref={composerRef}>
            <Bloom 
              intensity={isMobile ? 0.45 : 0.8} 
              luminanceThreshold={0.55} 
              luminanceSmoothing={0.45} 
              mipmapBlur={!isMobile}
            />
            <Vignette eskil={false} offset={0.6} darkness={0.6} />
            <Noise opacity={0.03} />
            <ChromaticAberration 
              offset={chromaticAberration ? new THREE.Vector2(0.0012, 0.0012) : new THREE.Vector2(0.0, 0.0)} 
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};
