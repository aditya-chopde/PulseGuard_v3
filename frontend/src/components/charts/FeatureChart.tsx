import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureChartProps {
  features: { name: string; contribution: number }[];
}

const COLORS = [
  'hsl(213, 94%, 50%)',
  'hsl(175, 60%, 42%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 72%, 55%)',
];

export default function FeatureChart({ features }: FeatureChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={features} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" domain={[0, 100]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis type="category" dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" width={100} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
          {features.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
