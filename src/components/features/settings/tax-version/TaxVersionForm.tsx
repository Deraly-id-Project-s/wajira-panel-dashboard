import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import type { TaxVersion } from '@/services/taxVersion.service';
import { ClampedNumericInput } from '@/components/ui/clamped-numeric-input';

const taxVersionSchema = z.object({
  name: z.string().min(1, 'Nama versi wajib diisi'),
  rate: z.number().min(0, 'Nilai tidak boleh minus'),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
  is_default: z.boolean(),
});

export type TaxVersionFormValues = z.infer<typeof taxVersionSchema>;

interface TaxVersionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TaxVersion;
  baseTaxId: number;
  onSubmit: (data: TaxVersionFormValues) => void;
  isSubmitting?: boolean;
}

export function TaxVersionForm({ open, onOpenChange, initialData, baseTaxId, onSubmit, isSubmitting }: TaxVersionFormProps) {
  const form = useForm<TaxVersionFormValues>({
    resolver: zodResolver(taxVersionSchema),
    defaultValues: {
      name: '',
      rate: 0,
      effective_from: '',
      effective_until: '',
      is_default: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          rate: Number(initialData.rate),
          effective_from: initialData.effective_from || '',
          effective_until: initialData.effective_until || '',
          is_default: initialData.is_default === 1 || initialData.is_default === true,
        });
      } else {
        form.reset({ name: '', rate: 0, effective_from: '', effective_until: '', is_default: false });
      }
    }
  }, [initialData, form, open]);

  const handleSubmit = (values: TaxVersionFormValues) => {
    onSubmit(values);
  };

  const isLocked = initialData?.is_lock === 1 || initialData?.is_lock === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Versi Pajak' : 'Tambah Versi Pajak'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Versi</FormLabel>
                  <FormControl>
                    <Input placeholder="cth: PPN 11%" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai/Rate</FormLabel>
                  <FormControl>
                    <ClampedNumericInput
                      placeholder="Masukkan rate/nilai"
                      value={field.value}
                      onChangeValue={field.onChange}
                      disabled={isSubmitting}
                      // e.g. clapping value, usually no tax over 100% or extremely large numbers for fixed amounts
                      max={9999999999}
                    />
                  </FormControl>
                  <FormDescription>
                    Masukkan nilai berupa persentase (%) atau nominal uang. "Sistem menjaga otomatis angka tidak melewati batas wajar (nominal clapping)." 
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Dari (Opsional)</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effective_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Sampai (Opsional)</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Jadikan Default</FormLabel>
                    <FormDescription>
                      Pilih jika ini versi utama. Data ini tak bisa dihapus jika terpilih.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting || isLocked}
                    />
                  </FormControl>
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
