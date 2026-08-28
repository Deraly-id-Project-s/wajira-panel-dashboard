import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeleteLPJModal } from '@/components/features/lpj-perjalanan/DeleteLPJModal';
import { LPJTable } from '@/components/features/lpj-perjalanan/LPJTable';
import { DUMMY_LPJ_RECORDS, type LPJRecord, setDummyLPJRecords } from '@/components/features/lpj-perjalanan/lpj-perjalanan.data';

export default function LPJPerjalananPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [lpjRecords, setLpjRecords] = useState<LPJRecord[]>(DUMMY_LPJ_RECORDS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

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

        <LPJTable
          data={paginatedData}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          page={page}
          perPage={perPage}
          totalData={filteredData.length}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
          }}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDetail={handleDetail}
          onDelete={handleDelete}
        />
      </div>

      <DeleteLPJModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </DashboardLayout>
  );
}
