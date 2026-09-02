'use client';


import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import { SupplierCombobox } from '@/components/features/supplier/SupplierCombobox';
import { CustomerCombobox } from '@/components/features/customer/CustomerCombobox';
import { DocumentTemplateSelect } from '@/components/ui/document-template-select';

export const unitTransactionHeaderSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  personId: z.union([z.string(), z.number()]).refine((val) => val !== undefined && val !== null && val !== '', {
    message: 'Supplier/Customer wajib dipilih',
  }),
  personName: z.string().min(1, 'Supplier/Customer wajib dipilih'),
  personAddress: z.string().optional().nullable(),
  personNpwp: z.string().optional().nullable(),
  documentTemplateId: z.union([z.string(), z.number()]).nullable().optional(),
});

export type UnitTransactionHeaderFormValues = z.infer<typeof unitTransactionHeaderSchema>;

interface UnitTransactionHeaderFormProps {
  type: 'purchase' | 'sales';
  defaultValues?: Partial<UnitTransactionHeaderFormValues>;
  onSubmit: (data: UnitTransactionHeaderFormValues) => void;
  loading?: boolean;
  readOnly?: boolean;
  onCancel?: () => void;
  companyId?: string | number | null;
}

export function UnitTransactionHeaderForm({
  type,
  defaultValues,
  onSubmit,
  loading = false,
  readOnly = false,
  onCancel,
  companyId,
}: UnitTransactionHeaderFormProps) {
  const form = useForm<UnitTransactionHeaderFormValues>({
    resolver: zodResolver(unitTransactionHeaderSchema),
    defaultValues: {
      date: defaultValues?.date || '',
      personId: defaultValues?.personId || '',
      personName: defaultValues?.personName || '',
      personAddress: defaultValues?.personAddress || '',
      personNpwp: defaultValues?.personNpwp || '',
      documentTemplateId: defaultValues?.documentTemplateId ?? null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Informasi {type === 'purchase' ? 'Pembelian' : 'Penjualan'}
          </h2>
          <p className="text-sm text-gray-500">
            Kelola detail informasi {type === 'purchase' ? 'pembelian' : 'penjualan'} unit dan biaya-biaya terkait
          </p>
          <div className="h-px bg-muted/60 my-6" />
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Tanggal</FormLabel>
                <FormControl>
                  <Input type="date" disabled={readOnly} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personId"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-0">
                <FormLabel className="text-sm font-medium">
                  {type === 'purchase' ? 'Supplier' : 'Customer'}
                </FormLabel>
                {type === 'purchase' ? (
                  <SupplierCombobox
                    companyId={companyId}
                    selectedId={field.value}
                    selectedName={form.watch('personName')}
                    disabled={readOnly}
                    allowCreate
                    onSelect={(supplier) => {
                      field.onChange(String(supplier.id));
                      form.setValue('personName', supplier.name);
                      form.setValue('personAddress', supplier.address ?? '');
                      form.setValue('personNpwp', supplier.npwp ?? '');
                    }}
                  />
                ) : (
                  <CustomerCombobox
                    companyId={companyId}
                    selectedId={field.value}
                    selectedName={form.watch('personName')}
                    disabled={readOnly}
                    allowCreate
                    onSelect={(customer) => {
                      field.onChange(String(customer.id));
                      form.setValue('personName', customer.name);
                      form.setValue('personAddress', customer.address ?? '');
                      form.setValue('personNpwp', customer.npwp ?? '');
                    }}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Alamat</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`Alamat ${type === 'purchase' ? 'Supplier' : 'Customer'}`}
                    className="bg-transparent"
                    disabled={readOnly || true}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personNpwp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">NPWP</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`NPWP ${type === 'purchase' ? 'Supplier' : 'Customer'}`}
                    className="bg-transparent"
                    disabled={readOnly || true}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentTemplateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Document Template <span className="font-normal text-muted-foreground">(Opsional)</span>
                </FormLabel>
                <DocumentTemplateSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!readOnly && (
          <div className="flex justify-center items-center gap-6 pt-10">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="text-muted-foreground font-medium hover:text-foreground"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium min-w-[120px] rounded-lg"
            >
              {loading ? (
                'Menyimpan...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
