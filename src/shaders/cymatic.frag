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

// Pro Visual Parameters
uniform float uThickness;
uniform float uBrightness;
uniform float uSpeed;
uniform int uMode; // 0 = Mandala, 1 = Chladni, 2 = Ripple

varying vec2 vUv;

#define PI 3.14159265359

// Fast pseudo-random generator for detail
float hash(float n) { return fract(sin(n) * 43758.5453123); }

// Helper function for Chladni component displacement
float getChladni(vec2 symSt, float r, float t, float freq, float amp) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float m = n * 1.618;
  float wave = sin(r * 12.0 - t * 2.5) * (0.04 + amp * 0.08);
  float x = symSt.x + wave;
  float y = symSt.y + wave;
  return cos(n * x * PI) * cos(m * y * PI) - cos(m * x * PI) * cos(n * y * PI);
}

// Helper function for Mandala component displacement
float getMandala(vec2 symSt, float r, float t, float freq, float amp, float symAngle, float symmetry) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float wave = cos(r * 8.0 - t * 1.5) * (0.03 + amp * 0.05);
  float rDistorted = r + wave;
  
  float rings = sin(rDistorted * n * PI - t);
  float spokes = cos(symAngle * symmetry);
  float val = rings * spokes;
  val += 0.4 * sin(rDistorted * n * 2.0 * PI) * cos(symAngle * symmetry * 2.0 - t);
  return val;
}

// Helper function for Ripple component displacement
float getRipple(float r, float t, float freq, float amp, float symAngle, float symmetry) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float angularDistortion = sin(symAngle * symmetry - t) * (0.1 + amp * 0.2);
  return sin((r + angularDistortion) * n * PI - t * 4.0);
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
    float valA = getChladni(symSt, r, t, uFreqA, uAmpA);
    float valB = getChladni(symSt, r, t, uFreqB, uAmpB);
    float valC = getChladni(symSt, r, t, uFreqC, uAmpC);
    
    float totalDisplacement = (valA * uAmpA) + (valB * uAmpB) + (valC * uAmpC);
    
    if (activeOscCount > 0.0) {
      float avgAmp = totalAmp / activeOscCount;
      // Normalization: divide total displacement by number of active oscillators
      // scaled by average amplitude to maintain consistent visual line thickness
      val = (totalDisplacement / activeOscCount) / max(0.001, avgAmp);
    } else {
      // Fallback to legacy single mode using legacy uniforms
      val = getChladni(symSt, r, t, uFrequency, uAmplitude);
    }
  } else if (uMode == 0) {
    // Mode 0: Mandala Additive
    float valA = getMandala(symSt, r, t, uFreqA, uAmpA, symAngle, uSymmetry);
    float valB = getMandala(symSt, r, t, uFreqB, uAmpB, symAngle, uSymmetry);
    float valC = getMandala(symSt, r, t, uFreqC, uAmpC, symAngle, uSymmetry);
    
    float totalDisplacement = (valA * uAmpA) + (valB * uAmpB) + (valC * uAmpC);
    
    if (activeOscCount > 0.0) {
      float avgAmp = totalAmp / activeOscCount;
      val = (totalDisplacement / activeOscCount) / max(0.001, avgAmp);
    } else {
      val = getMandala(symSt, r, t, uFrequency, uAmplitude, symAngle, uSymmetry);
    }
  } else {
    // Mode 2: Water Ripple Additive
    float valA = getRipple(r, t, uFreqA, uAmpA, symAngle, uSymmetry);
    float valB = getRipple(r, t, uFreqB, uAmpB, symAngle, uSymmetry);
    float valC = getRipple(r, t, uFreqC, uAmpC, symAngle, uSymmetry);
    
    float totalDisplacement = (valA * uAmpA) + (valB * uAmpB) + (valC * uAmpC);
    
    if (activeOscCount > 0.0) {
      float avgAmp = totalAmp / activeOscCount;
      val = (totalDisplacement / activeOscCount) / max(0.001, avgAmp);
    } else {
      val = getRipple(r, t, uFrequency, uAmplitude, symAngle, uSymmetry);
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
