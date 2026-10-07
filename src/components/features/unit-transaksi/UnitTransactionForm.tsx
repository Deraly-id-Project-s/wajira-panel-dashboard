import { useMemo, useState, useEffect, type ReactNode } from 'react';

import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatCurrency } from '@/lib/utils/currency';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import type { TypeUnit } from '@/@types/type-unit.types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnitFormula } from '@/hooks/useUnitFormula';
import { useTaxDefault } from '@/hooks/useTax';
import RequiredMark from '@/components/ui/required-mark';
import { TypeUnitFormModal } from '@/components/features/type-unit/TypeUnitFormModal';
import { unitTransactionSchema } from '@/scheme/unit-transaction.schema';
import type { UnitTransactionFormValues } from '@/types/unit-transaction.types';

export interface UnitTransactionFormProps {
  type: 'purchase' | 'sales';
  onSubmit: (data: UnitTransactionFormValues) => void;
  defaultValues?: Partial<UnitTransactionFormValues> & {
    dppTaxVersionId?: string | number | null;
    ppnTaxVersionId?: string | number | null;
    unit_transaction_usd_costs?: any[];
    usd_costs?: any[];
  };
  readOnly?: boolean;
  loading?: boolean;
  onCancel?: () => void;
  companyId?: string | number | null;
  excludedTypeUnitIds?: string[];
  prependFields?: ReactNode | ((form: UseFormReturn<UnitTransactionFormValues>) => ReactNode);
  hideItemFields?: boolean;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
  allowCreateTypeUnit?: boolean;
  typeUnitOptions?: TypeUnit[];
}

const USD_COST_TYPES = [
  { key: 'usdCostsFreight', type: 'freight', label: 'Freight (Pengiriman)' },
  { key: 'usdCostsBoxPacking', type: 'box_packing', label: 'Box Packing (Peti)' },
  { key: 'usdCostsAdminCost', type: 'admin_cost', label: 'Admin Cost (Administrasi)' },
  { key: 'usdCostsCkdProcessingCost', type: 'ckd_processing_cost', label: 'CKD Processing Cost (Pemrosesan CKD)' },
  { key: 'usdCostsBillOfLadingSwitchCost', type: 'bill_of_lading_switch_cost', label: 'Bill of Lading Switch Cost (Switch B/L)' },
  { key: 'usdCostsCustomsClearanceCost', type: 'customs_clearance_cost', label: 'Customs Clearance Cost (Bea Cukai)' },
] as const;

const extractInitialUsdCosts = (defaults?: any) => {
  const rawCosts: any[] = defaults?.unit_transaction_usd_costs || defaults?.usd_costs || defaults?.usdCosts || [];
  const result = {
    usdCostsFreight: 0,
    usdCostsBoxPacking: 0,
    usdCostsAdminCost: 0,
    usdCostsCkdProcessingCost: 0,
    usdCostsBillOfLadingSwitchCost: 0,
    usdCostsCustomsClearanceCost: 0,
    otherList: [] as Array<{ id?: number; note: string; amount: number }>,
  };

  if (defaults?.usdCostsFreight !== undefined) result.usdCostsFreight = Number(defaults.usdCostsFreight);
  if (defaults?.usdCostsBoxPacking !== undefined) result.usdCostsBoxPacking = Number(defaults.usdCostsBoxPacking);
  if (defaults?.usdCostsAdminCost !== undefined) result.usdCostsAdminCost = Number(defaults.usdCostsAdminCost);
  if (defaults?.usdCostsCkdProcessingCost !== undefined) result.usdCostsCkdProcessingCost = Number(defaults.usdCostsCkdProcessingCost);
  if (defaults?.usdCostsBillOfLadingSwitchCost !== undefined) result.usdCostsBillOfLadingSwitchCost = Number(defaults.usdCostsBillOfLadingSwitchCost);
  if (defaults?.usdCostsCustomsClearanceCost !== undefined) result.usdCostsCustomsClearanceCost = Number(defaults.usdCostsCustomsClearanceCost);

  if (Array.isArray(rawCosts)) {
    rawCosts.forEach((item) => {
      const amount = Number(item.amount ?? item.amount_total ?? 0);
      const note = item.note ?? '';
      const id = item.id ? Number(item.id) : undefined;

      switch (item.cost_type) {
        case 'freight':
          result.usdCostsFreight = amount;
          break;
        case 'box_packing':
          result.usdCostsBoxPacking = amount;
          break;
        case 'admin_cost':
          result.usdCostsAdminCost = amount;
          break;
        case 'ckd_processing_cost':
          result.usdCostsCkdProcessingCost = amount;
          break;
        case 'bill_of_lading_switch_cost':
          result.usdCostsBillOfLadingSwitchCost = amount;
          break;
        case 'customs_clearance_cost':
          result.usdCostsCustomsClearanceCost = amount;
          break;
        case 'other':
          result.otherList.push({ id, note, amount });
          break;
        default:
          break;
      }
    });
  }

  return result;
};

export function UnitTransactionForm({
  type,
  onSubmit,
  defaultValues,
  readOnly = false,
  loading = false,
  onCancel,
  companyId,
  excludedTypeUnitIds = [],
  prependFields,
  hideItemFields = false,
  submitDisabled = false,
  cancelDisabled = false,
  allowCreateTypeUnit = false,
  typeUnitOptions: suppliedTypeUnitOptions,
}: UnitTransactionFormProps) {
  const { data: typeUnitData, isLoading: typeUnitLoading, isError: typeUnitError, refetch: refetchTypeUnits } = useTypeUnits({
    company_id: companyId ?? undefined,
  });
  const [openTypeModal, setOpenTypeModal] = useState(false);
  const [createdTypeUnit, setCreatedTypeUnit] = useState<TypeUnit | null>(null);

  const initialCosts = useMemo(() => extractInitialUsdCosts(defaultValues), [defaultValues]);
  const hasUsdData = Boolean(
    (defaultValues?.priceUsd && Number(defaultValues.priceUsd) > 0) ||
    (defaultValues?.pricePerUnitUsd && Number(defaultValues.pricePerUnitUsd) > 0) ||
    (defaultValues?.unit_transaction_usd_costs && defaultValues.unit_transaction_usd_costs.length > 0) ||
    (defaultValues?.usd_costs && defaultValues.usd_costs.length > 0) ||
    initialCosts.usdCostsFreight > 0 ||
    initialCosts.usdCostsBoxPacking > 0 ||
    initialCosts.usdCostsAdminCost > 0 ||
    initialCosts.usdCostsCkdProcessingCost > 0 ||
    initialCosts.usdCostsBillOfLadingSwitchCost > 0 ||
    initialCosts.usdCostsCustomsClearanceCost > 0 ||
    initialCosts.otherList.length > 0
  );

  const [isUsd, setIsUsd] = useState(hasUsdData);
  const [otherCosts, setOtherCosts] = useState<Array<{ id?: number; note: string; amount: number }>>(initialCosts.otherList);

  const [selectedDppTaxVersionId, setSelectedDppTaxVersionId] = useState<string | number | null>(defaultValues?.dppTaxVersionId ?? null);
  const [selectedPpnTaxVersionId, setSelectedPpnTaxVersionId] = useState<string | number | null>(defaultValues?.ppnTaxVersionId ?? null);

  const { data: defaultDppTax } = useTaxDefault('dpp');
  const { data: defaultPpnTax } = useTaxDefault('ppn');

  useEffect(() => {
    if (defaultDppTax?.id && selectedDppTaxVersionId == null) {
      setSelectedDppTaxVersionId(defaultDppTax.id);
    }
  }, [defaultDppTax, selectedDppTaxVersionId]);

  useEffect(() => {
    if (defaultPpnTax?.id && selectedPpnTaxVersionId == null) {
      setSelectedPpnTaxVersionId(defaultPpnTax.id);
    }
  }, [defaultPpnTax, selectedPpnTaxVersionId]);

  const form = useForm<UnitTransactionFormValues>({
    resolver: zodResolver(unitTransactionSchema),
    defaultValues: {
      unitTypeId: defaultValues?.unitTypeId || '',
      documentTemplateId: defaultValues?.documentTemplateId ?? null,
      qty: defaultValues?.qty ?? 1,
      price: defaultValues?.price || 0,
      bbnPrice: defaultValues?.bbnPrice || 0,
      expeditionFee: defaultValues?.expeditionFee || 0,
      otherFee: defaultValues?.otherFee || 0,
      priceUsd: defaultValues?.priceUsd || 0,
      pricePerUnitUsd: defaultValues?.pricePerUnitUsd || 0,
      usdCostsFreight: initialCosts.usdCostsFreight,
      usdCostsBoxPacking: initialCosts.usdCostsBoxPacking,
      usdCostsAdminCost: initialCosts.usdCostsAdminCost,
      usdCostsCkdProcessingCost: initialCosts.usdCostsCkdProcessingCost,
      usdCostsBillOfLadingSwitchCost: initialCosts.usdCostsBillOfLadingSwitchCost,
      usdCostsCustomsClearanceCost: initialCosts.usdCostsCustomsClearanceCost,
      ...defaultValues,
    },
  });

  const qty = Number(form.watch('qty') ?? 0);
  const price = Number(form.watch('price') ?? 0);
  const bbnPrice = Number(form.watch('bbnPrice') ?? 0);
  const expeditionFee = Number(form.watch('expeditionFee') ?? 0);
  const otherFee = Number(form.watch('otherFee') ?? 0);
  const pricePerUnitUsd = form.watch('pricePerUnitUsd');

  useEffect(() => {
    if (isUsd) {
      const calculated = Number(pricePerUnitUsd ?? 0) * Number(qty ?? 0);
      form.setValue('priceUsd', calculated, { shouldDirty: true, shouldValidate: true });
    }
  }, [pricePerUnitUsd, qty, isUsd, form]);

  const watchFreight = form.watch('usdCostsFreight');
  const watchBoxPacking = form.watch('usdCostsBoxPacking');
  const watchAdminCost = form.watch('usdCostsAdminCost');
  const watchCkdProcessingCost = form.watch('usdCostsCkdProcessingCost');
  const watchBillOfLadingSwitchCost = form.watch('usdCostsBillOfLadingSwitchCost');
  const watchCustomsClearanceCost = form.watch('usdCostsCustomsClearanceCost');

  const compiledUsdCosts = useMemo(() => {
    if (!isUsd) return [];
    const list: Array<{ id?: number; cost_type: string; amount: number; note?: string | null }> = [];

    const freight = Number(watchFreight ?? 0);
    if (freight > 0) list.push({ cost_type: 'freight', amount: freight, note: 'Freight' });

    const boxPacking = Number(watchBoxPacking ?? 0);
    if (boxPacking > 0) list.push({ cost_type: 'box_packing', amount: boxPacking, note: 'Box Packing' });

    const adminCost = Number(watchAdminCost ?? 0);
    if (adminCost > 0) list.push({ cost_type: 'admin_cost', amount: adminCost, note: 'Admin Cost' });

    const ckdProcessingCost = Number(watchCkdProcessingCost ?? 0);
    if (ckdProcessingCost > 0) list.push({ cost_type: 'ckd_processing_cost', amount: ckdProcessingCost, note: 'CKD Processing Cost' });

    const billOfLadingSwitchCost = Number(watchBillOfLadingSwitchCost ?? 0);
    if (billOfLadingSwitchCost > 0) list.push({ cost_type: 'bill_of_lading_switch_cost', amount: billOfLadingSwitchCost, note: 'Bill of Lading Switch Cost' });

    const customsClearanceCost = Number(watchCustomsClearanceCost ?? 0);
    if (customsClearanceCost > 0) list.push({ cost_type: 'customs_clearance_cost', amount: customsClearanceCost, note: 'Customs Clearance Cost' });

    otherCosts.forEach((item) => {
      if (Number(item.amount) > 0 || (item.note && item.note.trim() !== '')) {
        list.push({
          ...(item.id ? { id: item.id } : {}),
          cost_type: 'other',
          amount: Number(item.amount) || 0,
          note: item.note ? item.note.trim() : null,
        });
      }
    });

    return list;
  }, [isUsd, watchFreight, watchBoxPacking, watchAdminCost, watchCkdProcessingCost, watchBillOfLadingSwitchCost, watchCustomsClearanceCost, otherCosts]);

  const { formula } = useUnitFormula({
    qty_total: qty,
    price,
    bbn_price: bbnPrice,
    expedition_fee: expeditionFee,
    other_fee: otherFee,
    dpp_tax_id: selectedDppTaxVersionId ?? undefined,
    ppn_tax_id: selectedPpnTaxVersionId ?? undefined,
    price_per_unit_usd: isUsd ? pricePerUnitUsd : undefined,
    price_usd: isUsd ? form.watch('priceUsd') : undefined,
    usd_costs: compiledUsdCosts,
  });

  const hppPerUnit = Number(formula?.hpp_per_unit_price ?? 0);
  const dppPerUnit = Number(formula?.dpp_per_unit_price ?? 0);
  const ppnPerUnit = Number(formula?.ppn_per_unit_price ?? 0);
  const hppTotal = Number(formula?.hpp_total_price ?? 0);
  const dppTotal = Number(formula?.dpp_total_price ?? 0);
  const ppnTotal = Number(formula?.ppn_total_price ?? 0);

  const typeUnitOptions = useMemo<TypeUnit[]>(() => {
    const list = suppliedTypeUnitOptions ?? typeUnitData?.data ?? [];
    if (!createdTypeUnit || list.some((item) => item.id === createdTypeUnit.id)) return list;
    return [createdTypeUnit, ...list];
  }, [createdTypeUnit, suppliedTypeUnitOptions, typeUnitData?.data]);

  const selectTypeUnit = (typeUnit: TypeUnit) => {
    form.setValue('unitTypeId', String(typeUnit.id), { shouldDirty: true, shouldValidate: true });
    const preferredPrice = type === 'purchase' ? typeUnit.buyPrice : typeUnit.sellPrice;
    if (preferredPrice !== undefined && preferredPrice !== null) {
      form.setValue('price', Number(preferredPrice), { shouldDirty: true });
    }
  };

  const handleFormSubmit = (values: UnitTransactionFormValues) => {
    onSubmit({
      ...values,
      priceUsd: isUsd ? Number(values.priceUsd) || 0 : 0,
      pricePerUnitUsd: isUsd ? Number(values.pricePerUnitUsd) || 0 : 0,
      usd_costs: isUsd ? compiledUsdCosts : [],
      dppTaxVersionId: selectedDppTaxVersionId ?? undefined,
      ppnTaxVersionId: selectedPpnTaxVersionId ?? undefined,
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={hideItemFields
            ? (event) => {
              event.preventDefault();
              handleFormSubmit(form.getValues());
            }
            : form.handleSubmit(handleFormSubmit)}
          className="space-y-8"
        >
          {typeof prependFields === 'function' ? prependFields(form) : prependFields}

          {!hideItemFields && (
            <>
              {/* Row Type Unit / Qty / Harga */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="unitTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tipe Unit <RequiredMark /></FormLabel>
                      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2">
                        <Select
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(value) => {
                            const selected = typeUnitOptions.find((option) => String(option.id) === value);
                            if (selected) selectTypeUnit(selected);
                          }}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden bg-transparent">
                              <SelectValue maxLength={35} placeholder="Pilih tipe unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent showSearch searchPlaceholder="Cari tipe unit...">
                            {typeUnitLoading && <div className="px-3 py-2 text-xs text-muted-foreground">Memuat tipe unit...</div>}
                            {typeUnitError && (
                              <div className="px-3 py-2 text-xs text-destructive">
                                Gagal memuat tipe unit.{' '}
                                <button type="button" className="underline" onClick={() => refetchTypeUnits()}>
                                  Coba lagi
                                </button>
                              </div>
                            )}
                            {typeUnitOptions.map((option) => {
                              const disabled = excludedTypeUnitIds.includes(String(option.id));

                              return (
                                <SelectItem key={option.id} value={String(option.id)} disabled={disabled} maxLength={40}>
                                  <span className="flex w-full min-w-0 items-center gap-2">
                                    <span className="truncate">{option.name}</span>
                                    {disabled && <span className="ml-auto text-xs text-muted-foreground">Sudah ditambahkan</span>}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {allowCreateTypeUnit && !readOnly && (
                          <Button type="button" variant="default" size="icon" aria-label="Tambah tipe unit" onClick={() => setOpenTypeModal(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">QTY <RequiredMark /></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="QTY"
                          min="1"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : Number(value));
                          }}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Harga Satuan <RequiredMark /></FormLabel>
                      <FormControl>
                        <MoneyInput name={field.name} value={Number(field.value) || 0} onChangeValue={(val) => field.onChange(val)} onBlur={field.onBlur} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* USD Transaction Toggle */}
              <div className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`${type}_is_usd`}
                  checked={isUsd}
                  onCheckedChange={(checked) => {
                    const nextValue = checked === true;
                    setIsUsd(nextValue);
                    if (!nextValue) {
                      form.setValue('priceUsd', 0);
                      form.setValue('pricePerUnitUsd', 0);
                      setOtherCosts([]);
                    }
                  }}
                  disabled={readOnly}
                  className="cursor-pointer"
                />
                <Label htmlFor={`${type}_is_usd`} className="text-sm font-medium cursor-pointer">
                  Transaksi USD (Gunakan mata uang asing USD)
                </Label>
              </div>

              {/* USD Inputs */}
              {isUsd && (
                <div className="space-y-6 p-4 rounded-md border border-amber-200 bg-amber-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pricePerUnitUsd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-amber-900">Harga Satuan (USD)</FormLabel>
                          <FormControl>
                            <MoneyInput
                              currency="USD"
                              placeholder="$ 0.00"
                              name={field.name}
                              value={field.value ?? 0}
                              onChangeValue={(val) => field.onChange(val === 0 ? undefined : val)}
                              disabled={readOnly}
                              onBlur={field.onBlur}
                              className="border-amber-200 focus:border-amber-300 focus:ring-amber-200 bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceUsd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-amber-900">Total Harga Unit (USD)</FormLabel>
                          <FormControl>
                            <MoneyInput
                              currency="USD"
                              placeholder="$ 0.00"
                              name={field.name}
                              value={field.value ?? 0}
                              onChangeValue={(val) => field.onChange(val === 0 ? undefined : val)}
                              disabled={true}
                              onBlur={field.onBlur}
                              className="border-amber-200 focus:border-amber-300 focus:ring-amber-200 bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 6 Biaya Operasional USD tambahan (Non-Other) */}
                  <div className="space-y-3 pt-2 border-t border-amber-200/80">
                    <Label className="text-sm font-semibold text-amber-950">
                      Biaya Operasional USD Tambahan (Maks. 1x per jenis)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {USD_COST_TYPES.map((costType) => (
                        <FormField
                          key={costType.key}
                          control={form.control}
                          name={costType.key as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-amber-900">{costType.label}</FormLabel>
                              <FormControl>
                                <MoneyInput
                                  currency="USD"
                                  placeholder="$ 0.00"
                                  name={field.name}
                                  value={Number(field.value) || 0}
                                  onChangeValue={(val) => field.onChange(val)}
                                  onBlur={field.onBlur}
                                  disabled={readOnly}
                                  className="h-9 border-amber-200 focus:border-amber-300 bg-white text-xs"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Biaya USD Lainnya (Other) Table */}
                  <div className="space-y-3 pt-2 border-t border-amber-200/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-amber-950">
                        Biaya USD Lainnya (Other USD Costs)
                      </Label>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-amber-300 bg-white text-amber-900 hover:bg-amber-100/60"
                          onClick={() => setOtherCosts((prev) => [...prev, { note: '', amount: 0 }])}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Tambah List Other
                        </Button>
                      )}
                    </div>

                    {otherCosts.length === 0 ? (
                      <div className="rounded-md border border-dashed border-amber-200 bg-white/60 p-3 text-center text-xs text-amber-700/70">
                        Belum ada nominal biaya USD lainnya. Klik &quot;Tambah List Other&quot; untuk menambahkan.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-md border border-amber-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-amber-100/60 text-amber-900 font-semibold border-b border-amber-200">
                            <tr>
                              <th className="px-3 py-2 w-[40px]">No</th>
                              <th className="px-3 py-2">Keterangan / Catatan</th>
                              <th className="px-3 py-2 text-right w-[180px]">Nominal (USD)</th>
                              {!readOnly && <th className="px-3 py-2 text-center w-[50px]">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100">
                            {otherCosts.map((item, index) => (
                              <tr key={index} className="hover:bg-amber-50/40">
                                <td className="px-3 py-2 font-medium text-amber-800">{index + 1}</td>
                                <td className="px-3 py-2">
                                  <Input
                                    placeholder="Keterangan biaya (misal: Biaya karantina USD)"
                                    value={item.note}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOtherCosts((prev) =>
                                        prev.map((row, i) => (i === index ? { ...row, note: val } : row))
                                      );
                                    }}
                                    disabled={readOnly}
                                    className="h-8 border-amber-200 text-xs bg-white focus:border-amber-400"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <MoneyInput
                                    currency="USD"
                                    placeholder="$ 0.00"
                                    value={item.amount}
                                    onChangeValue={(val) => {
                                      setOtherCosts((prev) =>
                                        prev.map((row, i) => (i === index ? { ...row, amount: val } : row))
                                      );
                                    }}
                                    disabled={readOnly}
                                    className="h-8 border-amber-200 text-xs text-right bg-white focus:border-amber-400"
                                  />
                                </td>
                                {!readOnly && (
                                  <td className="px-3 py-2 text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      onClick={() => setOtherCosts((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Summary Totals USD */}
                  <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between text-xs text-amber-950 font-medium gap-2">
                    <div>
                      <span>Total Biaya USD: </span>
                      <span className="font-bold text-amber-900">
                        {currenciesFormat('usd', formula?.total_usd_cost ?? compiledUsdCosts.reduce((s, c) => s + c.amount, 0))}
                      </span>
                    </div>
                    <div>
                      <span>Total Transaksi (USD): </span>
                      <span className="font-bold text-amber-900 text-sm">
                        {currenciesFormat('usd', formula?.price_total_usd ?? ((Number(form.watch('priceUsd') ?? 0)) + (formula?.total_usd_cost ?? compiledUsdCosts.reduce((s, c) => s + c.amount, 0))))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bbnPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Biaya BBN</FormLabel>
                      <FormControl>
                        <MoneyInput placeholder="Value" name={field.name} value={Number(field.value) || 0} onChangeValue={(val) => field.onChange(val)} onBlur={field.onBlur} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expeditionFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Biaya Ekspedisi</FormLabel>
                      <FormControl>
                        <MoneyInput placeholder="Value" name={field.name} value={Number(field.value) || 0} onChangeValue={(val) => field.onChange(val)} onBlur={field.onBlur} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex flex-row justify-between">
                        Biaya Lain
                      </FormLabel>
                      <FormControl>
                        <MoneyInput placeholder="Value" name={field.name} value={Number(field.value) || 0} onChangeValue={(val) => field.onChange(val)} onBlur={field.onBlur} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormItem>
                  <FormLabel className="text-sm font-medium">HPP Satuan</FormLabel>
                  <FormControl>
                    <Input value={formatCurrency(hppPerUnit)} className="bg-muted/50" disabled readOnly />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-sm font-medium">DPP Satuan</FormLabel>
                  <FormControl>
                    <Input value={formatCurrency(dppPerUnit)} className="bg-muted/50" disabled readOnly />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-sm font-medium">PPN Satuan</FormLabel>
                  <FormControl>
                    <Input value={formatCurrency(ppnPerUnit)} className="bg-muted/50" disabled readOnly />
                  </FormControl>
                </FormItem>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormItem>
                  <FormLabel className="text-sm font-medium">HPP Total</FormLabel>
                  <FormControl>
                    <Input value={formatCurrency(hppTotal)} className="bg-muted/50" disabled readOnly />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-sm font-medium">DPP Total</FormLabel>
                  <FormControl>
                    <Input value={formatCurrency(dppTotal)} className="bg-muted/50" disabled readOnly />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-sm font-medium">PPN Total</FormLabel>
                  <FormControl>
                    <Input value={formatCurrency(ppnTotal)} className="bg-muted/50" disabled readOnly />
                  </FormControl>
                </FormItem>
              </div>
            </>
          )}

          <div className="flex justify-center items-center gap-6 pt-10">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading || cancelDisabled}>
              Batal
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading || submitDisabled} variant="default">
                {loading ? (
                  'Menyimpan...'
                ) : (
                  <>
                    Simpan
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>

      <TypeUnitFormModal
        open={openTypeModal}
        onOpenChange={setOpenTypeModal}
        onCreated={(created) => {
          setCreatedTypeUnit(created);
          selectTypeUnit(created);
        }}
      />
    </>
  );
}
