import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { VehicleEquipment, VehicleEquipmentPayload } from '@/types/vehicle-equipment.types';

interface VehicleEquipmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: VehicleEquipmentPayload) => void;
    initialData?: VehicleEquipment | null;
    isSaving?: boolean;
}

export function VehicleEquipmentFormModal({
    isOpen,
    onClose,
    onSave,
    initialData = null,
    isSaving = false
}: VehicleEquipmentFormModalProps) {
    const isEdit = !!initialData;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleEquipmentPayload>({
        defaultValues: {
            code: '',
            name: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    code: initialData.code || '',
                    name: initialData.name || '',
                });
            } else {
                reset({
                    code: '',
                    name: '',
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = (data: VehicleEquipmentPayload) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] rounded-md bg-white p-6 border border-gray-100 shadow-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-[20px] font-bold text-gray-900 leading-none">
                        {isEdit ? 'Edit Data Material' : 'Tambah Data Material'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        {isEdit ? 'Edit detail material baru' : 'Masukkan detail material baru'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
                    {/* Kode Barang */}
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-bold text-gray-900">
                            Kode Barang
                        </Label>
                        <Input
                            id="code"
                            placeholder="Tambahkan kode"
                            className={`w-full bg-white border border-gray-200 rounded-md h-11 text-sm font-medium focus:ring-1 focus:ring-slate-400 focus:border-slate-400 ${errors.code ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                }`}
                            {...register('code', { required: 'Kode barang wajib diisi' })}
                        />
                        {errors.code && (
                            <p className="text-red-500 text-xs font-semibold mt-1">{errors.code.message}</p>
                        )}
                    </div>

                    {/* Nama Barang */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-bold text-gray-900">
                            Nama Barang
                        </Label>
                        <Input
                            id="name"
                            placeholder="Tambahkan nama"
                            className={`w-full bg-white border border-gray-200 rounded-md h-11 text-sm font-medium focus:ring-1 focus:ring-slate-400 focus:border-slate-400 ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                }`}
                            {...register('name', { required: 'Nama barang wajib diisi' })}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs font-semibold mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 pt-4">
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-[#15305B] hover:bg-[#0E2140] font-semibold text-white h-11 rounded-md text-sm"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold h-11 rounded-md text-sm"
                        >
                            Batal
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
