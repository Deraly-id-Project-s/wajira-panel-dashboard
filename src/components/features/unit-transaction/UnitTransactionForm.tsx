import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatCurrency } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { Save, Plus, ChevronsUpDown, Check } from 'lucide-react';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import type { TypeUnit } from '@/@types/type-unit.types';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useUnitFormula } from '@/hooks/useUnitFormula';
import { useTaxDefault } from '@/hooks/useTax';
import RequiredMark from '@/components/ui/required-mark';
import { TypeUnitFormModal } from '@/components/features/type-unit/TypeUnitFormModal';
import { unitTransactionSchema, type UnitTransactionFormValues } from './unit-transaction.schema';

export interface UnitTransactionFormProps {
  type: 'purchase' | 'sales';
  onSubmit: (data: UnitTransactionFormValues) => void;
  defaultValues?: Partial<UnitTransactionFormValues> & { dppTaxVersionId?: string | number | null; ppnTaxVersionId?: string | number | null };
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
  const [openTypeSelect, setOpenTypeSelect] = useState(false);
  const [isUsd, setIsUsd] = useState(Boolean(defaultValues?.priceUsd && Number(defaultValues.priceUsd) > 0));

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

  const { formula } = useUnitFormula({
    qty_total: qty,
    price,
    bbn_price: bbnPrice,
    expedition_fee: expeditionFee,
    other_fee: otherFee,
    dpp_tax_id: selectedDppTaxVersionId ?? undefined,
    ppn_tax_id: selectedPpnTaxVersionId ?? undefined,
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
    setOpenTypeSelect(false);
  };

  const handleFormSubmit = (values: UnitTransactionFormValues) => {
    onSubmit({
      ...values,
      priceUsd: Number(values.priceUsd) || 0,
      pricePerUnitUsd: Number(values.pricePerUnitUsd) || 0,
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
          <div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Informasi {type === 'purchase' ? 'Pembelian' : 'Penjualan'}</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola detail informasi {type === 'purchase' ? 'pembelian' : 'penjualan'} unit dan biaya-biaya terkait</p>
            <div className="my-6 h-px bg-muted/60" />
          </div>

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
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <Popover open={openTypeSelect} onOpenChange={setOpenTypeSelect}>
                          <FormControl>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                role="combobox"
                                aria-expanded={openTypeSelect}
                                aria-controls={`type-unit-${type}-combobox-list`}
                                disabled={readOnly}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 min-w-0"
                              >
                                <span className={cn('truncate', !field.value && 'text-muted-foreground')}>
                                  {field.value ? typeUnitOptions.find((option) => String(option.id) === field.value)?.name ?? 'Pilih tipe unit' : 'Pilih tipe unit'}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </button>
                            </PopoverTrigger>
                          </FormControl>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Cari tipe unit..." />
                              <CommandList id={`type-unit-${type}-combobox-list`}>
                                {typeUnitLoading && <div className="px-3 py-2 text-xs text-muted-foreground">Memuat tipe unit...</div>}
                                {typeUnitError && (
                                  <div className="px-3 py-2 text-xs text-destructive">
                                    Gagal memuat tipe unit.{' '}
                                    <button type="button" className="underline" onClick={() => refetchTypeUnits()}>
                                      Coba lagi
                                    </button>
                                  </div>
                                )}
                                <CommandEmpty>Tipe unit tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {typeUnitOptions.map((option) => (
                                    <CommandItem
                                      key={option.id}
                                      value={`${option.name} ${option.code ?? ''} ${option.id}`}
                                      disabled={excludedTypeUnitIds.includes(String(option.id))}
                                      onSelect={() => !excludedTypeUnitIds.includes(String(option.id)) && selectTypeUnit(option)}
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', field.value === String(option.id) ? 'opacity-100' : 'opacity-0')} />
                                      <span className="truncate">{option.name}</span>
                                      {excludedTypeUnitIds.includes(String(option.id)) && <span className="ml-auto text-xs text-muted-foreground">Sudah ditambahkan</span>}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {allowCreateTypeUnit && !readOnly && (
                          <Button type="button" variant="outline" size="icon" aria-label="Tambah tipe unit" onClick={() => setOpenTypeModal(true)} className="h-10 w-10 shrink-0">
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
                <input autoComplete="off"
                  type="checkbox"
                  id={`${type}_is_usd`}
                  checked={isUsd}
                  onChange={(e) => {
                    setIsUsd(e.target.checked);
                    if (!e.target.checked) {
                      form.setValue('priceUsd', 0);
                      form.setValue('pricePerUnitUsd', 0);
                    }
                  }}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor={`${type}_is_usd`} className="text-sm font-medium cursor-pointer">
                  Transaksi USD (Gunakan mata uang asing USD)
                </Label>
              </div>

              {/* USD Inputs */}
              {isUsd && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-md border border-amber-200 bg-amber-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <FormField
                    control={form.control}
                    name="priceUsd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-amber-900">Total Harga (USD)</FormLabel>
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
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading || cancelDisabled} className="text-muted-foreground font-medium hover:text-foreground">
              Batal
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading || submitDisabled} className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium min-w-[120px] rounded-lg">
                {loading ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
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
