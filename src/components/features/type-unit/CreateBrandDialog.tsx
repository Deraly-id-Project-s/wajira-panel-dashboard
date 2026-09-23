'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateBrand } from '@/hooks/useBrand';
import { toast } from 'sonner';
import RequiredMark from '@/components/ui/required-mark';

const brandSchema = z.object({
  name: z.string().min(1, 'Nama merk wajib diisi'),
  description: z.string().optional().nullable(),
  image: z.any().optional().nullable(),
});

export type BrandFormValues = z.infer<typeof brandSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (brandId: number) => void;
}

export function CreateBrandDialog({ open, onOpenChange, onCreated }: Props) {
  const mutation = useCreateBrand();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: '', description: '', image: null },
  });

  useEffect(() => {
    if (!open) {
      reset({ name: '', description: '', image: null });
    }
  }, [open, reset]);

  const onSubmit = async (values: BrandFormValues) => {
    try {
      const brand = await mutation.mutateAsync({
        name: values.name,
        image: values.image as File | null | undefined,
      });
      toast.success('Merk berhasil dibuat');
      onOpenChange(false);
      reset();
      if (brand?.id && onCreated) onCreated(Number(brand.id));
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Gagal membuat merk';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Merk</DialogTitle>
          <DialogDescription>Masukkan detail grup baru</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nama Merk <RequiredMark /></label>
            <Controller control={control} name="name" render={({ field }) => <Input placeholder="Masukkan nama merk" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} />} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Deskripsi</label>
            <Controller control={control} name="description" render={({ field }) => <Textarea placeholder="Masukkan deskripsi" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} />} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Gambar (opsional)</label>
            <Controller control={control} name="image" render={({ field }) => <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />} />
            {errors.image && <p className="text-xs text-destructive">{errors.image.message as string}</p>}
          </div>

          <div className="space-y-2 pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Simpan
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
