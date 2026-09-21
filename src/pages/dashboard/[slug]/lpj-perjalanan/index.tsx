import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeleteLPJModal } from '@/components/features/lpj-perjalanan/DeleteLPJModal';
import { LPJTable } from '@/components/features/lpj-perjalanan/LPJTable';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Plus } from 'lucide-react';
import { DUMMY_LPJ_RECORDS, type LPJRecord, setDummyLPJRecords } from '@/components/features/lpj-perjalanan/lpj-perjalanan.data';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

export default function LPJPerjalananPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { page, perPage, search, setPage, setPerPage, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });

  const [lpjRecords, setLpjRecords] = useState<LPJRecord[]>(DUMMY_LPJ_RECORDS);
  const [selectedItem, setSelectedItem] = useState<LPJRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase();
    return lpjRecords.filter(
      (item) =>
        item.kodeLPJ.toLowerCase().includes(keyword) ||
        item.driver.toLowerCase().includes(keyword) ||
        item.noPolisi.toLowerCase().includes(keyword) ||
        item.ruteAsal.toLowerCase().includes(keyword) ||
        item.ruteTujuan.toLowerCase().includes(keyword),
    );
  }, [lpjRecords, search]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, page, perPage]);

  const lastPage = useMemo(() => Math.max(1, Math.ceil(filteredData.length / perPage)), [filteredData.length, perPage]);

  useEffect(() => {
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [page, lastPage, setPage]);

  const handleAdd = () => {
    router.push(`/dashboard/${slug}/lpj-perjalanan/create`);
  };

  const handleEdit = (item: LPJRecord) => {
    router.push(`/dashboard/${slug}/lpj-perjalanan/edit/${item.id}`);
  };

  const handleDetail = (item: LPJRecord) => {
    router.push(`/dashboard/${slug}/lpj-perjalanan/detail/${item.id}`);
  };

  const handleDelete = (item: LPJRecord) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedItem) return;

    const updated = lpjRecords.filter((item) => item.id !== selectedItem.id);
    setLpjRecords(updated);
    setDummyLPJRecords(updated);
    setDeleteOpen(false);
    setSelectedItem(null);
    toast.success('Data LPJ berhasil dihapus');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">LPJ Ekspedisi</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan Pertanggungjawaban Pengiriman</p>
        </div>

        <SearchPagination
          searchValue={search ?? ''}
          onSearchChange={(value) => {
            updateQuery({ search: value, page: 1 });
          }}
          searchPlaceholder="Cari LPJ..."
          searchAriaLabel="Cari data LPJ"
          page={page}
          perPage={perPage}
          total={filteredData.length}
          lastPage={lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={
            <Button onClick={handleAdd} className="btn-primary!">
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          }
        >
          <LPJTable
            data={paginatedData}
            onEdit={handleEdit}
            onDetail={handleDetail}
            onDelete={handleDelete}
          />
        </SearchPagination>
      </div>

      <DeleteLPJModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </DashboardLayout>
  );
}
