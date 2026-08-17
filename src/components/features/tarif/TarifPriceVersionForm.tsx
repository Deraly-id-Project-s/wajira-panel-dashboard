import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MoneyInput } from '@/components/ui/money-input';
import { LoadingState } from '@/components/ui/loading-state';
import { TarifPriceVersionSchema, type TarifPriceVersion, type TarifPriceVersionFormValues } from '@/@types/tarif-price-version.types';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; initialData?: TarifPriceVersion; onSubmit: (data: TarifPriceVersionFormValues) => void; isSubmitting?: boolean; }
export function TarifPriceVersionForm({ open, onOpenChange, initialData, onSubmit, isSubmitting }: Props) {
  const form = useForm<TarifPriceVersionFormValues>({ resolver: zodResolver(TarifPriceVersionSchema), defaultValues: { name: '', uj_towing: 0, uj_cdd: 0, uj_fuso: 0, effective_from: '', effective_until: '', is_default: false, is_lock: false } });
  useEffect(() => { if (open) form.reset(initialData ? { name: initialData.name, uj_towing: Number(initialData.uj_towing ?? 0), uj_cdd: Number(initialData.uj_cdd ?? 0), uj_fuso: Number(initialData.uj_fuso ?? 0), effective_from: initialData.effective_from || '', effective_until: initialData.effective_until || '', is_default: initialData.is_default === 1 || initialData.is_default === true, is_lock: initialData.is_lock === 1 || initialData.is_lock === true } : { name: '', uj_towing: 0, uj_cdd: 0, uj_fuso: 0, effective_from: '', effective_until: '', is_default: false, is_lock: false }); }, [form, initialData, open]);
  const locked = initialData?.is_lock === 1 || initialData?.is_lock === true;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{initialData ? 'Edit Versi Tarif' : 'Tambah Versi Tarif'}</DialogTitle>
      </DialogHeader>
      <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nama Versi</FormLabel><FormControl><Input placeholder="Contoh: Tarif 2026" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{(['uj_towing', 'uj_cdd', 'uj_fuso'] as const).map((fieldName) => <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => <FormItem><FormLabel>{fieldName === 'uj_towing' ? 'UJ Towing' : fieldName === 'uj_cdd' ? 'UJ CDD' : 'UJ Fuso'}</FormLabel><FormControl><div className="relative">
          <MoneyInput value={field.value} onChangeValue={field.onChange} disabled={isSubmitting} />
        </div>
        </FormControl>
          <FormMessage />
        </FormItem>} />)}</div><div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="effective_from" render={({ field }) => <FormItem><FormLabel>Berlaku Dari</FormLabel><FormControl><Input type="date" disabled={isSubmitting} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="effective_until" render={({ field }) => <FormItem><FormLabel>Berlaku Sampai</FormLabel><FormControl><Input type="date" disabled={isSubmitting} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} /></div><FormField control={form.control} name="is_default" render={({ field }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div>
              <FormLabel>Jadikan Default</FormLabel><FormDescription>Gunakan versi ini sebagai tarif utama.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting || locked} /></FormControl></FormItem>} /><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <LoadingState variant="inline" text={null} />}Simpan</Button></DialogFooter></form></Form></DialogContent>
  </Dialog>;
}
