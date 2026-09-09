import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getWarehouseBlockDetail } from '@/services/warehouseBlock.service';
import { createWarehouseSubBlock, updateWarehouseSubBlock, deleteWarehouseSubBlock, makeDefaultWarehouseSubBlock, importWarehouseSubBlock, exportWarehouseSubBlock } from '@/services/warehouseSubBlock.service';
import { WarehouseSubBlockTable } from '@/components/features/master-data/warehouse-sub-block/WarehouseSubBlockTable';
import { WarehouseSubBlockForm, type WarehouseSubBlockFormValues } from '@/components/features/master-data/warehouse-sub-block/WarehouseSubBlockForm';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { WarehouseSubBlock } from '@/services/warehouseBlock.service';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Download, Plus, Upload } from 'lucide-react';

export default function WarehouseBlockDetailPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const blockId = Number(router.query.id);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
        setPage(1);
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubBlock, setSelectedSubBlock] = useState<WarehouseSubBlock | undefined>();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: blockData, isLoading: isBlockLoading } = useQuery({
    queryKey: ['warehouse-block', blockId],
    queryFn: () => getWarehouseBlockDetail(blockId),
    enabled: !!blockId,
  });

  const block = blockData?.data;

  const [confirmDelete, setConfirmDelete] = useState<WarehouseSubBlock | null>(null);
  const [confirmMakeDefault, setConfirmMakeDefault] = useState<WarehouseSubBlock | null>(null);
  const [confirmToggleActive, setConfirmToggleActive] = useState<WarehouseSubBlock | null>(null);

  const makeDefaultMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => makeDefaultWarehouseSubBlock(id, data),
    onSuccess: () => {
      toast.success('Berhasil mengatur sub blok sebagai default');
      setIsFormOpen(false);
      setConfirmMakeDefault(null);
      queryClient.invalidateQueries({ queryKey: ['warehouse-block', blockId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengatur default');
    },
  });

  const createMutation = useMutation({
    mutationFn: createWarehouseSubBlock,
    onSuccess: (response, variables) => {
      toast.success('Berhasil menambahkan sub blok gudang baru');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['warehouse-block', blockId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menambahkan sub blok gudang');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateWarehouseSubBlock(id, data),
    onSuccess: (response, variables) => {
      toast.success('Berhasil mengubah data sub blok gudang');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['warehouse-block', blockId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengubah sub blok gudang');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouseSubBlock,
    onSuccess: () => {
      toast.success('Berhasil menghapus data sub blok gudang');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['warehouse-block', blockId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menghapus sub blok gudang');
    },
  });

  const importMutation = useMutation({
    mutationFn: importWarehouseSubBlock,
    onSuccess: () => {
      toast.success('Berhasil mengimpor detail sub blok');
      setIsImportModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['warehouse-block', blockId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal mengimpor detail sub blok');
    }
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportWarehouseSubBlock();
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sub_blok_gudang.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdd = () => {
    setSelectedSubBlock(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (subBlock: WarehouseSubBlock) => {
    setSelectedSubBlock(subBlock);
    setIsFormOpen(true);
  };

  const handleDelete = (subBlock: WarehouseSubBlock) => {
    setConfirmDelete(subBlock);
  };

  const handleMakeDefault = (subBlock: WarehouseSubBlock) => {
    setConfirmMakeDefault(subBlock);
  };

  const handleToggleActive = (subBlock: WarehouseSubBlock) => {
    setConfirmToggleActive(subBlock);
  };

  const handleSubmit = (values: WarehouseSubBlockFormValues) => {
    const payload = { ...values, description: values.description || '', warehouse_block_id: blockId };
    if (selectedSubBlock) {
      updateMutation.mutate({ id: selectedSubBlock.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Client-side filtering and pagination for Sub Blocks
  const allSubBlocks = block?.warehouse_sub_blocks || [];
  const filteredSubBlocks = allSubBlocks.filter((sb) =>
    sb.name.toLowerCase().includes(search.toLowerCase()) ||
    (sb.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const startIdx = (page - 1) * perPage;
  const paginatedSubBlocks = filteredSubBlocks.slice(startIdx, startIdx + perPage);
  const totalPages = Math.ceil(filteredSubBlocks.length / perPage) || 1;

  return (
    <>
      <Head>
        <title>Detail Blok Gudang | Wajira</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Data Blok Gudang', onClick: () => router.push(`/dashboard/${slug}/master/warehouse-block`) },
              { label: 'Detail' }
            ]}
            title="Detail Blok Gudang"
            subtitle="Lihat detail informasi blok dan kelola sub-bloknya"
            onBack={() => router.push(`/dashboard/${slug}/master/warehouse-block`)}
          />

          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="text-base font-semibold">Informasi Blok Gudang</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isBlockLoading || !block ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Gudang Utama</p>
                    <p className="text-base font-semibold text-slate-900">{block.warehouse?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Nama Blok</p>
                    <p className="text-base font-semibold text-slate-900">{block.name}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-500 mb-1">Deskripsi</p>
                    <p className="text-base text-slate-900">{block.description || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Daftar Sub Blok Gudang</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                Kelola sub blok untuk
                {block?.name ? (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700">
                    Blok {block.name}
                  </Badge>
                ) : (
                  'blok ini'
                )}
              </p>
            </div>

            <SearchPagination
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              searchPlaceholder="Cari sub blok gudang..."
              searchAriaLabel="Cari sub blok gudang"
              page={page}
              perPage={perPage}
              total={filteredSubBlocks.length}
              lastPage={totalPages}
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
                        setSearch('');
                        setPage(1);
                      }}
                      className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                    >
                      Reset
                    </Button>
                  )}
                  <Button onClick={handleExport} disabled={isExporting} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Proses...' : 'Export'}
                  </Button>
                  {canCreate && (
                    <>
                      <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                      <Button onClick={handleAdd} className="btn-primary!">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Data
                      </Button>
                    </>
                  )}
                </>
              }
            >
              <WarehouseSubBlockTable
                data={paginatedSubBlocks}
                isLoading={isBlockLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMakeDefault={handleMakeDefault}
                onToggleActive={handleToggleActive}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </SearchPagination>
          </div>
        </div>

        <WarehouseSubBlockForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={selectedSubBlock}
          baseWarehouseBlockId={blockId}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending || makeDefaultMutation.isPending}
        />

        <DataImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          title="Import Sub Blok Gudang"
          description="Download template untuk memastikan format data sesuai sebelum melakukan import"
          templateUrl="https://docs.google.com/spreadsheets/d/1dix-TR6FpAstJUggUpCG_-AVAoZYPMunGqS3DNF-U8s/edit?usp=sharing"
          onImport={async (file) => { await importMutation.mutateAsync(file); }}
          isPending={importMutation.isPending}
        />

        <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Sub Blok</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus sub blok <strong>{confirmDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (confirmDelete) deleteMutation.mutate(confirmDelete.id);
                }}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!confirmMakeDefault} onOpenChange={(open) => !open && setConfirmMakeDefault(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Jadikan Default</AlertDialogTitle>
              <AlertDialogDescription>
                Jadikan <strong>{confirmMakeDefault?.name}</strong> sebagai sub blok default? Sub blok default lainnya pada blok ini akan otomatis dinonaktifkan status default-nya.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={makeDefaultMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (confirmMakeDefault) {
                    makeDefaultMutation.mutate({
                      id: confirmMakeDefault.id,
                      data: {
                        warehouse_block_id: blockId,
                        name: confirmMakeDefault.name,
                        description: confirmMakeDefault.description || '',
                        is_active: confirmMakeDefault.is_active,
                        is_default: true,
                      }
                    });
                  }
                }}
                disabled={makeDefaultMutation.isPending}
                className="btn-primary-orange!"
              >
                {makeDefaultMutation.isPending ? 'Menyimpan...' : 'Jadikan Default'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!confirmToggleActive} onOpenChange={(open) => !open && setConfirmToggleActive(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmToggleActive && (String(confirmToggleActive.is_active) === '1' || String(confirmToggleActive.is_active) === 'true' || confirmToggleActive.is_active === true) ? 'Jadikan Tidak Aktif' : 'Jadikan Aktif'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin mengubah status sub blok <strong>{confirmToggleActive?.name}</strong> menjadi {confirmToggleActive && (String(confirmToggleActive.is_active) === '1' || String(confirmToggleActive.is_active) === 'true' || confirmToggleActive.is_active === true) ? 'Tidak Aktif' : 'Aktif'}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updateMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (confirmToggleActive) {
                    const currentActive = String(confirmToggleActive.is_active) === '1' || String(confirmToggleActive.is_active) === 'true' || confirmToggleActive.is_active === true;
                    updateMutation.mutate({
                      id: confirmToggleActive.id,
                      data: {
                        warehouse_block_id: blockId,
                        name: confirmToggleActive.name,
                        description: confirmToggleActive.description || '',
                        is_active: !currentActive,
                        is_default: confirmToggleActive.is_default,
                      }
                    }, {
                      onSuccess: () => setConfirmToggleActive(null)
                    });
                  }
                }}
                disabled={updateMutation.isPending}
                className={confirmToggleActive && (String(confirmToggleActive.is_active) === '1' || String(confirmToggleActive.is_active) === 'true' || confirmToggleActive.is_active === true) ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
              >
                {updateMutation.isPending ? 'Menyimpan...' : 'Ubah Status'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </>
  );
}
