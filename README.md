# 🌌 Cymatrix: Real-Time Cymatics Visualizer

**Cymatrix** is a high-performance, GPU-accelerated web application that visualizes sound frequencies as stunning, physics-inspired cymatic patterns and Chladni figures. 

Built with **React, TypeScript, Three.js (React Three Fiber), and custom GLSL shaders**, it translates live audio inputs or pre-recorded audio files into beautiful, symmetrical geometries in real time.

---

## 🚀 Core Features

### 1. High-End GPU Rendering & Visuals
* **Artistic Chladni & Mandala Shaders**: Custom GLSL fragment shader utilizing polar coordinate transformations and mathematical formulas to render complex, overlapping symmetries.
* **Realistic Post-Processing Bloom**: Powered by `@react-three/postprocessing` to deliver glowing, high-intensity neon lines that bleed into the surrounding darkness.
* **Responsive Visual Mapping**:
  * **Frequency** $\rightarrow$ Pattern Density & Harmonic Complexity.
  * **Amplitude** $\rightarrow$ Line Thickness & Spatial Distortion.
  * **Radius Gradient** $\rightarrow$ Smooth transition from white-hot cyan at the center to electric blue and deep cosmic purple at the edges.

### 2. Versatile Audio Inputs
* **Tone Generator**: Built-in test oscillator supporting custom sine wave frequencies.
* **Microphone Input**: Real-time microphone capture for external sound sources.
* **Audio File Upload**: Drag-and-drop or click to upload any standard audio file (MP3, WAV, FLAC, etc.) with automatic loop playback.

### 3. Pro Audio Controls
* **Decoupled Precise Frequency Input**: A dedicated dual slider + text input allowing musicians and sound designers to input exact frequencies (e.g., $432\text{ Hz}$, $528\text{ Hz}$) with immediate validation.
* **Acoustic Presets**: Quick preset triggers for **Harmonic**, **Geometric**, and **Chaotic** geometries.
* **Fine-Tuned Dials**: Control knobs for Symmetry divisions, line Thickness, overall Brightness, Damping (smoothing/decay), Speed, and Gain/Volume.
* **Safe Audio Defaults**: Starts at a safe `10%` volume limit by default to protect user ears and equipment.

### 4. Interactive HUD & Spectrum Analyzer
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
│   └── AudioEngine.ts        # Handles Web Audio API contexts, oscillator, mic & file decode
├── components/
│   ├── Sidebar.tsx           # Pro Audio glassmorphic parameter controls
│   └── SpectrumAnalyzer.tsx  # HTML5 Canvas real-time FFT spectrum visualizer
├── shaders/
│   ├── cymatic.frag          # GLSL fragment shader containing cymatic equations & gradients
│   └── cymatic.vert          # GLSL vertex shader rendering full-screen quad
├── store/
│   └── useAppStore.ts        # Zustand UI & visualization global parameters store
├── visualization/
│   ├── components/
│   │   └── CymaticCanvas.tsx # R3F Canvas context, useFrame loops & Bloom composer
│   └── materials/
│       └── CymaticMaterial.ts# Custom shader material definition and registration
├── App.tsx                   # Main layout container
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
