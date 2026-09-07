import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { FormDialog } from '@/components/ui/form-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getWarehouseDataList } from '@/services/warehouseBlock.service';
import type { WarehouseBlock } from '@/services/warehouseBlock.service';

const warehouseBlockSchema = z.object({
  warehouse_id: z.coerce.number().optional(),
  name: z.string().min(1, 'Nama blok wajib diisi'),
  description: z.string().optional(),
});

type WarehouseBlockFormValues = z.infer<typeof warehouseBlockSchema>;

interface WarehouseBlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: WarehouseBlock;
  onSubmit: (data: WarehouseBlockFormValues) => void;
  isSubmitting?: boolean;
}

export function WarehouseBlockForm({ open, onOpenChange, initialData, onSubmit, isSubmitting }: WarehouseBlockFormProps) {
  const form = useForm<WarehouseBlockFormValues>({
    resolver: zodResolver(warehouseBlockSchema),
    defaultValues: {
      warehouse_id: 0,
      name: '',
      description: '',
    },
  });

  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses-data-list'],
    queryFn: () => getWarehouseDataList(),
    enabled: open && !initialData,
  });

  const warehouses = useMemo(() => warehousesResponse?.data?.data || [], [warehousesResponse]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          warehouse_id: initialData.warehouse_id,
          name: initialData.name,
          description: initialData.description || '',
        });
      } else {
        form.reset({
          warehouse_id: warehouses[0]?.id || 0,
          name: '',
          description: '',
        });
      }
    }
  }, [initialData, form, open, warehouses]);

  useEffect(() => {
    if (open && !initialData && warehouses.length > 0 && !form.getValues('warehouse_id')) {
      form.setValue('warehouse_id', warehouses[0].id);
    }
  }, [open, initialData, warehouses, form]);

  const handleSubmit = (values: WarehouseBlockFormValues) => {
    onSubmit({
      ...values,
      description: values.description || '',
    });
  };

  return (
    <Form {...form}>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={initialData ? 'Edit Blok Gudang' : 'Tambah Blok Gudang'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isSubmitting}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Blok</FormLabel>
              <FormControl>
                <Input placeholder="cth: Blok A" disabled={isSubmitting} {...field} />
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
      </FormDialog>
    </Form>
  );
}
