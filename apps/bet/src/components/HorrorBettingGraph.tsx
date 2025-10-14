import { useState, useEffect, useRef } from 'react';

interface HorrorBettingGraphProps {
  rapper1: string;
  rapper2: string;
  rapper1Score: number;
  rapper2Score: number;
  maxScore?: number;
}

export default function HorrorBettingGraph({
  rapper1,
  rapper2,
  rapper1Score,
  rapper2Score,
  maxScore = 30
}: HorrorBettingGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Horror visual effects
    const drawGlitchLines = () => {
      if (Math.random() > 0.9) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }

      for (let i = 0; i < 5; i++) {
        if (Math.random() > 0.7) {
          const y = Math.random() * height;
          ctx.strokeStyle = `rgba(139, 0, 0, ${Math.random() * 0.3})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
    };

    // Draw blood drip effect
    const drawBloodDrips = () => {
      const dripCount = 10;
      for (let i = 0; i < dripCount; i++) {
        const x = (width / dripCount) * i;
        const dripLength = Math.random() * 20 + 10;
        const gradient = ctx.createLinearGradient(x, 0, x, dripLength);
        gradient.addColorStop(0, 'rgba(139, 0, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 2, dripLength);
      }
    };

    // Draw horror-style bars
    const drawBars = () => {
      const barHeight = 40;
      const rapper1Y = height / 2 - barHeight - 10;
      const rapper2Y = height / 2 + 10;

      const rapper1Width = (rapper1Score / maxScore) * width;
      const rapper2Width = (rapper2Score / maxScore) * width;

      // Rapper 1 bar (top) - blood red
      const gradient1 = ctx.createLinearGradient(0, rapper1Y, rapper1Width, rapper1Y);
      gradient1.addColorStop(0, '#8B0000');
      gradient1.addColorStop(0.5, '#DC143C');
      gradient1.addColorStop(1, '#8B0000');

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, rapper1Y, rapper1Width, barHeight);

      // Add glowing border
      ctx.strokeStyle = 'rgba(220, 20, 60, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, rapper1Y, rapper1Width, barHeight);

      // Rapper 2 bar (bottom) - darker blood
      const gradient2 = ctx.createLinearGradient(0, rapper2Y, rapper2Width, rapper2Y);
      gradient2.addColorStop(0, '#4A0000');
      gradient2.addColorStop(0.5, '#8B0000');
      gradient2.addColorStop(1, '#4A0000');

      ctx.fillStyle = gradient2;
      ctx.fillRect(0, rapper2Y, rapper2Width, barHeight);

      ctx.strokeStyle = 'rgba(139, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, rapper2Y, rapper2Width, barHeight);

      // Draw names with horror font effect
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#8B0000';
      ctx.shadowBlur = 10;

      // Rapper 1 name
      ctx.fillText(rapper1.toUpperCase(), 10, rapper1Y + 25);

      // Rapper 2 name
      ctx.fillText(rapper2.toUpperCase(), 10, rapper2Y + 25);

      ctx.shadowBlur = 0;

      // Draw scores
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(`${rapper1Score.toFixed(1)}`, rapper1Width - 10, rapper1Y + 25);
      ctx.fillText(`${rapper2Score.toFixed(1)}`, rapper2Width - 10, rapper2Y + 25);
      ctx.textAlign = 'left';
    };

    // Draw grid overlay
    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(139, 0, 0, 0.1)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    // Render everything
    drawGrid();
    drawBloodDrips();
    drawBars();
    drawGlitchLines();

  }, [rapper1, rapper2, rapper1Score, rapper2Score, maxScore]);

  return (
    <div className="relative w-full h-32 bg-black/80 rounded-lg overflow-hidden border-2 border-red-900/50">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${glitchActive ? 'animate-pulse' : ''}`}
        style={{
          filter: glitchActive ? 'contrast(1.2) brightness(1.1)' : 'none',
          transition: 'filter 0.1s'
        }}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%)'
        }}
      />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }}
      />
    </div>
  );
}
