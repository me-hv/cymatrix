# 🌌 Cymatrix: Real-Time Polyphonic Cymatics Visualizer

**Cymatrix** is a high-performance, GPU-accelerated web application that visualizes sound frequencies as stunning, physics-inspired cymatic patterns and Chladni figures. 

Built with **React, TypeScript, Three.js (React Three Fiber), and custom GLSL shaders**, it translates live audio inputs, pre-recorded audio files, or a complex multi-oscillator synthesizer into beautiful, symmetrical geometries in real time.

---

## 🚀 Core Features

### 1. Polyphonic Synthesis Engine
* **Three Independent Oscillators**: Configure up to three separate oscillators (OSC A, OSC B, OSC C) concurrently.
* **Complex Wave Interference**: The WebGL fragment shader calculates additive coordinate displacement for all active frequencies, producing complex, evolving geometric interference nodes and wave beats.
* **Harmonic Interval Presets**: Quick options to set mathematical chord ratios relative to OSC A's pitch (Perfect Fifth, Major Third, Octave).

### 2. Dual-Sidebar Studio Layout
* **Left Sidebar (Audio Generation)**: Dedicated to control and select sound sources, adjust individual oscillator volumes and frequencies, and trigger harmonic musical presets.
* **Right Sidebar (Visual Controls & Settings)**: Dedicated to selecting visualization modes (Mandala, Chladni, Ripple), preset themes, and tweaking visual parameters like Symmetry, Damping, Line Thickness, Brightness, and speed.
* **Minimalist UI & Corner Toggles**: Double menu icon headers (top-left and top-right) to toggle individual sidebars seamlessly, leaving maximum screen space for the WebGL canvas.

### 3. High-End GPU Rendering & Visuals
* **Artistic Chladni, Mandala & Ripple Shaders**: Custom GLSL fragment shader utilizing polar coordinate transformations and mathematical formulas to render complex, overlapping symmetries.
* **Normalized Wave Amplitude**: Automatic normalization prevents white-out or visual blowouts when multiple frequencies are activated together, ensuring high-contrast rendering.
* **Realistic Post-Processing Bloom**: Powered by `@react-three/postprocessing` with custom intensity/threshold settings to deliver glowing, high-intensity neon lines that bleed into the surrounding darkness.
* **Responsive Visual Mapping**:
  * **Frequency** $\rightarrow$ Pattern Density & Harmonic Complexity.
  * **Amplitude** $\rightarrow$ Line Thickness & Spatial Distortion.
  * **Radius Gradient** $\rightarrow$ Smooth transition from white-hot cyan at the center to electric blue and deep cosmic purple at the edges.

### 4. High-Quality Snapshot Tool
* **Export Creations**: Download a high-quality PNG of the current visual pattern.
* **Frequency Overlay**: Renders the active frequencies (e.g. `A: 440.0Hz | B: 660.0Hz`) and app branding ('CYMATRIX') directly onto the bottom-right corner of the exported image.
* **Dynamic File Naming**: Auto-generates filenames based on active frequencies (e.g. `cymatrix-snapshot-440hz-660hz.png`).

### 5. Interactive HUD & Spectrum Analyzer
* **Bottom Panel Spectrum Analyzer**: Uses an HTML5 canvas rendering in an isolated `requestAnimationFrame` loop, bypassing React re-renders for maximum rendering performance (maintaining solid **60 FPS**).
* **Live HUD Overlay**: Displays active FFT bin count, dominant frequency, and split-band energies (Bass, Mids, Treble).

---

## 🛠️ Tech Stack

* **Framework**: React 19 + TypeScript
* **Build Tool**: Vite
* **WebGL & Rendering**: Three.js + `@react-three/fiber` + `@react-three/drei`
* **Shader Post-processing**: `@react-three/postprocessing` + `postprocessing`
* **State Management**: Zustand
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React

---

## 📂 Architecture

```bash
src/
├── audio/
│   └── AudioEngine.ts        # Handles Web Audio contexts, polyphonic oscillators, mic & file decode
├── components/
│   ├── LeftSidebar.tsx       # Audio Generation panel (Mixer, sources, intervals)
│   ├── RightSidebar.tsx      # Visual Inspector panel (Modes, visual sliders, presets, snapshot)
│   ├── ControlRow.tsx        # Decoupled precise slider + numeric text input row
│   └── SpectrumAnalyzer.tsx  # HTML5 Canvas real-time FFT spectrum visualizer
├── shaders/
│   ├── cymatic.frag          # GLSL fragment shader with polyphonic additive wave equations
│   └── cymatic.vert          # GLSL vertex shader rendering full-screen quad
├── store/
│   └── useAppStore.ts        # Zustand UI & visualization global parameters store
├── utils/
│   └── export.ts             # Snapshot export and 2D canvas text overlay overlay helper
├── visualization/
│   ├── components/
│   │   └── CymaticCanvas.tsx # R3F Canvas context, useFrame loops & Bloom composer
│   └── materials/
│       └── CymaticMaterial.ts# Custom shader material definition and registration
├── App.tsx                   # Main layout container & sidebar grid
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
