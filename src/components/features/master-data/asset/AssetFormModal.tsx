import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetType } from '@/@types/asset.types';

export interface AssetFormData {
    company_id: number;
    name: string;
    code?: string;
    type: AssetType;
}

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AssetFormData) => void;
    companyId: number;
}

export function AssetFormModal({ isOpen, onClose, onSave, companyId }: AssetFormModalProps) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AssetFormData>({
        defaultValues: {
            company_id: companyId,
            name: '',
            code: '',
            type: 'inventory',
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                company_id: companyId,
                name: '',
                code: '',
                type: 'inventory',
            });
        }
    }, [isOpen, reset, companyId]);

    const onSubmit = (data: AssetFormData) => {
        onSave(data);
    };

    return (
        <FormDialog
            open={isOpen}
            onOpenChange={onClose}
            title="Tambah Data Aset"
            description="Masukkan detail aset baru"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-900 font-medium">Kode Aset</Label>
                <Input
                    id="code"
                    placeholder="Kosongkan jika ingin auto generate dari backend"
                    {...register('code')}
                    className={errors.code ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500">Opsional. Jika dikosongkan, kode aset akan dibuat otomatis oleh sistem.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-900 font-medium">Tipe Aset</Label>
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

            <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 font-medium">Nama Barang</Label>
                <Input
                    id="name"
                    placeholder="Contoh: Sapu"
                    {...register('name', { required: 'Nama barang wajib diisi' })}
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
        </FormDialog>
    );
}
