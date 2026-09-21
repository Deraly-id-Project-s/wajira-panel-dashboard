import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { BBNTable } from '@/components/features/bbn/BBNTable';
import { DeleteBBNModal } from '@/components/features/bbn/DeleteBBNModal';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Download, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useBBNs, useDeleteBBN, useImportBBN, useExportBBN } from '@/hooks/useBBN';
import type { BBN } from '@/@types/bbn.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

export default function BBNPage() {
  const router = useRouter();
  const slug = router.query.slug as string;

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = useState(search);

  // Live search debounce — wait 400ms after user stops typing before firing API request
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const { data: bbnData, isLoading } = useBBNs({ page, perPage, search });
  
  const deleteMutation = useDeleteBBN();
  const importMutation = useImportBBN();
  const exportMutation = useExportBBN();

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedBBN, setSelectedBBN] = useState<BBN | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    router.push(`/dashboard/${slug}/master/bbn/create`);
  };

  const handleEditClick = (bbn: BBN) => {
    if (!canEdit) return;
    router.push(`/dashboard/${slug}/master/bbn/${bbn.id}/edit`);
  };

  const handleDeleteClick = (bbn: BBN) => {
    if (!canDelete) return;
    setSelectedBBN(bbn);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (selectedBBN) {
      try {
        await deleteMutation.mutateAsync(selectedBBN.id);
        toast.success('Data biaya berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedBBN(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus data');
      }
    }
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    try {
      await importMutation.mutateAsync(file);
      toast.success('Data biaya berhasil diimport');
    } catch (error: any) {
      toast.error(error.message || 'Gagal import data');
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast.success('Data biaya berhasil diexport');
    } catch (error: any) {
      toast.error(error.message || 'Gagal export data');
    }
  };

  const bbnList = bbnData?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Data Biaya"
          subtitle="Kelola data biaya dengan mudah"
        />

        {/* Content */}
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari biaya BBN"
          page={page}
          perPage={perPage}
          total={bbnData?.meta?.total}
          lastPage={bbnData?.meta?.lastPage}
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
              <Button onClick={handleExport} disabled={exportMutation.isPending} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isPending ? 'Exporting...' : 'Export'}
              </Button>
              {canCreate && (
                <>
                  <Button onClick={() => setIsImportOpen(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleAddClick} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </>
              )}
            </>
          }
        >
          <BBNTable
            bbns={bbnList}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>


      </div>

      <DeleteBBNModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={handleConfirmDelete} 
        isDeleting={deleteMutation.isPending}
      />

      <DataImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Data BBN"
        description="Unggah file Excel untuk menambahkan data BBN secara massal."
        onImport={handleImport}
        isPending={importMutation.isPending}
      />
    </DashboardLayout>
  );
}
