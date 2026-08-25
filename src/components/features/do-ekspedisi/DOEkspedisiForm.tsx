import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import RequiredMark from '@/components/ui/required-mark';

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
  
  const formMethods = useForm<DOEkspedisiFormData>({
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

  const { control, register, handleSubmit, watch } = formMethods;

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
    <Form {...formMethods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Informasi Utama */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Informasi Utama</h2>
            <p className="text-sm text-gray-500 mt-1">Identitas pengiriman, armada, dan pengemudi yang bertugas</p>
            <div className="my-3 h-px bg-muted/60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">ID DO</Label>
              <Input
                readOnly
                value={initialExpedition?.doCode ?? 'Akan dibuat otomatis setelah disimpan'}
                className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC] text-slate-500"
              />
            </div>

            <FormField
              control={control}
              name="date"
              rules={{ required: 'Tanggal wajib diisi' }}
              render={({ field }) => (
                <FormItem className="flex flex-col relative pb-5">
                  <FormLabel className="text-sm font-medium">Tanggal<RequiredMark /></FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih tanggal"
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="vehicleId"
              rules={{ required: 'Armada wajib dipilih' }}
              render={({ field }) => (
                <FormItem className="flex flex-col relative pb-5">
                  <FormLabel className="text-sm font-medium">Nomor Polisi / Kendaraan<RequiredMark /></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={mergedVehicleOptions}
                      placeholder="Pilih armada"
                      searchPlaceholder="Cari nomor polisi..."
                      loading={vehicleLoading}
                      onSearchChange={onVehicleSearch}
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  {selectedVehicle?.subtitle && (
                    <p className="mt-1 text-xs text-slate-500">Jenis: {selectedVehicle.subtitle}</p>
                  )}
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="driverId"
              rules={{ required: 'Driver wajib dipilih' }}
              render={({ field }) => (
                <FormItem className="flex flex-col relative pb-5">
                  <FormLabel className="text-sm font-medium">Driver<RequiredMark /></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={mergedDriverOptions}
                      placeholder="Pilih driver"
                      searchPlaceholder="Cari driver..."
                      loading={driverLoading}
                      onSearchChange={onDriverSearch}
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Card 2: Detail Lokasi & Rute */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Detail Lokasi & Rute</h2>
            <p className="text-sm text-gray-500 mt-1">Informasi titik bongkar muat dan alamat tujuan detail</p>
            <div className="my-3 h-px bg-muted/60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="customerId"
              rules={{ required: 'Customer wajib dipilih' }}
              render={({ field }) => (
                <FormItem className="flex flex-col md:col-span-2 relative pb-5">
                  <FormLabel className="text-sm font-medium">Customer<RequiredMark /></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={mergedCustomerOptions}
                      placeholder="Pilih customer"
                      searchPlaceholder="Cari customer..."
                      loading={customerLoading}
                      onSearchChange={onCustomerSearch}
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="loadingIn"
              rules={{ required: 'Loading in wajib diisi' }}
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">Loading In (Lokasi Muat)<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="Lokasi muat" className="h-12 rounded-md" {...field} />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="loadingOut"
              rules={{ required: 'Loading out wajib diisi' }}
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">Loading Out (Lokasi Bongkar)<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="Lokasi bongkar" className="h-12 rounded-md" {...field} />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="destination"
              rules={{ required: 'Tujuan wajib diisi' }}
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">Tujuan Kirim<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="Tujuan kirim utama" className="h-12 rounded-md" {...field} />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="mapsUrl"
              rules={{ required: 'Maps URL wajib diisi' }}
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">Maps URL<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="https://maps.google.com/..." className="h-12 rounded-md" {...field} />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="driverNote"
              rules={{ required: 'Catatan driver wajib diisi' }}
              render={({ field }) => (
                <FormItem className="md:col-span-2 relative pb-5">
                  <FormLabel className="text-sm font-medium">Catatan Driver<RequiredMark /></FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Masukkan atensi atau catatan untuk driver" className="resize-none rounded-md" {...field} />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            {/* Additional Stops Section */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold">Destinasi Tambahan</Label>
                  <p className="text-xs text-slate-500">Tambahkan tujuan berikutnya jika satu DO memiliki beberapa destinasi.</p>
                </div>
                <Button type="button" onClick={() => append({ destination: '', driverNote: '', mapsUrl: '' })} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Tujuan
                </Button>
              </div>

              {fields.length > 0 ? (
                <div className="space-y-4">
                  {fields.map((fieldItem, index) => (
                    <div key={fieldItem.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                        <p className="text-sm font-semibold text-slate-800">Tujuan #{index + 2}</p>
                        <Button type="button" variant="ghost" className="h-8 px-2 text-red-600 hover:text-red-700 cursor-pointer" onClick={() => remove(index)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Hapus
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input autoComplete="off" type="hidden" {...register(`destinationStops.${index}.id` as const)} />

                        <FormField
                          control={control}
                          name={`destinationStops.${index}.destination` as const}
                          rules={{ required: 'Tujuan tambahan wajib diisi' }}
                          render={({ field }) => (
                            <FormItem className="relative pb-5">
                              <FormLabel className="text-xs font-semibold">Tujuan</FormLabel>
                              <FormControl>
                                <Input placeholder="Tujuan kirim tambahan" className="h-11 rounded-md bg-white" {...field} />
                              </FormControl>
                              <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name={`destinationStops.${index}.mapsUrl` as const}
                          rules={{ required: 'Maps URL tambahan wajib diisi' }}
                          render={({ field }) => (
                            <FormItem className="relative pb-5">
                              <FormLabel className="text-xs font-semibold">Maps URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://maps.google.com/..." className="h-11 rounded-md bg-white" {...field} />
                              </FormControl>
                              <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name={`destinationStops.${index}.driverNote` as const}
                          rules={{ required: 'Catatan driver tambahan wajib diisi' }}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2 relative pb-5">
                              <FormLabel className="text-xs font-semibold">Catatan Driver</FormLabel>
                              <FormControl>
                                <Textarea rows={2} placeholder="Catatan driver tambahan" className="resize-none rounded-md bg-white" {...field} />
                              </FormControl>
                              <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-4 py-5 text-center text-sm text-slate-500">
                  Belum ada destinasi tambahan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Informasi Biaya */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Informasi Biaya</h2>
            <p className="text-sm text-gray-500 mt-1">Rincian uang jalan supir, nominal tagihan invoice, dan asuransi perpajakan</p>
            <div className="my-3 h-px bg-muted/60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField
              control={control}
              name="driverFee"
              rules={{ required: 'UJ driver wajib diisi' }}
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">UJ Driver<RequiredMark /></FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value ? toNumericValue(field.value) : undefined}
                      onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                      placeholder="Uang jalan driver"
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="otherFee"
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">UJ Tambahan</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value ? toNumericValue(field.value) : undefined}
                      onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                      placeholder="Uang jalan tambahan"
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="invoiceFee"
              rules={{ required: 'Invoice wajib diisi' }}
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">Invoice Ekspedisi<RequiredMark /></FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value ? toNumericValue(field.value) : undefined}
                      onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                      placeholder="Nominal invoice"
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="additionalCostFee"
              render={({ field }) => (
                <FormItem className="relative pb-5">
                  <FormLabel className="text-sm font-medium">Invoice Tambahan</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value ? toNumericValue(field.value) : undefined}
                      onChangeValue={(nextValue) => field.onChange(String(nextValue))}
                      placeholder="Invoice tambahan"
                      className="h-12 rounded-md"
                    />
                  </FormControl>
                  <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0 text-red-500" />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">PPN 11%</Label>
              <Input readOnly value={formatCurrency(preview.ppn)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Fee 4%</Label>
              <Input readOnly value={formatCurrency(preview.fee)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700">PPH 2%</Label>
              <Input readOnly value={formatCurrency(preview.pph)} className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Button type="button" variant="outline" className="min-w-[120px]" onClick={() => router.back()} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" className="min-w-[120px] bg-[#1E3A5F] hover:bg-[#18314F] text-white" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Simpan' : 'Update'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
