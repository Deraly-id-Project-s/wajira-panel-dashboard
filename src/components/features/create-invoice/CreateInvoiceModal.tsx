import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {  Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getCustomers } from '@/services/customer.service';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { createInvoiceSchema, type CreateInvoiceSchema } from '@/schemas/create-invoice.schema';
import { LoadingState } from '@/components/ui/loading-state';

type FormValues = CreateInvoiceSchema;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    customer_id: number;
    date: string;
    subject: string;
    letter_content: string;
    description: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function CreateInvoiceModal({ open, onOpenChange, onSubmit, isSubmitting = false }: Props) {
  const { companyId } = useCompany();
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const form = useForm<FormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      customerId: '',
      date: new Date().toISOString().slice(0, 10),
      subject: 'Invoice Ekspedisi',
      letterContent: 'Mohon pembayaran dapat dilakukan ke rekening perusahaan.',
      description: '',
    },
  });

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      form.reset({
        customerId: '',
        date: new Date().toISOString().slice(0, 10),
        subject: 'Invoice Ekspedisi',
        letterContent: 'Mohon pembayaran dapat dilakukan ke rekening perusahaan.',
        description: '',
      });
    }
  }, [form, open]);

  const customerQuery = useQuery({
    queryKey: ['create-invoice-customer-lookup', companyId, debouncedSearch],
    queryFn: () => getCustomers({ page: 1, perPage: 25, search: debouncedSearch, company_id: companyId || undefined }),
    enabled: open && !!companyId,
  });

  const customerOptions = (customerQuery.data?.data ?? []).map((customer) => ({
    value: String(customer.id),
    label: customer.name,
    subtitle: customer.code ?? customer.address ?? undefined,
  }));

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      customer_id: Number(values.customerId),
      date: values.date,
      subject: values.subject,
      letter_content: values.letterContent,
      description: values.description || '',
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] rounded-[24px] border-none p-0 shadow-2xl">
        <div className="rounded-[24px] bg-white p-6 md:p-7">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[28px] font-semibold tracking-[-0.03em] text-slate-950">Tambah Data Invoice</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Masukkan detail data invoice baru</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Customer</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        onSearchChange={setSearch}
                        options={customerOptions}
                        loading={customerQuery.isLoading}
                        placeholder="Masukkan nama customer"
                        searchPlaceholder="Cari customer..."
                        emptyText="Customer tidak ditemukan."
                        className="h-11 rounded-md border-slate-200 bg-white text-slate-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={(date) => field.onChange(date ? date.toISOString().slice(0, 10) : '')}
                          placeholder="Pilih tanggal"
                          className="h-11 rounded-md border-slate-200 bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perihal</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-11 rounded-md border-slate-200" placeholder="Contoh: Invoice Ekspedisi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="letterContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Isi Surat</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[128px] rounded-md border-slate-200" placeholder="Masukkan isi surat invoice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-md border-slate-200" placeholder="Deskripsi tambahan invoice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="h-11 rounded-md text-sm font-semibold button-theme-1!">
                  {isSubmitting ? (
                    <>
                      <LoadingState variant="inline" text={null} />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 w-full rounded-md border-slate-200 text-sm font-semibold text-slate-700">
                  Batal
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
