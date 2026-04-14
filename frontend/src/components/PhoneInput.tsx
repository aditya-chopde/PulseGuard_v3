import React from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const isValid = value.length === 10 && /^\d{10}$/.test(value);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="9876543210"
          className={`pl-10 ${!isValid && value.length > 0 ? 'border-destructive focus:border-destructive' : ''}`}
          maxLength={10}
        />
      </div>
      {value.length > 0 && !isValid && (
        <Alert variant="destructive" className="p-2">
          <AlertDescription className="text-xs font-medium text-destructive">
            Phone must be exactly 10 digits
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

