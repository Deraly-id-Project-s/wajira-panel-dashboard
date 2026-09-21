'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Supplier } from '@/@types/supplier.types';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { useCreateSupplier, useSuppliers } from '@/hooks/useSupplier';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { createSupplierSchema, type CreateSupplierFormValues } from '@/scheme/supplier.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectAdd } from '@/components/ui/select-add';
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
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useSuppliers(companyId ? String(companyId) : null);
  const createSupplier = useCreateSupplier();
  const { data: profile } = useAuthMe();
  const suppliers = useMemo(() => data?.data ?? [], [data?.data]);
  const supplierOptions = useMemo(() => {
    if (!selectedId || !selectedName || suppliers.some((supplier) => String(supplier.id) === String(selectedId))) {
      return suppliers;
    }

    return [
      {
        id: selectedId,
        name: selectedName,
        address: null,
        npwp: null,
        phone: null,
        pic: null,
      },
      ...suppliers,
    ];
  }, [selectedId, selectedName, suppliers]);

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
      <SelectAdd
        allowAdd={allowCreate}
        addDisabled={disabled}
        addLabel="Tambah supplier"
        onAdd={() => {
          form.reset(defaultValues);
          setCreateOpen(true);
        }}
      >
        <Select
          value={selectedId ? String(selectedId) : undefined}
          onValueChange={(value) => {
            const supplier = supplierOptions.find((item) => String(item.id) === value);
            if (supplier) onSelect(supplier);
          }}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden bg-transparent font-normal">
            <SelectValue maxLength={35} placeholder={isLoading ? 'Memuat supplier...' : selectedName || 'Pilih supplier'} />
          </SelectTrigger>
          <SelectContent showSearch searchPlaceholder="Cari supplier...">
            {supplierOptions.map((supplier) => (
              <SelectItem key={String(supplier.id)} value={String(supplier.id)} maxLength={40}>
                {supplier.name}
              </SelectItem>
            ))}
            {isError && (
              <div className="px-3 py-2 text-xs text-destructive">
                Gagal memuat supplier.{' '}
                <button type="button" className="underline" onClick={() => refetch()}>
                  Coba lagi
                </button>
              </div>
            )}
          </SelectContent>
        </Select>
      </SelectAdd>

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
