import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SalesSparepartForm } from '@/components/features/sparepart-transaction/SalesSparepartForm';
import { useSparepartTransaction, useUpdateSparepartTransaction } from '@/hooks/useSparepartTransaction';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';

export default function EditSalesSparepartPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();

  const { data: transaction, isLoading } = useSparepartTransaction(id as string, !!id);
  const updateMutation = useUpdateSparepartTransaction();

  const handleCancel = () => {
    router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart`);
  };

  const handleSubmit = async (data: any) => {
    try {
      const sparepartTransactionResponse = await updateMutation.mutateAsync({
        id: id as string,
        payload: {
          ...data,
          type: 'sales',
        }
      });
      toast.success('Penjualan Sparepart berhasil diperbarui');
      router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/${sparepartTransactionResponse?.id}`);
    } catch {
      toast.error('Gagal memperbarui Penjualan Sparepart');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Edit Penjualan Sparepart"
          onBack={handleCancel}
          breadcrumbs={[
            { label: 'Penjualan Sparepart', onClick: handleCancel },
            { label: 'Edit Data' },
          ]}
        />

        <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
          {!isLoading && transaction ? (
            <SalesSparepartForm
              defaultValues={{
                person_id: transaction.person_id,
                sparepart_id: transaction.sparepart_id,
                qty: transaction.qty,
                price: transaction.price,
                discount: transaction.discount,
                transaction_date: transaction.transaction_date,
                nota_number: transaction.nota_number,
                billing_type: transaction.billing_type,
                billing_due_date: transaction.billing_due_date,
                note: transaction.note,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              companyId={companyId}
            />
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
