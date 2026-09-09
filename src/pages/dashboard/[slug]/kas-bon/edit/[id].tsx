import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { KasBonForm } from '@/components/features/kas-bon/KasBonForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDrivers } from '@/hooks/useDriver';
import { useDriverCashAdvanceDetail, useUpdateDriverCashAdvance } from '@/hooks/useDriverCashAdvance';
import type { DriverCashAdvanceFormValues } from '@/schemas/driver-cash-advance.schema';

export default function EditKasBonPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const { companyId } = useCompany();
  const companyNumber = Number(companyId || 0);
  const [driverSearch, setDriverSearch] = React.useState('');
  const debouncedDriverSearch = useDebouncedValue(driverSearch, 350);

  const detailQuery = useDriverCashAdvanceDetail(id);
  const driverQuery = useDrivers({
    page: 1,
    perPage: 100,
    search: debouncedDriverSearch,
    company_id: companyId ?? undefined,
    enabled: Boolean(companyId),
  });
  const updateMutation = useUpdateDriverCashAdvance();

  const driverOptions = React.useMemo<SearchableSelectOption[]>(
    () => (driverQuery.data?.data ?? []).map((item) => ({ value: String(item.id), label: item.name, subtitle: item.code })),
    [driverQuery.data?.data],
  );

  const handleSubmit = async (values: DriverCashAdvanceFormValues) => {
    if (!id || !companyNumber) {
      toast.error('Data kas bon belum siap');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          company_id: companyNumber,
          driver_id: Number(values.driverId),
          subject: values.subject,
          description: values.description || '',
          claim_nominal: Number(values.claimNominal),
          claim_date: values.claimDate,
        },
      });
      toast.success('Kas bon berhasil diperbarui');
      await router.push(`/dashboard/${slug}/kas-bon`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui kas bon');
    }
  };

  if (detailQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Gagal memuat data kas bon.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Edit Kas Bon - Wajira Dashboard</title>
      </Head>

      <KasBonForm
        mode="edit"
        initialData={detailQuery.data}
        companyId={companyNumber || detailQuery.data.companyId}
        driverOptions={driverOptions}
        driverLoading={driverQuery.isLoading}
        onDriverSearch={setDriverSearch}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/dashboard/${slug}/kas-bon`)}
        isSubmitting={updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
