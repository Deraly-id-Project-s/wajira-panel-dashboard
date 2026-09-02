import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { Brand } from '@/@types/brand.types';
import { useBrands } from '@/hooks/useBrand';
import { cn } from '@/lib/utils';
import type { TypeUnitFormValues } from '@/scheme/type-unit.schema';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import RequiredMark from '@/components/ui/required-mark';
import { CreateBrandDialog } from './CreateBrandDialog';

interface TypeUnitFormFieldsProps {
  form: UseFormReturn<TypeUnitFormValues>;
  disabled?: boolean;
}

const fieldClassName = 'h-10 rounded-md border-input px-3 text-sm shadow-none bg-transparent';

export function TypeUnitFormFields({ form, disabled = false }: TypeUnitFormFieldsProps) {
  const { data: brandsData, isLoading } = useBrands({ perPage: 100, sort_by: 'name', sort_order: 'asc' });
  const rawBrands: Brand[] = Array.isArray(brandsData) ? brandsData : ((brandsData as { data?: Brand[] })?.data ?? []);
  const brands = Array.from(new Map(rawBrands.map((brand) => [brand.id, brand])).values());
  const [brandOpen, setBrandOpen] = useState(false);
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(search.toLowerCase()));
  const parseNumber = (value: string) => (value === '' ? undefined : Number(value));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={form.control} name="code" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Kode<RequiredMark /></FormLabel>
            <FormControl><Input {...field} disabled={disabled} placeholder="Masukkan kode" className={fieldClassName} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="brandId" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Merk<RequiredMark /></FormLabel>
            <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Popover open={brandOpen} onOpenChange={(open) => { setBrandOpen(open); if (!open) setSearch(''); }}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" disabled={disabled || isLoading} className="w-full justify-between bg-transparent font-normal">
                    <span className={cn('truncate', !field.value && 'text-muted-foreground')}>
                      {field.value ? brands.find((brand) => brand.id === Number(field.value))?.name ?? 'Pilih merk' : isLoading ? 'Memuat...' : 'Pilih merk'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Cari merk..." value={search} onValueChange={setSearch} />
                    <CommandList>
                      <CommandEmpty>Merk tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredBrands.map((brand) => (
                          <CommandItem key={brand.id} value={`${brand.name} ${brand.id}`} onSelect={() => { field.onChange(brand.id); setBrandOpen(false); setSearch(''); }}>
                            <Check className={cn('mr-2 h-4 w-4', Number(field.value) === brand.id ? 'opacity-100' : 'opacity-0')} />
                            {brand.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button type="button" variant="outline" className="h-10 w-full shrink-0 sm:w-10 sm:px-0" disabled={disabled} aria-label="Tambah merk" onClick={() => setCreateBrandOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="sm:sr-only">Tambah merk</span>
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Tipe Unit<RequiredMark /></FormLabel>
            <FormControl><Input {...field} value={field.value || ''} disabled={disabled} placeholder="Masukkan tipe unit" className={fieldClassName} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="unitType" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Jenis</FormLabel>
            <FormControl><Input {...field} value={field.value || ''} disabled={disabled} placeholder="Masukkan jenis" className={fieldClassName} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="unitModel" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Model</FormLabel>
            <FormControl><Input {...field} value={field.value || ''} disabled={disabled} placeholder="Masukkan model" className={fieldClassName} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={form.control} name="nettoWeight" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Netto (Kg)</FormLabel>
            <FormControl><Input type="number" value={field.value ?? ''} disabled={disabled} onChange={(event) => field.onChange(parseNumber(event.target.value))} placeholder="Masukkan berat" className={fieldClassName} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="brutoWeight" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Bruto (Kg)</FormLabel>
            <FormControl><Input type="number" value={field.value ?? ''} disabled={disabled} onChange={(event) => field.onChange(parseNumber(event.target.value))} placeholder="Masukkan berat" className={fieldClassName} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="buyPrice" render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Harga Beli</FormLabel>
            <FormControl><MoneyInput {...field} value={value ?? 0} disabled={disabled} onChangeValue={onChange} className="bg-transparent" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="sellPrice" render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Harga Jual</FormLabel>
            <FormControl><MoneyInput {...field} value={value ?? 0} disabled={disabled} onChangeValue={onChange} className="bg-transparent" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <CreateBrandDialog open={createBrandOpen} onOpenChange={setCreateBrandOpen} onCreated={(brandId) => form.setValue('brandId', brandId, { shouldValidate: true })} />
    </>
  );
}
