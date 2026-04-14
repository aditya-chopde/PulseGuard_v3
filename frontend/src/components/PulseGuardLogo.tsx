import logo from '@/assets/pulseguard-logo.png';

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function PulseGuardLogo({ size = 28, showText = true, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logo} alt="PulseGuard" width={size} height={size} className="object-contain" />
      {showText && <span className="text-lg font-bold text-foreground">PulseGuard</span>}
    </div>
  );
}
