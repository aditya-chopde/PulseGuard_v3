import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;
  size?: number;
}

export default function RiskGauge({ score, size = 200 }: RiskGaugeProps) {
  const getColor = () => {
    if (score <= 30) return 'hsl(145, 63%, 42%)';
    if (score <= 65) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 72%, 55%)';
  };

  const getLabel = () => {
    if (score <= 30) return 'Low Risk';
    if (score <= 65) return 'Moderate Risk';
    return 'High Risk';
  };

  const angle = (score / 100) * 180;
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = Math.PI;
  const endAngle = Math.PI + (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <motion.path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <text x={cx} y={cy - 10} textAnchor="middle" className="text-3xl font-bold" fill="hsl(var(--foreground))">
          {score}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-sm" fill="hsl(var(--muted-foreground))">
          {getLabel()}
        </text>
      </svg>
    </div>
  );
}
