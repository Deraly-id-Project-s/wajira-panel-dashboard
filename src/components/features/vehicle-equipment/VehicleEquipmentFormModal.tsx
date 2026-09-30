import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyInput } from '@/components/ui/money-input';
import RequiredMark from '@/components/ui/required-mark';
import { vehicleEquipmentSchema, type VehicleEquipmentFormValues } from '@/scheme/vehicle-equipment.schema';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';

interface VehicleEquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleEquipmentFormValues) => void;
  initialData?: VehicleEquipment | null;
  isSaving?: boolean;
}

export function VehicleEquipmentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isSaving = false,
}: VehicleEquipmentFormModalProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VehicleEquipmentFormValues>({
    resolver: zodResolver(vehicleEquipmentSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      buy_price: 0,
      sell_price: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          code: initialData.code || '',
          name: initialData.name || '',
          description: initialData.description || '',
          buy_price: initialData.buy_price ?? initialData.buyPrice ?? 0,
          sell_price: initialData.sell_price ?? initialData.sellPrice ?? 0,
        });
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          buy_price: 0,
          sell_price: 0,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-md bg-white p-6 border border-gray-100 shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-[20px] font-bold text-gray-900 leading-none">
            {isEdit ? 'Edit Perlengkapan Kendaraan' : 'Tambah Perlengkapan Kendaraan'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {isEdit ? 'Ubah detail perlengkapan kendaraan' : 'Masukkan detail perlengkapan kendaraan baru'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
          {/* Kode Barang */}
          <div className="space-y-1.5">
            <Label htmlFor="modal_code" className="text-sm font-medium text-gray-900">
              Kode Barang <RequiredMark />
            </Label>
            <Input
              id="modal_code"
              placeholder="Contoh: KNC-ING"
              disabled={isSaving}
              className={`w-full bg-white border border-gray-200 rounded-md h-10 text-sm font-medium focus:ring-1 focus:ring-slate-400 focus:border-slate-400 ${
                errors.code ? 'border-red-500' : ''
              }`}
              {...register('code')}
            />
            {errors.code && <p className="text-red-500 text-xs font-semibold mt-1">{errors.code.message}</p>}
          </div>

          {/* Nama Barang */}
          <div className="space-y-1.5">
            <Label htmlFor="modal_name" className="text-sm font-medium text-gray-900">
              Nama Barang <RequiredMark />
            </Label>
            <Input
              id="modal_name"
              placeholder="Contoh: Kunci Inggris"
              disabled={isSaving}
              className={`w-full bg-white border border-gray-200 rounded-md h-10 text-sm font-medium focus:ring-1 focus:ring-slate-400 focus:border-slate-400 ${
                errors.name ? 'border-red-500' : ''
              }`}
              {...register('name')}
            />
            {errors.name && <p className="text-red-500 text-xs font-semibold mt-1">{errors.name.message}</p>}
          </div>

          {/* Harga Beli & Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="modal_buy_price" className="text-sm font-medium text-gray-900">
                Harga Beli
              </Label>
              <Controller
                control={control}
                name="buy_price"
                render={({ field }) => (
                  <MoneyInput
                    id="modal_buy_price"
                    placeholder="Rp 0"
                    value={field.value}
                    onChangeValue={field.onChange}
                    disabled={isSaving}
                    className="bg-white"
                  />
                )}
              />
              {errors.buy_price && <p className="text-red-500 text-xs mt-1">{errors.buy_price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_sell_price" className="text-sm font-medium text-gray-900">
                Harga Jual
              </Label>
              <Controller
                control={control}
                name="sell_price"
                render={({ field }) => (
                  <MoneyInput
                    id="modal_sell_price"
                    placeholder="Rp 0"
                    value={field.value}
                    onChangeValue={field.onChange}
                    disabled={isSaving}
                    className="bg-white"
                  />
                )}
              />
              {errors.sell_price && <p className="text-red-500 text-xs mt-1">{errors.sell_price.message}</p>}
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="modal_description" className="text-sm font-medium text-gray-900">
              Deskripsi
            </Label>
            <Textarea
              id="modal_description"
              placeholder="Tambahkan keterangan..."
              disabled={isSaving}
              className="bg-white resize-none min-h-[70px]"
              {...register('description')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="btn-primary!"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
