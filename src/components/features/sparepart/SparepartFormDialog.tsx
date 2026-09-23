'use client';

import { useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useForm, Controller } from 'react-hook-form';
import { MoneyInput } from '@/components/ui/money-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { sparepartSchema, SparepartFormValues } from '@/scheme/sparepart.schema';
import { Sparepart } from '@/@types/sparepart.types';
import { useCreateSparepart, useSparepartCategories, useUpdateSparepart } from '@/hooks/useSparepart';
import { toast } from 'sonner';
import { CreateSparepartCategoryDialog } from './CreateSparepartCategoryDialog';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import RequiredMark from '@/components/ui/required-mark';
import { handleApiFormError } from '@/lib/validation';
import { SelectAdd } from '@/components/ui/select-add';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparepart: Sparepart | null;
  companyId: string;
  onCreated?: (id: number) => void;
}

const defaultSparepartValues: SparepartFormValues = {
  code: '',
  name: '',
  categoryId: null,
  unitType: '',
  purchasePrice: 0,
  sellingPrice: 0,
  capacity: 0,
};

export function SparepartFormDialog({ open, onOpenChange, sparepart, companyId, onCreated }: Props) {
  const isEdit = Boolean(sparepart);

  const createMutation = useCreateSparepart(companyId);
  const updateMutation = useUpdateSparepart(companyId);
  const { data: categories, isLoading: loadingCategories } = useSparepartCategories();
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [openGroupSelect, setOpenGroupSelect] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  const filteredCategories = (categories ?? []).filter((category) =>
    category.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const {
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SparepartFormValues>({
    resolver: zodResolver(sparepartSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaultSparepartValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultSparepartValues);
      return;
    }

    if (sparepart) {
      reset({
        code: sparepart.code || '',
        name: sparepart.name || '',
        categoryId: sparepart.categoryId ?? sparepart.category?.id ?? null,
        unitType: sparepart.unit_type ? sparepart.unit_type.toLowerCase() : '',
        purchasePrice: sparepart.purchasePrice ?? sparepart.price ?? 0,
        sellingPrice: sparepart.sellingPrice ?? sparepart.price ?? 0,
        capacity: sparepart.capacity ?? 0,
      });
    } else {
      reset(defaultSparepartValues);
    }
  }, [open, sparepart, reset]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(
        sparepart
          ? {
            code: sparepart.code || '',
            name: sparepart.name || '',
            categoryId: sparepart.categoryId ?? sparepart.category?.id ?? null,
            unitType: sparepart.unit_type ? sparepart.unit_type.toLowerCase() : '',
            purchasePrice: sparepart.purchasePrice ?? sparepart.price ?? 0,
            sellingPrice: sparepart.sellingPrice ?? sparepart.price ?? 0,
            capacity: sparepart.capacity ?? 0,
          }
          : defaultSparepartValues,
      );
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: SparepartFormValues) => {
    try {
      const payload = {
        code: values.code,
        name: values.name,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        unitType: values.unitType,
        price: values.sellingPrice || values.purchasePrice,
        capacity: values.capacity ?? 0,
        purchasePrice: values.purchasePrice,
        sellingPrice: values.sellingPrice,
        companyId,
      };

      if (isEdit && sparepart) {
        await updateMutation.mutateAsync({
          id: sparepart.id,
          payload,
        });
        toast.success('Data berhasil diperbarui');
      } else {
        const res = await createMutation.mutateAsync(payload);
        toast.success('Data berhasil ditambahkan');
        const createdId = (res as any)?.data?.id ?? (res as any)?.id;
        if (createdId && onCreated) {
          onCreated(Number(createdId));
        }
      }

      onOpenChange(false);
      reset();
    } catch (err: any) {
      const handled = handleApiFormError(err, { setError }, {
        fieldMapping: {
          code: 'code',
          name: 'name',
          category_id: 'categoryId',
          unit_type: 'unitType',
          purchase_price: 'purchasePrice',
          selling_price: 'sellingPrice',
          capacity: 'capacity',
        },
      });
      if (!handled) {
        const message = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
        toast.error(message);
      }
    }
  };

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={handleClose}
        title={isEdit ? 'Ubah Data SparePart' : 'Tambah Data Sparepart'}
        description="Masukkan detail sparepart baru"
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        maxWidthClassName="max-w-md"
      >
        <div>
          <label className="block text-sm font-bold mb-1">Kode Part <RequiredMark /></label>
          <Controller control={control} name="code" render={({ field }) => <Input placeholder="Tambahkan kode" value={field.value ?? ''} onChange={field.onChange} />} />
          {errors.code && <p className="text-xs text-destructive mt-1">{errors.code.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Nama Part <RequiredMark /></label>
          <Controller control={control} name="name" render={({ field }) => <Input placeholder="Tambahkan nama" value={field.value ?? ''} onChange={field.onChange} />} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Grup</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <SelectAdd
                onAdd={() => setOpenCreateGroup(true)}
                addDisabled={isSubmitting}
                addLabel="Tambah grup"
                addVariant="default"
              >
                <Popover
                  open={openGroupSelect}
                  onOpenChange={(open) => {
                    setOpenGroupSelect(open);
                    if (!open) setGroupSearch('');
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={openGroupSelect}
                      aria-controls="sparepart-dialog-group-popover"
                      disabled={loadingCategories || isSubmitting}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 min-w-0 font-normal text-left"
                    >
                      <span className={cn('truncate', !field.value && 'text-muted-foreground')}>
                        {field.value
                          ? categories?.find((category) => category.id === Number(field.value))?.name ?? 'Pilih grup'
                          : loadingCategories
                            ? 'Memuat grup...'
                            : 'Pilih grup'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent id="sparepart-dialog-group-popover" className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Cari grup..."
                        value={groupSearch}
                        onValueChange={setGroupSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Grup tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="tanpa grup"
                            onSelect={() => {
                              field.onChange(null);
                              setOpenGroupSelect(false);
                              setGroupSearch('');
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', !field.value ? 'opacity-100' : 'opacity-0')} />
                            <span className="truncate">Tanpa grup</span>
                          </CommandItem>
                          {filteredCategories.map((category) => (
                            <CommandItem
                              key={category.id}
                              value={`${category.name} ${category.id}`}
                              onSelect={() => {
                                field.onChange(category.id);
                                setOpenGroupSelect(false);
                                setGroupSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  Number(field.value) === category.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="truncate">{category.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </SelectAdd>
            )}
          />
          {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Satuan <RequiredMark /></label>
          <Controller
            control={control}
            name="unitType"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Satuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pcs</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.unitType && <p className="text-xs text-destructive mt-1">{errors.unitType.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Harga Beli <RequiredMark /></label>
          <Controller control={control} name="purchasePrice" render={({ field: { onChange, value, ...rest } }) => <MoneyInput placeholder="Tambahkan harga beli" {...rest} value={value || 0} onChangeValue={onChange} />} />
          {errors.purchasePrice && <p className="text-xs text-destructive mt-1">{errors.purchasePrice.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Harga Jual <RequiredMark /></label>
          <Controller control={control} name="sellingPrice" render={({ field: { onChange, value, ...rest } }) => <MoneyInput placeholder="Tambahkan harga jual" {...rest} value={value || 0} onChangeValue={onChange} />} />
          {errors.sellingPrice && <p className="text-xs text-destructive mt-1">{errors.sellingPrice.message}</p>}
        </div>
      </FormDialog>

      <CreateSparepartCategoryDialog
        open={openCreateGroup}
        onOpenChange={setOpenCreateGroup}
        onCreated={(id) => {
          setValue('categoryId', id, { shouldValidate: true, shouldDirty: true });
        }}
      />
    </>
  );
}
