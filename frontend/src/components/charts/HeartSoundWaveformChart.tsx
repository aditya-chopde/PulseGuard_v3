import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, 
  ComposedChart, Area, Scatter, Brush, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeartSoundWaveformChartProps {
  condition: string;
  riskScore: number;
  realData?: number[];
}

export default function HeartSoundWaveformChart({ condition, riskScore, realData }: HeartSoundWaveformChartProps) {
  const [showBaseline, setShowBaseline] = useState(true);
  const [showDifference, setShowDifference] = useState(false);
  const [amplification, setAmplification] = useState<number>(1);
  const [zoomMode, setZoomMode] = useState(false);

  const { data, stats } = useMemo(() => {
    const points: any[] = [];
    const abnormalityFactor = riskScore / 100;
    
    let sumDev = 0;
    let maxDiff = 0;
    let varSum = 0;

    const numPoints = realData && realData.length > 0 ? realData.length : 200;

    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const cycle = t * 4; // 4 heartbeat cycles

      const pos = cycle % 1;

      // Base generation (simulating ideal baseline)
      let baseline = 0;
      if (pos > 0.05 && pos < 0.15) {
        baseline = Math.sin(((pos - 0.05) / 0.1) * Math.PI) * 0.8;
      } else if (pos > 0.4 && pos < 0.5) {
        baseline = Math.sin(((pos - 0.4) / 0.1) * Math.PI) * 0.6;
      }
      baseline += (Math.random() - 0.5) * 0.02;

      let patientSignal = 0;
      let isPeak = 0;

      if (realData && realData.length > 0) {
        patientSignal = realData[i] || 0;
      } else {
        // Patient simulated logic
        patientSignal = baseline; // start from baseline
        if (pos > 0.05 && pos < 0.15) {
            patientSignal += Math.sin(((pos - 0.05) / 0.1) * Math.PI) * (abnormalityFactor * 0.3);
        } else if (pos > 0.15 && pos < 0.4) {
            const murmurIntensity = abnormalityFactor * 0.4;
            patientSignal += (Math.random() - 0.5) * murmurIntensity + Math.sin(pos * 60) * murmurIntensity * 0.3;
        } else if (pos > 0.4 && pos < 0.5) {
            patientSignal += Math.sin(((pos - 0.4) / 0.1) * Math.PI) * (abnormalityFactor * 0.2);
        } else if (pos > 0.5 && pos < 0.95) {
            const diastolicNoise = condition !== 'Normal' ? abnormalityFactor * 0.2 : 0;
            patientSignal += (Math.random() - 0.5) * 0.05 + Math.sin(pos * 40) * diastolicNoise * 0.15;
        }
      }

      // Amplification multiplier
      const finalSignal = patientSignal * amplification;
      
      // Peak emphasis (numerical marker detection)
      if (Math.abs(finalSignal) > 0.45 && Math.abs(finalSignal) > Math.abs(baseline) * 1.1) {
          // If strictly greater and abnormal
          isPeak = finalSignal;
      }

      const difference = finalSignal - baseline;
      sumDev += Math.abs(difference);
      varSum += Math.pow(difference, 2);
      if (Math.abs(difference) > maxDiff) maxDiff = Math.abs(difference);

      points.push({
        time: Math.round(t * 2000), // ms
        amplitude: Math.round(finalSignal * 1000) / 1000,
        baseline: Math.round(baseline * 1000) / 1000,
        difference: Math.round(difference * 1000) / 1000,
        peak: isPeak !== 0 ? Math.round(isPeak * 1000) / 1000 : null,
      });
    }

    const n = points.length || 1;
    return {
      data: points,
      stats: {
        meanDev: (sumDev / n).toFixed(3),
        maxDiff: maxDiff.toFixed(3),
        variance: (varSum / n).toFixed(4),
      }
    };
  }, [condition, riskScore, realData, amplification]);

  return (
    <div className="flex flex-col space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/30 rounded-lg border border-border text-sm">
            <div className="flex items-center gap-2">
                <Switch id="baseline-toggle" checked={showBaseline} onCheckedChange={setShowBaseline} />
                <Label htmlFor="baseline-toggle" className="cursor-pointer">Overlay Baseline</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="diff-toggle" checked={showDifference} onCheckedChange={setShowDifference} />
                <Label htmlFor="diff-toggle" className="cursor-pointer">Difference Plot</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="zoom-toggle" checked={zoomMode} onCheckedChange={setZoomMode} />
                <Label htmlFor="zoom-toggle" className="cursor-pointer">Zoom / Pan enabled</Label>
            </div>
            <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground uppercase mr-2">Amplify Gain:</Label>
                {[1, 2, 5].map(val => (
                    <Button 
                        key={val} 
                        variant={amplification === val ? "default" : "outline"} 
                        size="sm" 
                        className="h-7 w-8 p-0 text-xs"
                        onClick={() => setAmplification(val)}
                    >
                        x{val}
                    </Button>
                ))}
            </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Mean Deviation</span>
                <span className="text-lg font-bold text-foreground">{stats.meanDev} σ</span>
            </div>
            <div className="glass-card p-3 flex flex-col items-center justify-center text-center border-warning/30 bg-warning/5">
                <span className="text-[10px] uppercase text-warning font-semibold">Peak Difference</span>
                <span className="text-lg font-bold text-warning">{stats.maxDiff}</span>
            </div>
            <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Residual Variance</span>
                <span className="text-lg font-bold text-foreground">{stats.variance}</span>
            </div>
        </div>

        {/* Main Chart */}
        <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <defs>
                <linearGradient id="colorDeviation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" />
                    <stop offset="25%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="75%" stopColor="#f59e0b" />
                    <stop offset="95%" stopColor="#ef4444" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" fontSize={11} stroke="hsl(var(--muted-foreground))" tickCount={6} />
            <YAxis 
                fontSize={11} stroke="hsl(var(--muted-foreground))" 
                domain={['auto', 'auto']} 
                label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', zIndex: 50 }}
                labelFormatter={(label) => `Time: ${label} ms`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />

            {showBaseline && (
                <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Normal Baseline" />
            )}

            <Line type="monotone" dataKey="amplitude" stroke="url(#colorDeviation)" strokeWidth={2} dot={false} name="Patient Signal" activeDot={{ r: 6, fill: '#ef4444' }} />
            
            <Scatter dataKey="peak" fill="#ef4444" name="Anomalous Peak" />

            {zoomMode && <Brush dataKey="time" height={30} stroke="hsl(var(--primary))" fill="hsl(var(--muted))" />}
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
        </ComposedChart>
        </ResponsiveContainer>

        {/* Difference/Residual Sub-plot */}
        {showDifference && (
            <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                    <Area type="monotone" dataKey="difference" fill="#f59e0b" fillOpacity={0.3} stroke="#f59e0b" name="Signal Difference (Residual)" />
                </ComposedChart>
            </ResponsiveContainer>
        )}
    </div>
  );
}
