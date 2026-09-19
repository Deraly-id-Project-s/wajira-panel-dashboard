import * as React from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { useDitlantasProcessOptions } from '@/hooks/useVehicleDocument';
import type { VehicleDocumentPayload, VehicleDocumentSummary } from '@/@types/vehicle-document.types';

interface FormValues {
  ditlantasProcessId: string;
  receiptDate?: Date;
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: VehicleDocumentPayload) => Promise<void> | void;
  initialData?: VehicleDocumentSummary;
  isSubmitting?: boolean;
  title: string;
  descriptionText: string;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toPayloadDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function VehicleDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting = false,
  title,
  descriptionText,
}: Props) {
  const [ditlantasSearch, setDitlantasSearch] = React.useState('');
  const ditlantasLookup = useDitlantasProcessOptions(ditlantasSearch);

  const { control, register, reset, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      ditlantasProcessId: '',
      receiptDate: undefined,
      description: '',
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      ditlantasProcessId: initialData ? String(initialData.ditlantasProcessId || '') : '',
      receiptDate: initialData ? toDateValue(initialData.receiptDate) : undefined,
      description: initialData?.description || '',
    });
  }, [initialData, open, reset]);

  const ditlantasOptions = (ditlantasLookup.data ?? []).map((item) => ({
    value: String(item.id),
    label: `${item.code} - ${item.vendorName}`,
    subtitle: item.vendorName || undefined,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] rounded-md border-0 p-0 shadow-2xl">
        <div className="rounded-md bg-white p-8">
          <DialogHeader className="mb-6 text-left">
            <DialogTitle className="text-[28px] font-semibold text-slate-900">{title}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">{descriptionText}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(async (values) => {
              await onSubmit({
                ditlantasProcessId: Number(values.ditlantasProcessId),
                receiptDate: toPayloadDate(values.receiptDate),
                description: values.description.trim(),
              });
            })}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label className="text-[18px] font-medium text-slate-900">Proses Ditlantas</Label>
              <Controller
                name="ditlantasProcessId"
                control={control}
                rules={{ required: 'Proses Ditlantas wajib dipilih' }}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ditlantasOptions}
                    loading={ditlantasLookup.isLoading}
                    onSearchChange={setDitlantasSearch}
                    placeholder="Pilih kode proses Ditlantas"
                    searchPlaceholder="Cari proses Ditlantas..."
                    emptyText="Proses Ditlantas tidak ditemukan."
                    className="h-14 rounded-md border-slate-200 text-lg"
                  />
                )}
              />
              {errors.ditlantasProcessId ? <p className="text-xs text-red-500">{errors.ditlantasProcessId.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[18px] font-medium text-slate-900">Tanggal Terima</Label>
              <Controller
                name="receiptDate"
                control={control}
                rules={{ required: 'Tanggal terima wajib diisi' }}
                render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" className="h-14 rounded-md border-slate-200 text-lg" />}
              />
              {errors.receiptDate ? <p className="text-xs text-red-500">{errors.receiptDate.message as string}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[18px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                rows={5}
                placeholder="Type your message here."
                className="rounded-md border-slate-200 px-5 py-4 text-lg"
                {...register('description', { required: 'Keterangan wajib diisi' })}
              />
              {errors.description ? <p className="text-xs text-red-500">{errors.description.message}</p> : null}
            </div>

            <div className="space-y-4 pt-2">
              <Button type="submit" disabled={isSubmitting} className="h-16 w-full rounded-[18px] bg-[#1f3b5b] text-[20px] font-medium hover:bg-[#18304a]">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-16 w-full rounded-[18px] border-slate-200 text-[20px] font-medium" disabled={isSubmitting}>
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
