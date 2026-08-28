import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegionFormData } from './RegionFormModal';
import type { Region } from '@/@types/region.types';

interface EditRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: RegionFormData) => void;
    initialData: Region | null;
}

export function EditRegionModal({ isOpen, onClose, onSave, initialData }: EditRegionModalProps) {
    if (!initialData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Data Wilayah</DialogTitle>
                    <DialogDescription>
                        Perbarui detail data wilayah ini
                    </DialogDescription>
                </DialogHeader>
                
                <EditRegionInnerForm 
                    initialData={initialData} 
                    onClose={onClose} 
                    onSave={onSave} 
                />
            </DialogContent>
        </Dialog>
    );
}

interface InnerProps {
    initialData: Region;
    onClose: () => void;
    onSave: (data: RegionFormData) => void;
}

function EditRegionInnerForm({ initialData, onClose, onSave }: InnerProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<RegionFormData>({
        defaultValues: {
            code: initialData.code || '',
            name: initialData.name || ''
        }
    });

    const onSubmit = (data: RegionFormData) => {
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="edit-code">Kode Wilayah</Label>
                <Input
                    id="edit-code"
                    placeholder="Masukkan kode wilayah"
                    {...register('code', { required: 'Kode Wilayah wajib diisi' })}
                    className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Wilayah</Label>
                <Input
                    id="edit-name"
                    placeholder="Masukkan nama wilayah"
                    {...register('name', { required: 'Nama Wilayah wajib diisi' })}
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col space-y-2 pt-4">
                <Button type="submit" className="btn-primary!">Simpan Perubahan</Button>
                <Button type="button" variant="outline" className="w-full" onClick={onClose}>Batal</Button>
            </div>
        </form>
    );
}
