varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vIntensity;

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

// 3D Parameters
uniform float u3DActive; // 0.0 to 1.0 (interpolation)
uniform float uExaggeration;
uniform float uSmoothing;
uniform int uViewMode; // 0 = Solid, 1 = Wireframe, 2 = Points

uniform int uInputMode;
uniform float uBassEnergy;
uniform float uMidEnergy;
uniform float uTrebleEnergy;

uniform int uPlateShape;
uniform float uPlateDamping;

uniform sampler2D uFluidTexture;
uniform float uFluidActive;

#define PI 3.14159265359

// Fast pseudo-random generator
float hash(float n) { return fract(sin(n) * 43758.5453123); }

// Wave generator helper mapping type to waveform shape:
// 0 = Sine, 1 = Square, 2 = Sawtooth, 3 = Triangle
float getWave(float theta, int type, float smoothing) {
  float raw = sin(theta);
  if (type == 1) { // Square
    raw = sign(sin(theta));
  } else if (type == 2) { // Sawtooth
    raw = 2.0 * (theta / (2.0 * PI) - floor(0.5 + theta / (2.0 * PI)));
  } else if (type == 3) { // Triangle
    raw = 4.0 * abs(theta / (2.0 * PI) - floor(0.5 + theta / (2.0 * PI))) - 1.0;
  }
  return mix(raw, sin(theta), smoothing);
}

float getWaveCos(float theta, int type, float smoothing) {
  float raw = cos(theta);
  if (type == 1) { // Square
    raw = sign(cos(theta));
  } else if (type == 2) { // Sawtooth
    float thetaShifted = theta + PI * 0.5;
    raw = 2.0 * (thetaShifted / (2.0 * PI) - floor(0.5 + thetaShifted / (2.0 * PI)));
  } else if (type == 3) { // Triangle
    float thetaShifted = theta + PI * 0.5;
    raw = 4.0 * abs(thetaShifted / (2.0 * PI) - floor(0.5 + thetaShifted / (2.0 * PI))) - 1.0;
  }
  return mix(raw, cos(theta), smoothing);
}

// Helper function for Chladni component displacement
float getChladni(vec2 symSt, float r, float t, float freq, float amp, float phase, int type, float smoothing) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float m = n * 1.618;
  float phaseRad = phase * PI / 180.0;
  float wave = getWave(r * 12.0 - t * 2.5 + phaseRad, type, smoothing) * (0.04 + amp * 0.08);
  float x = symSt.x + wave;
  float y = symSt.y + wave;
  return getWaveCos(n * x * PI + phaseRad, type, smoothing) * getWaveCos(m * y * PI + phaseRad, type, smoothing)
       - getWaveCos(m * x * PI + phaseRad, type, smoothing) * getWaveCos(n * y * PI + phaseRad, type, smoothing);
}

// Helper function for Mandala component displacement
float getMandala(vec2 symSt, float r, float t, float freq, float amp, float symAngle, float symmetry, float phase, int type, float smoothing) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float phaseRad = phase * PI / 180.0;
  float wave = getWaveCos(r * 8.0 - t * 1.5 + phaseRad, type, smoothing) * (0.03 + amp * 0.05);
  float rDistorted = r + wave;
  
  float rings = getWave(rDistorted * n * PI - t + phaseRad, type, smoothing);
  float spokes = getWaveCos(symAngle * symmetry + phaseRad, type, smoothing);
  float val = rings * spokes;
  val += 0.4 * getWave(rDistorted * n * 2.0 * PI + phaseRad, type, smoothing) * getWaveCos(symAngle * symmetry * 2.0 - t + phaseRad, type, smoothing);
  return val;
}

// Helper function for Ripple component displacement
float getRipple(float r, float t, float freq, float amp, float symAngle, float symmetry, float phase, int type, float smoothing) {
  if (freq <= 0.0 || amp <= 0.0) return 0.0;
  float baseFreq = clamp(freq, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float phaseRad = phase * PI / 180.0;
  float angularDistortion = getWave(symAngle * symmetry - t + phaseRad, type, smoothing) * (0.1 + amp * 0.2);
  return getWave((r + angularDistortion) * n * PI - t * 4.0 + phaseRad, type, smoothing);
}

float getPlateDistance(vec2 p) {
  if (uPlateShape == 1) { // SQUARE
    return max(abs(p.x), abs(p.y));
  } else if (uPlateShape == 2) { // HEXAGON
    vec2 q = abs(p);
    return max(q.y, q.x * 0.8660254 + q.y * 0.5);
  } else if (uPlateShape == 3) { // TRIANGLE
    float ty = p.y + 0.25;
    return max(abs(p.x) * 1.7320508 + ty, -2.0 * ty);
  } else { // CIRCLE (0)
    return length(p);
  }
}

// Global function to retrieve the raw cymatic displacement at a given UV
float getCymaticValueRaw(vec2 uv) {
  // Center coordinates to range -1.0 to 1.0
  vec2 st = uv * 2.0 - 1.0;
  
  // Mix screen aspect ratio correction based on 3D mode activation
  float aspect = uResolution.x / uResolution.y;
  float currentAspect = mix(aspect, 1.0, u3DActive);
  st.x *= currentAspect;

  float actualD = getPlateDistance(st);

  // Boundary reflection (mirror fold at 0.82)
  float reflectBoundary = 0.82;
  if (actualD > reflectBoundary) {
    float fold = 2.0 * reflectBoundary - actualD;
    st = st * (fold / actualD);
  }

  float r = length(st);
  float a = atan(st.y, st.x);

  // Apply radial symmetry
  float sector = 2.0 * PI / uSymmetry;
  float symAngle = mod(a, sector);
  symAngle = abs(symAngle - sector * 0.5);
  vec2 symSt = vec2(cos(symAngle), sin(symAngle)) * r;

  float t = uTime * uSpeed;
  float val = 0.0;
  
  float activeOscCount = 0.0;
  float totalAmp = 0.0;
  if (uFreqA > 0.0 && uAmpA > 0.0) { activeOscCount += 1.0; totalAmp += uAmpA; }
  if (uFreqB > 0.0 && uAmpB > 0.0) { activeOscCount += 1.0; totalAmp += uAmpB; }
  if (uFreqC > 0.0 && uAmpC > 0.0) { activeOscCount += 1.0; totalAmp += uAmpC; }

  if (uMode == 1) {
    float valA = getChladni(symSt, r, t, uFreqA, uAmpA, uPhaseA, uTypeA, uSmoothing);
    float valB = getChladni(symSt, r, t, uFreqB, uAmpB, uPhaseB, uTypeB, uSmoothing);
    float valC = getChladni(symSt, r, t, uFreqC, uAmpC, uPhaseC, uTypeC, uSmoothing);
    
    if (activeOscCount > 0.0) {
      val = (valA + valB + valC) / activeOscCount;
    } else {
      val = getChladni(symSt, r, t, uFrequency, uAmplitude, 0.0, 0, uSmoothing);
    }
  } else if (uMode == 0) {
    float valA = getMandala(symSt, r, t, uFreqA, uAmpA, symAngle, uSymmetry, uPhaseA, uTypeA, uSmoothing);
    float valB = getMandala(symSt, r, t, uFreqB, uAmpB, symAngle, uSymmetry, uPhaseB, uTypeB, uSmoothing);
    float valC = getMandala(symSt, r, t, uFreqC, uAmpC, symAngle, uSymmetry, uPhaseC, uTypeC, uSmoothing);
    
    if (activeOscCount > 0.0) {
      val = (valA + valB + valC) / activeOscCount;
    } else {
      val = getMandala(symSt, r, t, uFrequency, uAmplitude, symAngle, uSymmetry, 0.0, 0, uSmoothing);
    }
  } else {
    float valA = getRipple(r, t, uFreqA, uAmpA, symAngle, uSymmetry, uPhaseA, uTypeA, uSmoothing);
    float valB = getRipple(r, t, uFreqB, uAmpB, symAngle, uSymmetry, uPhaseB, uTypeB, uSmoothing);
    float valC = getRipple(r, t, uFreqC, uAmpC, symAngle, uSymmetry, uPhaseC, uTypeC, uSmoothing);
    
    if (activeOscCount > 0.0) {
      val = (valA + valB + valC) / activeOscCount;
    } else {
      val = getRipple(r, t, uFrequency, uAmplitude, symAngle, uSymmetry, 0.0, 0, uSmoothing);
    }
  }

  if (uInputMode != 0) {
    float trebleDetail = getWaveCos(r * (25.0 + uTrebleEnergy * 35.0) - t * 6.0, 0, uSmoothing) * (0.02 + uTrebleEnergy * 0.08);
    val = val * (0.5 + uBassEnergy * 2.0) + trebleDetail * (0.3 + uMidEnergy * 1.7);
  }

  // Apply material damping spatial decay based on distance from center
  val *= exp(-uPlateDamping * actualD);

  // Apply plate shape mask (fade out before bezel starts at 0.9)
  float mask = clamp(1.0 - smoothstep(0.85, 0.92, actualD), 0.0, 1.0);
  val *= mask;

  // Apply organic S-curve rounding to smooth the peaks and valleys
  val = smoothstep(0.0, 1.0, val * 0.5 + 0.5) * 2.0 - 1.0;

  // Clamp final displacement to prevent extreme jagged spikes
  val = clamp(val, -1.0, 1.0);

  return val;
}

// Gaussian-weighted average sampling of neighboring coordinates
float getCymaticValueBlurred(vec2 uv) {
  float h = getCymaticValueRaw(uv);
  
  // Scale blur radius based on uSmoothing
  float blurRadius = uSmoothing * 0.006;
  if (blurRadius <= 0.0001) return h;
  
  // 4-point neighbor offsets (cross)
  float hN  = getCymaticValueRaw(uv + vec2(0.0, blurRadius));
  float hS  = getCymaticValueRaw(uv - vec2(0.0, blurRadius));
  float hE  = getCymaticValueRaw(uv + vec2(blurRadius, 0.0));
  float hW  = getCymaticValueRaw(uv - vec2(blurRadius, 0.0));
  
  // Weighted average: center (4.0), direct neighbors (2.0)
  float blurred = (h * 4.0 + (hN + hS + hE + hW) * 2.0) / 12.0;
  return blurred;
}

float getCymaticValue(vec2 uv) {
  float procedVal = getCymaticValueBlurred(uv);
  
  // Sample fluid texture: V chemical is in the green channel
  float fluidVal = texture2D(uFluidTexture, uv).g;
  
  // Normalize fluid concentration [0.0, 1.0] to displacement [-1.0, 1.0]
  float fluidDisplacement = fluidVal * 2.0 - 1.0;
  
  return mix(procedVal, fluidDisplacement, uFluidActive);
}

float getTotalHeight(vec2 uv) {
  // Center coordinates
  vec2 st = uv * 2.0 - 1.0;
  float aspect = uResolution.x / uResolution.y;
  float currentAspect = mix(aspect, 1.0, u3DActive);
  st.x *= currentAspect;
  
  float d = getPlateDistance(st);
  float intensity = getCymaticValue(uv);
  
  float bezelHeight = 0.0;
  if (d > 0.9 && d <= 1.0) {
    float t = (d - 0.9) / 0.1;
    bezelHeight = sin(t * PI) * 0.12;
  }
  
  // Outside shape has zero height
  if (d > 1.0) return 0.0;
  
  return intensity + bezelHeight;
}

void main() {
  vUv = uv;
  
  float intensity = getCymaticValue(uv);
  vIntensity = intensity;
  
  float totalH = getTotalHeight(uv);
  
  vec3 displacedPosition = position;
  vec3 normalVec = normal;
  
  if (u3DActive > 0.01) {
    // Apply total height (displacement + bezel) directly to Z coordinate of plane vertices
    displacedPosition.z += totalH * uExaggeration;
    
    // Calculate normal vector numerically including the bezel slope
    float eps = 0.005;
    float h = totalH;
    float hX = getTotalHeight(uv + vec2(eps, 0.0));
    float hY = getTotalHeight(uv + vec2(0.0, eps));
    
    vec3 tangent = vec3(2.0 * eps, 0.0, (hX - h) * uExaggeration);
    vec3 bitangent = vec3(0.0, 2.0 * eps, (hY - h) * uExaggeration);
    normalVec = normalize(cross(tangent, bitangent));
  }
  
  vNormal = normalize(normalMatrix * normalVec);
  
  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vPosition = mvPosition.xyz;
  
  // Transform output position:
  // position2D is NDC space covering the screen perfectly (ignoring camera settings)
  vec4 position2D = vec4(position.xy, 0.0, 1.0);
  vec4 position3D = projectionMatrix * mvPosition;
  
  gl_Position = mix(position2D, position3D, u3DActive);

  // Set point size if rendering in Points Mode
  if (uViewMode == 2) {
    gl_PointSize = mix(2.0, 5.0, intensity * 0.5 + 0.5);
  }
}
