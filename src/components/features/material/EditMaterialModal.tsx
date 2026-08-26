import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { MaterialFormData } from './MaterialFormModal';
import type { Material } from '@/types/material.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: MaterialFormData) => void;
    initialData: Material | null;
}

export function EditMaterialModal({ isOpen, onClose, onSave, initialData }: EditMaterialModalProps) {
    if (!initialData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col rounded-md border-0 bg-white p-0 shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b shrink-0 text-left">
                    <DialogTitle className="text-[18px] font-semibold text-[#171717]">Edit Data Material</DialogTitle>
                    <DialogDescription className="text-[15px] text-[#71717A]">
                        Edit data material baru
                    </DialogDescription>
                </DialogHeader>

                <EditMaterialInnerForm
                    initialData={initialData}
                    onClose={onClose}
                    onSave={onSave}
                />
            </DialogContent>
        </Dialog>
    );
}

interface InnerProps {
    initialData: Material;
    onClose: () => void;
    onSave: (data: MaterialFormData) => void;
}

function EditMaterialInnerForm({ initialData, onClose, onSave }: InnerProps) {
    const { control, register, handleSubmit, formState: { errors } } = useForm<MaterialFormData>({
        defaultValues: {
            code: initialData.code || '',
            name: initialData.name || '',
            price: initialData.price || '',
            type: initialData.type || ''
        }
    });

    const onSubmit = (data: MaterialFormData) => {
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-code" className="text-gray-900 font-medium">Kode Material</Label>
                    <Input
                        id="edit-code"
                        placeholder="Masukkan kode material"
                        {...register('code')}
                        className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-gray-900 font-medium">Deskripsi</Label>
                    <Input
                        id="edit-name"
                        placeholder="Masukkan deskripsi"
                        {...register('name', { required: 'Deskripsi wajib diisi' })}
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-price" className="text-gray-900 font-medium">Harga</Label>
                    <Controller
                        control={control}
                        name="price"
                        rules={{ required: 'Harga wajib diisi' }}
                        render={({ field }) => (
                            <MoneyInput
                                value={field.value === '' ? undefined : Number(field.value || 0)}
                                onChangeValue={field.onChange}
                                placeholder="Masukkan jumlah"
                                className={errors.price ? 'border-red-500' : ''}
                            />
                        )}
                    />
                    {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-type" className="text-gray-900 font-medium">Satuan</Label>
                    <Controller
                        control={control}
                        name="type"
                        rules={{ required: 'Satuan wajib diisi' }}
                        render={({ field }) => (
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <SelectTrigger id="edit-type" className={errors.type ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Pilih satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pcs">PCS</SelectItem>
                                    <SelectItem value="set">SET</SelectItem>
                                    <SelectItem value="box">BOX</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
                </div>
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 border-t bg-gray-50">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-md border-[#D4D4D8] text-[15px] text-[#171717]" onClick={onClose}>Batal</Button>
                <Button type="submit" className="flex-1 h-11 rounded-md bg-[#1F3B5B] text-[15px] font-medium text-white hover:bg-[#19314b]">Simpan</Button>
            </div>
        </form>
    );
}
