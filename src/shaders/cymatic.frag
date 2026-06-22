uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uSymmetry;
uniform vec2 uResolution;

// Pro Visual Parameters
uniform float uThickness;
uniform float uBrightness;
uniform float uSpeed;
uniform int uMode; // 0 = Mandala, 1 = Chladni, 2 = Ripple

varying vec2 vUv;

#define PI 3.14159265359

// Fast pseudo-random generator for detail
float hash(float n) { return fract(sin(n) * 43758.5453123); }

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

  // Logarithmic frequency scale (normalizing typical range 20Hz-2000Hz)
  float baseFreq = clamp(uFrequency, 20.0, 2000.0);
  float n = 2.0 + log2(baseFreq / 20.0) * 1.5;
  float m = n * 1.618; // Golden ratio multiplier for complexity

  // Time scaled by speed
  float t = uTime * uSpeed;

  float val = 0.0;

  if (uMode == 1) {
    // Mode 1: Chladni-inspired
    // Coordinates distorted by dynamic wave action & amplitude
    float wave = sin(r * 12.0 - t * 2.5) * (0.04 + uAmplitude * 0.08);
    float x = symSt.x + wave;
    float y = symSt.y + wave;
    
    val = cos(n * x * PI) * cos(m * y * PI) - cos(m * x * PI) * cos(n * y * PI);
    
  } else if (uMode == 0) {
    // Mode 0: Mandala
    // Multiple overlapping rings and symmetry components
    float wave = cos(r * 8.0 - t * 1.5) * (0.03 + uAmplitude * 0.05);
    float rDistorted = r + wave;
    
    // Main ring system
    float rings = sin(rDistorted * n * PI - t);
    // Symmetry spokes
    float spokes = cos(symAngle * uSymmetry);
    // Combined
    val = rings * spokes;
    
    // Add harmonic detail (higher order rings)
    val += 0.4 * sin(rDistorted * n * 2.0 * PI) * cos(symAngle * uSymmetry * 2.0 - t);
    
  } else {
    // Mode 2: Water Ripple
    // concentric rings expanding outward, distorted by angle and amplitude
    float angularDistortion = sin(symAngle * uSymmetry - t) * (0.1 + uAmplitude * 0.2);
    val = sin((r + angularDistortion) * n * PI - t * 4.0);
  }

  // Calculate line thickness and glow based on amplitude
  // Let the userthickness parameter guide the base line width
  float baseThickness = uThickness * (1.0 - uAmplitude * 0.3);
  float glowWidth = baseThickness * 4.0 + uAmplitude * 0.15;
  
  float dist = abs(val);
  
  // High contrast crisp line using smoothstep
  float stroke = smoothstep(baseThickness + 0.005, baseThickness, dist);
  // Additive glow bleed representation
  float glow = exp(-dist * (4.0 / glowWidth));

  // Visual style: Dark background with gradient color mapping
  // Center is white/cyan, mid is cyan/electric blue, outer is deep purple/blue
  vec3 whiteCyan = vec3(0.85, 1.0, 1.0);
  vec3 electricCyan = vec3(0.0, 0.9, 1.0);
  vec3 deepBlue = vec3(0.05, 0.2, 0.95);
  vec3 deepPurple = vec3(0.45, 0.05, 0.9);

  // Gradient mapping based on radius r
  vec3 baseColor = mix(electricCyan, deepBlue, smoothstep(0.1, 0.5, r));
  baseColor = mix(baseColor, deepPurple, smoothstep(0.5, 0.9, r));
  // White hot center
  baseColor = mix(whiteCyan, baseColor, smoothstep(0.0, 0.2, r));

  // Blend stroke, glow and apply global brightness control
  vec3 color = (baseColor * stroke + baseColor * glow * 0.6) * uBrightness;

  // Fade out at edges to merge into pitch black background
  color *= smoothstep(1.0, 0.1, r);

  gl_FragColor = vec4(color, 1.0);
}
