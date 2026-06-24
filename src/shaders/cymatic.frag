uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uSymmetry;
uniform vec2 uResolution;

// Polyphonic Oscillator Uniforms
uniform float uFreqA;
uniform float uFreqB;
uniform float uFreqC;
uniform float uAmpA;
uniform float uAmpB;
uniform float uAmpC;
uniform float uPhaseA;
uniform float uPhaseB;
uniform float uPhaseC;
uniform int uTypeA;
uniform int uTypeB;
uniform int uTypeC;

// Pro Visual Parameters
uniform float uThickness;
uniform float uBrightness;
uniform float uSpeed;
uniform int uMode; // 0 = Mandala, 1 = Chladni, 2 = Ripple

varying vec2 vUv;

#define PI 3.14159265359

// Fast pseudo-random generator for detail
float hash(float n) { return fract(sin(n) * 43758.5453123); }

// Wave generator helpers mapping type to waveform shape:
// 0 = Sine, 1 = Square, 2 = Sawtooth, 3 = Triangle
float getWave(float theta, int type) {
  if (type == 1) { // Square
    return sign(sin(theta));
  } else if (type == 2) { // Sawtooth
    return 2.0 * (theta / (2.0 * PI) - floor(0.5 + theta / (2.0 * PI)));
  } else if (type == 3) { // Triangle
    return 4.0 * abs(theta / (2.0 * PI) - floor(0.5 + theta / (2.0 * PI))) - 1.0;
  }
  return sin(theta); // Sine (0)
}

float getWaveCos(float theta, int type) {
  if (type == 1) { // Square
    return sign(cos(theta));
  } else if (type == 2) { // Sawtooth
    float thetaShifted = theta + PI * 0.5;
    return 2.0 * (thetaShifted / (2.0 * PI) - floor(0.5 + thetaShifted / (2.0 * PI)));
  } else if (type == 3) { // Triangle
    float thetaShifted = theta + PI * 0.5;
    return 4.0 * abs(thetaShifted / (2.0 * PI) - floor(0.5 + thetaShifted / (2.0 * PI))) - 1.0;
  }
  return cos(theta); // Sine (0)
}

// Helper function for Chladni component displacement
float getChladni(vec2 symSt, float r, float t, float freq, float amp, float phase, int type) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float m = n * 1.618;
  float phaseRad = phase * PI / 180.0;
  float wave = getWave(r * 12.0 - t * 2.5 + phaseRad, type) * (0.04 + amp * 0.08);
  float x = symSt.x + wave;
  float y = symSt.y + wave;
  return getWaveCos(n * x * PI + phaseRad, type) * getWaveCos(m * y * PI + phaseRad, type)
       - getWaveCos(m * x * PI + phaseRad, type) * getWaveCos(n * y * PI + phaseRad, type);
}

// Helper function for Mandala component displacement
float getMandala(vec2 symSt, float r, float t, float freq, float amp, float symAngle, float symmetry, float phase, int type) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float phaseRad = phase * PI / 180.0;
  float wave = getWaveCos(r * 8.0 - t * 1.5 + phaseRad, type) * (0.03 + amp * 0.05);
  float rDistorted = r + wave;
  
  float rings = getWave(rDistorted * n * PI - t + phaseRad, type);
  float spokes = getWaveCos(symAngle * symmetry + phaseRad, type);
  float val = rings * spokes;
  val += 0.4 * getWave(rDistorted * n * 2.0 * PI + phaseRad, type) * getWaveCos(symAngle * symmetry * 2.0 - t + phaseRad, type);
  return val;
}

// Helper function for Ripple component displacement
float getRipple(float r, float t, float freq, float amp, float symAngle, float symmetry, float phase, int type) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float phaseRad = phase * PI / 180.0;
  float angularDistortion = getWave(symAngle * symmetry - t + phaseRad, type) * (0.1 + amp * 0.2);
  return getWave((r + angularDistortion) * n * PI - t * 4.0 + phaseRad, type);
}

void main() {
  // Center coordinates to range -1.0 to 1.0
  vec2 st = vUv * 2.0 - 1.0;
  
  // Adjust aspect ratio so circles remain circular
  st.x *= uResolution.x / uResolution.y;

  float r = length(st);
  float a = atan(st.y, st.x);

  // Apply radial symmetry (Mandala reflection)
  float sector = 2.0 * PI / uSymmetry;
  float symAngle = mod(a, sector);
  symAngle = abs(symAngle - sector * 0.5);
  vec2 symSt = vec2(cos(symAngle), sin(symAngle)) * r;

  // Time scaled by speed
  float t = uTime * uSpeed;

  float val = 0.0;
  
  // Count active oscillators and compute total amplitude
  float activeOscCount = 0.0;
  float totalAmp = 0.0;
  if (uFreqA > 0.0 && uAmpA > 0.0) { activeOscCount += 1.0; totalAmp += uAmpA; }
  if (uFreqB > 0.0 && uAmpB > 0.0) { activeOscCount += 1.0; totalAmp += uAmpB; }
  if (uFreqC > 0.0 && uAmpC > 0.0) { activeOscCount += 1.0; totalAmp += uAmpC; }

  if (uMode == 1) {
    // Mode 1: Chladni-inspired Additive
    float valA = getChladni(symSt, r, t, uFreqA, uAmpA, uPhaseA, uTypeA);
    float valB = getChladni(symSt, r, t, uFreqB, uAmpB, uPhaseB, uTypeB);
    float valC = getChladni(symSt, r, t, uFreqC, uAmpC, uPhaseC, uTypeC);
    
    float totalDisplacement = (valA * uAmpA) + (valB * uAmpB) + (valC * uAmpC);
    
    if (activeOscCount > 0.0) {
      float avgAmp = totalAmp / activeOscCount;
      // Normalization: divide total displacement by number of active oscillators
      // scaled by average amplitude to maintain consistent visual line thickness
      val = (totalDisplacement / activeOscCount) / max(0.001, avgAmp);
    } else {
      // Fallback to legacy single mode using legacy uniforms
      val = getChladni(symSt, r, t, uFrequency, uAmplitude, 0.0, 0);
    }
  } else if (uMode == 0) {
    // Mode 0: Mandala Additive
    float valA = getMandala(symSt, r, t, uFreqA, uAmpA, symAngle, uSymmetry, uPhaseA, uTypeA);
    float valB = getMandala(symSt, r, t, uFreqB, uAmpB, symAngle, uSymmetry, uPhaseB, uTypeB);
    float valC = getMandala(symSt, r, t, uFreqC, uAmpC, symAngle, uSymmetry, uPhaseC, uTypeC);
    
    float totalDisplacement = (valA * uAmpA) + (valB * uAmpB) + (valC * uAmpC);
    
    if (activeOscCount > 0.0) {
      float avgAmp = totalAmp / activeOscCount;
      val = (totalDisplacement / activeOscCount) / max(0.001, avgAmp);
    } else {
      val = getMandala(symSt, r, t, uFrequency, uAmplitude, symAngle, uSymmetry, 0.0, 0);
    }
  } else {
    // Mode 2: Water Ripple Additive
    float valA = getRipple(r, t, uFreqA, uAmpA, symAngle, uSymmetry, uPhaseA, uTypeA);
    float valB = getRipple(r, t, uFreqB, uAmpB, symAngle, uSymmetry, uPhaseB, uTypeB);
    float valC = getRipple(r, t, uFreqC, uAmpC, symAngle, uSymmetry, uPhaseC, uTypeC);
    
    float totalDisplacement = (valA * uAmpA) + (valB * uAmpB) + (valC * uAmpC);
    
    if (activeOscCount > 0.0) {
      float avgAmp = totalAmp / activeOscCount;
      val = (totalDisplacement / activeOscCount) / max(0.001, avgAmp);
    } else {
      val = getRipple(r, t, uFrequency, uAmplitude, symAngle, uSymmetry, 0.0, 0);
    }
  }

  // Calculate line thickness and glow based on maximum active amplitude
  float activeAmp = max(max(uAmpA, uAmpB), uAmpC);
  if (activeOscCount <= 0.0) {
    activeAmp = uAmplitude;
  }
  
  float baseThickness = uThickness * (1.0 - activeAmp * 0.3);
  float glowWidth = baseThickness * 4.0 + activeAmp * 0.15;
  
  float dist = abs(val);
  
  // High contrast crisp line using smoothstep
  float stroke = smoothstep(baseThickness + 0.005, baseThickness, dist);
  // Additive glow bleed representation (tightened from 4.0 to 8.0 for edge highlighting)
  float glow = exp(-dist * (8.0 / glowWidth));

  // Visual style: Dark background with gradient color mapping
  vec3 whiteCyan = vec3(0.85, 1.0, 1.0);
  vec3 electricCyan = vec3(0.0, 0.9, 1.0);
  vec3 deepBlue = vec3(0.05, 0.2, 0.95);
  vec3 deepPurple = vec3(0.45, 0.05, 0.9);

  // Gradient mapping based on radius r
  vec3 baseColor = mix(electricCyan, deepBlue, smoothstep(0.1, 0.5, r));
  baseColor = mix(baseColor, deepPurple, smoothstep(0.5, 0.9, r));
  baseColor = mix(whiteCyan, baseColor, smoothstep(0.0, 0.2, r));

  // Blend stroke, glow and apply global brightness control
  vec3 color = (baseColor * stroke + baseColor * glow * 0.6) * uBrightness;

  // Fade out at edges to merge into pitch black background
  color *= smoothstep(1.0, 0.1, r);

  gl_FragColor = vec4(color, 1.0);
}
