import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FrequencySpectrumChartProps {
  condition: string;
  riskScore: number;
  realData?: number[];
}

export default function FrequencySpectrumChart({ condition, riskScore, realData }: FrequencySpectrumChartProps) {
  const data = useMemo(() => {
    const points: { freq: number; power: number; baseline: number }[] = [];
    
    // If we have actual extracted FFT array from the backend
    if (realData && realData.length > 0) {
        for (let i = 0; i < realData.length; i++) {
             const freq = 20 + i * 15.6; // 50 bins from 20 to 800 Hz
             const normalized = i / realData.length;
             
             // Approximate baseline normal
             const baseline = Math.exp(-((normalized - 0.1) ** 2) / 0.01) * 0.8
               + Math.exp(-((normalized - 0.25) ** 2) / 0.02) * 0.5;
             
             points.push({
                 freq: Math.round(freq),
                 power: Math.round(realData[i] * 1000) / 1000,
                 baseline: Math.round(baseline * 1000) / 1000
             });
        }
        return points;
    }

    const abnormality = riskScore / 100;

    for (let i = 0; i < 50; i++) {
      const freq = 20 + i * 16; // 20 Hz to ~800 Hz
      const normalized = i / 50;

      // Normal heart sound spectrum peaks around 20-150 Hz
      let power = Math.exp(-((normalized - 0.1) ** 2) / 0.01) * 0.8;
      power += Math.exp(-((normalized - 0.25) ** 2) / 0.02) * 0.5;

      // Abnormal conditions add higher frequency components
      if (condition !== 'Normal') {
        power += Math.exp(-((normalized - 0.4) ** 2) / 0.03) * abnormality * 0.6;
        power += Math.exp(-((normalized - 0.6) ** 2) / 0.04) * abnormality * 0.35;
      }

      // Baseline normal
      const baseline = Math.exp(-((normalized - 0.1) ** 2) / 0.01) * 0.8
        + Math.exp(-((normalized - 0.25) ** 2) / 0.02) * 0.5;

      // Add noise
      power += (Math.random() - 0.5) * 0.05;
      power = Math.max(0, power);

      points.push({
        freq,
        power: Math.round(power * 1000) / 1000,
        baseline: Math.round(baseline * 1000) / 1000,
      });
    }
    return points;
  }, [condition, riskScore, realData]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="freq"
          fontSize={11}
          stroke="hsl(var(--muted-foreground))"
          label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          fontSize={11}
          stroke="hsl(var(--muted-foreground))"
          label={{ value: 'Power', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value: number, name: string) => [
            value.toFixed(3),
            name === 'power' ? 'Patient Signal' : 'Normal Baseline',
          ]}
        />
        <Area
          type="monotone"
          dataKey="baseline"
          stroke="hsl(var(--muted-foreground))"
          fill="hsl(var(--muted-foreground))"
          fillOpacity={0.1}
          strokeWidth={1}
          strokeDasharray="4 4"
          name="baseline"
        />
        <Area
          type="monotone"
          dataKey="power"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
          name="power"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
