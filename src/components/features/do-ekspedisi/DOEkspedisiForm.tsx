import React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { useRouter } from 'next/router';
import type { DoEkspedisi, DoEkspedisiItem } from '@/@types/do-ekspedisi.types';
import { formatCurrency } from '@/lib/utils/currency';

interface DOEkspedisiDestinationFormData {
  id?: string;
  destination: string;
  driverNote: string;
  mapsUrl: string;
}

export interface DOEkspedisiFormData {
  date: Date | undefined;
  primaryDestinationId?: string;
  vehicleId: string;
  driverId: string;
  customerId: string;
  loadingIn: string;
  loadingOut: string;
  destination: string;
  invoiceFee: string;
  additionalCostFee: string;
  otherFee: string;
  driverFee: string;
  driverNote: string;
  mapsUrl: string;
  destinationStops: DOEkspedisiDestinationFormData[];
}

interface DOEkspedisiFormProps {
  mode: 'create' | 'edit';
  initialExpedition?: DoEkspedisi | null;
  initialItem?: DoEkspedisiItem | null;
  vehicleOptions: SearchableSelectOption[];
  driverOptions: SearchableSelectOption[];
  customerOptions: SearchableSelectOption[];
  vehicleLoading?: boolean;
  driverLoading?: boolean;
  customerLoading?: boolean;
  onVehicleSearch: (value: string) => void;
  onDriverSearch: (value: string) => void;
  onCustomerSearch: (value: string) => void;
  onSubmit: (data: DOEkspedisiFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

const toNumericValue = (value: string) => {
  const sanitized = value.replace(/[^\d]/g, '');
  return sanitized ? Number(sanitized) : 0;
};

const toInputCurrency = (value?: number | null) => {
  if (!value) return '';
  return String(Math.round(value));
};

const computePreview = (invoiceFee: number) => ({
  ppn: invoiceFee * 0.11,
  fee: invoiceFee * 0.04,
  pph: invoiceFee * 0.02,
});

export function DOEkspedisiForm({
  mode,
  initialExpedition,
  initialItem,
  vehicleOptions,
  driverOptions,
  customerOptions,
  vehicleLoading = false,
  driverLoading = false,
  customerLoading = false,
  onVehicleSearch,
  onDriverSearch,
  onCustomerSearch,
  onSubmit,
  isSubmitting = false,
}: DOEkspedisiFormProps) {
  const router = useRouter();
  const primaryDestination = initialItem?.destinations?.[0];
  const secondaryDestinations = initialItem?.destinations?.slice(1) ?? [];
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DOEkspedisiFormData>({
    defaultValues: {
      date: initialExpedition?.date ? new Date(initialExpedition.date) : undefined,
      primaryDestinationId: primaryDestination?.id ? String(primaryDestination.id) : undefined,
      vehicleId: initialExpedition?.vehicleId ? String(initialExpedition.vehicleId) : '',
      driverId: initialExpedition?.driverId ? String(initialExpedition.driverId) : '',
      customerId: initialItem?.customerId ? String(initialItem.customerId) : '',
      loadingIn: initialItem?.loadingIn ?? '',
      loadingOut: initialItem?.loadingOut ?? '',
      destination: primaryDestination?.destination ?? initialItem?.destination ?? '',
      invoiceFee: toInputCurrency(initialItem?.invoiceFee),
      additionalCostFee: toInputCurrency(initialItem?.additionalCostFee),
      otherFee: toInputCurrency(initialItem?.otherFee),
      driverFee: toInputCurrency(initialItem?.driverFee),
      driverNote: primaryDestination?.driverNote ?? initialItem?.driverNote ?? '',
      mapsUrl: primaryDestination?.mapsUrl ?? initialItem?.mapsUrl ?? '',
      destinationStops: secondaryDestinations.map((destination) => ({
        id: String(destination.id),
        destination: destination.destination,
        driverNote: destination.driverNote,
        mapsUrl: destination.mapsUrl,
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'destinationStops',
  });

  const mergedVehicleOptions = React.useMemo(() => {
    const selectedVehicleType = initialExpedition?.vehicle?.type?.trim().toLowerCase() ?? '';
    const filteredVehicleOptions = selectedVehicleType
      ? vehicleOptions.filter((item) => String(item.subtitle ?? '').trim().toLowerCase() === selectedVehicleType)
      : vehicleOptions;

    if (!initialExpedition?.vehicle) {
      return filteredVehicleOptions;
    }

    if (filteredVehicleOptions.some((item) => item.value === String(initialExpedition.vehicleId))) {
      return filteredVehicleOptions;
    }

    return [
      {
        value: String(initialExpedition.vehicleId),
        label: initialExpedition.vehicle.registrationNumber,
        subtitle: initialExpedition.vehicle.type,
      },
      ...filteredVehicleOptions,
    ];
  }, [initialExpedition?.vehicle, initialExpedition?.vehicleId, vehicleOptions]);

  const mergedDriverOptions = React.useMemo(() => {
    if (!initialExpedition?.driver || driverOptions.some((item) => item.value === String(initialExpedition.driverId))) {
      return driverOptions;
    }

    return [
      {
        value: String(initialExpedition.driverId),
        label: initialExpedition.driver.name,
      },
      ...driverOptions,
    ];
  }, [driverOptions, initialExpedition?.driver, initialExpedition?.driverId]);

  const mergedCustomerOptions = React.useMemo(() => {
    if (!initialItem?.customer || customerOptions.some((item) => item.value === String(initialItem.customerId))) {
      return customerOptions;
    }

    return [
      {
        value: String(initialItem.customerId),
        label: initialItem.customer.name,
      },
      ...customerOptions,
    ];
  }, [customerOptions, initialItem?.customer, initialItem?.customerId]);

  const selectedVehicle = mergedVehicleOptions.find((item) => item.value === watch('vehicleId'));
  const invoiceFee = toNumericValue(watch('invoiceFee') || '0');
  const preview = computePreview(invoiceFee);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="do_code">ID DO</Label>
            <Input
              id="do_code"
              readOnly
              value={initialExpedition?.doCode ?? 'Akan dibuat otomatis setelah disimpan'}
              className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC] text-slate-500"
            />
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
                  className={`h-12 rounded-md ${errors.date ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                />
              )}
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipe Kendaraan</Label>
            <Controller
              control={control}
              name="vehicleId"
              rules={{ required: 'Armada wajib dipilih' }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={mergedVehicleOptions}
                  placeholder="Pilih armada"
                  searchPlaceholder="Cari nomor polisi atau tipe..."
                  loading={vehicleLoading}
                  onSearchChange={onVehicleSearch}
                  className={`h-12 rounded-md ${errors.vehicleId ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                />
              )}
            />
            {selectedVehicle?.subtitle ? <p className="text-xs text-slate-500">Jenis: {selectedVehicle.subtitle}</p> : null}
            {errors.vehicleId && <p className="text-xs text-red-500">{errors.vehicleId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Driver</Label>
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
                  className={`h-12 rounded-md ${errors.driverId ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                />
              )}
            />
            {errors.driverId && <p className="text-xs text-red-500">{errors.driverId.message}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customerId"
              rules={{ required: 'Customer wajib dipilih' }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={mergedCustomerOptions}
                  placeholder="Masukkan nama customer"
                  searchPlaceholder="Cari customer..."
                  loading={customerLoading}
                  onSearchChange={onCustomerSearch}
                  className={`h-12 rounded-md ${errors.customerId ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                />
              )}
            />
            {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loadingIn">Loading In</Label>
            <Input
              id="loadingIn"
              placeholder="Lokasi muat"
              className={`h-12 rounded-md border-[#E5E7EB] ${errors.loadingIn ? 'border-red-500' : ''}`}
              {...register('loadingIn', { required: 'Loading in wajib diisi' })}
            />
            {errors.loadingIn && <p className="text-xs text-red-500">{errors.loadingIn.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loadingOut">Loading Out</Label>
            <Input
              id="loadingOut"
              placeholder="Lokasi bongkar"
              className={`h-12 rounded-md border-[#E5E7EB] ${errors.loadingOut ? 'border-red-500' : ''}`}
              {...register('loadingOut', { required: 'Loading out wajib diisi' })}
            />
            {errors.loadingOut && <p className="text-xs text-red-500">{errors.loadingOut.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Tujuan</Label>
            <Input
              id="destination"
              placeholder="Masukkan tujuan kirim"
              className={`h-12 rounded-md border-[#E5E7EB] ${errors.destination ? 'border-red-500' : ''}`}
              {...register('destination', { required: 'Tujuan wajib diisi' })}
            />
            {errors.destination && <p className="text-xs text-red-500">{errors.destination.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverFee">UJ Driver</Label>
            <Controller
              control={control}
              name="driverFee"
              rules={{ required: 'UJ driver wajib diisi' }}
              render={({ field }) => (
                <MoneyInput
                  id="driverFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="Uang jalan driver"
                  className={`h-12 rounded-md border-[#E5E7EB] ${errors.driverFee ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.driverFee && <p className="text-xs text-red-500">{errors.driverFee.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherFee">UJ Tambahan</Label>
            <Controller
              control={control}
              name="otherFee"
              render={({ field }) => (
                <MoneyInput
                  id="otherFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="Uang jalan tambahan"
                  className={`h-12 rounded-md border-[#E5E7EB] ${errors.otherFee ? 'border-red-500' : ''}`}
                />
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="driverNote">Catatan Driver</Label>
            <Textarea
              id="driverNote"
              rows={3}
              placeholder="Masukkan atensi atau catatan untuk driver"
              className={`resize-none rounded-md border-[#E5E7EB] ${errors.driverNote ? 'border-red-500' : ''}`}
              {...register('driverNote', { required: 'Catatan driver wajib diisi' })}
            />
            {errors.driverNote && <p className="text-xs text-red-500">{errors.driverNote.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mapsUrl">Maps URL</Label>
            <Input
              id="mapsUrl"
              placeholder="https://maps.google.com/..."
              className={`h-12 rounded-md border-[#E5E7EB] ${errors.mapsUrl ? 'border-red-500' : ''}`}
              {...register('mapsUrl', { required: 'Maps URL wajib diisi' })}
            />
            {errors.mapsUrl && <p className="text-xs text-red-500">{errors.mapsUrl.message}</p>}
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Destinasi Tambahan</Label>
                <p className="text-xs text-slate-500">Tambahkan tujuan berikutnya jika satu item DO memiliki lebih dari satu destinasi.</p>
              </div>
              <Button type="button" onClick={() => append({ destination: '', driverNote: '', mapsUrl: '' })} className="button-theme-1!">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Tujuan
              </Button>
            </div>

            {fields.length > 0 ? (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Tujuan #{index + 2}</p>
                      <Button type="button" variant="ghost" className="h-8 px-2 text-red-600 hover:text-red-700" onClick={() => remove(index)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Hapus
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <input autoComplete="off" type="hidden" {...register(`destinationStops.${index}.id` as const)} />

                      <div className="space-y-2">
                        <Label htmlFor={`destinationStops.${index}.destination`}>Tujuan</Label>
                        <Input
                          id={`destinationStops.${index}.destination`}
                          placeholder="Masukkan tujuan kirim"
                          className="h-12 rounded-md border-[#E5E7EB]"
                          {...register(`destinationStops.${index}.destination` as const, { required: 'Tujuan tambahan wajib diisi' })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`destinationStops.${index}.driverNote`}>Catatan Driver</Label>
                        <Textarea
                          id={`destinationStops.${index}.driverNote`}
                          rows={3}
                          placeholder="Masukkan atensi atau catatan untuk driver"
                          className="resize-none rounded-md border-[#E5E7EB]"
                          {...register(`destinationStops.${index}.driverNote` as const, { required: 'Catatan driver tambahan wajib diisi' })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`destinationStops.${index}.mapsUrl`}>Maps URL</Label>
                        <Input
                          id={`destinationStops.${index}.mapsUrl`}
                          placeholder="https://maps.google.com/..."
                          className="h-12 rounded-md border-[#E5E7EB]"
                          {...register(`destinationStops.${index}.mapsUrl` as const, { required: 'Maps URL tambahan wajib diisi' })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-4 py-5 text-sm text-slate-500">
                Belum ada destinasi tambahan.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceFee">Invoice</Label>
            <Controller
              control={control}
              name="invoiceFee"
              rules={{ required: 'Invoice wajib diisi' }}
              render={({ field }) => (
                <MoneyInput
                  id="invoiceFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="Masukkan nominal invoice"
                  className={`h-12 rounded-md border-[#E5E7EB] ${errors.invoiceFee ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.invoiceFee && <p className="text-xs text-red-500">{errors.invoiceFee.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalCostFee">Invoice Tambahan</Label>
            <Controller
              control={control}
              name="additionalCostFee"
              render={({ field }) => (
                <MoneyInput
                  id="additionalCostFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="Masukkan biaya tambahan"
                  className="h-12 rounded-md border-[#E5E7EB]"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>PPN 11%</Label>
            <Input readOnly value={formatCurrency(preview.ppn)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>

          <div className="space-y-2">
            <Label>Fee 4%</Label>
            <Input readOnly value={formatCurrency(preview.fee)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>PPH 2%</Label>
            <Input readOnly value={formatCurrency(preview.pph)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pt-2">
        <Button type="button" variant="outline" className="min-w-[120px]" onClick={() => router.back()} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" className="min-w-[120px] bg-[#1E3A5F] hover:bg-[#18314F]" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Simpan' : 'Update'}
        </Button>
      </div>
    </form>
  );
}
