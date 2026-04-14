import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ECGMonitorProps {
  color?: string;
  speed?: number;
  className?: string;
}

export default function ECGMonitor({ color, speed = 2, className = '' }: ECGMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lineColor = color || (theme === 'dark' ? '#2dd4bf' : '#0d9488');
    const bgAlpha = theme === 'dark' ? 'rgba(8, 12, 21, 0.15)' : 'rgba(255, 255, 255, 0.15)';
    const gridAlpha = theme === 'dark' ? 'rgba(45, 212, 191, 0.04)' : 'rgba(13, 148, 136, 0.06)';
    let animationId: number;
    let offset = 0;

    const ecgPattern = (x: number): number => {
      const period = 200;
      const pos = ((x % period) + period) % period;
      if (pos >= 20 && pos <= 40) return Math.sin((pos - 20) / 20 * Math.PI) * 8;
      if (pos >= 60 && pos <= 65) return -(pos - 60) * 6;
      if (pos >= 65 && pos <= 72) return -30 + (pos - 65) * 18;
      if (pos >= 72 && pos <= 80) return 96 - (pos - 72) * 16;
      if (pos >= 80 && pos <= 88) return -32 + (pos - 80) * 4;
      if (pos >= 100 && pos <= 130) return Math.sin((pos - 100) / 30 * Math.PI) * 12;
      return 0;
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = bgAlpha;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = gridAlpha;
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 8;

      const mid = h / 2;
      for (let x = 0; x < w; x++) {
        const val = ecgPattern(x + offset);
        const y = mid - val;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      const leadX = w - 1;
      const leadY = mid - ecgPattern(leadX + offset);
      ctx.beginPath();
      ctx.arc(leadX, leadY, 3, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      offset += speed;
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [color, speed, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-xl ${className}`}
      style={{ height: '120px' }}
    />
  );
}
