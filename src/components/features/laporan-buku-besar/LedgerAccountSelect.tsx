import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Account } from '@/@types/account.types';

export const formatAccountOptionLabel = (account?: Account | null): string => {
  if (!account) return '';
  const rawType = account.type || (account as any)?.account_type;
  let typeLabel = '';
  if (rawType) {
    const lower = String(rawType).toLowerCase();
    if (lower === 'credit' || lower === 'kredit') typeLabel = 'Kredit';
    else if (lower === 'debet' || lower === 'debit') typeLabel = 'Debet';
    else typeLabel = lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  const prefix = typeLabel ? `[${typeLabel}] ` : '';
  return `${prefix}${account.code} - ${account.name}`;
};

interface LedgerAccountSelectProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  options: Account[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  showAllOption?: boolean;
}

export function LedgerAccountSelect({
  value,
  onValueChange,
  options,
  disabled,
  className,
  triggerClassName,
  placeholder,
  showAllOption = true,
}: LedgerAccountSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => Number(option.id) === Number(value)) || null,
    [options, value],
  );

  const defaultPlaceholder = showAllOption ? 'Semua akun' : 'Pilih akun...';
  const effectivePlaceholder = placeholder ?? defaultPlaceholder;

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => {
      const formatted = formatAccountOptionLabel(option).toLowerCase();
      return (
        formatted.includes(query) ||
        `${option.code} ${option.name}`.toLowerCase().includes(query)
      );
    });
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn('relative w-full min-w-0', className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          'h-9 w-full sm:w-full min-w-0 justify-between rounded-md border-slate-200 bg-white px-3 text-left text-sm font-normal hover:bg-white',
          !selectedOption && 'text-slate-400',
          triggerClassName,
        )}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate flex-1 text-left">
          {selectedOption ? formatAccountOptionLabel(selectedOption) : effectivePlaceholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[130] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <Input
              placeholder="Cari akun..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {showAllOption ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                onClick={() => {
                  onValueChange(null);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value === null ? 'opacity-100 text-slate-800' : 'opacity-0',
                  )}
                />
                <span className="font-medium text-slate-700">Semua akun</span>
              </button>
            ) : null}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                Data akun tidak ditemukan.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = Number(option.id) === Number(value);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                    onClick={() => {
                      onValueChange(Number(option.id));
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100 text-slate-800' : 'opacity-0',
                      )}
                    />
                    <span className="break-words font-medium leading-snug text-slate-700">
                      {formatAccountOptionLabel(option)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
