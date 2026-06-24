/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import vertexShader from '../../shaders/cymatic.vert?raw';
import fragmentShader from '../../shaders/cymatic.frag?raw';

const CymaticMaterial = shaderMaterial(
  {
    uTime: 0,
    uFrequency: 440.0,
    uAmplitude: 0.0,
    uFreqA: 0.0,
    uFreqB: 0.0,
    uFreqC: 0.0,
    uAmpA: 0.0,
    uAmpB: 0.0,
    uAmpC: 0.0,
    uPhaseA: 0.0,
    uPhaseB: 0.0,
    uPhaseC: 0.0,
    uTypeA: 0,
    uTypeB: 0,
    uTypeC: 0,
    uSymmetry: 6.0,
    uResolution: new THREE.Vector2(),
    uThickness: 0.02,
    uBrightness: 1.0,
    uSpeed: 1.0,
    uMode: 1, // 0 = Mandala, 1 = Chladni, 2 = Ripple
  },
  vertexShader,
  fragmentShader
);

extend({ CymaticMaterial });

// Add types for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      cymaticMaterial: any;
    }
  }
}

export { CymaticMaterial };
