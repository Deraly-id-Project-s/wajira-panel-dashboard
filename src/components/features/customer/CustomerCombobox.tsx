'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Customer } from '@/types/customer.types';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomer';
import { ApiResponseError, ApiValidationError } from '@/lib/api/response';
import { cn } from '@/lib/utils';
import { customerSchema, type CustomerFormValues } from '@/schemas/customer.schema';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data } = useCustomers({
    company_id: companyId ? String(companyId) : undefined,
    perPage: 100,
    page: 1,
    enabled: Boolean(companyId),
  });
  const createCustomer = useCreateCustomer();
  const { data: profile } = useAuthMe();
  const customers = useMemo(() => data?.data ?? [], [data?.data]);
  const selected = customers.find((customer) => String(customer.id) === String(selectedId));

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
      setOpen(false);
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
      <div className="flex items-center gap-2 w-full min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-controls="customer-combobox-list"
              disabled={disabled}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 min-w-0 font-normal text-left"
            >
              <span className={cn('truncate', !selectedName && !selected && 'text-muted-foreground')}>
                {selectedName || selected?.name || 'Pilih customer'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari customer..." />
              <CommandList id="customer-combobox-list">
                <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={String(customer.id)}
                      value={`${customer.name} ${customer.code ?? ''} ${customer.id}`}
                      onSelect={() => {
                        onSelect(customer);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', String(selectedId) === String(customer.id) || (!selectedId && selectedName === customer.name) ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{customer.name}</span>
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
            aria-label="Tambah customer"
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
