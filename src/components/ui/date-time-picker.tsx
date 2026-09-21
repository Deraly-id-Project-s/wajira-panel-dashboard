'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal & waktu',
  disabled,
  className,
  id,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
}: {
  value?: Date | string | null;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  fromYear?: number;
  toYear?: number;
}) {
  const [open, setOpen] = React.useState(false);

  // Ensure value is a valid Date object if string/null is passed
  let dateValue = typeof value === 'string'
    ? new Date(value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value)
    : (value as Date | undefined | null);

  // Fallback if date is invalid to prevent "Invalid time value" crashes
  if (dateValue && (isNaN(dateValue.getTime()) || !(dateValue instanceof Date))) {
    dateValue = undefined;
  }

  const hours = dateValue ? dateValue.getHours() : 0;
  const minutes = dateValue ? dateValue.getMinutes() : 0;

  const handleDateSelect = (selectedDate?: Date) => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange?.(newDate);
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const baseDate = dateValue ? new Date(dateValue) : new Date();
    baseDate.setHours(newHours);
    baseDate.setMinutes(newMinutes);
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);
    onChange?.(baseDate);
  };

  const formatDateTimeUI = (date: Date) => {
    return format(date, 'dd MMM yyyy HH:mm');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          className={cn(
            'w-full sm:w-full justify-start text-left font-normal h-9 px-3',
            !dateValue && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          {dateValue ? formatDateTimeUI(dateValue) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg rounded-md border border-slate-200" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={dateValue || undefined}
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
                return <option key={val} value={i}>{val}</option>;
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
                return <option key={val} value={i}>{val}</option>;
              })}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
