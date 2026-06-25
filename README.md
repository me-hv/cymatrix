# 🌌 Cymatrix: Real-Time Polyphonic Cymatics Visualizer

**Cymatrix** is a high-performance, GPU-accelerated web application that visualizes sound frequencies as stunning, physics-inspired cymatic patterns, Chladni figures, and organic fluid dynamics. 

Built with **React, TypeScript, Three.js (React Three Fiber), and custom WebGL GLSL shaders**, it translates live microphone inputs, uploaded audio files, or a complex multi-oscillator synthesizer into beautiful, symmetrical geometries and morphing chemical feedback loops in real time.

---

## 🚀 Core Features

### 1. Polyphonic Synthesis & Audio Mixer
* **Three Independent Oscillators**: Configure up to three separate oscillators (OSC A, OSC B, OSC C) concurrently.
* **Complex Wave Interference**: The WebGL fragment shader calculates additive coordinate displacement for all active frequencies, producing complex, evolving geometric interference nodes and wave beats.
* **Harmonic Interval Presets**: Quick options to set mathematical chord ratios relative to OSC A's pitch (Perfect Fifth, Major Third, Octave).
* **Automatic Frequency Sweeper**: Automates sweeping frequencies over a custom range at adjustable speeds with loop or bounce modes.

### 2. External Audio Module & FFT Engine
* **Multiple Input Sources**: Instantly switch between the internal **Mixer**, a live **Microphone** input, or an uploaded **MP3 File**.
* **Live FFT Analysis**: Performs real-time Fourier analysis to partition audio into **Bass, Mids, and Treble** energy bands.
* **Sound-to-Visual Mapping**: Different frequency bands dynamically drive pattern density, line glow, fluid turbulence, and 3D displacement.

### 3. Plate Geometry & SDF Boundary Physics
* **Geometric Surface Shapes**: Select between **Circle**, **Square**, **Hexagon**, or **Equilateral Triangle** plates.
* **Signed Distance Fields (SDFs)**: Implements precise SDF mathematical cropping to enforce hard-clipping borders.
* **Boundary Reflection Folding**: Folds coordinates as they approach boundaries to mimic standing waves reflecting off plate edges.
* **Raised 3D Bezel Framing**: Calculates bezel height profiles to render a raised metallic border rim around the active shape.
* **Material Damping Presets**: Presets representing physical plate damping (**Steel**, **Brass**, **Rubber**) with adjustable decay coefficients.

### 4. Fluid Physics Mode (Reaction-Diffusion)
* **Ping-Pong FBO Render Pipeline**: Employs two Frame Buffer Objects (`useFBO`) to feedback the previous frame's chemical state into the next, allowing patterns to evolve biologically.
* **Gray-Scott Compute Simulation**: Solves the Reaction-Diffusion equations for two virtual chemicals ($U$ and $V$):
  * $\partial U/\partial t = D_u \nabla^2 U - UV^2 + F(1-U)$
  * $\partial V/\partial t = D_v \nabla^2 V + UV^2 - (F+K)V$
* **Audio-to-Chemical Morphogenesis**: Frequencies map to Feed rate ($F$) and amplitude maps to Kill rate ($K$), forming spots, stripes, or moving worms dynamically.
* **Interactive Mouse Stirring**: Dragging your cursor across the canvas injects chemicals, mimicking drops of ink dispersing in water.

### 5. Professional Cinematic Color Grading
* **Intensity-Based Gradient Mapping**: Maps displacement height values to color ramps rather than simple solid colors.
* **Palette Presets Library**: Select between curated presets:
  * `NEON`: High-intensity cyan, blue, and violet.
  * `GOLD`: Sleek liquid gold, bronze, and obsidian steel.
  * `SEA`: Luminous aquamarine, deep blue, and emerald accents.
  * `THERMAL`: Infrared heat signature mapping.
  * `MONO`: Minimalist monochrome grayscale.
* **Color Controls**: Real-time adjustment of contrast, color shifts, and lens chromatic aberration fringing.

### 6. Studio Video Export & Canvas Capture
* **Cinematic Video Recording**: Captures the canvas output alongside synchronized stereo program audio using the `MediaRecorder` API.
* **Aspect Ratio Framing**: Export in **16:9** (desktop), **9:16** (mobile stories), or **1:1** (posts).
* **High-Bitrate Encoding**: Outputs high-quality WebM/MP4 streams encoded at 8Mbps.

### 7. Preset 'DNA' Sharing & Deep Linking
* **URL DNA Encoding**: Serializes the entire app configuration (oscillators, plate settings, color palettes, and zoom) into a compact, compressed, URL-safe Base64 string.
* **Instant Hydration**: Clicking a shared link parses the query string on mount and populates the store instantly.
* **Local Preset Library**: Save custom configuration configurations to browser `localStorage` with custom names, letting you load or delete presets.

### 8. Immersive view & Camera Navigation
* **Zen Mode**: Press the **Eye** icon or hit **ESC** to instantly hide all menus and panels for a pure full-screen visualizer view. Zen Mode remembers and restores your sidebar layouts automatically.
* **Bottom Panel Toggle**: Toggle the real-time spectrum analyzer panel, sliding it smoothly off-screen.
* **Smooth Camera Zoom**: Slide the camera distance smoothly using a slider or preset quick actions (**FIT** and **DETAIL**). In 3D OrbitControls, the zoom operates along the viewport camera angle without resetting your rotations.

---

## 🛠️ Tech Stack

* **Framework**: React 19 + TypeScript
* **Build Tool**: Vite + Rolldown
* **WebGL Rendering**: Three.js + `@react-three/fiber` + `@react-three/drei`
* **Shader Post-processing**: `@react-three/postprocessing` + `postprocessing`
* **State Management**: Zustand
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React

---

## 📂 Codebase Architecture

```bash
src/
├── audio/
│   └── AudioEngine.ts        # Handles Web Audio contexts, polyphonic oscillators, mic & file decode
├── components/
│   ├── LeftSidebar.tsx       # Audio Mixer, LFO, Sweeper, source switchers, and Zen Mode toggle
│   ├── RightSidebar.tsx      # View Settings, presets, sharing controls, plate setup, and sliders
│   ├── ControlRow.tsx        # Decoupled precise slider + numeric text input row
│   └── SpectrumAnalyzer.tsx  # HTML5 Canvas real-time FFT spectrum visualizer
├── shaders/
│   ├── cymatic.frag          # GLSL fragment shader with polar Chladni formula & bezel mapping
│   └── cymatic.vert          # GLSL vertex shader for 3D perspective terrain mesh displacement
├── store/
│   └── useAppStore.ts        # Zustand store managing visualizer modes, recordings, and camera zoom
├── utils/
│   ├── dna.ts                # Base64 URL serialization and query param hydration utility
│   ├── export.ts             # Snapshot export and 2D canvas text overlay overlay helper
│   └── videoRecorder.ts      # Combines Web Audio destination stream and canvas capture for exports
├── visualization/
│   ├── components/
│   │   └── CymaticCanvas.tsx # R3F Canvas context, OrbitControls, Camera controllers, and FBO ping-pong loops
│   └── materials/
│       └── CymaticMaterial.ts# Custom shader material definition and uniforms registration
├── App.tsx                   # Main layout container and Zen Mode layout managers
└── main.tsx                  # React entry point
```

---

## ⚡ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* npm (v9.0.0 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/me-hv/cymatrix.git
   cd cymatrix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
To build a minified, production-ready bundle:
```bash
npm run build
```
The output files will be generated in the `/dist` directory.
