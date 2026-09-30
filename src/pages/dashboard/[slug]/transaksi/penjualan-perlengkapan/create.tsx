import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import VehicleEquipmentTransactionForm from '@/components/features/vehicle-equipment-transaction/VehicleEquipmentTransactionForm';
import { useCreateVehicleEquipmentTransaction } from '@/hooks/useVehicleEquipmentTransaction';
import { useCompany } from '@/contexts/CompanyContext';

export default function CreateSalesVehicleEquipmentPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();
  const createMutation = useCreateVehicleEquipmentTransaction();
  const back = () => router.push(`/dashboard/${slug}/transaksi/penjualan-perlengkapan`);

  const handleSubmit = async (data: any) => {
    try {
      const response = await createMutation.mutateAsync({ ...data, company_id: Number(companyId), type: 'sales' });
      toast.success('Penjualan Perlengkapan berhasil ditambahkan');
      router.push(`/dashboard/${slug}/transaksi/penjualan-perlengkapan/${response.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menambahkan Penjualan Perlengkapan');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tambah Penjualan Perlengkapan"
          onBack={back}
          breadcrumbs={[
            { label: 'Penjualan Perlengkapan', onClick: back },
            { label: 'Tambah Data Penjualan' },
          ]}
        />
        <VehicleEquipmentTransactionForm
          type="sales"
          onSubmit={handleSubmit}
          onCancel={back}
          companyId={companyId}
        />
      </div>
    </DashboardLayout>
  );
}
