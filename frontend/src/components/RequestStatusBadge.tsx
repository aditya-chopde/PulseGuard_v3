import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface RequestStatusBadgeProps {
  status: 'pending' | 'accepted' | 'declined';
  className?: string;
}

export const RequestStatusBadge = ({ status, className = '' }: RequestStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'Pending',
          description: 'Waiting for doctor response'
        };
      case 'accepted':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: 'Accepted',
          description: 'Doctor accepted your request'
        };
      case 'declined':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          text: 'Declined',
          description: 'Doctor declined request'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: AlertTriangle,
          text: 'Unknown',
          description: ''
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={className}>
      <config.icon className="h-3 w-3 mr-1" />
      {config.text}
    </Badge>
  );
};

