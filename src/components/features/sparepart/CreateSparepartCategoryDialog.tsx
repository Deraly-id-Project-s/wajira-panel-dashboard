'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSparepartCategory } from '@/hooks/useSparepart';
import { toast } from 'sonner';

const categorySchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama grup wajib diisi'),
  description: z.string().optional(),
});

export type SparepartCategoryFormValues = z.infer<typeof categorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (categoryId: number) => void;
}

export function CreateSparepartCategoryDialog({ open, onOpenChange, onCreated }: Props) {
  const mutation = useCreateSparepartCategory();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SparepartCategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  useEffect(() => {
    if (!open) {
      reset({ code: '', name: '', description: '' });
    }
  }, [open, reset]);

  const onSubmit = async (values: SparepartCategoryFormValues) => {
    try {
      const category = await mutation.mutateAsync(values);
      toast.success('Grup berhasil dibuat');
      onOpenChange(false);
      reset();
      if (category?.id && onCreated) onCreated(category.id);
    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat grup');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Data Grup</DialogTitle>
          <DialogDescription>Masukkan detail grup baru</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nama Grup</label>
            <Controller control={control} name="name" render={({ field }) => <Input placeholder="Masukkan nama grup" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} />} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Kode Grup</label>
            <Controller control={control} name="code" render={({ field }) => <Input placeholder="Tambahkan kode" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} />} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Deskripsi</label>
            <Controller control={control} name="description" render={({ field }) => <Textarea placeholder="Masukkan deskripsi" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} />} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2 pt-2 flex flex-row gap-2 justify-end">
            <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
