import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BrandFormValues } from '@/scheme/brand.schema';

interface BrandFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<BrandFormValues>;
    onSubmit: (values: BrandFormValues) => void;
    title: string;
    description: string;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export function BrandFormModal({
    open,
    onOpenChange,
    form,
    onSubmit,
    title,
    description,
    submitLabel = 'Simpan',
    isSubmitting = false,
}: BrandFormModalProps) {
    const [preview, setPreview] = useState<string | null>(null);

    const logoValue = form.watch('image');

    useEffect(() => {
        if (!open) {
            setPreview(null);
            return;
        }

        if (logoValue) {
            if (typeof logoValue === 'string') {
                setPreview(logoValue);
            } else if (logoValue instanceof File) {
                const url = URL.createObjectURL(logoValue);
                setPreview(url);
                return () => URL.revokeObjectURL(url);
            }
        } else {
            setPreview(null);
        }
    }, [logoValue, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (val: any) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            onChange(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Merk <RequiredMark /></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nama merk" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field: { onChange } }) => (
                                <FormItem>
                                    <FormLabel>Logo / Gambar</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            {preview ? (
                                                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-slate-50">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                                                    <div className="absolute right-2 top-2">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon-sm"
                                                            onClick={() => {
                                                                onChange(null);
                                                                setPreview(null);
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-400 hover:bg-slate-100">
                                                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                                        <Upload className="mb-2 h-8 w-8 text-slate-400" />
                                                        <p className="text-xs text-slate-500">Klik atau seret gambar ke sini</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG atau WebP (Maks. 2MB)</p>
                                                    </div>
                                                    <input autoComplete="off"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) onChange(file);
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-2 pt-4">
                            <Button type="submit" variant="default" disabled={isSubmitting}>
                                {isSubmitting ? 'Menyimpan...' : submitLabel}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
