import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/ui/loading-state';
import type { WarehouseSubBlock } from '@/services/warehouseBlock.service';
import RequiredMark from '@/components/ui/required-mark';

const warehouseSubBlockSchema = z.object({
  name: z.string().min(1, 'Nama sub blok wajib diisi'),
  description: z.string().optional(),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

export type WarehouseSubBlockFormValues = z.infer<typeof warehouseSubBlockSchema>;

interface WarehouseSubBlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: WarehouseSubBlock;
  baseWarehouseBlockId: number;
  onSubmit: (data: WarehouseSubBlockFormValues) => void;
  isSubmitting?: boolean;
}

export function WarehouseSubBlockForm({
  open,
  onOpenChange,
  initialData,
  baseWarehouseBlockId,
  onSubmit,
  isSubmitting,
}: WarehouseSubBlockFormProps) {
  const form = useForm<WarehouseSubBlockFormValues>({
    resolver: zodResolver(warehouseSubBlockSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      is_default: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || '',
          is_active: String(initialData.is_active) === '1' || String(initialData.is_active) === 'true' || initialData.is_active === true,
          is_default: String(initialData.is_default) === '1' || String(initialData.is_default) === 'true' || initialData.is_default === true,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          is_active: true,
          is_default: false,
        });
      }
    }
  }, [initialData, form, open]);

  const handleSubmit = (values: WarehouseSubBlockFormValues) => {
    onSubmit({
      ...values,
      description: values.description || '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Sub Blok Gudang' : 'Tambah Sub Blok Gudang'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sub Blok <RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="cth: Sub Blok A-1" disabled={isSubmitting} {...field} />
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
                    <Textarea
                      placeholder="Masukkan deskripsi opsional"
                      disabled={isSubmitting}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-6 pt-2">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-sm font-medium">Status Aktif</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-sm font-medium">Jadikan Default</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || (initialData && (String(initialData.is_default) === '1' || String(initialData.is_default) === 'true' || initialData.is_default === true))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="btn-primary!">
                {isSubmitting && <LoadingState variant="inline" text={null} />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
