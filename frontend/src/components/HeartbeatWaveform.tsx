import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface HeartbeatWaveformProps {
  isAnimating: boolean;
  className?: string;
}

export default function HeartbeatWaveform({ isAnimating, className = '' }: HeartbeatWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const accent = theme === 'dark' ? '#3b82f6' : '#2563eb';
    const accentFade = theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.12)';
    const gridColor = theme === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.05)';

    const heartbeat = (x: number): number => {
      const period = 160;
      const p = ((x % period) + period) % period;
      // P wave
      if (p >= 10 && p < 30) return Math.sin((p - 10) / 20 * Math.PI) * 6;
      // Q dip
      if (p >= 45 && p < 50) return -(p - 45) * 3;
      // R spike
      if (p >= 50 && p < 58) return -15 + (p - 50) * 16;
      // S dip
      if (p >= 58 && p < 68) return 113 - (p - 58) * 15;
      // ST segment back to baseline
      if (p >= 68 && p < 78) return -37 + (p - 68) * 3.7;
      // T wave
      if (p >= 85 && p < 115) return Math.sin((p - 85) / 30 * Math.PI) * 10;
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

      // Grid dots
      ctx.fillStyle = gridColor;
      for (let gx = 0; gx < w; gx += 16) {
        for (let gy = 0; gy < h; gy += 16) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const mid = h / 2;

      if (isAnimating) {
        // Gradient fill under curve
        const gradient = ctx.createLinearGradient(0, mid - 50, 0, mid + 20);
        gradient.addColorStop(0, accentFade);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(0, mid);
        for (let x = 0; x < w; x++) {
          const val = heartbeat(x + offsetRef.current);
          ctx.lineTo(x, mid - val);
        }
        ctx.lineTo(w, mid);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Glow line
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        for (let x = 0; x < w; x++) {
          const val = heartbeat(x + offsetRef.current);
          const y = mid - val;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Crisp line on top
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        for (let x = 0; x < w; x++) {
          const val = heartbeat(x + offsetRef.current);
          const y = mid - val;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Leading dot
        const dotX = w * 0.65;
        const dotY = mid - heartbeat(dotX + offsetRef.current);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.strokeStyle = accentFade;
        ctx.lineWidth = 2;
        ctx.stroke();

        offsetRef.current += 1.8;
      } else {
        // Static flat line
        ctx.beginPath();
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimating, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-xl ${className}`}
      style={{ height: '80px' }}
    />
  );
}
