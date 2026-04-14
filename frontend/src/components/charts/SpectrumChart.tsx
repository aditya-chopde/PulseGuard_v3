import { useEffect, useRef } from 'react';

export default function SpectrumChart({ riskScore = 50 }: { riskScore?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Smooth spectrum array
    const bars = 70;
    const heights = Array(bars).fill(0).map(() => Math.random() * 50 + 10);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const isHighRisk = riskScore > 65;
      
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bars) - 2.5;

      for (let i = 0; i < bars; i++) {
        // Wobble the heights slightly
        heights[i] += (Math.random() - 0.5) * 8;
        
        // Base spectrum curve (bell curve distribution around middle for normal, chaotic spread for high risk)
        const normalizeI = i / bars;
        const bellCurve = Math.exp(-Math.pow((normalizeI - 0.5) * 4, 2)) * 80;

        const expectedHeight = isHighRisk 
          ? (Math.random() * 70 + bellCurve * 0.5 + 20)
          : (bellCurve + Math.random() * 20 + 5);
        
        // Return slowly to expected height (easing)
        heights[i] += (expectedHeight - heights[i]) * 0.15;
        
        // Clamp
        if (heights[i] < 5) heights[i] = 5;
        if (heights[i] > height - 10) heights[i] = height - 10;

        const x = i * (barWidth + 2.5);
        const y = height - heights[i];

        // Gradient based on height
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, isHighRisk ? '#fca5a5' : '#60a5fa');
        gradient.addColorStop(1, isHighRisk ? '#dc2626' : '#2563eb');

        ctx.fillStyle = gradient;
        
        // Draw rounded top bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, heights[i], [3, 3, 0, 0]);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [riskScore]);

  return (
    <div className="w-full relative rounded-xl bg-background border border-border p-3 shadow-sm">
      <div className="absolute top-3 left-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest z-10 flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Frequency Spectrum Analysis
      </div>
      <canvas ref={canvasRef} width={800} height={160} className="w-full h-32 object-cover rounded-lg mix-blend-multiply dark:mix-blend-screen opacity-90 mt-1" />
    </div>
  );
}
