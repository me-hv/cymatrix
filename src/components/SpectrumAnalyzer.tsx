import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { useAppStore } from '../store/useAppStore';

export const SpectrumAnalyzer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const isPlaying = useAppStore((state) => state.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with slight transparency for a trailing fade effect
      ctx.fillStyle = 'rgba(6, 6, 8, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const bufferLength = audioEngine.freqDataArray.length;
      if (!bufferLength || !audioEngine.isPlaying) {
        // Draw flat line when idle
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridCols = 8;
      for (let i = 1; i < gridCols; i++) {
        const x = (width / gridCols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw spectrum bars / filled path
      ctx.beginPath();
      const barWidth = width / bufferLength;
      
      ctx.moveTo(0, height);

      for (let i = 0; i < bufferLength; i++) {
        const percent = audioEngine.freqDataArray[i] / 255;
        // Logarithmic scale for better visual frequency representation
        const y = height - (percent * height * 0.85) - 2;
        const x = i * barWidth;

        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(width, height);
      
      // Create glowing cyan-blue gradient fill
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.0)');
      gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.2)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.7)');

      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw top stroke
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const percent = audioEngine.freqDataArray[i] / 255;
        const y = height - (percent * height * 0.85) - 2;
        const x = i * barWidth;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Show dominant frequency marker/HUD
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText(
        `FFT SIZE: ${bufferLength * 2} | DOMINANT FREQ: ${audioEngine.frequency.toFixed(1)} Hz | Bass: ${audioEngine.bassEnergy.toFixed(2)} | Mid: ${audioEngine.midEnergy.toFixed(2)} | Treble: ${audioEngine.trebleEnergy.toFixed(2)}`,
        12,
        height - 12
      );
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full h-32 bg-[#060608] border-t border-white/5 relative overflow-hidden flex flex-col justify-end">
      <div className="absolute top-2 left-4 z-10 flex gap-4 text-[9px] font-mono tracking-wider text-gray-500 uppercase">
        <span>Real-Time Spectrum Analyzer</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
