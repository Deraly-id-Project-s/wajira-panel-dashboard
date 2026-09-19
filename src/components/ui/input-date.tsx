'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface InputDateProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: Date | string | null;
  onChange?: (event: React.ChangeEvent<HTMLInputElement> | any) => void;
  onValueChange?: (value: string, date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  id?: string;
  name?: string;
  fromYear?: number;
  toYear?: number;
  displayFormat?: string;
  outputFormat?: string;
  clearable?: boolean;
}

const parseDateValue = (val: Date | string | null | undefined): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      const parsed = new Date(y, m - 1, d);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

export const InputDate = React.forwardRef<HTMLInputElement, InputDateProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      placeholder = 'Pilih tanggal',
      disabled = false,
      readOnly = false,
      className,
      id,
      name,
      fromYear = 1900,
      toYear = new Date().getFullYear() + 10,
      displayFormat = 'dd MMM yyyy',
      outputFormat = 'yyyy-MM-dd',
      clearable = false,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const dateValue = React.useMemo(() => parseDateValue(value), [value]);

    const formattedDisplay = React.useMemo(() => {
      if (!dateValue) return '';
      try {
        return format(dateValue, displayFormat, { locale: localeId });
      } catch {
        return '';
      }
    }, [dateValue, displayFormat]);

    const handleSelect = (selectedDate?: Date) => {
      let formattedStr = '';
      if (selectedDate) {
        try {
          formattedStr = format(selectedDate, outputFormat);
        } catch {
          formattedStr = '';
        }
      }

      onValueChange?.(formattedStr, selectedDate);

      if (onChange) {
        const syntheticEvent = {
          target: { name: name || '', value: formattedStr, id: id || '' },
          currentTarget: { name: name || '', value: formattedStr, id: id || '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSelect(undefined);
    };

    const currentStringValue = dateValue ? format(dateValue, outputFormat) : '';

    return (
      <div className="relative flex w-full items-center">
        <input
          type="hidden"
          ref={ref}
          id={id}
          name={name}
          value={currentStringValue}
          {...props}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || readOnly}
              className={cn(
                'w-full sm:w-full justify-start text-left font-normal h-9 px-3',
                !dateValue && 'text-muted-foreground',
                className
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">
                {formattedDisplay || placeholder}
              </span>
              {clearable && dateValue && !disabled && !readOnly && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="ml-1 rounded-full p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[calc(100vw-2rem)] max-w-max overflow-x-auto rounded-md p-0 shadow-lg sm:w-auto"
            align="start"
            sideOffset={8}
            collisionPadding={16}
          >
            <div className="min-w-max">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={handleSelect}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={fromYear}
                toYear={toYear}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

InputDate.displayName = 'InputDate';
