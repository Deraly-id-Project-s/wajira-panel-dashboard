import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetFormData } from './AssetFormModal';
import type { Asset } from '@/@types/asset.types';

interface EditAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AssetFormData) => void;
    initialData: Asset | null;
}

export function EditAssetModal({ isOpen, onClose, onSave, initialData }: EditAssetModalProps) {
    if (!initialData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Data Aset</DialogTitle>
                    <DialogDescription>
                        Perbarui detail aset
                    </DialogDescription>
                </DialogHeader>

                <EditAssetInnerForm
                    initialData={initialData}
                    onClose={onClose}
                    onSave={onSave}
                />
            </DialogContent>
        </Dialog>
    );
}

interface InnerProps {
    initialData: Asset;
    onClose: () => void;
    onSave: (data: AssetFormData) => void;
}

function EditAssetInnerForm({ initialData, onClose, onSave }: InnerProps) {
    const { register, handleSubmit, control, formState: { errors } } = useForm<AssetFormData>({
        defaultValues: {
            company_id: initialData.company_id,
            name: initialData.name || '',
            code: initialData.code || '',
            type: initialData.type || 'inventory',
        }
    });

    const onSubmit = (data: AssetFormData) => {
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

            {/* Kode Aset */}
            <div className="space-y-2">
                <Label htmlFor="edit-code" className="text-gray-900 font-medium">Kode Aset</Label>
                <Input
                    id="edit-code"
                    placeholder="Kosongkan jika ingin mengikuti auto generate backend"
                    {...register('code')}
                    className={errors.code ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500">Opsional. Tidak perlu diisi jika kode aset dikelola oleh sistem.</p>
            </div>

            {/* Nama Barang */}
            <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-gray-900 font-medium">Nama Barang</Label>
                <Input
                    id="edit-name"
                    placeholder="Contoh: Sapu"
                    {...register('name', { required: 'Nama barang wajib diisi' })}
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            {/* Tipe Aset */}
            <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-gray-900 font-medium">Tipe Aset</Label>
                <Controller
                    control={control}
                    name="type"
                    rules={{ required: 'Tipe aset wajib dipilih' }}
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select an item" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inventory">Inventaris Kantor</SelectItem>
                                <SelectItem value="vehicles">Kendaraan</SelectItem>
                                <SelectItem value="buildings">Bangunan</SelectItem>
                                <SelectItem value="land">Tanah</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
            </div>

            <div className="flex flex-col space-y-2 pt-2">
                <Button type="submit" className="btn-primary!">Simpan</Button>
                <Button type="button" variant="outline" className="w-full" onClick={onClose}>Batal</Button>
            </div>
        </form>
    );
}
