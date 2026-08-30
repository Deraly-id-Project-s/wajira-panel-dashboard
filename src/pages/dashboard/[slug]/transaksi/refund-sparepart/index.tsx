import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SparepartRefundTable from '@/components/features/sparepart-refund/SparepartRefundTable';
import { useDeleteSparepartRefund, useSparepartRefunds } from '@/hooks/useSparepartRefund';

export default function SparepartRefundPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const query = useSparepartRefunds({ page, perPage, search, type });
  const deleteMutation = useDeleteSparepartRefund();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data refund sparepart ini?')) return;
    try { await deleteMutation.mutateAsync(id); toast.success('Refund berhasil dihapus'); } catch (error: any) { toast.error(error?.message || 'Gagal menghapus refund'); }
  };
  return <DashboardLayout><div className="space-y-6"><div className="flex items-center justify-between"><PageHeader title="Data Refund Sparepart" breadcrumbs={[{ label: 'Administrasi' }, { label: 'Data Refund Sparepart' }]} /><Button onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-sparepart/create`)}><Plus className="mr-2 h-4 w-4" /> Tambah Refund</Button></div><div className="flex gap-2"><Button variant={type === 'all' ? 'default' : 'outline'} onClick={() => { setType('all'); setPage(1); }}>Semua</Button><Button variant={type === 'purchase' ? 'default' : 'outline'} onClick={() => { setType('purchase'); setPage(1); }}>Pembelian</Button><Button variant={type === 'sales' ? 'default' : 'outline'} onClick={() => { setType('sales'); setPage(1); }}>Penjualan</Button></div><SparepartRefundTable data={query.data?.data || []} meta={query.data?.meta} loading={query.isLoading || query.isFetching} search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} onPageChange={setPage} onPerPageChange={(value) => { setPerPage(value); }} onDelete={handleDelete} /></div></DashboardLayout>;
}
