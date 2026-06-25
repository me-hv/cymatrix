import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useFBO } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';
import { useAppStore } from '../../store/useAppStore';
import { CymaticMaterial } from '../materials/CymaticMaterial';
import { isMobileDevice } from '../../utils/device';
import { registerWebGLContext } from '../../utils/export';
import { COLOR_PALETTES, hexToRgb } from '../palettes';

const simFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uDeltaTime;
uniform float uTime;
uniform float uFeed;
uniform float uKill;
uniform float uViscosity;
uniform float uFluidity;
uniform float uGrowthRate;
uniform float uAudioEnergy;
uniform vec3 uMouse;
uniform vec2 uResolution;
uniform float uReset;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec2 texel = vec2(1.0) / uResolution;

  if (uReset > 0.5) {
    float u = 1.0;
    float v = 0.0;
    
    vec2 center = uv - 0.5;
    if (length(center) < 0.06) {
      v = 0.5 + 0.5 * rand(uv);
      u = 0.5;
    }
    
    if (rand(uv * 10.0) > 0.993) {
      v = 0.8;
      u = 0.2;
    }
    
    gl_FragColor = vec4(u, v, 0.0, 1.0);
    return;
  }

  vec4 val = texture2D(uTexture, uv);
  float u = val.r;
  float v = val.g;

  vec4 n  = texture2D(uTexture, uv + vec2(0.0,  texel.y));
  vec4 s  = texture2D(uTexture, uv + vec2(0.0, -texel.y));
  vec4 e  = texture2D(uTexture, uv + vec2( texel.x, 0.0));
  vec4 w  = texture2D(uTexture, uv + vec2(-texel.x, 0.0));
  
  vec4 nw = texture2D(uTexture, uv + vec2(-texel.x,  texel.y));
  vec4 ne = texture2D(uTexture, uv + vec2( texel.x,  texel.y));
  vec4 sw = texture2D(uTexture, uv + vec2(-texel.x, -texel.y));
  vec4 se = texture2D(uTexture, uv + vec2( texel.x, -texel.y));

  vec2 lap = vec2(0.0);
  lap.r = 0.2 * (n.r + s.r + e.r + w.r) + 0.05 * (nw.r + ne.r + sw.r + se.r) - u;
  lap.g = 0.2 * (n.g + s.g + e.g + w.g) + 0.05 * (nw.g + ne.g + sw.g + se.g) - v;

  float Du = 0.16 * uViscosity;
  float Dv = 0.08 * uViscosity;

  float feed = uFeed * uGrowthRate;
  float kill = uKill;

  if (uFluidity > 0.01 && uAudioEnergy > 0.0) {
    float noise = rand(uv + uTime * 0.1) - 0.5;
    vec2 offset = vec2(noise, rand(uv + uTime * 0.2) - 0.5) * texel * uAudioEnergy * uFluidity * 3.0;
    vec4 perturbed = texture2D(uTexture, uv + offset);
    u = mix(u, perturbed.r, 0.1);
    v = mix(v, perturbed.g, 0.1);
  }

  float reaction = u * v * v;
  float dt = min(uDeltaTime * 15.0, 1.2);
  
  float nextU = u + (Du * lap.r - reaction + feed * (1.0 - u)) * dt;
  float nextV = v + (Dv * lap.g + reaction - (feed + kill) * v) * dt;

  nextU = clamp(nextU, 0.0, 1.0);
  nextV = clamp(nextV, 0.0, 1.0);

  if (uMouse.z > 0.5) {
    float dist = distance(uv, uMouse.xy);
    if (dist < 0.025) {
      float strength = (1.0 - smoothstep(0.0, 0.025, dist)) * 0.85;
      nextV = clamp(nextV + strength, 0.0, 1.0);
      nextU = clamp(nextU - strength, 0.0, 1.0);
    }
  }

  gl_FragColor = vec4(nextU, nextV, 0.0, 1.0);
}
`;

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

  // Setup FBO Ping-Pong buffers
  const fboA = useFBO(512, 512, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  const fboB = useFBO(512, 512, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  // Create offscreen scene and camera for simulation
  const simScene = useMemo(() => new THREE.Scene(), []);
  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  const simMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: simFragmentShader,
      uniforms: {
        uTexture: { value: null },
        uDeltaTime: { value: 0.016 },
        uTime: { value: 0 },
        uFeed: { value: 0.055 },
        uKill: { value: 0.062 },
        uViscosity: { value: 1.0 },
        uFluidity: { value: 0.5 },
        uGrowthRate: { value: 1.0 },
        uAudioEnergy: { value: 0.0 },
        uMouse: { value: new THREE.Vector3(0.5, 0.5, 0) },
        uResolution: { value: new THREE.Vector2(512, 512) },
        uReset: { value: 1.0 },
      },
      depthWrite: false,
      depthTest: false,
    });
  }, []);

  const simMaterialRef = useRef(simMaterial);

  const simMesh = useMemo(() => {
    const geom = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geom, simMaterial);
    simScene.add(mesh);
    return mesh;
  }, [simScene, simMaterial]);

  // Clean up FBO simulation resources
  useEffect(() => {
    return () => {
      simScene.clear();
      simMesh.geometry.dispose();
      simMaterial.dispose();
    };
  }, [simScene, simMesh, simMaterial]);

  const frameCountRef = useRef(0);
  const uFluidActiveRef = useRef(0.0);
  const lastModeRef = useRef('');
  const resetTicksRef = useRef(0);
  const mousePosRef = useRef(new THREE.Vector3(0.5, 0.5, 0.0));

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

    // --- Reaction-Diffusion Offscreen Simulation Pass ---
    let resetVal = 0.0;
    if (settings.visualizationMode === 'fluid') {
      if (lastModeRef.current !== 'fluid') {
        resetTicksRef.current = 5; // Reset for 5 frames to clear FBO and seed
        lastModeRef.current = 'fluid';
      }
      if (resetTicksRef.current > 0) {
        resetVal = 1.0;
        resetTicksRef.current--;
      }
    } else {
      lastModeRef.current = settings.visualizationMode;
    }

    const readBuffer = frameCountRef.current % 2 === 0 ? fboA : fboB;
    const writeBuffer = frameCountRef.current % 2 === 0 ? fboB : fboA;

    // Decay mouse hover Z value
    mousePosRef.current.z = THREE.MathUtils.lerp(mousePosRef.current.z, 0.0, 5 * delta);

    // Update FBO sim uniforms
    simMaterialRef.current.uniforms.uTexture.value = readBuffer.texture;
    simMaterialRef.current.uniforms.uDeltaTime.value = Math.min(delta, 0.03);
    simMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    simMaterialRef.current.uniforms.uViscosity.value = settings.fluidViscosity;
    simMaterialRef.current.uniforms.uFluidity.value = settings.fluidity;
    simMaterialRef.current.uniforms.uGrowthRate.value = settings.fluidGrowthRate;
    simMaterialRef.current.uniforms.uAudioEnergy.value = audioEngine.amplitude;
    simMaterialRef.current.uniforms.uMouse.value.copy(mousePosRef.current);
    simMaterialRef.current.uniforms.uReset.value = resetVal;

    // Map frequencies/amplitude to feed/kill rates
    const domFreq = settings.inputMode === 'oscillator' 
      ? (settings.oscA.enabled ? settings.oscA.frequency : 440) 
      : audioEngine.frequency;
    const domAmp = settings.inputMode === 'oscillator'
      ? (settings.oscA.enabled ? settings.oscA.gain : 0.5)
      : audioEngine.amplitude;

    // Feed F [0.012, 0.07]
    const feed = 0.015 + (Math.log2(THREE.MathUtils.clamp(domFreq, 100, 2000) / 100.0) / Math.log2(20)) * 0.045;
    simMaterialRef.current.uniforms.uFeed.value = THREE.MathUtils.clamp(feed, 0.012, 0.07);

    // Kill K [0.045, 0.07]
    const kill = 0.052 + domAmp * 0.014;
    simMaterialRef.current.uniforms.uKill.value = THREE.MathUtils.clamp(kill, 0.045, 0.07);

    // Render offscreen pass
    state.gl.setRenderTarget(writeBuffer);
    state.gl.render(simScene, simCamera);
    state.gl.setRenderTarget(null);

    // Smoothly lerp uFluidActive uniform
    const targetFluidActive = settings.visualizationMode === 'fluid' ? 1.0 : 0.0;
    uFluidActiveRef.current = THREE.MathUtils.lerp(uFluidActiveRef.current, targetFluidActive, 5 * delta);

    frameCountRef.current++;

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

      // Plate settings
      const shapeMap = { circle: 0, square: 1, hexagon: 2, triangle: 3 };
      materialRef.current.uPlateShape = shapeMap[settings.plateShape] ?? 0;
      materialRef.current.uPlateDamping = settings.plateDamping;

      // Fluid Simulation FBO uniform assignment
      materialRef.current.uFluidTexture = writeBuffer.texture;
      materialRef.current.uFluidActive = uFluidActiveRef.current;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerMove = (e: any) => {
    if (e.uv) {
      mousePosRef.current.set(e.uv.x, e.uv.y, 1.0);
    }
  };

  if (viewMode === 'points') {
    return (
      <points
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        {geometryElement}
        {materialElement}
      </points>
    );
  }

  return (
    <mesh
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
    >
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
  const cameraZoom = useAppStore((state) => state.cameraZoom);

  const lastZoomRef = useRef(cameraZoom);
  const zoomTransitionActiveRef = useRef(false);

  useEffect(() => {
    if (cameraZoom !== lastZoomRef.current) {
      zoomTransitionActiveRef.current = true;
      lastZoomRef.current = cameraZoom;
    }
  }, [cameraZoom]);

  useEffect(() => {
    setTimeout(() => setIsTransitioning(true), 0);
    const targetDistance = (is3D ? 2.2627 : 2.0) / cameraZoom;
    if (is3D) {
      targetPos.current.set(0, -1.6, 1.6).setLength(targetDistance);
    } else {
      targetPos.current.set(0, 0, targetDistance);
    }
  }, [is3D, cameraZoom]);

  useEffect(() => {
    if (cameraPreset) {
      setTimeout(() => setIsTransitioning(true), 0);
      const targetDistance = (is3D ? 2.2627 : 2.0) / cameraZoom;
      if (cameraPreset === 'top') {
        targetPos.current.set(0, 0, 2.0 / cameraZoom);
      } else if (cameraPreset === 'isometric') {
        targetPos.current.set(0, -1.6, 1.6).setLength(targetDistance);
      } else if (cameraPreset === 'low') {
        targetPos.current.set(0, -1.9, 0.4).setLength(targetDistance);
      }
      setCameraPreset(null);
    }
  }, [cameraPreset, setCameraPreset, is3D, cameraZoom]);

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
    } else {
      // If we are in 3D and OrbitControls is active, but the user moved the Zoom slider:
      if (zoomTransitionActiveRef.current) {
        const targetDistance = 2.2627 / cameraZoom;
        const offset = new THREE.Vector3().copy(camera.position); // Target is (0,0,0)
        const currentDistance = offset.length();
        if (Math.abs(currentDistance - targetDistance) < 0.01) {
          zoomTransitionActiveRef.current = false;
        } else {
          const newDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, 10 * delta);
          offset.setLength(newDistance);
          camera.position.copy(offset);
          if (controlsRef.current) {
            controlsRef.current.update();
          }
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

  const isRecording = useAppStore((state) => state.isRecording);
  const recordingAspect = useAppStore((state) => state.recordingAspect);

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

      {/* Recording Aspect Ratio Mask Overlay */}
      {isRecording && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
          {recordingAspect === '9:16' && (
            <div className="h-full aspect-[9/16] max-w-full relative border-x border-dashed border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)] flex items-center justify-center">
              {/* Outer Masks */}
              <div className="absolute top-0 bottom-0 right-full w-screen bg-black/60 backdrop-blur-[1px] border-r border-zinc-800/40" />
              <div className="absolute top-0 bottom-0 left-full w-screen bg-black/60 backdrop-blur-[1px] border-l border-zinc-800/40" />
              {/* Recording studio corner markers */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-500/40" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-500/40" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-500/40" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-500/40" />
            </div>
          )}
          {recordingAspect === '1:1' && (
            <div className="max-h-full max-w-full aspect-square w-[100vh] h-[100vw] relative border border-dashed border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)] flex items-center justify-center">
              {/* Outer Masks */}
              <div className="absolute top-0 bottom-0 right-full w-screen bg-black/60 backdrop-blur-[1px] border-r border-zinc-800/40" />
              <div className="absolute top-0 bottom-0 left-full w-screen bg-black/60 backdrop-blur-[1px] border-l border-zinc-800/40" />
              <div className="absolute left-0 right-0 bottom-full h-screen bg-black/60 backdrop-blur-[1px] border-b border-zinc-800/40" />
              <div className="absolute left-0 right-0 top-full h-screen bg-black/60 backdrop-blur-[1px] border-t border-zinc-800/40" />
              {/* Recording studio corner markers */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-500/40" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-500/40" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-500/40" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-500/40" />
            </div>
          )}
          {recordingAspect === '16:9' && (
            <div className="max-h-full max-w-full aspect-[16/9] w-[100vw] h-[100vh] relative border border-dashed border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
              {/* Outer Masks */}
              <div className="absolute top-0 bottom-0 right-full w-screen bg-black/60 backdrop-blur-[1px] border-r border-zinc-800/40" />
              <div className="absolute top-0 bottom-0 left-full w-screen bg-black/60 backdrop-blur-[1px] border-l border-zinc-800/40" />
              <div className="absolute left-0 right-0 bottom-full h-screen bg-black/60 backdrop-blur-[1px] border-b border-zinc-800/40" />
              <div className="absolute left-0 right-0 top-full h-screen bg-black/60 backdrop-blur-[1px] border-t border-zinc-800/40" />
              {/* Recording studio corner markers */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-500/30" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-500/30" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-500/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-500/30" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
