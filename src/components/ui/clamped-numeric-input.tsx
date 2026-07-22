import * as React from 'react';
import { Input } from '@/components/ui/input';

type ClampedNumericInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'max'> & {
  value?: number | null;
  max?: number;
  onChangeValue: (value: number) => void;
};

export function ClampedNumericInput({ value, max, onChangeValue, onChange, ...rest }: ClampedNumericInputProps) {
  const display = value === null || value === undefined ? '' : value.toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawStr = e.target.value.replace(/[^0-9.]/g, '');
    let numeric = rawStr ? parseFloat(rawStr) : 0;
    
    // The "Nominal Clapping" logic: cap at max
    if (max !== undefined && numeric > max) {
      numeric = max;
      rawStr = max.toString();
    }
    
    onChangeValue(numeric);
    onChange?.({ ...e, target: { ...e.target, value: rawStr } } as React.ChangeEvent<HTMLInputElement>);
  };

  return <Input type="text" inputMode="numeric" value={display} onChange={handleChange} {...rest} />;
}
