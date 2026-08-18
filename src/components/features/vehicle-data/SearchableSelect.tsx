import * as React from 'react';
import { Check, ChevronsUpDown, Search, Plus } from 'lucide-react';
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

interface SearchableSelectProps {
  value?: string;
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
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [persistedSelectedOption, setPersistedSelectedOption] = React.useState<SearchableSelectOption | null>(null);
  const selectedOption = options.find((option) => option.value === value)
    ?? (persistedSelectedOption?.value === value ? persistedSelectedOption : undefined);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => `${option.label} ${option.subtitle ?? ''}`.toLowerCase().includes(normalizedQuery))
    : options;

  React.useEffect(() => {
    const matchedOption = options.find((option) => option.value === value);
    if (matchedOption) {
      setPersistedSelectedOption(matchedOption);
    }
  }, [options, value]);

  React.useEffect(() => {
    if (!open && query !== '') {
      setQuery('');
      onSearchChange?.('');
    }
  }, [open, query, onSearchChange]);

  const selectOption = React.useCallback((option: SearchableSelectOption) => {
    setPersistedSelectedOption(option);
    onChange(option.value);
    setOpen(false);
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !selectedOption && 'text-muted-foreground', className)}
        >
          <span className="truncate text-left">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto flex flex-col"
        align="start"
      >
        <Command shouldFilter={false} className="flex-1 min-h-0">
          <div className="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
            <Search className="size-4 shrink-0 opacity-50" />
            <input autoComplete="off"
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
            className="flex-1 min-h-0"
            onScroll={(event) => {
              const target = event.currentTarget;
              const hasScrollableContent = target.scrollHeight > target.clientHeight;
              const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 20;
              if (hasScrollableContent && isNearBottom && hasMore && !loading && onLoadMore) {
                onLoadMore();
              }
            }}
          >
            <CommandEmpty>{loading ? 'Memuat...' : emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => selectOption(option)}
                  className="flex items-start gap-2 cursor-pointer py-1"
                >
                  <Check className={cn('mt-0.5 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0">
                    <div className="truncate">{option.label}</div>
                    {option.subtitle ? <div className="text-xs text-muted-foreground">{option.subtitle}</div> : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {loading && hasMore && (
              <LoadingState variant="page" />
            )}
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
                setOpen(false);
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
