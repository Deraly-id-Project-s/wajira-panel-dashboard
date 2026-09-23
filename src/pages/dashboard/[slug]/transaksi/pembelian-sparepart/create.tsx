import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SparepartForm } from '@/components/features/sparepart-transaction/SparepartForm';
import { useCreateSparepartTransaction } from '@/hooks/useSparepartTransaction';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export default function CreatePurchaseSparepartPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const createMutation = useCreateSparepartTransaction();

  const handleCancel = () => {
    router.push(`/dashboard/${slug}/transaksi/pembelian-sparepart`);
  };

  const handleSubmit = async (data: any) => {
    try {
      const sparepartTransactionResponse = await createMutation.mutateAsync({
        ...data,
        type: 'purchase',
      });
      toast.success('Pembelian Sparepart berhasil ditambahkan');
      router.push(`/dashboard/${slug}/transaksi/pembelian-sparepart/${sparepartTransactionResponse?.id}`);
    } catch {
      toast.error('Gagal menambahkan Pembelian Sparepart');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tambah Pembelian Sparepart"
          onBack={handleCancel}
          breadcrumbs={[
            { label: 'Pembelian Sparepart', onClick: handleCancel },
            { label: 'Tambah Data' },
          ]}
        />

        <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
          <SparepartForm
            type="purchase"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            companyId={companyId}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
