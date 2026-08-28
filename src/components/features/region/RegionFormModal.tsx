import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface RegionFormData {
    code: string;
    name: string;
}

interface RegionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: RegionFormData) => void;
}

export function RegionFormModal({ isOpen, onClose, onSave }: RegionFormModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<RegionFormData>({
        defaultValues: {
            code: '',
            name: ''
        }
    });

    useEffect(() => {
        if (!isOpen) {
            reset({ code: '', name: '' });
        }
    }, [isOpen, reset]);

    const onSubmit = (data: RegionFormData) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tambah Data Wilayah</DialogTitle>
                    <DialogDescription>
                        Masukkan detail wilayah baru
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Kode Wilayah</Label>
                            <Input
                                id="code"
                                placeholder="Masukkan kode wilayah"
                                {...register('code', { required: 'Kode Wilayah wajib diisi' })}
                                className={errors.code ? 'border-red-500' : ''}
                            />
                            {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Wilayah</Label>
                            <Input
                                id="name"
                                placeholder="Masukkan nama wilayah"
                                {...register('name', { required: 'Nama Wilayah wajib diisi' })}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                        </div>

                        <div className="flex flex-col space-y-2 pt-4">
                            <Button type="submit" className="btn-primary!">Simpan</Button>
                            <Button type="button" variant="outline" className="w-full" onClick={onClose}>Batal</Button>
                        </div>
                    </form>
            </DialogContent>
        </Dialog>
    );
}
