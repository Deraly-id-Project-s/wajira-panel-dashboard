import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { DriverForm } from '@/components/features/driver/DriverForm';
import { useCompany } from '@/contexts/CompanyContext';
import { useDriverDetail, useUpdateDriver } from '@/hooks/useDriver';
import type { DriverPayload } from '@/@types/driver.types';

export default function EditDriverPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const id = router.query.id as string | undefined;
  const { companyId } = useCompany();
  const { data: driver, isLoading, isError } = useDriverDetail(id ?? null);
  const mutation = useUpdateDriver();
  const detailPath = `/dashboard/${slug}/master/driver/${id ?? ''}`;
  const back = () => router.push(detailPath);

  const submit = async (payload: DriverPayload) => {
    if (!id || !companyId) {
      toast.error('Driver atau company tidak valid');
      return;
    }
    try {
      await mutation.mutateAsync({ id, data: { ...payload, company_id: companyId } });
      toast.success('Data driver berhasil diubah');
      await back();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengubah data driver');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Edit Driver" subtitle="Perbarui data pribadi dan akun driver" breadcrumbs={[{ label: 'Driver', onClick: () => router.push(`/dashboard/${slug}/master/driver`) }, { label: driver?.name || 'Detail', onClick: back }, { label: 'Edit' }]} onBack={back} />
        {isLoading ? <LoadingState variant="section" text="Memuat data driver..." /> : isError || !driver ? <div className="rounded-md border bg-white p-6 text-sm text-red-600">Data driver tidak dapat dimuat.</div> : <DriverForm initialData={driver} companyId={companyId ?? driver.companyId ?? ''} isSubmitting={mutation.isPending} onSubmit={submit} onCancel={back} />}
      </div>
    </DashboardLayout>
  );
}
