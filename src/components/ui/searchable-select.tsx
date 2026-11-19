import * as React from 'react';
import { Check, ChevronsUpDown, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';

export interface SearchableSelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface SearchableSelectProps {
  value?: string | number | null;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  onSearchChange?: (value: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
  onActionClick?: () => void;
  actionLabel?: string;
  disabledValues?: string[];
  disabledLabel?: string;
  allowClear?: boolean;
  clearLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTriggerClick?: () => void;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'Cari data...',
  emptyText = 'Data tidak ditemukan.',
  disabled,
  loading,
  onSearchChange,
  onLoadMore,
  hasMore = false,
  className,
  onActionClick,
  actionLabel,
  disabledValues = [],
  disabledLabel = 'Sudah ditambahkan',
  allowClear,
  clearLabel = '-- Hapus Pilihan --',
  open: controlledOpen,
  onOpenChange,
  onTriggerClick,
}: SearchableSelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
      if (nextOpen) {
        onTriggerClick?.();
      }
    },
    [isControlled, onOpenChange, onTriggerClick]
  );

  const [query, setQuery] = React.useState('');
  const [persistedSelectedOption, setPersistedSelectedOption] = React.useState<SearchableSelectOption | null>(null);

  const stringValue = value !== undefined && value !== null ? String(value) : '';

  const selectedOption = React.useMemo(() => {
    return (
      options.find((option) => option.value === stringValue) ??
      (persistedSelectedOption?.value === stringValue ? persistedSelectedOption : undefined)
    );
  }, [options, stringValue, persistedSelectedOption]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      `${option.label} ${option.subtitle ?? ''}`.toLowerCase().includes(normalizedQuery)
    );
  }, [options, normalizedQuery]);

  React.useEffect(() => {
    if (stringValue) {
      const matchedOption = options.find((option) => option.value === stringValue);
      if (matchedOption) {
        setPersistedSelectedOption(matchedOption);
      }
    } else {
      setPersistedSelectedOption(null);
    }
  }, [options, stringValue]);

  React.useEffect(() => {
    if (!open && query !== '') {
      setQuery('');
      onSearchChange?.('');
    }
  }, [open, query, onSearchChange]);

  const selectOption = React.useCallback(
    (option: SearchableSelectOption) => {
      setPersistedSelectedOption(option);
      onChange(option.value);
      if (!isControlled) {
        setUncontrolledOpen(false);
      }
      onOpenChange?.(false);
    },
    [onChange, isControlled, onOpenChange]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="searchable-select-list"
          disabled={disabled}
          onClick={() => {
            onTriggerClick?.();
          }}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 min-w-0 font-normal',
            !selectedOption && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[220px] p-0 pointer-events-auto flex flex-col z-[100]"
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
                  selectOption(filteredOptions[0]);
                }
              }}
              className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList
            id="searchable-select-list"
            className="flex-1 min-h-0 max-h-60 overflow-y-auto"
            onScroll={(event) => {
              const target = event.currentTarget;
              const hasScrollableContent = target.scrollHeight > target.clientHeight;
              const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 20;
              if (hasScrollableContent && isNearBottom && hasMore && !loading && onLoadMore) {
                onLoadMore();
              }
            }}
          >
            {loading && !hasMore && (
              <div className="p-1.5 flex items-center justify-center text-xs text-muted-foreground gap-1.5 border-b bg-slate-50/50">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Memuat data...</span>
              </div>
            )}
            {allowClear && stringValue && (
              <div className="border-b p-1">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setPersistedSelectedOption(null);
                    if (!isControlled) {
                      setUncontrolledOpen(false);
                    }
                    onOpenChange?.(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-slate-100 rounded italic"
                >
                  {clearLabel}
                </button>
              </div>
            )}
            <CommandEmpty>{loading ? 'Memuat...' : emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={disabledValues.includes(option.value)}
                  onSelect={() => !disabledValues.includes(option.value) && selectOption(option)}
                  className="flex items-start gap-2 cursor-pointer py-1.5 px-2.5 text-sm"
                >
                  <Check
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      stringValue === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{option.label}</div>
                    {option.subtitle ? (
                      <div className="text-xs text-muted-foreground truncate">{option.subtitle}</div>
                    ) : null}
                  </div>
                  {disabledValues.includes(option.value) ? (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {disabledLabel}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {loading && hasMore && <LoadingState variant="page" />}
          </CommandList>
        </Command>
        {onActionClick && (
          <div className="border-t p-1.5 bg-gray-50 flex justify-center shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 justify-center h-8 gap-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick();
                if (!isControlled) {
                  setUncontrolledOpen(false);
                }
                onOpenChange?.(false);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {actionLabel || 'Tambah Data Baru'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
