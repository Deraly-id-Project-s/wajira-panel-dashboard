import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { KasBonForm } from '@/components/features/kas-bon/KasBonForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDrivers } from '@/hooks/useDriver';
import { useCreateDriverCashAdvance } from '@/hooks/useDriverCashAdvance';
import type { DriverCashAdvanceFormValues } from '@/schemas/driver-cash-advance.schema';

export default function CreateKasBonPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const companyNumber = Number(companyId || 0);
  const [driverSearch, setDriverSearch] = React.useState('');
  const debouncedDriverSearch = useDebouncedValue(driverSearch, 350);

  const driverQuery = useDrivers({
    page: 1,
    perPage: 100,
    search: debouncedDriverSearch,
    company_id: companyId ?? undefined,
    enabled: Boolean(companyId),
  });
  const createMutation = useCreateDriverCashAdvance();

  const driverOptions = React.useMemo<SearchableSelectOption[]>(
    () => (driverQuery.data?.data ?? []).map((item) => ({ value: String(item.id), label: item.name, subtitle: item.code })),
    [driverQuery.data?.data],
  );

  const handleSubmit = async (values: DriverCashAdvanceFormValues) => {
    if (!companyNumber) {
      toast.error('Perusahaan belum dipilih');
      return;
    }

    try {
      await createMutation.mutateAsync({
        company_id: companyNumber,
        driver_id: Number(values.driverId),
        subject: values.subject,
        description: values.description || '',
        claim_nominal: Number(values.claimNominal),
        claim_date: values.claimDate,
      });
      toast.success('Kas bon berhasil ditambahkan');
      await router.push(`/dashboard/${slug}/kas-bon`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan kas bon');
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Tambah Kas Bon - Wajira Dashboard</title>
      </Head>

      <KasBonForm
        mode="create"
        companyId={companyNumber}
        driverOptions={driverOptions}
        driverLoading={driverQuery.isLoading}
        onDriverSearch={setDriverSearch}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/dashboard/${slug}/kas-bon`)}
        isSubmitting={createMutation.isPending}
      />
    </DashboardLayout>
  );
}
