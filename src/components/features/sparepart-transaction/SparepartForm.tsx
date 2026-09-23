'use client';

import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { SelectAdd } from '@/components/ui/select-add';
import RequiredMark from '@/components/ui/required-mark';
import { useSuppliers, useCreateSupplier } from '@/hooks/useSupplier';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomer';
import { useSpareparts } from '@/hooks/useSparepart';
import { useCompany } from '@/contexts/CompanyContext';
import { useEffect, useState, useMemo } from 'react';
import { ChevronsUpDown, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { handleApiFormError } from '@/lib/validation';
import { z } from 'zod';
import { SupplierFormModal } from '@/components/features/supplier/SupplierFormModal';
import { CustomerFormModal } from '@/components/features/customer/CustomerFormModal';
import { SparepartFormDialog } from '@/components/features/sparepart/SparepartFormDialog';
import { createSupplierSchema, type CreateSupplierFormValues } from '@/scheme/supplier.schema';
import { customerSchema, type CustomerFormValues } from '@/scheme/customer.schema';

const createSparepartTransactionSchema = (type: 'purchase' | 'sales') =>
  z.object({
    company_id: z.string().or(z.number()).transform((val) => String(val)),
    person_id: z
      .string()
      .or(z.number())
      .transform((val) => Number(val))
      .refine((val) => val > 0, type === 'sales' ? 'Customer wajib diisi' : 'Supplier wajib diisi'),
    sparepart_id: z
      .string()
      .or(z.number())
      .transform((val) => Number(val))
      .refine((val) => val > 0, 'Sparepart wajib diisi'),
    qty: z.coerce.number().min(1, 'Minimal kuantitas adalah 1'),
    price: z.coerce.number().min(0, 'Harga tidak valid'),
    discount: z.coerce.number().min(0, 'Diskon tidak valid').default(0),
    transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
    nota_number: z.string().min(1, 'No Nota wajib diisi'),
    billing_type: z.enum(['cash', 'credit']).default('cash'),
    billing_due_date: z.string().optional().nullable(),
    note: z.string().optional(),
  });

export type SparepartTransactionFormData = z.infer<ReturnType<typeof createSparepartTransactionSchema>>;

export interface SparepartFormProps {
  type?: 'purchase' | 'sales';
  defaultValues?: Partial<SparepartTransactionFormData>;
  onSubmit: (data: SparepartTransactionFormData, form: UseFormReturn<SparepartTransactionFormData>) => Promise<void> | void;
  onCancel: () => void;
  readOnly?: boolean;
  companyId?: string | null;
}

export function SparepartForm({
  type = 'purchase',
  defaultValues,
  onSubmit,
  onCancel,
  readOnly,
  companyId: propCompanyId,
}: SparepartFormProps) {
  const { companyId: contextCompanyId } = useCompany();
  const companyId = propCompanyId || contextCompanyId;
  const isSales = type === 'sales';

  // Data queries
  const { data: suppliers } = useSuppliers({
    company_id: companyId ?? undefined,
    sort_order: 'asc',
    enabled: !isSales && Boolean(companyId),
  });
  const { data: customers } = useCustomers({
    company_id: companyId ?? undefined,
    enabled: isSales && Boolean(companyId),
  });
  const { data: spareparts } = useSpareparts(companyId ?? undefined);

  // Popover state
  const [openParty, setOpenParty] = useState(false);
  const [openSparepart, setOpenSparepart] = useState(false);

  // Modals for SelectAdd
  const [openSupplierModal, setOpenSupplierModal] = useState(false);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openSparepartDialog, setOpenSparepartDialog] = useState(false);

  const createSupplierMutation = useCreateSupplier();
  const createCustomerMutation = useCreateCustomer();

  const supplierModalForm = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      npwp: '',
      pic: '',
    },
  });

  const customerModalForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      npwp: '',
      pic: '',
      map_link: '',
      map_coordinat: null,
    },
  });

  const schema = useMemo(() => createSparepartTransactionSchema(type), [type]);

  const form = useForm<SparepartTransactionFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      company_id: String(companyId || defaultValues?.company_id || ''),
      person_id: defaultValues?.person_id || 0,
      sparepart_id: defaultValues?.sparepart_id || 0,
      qty: defaultValues?.qty || 1,
      price: defaultValues?.price || 0,
      discount: defaultValues?.discount || 0,
      transaction_date: defaultValues?.transaction_date || new Date().toISOString().split('T')[0],
      nota_number: defaultValues?.nota_number || '',
      billing_type: defaultValues?.billing_type || 'cash',
      billing_due_date: defaultValues?.billing_due_date || null,
      note: defaultValues?.note || '',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        company_id: String(companyId || defaultValues.company_id || ''),
        person_id: defaultValues.person_id || 0,
        sparepart_id: defaultValues.sparepart_id || 0,
        qty: defaultValues.qty || 1,
        price: defaultValues.price || 0,
        discount: defaultValues.discount || 0,
        transaction_date: defaultValues.transaction_date || new Date().toISOString().split('T')[0],
        nota_number: defaultValues.nota_number || '',
        billing_type: defaultValues.billing_type || 'cash',
        billing_due_date: defaultValues.billing_due_date || null,
        note: defaultValues.note || '',
      });
    }
  }, [defaultValues, form, companyId]);

  const qty = form.watch('qty') || 0;
  const price = form.watch('price') || 0;
  const discount = form.watch('discount') || 0;
  const bruto = qty * price;
  const netto = bruto - bruto * (discount / 100);

  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const handleFormSubmit = async (values: SparepartTransactionFormData) => {
    try {
      setIsSubmittingLocal(true);
      await onSubmit(values, form);
    } catch (error) {
      handleApiFormError(error, form);
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isSubmittingLocal;

  const handleCreateSupplier = async (values: CreateSupplierFormValues) => {
    try {
      const res = await createSupplierMutation.mutateAsync({
        ...values,
        companyId: companyId ? Number(companyId) : undefined,
      });
      toast.success('Supplier berhasil ditambahkan');
      const newId = (res as any)?.data?.id ?? (res as any)?.id;
      if (newId) {
        form.setValue('person_id', Number(newId), { shouldValidate: true, shouldDirty: true });
        form.clearErrors('person_id');
      }
      setOpenSupplierModal(false);
      supplierModalForm.reset();
    } catch (err: any) {
      const handled = handleApiFormError(err, supplierModalForm);
      if (!handled) {
        toast.error(err?.message || 'Gagal menambahkan supplier');
      }
    }
  };

  const handleCreateCustomer = async (values: CustomerFormValues) => {
    try {
      const res = await createCustomerMutation.mutateAsync({
        ...values,
        companyId: companyId ? Number(companyId) : undefined,
      });
      toast.success('Customer berhasil ditambahkan');
      const newId = (res as any)?.data?.id ?? (res as any)?.id;
      if (newId) {
        form.setValue('person_id', Number(newId), { shouldValidate: true, shouldDirty: true });
        form.clearErrors('person_id');
      }
      setOpenCustomerModal(false);
      customerModalForm.reset();
    } catch (err: any) {
      const handled = handleApiFormError(err, customerModalForm);
      if (!handled) {
        toast.error(err?.message || 'Gagal menambahkan customer');
      }
    }
  };

  const handleSparepartCreated = (newId: number) => {
    form.setValue('sparepart_id', Number(newId), { shouldValidate: true, shouldDirty: true });
    form.clearErrors('sparepart_id');
    setOpenSparepartDialog(false);
  };

  const personId = form.watch('person_id');
  const sparepartId = form.watch('sparepart_id');

  const selectedPartyName = useMemo(() => {
    if (!personId) return null;
    if (isSales) {
      return customers?.data?.find((c: any) => String(c.id) === String(personId))?.name;
    }
    return suppliers?.data?.find((s: any) => String(s.id) === String(personId))?.name;
  }, [personId, isSales, customers, suppliers]);

  const selectedSparepartLabel = useMemo(() => {
    if (!sparepartId) return null;
    const sp = spareparts?.data?.find((s: any) => String(s.id) === String(sparepartId));
    return sp ? `${sp.name} (${sp.code})` : null;
  }, [sparepartId, spareparts]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {isSales ? 'Informasi Penjualan Sparepart' : 'Informasi Pembelian Sparepart'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isSales
                ? 'Lengkapi data penjualan sparepart di bawah ini'
                : 'Lengkapi data pembelian sparepart di bawah ini'}
            </p>
            <div className="my-6 h-px bg-muted/60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nota_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    No Nota Referensi<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly} placeholder="Contoh: NOTA-12345" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tanggal Transaksi<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <InputDate {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Party field (Supplier or Customer) */}
            <FormField
              control={form.control}
              name="person_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isSales ? 'Customer' : 'Supplier'}<RequiredMark />
                  </FormLabel>
                  <SelectAdd
                    onAdd={() => (isSales ? setOpenCustomerModal(true) : setOpenSupplierModal(true))}
                    addDisabled={readOnly}
                    addLabel={isSales ? 'Tambah Customer' : 'Tambah Supplier'}
                    addVariant="default"
                  >
                    <Popover open={openParty} onOpenChange={setOpenParty}>
                      <FormControl>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-controls="party-popover"
                            aria-expanded={openParty}
                            disabled={readOnly}
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <span className="truncate">
                              {selectedPartyName || (isSales ? 'Pilih Customer' : 'Pilih Supplier')}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={isSales ? 'Cari Customer...' : 'Cari Supplier...'} />
                          <CommandList>
                            <CommandEmpty>
                              {isSales ? 'Customer tidak ditemukan.' : 'Supplier tidak ditemukan.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {isSales
                                ? customers?.data?.map((c: any) => (
                                    <CommandItem
                                      key={c.id}
                                      value={`${c.name} ${c.id}`}
                                      onSelect={() => {
                                        form.setValue('person_id', Number(c.id));
                                        form.clearErrors('person_id');
                                        setOpenParty(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          String(field.value) === String(c.id) ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      {c.name}
                                    </CommandItem>
                                  ))
                                : suppliers?.data?.map((s: any) => (
                                    <CommandItem
                                      key={s.id}
                                      value={`${s.name} ${s.id}`}
                                      onSelect={() => {
                                        form.setValue('person_id', Number(s.id));
                                        form.clearErrors('person_id');
                                        setOpenParty(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          String(field.value) === String(s.id) ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      {s.name}
                                    </CommandItem>
                                  ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </SelectAdd>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sparepart field with SelectAdd */}
            <FormField
              control={form.control}
              name="sparepart_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sparepart<RequiredMark />
                  </FormLabel>
                  <SelectAdd
                    onAdd={() => setOpenSparepartDialog(true)}
                    addDisabled={readOnly}
                    addLabel="Tambah Sparepart"
                    addVariant="default"
                  >
                    <Popover open={openSparepart} onOpenChange={setOpenSparepart}>
                      <FormControl>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-controls="sparepart-popover"
                            aria-expanded={openSparepart}
                            disabled={readOnly}
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <span className="truncate">{selectedSparepartLabel || 'Pilih Sparepart'}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari Sparepart..." />
                          <CommandList>
                            <CommandEmpty>Sparepart tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {spareparts?.data?.map((s: any) => (
                                <CommandItem
                                  key={s.id}
                                  value={`${s.name} ${s.code} ${s.id}`}
                                  onSelect={() => {
                                    form.setValue('sparepart_id', Number(s.id));
                                    const defaultPrice = isSales
                                      ? (s.sellingPrice ?? s.price ?? 0)
                                      : (s.purchasePrice ?? s.price ?? 0);
                                    form.setValue('price', Number(defaultPrice), {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                    form.clearErrors('sparepart_id');
                                    setOpenSparepart(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      String(field.value) === String(s.id) ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {s.name} ({s.code})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </SelectAdd>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Pembayaran</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'cash'} disabled={readOnly}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pembayaran" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash / Tunai</SelectItem>
                      <SelectItem value="credit">Kredit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    QTY (Jumlah Barang)<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isSales ? 'Harga Jual Satuan' : 'Harga Beli Satuan'}<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <MoneyInput
                      name={field.name}
                      value={field.value}
                      onChangeValue={field.onChange}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diskon (%)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-md border border-slate-200">
            <FormItem>
              <FormLabel>Total Bruto</FormLabel>
              <FormControl>
                <MoneyInput disabled value={bruto} onChangeValue={() => {}} />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Total Netto</FormLabel>
              <FormControl>
                <MoneyInput disabled value={netto} onChangeValue={() => {}} />
              </FormControl>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={readOnly}
                    placeholder="Tambahkan catatan jika diperlukan..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center items-center gap-4 pt-10">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-w-[120px] h-10 border-slate-300"
            >
              Batal
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px] h-10 bg-[#1e293b] hover:bg-[#0f172a] text-white"
              >
                {isSubmitting ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Simpan
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Supplier Form Modal */}
      {!isSales && (
        <SupplierFormModal
          open={openSupplierModal}
          onOpenChange={setOpenSupplierModal}
          form={supplierModalForm}
          onSubmit={handleCreateSupplier}
          title="Tambah Supplier"
          description="Tambahkan data supplier baru"
          isSubmitting={createSupplierMutation.isPending}
        />
      )}

      {/* Customer Form Modal */}
      {isSales && (
        <CustomerFormModal
          open={openCustomerModal}
          onOpenChange={setOpenCustomerModal}
          form={customerModalForm}
          onSubmit={handleCreateCustomer}
          title="Tambah Customer"
          description="Tambahkan data customer baru"
          isSubmitting={createCustomerMutation.isPending}
        />
      )}

      {/* Sparepart Form Dialog */}
      <SparepartFormDialog
        open={openSparepartDialog}
        onOpenChange={setOpenSparepartDialog}
        sparepart={null}
        companyId={String(companyId || '1')}
        onCreated={handleSparepartCreated}
      />
    </>
  );
}

export { SparepartForm as SparepartTransactionForm };
