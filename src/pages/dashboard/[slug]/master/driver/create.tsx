import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DriverForm } from '@/components/features/driver/DriverForm';
import { useCompany } from '@/contexts/CompanyContext';
import { useCreateDriver } from '@/hooks/useDriver';
import type { DriverPayload } from '@/@types/driver.types';

export default function CreateDriverPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const { companyId } = useCompany();
  const mutation = useCreateDriver();
  const back = () => router.push(`/dashboard/${slug}/master/driver`);

  const submit = async (payload: DriverPayload) => {
    if (!companyId) {
      toast.error('Company belum dipilih');
      return;
    }
    try {
      await mutation.mutateAsync({ ...payload, company_id: companyId });
      toast.success('Data driver berhasil ditambahkan');
      await back();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menambahkan data driver');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Tambah Driver" subtitle="Lengkapi data pribadi dan akun driver" breadcrumbs={[{ label: 'Driver', onClick: back }, { label: 'Tambah' }]} onBack={back} />
        {companyId ? <DriverForm companyId={companyId} isSubmitting={mutation.isPending} onSubmit={submit} onCancel={back} /> : <div className="rounded-md border bg-white p-6 text-sm text-slate-600">Pilih company terlebih dahulu untuk menambahkan driver.</div>}
      </div>
    </DashboardLayout>
  );
}
