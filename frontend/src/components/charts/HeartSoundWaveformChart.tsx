import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface HeartSoundWaveformChartProps {
  condition: string;
  riskScore: number;
}

export default function HeartSoundWaveformChart({ condition, riskScore }: HeartSoundWaveformChartProps) {
  const data = useMemo(() => {
    const points: { time: number; amplitude: number; s1s2: number }[] = [];
    const abnormalityFactor = riskScore / 100;

    for (let i = 0; i < 200; i++) {
      const t = i / 200;
      const cycle = t * 4; // 4 heartbeat cycles
      const pos = cycle % 1;

      let amplitude = 0;
      let s1s2 = 0;

      // S1 sound (lub)
      if (pos > 0.05 && pos < 0.15) {
        const local = (pos - 0.05) / 0.1;
        amplitude = Math.sin(local * Math.PI) * (0.8 + abnormalityFactor * 0.3);
        s1s2 = amplitude * 0.9;
      }
      // Systolic phase — murmur for abnormal conditions
      else if (pos > 0.15 && pos < 0.4) {
        const murmurIntensity = abnormalityFactor * 0.4;
        amplitude = (Math.random() - 0.5) * murmurIntensity + Math.sin(pos * 60) * murmurIntensity * 0.3;
        s1s2 = 0;
      }
      // S2 sound (dub)
      else if (pos > 0.4 && pos < 0.5) {
        const local = (pos - 0.4) / 0.1;
        amplitude = Math.sin(local * Math.PI) * (0.6 + abnormalityFactor * 0.2);
        s1s2 = amplitude * 0.85;
      }
      // Diastolic phase
      else if (pos > 0.5 && pos < 0.95) {
        const diastolicNoise = condition !== 'Normal' ? abnormalityFactor * 0.2 : 0;
        amplitude = (Math.random() - 0.5) * 0.05 + Math.sin(pos * 40) * diastolicNoise * 0.15;
        s1s2 = 0;
      }
      else {
        amplitude = (Math.random() - 0.5) * 0.03;
      }

      // Add baseline noise
      amplitude += (Math.random() - 0.5) * 0.02;

      points.push({
        time: Math.round(t * 2000), // ms
        amplitude: Math.round(amplitude * 1000) / 1000,
        s1s2: Math.round(s1s2 * 1000) / 1000,
      });
    }
    return points;
  }, [condition, riskScore]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="time"
          fontSize={11}
          stroke="hsl(var(--muted-foreground))"
          label={{ value: 'Time (ms)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          fontSize={11}
          stroke="hsl(var(--muted-foreground))"
          domain={[-1.2, 1.2]}
          label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
            name === 'amplitude' ? 'PCG Signal' : 'S1/S2 Peaks',
          ]}
        />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="amplitude"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          dot={false}
          name="amplitude"
        />
        <Line
          type="monotone"
          dataKey="s1s2"
          stroke="hsl(145, 63%, 42%)"
          strokeWidth={1.5}
          dot={false}
          name="s1s2"
          strokeOpacity={0.7}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
