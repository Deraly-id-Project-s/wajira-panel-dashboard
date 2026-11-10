import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/utils/money-input';

type MoneyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'max'> & {
  value?: number | null;
  max?: number;
  onChangeValue: (value: number) => void;
  currency?: 'IDR' | 'USD' | 'idr' | 'usd' | string;
};

export function MoneyInput({ value, max, onChangeValue, onChange, currency = 'IDR', ...rest }: MoneyInputProps) {
  const normalizedCurrency: 'IDR' | 'USD' = String(currency ?? 'IDR').toUpperCase() === 'USD' ? 'USD' : 'IDR';
  const display = value === null || value === undefined ? '' : formatMoneyInput(value.toString(), normalizedCurrency);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numeric = parseMoneyInput(e.target.value, normalizedCurrency);
    if (max !== undefined && max !== null && max >= 0 && numeric > max) {
      numeric = max;
      const formatted = formatMoneyInput(numeric.toString(), normalizedCurrency);
      onChangeValue(numeric);
      onChange?.({ ...e, target: { ...e.target, value: formatted } } as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    const formatted = formatMoneyInput(e.target.value, normalizedCurrency);
    onChangeValue(numeric);
    onChange?.({ ...e, target: { ...e.target, value: formatted } } as React.ChangeEvent<HTMLInputElement>);
  };

  return <Input type="text" inputMode={normalizedCurrency === 'USD' ? 'decimal' : 'numeric'} value={display} onChange={handleChange} {...rest} />;
}
