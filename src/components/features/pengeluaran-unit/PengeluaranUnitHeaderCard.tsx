'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PersonOption, WarehouseOption } from '@/@types/pengeluaran-unit.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface PengeluaranUnitHeaderValues {
  activityNumber?: string;
  activityDate?: Date;
  warehouseId?: number;
  warehouseName?: string;
  supplierId?: number;
  supplierName?: string;
  description?: string;
}

interface PengeluaranUnitHeaderErrors {
  activityDate?: string;
  warehouseId?: string;
  supplierId?: string;
  description?: string;
}

interface Props {
  mode: 'create' | 'edit' | 'detail';
  values: PengeluaranUnitHeaderValues;
  errors?: PengeluaranUnitHeaderErrors;
  warehouses: WarehouseOption[];
  suppliers: PersonOption[];
  isLoadingOptions?: boolean;
  onActivityDateChange?: (value?: Date) => void;
  onWarehouseChange?: (value: number) => void;
  onSupplierChange?: (value: number) => void;
  onDescriptionChange?: (value: string) => void;
}

const errorClassName = 'text-xs text-red-600 mt-1';

interface SearchableSelectOption {
  id: number;
  name: string;
}

interface SearchableSelectProps {
  value?: number;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const selected = options.find((item) => item.id === value);
    return selected?.name ?? '';
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="w-full justify-between font-normal bg-white h-10 rounded-md border-gray-200">
          <span className={cn('truncate', !selectedLabel && 'text-gray-400')}>{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.id}`}
                  onSelect={() => {
                    onChange?.(option.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.id ? 'opacity-100' : 'opacity-0')} />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function PengeluaranUnitHeaderCard({
  mode,
  values,
  errors,
  warehouses,
  suppliers,
  isLoadingOptions,
  onActivityDateChange,
  onWarehouseChange,
  onSupplierChange,
  onDescriptionChange,
}: Props) {
  const isDetail = mode === 'detail';

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Data Pengeluaran Unit</h2>
      </div>
      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[15px]">
        <div className="space-y-1">
          <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">No Pengeluaran</label>
          <Input value={values.activityNumber ?? '-'} disabled readOnly className="bg-gray-50 text-gray-500 rounded-md h-10 border-gray-200" />
        </div>

        <div className="space-y-1">
          <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">Tanggal Pengeluaran</label>
          <DatePicker
            value={values.activityDate}
            onChange={onActivityDateChange}
            disabled={isDetail}
            placeholder="Pilih tanggal"
            className="h-10 rounded-md border-gray-200 text-gray-900"
          />
          {errors?.activityDate ? <p className={errorClassName}>{errors.activityDate}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">Warehouse</label>
          {isDetail ? (
            <Input value={values.warehouseName ?? '-'} disabled readOnly className="bg-gray-50 text-gray-500 rounded-md h-10 border-gray-200" />
          ) : (
            <SearchableSelect
              value={values.warehouseId}
              options={warehouses}
              placeholder={isLoadingOptions ? 'Memuat warehouse...' : 'Pilih warehouse'}
              searchPlaceholder="Cari warehouse..."
              emptyText="Warehouse tidak ditemukan."
              disabled={isLoadingOptions}
              onChange={onWarehouseChange}
            />
          )}
          {errors?.warehouseId ? <p className={errorClassName}>{errors.warehouseId}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[15px]">
        <div className="space-y-1">
          <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">Supplier</label>
          {isDetail ? (
            <Input value={values.supplierName ?? '-'} disabled readOnly className="bg-gray-50 text-gray-500 rounded-md h-10 border-gray-200" />
          ) : (
            <SearchableSelect
              value={values.supplierId}
              options={suppliers}
              placeholder={isLoadingOptions ? 'Memuat supplier...' : 'Pilih supplier'}
              searchPlaceholder="Cari supplier..."
              emptyText="Supplier tidak ditemukan."
              disabled={isLoadingOptions}
              onChange={onSupplierChange}
            />
          )}
          {errors?.supplierId ? <p className={errorClassName}>{errors.supplierId}</p> : null}
        </div>
      </div>

      <div className="space-y-1 text-[15px] mt-2">
        <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">Keterangan</label>
        <Textarea
          value={values.description ?? ''}
          disabled={isDetail}
          onChange={(event) => onDescriptionChange?.(event.target.value)}
          placeholder="Masukkan keterangan"
          className="bg-white text-gray-900 rounded-md min-h-24 border-gray-200 resize-y"
        />
        {errors?.description ? <p className={errorClassName}>{errors.description}</p> : null}
      </div>
    </div>
  );
}
