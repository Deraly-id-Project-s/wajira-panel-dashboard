'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface InputDateTimeProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
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

const parseDateTimeValue = (val: Date | string | null | undefined): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

export const InputDateTime = React.forwardRef<HTMLInputElement, InputDateTimeProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      placeholder = 'Pilih tanggal & waktu',
      disabled = false,
      readOnly = false,
      className,
      id,
      name,
      fromYear = 1900,
      toYear = new Date().getFullYear() + 10,
      displayFormat = 'dd MMM yyyy HH:mm',
      outputFormat = "yyyy-MM-dd'T'HH:mm",
      clearable = false,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const dateValue = React.useMemo(() => parseDateTimeValue(value), [value]);

    const hours = dateValue ? dateValue.getHours() : 0;
    const minutes = dateValue ? dateValue.getMinutes() : 0;

    const formattedDisplay = React.useMemo(() => {
      if (!dateValue) return '';
      try {
        return format(dateValue, displayFormat, { locale: localeId });
      } catch {
        return '';
      }
    }, [dateValue, displayFormat]);

    const emitChange = (selectedDate?: Date) => {
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
    };

    const handleDateSelect = (selectedDate?: Date) => {
      if (!selectedDate) {
        emitChange(undefined);
        return;
      }
      const newDate = new Date(selectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      emitChange(newDate);
    };

    const handleTimeChange = (newHours: number, newMinutes: number) => {
      const baseDate = dateValue ? new Date(dateValue) : new Date();
      baseDate.setHours(newHours);
      baseDate.setMinutes(newMinutes);
      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);
      emitChange(baseDate);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      emitChange(undefined);
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
                'w-full justify-start text-left font-normal h-9 px-3',
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
            className="w-auto p-0 shadow-lg rounded-md border border-slate-200"
            align="start"
            sideOffset={8}
          >
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={fromYear}
              toYear={toYear}
            />
            <div className="flex items-center gap-2 border-t border-slate-100 p-3 bg-slate-50/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Waktu:</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <select
                  value={hours}
                  onChange={(e) => handleTimeChange(Number(e.target.value), minutes)}
                  className="h-8 w-14 rounded-md border border-slate-200 bg-white text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const val = String(i).padStart(2, '0');
                    return (
                      <option key={val} value={i}>
                        {val}
                      </option>
                    );
                  })}
                </select>
                <span className="text-xs font-bold text-slate-400">:</span>
                <select
                  value={minutes}
                  onChange={(e) => handleTimeChange(hours, Number(e.target.value))}
                  className="h-8 w-14 rounded-md border border-slate-200 bg-white text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {Array.from({ length: 60 }).map((_, i) => {
                    const val = String(i).padStart(2, '0');
                    return (
                      <option key={val} value={i}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

InputDateTime.displayName = 'InputDateTime';
