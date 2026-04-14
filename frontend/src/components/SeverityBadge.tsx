import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

export default function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const styles: Record<string, string> = {
    None: 'bg-success/10 text-success border-success/20',
    Mild: 'bg-info/10 text-info border-info/20',
    Moderate: 'bg-warning/10 text-warning border-warning/20',
    Severe: 'bg-critical/10 text-critical border-critical/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        styles[severity] || styles.None,
        className
      )}
    >
      {severity}
    </span>
  );
}
