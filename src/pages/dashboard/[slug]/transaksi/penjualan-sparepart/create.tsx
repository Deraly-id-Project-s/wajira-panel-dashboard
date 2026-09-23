import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SparepartForm } from '@/components/features/sparepart-transaction/SparepartForm';
import { useCreateSparepartTransaction } from '@/hooks/useSparepartTransaction';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export default function CreateSalesSparepartPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const createMutation = useCreateSparepartTransaction();

  const handleCancel = () => {
    router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart`);
  };

  const handleSubmit = async (data: any) => {
    try {
      const sparepartTransactionResponse = await createMutation.mutateAsync({
        ...data,
        type: 'sales',
      });
      toast.success('Penjualan Sparepart berhasil ditambahkan');
      router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/${sparepartTransactionResponse?.id}`);
    } catch (error) {
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tambah Penjualan Sparepart"
          onBack={handleCancel}
          breadcrumbs={[
            { label: 'Penjualan Sparepart', onClick: handleCancel },
            { label: 'Tambah Data' },
          ]}
        />

        <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
          <SparepartForm
            type="sales"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            companyId={companyId}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
