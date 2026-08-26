import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';
import type { Tax } from '@/services/tax.service';

const taxSchema = z.object({
  code: z.string().min(1, 'Kode pajak wajib diisi'),
  name: z.string().min(1, 'Nama pajak wajib diisi'),
});

type TaxFormValues = z.infer<typeof taxSchema>;

interface TaxFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Tax;
  onSubmit: (data: TaxFormValues) => void;
  isSubmitting?: boolean;
}

export function TaxForm({ open, onOpenChange, initialData, onSubmit, isSubmitting }: TaxFormProps) {
  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      code: '',
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          code: initialData.code,
          name: initialData.name,
        });
      } else {
        form.reset({ code: '', name: '' });
      }
    }
  }, [initialData, form, open]);

  const handleSubmit = (values: TaxFormValues) => {
    onSubmit(values);
  };

  const isLocked = initialData?.is_lock === 1 || initialData?.is_lock === true;

  return (
    <Form {...form}>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={initialData ? 'Edit Pajak' : 'Tambah Pajak'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isSubmitting}
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Pajak</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan kode pajak, ct: pph23" disabled={isLocked || isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pajak</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama pajak" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormDialog>
    </Form>
  );
}
