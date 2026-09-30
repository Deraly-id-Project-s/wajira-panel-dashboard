import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import VehicleEquipmentTransactionForm from '@/components/features/vehicle-equipment-transaction/VehicleEquipmentTransactionForm';
import { useUpdateVehicleEquipmentTransaction, useVehicleEquipmentTransaction } from '@/hooks/useVehicleEquipmentTransaction';
import { useCompany } from '@/contexts/CompanyContext';

export default function EditSalesVehicleEquipmentPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const transactionId = typeof id === 'string' ? id : '';
  const { companyId } = useCompany();
  const { data, isLoading } = useVehicleEquipmentTransaction(transactionId, Boolean(transactionId));
  const updateMutation = useUpdateVehicleEquipmentTransaction();
  const back = () => router.push(`/dashboard/${slug}/transaksi/penjualan-perlengkapan`);
  const detail = () => router.push(`/dashboard/${slug}/transaksi/penjualan-perlengkapan/${transactionId}`);

  const handleSubmit = async (values: any) => {
    try {
      await updateMutation.mutateAsync({ id: transactionId, payload: { ...values, company_id: Number(companyId), type: 'sales' } });
      toast.success('Penjualan Perlengkapan berhasil diperbarui');
      detail();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui Penjualan Perlengkapan');
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
          title="Edit Penjualan Perlengkapan"
          onBack={detail}
          breadcrumbs={[
            { label: 'Penjualan Perlengkapan', onClick: back },
            { label: 'Detail', onClick: detail },
            { label: 'Edit' },
          ]}
        />
        <VehicleEquipmentTransactionForm
          type="sales"
          onSubmit={handleSubmit}
          onCancel={detail}
          companyId={companyId}
          defaultValues={data as any}
        />
      </div>
    </DashboardLayout>
  );
}
