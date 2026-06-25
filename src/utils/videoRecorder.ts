import { useAppStore } from '../store/useAppStore';
import { getActiveCanvas } from './export';
import { audioEngine } from '../audio/AudioEngine';

type AspectRatio = '16:9' | '9:16' | '1:1';

/**
 * Resolves target width/height for a given aspect ratio, constrained to
 * the source canvas dimensions and capped at 1080p.
 */
function getTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  aspect: AspectRatio
): { width: number; height: number } {
  switch (aspect) {
    case '9:16': {
      // Portrait — height-dominant, width = height * 9/16
      const h = Math.min(sourceHeight, 1920);
      const w = Math.round(h * (9 / 16));
      return { width: w % 2 === 0 ? w : w + 1, height: h % 2 === 0 ? h : h + 1 };
    }
    case '1:1': {
      // Square — take the smaller dimension
      const side = Math.min(sourceWidth, sourceHeight, 1080);
      const s = side % 2 === 0 ? side : side + 1;
      return { width: s, height: s };
    }
    case '16:9':
    default: {
      // Landscape — use source size capped at 1080p
      const w = Math.min(sourceWidth, 1920);
      const h = Math.round(w * (9 / 16));
      return { width: w % 2 === 0 ? w : w + 1, height: h % 2 === 0 ? h : h + 1 };
    }
  }
}

/**
 * Draws a semi-transparent watermark overlay (logo + frequencies) onto a 2D context.
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqText: string
) {
  const baseSize = Math.max(12, Math.round(width * 0.014));
  const logoSize = Math.round(baseSize * 1.4);
  const padding = Math.max(16, Math.round(width * 0.025));

  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  // Frequency text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = `${baseSize}px Inter, Roboto, "Helvetica Neue", sans-serif`;
  if ('letterSpacing' in ctx) {
    (ctx as unknown as Record<string, string>).letterSpacing = '3px';
  }
  ctx.fillText(freqText, width - padding, height - padding);

  // Logo above frequency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.font = `bold ${logoSize}px Inter, Roboto, "Helvetica Neue", sans-serif`;
  const lineSpacing = baseSize * 1.5;
  ctx.fillText('CYMATRIX', width - padding, height - padding - lineSpacing);

  // Recording indicator — small red dot (top-left)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
  ctx.beginPath();
  ctx.arc(padding + 6, padding + 6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = `bold ${baseSize}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('REC', padding + 18, padding);
}

/**
 * Builds the frequency display text from the current store state.
 */
function getFreqText(): string {
  const state = useAppStore.getState();
  if (state.inputMode === 'oscillator') {
    const parts: string[] = [];
    if (state.oscA.enabled) parts.push(`A: ${state.oscA.frequency.toFixed(0)}Hz`);
    if (state.oscB.enabled) parts.push(`B: ${state.oscB.frequency.toFixed(0)}Hz`);
    if (state.oscC.enabled) parts.push(`C: ${state.oscC.frequency.toFixed(0)}Hz`);
    return parts.length > 0 ? parts.join(' | ') : 'Silent';
  }
  if (state.inputMode === 'microphone') return 'MIC INPUT';
  if (state.inputMode === 'file') return state.uploadedFileName ?? 'FILE INPUT';
  return '';
}

/**
 * Determines the best supported MIME type for MediaRecorder.
 */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private animationFrameId: number | null = null;
  private compositeCanvas: HTMLCanvasElement | null = null;
  private compositeCtx: CanvasRenderingContext2D | null = null;
  private audioDest: MediaStreamAudioDestinationNode | null = null;
  private isActive = false;

  /**
   * Starts recording the Three.js canvas with synced audio.
   */
  startRecording(aspect: AspectRatio = '16:9'): boolean {
    if (this.isActive) return false;

    const sourceCanvas = getActiveCanvas();
    if (!sourceCanvas) {
      console.error('[VideoRecorder] No WebGL canvas registered.');
      return false;
    }

    const audioCtx = audioEngine.getAudioContext();
    const gainNode = audioEngine.getGainNode();

    // Determine target dimensions
    const { width, height } = getTargetDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      aspect
    );

    // Create an offscreen composite canvas at the target resolution
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = width;
    this.compositeCanvas.height = height;
    this.compositeCtx = this.compositeCanvas.getContext('2d', { alpha: false });

    if (!this.compositeCtx) {
      console.error('[VideoRecorder] Could not get 2D context.');
      return false;
    }

    // Capture video stream from composite canvas at 30 FPS
    const videoStream = this.compositeCanvas.captureStream(30);

    // Create combined stream with audio
    let combinedStream: MediaStream;
    if (audioCtx && gainNode) {
      this.audioDest = audioCtx.createMediaStreamDestination();
      // Connect gain node to audio destination (non-destructive — doesn't remove existing connections)
      gainNode.connect(this.audioDest);
      const audioTracks = this.audioDest.stream.getAudioTracks();
      combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ]);
    } else {
      combinedStream = videoStream;
    }

    // Setup MediaRecorder
    const mimeType = getSupportedMimeType();
    const options: MediaRecorderOptions = {
      videoBitsPerSecond: 8_000_000, // 8 Mbps
    };
    if (mimeType) options.mimeType = mimeType;

    try {
      this.mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      console.error('[VideoRecorder] MediaRecorder failed to initialize:', e);
      return false;
    }

    this.chunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Start compositing frames
    this.isActive = true;
    this.startCompositeLoop(sourceCanvas, width, height);

    // Start the recorder
    this.mediaRecorder.start(100); // Collect data every 100ms

    // Start elapsed timer
    const store = useAppStore.getState();
    store.setRecordingElapsed(0);
    store.setRecordingStatus('recording');
    store.setIsRecording(true);

    let elapsed = 0;
    this.timerInterval = setInterval(() => {
      elapsed += 1;
      useAppStore.getState().setRecordingElapsed(elapsed);
    }, 1000);

    return true;
  }

  /**
   * Stops recording and triggers a download.
   */
  async stopRecording(): Promise<void> {
    if (!this.isActive || !this.mediaRecorder) return;

    useAppStore.getState().setRecordingStatus('processing');
    this.isActive = false;

    // Stop the compositing loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop the timer
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop MediaRecorder and wait for final data
    const blob = await new Promise<Blob>((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const finalBlob = new Blob(this.chunks, { type: mimeType });
        resolve(finalBlob);
      };
      this.mediaRecorder!.stop();
    });

    // Disconnect audio destination
    if (this.audioDest) {
      try {
        const gainNode = audioEngine.getGainNode();
        if (gainNode) gainNode.disconnect(this.audioDest);
      } catch {
        // Ignore — may already be disconnected
      }
      this.audioDest = null;
    }

    // Clean up composite canvas
    this.compositeCanvas = null;
    this.compositeCtx = null;

    // Generate filename
    const state = useAppStore.getState();
    const freqPart = state.inputMode === 'oscillator'
      ? `${Math.round(state.oscA.frequency)}Hz`
      : state.inputMode === 'microphone' ? 'MIC' : 'FILE';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `CYMATRIX_video_${freqPart}_${timestamp}.webm`;

    // Trigger download
    this.downloadBlob(blob, filename);

    // Reset state
    state.setRecordingStatus('idle');
    state.setIsRecording(false);
    state.setRecordingElapsed(0);
  }

  /**
   * Compositing loop — draws the WebGL source canvas (cropped & scaled) onto the
   * composite canvas with a watermark overlay, at ~30 FPS.
   */
  private startCompositeLoop(
    sourceCanvas: HTMLCanvasElement,
    targetW: number,
    targetH: number
  ) {
    const ctx = this.compositeCtx!;
    const compositeCanvas = this.compositeCanvas!;

    const loop = () => {
      if (!this.isActive) return;

      // Calculate source crop region (center-crop to match target aspect)
      const sourceAspect = sourceCanvas.width / sourceCanvas.height;
      const targetAspect = targetW / targetH;

      let sx = 0, sy = 0, sw = sourceCanvas.width, sh = sourceCanvas.height;

      if (sourceAspect > targetAspect) {
        // Source is wider — crop horizontally
        sw = Math.round(sourceCanvas.height * targetAspect);
        sx = Math.round((sourceCanvas.width - sw) / 2);
      } else if (sourceAspect < targetAspect) {
        // Source is taller — crop vertically
        sh = Math.round(sourceCanvas.width / targetAspect);
        sy = Math.round((sourceCanvas.height - sh) / 2);
      }

      // Clear and draw
      ctx.fillStyle = '#020202';
      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
      ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, targetW, targetH);

      // Overlay watermark
      drawWatermark(ctx, targetW, targetH, getFreqText());

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Triggers a browser download for the given blob.
   */
  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export const videoRecorder = new VideoRecorder();
