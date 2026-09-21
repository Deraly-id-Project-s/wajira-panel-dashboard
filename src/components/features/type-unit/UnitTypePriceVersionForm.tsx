import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';
import { MoneyInput } from '@/components/ui/money-input';
import { LoadingState } from '@/components/ui/loading-state';
import {
  UnitTypePriceVersionSchema,
  type UnitTypePriceVersionFormValues,
  type UnitTypePriceVersion
} from '@/@types/unit-type-price-version.types';

interface UnitTypePriceVersionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UnitTypePriceVersion;
  onSubmit: (data: UnitTypePriceVersionFormValues) => void;
  isSubmitting?: boolean;
}

export function UnitTypePriceVersionForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting
}: UnitTypePriceVersionFormProps) {
  const form = useForm<UnitTypePriceVersionFormValues>({
    resolver: zodResolver(UnitTypePriceVersionSchema),
    defaultValues: {
      name: '',
      buy_price: 0,
      sell_price: 0,
      effective_from: '',
      effective_until: '',
      is_default: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          buy_price: Number(initialData.buy_price ?? 0),
          sell_price: Number(initialData.sell_price ?? 0),
          effective_from: initialData.effective_from || '',
          effective_until: initialData.effective_until || '',
          is_default: initialData.is_default === 1 || initialData.is_default === true,
        });
      } else {
        form.reset({
          name: '',
          buy_price: 0,
          sell_price: 0,
          effective_from: '',
          effective_until: '',
          is_default: false,
        });
      }
    }
  }, [initialData, form, open]);

  const handleSubmit = (values: UnitTypePriceVersionFormValues) => {
    onSubmit(values);
  };

  const isLocked = initialData?.is_lock === 1 || initialData?.is_lock === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Versi Harga' : 'Tambah Versi Harga'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Versi</FormLabel>
                  <FormControl>
                    <Input placeholder="cth: Harga OTR Jakarta 2026" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buy_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Beli</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp.</span>
                      <MoneyInput
                        className="pl-9"
                        placeholder="Masukkan harga beli"
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled={isSubmitting}
                      />
                    </div>
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
                  <FormLabel>Harga Jual</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp.</span>
                      <MoneyInput
                        className="pl-9"
                        placeholder="Masukkan harga jual"
                        value={field.value}
                        onChangeValue={field.onChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Dari (Opsional)</FormLabel>
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
                    <FormLabel>Berlaku Sampai (Opsional)</FormLabel>
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
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Jadikan Default</FormLabel>
                    <FormDescription>
                      Pilih jika ini versi harga utama.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting || isLocked}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
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
