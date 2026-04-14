import { useEffect, useRef } from 'react';

export default function PCGChart({ riskScore = 50 }: { riskScore?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      for(let i=0; i<height; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }
      for(let i=0; i<width; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }

      ctx.beginPath();
      const isHighRisk = riskScore > 65;
      ctx.strokeStyle = isHighRisk ? '#e53935' : '#43a047'; 
      ctx.lineWidth = 2.5;

      for (let x = 0; x < width; x++) {
        const t = (x + time) * (isHighRisk ? 0.08 : 0.06); // faster if high risk
        let y = height / 2;

        const beatPosition = t % 20;
        
        // S1 and S2 heart sounds
        if (beatPosition < 2) { // S1 (lub)
           y -= Math.sin(beatPosition * Math.PI) * 45 * (isHighRisk ? 1.4 : 1);
        } else if (beatPosition > 5 && beatPosition < 6.5) { // S2 (dub)
           y += Math.sin((beatPosition - 5) * Math.PI * 1.5) * 30;
        }

        // Murmur / Noise
        if (isHighRisk) {
           y += (Math.random() - 0.5) * 14; // more erratic murmur
        } else {
           y += (Math.random() - 0.5) * 3; // steady baseline
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      time += 2.5;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [riskScore]);

  return (
    <div className="w-full relative rounded-xl bg-background border border-border p-3 shadow-sm">
      <div className="absolute top-3 left-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest z-10 flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-critical animate-pulse" /> Phonocardiogram (PCG) Signal
      </div>
      <canvas ref={canvasRef} width={800} height={160} className="w-full h-32 object-cover rounded-lg mix-blend-multiply dark:mix-blend-screen opacity-90" />
    </div>
  );
}
