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
uniform float u3DActive;
uniform float uExaggeration;
uniform float uSmoothing;
uniform int uViewMode; // 0 = Solid, 1 = Wireframe, 2 = Points
uniform int uColorMode; // 0 = Neon, 1 = Metallic
uniform int uHeatMap; // 0 = Off, 1 = On
uniform vec3 uColorNode;
uniform vec3 uColorAccent;
uniform vec3 uColorPeak;
uniform float uColorContrast;

uniform int uInputMode;
uniform float uBassEnergy;
uniform float uMidEnergy;
uniform float uTrebleEnergy;

uniform int uPlateShape;
uniform float uPlateDamping;

uniform sampler2D uFluidTexture;
uniform float uFluidActive;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vIntensity;

#define PI 3.14159265359

// Fast pseudo-random generator for detail
float hash(float n) { return fract(sin(n) * 43758.5453123); }

// Wave generator helpers mapping type to waveform shape:
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

void main() {
  // Center coordinates to range -1.0 to 1.0
  vec2 st = vUv * 2.0 - 1.0;
  
  // Mix aspect ratio correction based on 3D mode activation
  float aspect = uResolution.x / uResolution.y;
  float currentAspect = mix(aspect, 1.0, u3DActive);
  st.x *= currentAspect;

  float actualD = getPlateDistance(st);

  // Discard pixels outside the plate shape boundary
  if (actualD > 1.0) {
    discard;
  }

  // Render a subtle 3D-shaded bezel/border at the edge of the shape
  float bezelWidth = 0.08;
  if (actualD > 1.0 - bezelWidth) {
    // Let's create a nice metallic frame/bezel color
    vec3 bezelColor = vec3(0.3, 0.32, 0.35); // base steel color
    
    // In metallic mode, make it extra shiny chrome/gold
    if (uColorMode == 1) {
      bezelColor = mix(uColorPeak * 1.5, vec3(0.8, 0.82, 0.85), 0.6);
    } else {
      bezelColor = mix(uColorAccent, vec3(0.5, 0.52, 0.55), 0.5);
    }
    
    // Add 3D lighting shading on the bezel
    vec3 viewDir = normalize(-vPosition);
    vec3 normalVec = vNormal;
    
    // In 2D mode, the normalVec near the edge slopes because of bezelHeight.
    // If not in 3D mode, we can fake a sloped normal for the bezel!
    if (u3DActive < 0.05) {
      // Fake a normal pointing outwards from the center
      vec2 n2 = normalize(st);
      // Slope the normal slightly up and outward
      normalVec = normalize(vec3(n2 * 0.5, 0.866));
    }
    
    // Simple diffuse and specular highlight on the bezel
    vec3 lightPos = vec3(0.0, 0.0, 1.2);
    vec3 pointLightDir = normalize(lightPos - vPosition);
    float pointDiffuse = max(0.0, dot(normalVec, pointLightDir));
    
    bezelColor = bezelColor * (0.3 + 0.7 * pointDiffuse);
    
    // Add a dark line at the inner edge of the bezel to separate it from the pattern
    float innerEdge = smoothstep(1.0 - bezelWidth, 1.0 - bezelWidth + 0.01, actualD);
    bezelColor *= mix(0.4, 1.0, innerEdge);
    
    // Fade to black right at the outer edge
    float outerFade = smoothstep(1.0, 0.98, actualD);
    bezelColor *= outerFade;
    
    gl_FragColor = vec4(bezelColor, 1.0);
    return;
  }

  // Check view modes (wireframe and points) for rendering inside the shape
  if (uViewMode == 1) {
    vec3 electricCyan = vec3(0.0, 0.9, 1.0);
    vec3 deepBlue = vec3(0.05, 0.2, 0.95);
    vec3 deepPurple = vec3(0.45, 0.05, 0.9);
    
    float r = length(st);
    vec3 wireColor = mix(electricCyan, deepBlue, smoothstep(0.2, 0.8, r));
    wireColor = mix(wireColor, deepPurple, vIntensity * 0.5 + 0.5);
    wireColor *= uBrightness;
    wireColor *= smoothstep(1.0, 0.15, r);
    
    gl_FragColor = vec4(wireColor, 0.9);
    return;
  }

  if (uViewMode == 2) {
    vec3 electricCyan = vec3(0.0, 0.9, 1.0);
    vec3 deepPurple = vec3(0.45, 0.05, 0.9);
    
    float r = length(st);
    vec3 starColor = mix(electricCyan, deepPurple, vIntensity * 0.5 + 0.5);
    starColor *= uBrightness;
    // Fade out at edges to merge into pitch black background
    starColor *= smoothstep(1.0, 0.1, r);
    gl_FragColor = vec4(starColor, 1.0);
    return;
  }

  // Apply boundary reflection (mirror fold at 0.82)
  float reflectBoundary = 0.82;
  vec2 waveSt = st;
  if (actualD > reflectBoundary) {
    float fold = 2.0 * reflectBoundary - actualD;
    waveSt = st * (fold / actualD);
  }

  float r = length(waveSt);
  float a = atan(waveSt.y, waveSt.x);

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
    float valA = getChladni(symSt, r, t, uFreqA, uAmpA, uPhaseA, uTypeA, uSmoothing);
    float valB = getChladni(symSt, r, t, uFreqB, uAmpB, uPhaseB, uTypeB, uSmoothing);
    float valC = getChladni(symSt, r, t, uFreqC, uAmpC, uPhaseC, uTypeC, uSmoothing);
    
    if (activeOscCount > 0.0) {
      val = (valA + valB + valC) / activeOscCount;
    } else {
      // Fallback to legacy single mode using legacy uniforms
      val = getChladni(symSt, r, t, uFrequency, uAmplitude, 0.0, 0, uSmoothing);
    }
  } else if (uMode == 0) {
    // Mode 0: Mandala Additive
    float valA = getMandala(symSt, r, t, uFreqA, uAmpA, symAngle, uSymmetry, uPhaseA, uTypeA, uSmoothing);
    float valB = getMandala(symSt, r, t, uFreqB, uAmpB, symAngle, uSymmetry, uPhaseB, uTypeB, uSmoothing);
    float valC = getMandala(symSt, r, t, uFreqC, uAmpC, symAngle, uSymmetry, uPhaseC, uTypeC, uSmoothing);
    
    if (activeOscCount > 0.0) {
      val = (valA + valB + valC) / activeOscCount;
    } else {
      val = getMandala(symSt, r, t, uFrequency, uAmplitude, symAngle, uSymmetry, 0.0, 0, uSmoothing);
    }
  } else {
    // Mode 2: Water Ripple Additive
    float valA = getRipple(r, t, uFreqA, uAmpA, symAngle, uSymmetry, uPhaseA, uTypeA, uSmoothing);
    float valB = getRipple(r, t, uFreqB, uAmpB, symAngle, uSymmetry, uPhaseB, uTypeB, uSmoothing);
    float valC = getRipple(r, t, uFreqC, uAmpC, symAngle, uSymmetry, uPhaseC, uTypeC, uSmoothing);
    
    if (activeOscCount > 0.0) {
      val = (valA + valB + valC) / activeOscCount;
    } else {
      val = getRipple(r, t, uFrequency, uAmplitude, symAngle, uSymmetry, 0.0, 0, uSmoothing);
    }
  }

  // Apply material damping spatial decay based on actual distance
  val *= exp(-uPlateDamping * actualD);

  // Apply plate shape mask (fade out before bezel starts at 0.9)
  float mask = clamp(1.0 - smoothstep(0.85, 0.92, actualD), 0.0, 1.0);
  val *= mask;

  // Sample fluid texture: V chemical is in the green channel
  float fluidVal = texture2D(uFluidTexture, vUv).g;
  float fluidDisplacement = (fluidVal * 2.0 - 1.0) * mask;
  
  // Blend procedural and fluid value
  val = mix(val, fluidDisplacement, uFluidActive);

  // Apply organic S-curve rounding to smooth the peaks and valleys
  val = smoothstep(0.0, 1.0, val * 0.5 + 0.5) * 2.0 - 1.0;

  // Clamp final displacement to prevent extreme jagged spikes
  val = clamp(val, -1.0, 1.0);

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

  vec3 color = vec3(0.0);

  // Calculate baseColor from the active color palette color ramp based on height intensity
  float hFactor = clamp(abs(vIntensity), 0.0, 1.0);
  hFactor = pow(hFactor, uColorContrast);

  vec3 baseColor = mix(
    mix(uColorNode, uColorAccent, smoothstep(0.0, 0.5, hFactor)),
    uColorPeak,
    smoothstep(0.4, 1.0, hFactor)
  );

  // Blend stroke, glow and apply global brightness control
  vec3 neonColor = (baseColor * stroke + baseColor * glow * 0.6) * uBrightness;

  // Add a subtle dark slate color for the plate surface in 3D mode to make valleys/depth visible
  vec3 plateBaseColor = uColorNode * (1.0 - stroke) * u3DActive;
  vec3 surfaceColor = neonColor + plateBaseColor;

  // Fade out at edges to merge into pitch black background
  surfaceColor *= smoothstep(1.0, 0.1, r);

  // Apply 3D lighting (diffuse and specular)
  if (u3DActive > 0.01) {
    vec3 viewDir = normalize(-vPosition);
    
    // Point light situated slightly above the plate
    vec3 lightPos = vec3(0.0, 0.0, 1.2);
    vec3 pointLightDir = normalize(lightPos - vPosition);
    float pointDist = length(lightPos - vPosition);
    float pointAtten = 1.0 / (1.0 + 0.3 * pointDist * pointDist);
    
    float pointDiffuse = max(0.0, dot(vNormal, pointLightDir)) * pointAtten;
    vec3 pointHalfDir = normalize(pointLightDir + viewDir);
    float pointSpecular = pow(max(0.0, dot(vNormal, pointHalfDir)), 64.0) * 0.9 * pointAtten;

    if (uColorMode == 1) { // METALLIC (Liquid Chrome)
      vec3 reflectDir = reflect(-viewDir, vNormal);
      float skyWeight = reflectDir.y * 0.5 + 0.5;
      vec3 skyColor = vec3(0.85, 0.9, 0.95);
      vec3 groundColor = vec3(0.12, 0.12, 0.15);
      vec3 chromeBase = mix(groundColor, skyColor, skyWeight);
      
      // Tint chromeBase using the intensity-based baseColor for custom metal reflection look
      chromeBase = mix(chromeBase * baseColor * 2.0, baseColor, 0.55);
      
      vec3 specLightDir1 = normalize(vec3(0.5, 0.8, 0.5));
      float envSpec1 = pow(max(0.0, dot(reflectDir, specLightDir1)), 16.0) * 0.5;
      vec3 specLightDir2 = normalize(vec3(-0.8, 0.4, 0.2));
      float envSpec2 = pow(max(0.0, dot(reflectDir, specLightDir2)), 32.0) * 0.3;
      
      // Add softbox specular reflections for the expensive "wet" studio chrome look
      float softbox = 0.0;
      softbox += smoothstep(0.06, 0.0, abs(reflectDir.x - 0.2)) * smoothstep(-0.4, 0.8, reflectDir.y) * 0.4;
      softbox += smoothstep(0.05, 0.0, abs(reflectDir.y - 0.5)) * smoothstep(-0.6, 0.6, reflectDir.x) * 0.3;
      float diag = abs(reflectDir.x + reflectDir.y - 0.2) * 0.707;
      softbox += smoothstep(0.04, 0.0, diag) * 0.3;
      
      vec3 finalChrome = chromeBase * (0.4 + 0.6 * pointDiffuse) + 
                         vec3(1.0) * (envSpec1 + envSpec2 + softbox) + 
                         vec3(0.95, 0.98, 1.0) * pointSpecular;
      
      // Fade out at edges to merge into pitch black background
      finalChrome *= smoothstep(1.0, 0.1, r);
      color = finalChrome;
    } else { // NEON
      vec3 litColor = surfaceColor * (0.2 + 0.8 * pointDiffuse) + vec3(1.0) * pointSpecular * uBrightness * max(0.1, activeAmp);
      color = mix(surfaceColor, litColor, u3DActive);
    }
  } else {
    if (uColorMode == 1) { // 2D Metallic fallback (just shiny flat chrome plate)
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 reflectDir = reflect(-viewDir, vNormal);
      float skyWeight = reflectDir.y * 0.5 + 0.5;
      vec3 skyColor = vec3(0.85, 0.9, 0.95);
      vec3 groundColor = vec3(0.12, 0.12, 0.15);
      vec3 chromeBase = mix(groundColor, skyColor, skyWeight);
      
      // Tint chromeBase using the intensity-based baseColor for custom metal reflection look
      chromeBase = mix(chromeBase * baseColor * 2.0, baseColor, 0.55);
      
      chromeBase *= smoothstep(1.0, 0.1, r);
      color = chromeBase;
    } else {
      color = surfaceColor;
    }
  }

  // Exposure Normalization: clamp to visible range to prevent solid white blobs
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
