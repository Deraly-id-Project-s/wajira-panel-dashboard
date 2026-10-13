'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

export interface SearchableMultipleSelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface SearchableMultipleSelectProps {
  values?: string[];
  onChange: (values: string[]) => void;
  options: SearchableMultipleSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  onSearchChange?: (value: string) => void;
  className?: string;
  disabledValues?: string[];
  disabledLabel?: string;
}

export function SearchableMultipleSelect({
  values = [],
  onChange,
  options,
  placeholder = 'Pilih beberapa opsi...',
  searchPlaceholder = 'Cari opsi...',
  emptyText = 'Data tidak ditemukan.',
  disabled = false,
  loading = false,
  onSearchChange,
  className,
  disabledValues = [],
  disabledLabel = 'Sudah digunakan',
}: SearchableMultipleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [persistedOptions, setPersistedOptions] = React.useState<Map<string, SearchableMultipleSelectOption>>(
    new Map(),
  );

  React.useEffect(() => {
    setPersistedOptions((prev) => {
      const next = new Map(prev);
      options.forEach((opt) => {
        next.set(opt.value, opt);
      });
      return next;
    });
  }, [options]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        `${option.label} ${option.subtitle ?? ''}`.toLowerCase().includes(normalizedQuery),
      )
    : options;

  React.useEffect(() => {
    if (!open && query !== '') {
      setQuery('');
      onSearchChange?.('');
    }
  }, [open, query, onSearchChange]);

  const handleToggle = React.useCallback(
    (optionValue: string) => {
      if (values.includes(optionValue)) {
        onChange(values.filter((v) => v !== optionValue));
      } else {
        onChange([...values, optionValue]);
      }
    },
    [values, onChange],
  );

  const handleRemove = React.useCallback(
    (optionValue: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      onChange(values.filter((v) => v !== optionValue));
    },
    [values, onChange],
  );

  const selectedOptions = React.useMemo(() => {
    return values.map((val) => {
      return (
        options.find((opt) => opt.value === val) ??
        persistedOptions.get(val) ?? {
          value: val,
          label: val,
        }
      );
    });
  }, [values, options, persistedOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-controls="searchable-multi-select-list"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-slate-300',
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground select-none text-xs sm:text-sm">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 shadow-2xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate max-w-[200px] sm:max-w-[280px]" title={opt.label}>
                    {opt.label}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Hapus ${opt.label}`}
                      onClick={(e) => handleRemove(opt.value, e)}
                      className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3 shrink-0" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[320px] p-0 pointer-events-auto flex flex-col z-[10050]"
        align="start"
      >
        <Command shouldFilter={false} className="flex-1 min-h-0">
          <div className="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
            <Search className="size-4 shrink-0 opacity-50" />
            <input
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                const nextValue = e.target.value;
                setQuery(nextValue);
                onSearchChange?.(nextValue);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filteredOptions.length > 0) {
                  event.preventDefault();
                  const firstEligible = filteredOptions.find((opt) => !disabledValues.includes(opt.value));
                  if (firstEligible) {
                    handleToggle(firstEligible.value);
                  }
                }
              }}
              className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList id="searchable-multi-select-list" className="max-h-64 flex-1 min-h-0 overflow-y-auto">
            <CommandEmpty>{loading ? 'Memuat...' : emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);
                const isDisabledOption = disabledValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={isDisabledOption}
                    onSelect={() => {
                      if (!isDisabledOption) {
                        handleToggle(option.value);
                      }
                    }}
                    className={cn(
                      'flex items-start gap-2 py-1.5 cursor-pointer',
                      isDisabledOption && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white',
                      )}
                    >
                      <Check className={cn('h-3 w-3 stroke-[3]', isSelected ? 'opacity-100' : 'opacity-0')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs sm:text-sm font-medium text-slate-800">
                        {option.label}
                      </div>
                      {option.subtitle ? (
                        <div className="text-[11px] text-muted-foreground">{option.subtitle}</div>
                      ) : null}
                    </div>
                    {isDisabledOption ? (
                      <span className="ml-auto shrink-0 text-xs text-rose-600 font-medium">
                        {disabledLabel}
                      </span>
                    ) : isSelected ? (
                      <span className="ml-auto shrink-0 text-xs text-emerald-600 font-medium">Terpilih</span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {loading && <LoadingState variant="page" />}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
