import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { MoneyInput } from '@/components/ui/money-input';
import RequiredMark from '@/components/ui/required-mark';
import { vehicleEquipmentSchema, type VehicleEquipmentFormValues } from '@/scheme/vehicle-equipment.schema';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';

interface VehicleEquipmentFormProps {
  initialData?: VehicleEquipment;
  onSubmit: (data: VehicleEquipmentFormValues) => void;
  isSubmitting: boolean;
  title: string;
}

export function VehicleEquipmentForm({ initialData, onSubmit, isSubmitting, title }: VehicleEquipmentFormProps) {
  const router = useRouter();

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
    if (initialData) {
      reset({
        code: initialData.code || '',
        name: initialData.name || '',
        description: initialData.description || '',
        buy_price: initialData.buy_price ?? initialData.buyPrice ?? 0,
        sell_price: initialData.sell_price ?? initialData.sellPrice ?? 0,
      });
    }
  }, [initialData, reset]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
            Form Detail Perlengkapan Kendaraan
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                  Kode Perlengkapan <RequiredMark />
                </Label>
                <Input
                  id="code"
                  placeholder="Contoh: KNC-ING"
                  {...register('code')}
                  disabled={isSubmitting}
                  className={`bg-white ${errors.code ? 'border-red-500' : ''}`}
                />
                {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nama Perlengkapan <RequiredMark />
                </Label>
                <Input
                  id="name"
                  placeholder="Contoh: Kunci Inggris"
                  {...register('name')}
                  disabled={isSubmitting}
                  className={`bg-white ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="buy_price" className="text-sm font-medium text-gray-700">
                  Harga Beli
                </Label>
                <Controller
                  control={control}
                  name="buy_price"
                  render={({ field }) => (
                    <MoneyInput
                      id="buy_price"
                      placeholder="Rp 0"
                      value={field.value}
                      onChangeValue={field.onChange}
                      disabled={isSubmitting}
                      className="bg-white"
                    />
                  )}
                />
                {errors.buy_price && <p className="text-red-500 text-xs">{errors.buy_price.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sell_price" className="text-sm font-medium text-gray-700">
                  Harga Jual
                </Label>
                <Controller
                  control={control}
                  name="sell_price"
                  render={({ field }) => (
                    <MoneyInput
                      id="sell_price"
                      placeholder="Rp 0"
                      value={field.value}
                      onChangeValue={field.onChange}
                      disabled={isSubmitting}
                      className="bg-white"
                    />
                  )}
                />
                {errors.sell_price && <p className="text-red-500 text-xs">{errors.sell_price.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Deskripsi
              </Label>
              <Textarea
                id="description"
                placeholder="Tambahkan keterangan perlengkapan..."
                {...register('description')}
                disabled={isSubmitting}
                className="bg-white resize-none min-h-[100px]"
              />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-6 pt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="text-gray-600 hover:text-gray-900"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[130px] gap-2 btn-primary!"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
