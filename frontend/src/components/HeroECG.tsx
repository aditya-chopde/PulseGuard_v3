import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface HeroECGProps {
  className?: string;
  height?: number;
}

export default function HeroECG({ className = '', height = 200 }: HeroECGProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = theme === 'dark' ? '#3b82f6' : '#2563eb';
    const gridColor = theme === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.08)';
    let animationId: number;
    let offset = 0;

    const ecgWave = (x: number): number => {
      const period = 180;
      const pos = ((x % period) + period) % period;
      if (pos < 15) return 0;
      if (pos >= 15 && pos <= 35) return Math.sin((pos - 15) / 20 * Math.PI) * 10;
      if (pos >= 35 && pos < 50) return 0;
      if (pos >= 50 && pos < 55) return -(pos - 50) * 5;
      if (pos >= 55 && pos < 63) return -25 + (pos - 55) * 20;
      if (pos >= 63 && pos < 72) return 135 - (pos - 63) * 20;
      if (pos >= 72 && pos < 82) return -45 + (pos - 72) * 4.5;
      if (pos >= 90 && pos <= 120) return Math.sin((pos - 90) / 30 * Math.PI) * 15;
      return 0;
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      const mid = h / 2;

      // Glow
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      for (let x = 0; x < w; x++) {
        const val = ecgWave(x + offset);
        const y = mid - val;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Crisp
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      for (let x = 0; x < w; x++) {
        const val = ecgWave(x + offset);
        const y = mid - val;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dot
      const dotX = w * 0.75;
      const dotY = mid - ecgWave(dotX + offset);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      offset += 1.5;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-2xl ${className}`}
      style={{ height: `${height}px` }}
    />
  );
}
