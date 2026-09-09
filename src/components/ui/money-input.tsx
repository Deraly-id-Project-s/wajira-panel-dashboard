import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/utils/money-input';

type MoneyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> & {
  value?: number | null;
  onChangeValue: (value: number) => void;
  currency?: 'IDR' | 'USD' | 'idr' | 'usd' | string;
};

export function MoneyInput({ value, onChangeValue, onChange, currency = 'IDR', ...rest }: MoneyInputProps) {
  const normalizedCurrency: 'IDR' | 'USD' = String(currency ?? 'IDR').toUpperCase() === 'USD' ? 'USD' : 'IDR';
  const display = value === null || value === undefined ? '' : formatMoneyInput(value.toString(), normalizedCurrency);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMoneyInput(e.target.value, normalizedCurrency);
    const numeric = parseMoneyInput(formatted, normalizedCurrency);
    onChangeValue(numeric);
    onChange?.({ ...e, target: { ...e.target, value: formatted } } as React.ChangeEvent<HTMLInputElement>);
  };

  return <Input type="text" inputMode={normalizedCurrency === 'USD' ? 'decimal' : 'numeric'} value={display} onChange={handleChange} {...rest} />;
}
