import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import SparepartRefundForm from '@/components/features/sparepart-refund/SparepartRefundForm';
import { useSparepartRefund } from '@/hooks/useSparepartRefund';

export default function EditSparepartRefundPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const query = useSparepartRefund(id);
  return <DashboardLayout><div className="space-y-6"><PageHeader title="Edit Refund Sparepart" breadcrumbs={[{ label: 'Data Refund Sparepart', onClick: () => router.back() }, { label: 'Edit Refund' }]} />{query.isLoading ? <div>Memuat data...</div> : <SparepartRefundForm existing={query.data} />}</div></DashboardLayout>;
}
