import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { DriverCashAdvance } from '@/@types/driver-cash-advance.types';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import { driverCashAdvanceSchema, type DriverCashAdvanceFormValues } from '@/schemas/driver-cash-advance.schema';

interface KasBonFormProps {
  mode: 'create' | 'edit';
  initialData?: DriverCashAdvance | null;
  companyId: number;
  driverOptions: SearchableSelectOption[];
  driverLoading?: boolean;
  onDriverSearch: (value: string) => void;
  onSubmit: (values: DriverCashAdvanceFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function KasBonForm({
  mode,
  initialData,
  companyId,
  driverOptions,
  driverLoading = false,
  onDriverSearch,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: KasBonFormProps) {
  const defaultDriverOptions = React.useMemo<SearchableSelectOption[]>(() => {
    if (!initialData?.driver?.id) return [];
    return [
      {
        value: String(initialData.driver.id),
        label: initialData.driver.name,
        subtitle: initialData.driver.code ?? undefined,
      },
    ];
  }, [initialData?.driver]);

  const mergedDriverOptions = React.useMemo(() => {
    const map = new Map<string, SearchableSelectOption>();
    [...defaultDriverOptions, ...driverOptions].forEach((option) => map.set(option.value, option));
    return Array.from(map.values());
  }, [defaultDriverOptions, driverOptions]);

  const form = useForm<DriverCashAdvanceFormValues>({
    resolver: zodResolver(driverCashAdvanceSchema),
    defaultValues: {
      companyId,
      driverId: initialData?.driverId ? String(initialData.driverId) : '',
      subject: initialData?.subject ?? '',
      description: initialData?.description ?? '',
      claimNominal: Number(initialData?.claimNominal ?? 0),
      claimDate: initialData?.claimDate ?? '',
    },
  });

  React.useEffect(() => {
    form.reset({
      companyId,
      driverId: initialData?.driverId ? String(initialData.driverId) : '',
      subject: initialData?.subject ?? '',
      description: initialData?.description ?? '',
      claimNominal: Number(initialData?.claimNominal ?? 0),
      claimDate: initialData?.claimDate ?? '',
    });
  }, [companyId, form, initialData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Tambah Kas Bon' : 'Edit Kas Bon'}
        subtitle="Kelola pengajuan kas bon driver"
        onBack={onCancel}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Driver <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={mergedDriverOptions}
                      placeholder="Pilih driver"
                      searchPlaceholder="Cari driver..."
                      emptyText="Driver tidak ditemukan"
                      loading={driverLoading}
                      onSearchChange={onDriverSearch}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="claimDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tanggal Klaim <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subject <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Kas bon (pertama)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="claimNominal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nominal Klaim <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <MoneyInput value={field.value} onChangeValue={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Tambahkan deskripsi bila diperlukan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="rounded-md">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="btn-primary!">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
