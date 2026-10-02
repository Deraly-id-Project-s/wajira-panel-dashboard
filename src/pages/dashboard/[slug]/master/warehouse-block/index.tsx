import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getWarehouseBlocks, createWarehouseBlock, updateWarehouseBlock, deleteWarehouseBlock, type WarehouseBlock } from '@/services/warehouseBlock.service';
import { WarehouseBlockTable } from '@/components/features/master-data/warehouse-block/WarehouseBlockTable';
import { WarehouseBlockForm } from '@/components/features/master-data/warehouse-block/WarehouseBlockForm';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import Head from 'next/head';
import { Plus, Download } from 'lucide-react';

export default function WarehouseBlockPage() {
  const { companyId } = useCompany();
  const router = useRouter();
  const slug = router.query.slug as string;
  const queryClient = useQueryClient();

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const debouncedSearch = search;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<WarehouseBlock | undefined>();

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['warehouse-blocks', page, perPage, debouncedSearch, companyId],
    queryFn: () => getWarehouseBlocks(page, perPage, debouncedSearch, companyId),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: createWarehouseBlock,
    onSuccess: () => {
      toast.success('Berhasil menambahkan blok gudang baru');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['warehouse-blocks'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menambahkan blok gudang');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateWarehouseBlock(id, data),
    onSuccess: () => {
      toast.success('Berhasil mengubah data blok gudang');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['warehouse-blocks'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengubah data blok gudang');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouseBlock,
    onSuccess: () => {
      toast.success('Berhasil menghapus data blok gudang');
      queryClient.invalidateQueries({ queryKey: ['warehouse-blocks'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menghapus blok gudang');
    },
  });

  const handleAdd = () => {
    setSelectedBlock(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (block: WarehouseBlock) => {
    setSelectedBlock(block);
    setIsFormOpen(true);
  };

  const handleDelete = (block: WarehouseBlock) => {
    if (confirm(`Apakah Anda yakin ingin menghapus blok gudang ${block.name}?`)) {
      deleteMutation.mutate(block.id);
    }
  };

  const handleViewDetail = (block: WarehouseBlock) => {
    router.push(`/dashboard/${slug}/master/warehouse-block/${block.id}/detail`);
  };

  const handleSubmit = (values: any) => {
    if (selectedBlock) {
      updateMutation.mutate({ id: selectedBlock.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleExport = () => {
    const rows = data?.data?.data || [];
    const headers = ['Nama Blok', 'Gudang Utama', 'Deskripsi', 'Jumlah Sub Blok'];
    const csv = [headers, ...rows.map((item) => [
      item.name,
      item.warehouse?.name ?? '-',
      item.description ?? '-',
      String(item.warehouse_sub_block_count ?? '-'),
    ])].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blok-gudang-page-${page}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Blok Gudang | Wajira</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Data Blok Gudang"
            subtitle="Kelola master data blok gudang dan sub-blok data"
          />

          <SearchPagination
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Cari blok gudang..."
            searchAriaLabel="Cari blok gudang"
            page={page}
            perPage={perPage}
            total={data?.data?.total}
            lastPage={data?.data?.last_page}
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
                <Button onClick={handleExport} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {canCreate && (
                  <Button onClick={handleAdd} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                )}
              </>
            }
          >
            {isError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-6 py-5 text-base text-red-600">
                Gagal memuat data blok gudang.
              </div>
            ) : (
              <WarehouseBlockTable
                data={data?.data?.data || []}
                isLoading={isLoading || isFetching}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetail={handleViewDetail}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            )}
          </SearchPagination>
        </div>

        <WarehouseBlockForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={selectedBlock}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </DashboardLayout>
    </>
  );
}