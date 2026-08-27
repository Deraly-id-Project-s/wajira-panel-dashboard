import * as React from 'react';
import { Search } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { doEkspedisiEditSchema, type DoEkspedisiEditSchema } from '@/schema/do-ekspedisi.schema';

export interface DOEkspedisiEditValues extends DoEkspedisiEditSchema {}

interface DOEkspedisiEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DoEkspedisi | null;
  nextCode?: string;
  vehicleOptions: SearchableSelectOption[];
  driverOptions: SearchableSelectOption[];
  vehicleLoading?: boolean;
  driverLoading?: boolean;
  onVehicleSearch: (value: string) => void;
  onDriverSearch: (value: string) => void;
  onSubmit: (values: DOEkspedisiEditValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function DOEkspedisiEditDialog({
  open,
  onOpenChange,
  item,
  nextCode,
  vehicleOptions,
  driverOptions,
  vehicleLoading = false,
  driverLoading = false,
  onVehicleSearch,
  onDriverSearch,
  onSubmit,
  isSubmitting = false,
}: DOEkspedisiEditDialogProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<DOEkspedisiEditValues>({
    resolver: zodResolver(doEkspedisiEditSchema),
    defaultValues: {
      date: item?.date ? new Date(item.date) : undefined,
      vehicleId: item?.vehicleId ? String(item.vehicleId) : '',
      driverId: item?.driverId ? String(item.driverId) : '',
      driverNote: item?.driverNote ?? '',
    },
  });

  React.useEffect(() => {
    reset({
      date: item?.date ? new Date(item.date) : undefined,
      vehicleId: item?.vehicleId ? String(item.vehicleId) : '',
      driverId: item?.driverId ? String(item.driverId) : '',
      driverNote: item?.driverNote ?? '',
    });
  }, [item, reset]);

  const mergedVehicleOptions = React.useMemo(() => {
    const selectedVehicleType = (item?.orderList?.vehicleType || item?.vehicle?.type || '').trim().toLowerCase();
    const filteredVehicleOptions = selectedVehicleType
      ? vehicleOptions.filter((option) => String(option.subtitle ?? '').trim().toLowerCase() === selectedVehicleType)
      : vehicleOptions;

    if (!item?.vehicle) return filteredVehicleOptions;

    const currentVehicleOption = { value: String(item.vehicleId), label: item.vehicle.registrationNumber, subtitle: item.vehicle.type };
    if (filteredVehicleOptions.some((option) => option.value === String(item.vehicleId))) return filteredVehicleOptions;

    return [currentVehicleOption, ...filteredVehicleOptions];
  }, [item?.orderList?.vehicleType, item?.vehicle, item?.vehicleId, vehicleOptions]);

  const mergedDriverOptions = React.useMemo(() => {
    if (!item?.driver || driverOptions.some((option) => option.value === String(item.driverId))) return driverOptions;
    return [{ value: String(item.driverId), label: item.driver.name, subtitle: item.driver.phone ?? undefined }, ...driverOptions];
  }, [driverOptions, item?.driver, item?.driverId]);

  const vehicleId = watch('vehicleId');

  const selectedVehicle = React.useMemo(() => {
    return mergedVehicleOptions.find((option) => option.value === vehicleId);
  }, [mergedVehicleOptions, vehicleId]);

  const vehicleTypeDisplay = React.useMemo(() => {
    const rawType = selectedVehicle?.subtitle || item?.orderList?.vehicleType || item?.vehicle?.type || '';
    if (!rawType) return '-';
    return rawType.charAt(0).toUpperCase() + rawType.slice(1);
  }, [selectedVehicle?.subtitle, item?.orderList?.vehicleType, item?.vehicle?.type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[384px] overflow-y-auto rounded-lg p-6" showCloseButton={false}>
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-base font-semibold text-slate-950">Lengkapi DO Ekspedisi</DialogTitle>
          <DialogDescription>DO dibuat otomatis dari item order. Lengkapi armada, driver, dan tanggal keberangkatan.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>ID Order List</Label>
            <Input readOnly value={item?.orderCode || '-'} className="h-9 rounded-lg border-slate-200 bg-white text-slate-500" />
          </div>

          <div className="space-y-2">
            <Label>Kode DO</Label>
            <Input readOnly value={item?.doCode || nextCode || '-'} className="h-9 rounded-lg border-slate-200 bg-white text-slate-500" />
          </div>

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Controller
              control={control}
              name="date"
              rules={{ required: 'Tanggal wajib diisi' }}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick a date"
                  className={`h-9 rounded-lg border-slate-200 ${errors.date ? 'border-red-500' : ''}`}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Nama Driver</Label>
            <Controller
              control={control}
              name="driverId"
              rules={{ required: 'Driver wajib dipilih' }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={mergedDriverOptions}
                  placeholder="Masukkan nama driver"
                  searchPlaceholder="Cari driver..."
                  loading={driverLoading}
                  onSearchChange={onDriverSearch}
                  className={`h-9 rounded-lg border-slate-200 ${errors.driverId ? 'border-red-500' : ''}`}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Nomor Polisi</Label>
            <Controller
              control={control}
              name="vehicleId"
              rules={{ required: 'Armada wajib dipilih' }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={mergedVehicleOptions}
                  placeholder="contoh: AB 000 XX"
                  searchPlaceholder="Cari nomor polisi..."
                  loading={vehicleLoading}
                  onSearchChange={onVehicleSearch}
                  className={`h-9 rounded-lg border-slate-200 ${errors.vehicleId ? 'border-red-500' : ''}`}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipe Armada</Label>
            <Input readOnly value={vehicleTypeDisplay} className="h-9 rounded-lg border-slate-200 bg-white text-slate-500" />
          </div>

          <div className="space-y-2">
            <Label>Atensi Driver</Label>
            <Textarea rows={4} placeholder="Type your message here." className="rounded-lg border-slate-200" {...register('driverNote')} />
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-9 w-full rounded-lg bg-[#1f4163] hover:bg-[#183552]">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)} className="h-9 w-full rounded-lg">
            Batal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
