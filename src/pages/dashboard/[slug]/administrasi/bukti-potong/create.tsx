import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BuktiPotongForm from '@/components/features/bukti-potong/BuktiPotongForm';
import { useCompany } from '@/contexts/CompanyContext';

export default function CreateBuktiPotongPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const companyNumber = Number(companyId || 4);
  const slug = router.query.slug as string;

  const handleBack = () => {
    router.push(slug ? `/dashboard/${slug}/administrasi/bukti-potong` : '/administrasi/bukti-potong');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Bukti Potong', onClick: handleBack },
            { label: 'Tambah Bukti Potong' },
          ]}
          title="Form Tambah Bukti Potong"
          subtitle="Kelola data Bukti Potong"
          onBack={handleBack}
        />

        <div className="rounded-md border bg-white p-5 md:p-6 shadow-sm">
          <BuktiPotongForm
            item={null}
            companyId={companyNumber}
            onSuccess={handleBack}
            onCancel={handleBack}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
