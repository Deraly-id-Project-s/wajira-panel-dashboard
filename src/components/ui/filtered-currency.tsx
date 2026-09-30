import React from 'react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { cn } from '@/lib/utils';

export interface FilteredCurrencyProps {
  idr?: number | null;
  usd?: number | null;
  className?: string;
  usdClassName?: string;
}

/**
 * Komponen reusable untuk menampilkan nominal mata uang dengan aturan filter:
 * - Jika nominal IDR === 0 dan nominal USD > 0: tampilkan hanya nominal USD.
 * - Jika nominal USD === 0: tampilkan hanya nominal IDR.
 * - Jika keduanya bernilai > 0: tampilkan nominal IDR dan USD.
 */
export function FilteredCurrency({
  idr,
  usd,
  className,
  usdClassName = 'text-[11px] text-amber-600 font-semibold mt-0.5',
}: FilteredCurrencyProps) {
  const numIdr = Number(idr ?? 0);
  const numUsd = Number(usd ?? 0);

  if (numIdr === 0 && numUsd > 0) {
    return (
      <span className={cn('text-amber-600 font-semibold', className)}>
        {currenciesFormat('usd', numUsd)}
      </span>
    );
  }

  if (numUsd === 0) {
    return <span className={className}>{currenciesFormat('idr', numIdr)}</span>;
  }

  return (
    <div className={className}>
      <div>{currenciesFormat('idr', numIdr)}</div>
      <div className={usdClassName}>{currenciesFormat('usd', numUsd)}</div>
    </div>
  );
}

export default FilteredCurrency;
