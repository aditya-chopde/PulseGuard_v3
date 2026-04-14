import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface MultiInputFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  label: string;
}

export function MultiInputField({ value, onChange, placeholder, label }: MultiInputFieldProps) {
  const [input, setInput] = React.useState('');

  const addItem = () => {
    if (input.trim()) {
      onChange([...value, input.trim()]);
      setInput('');
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <div className="flex gap-2 items-end">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-10 px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <div key={index} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs">
            {item}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-primary/20"
              onClick={() => removeItem(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or click + to add. Comma-separated strings also accepted.
      </p>
    </div>
  );
}

