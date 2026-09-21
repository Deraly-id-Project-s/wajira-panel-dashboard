import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import SparepartRefundTable from '@/components/features/sparepart-refund/SparepartRefundTable';
import { useDeleteSparepartRefund, useSparepartRefunds } from '@/hooks/useSparepartRefund';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

export default function SparepartRefundPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const [type, setType] = useState('all');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const query = useSparepartRefunds({ page, perPage, search, type });
  const deleteMutation = useDeleteSparepartRefund();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data refund sparepart ini?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Refund berhasil dihapus');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus refund');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Data Refund Sparepart</h1>
            <p className="text-sm text-muted-foreground">Kelola data refund sparepart dengan mudah</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant={type === 'all' ? 'default' : 'outline'} onClick={() => { setType('all'); setPage(1); }}>
            Semua
          </Button>
          <Button variant={type === 'purchase' ? 'default' : 'outline'} onClick={() => { setType('purchase'); setPage(1); }}>
            Pembelian
          </Button>
          <Button variant={type === 'sales' ? 'default' : 'outline'} onClick={() => { setType('sales'); setPage(1); }}>
            Penjualan
          </Button>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kode refund..."
          searchAriaLabel="Cari refund sparepart"
          page={page}
          perPage={perPage}
          total={query.data?.meta.total}
          lastPage={query.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={
            <>
              {search && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    updateQuery({ search: undefined, page: 1 });
                  }}
                  className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                >
                  Reset
                </Button>
              )}
              <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-sparepart/create`)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Refund
              </Button>
            </>
          }
        >
          <SparepartRefundTable
            data={query.data?.data || []}
            loading={query.isLoading || query.isFetching}
            onDelete={handleDelete}
          />
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}