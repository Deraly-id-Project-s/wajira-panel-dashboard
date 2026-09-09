import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { purchaseSparepartSchema, PurchaseSparepartFormData } from './purchase-sparepart.schema';
import { Textarea } from '@/components/ui/textarea';
import { useSuppliers } from '@/hooks/useSupplier';
import { useSpareparts } from '@/hooks/useSparepart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface Props {
  defaultValues?: Partial<PurchaseSparepartFormData>;
  onSubmit: (data: PurchaseSparepartFormData) => void;
  onCancel: () => void;
  readOnly?: boolean;
  companyId?: string | null;
}

export function PurchaseSparepartForm({ defaultValues, onSubmit, onCancel, readOnly, companyId: propCompanyId }: Props) {
  const { companyId: contextCompanyId } = useCompany();
  const companyId = propCompanyId || contextCompanyId;
  const { data: suppliers } = useSuppliers({ company_id: companyId ?? undefined, sort_order: 'asc' });
  const { data: spareparts } = useSpareparts(companyId ?? undefined);

  const [openSupplier, setOpenSupplier] = useState(false);
  const [openSparepart, setOpenSparepart] = useState(false);

  const form = useForm<PurchaseSparepartFormData>({
    resolver: zodResolver(purchaseSparepartSchema) as any,
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
  const netto = bruto - (bruto * (discount / 100));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Informasi Pembelian Sparepart</h2>
          <p className="text-sm text-gray-500 mt-1">Lengkapi data pembelian sparepart di bawah ini</p>
          <div className="my-6 h-px bg-muted/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="nota_number" render={({ field }) => (
            <FormItem>
              <FormLabel>No Nota Referensi</FormLabel>
              <FormControl><Input {...field} disabled={readOnly} placeholder="Contoh: NOTA-12345" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="transaction_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Transaksi</FormLabel>
              <FormControl><Input type="date" {...field} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="person_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                <FormControl>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-controls="supplier-popover"
                      aria-expanded={openSupplier}
                      disabled={readOnly}
                      className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                    >
                      <span className="truncate">
                        {field.value ? suppliers?.data?.find((s: any) => String(s.id) === String(field.value))?.name : "Pilih Supplier"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari Supplier..." />
                    <CommandList>
                      <CommandEmpty>Supplier tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {suppliers?.data?.map((s: any) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.name} ${s.id}`}
                            onSelect={() => {
                              form.setValue("person_id", Number(s.id));
                              form.clearErrors("person_id");
                              setOpenSupplier(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", String(field.value) === String(s.id) ? "opacity-100" : "opacity-0")} />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="sparepart_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Sparepart</FormLabel>
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
                      className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                    >
                      <span className="truncate">
                        {field.value ? (() => {
                          const sp = spareparts?.data?.find((s: any) => String(s.id) === String(field.value));
                          return sp ? `${sp.name} (${sp.code})` : "Pilih Sparepart";
                        })() : "Pilih Sparepart"}
                      </span>
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
                              form.setValue("sparepart_id", Number(s.id));
                              form.setValue("price", Number(s.purchasePrice ?? 0), { shouldValidate: true, shouldDirty: true });
                              form.clearErrors("sparepart_id");
                              setOpenSparepart(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", String(field.value) === String(s.id) ? "opacity-100" : "opacity-0")} />
                            {s.name} ({s.code})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="billing_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Pembayaran</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'cash'} disabled={readOnly}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Pilih Pembayaran" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash / Tunai</SelectItem>
                  <SelectItem value="credit">Kredit</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="qty" render={({ field }) => (
            <FormItem>
              <FormLabel>QTY (Jumlah Barang)</FormLabel>
              <FormControl><Input type="number" {...field} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>Harga Beli Satuan</FormLabel>
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
          )} />

          <FormField control={form.control} name="discount" render={({ field }) => (
            <FormItem>
              <FormLabel>Diskon (%)</FormLabel>
              <FormControl><Input type="number" {...field} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-md border border-slate-200">
          <FormItem>
            <FormLabel>Total Bruto</FormLabel>
            <FormControl>
              <MoneyInput disabled value={bruto} onChangeValue={() => { }} />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Total Netto</FormLabel>
            <FormControl>
              <MoneyInput disabled value={netto} onChangeValue={() => { }} />
            </FormControl>
          </FormItem>
        </div>

        <FormField control={form.control} name="note" render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan</FormLabel>
            <FormControl><Textarea {...field} disabled={readOnly} placeholder="Tambahkan catatan jika diperlukan..." rows={3} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-center items-center gap-4 pt-10">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>Batal</Button>
          {!readOnly && (
            <Button type="submit" variant="default" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
