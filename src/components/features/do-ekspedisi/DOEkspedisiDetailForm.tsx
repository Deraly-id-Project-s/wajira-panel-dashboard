import React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2, Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import type { DoEkspedisiItem } from '@/@types/do-ekspedisi.types';
import { formatCurrency } from '@/lib/utils/currency';

interface DOEkspedisiDestinationFormData {
  id?: string;
  destination: string;
  driverNote: string;
  mapsUrl: string;
}

export interface DOEkspedisiDetailFormData {
  primaryDestinationId?: string;
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

interface DOEkspedisiDetailFormProps {
  initialData?: DoEkspedisiItem | null;
  customerOptions: SearchableSelectOption[];
  onCustomerSearch: (value: string) => void;
  onSubmit?: (data: DOEkspedisiDetailFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

const toInputValue = (value?: number | null) => (value == null || value === 0 ? '' : String(Math.round(value)));
const toNumericValue = (value: string) => {
  const sanitized = value.replace(/[^\d]/g, '');
  return sanitized ? Number(sanitized) : 0;
};

export function DOEkspedisiDetailForm({
  initialData,
  customerOptions,
  onCustomerSearch,
  onSubmit,
  isSubmitting = false,
  readOnly = false,
}: DOEkspedisiDetailFormProps) {
  const router = useRouter();
  const primaryDestination = initialData?.destinations?.[0];
  const secondaryDestinations = initialData?.destinations?.slice(1) ?? [];
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DOEkspedisiDetailFormData>({
    defaultValues: {
      primaryDestinationId: primaryDestination?.id ? String(primaryDestination.id) : undefined,
      customerId: initialData?.customerId ? String(initialData.customerId) : '',
      loadingIn: initialData?.loadingIn ?? '',
      loadingOut: initialData?.loadingOut ?? '',
      destination: primaryDestination?.destination ?? initialData?.destination ?? '',
      invoiceFee: toInputValue(initialData?.invoiceFee),
      additionalCostFee: toInputValue(initialData?.additionalCostFee),
      otherFee: toInputValue(initialData?.otherFee),
      driverFee: toInputValue(initialData?.driverFee),
      driverNote: primaryDestination?.driverNote ?? initialData?.driverNote ?? '',
      mapsUrl: primaryDestination?.mapsUrl ?? initialData?.mapsUrl ?? '',
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

  const mergedCustomerOptions = React.useMemo(() => {
    if (!initialData?.customer || customerOptions.some((item) => item.value === String(initialData.customerId))) {
      return customerOptions;
    }

    return [
      {
        value: String(initialData.customerId),
        label: initialData.customer.name,
      },
      ...customerOptions,
    ];
  }, [customerOptions, initialData?.customer, initialData?.customerId]);

  const invoiceFee = toNumericValue(watch('invoiceFee') || '0');
  const ppnPreview = initialData?.ppnFee ?? invoiceFee * 0.11;
  const feePreview = initialData?.serviceFee ?? invoiceFee * 0.04;
  const pphPreview = initialData?.pphFee ?? invoiceFee * 0.02;

  return (
    <form onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-6">
      <div className="rounded-md border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customerId"
              rules={{ required: readOnly ? false : 'Customer wajib dipilih' }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={mergedCustomerOptions}
                  placeholder="Pilih customer"
                  searchPlaceholder="Cari customer..."
                  onSearchChange={onCustomerSearch}
                  disabled={readOnly}
                  className={`h-12 rounded-md ${errors.customerId ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                />
              )}
            />
            {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loadingIn">Loading In</Label>
            <Input id="loadingIn" placeholder="Lokasi muat" disabled={readOnly} className="h-12 rounded-md border-[#E5E7EB]" {...register('loadingIn', { required: readOnly ? false : 'Loading in wajib diisi' })} />
            {errors.loadingIn && <p className="text-xs text-red-500">{errors.loadingIn.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loadingOut">Loading Out</Label>
            <Input id="loadingOut" placeholder="Lokasi bongkar" disabled={readOnly} className="h-12 rounded-md border-[#E5E7EB]" {...register('loadingOut', { required: readOnly ? false : 'Loading out wajib diisi' })} />
            {errors.loadingOut && <p className="text-xs text-red-500">{errors.loadingOut.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="destination">Tujuan Kirim</Label>
            <Input id="destination" placeholder="Masukkan tujuan kirim" disabled={readOnly} className="h-12 rounded-md border-[#E5E7EB]" {...register('destination', { required: readOnly ? false : 'Tujuan wajib diisi' })} />
            {errors.destination && <p className="text-xs text-red-500">{errors.destination.message}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceFee">Invoice</Label>
            <Controller
              control={control}
              name="invoiceFee"
              rules={{ required: readOnly ? false : 'Invoice wajib diisi' }}
              render={({ field }) => (
                <MoneyInput
                  id="invoiceFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="0"
                  disabled={readOnly}
                  className="h-12 rounded-md border-[#E5E7EB]"
                />
              )}
            />
            {errors.invoiceFee && <p className="text-xs text-red-500">{errors.invoiceFee.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalCostFee">Biaya Tambahan</Label>
            <Controller
              control={control}
              name="additionalCostFee"
              render={({ field }) => (
                <MoneyInput
                  id="additionalCostFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="0"
                  disabled={readOnly}
                  className="h-12 rounded-md border-[#E5E7EB]"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>PPN 11%</Label>
            <Input readOnly value={formatCurrency(ppnPreview)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>

          <div className="space-y-2">
            <Label>Fee 4%</Label>
            <Input readOnly value={formatCurrency(feePreview)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverFee">UJ Driver</Label>
            <Controller
              control={control}
              name="driverFee"
              rules={{ required: readOnly ? false : 'UJ driver wajib diisi' }}
              render={({ field }) => (
                <MoneyInput
                  id="driverFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="0"
                  disabled={readOnly}
                  className="h-12 rounded-md border-[#E5E7EB]"
                />
              )}
            />
            {errors.driverFee && <p className="text-xs text-red-500">{errors.driverFee.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherFee">Lainnya</Label>
            <Controller
              control={control}
              name="otherFee"
              render={({ field }) => (
                <MoneyInput
                  id="otherFee"
                  value={field.value ? toNumericValue(field.value) : undefined}
                  onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                  placeholder="0"
                  disabled={readOnly}
                  className="h-12 rounded-md border-[#E5E7EB]"
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
              disabled={readOnly}
              className="resize-none rounded-md border-[#E5E7EB]"
              {...register('driverNote', { required: readOnly ? false : 'Catatan driver wajib diisi' })}
            />
            {errors.driverNote && <p className="text-xs text-red-500">{errors.driverNote.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mapsUrl">Maps URL</Label>
            <Input
              id="mapsUrl"
              placeholder="https://maps.google.com/..."
              disabled={readOnly}
              className="h-12 rounded-md border-[#E5E7EB]"
              {...register('mapsUrl', { required: readOnly ? false : 'Maps URL wajib diisi' })}
            />
            {errors.mapsUrl && <p className="text-xs text-red-500">{errors.mapsUrl.message}</p>}
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Destinasi Tambahan</Label>
                <p className="text-xs text-slate-500">Tambahkan tujuan lanjutan untuk item DO ini bila ada lebih dari satu tujuan.</p>
              </div>
              {!readOnly ? (
                <Button type="button" onClick={() => append({ destination: '', driverNote: '', mapsUrl: '' })} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Tujuan
                </Button>
              ) : null}
            </div>

            {fields.length > 0 ? (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Tujuan #{index + 2}</p>
                      {!readOnly ? (
                        <Button type="button" variant="ghost" className="h-8 px-2 text-red-600 hover:text-red-700" onClick={() => remove(index)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Hapus
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <input autoComplete="off" type="hidden" {...register(`destinationStops.${index}.id` as const)} />

                      <div className="space-y-2">
                        <Label htmlFor={`destinationStops.${index}.destination`}>Tujuan</Label>
                        <Input
                          id={`destinationStops.${index}.destination`}
                          placeholder="Masukkan tujuan kirim"
                          disabled={readOnly}
                          className="h-12 rounded-md border-[#E5E7EB]"
                          {...register(`destinationStops.${index}.destination` as const, {
                            required: readOnly ? false : 'Tujuan tambahan wajib diisi',
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`destinationStops.${index}.driverNote`}>Catatan Driver</Label>
                        <Textarea
                          id={`destinationStops.${index}.driverNote`}
                          rows={3}
                          placeholder="Masukkan atensi atau catatan untuk driver"
                          disabled={readOnly}
                          className="resize-none rounded-md border-[#E5E7EB]"
                          {...register(`destinationStops.${index}.driverNote` as const, {
                            required: readOnly ? false : 'Catatan driver tambahan wajib diisi',
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`destinationStops.${index}.mapsUrl`}>Maps URL</Label>
                        <Input
                          id={`destinationStops.${index}.mapsUrl`}
                          placeholder="https://maps.google.com/..."
                          disabled={readOnly}
                          className="h-12 rounded-md border-[#E5E7EB]"
                          {...register(`destinationStops.${index}.mapsUrl` as const, {
                            required: readOnly ? false : 'Maps URL tambahan wajib diisi',
                          })}
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

          <div className="space-y-2 md:col-span-2">
            <Label>PPH 2%</Label>
            <Input readOnly value={formatCurrency(pphPreview)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>
        </div>
      </div>

      {!readOnly ? (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button type="button" variant="outline" className="min-w-[120px]" onClick={() => router.back()} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" className="min-w-[120px] bg-[#1E3A5F] hover:bg-[#18314F]" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
