'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateUI } from '@/lib/utils/date';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
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
  let dateValue = typeof value === 'string' ? new Date(value) : (value as Date | undefined | null);

  // Fallback if date is invalid to prevent "Invalid time value" crashes
  if (dateValue && (isNaN(dateValue.getTime()) || !(dateValue instanceof Date))) {
    dateValue = undefined;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" id={id} variant={'outline'} className={cn('w-full sm:w-full justify-start overflow-hidden text-left font-normal', !dateValue && 'text-muted-foreground', className)} disabled={disabled}>
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{dateValue ? formatDateUI(dateValue) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-max overflow-x-auto rounded-md p-0 shadow-lg sm:w-auto" align="start" sideOffset={8} collisionPadding={16}>
        <div className="min-w-max">
        <Calendar
          mode="single"
          selected={dateValue || undefined}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
        />
        </div>
      </PopoverContent>
    </Popover>
  );
}
