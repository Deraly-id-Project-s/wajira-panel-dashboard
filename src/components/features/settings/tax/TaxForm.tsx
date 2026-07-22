import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Pajak' : 'Tambah Pajak'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#1e3a5f] hover:bg-[#152e4d]">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
