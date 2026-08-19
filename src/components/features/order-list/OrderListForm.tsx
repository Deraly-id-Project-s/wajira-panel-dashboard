import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { PageHeader } from '@/components/ui/page-header';
import type { OrderList, OrderListVehicleType } from '@/@types/order-list.types';
import type { Tarif } from '@/@types/tarif.types';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { orderListFormSchema, type OrderListFormSchema } from '@/schemas/order-list.schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ORDER_LIST_VEHICLE_OPTIONS,
  formatOrderCurrency,
} from './order-list.utils';
import { getOrderListFormula } from '@/services/order-list.service';

export interface OrderListFormItemValue {
  localId: string;
  id?: number;
  tarifId: string;
  vehicleType: OrderListVehicleType;
  vehicleId: string;
  driverId: string;
  loadingIn: string;
  loadingOut: string;
  deliveryDestination: string;
  cargoItems: OrderListFormCargoItemValue[];
  driverFee: number;
  expeditionInvoice: number;
}

export interface OrderListFormCargoItemValue {
  localId: string;
  id?: number;
  loadContent: string;
  qty: number;
}

export interface OrderListFormValues extends OrderListFormSchema { }

interface OrderListFormProps {
  mode: 'create' | 'edit';
  initialData?: OrderList | null;
  customerOptions: SearchableSelectOption[];
  tarifOptions: SearchableSelectOption[];
  tarifRecords: Tarif[];
  vehicleOptions: Record<OrderListVehicleType, SearchableSelectOption[]>;
  driverOptions: SearchableSelectOption[];
  customerLoading?: boolean;
  tarifLoading?: boolean;
  vehicleLoading?: boolean;
  driverLoading?: boolean;
  onCustomerSearch: (value: string) => void;
  onTarifSearch: (value: string) => void;
  onVehicleSearch: (value: string) => void;
  onDriverSearch: (value: string) => void;
  onSubmit: (values: OrderListFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const createItemId = () => Math.random().toString(36).slice(2, 11);

const createCargoItem = (overrides?: Partial<OrderListFormCargoItemValue>): OrderListFormCargoItemValue => ({
  localId: createItemId(),
  id: overrides?.id,
  loadContent: overrides?.loadContent ?? '',
  qty: Number(overrides?.qty ?? 1),
});

const getVehicleFee = (tarif: Tarif | undefined, vehicleType: OrderListVehicleType) => {
  if (!tarif) return { driverFee: 0, invoice: 0 };
  if (vehicleType === 'towing') {
    return {
      driverFee: Number(tarif.ujTowing ?? 0),
      invoice: 0,
    };
  }
  if (vehicleType === 'cdd') {
    return {
      driverFee: Number(tarif.ujCdd ?? 0),
      invoice: Number(tarif.invCdd ?? 0),
    };
  }
  return {
    driverFee: Number(tarif.ujFuso ?? 0),
    invoice: Number(tarif.invFuso ?? 0),
  };
};

const toItemDefaults = (order?: OrderList | null): OrderListFormItemValue[] => {
  if (!order?.tarifs?.length) {
    return [
      {
        localId: createItemId(),
        tarifId: '',
        vehicleType: 'fuso',
        vehicleId: '',
        driverId: '',
        loadingIn: '',
        loadingOut: '',
        deliveryDestination: '',
        cargoItems: [createCargoItem()],
        driverFee: 0,
        expeditionInvoice: 0,
      },
    ];
  }

  return order.tarifs.map((item) => ({
    localId: createItemId(),
    id: item.id,
    tarifId: item.tarifId ? String(item.tarifId) : '',
    vehicleType: item.vehicleType ?? 'fuso',
    vehicleId: item.vehicleId ? String(item.vehicleId) : '',
    driverId: item.driverId ? String(item.driverId) : '',
    loadingIn: item.loadingIn ?? '',
    loadingOut: item.loadingOut ?? '',
    deliveryDestination: item.deliveryDestination ?? '',
    cargoItems:
      item.tarifItems?.length
        ? item.tarifItems.map((tarifItem) =>
          createCargoItem({
            id: tarifItem.id,
            loadContent: tarifItem.loadContent,
            qty: Number(tarifItem.qty ?? 0),
          }),
        )
        : [
          createCargoItem({
            loadContent: item.loadContent ?? '',
            qty: Number(item.qty ?? 0),
          }),
        ],
    driverFee: Number(item.driverFee ?? 0),
    expeditionInvoice: Number(item.expeditionInvoice ?? order.billInvoice ?? 0),
  }));
};

const mergeSelectOptions = (options: SearchableSelectOption[], extras: SearchableSelectOption[]) => {
  const map = new Map<string, SearchableSelectOption>();
  [...extras, ...options].forEach((option) => {
    if (option.value) {
      map.set(option.value, option);
    }
  });
  return Array.from(map.values());
};

export function OrderListForm({
  mode,
  initialData,
  customerOptions,
  tarifOptions,
  tarifRecords,
  vehicleOptions,
  driverOptions,
  customerLoading = false,
  tarifLoading = false,
  vehicleLoading = false,
  driverLoading = false,
  onCustomerSearch,
  onTarifSearch,
  onVehicleSearch,
  onDriverSearch,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: OrderListFormProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const defaultCustomerOption = React.useMemo<SearchableSelectOption[]>(() => {
    if (!initialData?.customer?.id) return [];
    return [
      {
        value: String(initialData.customer.id),
        label: initialData.customer.name,
        subtitle: initialData.customer.code,
      },
    ];
  }, [initialData?.customer]);

  const defaultTarifOptions = React.useMemo<SearchableSelectOption[]>(() => {
    if (!initialData?.tarifs?.length) return [];
    return initialData.tarifs
      .filter((item) => item.tarifId)
      .map((item) => ({
        value: String(item.tarifId),
        label: [item.tarif?.loadingIn || item.loadingIn, item.tarif?.loadingOut || item.loadingOut].filter(Boolean).join(' - ') || `Tarif #${item.tarifId}`,
        subtitle: item.tarif?.customer?.name,
      }));
  }, [initialData?.tarifs]);

  const mergedCustomerOptions = React.useMemo(
    () => mergeSelectOptions(customerOptions, defaultCustomerOption),
    [customerOptions, defaultCustomerOption],
  );

  const mergedTarifOptions = React.useMemo(() => {
    return mergeSelectOptions(tarifOptions, defaultTarifOptions);
  }, [tarifOptions, defaultTarifOptions]);

  const form = useForm<OrderListFormValues>({
    resolver: zodResolver(orderListFormSchema),
    defaultValues: {
      customerId: initialData?.customerId ? String(initialData.customerId) : '',
      status: initialData?.status ?? 'draft',
      invoiceBill: Number(initialData?.billInvoice ?? 0),
      ppn: Number(initialData?.ppn ?? 0),
      pph: Number(initialData?.pph ?? 0),
      ujDriver: Number(initialData?.ujDriver ?? 0),
      note: initialData?.note ?? '',
      items: toItemDefaults(initialData),
    },
  });

  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
  } = form;

  React.useEffect(() => {
    reset({
      customerId: initialData?.customerId ? String(initialData.customerId) : '',
      status: initialData?.status ?? 'draft',
      invoiceBill: Number(initialData?.billInvoice ?? 0),
      ppn: Number(initialData?.ppn ?? 0),
      pph: Number(initialData?.pph ?? 0),
      ujDriver: Number(initialData?.ujDriver ?? 0),
      note: initialData?.note ?? '',
      items: toItemDefaults(initialData),
    });
  }, [initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });
  const customerId = useWatch({ control, name: 'customerId' });
  const invoiceBill = useWatch({ control, name: 'invoiceBill' });
  const watchedPpn = useWatch({ control, name: 'ppn' });
  const watchedPph = useWatch({ control, name: 'pph' });
  const watchedUjDriver = useWatch({ control, name: 'ujDriver' });
  const selectedCustomer = mergedCustomerOptions.find((item) => item.value === customerId);
  const selectedTarifIds = React.useMemo(
    () => (watchedItems ?? []).map((item) => item?.tarifId).filter((value): value is string => Boolean(value)),
    [watchedItems],
  );

  const appendCargoItem = React.useCallback(
    (itemIndex: number) => {
      const current = getValues(`items.${itemIndex}.cargoItems`) ?? [];
      setValue(`items.${itemIndex}.cargoItems`, [...current, createCargoItem()], { shouldDirty: true, shouldTouch: true });
    },
    [getValues, setValue],
  );

  const removeCargoItem = React.useCallback(
    (itemIndex: number, cargoIndex: number) => {
      const current = getValues(`items.${itemIndex}.cargoItems`) ?? [];
      if (current.length <= 1) return;
      const next = current.filter((_, index) => index !== cargoIndex);
      setValue(`items.${itemIndex}.cargoItems`, next, { shouldDirty: true, shouldTouch: true });
    },
    [getValues, setValue],
  );

  const getTarifById = React.useCallback(
    (tarifId: string): Tarif | undefined => {
      const fromLookup = tarifRecords.find((item) => String(item.id) === tarifId)
        ;
      if (fromLookup) return fromLookup;

      const fromInitial = initialData?.tarifs?.find((item) => String(item.tarifId) === tarifId)?.tarif;
      if (fromInitial) {
        return {
          id: fromInitial.id,
          uuid: fromInitial.uuid,
          customerId: Number(fromInitial.customerId ?? 0),
          loadingIn: fromInitial.loadingIn,
          loadingOut: fromInitial.loadingOut,
          distance: Number(fromInitial.distance ?? 0),
          ujTowing: fromInitial.ujTowing ?? null,
          ujCdd: fromInitial.ujCdd ?? null,
          ujFuso: fromInitial.ujFuso ?? null,
          invCdd: fromInitial.invCdd ?? null,
          invFuso: fromInitial.invFuso ?? null,
          customer: fromInitial.customer,
        };
      }
      return undefined;
    },
    [initialData?.tarifs, tarifRecords],
  );

  const handleTarifChange = React.useCallback(
    (index: number, tarifId: string) => {
      setValue(`items.${index}.tarifId`, tarifId, { shouldValidate: true, shouldDirty: true });
      const matchedTarif = getTarifById(tarifId);
      if (!matchedTarif) return;

      const nextVehicleType = watchedItems?.[index]?.vehicleType ?? 'fuso';
      const fee = getVehicleFee(matchedTarif, nextVehicleType);

      setValue(`items.${index}.loadingIn`, matchedTarif.loadingIn ?? '', { shouldDirty: true });
      setValue(`items.${index}.loadingOut`, matchedTarif.loadingOut ?? '', { shouldDirty: true });
      setValue(`items.${index}.driverFee`, fee.driverFee, { shouldDirty: true });
      setValue(`items.${index}.expeditionInvoice`, fee.invoice, { shouldDirty: true });
    },
    [getTarifById, setValue, watchedItems],
  );

  const handleVehicleTypeChange = React.useCallback(
    (index: number, vehicleType: OrderListVehicleType) => {
      setValue(`items.${index}.vehicleType`, vehicleType, { shouldValidate: true, shouldDirty: true });
      setValue(`items.${index}.vehicleId`, '', { shouldValidate: true, shouldDirty: true });
      const tarifId = watchedItems?.[index]?.tarifId ?? '';
      const matchedTarif = getTarifById(tarifId);
      const fee = getVehicleFee(matchedTarif, vehicleType);
      setValue(`items.${index}.driverFee`, fee.driverFee, { shouldDirty: true });
      setValue(`items.${index}.expeditionInvoice`, fee.invoice, { shouldDirty: true });
    },
    [getTarifById, setValue, watchedItems],
  );

  React.useEffect(() => {
    const totalDriver = (watchedItems ?? []).reduce((sum, item) => sum + Number(item?.driverFee ?? 0), 0);
    setValue('ujDriver', totalDriver, { shouldDirty: true });
  }, [setValue, watchedItems]);

  React.useEffect(() => {
    const totalInvoice = (watchedItems ?? []).reduce((sum, item) => sum + Number(item?.expeditionInvoice ?? 0), 0);
    setValue('invoiceBill', totalInvoice, { shouldDirty: true });
  }, [setValue, watchedItems]);

  const [ppnInfo, setPpnInfo] = React.useState<{ name: string; rate: number } | null>(null);
  const [pphInfo, setPphInfo] = React.useState<{ name: string; rate: number } | null>(null);
  const [isLoadingFormula, setIsLoadingFormula] = React.useState(false);

  const vehicleType = watchedItems?.[0]?.vehicleType;
  const tarifIds = React.useMemo(() => {
    return (watchedItems ?? [])
      .map((item) => Number(item?.tarifId))
      .filter((id) => !Number.isNaN(id) && id > 0);
  }, [watchedItems]);

  React.useEffect(() => {
    if (!vehicleType || tarifIds.length === 0 || !invoiceBill) {
      return;
    }

    const fetchFormula = async () => {
      setIsLoadingFormula(true);
      try {
        const formula = await getOrderListFormula({
          vehicle_type: vehicleType,
          tarif_ids: tarifIds,
          bill_invoice: Number(invoiceBill),
        });

        setValue('ppn', formula.ppn.value, { shouldDirty: true });
        setValue('pph', formula.pph.value, { shouldDirty: true });
        setValue('ujDriver', formula.uj_driver, { shouldDirty: true });

        setPpnInfo({ name: formula.ppn.name, rate: formula.ppn.rate });
        setPphInfo({ name: formula.pph.name, rate: formula.pph.rate });
      } catch (error) {
        console.error('Failed to fetch formula:', error);
      } finally {
        setIsLoadingFormula(false);
      }
    };

    fetchFormula();
  }, [vehicleType, tarifIds, invoiceBill, setValue]);

  const onInvalid = (errs: any) => {
    console.error('Form validation failed:', errs);
    toast.error('Form tidak valid. Harap periksa kembali inputan Anda.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Order List', onClick: () => router.push(`/dashboard/${slug}/administrasi/order-list`) },
          { label: mode === 'create' ? 'Tambah Data Order' : 'Edit Data Order' }
        ]}
        title={mode === 'create' ? 'Tambah Data Order' : 'Edit Data Order'}
        subtitle={
          mode === 'create'
            ? 'Buat pesanan baru dan tentukan rute serta muatan terkait.'
            : 'Perbarui informasi pesanan, rute, dan muatan terkait.'
        }
        onBack={() => router.push(`/dashboard/${slug}/administrasi/order-list`)}
      />

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <input autoComplete="off" type="hidden" {...register('status')} />

          {/* ── Main form container matching UnitTransactionForm card style ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm space-y-8">

            {/* ── Section 1: Informasi Utama ── */}
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">Informasi Utama</h2>
              <p className="text-sm text-gray-500 mt-1">Pilih pelanggan dan tentukan catatan atau keterangan tambahan</p>
              <div className="h-px bg-muted/60" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Customer</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={mergedCustomerOptions}
                        placeholder="Pilih customer"
                        searchPlaceholder="Cari customer..."
                        loading={customerLoading}
                        onSearchChange={onCustomerSearch}
                        className="bg-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Catatan / Keterangan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan jika diperlukan..."
                        className="bg-transparent min-h-[42px] resize-none"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Section 2: Detail Rute & Muatan ── */}
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">Detail Rute & Muatan</h2>
              <p className="text-sm text-gray-500 mt-1">Kelola rute ekspedisi, tipe armada, dan barang muatan</p>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => {
                const item = watchedItems?.[index];
                const tarif = getTarifById(item?.tarifId ?? '');

                return (
                  <div
                    key={field.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/20 p-5 md:p-6 space-y-6 relative hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 px-3 py-1 bg-slate-100/80 rounded-md">
                        RUTE #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-8 px-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus Rute
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name={`items.${index}.tarifId`}
                        render={({ field: controllerField }) => (
                          <FormItem className="flex flex-col min-w-0">
                            <FormLabel className="text-sm font-medium">Pilih Rute / Tarif</FormLabel>
                            <div className="w-full min-w-0">
                                <FormControl>
                                  <SearchableSelect
                                    value={controllerField.value}
                                    onChange={(value) => handleTarifChange(index, value)}
                                    options={mergedTarifOptions}
                                    placeholder="Pilih tarif"
                                    searchPlaceholder="Cari tarif..."
                                    loading={tarifLoading}
                                    onSearchChange={onTarifSearch}
                                    disabledValues={selectedTarifIds.filter((value) => value !== controllerField.value)}
                                    className="bg-transparent"
                                  />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel className="text-sm font-medium">Loading In</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            value={item?.loadingIn ?? ''}
                            placeholder="Terisi otomatis..."
                            className="bg-slate-50 border-slate-200 cursor-default"
                          />
                        </FormControl>
                      </FormItem>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Loading Out</FormLabel>
                        <FormControl>
                          <Input
                            readOnly
                            value={item?.loadingOut ?? ''}
                            placeholder="Terisi otomatis..."
                            className="bg-slate-50 border-slate-200 cursor-default"
                          />
                        </FormControl>
                      </FormItem>

                      <FormField
                        control={control}
                        name={`items.${index}.deliveryDestination`}
                        render={({ field: controllerField }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Tujuan Kirim</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Contoh: Nama PT / Alamat Detail"
                                className="bg-transparent"
                                {...controllerField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`items.${index}.vehicleType`}
                        render={({ field: controllerField }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-medium">Tipe Armada</FormLabel>
                            <FormControl>
                              <Select
                                value={controllerField.value}
                                onValueChange={(value: OrderListVehicleType) => handleVehicleTypeChange(index, value)}
                              >
                                <SelectTrigger className="bg-transparent disabled:bg-slate-50 disabled:opacity-100 disabled:cursor-not-allowed">
                                  <SelectValue placeholder="Pilih armada" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ORDER_LIST_VEHICLE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`items.${index}.vehicleId`}
                        render={({ field: controllerField }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-medium">Kendaraan</FormLabel>
                            <FormControl>
                              <SearchableSelect
                                value={controllerField.value}
                                onChange={controllerField.onChange}
                                options={vehicleOptions[item?.vehicleType ?? 'fuso']}
                                placeholder="Pilih kendaraan"
                                searchPlaceholder="Cari nomor polisi..."
                                loading={vehicleLoading}
                                onSearchChange={onVehicleSearch}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`items.${index}.driverId`}
                        render={({ field: controllerField }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-medium">Driver</FormLabel>
                            <FormControl>
                              <SearchableSelect
                                value={controllerField.value}
                                onChange={controllerField.onChange}
                                options={driverOptions}
                                placeholder="Pilih driver"
                                searchPlaceholder="Cari driver..."
                                loading={driverLoading}
                                onSearchChange={onDriverSearch}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {tarif && (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 font-medium">
                        Rute Terpilih: {tarif.loadingIn || '-'} ke {tarif.loadingOut || '-'}
                      </div>
                    )}

                    <div className="h-px bg-slate-200/60 my-2" />

                    {/* ── Muatan Section ── */}
                    <div className="space-y-4">
                      <span className="text-sm font-semibold text-slate-700 block">Daftar Muatan</span>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Muatan</span>
                          </div>
                          <div className="w-[120px]">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</span>
                          </div>
                          <div className="w-10 shrink-0" />
                        </div>

                        {(item?.cargoItems ?? []).map((cargoItem, cargoIndex) => {
                          const cargoKey = cargoItem?.localId || `cargo-${index}-${cargoIndex}`;
                          const cargoCount = item?.cargoItems?.length ?? 0;
                          return (
                            <div key={cargoKey} className="flex items-start gap-3 w-full">
                              <div className="flex-1 space-y-1">
                                <Input
                                  placeholder="Contoh: Honda Vario"
                                  className="bg-transparent"
                                  {...register(`items.${index}.cargoItems.${cargoIndex}.loadContent`, { required: 'Muatan wajib diisi' })}
                                />
                              </div>

                              <div className="w-[120px] space-y-1">
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="1"
                                  className="bg-transparent"
                                  {...register(`items.${index}.cargoItems.${cargoIndex}.qty`, {
                                    valueAsNumber: true,
                                    required: 'Qty wajib diisi',
                                    setValueAs: (value) => value === '' ? 1 : Number(value),
                                    min: { value: 1, message: 'Qty minimal 1' },
                                  })}
                                />
                              </div>

                              <div className="shrink-0 flex items-center h-10">
                                {cargoCount > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeCargoItem(index, cargoIndex)}
                                    className="h-10 w-10 rounded-md border-red-200 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendCargoItem(index)}
                        className="bg-white border-slate-200 hover:bg-slate-50/50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Muatan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentVehicleType = watchedItems?.[0]?.vehicleType ?? 'fuso';
                append({
                  localId: createItemId(),
                  tarifId: '',
                  vehicleType: currentVehicleType,
                  vehicleId: '',
                  driverId: '',
                  loadingIn: '',
                  loadingOut: '',
                  deliveryDestination: '',
                  cargoItems: [createCargoItem()],
                  driverFee: 0,
                  expeditionInvoice: 0,
                });
              }}
              className="w-full border-slate-200 border-dashed hover:bg-slate-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Rute Baru
            </Button>

            {/* ── Section 3: Informasi Biaya ── */}
            <div className="pt-4">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">Informasi Biaya</h2>
              <p className="text-sm text-gray-500 mt-1">Uang jalan driver, tagihan invoice ekspedisi, dan perhitungan PPN</p>
              <div className="my-4 h-px bg-muted/60" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={control}
                name="ujDriver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Uang Jalan Driver (Total)</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled
                        placeholder="Terisi otomatis..."
                        className="bg-slate-50 border-slate-200 cursor-default"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="invoiceBill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Invoice Ekspedisi</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChangeValue={field.onChange}
                        placeholder="Masukkan nominal invoice"
                        className="bg-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="ppn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      PPN {ppnInfo ? `(${ppnInfo.name} - ${ppnInfo.rate}%)` : ''}
                    </FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled
                        placeholder="Terisi otomatis..."
                        className="bg-slate-50 border-slate-200 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="pph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      PPh {pphInfo ? `(${pphInfo.name} - ${pphInfo.rate}%)` : ''}
                    </FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled
                        placeholder="Terisi otomatis..."
                        className="bg-slate-50 border-slate-200 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600 font-medium">
              Ringkasan biaya: UJ Driver {formatOrderCurrency(watchedUjDriver)} • Invoice {formatOrderCurrency(invoiceBill)} • PPN {formatOrderCurrency(watchedPpn)} • PPh {formatOrderCurrency(watchedPph)}
            </div>
          </div>

          {/* ── Form Actions ── */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-muted-foreground font-medium hover:text-foreground"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium min-w-[120px] rounded-lg shadow-sm"
            >
              {isSubmitting ? (
                'Menyimpan...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

    </div>
  );
}
