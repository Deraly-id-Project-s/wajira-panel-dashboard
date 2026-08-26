import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DealerFormData } from './DealerFormModal';
import type { Dealer } from '@/types/dealer.types';

interface EditDealerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: DealerFormData) => void;
    initialData: Dealer | null;
}

export function EditDealerModal({ isOpen, onClose, onSave, initialData }: EditDealerModalProps) {
    if (!initialData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col rounded-md border-0 bg-white p-0 shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b shrink-0 text-left">
                    <DialogTitle className="text-[18px] font-semibold text-[#171717]">Edit Data Dealer</DialogTitle>
                    <DialogDescription className="text-[15px] text-[#71717A]">
                        Perbarui detail data dealer ini
                    </DialogDescription>
                </DialogHeader>

                <EditDealerInnerForm
                    initialData={initialData}
                    onClose={onClose}
                    onSave={onSave}
                />
            </DialogContent>
        </Dialog>
    );
}

interface InnerProps {
    initialData: Dealer;
    onClose: () => void;
    onSave: (data: DealerFormData) => void;
}

function EditDealerInnerForm({ initialData, onClose, onSave }: InnerProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<DealerFormData>({
        defaultValues: {
            namaDealer: initialData.namaDealer || '',
            alamat: initialData.alamat || '',
            pic: initialData.pic || '',
            handphone: initialData.handphone || ''
        }
    });

    const onSubmit = (data: DealerFormData) => {
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-namaDealer" className="text-gray-900 font-medium">Nama Dealer</Label>
                    <Input
                        id="edit-namaDealer"
                        placeholder="Masukkan nama dealer"
                        {...register('namaDealer', { required: 'Nama Dealer wajib diisi' })}
                        className={errors.namaDealer ? 'border-red-500' : ''}
                    />
                    {errors.namaDealer && <p className="text-red-500 text-xs">{errors.namaDealer.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-alamat" className="text-gray-900 font-medium">Alamat</Label>
                    <Textarea
                        id="edit-alamat"
                        placeholder="Masukkan alamat dealer"
                        {...register('alamat', { required: 'Alamat wajib diisi' })}
                        className={errors.alamat ? 'border-red-500 resize-none' : 'resize-none'}
                        rows={3}
                    />
                    {errors.alamat && <p className="text-red-500 text-xs">{errors.alamat.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-pic" className="text-gray-900 font-medium">PIC</Label>
                    <Input
                        id="edit-pic"
                        placeholder="Masukkan PIC"
                        {...register('pic', { required: 'PIC wajib diisi' })}
                        className={errors.pic ? 'border-red-500' : ''}
                    />
                    {errors.pic && <p className="text-red-500 text-xs">{errors.pic.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-handphone" className="text-gray-900 font-medium">Handphone</Label>
                    <Input
                        id="edit-handphone"
                        placeholder="Masukkan nomor handphone"
                        {...register('handphone', { required: 'Handphone wajib diisi' })}
                        className={errors.handphone ? 'border-red-500' : ''}
                    />
                    {errors.handphone && <p className="text-red-500 text-xs">{errors.handphone.message}</p>}
                </div>
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 border-t bg-gray-50">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-md border-[#D4D4D8] text-[15px] text-[#171717]" onClick={onClose}>Batal</Button>
                <Button type="submit" className="flex-1 h-11 rounded-md bg-[#1F3B5B] text-[15px] font-medium text-white hover:bg-[#19314b]">Simpan Perubahan</Button>
            </div>
        </form>
    );
}
