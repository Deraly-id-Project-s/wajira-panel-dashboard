'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Supplier } from '@/@types/supplier.types';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { useCreateSupplier, useSuppliers } from '@/hooks/useSupplier';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { cn } from '@/lib/utils';
import { createSupplierSchema, type CreateSupplierFormValues } from '@/scheme/supplier.schema';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SupplierFormModal } from './SupplierFormModal';

const defaultValues: CreateSupplierFormValues = {
  name: '',
  address: '',
  npwp: '',
  pic: '',
  phone: '',
};

interface SupplierComboboxProps {
  companyId?: string | number | null;
  selectedId?: string | number | null;
  selectedName?: string | null;
  onSelect: (supplier: Supplier) => void;
  disabled?: boolean;
  allowCreate?: boolean;
}

export function SupplierCombobox({
  companyId,
  selectedId,
  selectedName,
  onSelect,
  disabled = false,
  allowCreate = false,
}: SupplierComboboxProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data } = useSuppliers(companyId ? String(companyId) : null);
  const createSupplier = useCreateSupplier();
  const { data: profile } = useAuthMe();
  const suppliers = useMemo(() => data?.data ?? [], [data?.data]);
  const selected = suppliers.find((supplier) => String(supplier.id) === String(selectedId));

  const form = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues,
  });

  const handleCreate = async (values: CreateSupplierFormValues) => {
    if (!companyId) {
      toast.error('Company ID tidak ditemukan');
      return;
    }

    const userId = profile?.data?.id;
    if (!userId) {
      toast.error('User belum dimuat, silakan coba lagi');
      return;
    }

    try {
      const created = await createSupplier.mutateAsync({
        ...values,
        address: values.address || undefined,
        npwp: values.npwp || undefined,
        pic: values.pic || undefined,
        phone: values.phone || undefined,
        companyId: Number(companyId) || companyId,
        userId: Number(userId) || userId,
      });
      onSelect(created);
      form.reset(defaultValues);
      setCreateOpen(false);
      setOpen(false);
      toast.success('Data supplier berhasil ditambahkan');
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          const mappedField = field === 'pic_name' ? 'pic' : field;
          form.setError(mappedField as keyof CreateSupplierFormValues, {
            message: messages?.[0] || 'Validasi gagal',
          });
        });
      }
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data supplier';
      toast.error(message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between bg-transparent font-normal min-w-0"
            >
              <span className={cn('truncate', !selectedName && !selected && 'text-muted-foreground')}>
                {selectedName || selected?.name || 'Pilih supplier'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari supplier..." />
              <CommandList id="supplier-combobox-list">
                <CommandEmpty>Supplier tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {suppliers.map((supplier) => (
                    <CommandItem
                      key={String(supplier.id)}
                      value={`${supplier.name} ${supplier.code ?? ''} ${supplier.id}`}
                      onSelect={() => {
                        onSelect(supplier);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', String(selectedId) === String(supplier.id) || (!selectedId && selectedName === supplier.name) ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{supplier.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {allowCreate && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Tambah supplier"
            onClick={() => {
              form.reset(defaultValues);
              setOpen(false);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <SupplierFormModal
        open={createOpen}
        onOpenChange={(nextOpen) => {
          setCreateOpen(nextOpen);
          if (!nextOpen) form.reset(defaultValues);
        }}
        form={form}
        onSubmit={handleCreate}
        title="Tambah Data Supplier"
        description="Masukkan detail supplier baru"
        isSubmitting={createSupplier.isPending}
      />
    </>
  );
}

