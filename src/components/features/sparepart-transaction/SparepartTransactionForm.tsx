'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSuppliers } from '@/hooks/useSupplier';
import { useCustomers } from '@/hooks/useCustomer';
import { useSpareparts } from '@/hooks/useSparepart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { z } from 'zod';

export const sparepartTransactionSchema = z.object({
  company_id: z.string().optional(),
  person_id: z.coerce.number().min(1, 'Pihak terkait wajib dipilih'),
  sparepart_id: z.coerce.number().min(1, 'Sparepart wajib dipilih'),
  qty: z.coerce.number().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  discount: z.coerce.number().min(0, 'Diskon tidak boleh negatif').default(0),
  transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  nota_number: z.string().optional(),
  billing_type: z.enum(['cash', 'credit']).default('cash'),
  billing_due_date: z.string().nullable().optional(),
  note: z.string().optional(),
});

export type SparepartTransactionFormData = z.infer<typeof sparepartTransactionSchema>;

export interface SparepartTransactionFormProps {
  type: 'purchase' | 'sales';
  defaultValues?: Partial<SparepartTransactionFormData>;
  onSubmit: (data: SparepartTransactionFormData) => void;
  onCancel: () => void;
  readOnly?: boolean;
  companyId?: string | null;
  loading?: boolean;
}

export function SparepartTransactionForm({
  type,
  defaultValues,
  onSubmit,
  onCancel,
  readOnly,
  companyId: propCompanyId,
  loading = false,
}: SparepartTransactionFormProps) {
  const isPurchase = type === 'purchase';
  const { companyId: contextCompanyId } = useCompany();
  const companyId = propCompanyId || contextCompanyId;

  const { data: suppliers } = useSuppliers({ company_id: companyId ?? undefined, sort_order: 'asc' });
  const { data: customers } = useCustomers({ company_id: companyId ?? undefined });
  const { data: spareparts } = useSpareparts(companyId ?? undefined);

  const [openPerson, setOpenPerson] = useState(false);
  const [openSparepart, setOpenSparepart] = useState(false);

  const personList = useMemo(() => {
    if (isPurchase) {
      return (suppliers?.data ?? []).map((s: any) => ({ id: s.id, name: s.name, code: s.code }));
    }
    return (customers?.data ?? []).map((c: any) => ({ id: c.id, name: c.name, code: c.code }));
  }, [isPurchase, suppliers?.data, customers?.data]);

  const form = useForm<SparepartTransactionFormData>({
    resolver: zodResolver(sparepartTransactionSchema) as any,
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
  }, [defaultValues, companyId, form]);

  const watchedQty = form.watch('qty') || 0;
  const watchedPrice = form.watch('price') || 0;
  const watchedDiscount = form.watch('discount') || 0;
  const watchedBillingType = form.watch('billing_type');

  const subTotal = useMemo(() => watchedQty * watchedPrice, [watchedQty, watchedPrice]);
  const grandTotal = useMemo(() => Math.max(0, subTotal - watchedDiscount), [subTotal, watchedDiscount]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tanggal Transaksi */}
          <FormField
            control={form.control}
            name="transaction_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Tanggal Transaksi</FormLabel>
                <FormControl>
                  <Input type="date" disabled={readOnly} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Supplier / Customer */}
          <FormField
            control={form.control}
            name="person_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium mb-1">
                  {isPurchase ? 'Supplier' : 'Customer'}
                </FormLabel>
                <Popover open={openPerson} onOpenChange={setOpenPerson}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={readOnly}
                        className={cn(
                          'w-full justify-between font-normal text-left h-10',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? personList.find((p) => String(p.id) === String(field.value))?.name || `Pilih ${isPurchase ? 'Supplier' : 'Customer'}`
                          : `Pilih ${isPurchase ? 'Supplier' : 'Customer'}`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={`Cari ${isPurchase ? 'supplier' : 'customer'}...`} />
                      <CommandList>
                        <CommandEmpty>{isPurchase ? 'Supplier' : 'Customer'} tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {personList.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                form.setValue('person_id', p.id, { shouldValidate: true });
                                setOpenPerson(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  String(p.id) === String(field.value) ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sparepart */}
          <FormField
            control={form.control}
            name="sparepart_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium mb-1">Sparepart</FormLabel>
                <Popover open={openSparepart} onOpenChange={setOpenSparepart}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={readOnly}
                        className={cn(
                          'w-full justify-between font-normal text-left h-10',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? spareparts?.data?.find((s: any) => String(s.id) === String(field.value))?.name || 'Pilih Sparepart'
                          : 'Pilih Sparepart'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari sparepart..." />
                      <CommandList>
                        <CommandEmpty>Sparepart tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {(spareparts?.data ?? []).map((s: any) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                form.setValue('sparepart_id', s.id, { shouldValidate: true });
                                if (!form.getValues('price') || form.getValues('price') === 0) {
                                  form.setValue('price', isPurchase ? (s.purchase_price || s.price || 0) : (s.sale_price || s.price || 0));
                                }
                                setOpenSparepart(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  String(s.id) === String(field.value) ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{s.name}</span>
                                {s.part_number && (
                                  <span className="text-xs text-muted-foreground">PN: {s.part_number}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nomor Nota */}
          <FormField
            control={form.control}
            name="nota_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Nomor Nota / Invoice</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: NOTA-12345" disabled={readOnly} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Qty */}
          <FormField
            control={form.control}
            name="qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Jumlah (Qty)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    disabled={readOnly}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Harga Satuan */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Harga Satuan</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onChangeValue={(val: number) => field.onChange(val || 0)}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Diskon */}
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Diskon Total</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value || 0}
                    onChangeValue={(val: number) => field.onChange(val || 0)}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipe Pembayaran */}
          <FormField
            control={form.control}
            name="billing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Tipe Pembayaran</FormLabel>
                <Select
                  disabled={readOnly}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih tipe pembayaran" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Tunai (Cash)</SelectItem>
                    <SelectItem value="credit">Kredit (Tempo)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Jatuh Tempo (jika kredit) */}
          {watchedBillingType === 'credit' && (
            <FormField
              control={form.control}
              name="billing_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tanggal Jatuh Tempo</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={readOnly}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Ringkasan Total */}
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subTotal)}
            </span>
          </div>
          {watchedDiscount > 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Diskon:</span>
              <span className="font-semibold text-red-600">
                - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(watchedDiscount)}
              </span>
            </div>
          )}
          <div className="h-px bg-slate-200" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Grand Total:</span>
            <span className="text-[#1f4163]">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
            </span>
          </div>
        </div>

        {/* Catatan */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Catatan Tambahan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Keterangan transaksi..."
                  disabled={readOnly}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tombol Aksi */}
        {!readOnly && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#1f4163] hover:bg-[#152e4d]">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
