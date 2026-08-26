import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { useDrivers } from '@/hooks/useDriver';
import { useArmadas } from '@/hooks/useArmada';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { GoodsIssueEquipment } from '@/types/goods-issue-equipment.types';
import { goodsIssueEquipmentSchema, type GoodsIssueEquipmentFormValues } from '@/schemas/goods-issue-equipment.schema';

interface GoodsIssueEquipmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoodsIssueEquipmentFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsIssueEquipment | null;
}

const toDateValue = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function GoodsIssueEquipmentFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
}: GoodsIssueEquipmentFormModalProps) {
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  const debouncedDriverSearch = useDebouncedValue(driverSearch, 300);
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch, 300);

  const driversQuery = useDrivers({
    search: debouncedDriverSearch || undefined,
    company_id: 4,
    page: 1,
    perPage: 50,
  });

  const armadasQuery = useArmadas({
    search: debouncedVehicleSearch || undefined,
    page: 1,
    perPage: 50,
  });

  const driverOptions = useMemo(() => {
    const data = driversQuery.data?.data ?? [];
    return data.map((driver) => ({
      value: String(driver.id),
      label: driver.name || '',
      subtitle: driver.code ? `Kode: ${driver.code}` : undefined,
    }));
  }, [driversQuery.data?.data]);

  const vehicleOptions = useMemo(() => {
    const data = armadasQuery.data?.data ?? [];
    return data.map((armada) => ({
      value: String(armada.id),
      label: armada.registrationNumber || '',
      subtitle: armada.type ? `Tipe: ${armada.type}` : undefined,
    }));
  }, [armadasQuery.data?.data]);

  const form = useForm<GoodsIssueEquipmentFormValues>({
    resolver: zodResolver(goodsIssueEquipmentSchema),
    defaultValues: {
      vehicleFleetId: 0,
      driverId: 0,
      transactionDate: '',
      description: '',
      category: 'equipped',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      vehicleFleetId: initialData?.vehicleFleetId ?? 0,
      driverId: initialData?.driverId ?? 0,
      transactionDate: initialData?.transactionDate ?? '',
      description: initialData?.description ?? '',
      category: (initialData?.category as any) ?? 'equipped',
    });
    setDriverSearch('');
    setVehicleSearch('');
  }, [form, initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-md border-none p-0 shadow-2xl sm:max-w-[440px]">
        <div className="px-6 py-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">
              {initialData ? 'Edit Pengeluaran Perlengkapan' : 'Input Pengeluaran Perlengkapan'}
            </DialogTitle>
            <p className="text-sm text-slate-500">Masukkan detail pengeluaran perlengkapan kendaraan</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kode Pengeluaran</Label>
              <div className="flex h-10 items-center rounded-[10px] border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-400">
                {initialData?.code || 'Auto Generate'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Tanggal Pengeluaran</Label>
              <Controller
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <DatePicker
                    value={toDateValue(field.value)}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Pick a Date"
                    className="h-10 rounded-[10px] border-slate-200 px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.transactionDate ? (
                <p className="text-xs text-red-600">{form.formState.errors.transactionDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nama Driver</Label>
              <Controller
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={driverOptions}
                    placeholder={driversQuery.isLoading ? 'Memuat driver...' : 'Masukkan nama driver'}
                    searchPlaceholder="Cari driver..."
                    emptyText="Driver tidak ditemukan."
                    loading={driversQuery.isLoading}
                    onSearchChange={setDriverSearch}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.driverId ? (
                <p className="text-xs text-red-600">{form.formState.errors.driverId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Nomor Polisi</Label>
              <Controller
                control={form.control}
                name="vehicleFleetId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? String(field.value) : ''}
                    onChange={(value) => field.onChange(Number(value))}
                    options={vehicleOptions}
                    placeholder={armadasQuery.isLoading ? 'Memuat armada...' : 'Masukkan nomor polisi'}
                    searchPlaceholder="Cari nomor polisi..."
                    emptyText="Armada tidak ditemukan."
                    loading={armadasQuery.isLoading}
                    onSearchChange={setVehicleSearch}
                    className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]"
                  />
                )}
              />
              {form.formState.errors.vehicleFleetId ? (
                <p className="text-xs text-red-600">{form.formState.errors.vehicleFleetId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Kategori</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 rounded-[10px] border-slate-200 bg-white px-3 text-[15px]">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipped">Perlengkapan Armada</SelectItem>
                      <SelectItem value="maintenance">Maintenance Armada</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category ? (
                <p className="text-xs text-red-600">{form.formState.errors.category.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-slate-900">Keterangan</Label>
              <Textarea
                {...form.register('description')}
                rows={3}
                placeholder="Contoh: Barang sudah diterima"
                className="rounded-[10px] border-slate-200 px-3 py-2 text-[15px]"
              />
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full rounded-[8px] bg-[#1f4163] text-[16px] font-medium hover:bg-[#183552]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 w-full rounded-[8px] border-slate-300 text-[16px] font-medium"
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
