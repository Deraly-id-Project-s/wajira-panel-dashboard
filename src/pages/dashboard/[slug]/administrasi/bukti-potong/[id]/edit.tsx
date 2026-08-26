import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BuktiPotongForm from '@/components/features/bukti-potong/BuktiPotongForm';
import { useCompany } from '@/contexts/CompanyContext';
import { useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditBuktiPotongPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const companyNumber = Number(companyId || 4);
  const slug = router.query.slug as string;
  const { id } = router.query;

  const { data, isLoading } = useWithholdingTaxDetail(id as string);

  const handleBack = () => {
    router.push(slug ? `/dashboard/${slug}/administrasi/bukti-potong` : '/administrasi/bukti-potong');
  };

  if (!id) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Bukti Potong', onClick: handleBack },
            { label: 'Edit Bukti Potong' },
          ]}
          title="Form Edit Bukti Potong"
          subtitle={
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>No Bukti Potong:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{data?.no_invoice}</span>
            </div>
          }
          onBack={handleBack}
        />

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {isLoading ? (
            <LoadingState variant="page" />
          ) : (
            <BuktiPotongForm
              item={data || null}
              companyId={companyNumber}
              onSuccess={handleBack}
              onCancel={handleBack}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
