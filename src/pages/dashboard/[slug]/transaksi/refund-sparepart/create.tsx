import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import SparepartRefundForm from '@/components/features/sparepart-refund/SparepartRefundForm';

export default function CreateSparepartRefundPage() {
  const router = useRouter();
  return <DashboardLayout><div className="space-y-6"><PageHeader title="Tambah Refund Sparepart" breadcrumbs={[{ label: 'Data Refund Sparepart', onClick: () => router.back() }, { label: 'Tambah Refund' }]} /><SparepartRefundForm /></div></DashboardLayout>;
}
