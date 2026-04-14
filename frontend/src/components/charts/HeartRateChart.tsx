import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const weekData = [
  { day: 'Mon', current: 72, previous: 75 },
  { day: 'Tue', current: 68, previous: 73 },
  { day: 'Wed', current: 74, previous: 70 },
  { day: 'Thu', current: 71, previous: 76 },
  { day: 'Fri', current: 69, previous: 72 },
  { day: 'Sat', current: 73, previous: 74 },
  { day: 'Sun', current: 70, previous: 71 },
];

export default function HeartRateChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={weekData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[60, 85]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="current" name="This Week" stroke="hsl(213, 94%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="previous" name="Last Week" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
