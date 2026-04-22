import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
  ComposedChart, Line, Brush, Legend
} from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FrequencySpectrumChartProps {
  condition: string;
  riskScore: number;
  realData?: number[];
}

export default function FrequencySpectrumChart({ condition, riskScore, realData }: FrequencySpectrumChartProps) {
  const [showBaseline, setShowBaseline] = useState(true);
  const [showDifference, setShowDifference] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [normalize, setNormalize] = useState(true);

  const { data, stats } = useMemo(() => {
    const points: any[] = [];
    const abnormality = riskScore / 100;
    
    let sumDev = 0;
    let maxDiff = 0;
    let varSum = 0;

    let localPatientData = [];
    let localBaselineData = [];

    // Generation loop
    const numBins = realData && realData.length > 0 ? realData.length : 50;
    for (let i = 0; i < numBins; i++) {
        const freq = 20 + i * (realData ? 15.6 : 16);
        const normalized = i / numBins;

        let baseline = Math.exp(-((normalized - 0.1) ** 2) / 0.01) * 0.8
                     + Math.exp(-((normalized - 0.25) ** 2) / 0.02) * 0.5;

        let power = 0;
        if (realData && realData.length > 0) {
            power = realData[i];
        } else {
            power = baseline;
            if (condition !== 'Normal') {
                power += Math.exp(-((normalized - 0.4) ** 2) / 0.03) * abnormality * 0.6;
                power += Math.exp(-((normalized - 0.6) ** 2) / 0.04) * abnormality * 0.35;
            }
            power += (Math.random() - 0.5) * 0.05;
            power = Math.max(0, power);
        }

        localPatientData.push(power);
        localBaselineData.push(baseline);
        points.push({ freq: Math.round(freq), power, baseline });
    }

    // Normalization phase
    if (normalize) {
        const maxPatient = Math.max(...localPatientData) || 1;
        const maxBase = Math.max(...localBaselineData) || 1;

        for (let i = 0; i < points.length; i++) {
            points[i].power = points[i].power / maxPatient;
            points[i].baseline = points[i].baseline / maxBase;
        }
    }

    // Statistics & Difference Calculation phase
    for (let i = 0; i < points.length; i++) {
        const difference = points[i].power - points[i].baseline;
        points[i].difference = Math.round(difference * 1000) / 1000;
        points[i].power = Math.round(points[i].power * 1000) / 1000;
        points[i].baseline = Math.round(points[i].baseline * 1000) / 1000;

        sumDev += Math.abs(difference);
        varSum += Math.pow(difference, 2);
        if (Math.abs(difference) > maxDiff) maxDiff = Math.abs(difference);
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
  }, [condition, riskScore, realData, normalize]);

  return (
    <div className="flex flex-col space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/30 rounded-lg border border-border text-sm">
            <div className="flex items-center gap-2">
                <Switch id="fs-baseline" checked={showBaseline} onCheckedChange={setShowBaseline} />
                <Label htmlFor="fs-baseline" className="cursor-pointer">Overlay Baseline</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="fs-normalize" checked={normalize} onCheckedChange={setNormalize} />
                <Label htmlFor="fs-normalize" className="cursor-pointer">Normalize Peaks</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="fs-diff" checked={showDifference} onCheckedChange={setShowDifference} />
                <Label htmlFor="fs-diff" className="cursor-pointer">Difference Plot</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="fs-zoom" checked={zoomMode} onCheckedChange={setZoomMode} />
                <Label htmlFor="fs-zoom" className="cursor-pointer">Pan / Zoom</Label>
            </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Spectrum Mean Dev</span>
                <span className="text-lg font-bold text-foreground">{stats.meanDev} σ</span>
            </div>
            <div className="glass-card p-3 flex flex-col items-center justify-center text-center border-warning/30 bg-warning/5">
                <span className="text-[10px] uppercase text-warning font-semibold">Max Deviation (Hz)</span>
                <span className="text-lg font-bold text-warning">{stats.maxDiff}</span>
            </div>
            <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">High-Freq Variance</span>
                <span className="text-lg font-bold text-foreground">{stats.variance}</span>
            </div>
        </div>

        {/* Main Chart */}
        <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="freq" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', zIndex: 50 }}
                    labelFormatter={(label) => `Freq: ${label} Hz`}
                />
                
                {/* Highlight operating bands */}
                <ReferenceArea x1={20} x2={150} fill="hsl(var(--success))" fillOpacity={0.05} />
                {condition !== 'Normal' && (
                    <ReferenceArea x1={150} x2={600} fill="hsl(var(--destructive))" fillOpacity={0.05} />
                )}

                {showBaseline && (
                    <Area type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" name="Baseline (Normal)" />
                )}

                <Area type="monotone" dataKey="power" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} name="Patient Power Density" />

                {zoomMode && <Brush dataKey="freq" height={30} stroke="hsl(var(--primary))" fill="hsl(var(--muted))" />}
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
            </ComposedChart>
        </ResponsiveContainer>

        {/* Difference/Residual Sub-plot */}
        {showDifference && (
            <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="freq" hide />
                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                    <Line type="step" dataKey="difference" stroke="#f59e0b" strokeWidth={2} dot={false} name="Magnitude Difference" />
                </ComposedChart>
            </ResponsiveContainer>
        )}
    </div>
  );
}
