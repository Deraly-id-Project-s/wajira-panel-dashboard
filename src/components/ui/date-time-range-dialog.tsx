import * as React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';

interface DateTimeRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  startLabel?: string;
  endLabel?: string;
  initialStart?: Date | string | null;
  initialEnd?: Date | string | null;
  onSubmit: (value: { start: Date; end: Date }) => void | Promise<void>;
  isSubmitting?: boolean;
}

const toValidDate = (value?: Date | string | null) => {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : new Date(value);
  const str = typeof value === 'string' && value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function DateTimeRangeDialog({
  open,
  onOpenChange,
  title,
  description,
  startLabel = 'Waktu Mulai',
  endLabel = 'Waktu Selesai',
  initialStart,
  initialEnd,
  onSubmit,
  isSubmitting = false,
}: DateTimeRangeDialogProps) {
  const [start, setStart] = React.useState<Date>();
  const [end, setEnd] = React.useState<Date>();
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setStart(toValidDate(initialStart));
    setEnd(toValidDate(initialEnd));
    setError('');
  }, [initialEnd, initialStart, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!start || !end) {
      setError('Waktu mulai dan waktu selesai wajib diisi.');
      return;
    }
    if (end.getTime() < start.getTime()) {
      setError('Waktu selesai tidak boleh lebih awal dari waktu mulai.');
      return;
    }

    setError('');
    await onSubmit({ start, end });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent closeOnInteractOutside={false} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-time-range-start">{startLabel}</Label>
              <DateTimePicker
                id="date-time-range-start"
                value={start}
                onChange={setStart}
                disabled={isSubmitting}
                placeholder="Pilih waktu mulai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-time-range-end">{endLabel}</Label>
              <DateTimePicker
                id="date-time-range-end"
                value={end}
                onChange={setEnd}
                disabled={isSubmitting}
                placeholder="Pilih waktu selesai"
              />
            </div>
          </div>

          {error ? <p role="alert" className="text-sm font-medium text-red-600">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="btn-primary!">
              {isSubmitting ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : <>Simpan</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
