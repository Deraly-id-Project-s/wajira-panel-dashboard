import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MoneyInput } from '@/components/ui/money-input';
import { LoadingState } from '@/components/ui/loading-state';
import RequiredMark from '@/components/ui/required-mark';
import {
  vehicleEquipmentPriceVersionSchema,
  type VehicleEquipmentPriceVersion,
  type VehicleEquipmentPriceVersionFormInput,
  type VehicleEquipmentPriceVersionFormValues,
} from '@/@types/vehicle-equipment-price-version.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: VehicleEquipmentPriceVersion;
  onSubmit: (data: VehicleEquipmentPriceVersionFormValues) => void;
  isSubmitting?: boolean;
}

export function VehicleEquipmentPriceVersionForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<VehicleEquipmentPriceVersionFormInput, unknown, VehicleEquipmentPriceVersionFormValues>({
    resolver: zodResolver(vehicleEquipmentPriceVersionSchema),
    defaultValues: {
      name: '',
      buy_price: 0,
      sell_price: 0,
      effective_from: '',
      effective_until: '',
      is_default: false,
      is_lock: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialData
          ? {
              name: initialData.name,
              buy_price: Number(initialData.buy_price ?? 0),
              sell_price: Number(initialData.sell_price ?? 0),
              effective_from: initialData.effective_from || '',
              effective_until: initialData.effective_until || '',
              is_default: initialData.is_default === 1 || initialData.is_default === true,
              is_lock: initialData.is_lock === 1 || initialData.is_lock === true,
            }
          : {
              name: '',
              buy_price: 0,
              sell_price: 0,
              effective_from: '',
              effective_until: '',
              is_default: false,
              is_lock: false,
            },
      );
    }
  }, [form, initialData, open]);

  const locked = initialData?.is_lock === 1 || initialData?.is_lock === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Versi Harga Perlengkapan' : 'Tambah Versi Harga Perlengkapan'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Versi <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Harga Q1 2026" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="buy_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Harga Beli <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <MoneyInput
                        placeholder="Rp 0"
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sell_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Harga Jual <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <MoneyInput
                        placeholder="Rp 0"
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Dari</FormLabel>
                    <FormControl>
                      <InputDate disabled={isSubmitting} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effective_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Sampai</FormLabel>
                    <FormControl>
                      <InputDate disabled={isSubmitting} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Jadikan Default</FormLabel>
                    <FormDescription>Gunakan versi ini sebagai harga acuan utama.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting || locked} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="btn-primary!">
                {isSubmitting && <LoadingState variant="inline" text={null} />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
