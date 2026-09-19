'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Customer } from '@/@types/customer.types';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomer';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { customerSchema, type CustomerFormValues } from '@/scheme/customer.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectAdd } from '@/components/ui/select-add';
import { CustomerFormModal } from './CustomerFormModal';

const defaultValues: CustomerFormValues = {
  name: '',
  address: '',
  npwp: '',
  pic: '',
  phone: '',
  map_link: '',
};

interface CustomerComboboxProps {
  companyId?: string | number | null;
  selectedId?: string | number | null;
  selectedName?: string | null;
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
  allowCreate?: boolean;
}

export function CustomerCombobox({
  companyId,
  selectedId,
  selectedName,
  onSelect,
  disabled = false,
  allowCreate = false,
}: CustomerComboboxProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useCustomers({
    company_id: companyId ? String(companyId) : undefined,
    perPage: 100,
    page: 1,
    enabled: Boolean(companyId),
  });
  const createCustomer = useCreateCustomer();
  const { data: profile } = useAuthMe();
  const customers = useMemo(() => data?.data ?? [], [data?.data]);
  const customerOptions = useMemo(() => {
    if (!selectedId || !selectedName || customers.some((customer) => String(customer.id) === String(selectedId))) {
      return customers;
    }

    return [
      {
        id: selectedId,
        name: selectedName,
        address: null,
        npwp: null,
        pic: null,
        phone: null,
        map_link: null,
      },
      ...customers,
    ];
  }, [customers, selectedId, selectedName]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  const handleCreate = async (values: CustomerFormValues) => {
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
      const created = await createCustomer.mutateAsync({
        ...values,
        address: values.address || undefined,
        npwp: values.npwp || undefined,
        pic: values.pic || undefined,
        phone: values.phone || undefined,
        map_link: values.map_link || undefined,
        companyId: Number(companyId) || companyId,
        userId: Number(userId) || userId,
      });
      onSelect(created);
      form.reset(defaultValues);
      setCreateOpen(false);
      toast.success('Data customer berhasil ditambahkan');
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof CustomerFormValues, {
            message: messages?.[0] || 'Validasi gagal',
          });
        });
      }
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menyimpan data customer';
      toast.error(message);
    }
  };

  return (
    <>
      <SelectAdd
        allowAdd={allowCreate}
        addDisabled={disabled}
        addLabel="Tambah customer"
        onAdd={() => {
          form.reset(defaultValues);
          setCreateOpen(true);
        }}
      >
        <Select
          value={selectedId ? String(selectedId) : undefined}
          onValueChange={(value) => {
            const customer = customerOptions.find((item) => String(item.id) === value);
            if (customer) onSelect(customer);
          }}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden bg-transparent font-normal">
            <SelectValue maxLength={35} placeholder={isLoading ? 'Memuat customer...' : selectedName || 'Pilih customer'} />
          </SelectTrigger>
          <SelectContent showSearch searchPlaceholder="Cari customer...">
            {customerOptions.map((customer) => (
              <SelectItem key={String(customer.id)} value={String(customer.id)} maxLength={40}>
                {customer.name}
              </SelectItem>
            ))}
            {isError && (
              <div className="px-3 py-2 text-xs text-destructive">
                Gagal memuat customer.{' '}
                <button type="button" className="underline" onClick={() => refetch()}>
                  Coba lagi
                </button>
              </div>
            )}
          </SelectContent>
        </Select>
      </SelectAdd>

      <CustomerFormModal
        open={createOpen}
        onOpenChange={(nextOpen) => {
          setCreateOpen(nextOpen);
          if (!nextOpen) form.reset(defaultValues);
        }}
        form={form}
        onSubmit={handleCreate}
        title="Tambah Data Customer"
        description="Masukkan detail customer baru"
        isSubmitting={createCustomer.isPending}
      />
    </>
  );
}
