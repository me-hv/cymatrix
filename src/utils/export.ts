import * as THREE from 'three';

let activeGl: THREE.WebGLRenderer | null = null;
let activeScene: THREE.Scene | null = null;
let activeCamera: THREE.Camera | null = null;
let activeComposer: { render: (deltaTime?: number) => void } | null = null;

/**
 * Registers the active WebGL rendering context objects.
 * Called automatically from the render loop.
 */
export const registerWebGLContext = (
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  composer: { render: (deltaTime?: number) => void } | null
) => {
  activeGl = gl;
  activeScene = scene;
  activeCamera = camera;
  activeComposer = composer;
};

/**
 * Unregisters the WebGL rendering context objects.
 */
export const unregisterWebGLContext = () => {
  activeGl = null;
  activeScene = null;
  activeCamera = null;
  activeComposer = null;
};

/**
 * Captures the current frame from the WebGL canvas, draws it on a 2D canvas with
 * a minimalist frequency and app name overlay, and triggers a PNG download.
 */
export const exportSnapshot = (freqText: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!activeGl || !activeScene || !activeCamera) {
        throw new Error('WebGL context is not registered.');
      }

      // Step A: Force a manual render immediately before capturing the canvas
      if (activeComposer) {
        activeComposer.render();
      } else {
        activeGl.render(activeScene, activeCamera);
      }

      const webglCanvas = activeGl.domElement;

      // Step B: Immediately capture the WebGL canvas to data URL (freezing the buffer content)
      const webglDataUrl = webglCanvas.toDataURL('image/png');

      // Create temporary 2D canvas for composition
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = webglCanvas.width;
      tempCanvas.height = webglCanvas.height;
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get 2D context for temporary canvas.');
      }

      // Load captured image data asynchronously to draw on the 2D canvas
      const img = new Image();
      img.onload = () => {
        // Step D (Background Fix): Fill with solid black background
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Step C: Draw WebGL image onto the 2D canvas
        ctx.drawImage(img, 0, 0);

        // Step D: Add the text overlay in the bottom-right corner
        // Make font sizing relative to the canvas resolution
        const baseSize = Math.max(14, Math.round(tempCanvas.width * 0.015)); // 1.5% of canvas width
        const appNameSize = Math.round(baseSize * 1.5);
        const freqSize = baseSize;
        const padding = Math.max(20, Math.round(tempCanvas.width * 0.03)); // 3% of canvas width

        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Use subtle, semi-transparent white/cyan tint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

        // Set letter spacing if supported (standard on modern browsers)
        if ('letterSpacing' in ctx) {
          ctx.letterSpacing = '4px';
        }

        // Draw Frequency
        ctx.font = `${freqSize}px Inter, Roboto, "Helvetica Neue", sans-serif`;
        ctx.fillText(freqText, tempCanvas.width - padding, tempCanvas.height - padding);

        // Draw App Name above Frequency
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // Slightly more transparent for hierarchy
        ctx.font = `bold ${appNameSize}px Inter, Roboto, "Helvetica Neue", sans-serif`;
        
        const lineSpacing = freqSize * 1.4;
        ctx.fillText('CYMATRIX', tempCanvas.width - padding, tempCanvas.height - padding - lineSpacing);

        // Step E: Trigger the final download
        const finalDataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = finalDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        resolve();
      };

      img.onerror = reject;

      img.src = webglDataUrl;
    } catch (error) {
      console.error('Error taking snapshot:', error);
      reject(error);
    }
  });
};
