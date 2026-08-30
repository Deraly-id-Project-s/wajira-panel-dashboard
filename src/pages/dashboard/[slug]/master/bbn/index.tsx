import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { BBNTable } from '@/components/features/bbn/BBNTable';
import { DeleteBBNModal } from '@/components/features/bbn/DeleteBBNModal';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { toast } from 'sonner';
import { useBBNs, useDeleteBBN, useImportBBN, useExportBBN } from '@/hooks/useBBN';
import type { BBN } from '@/@types/bbn.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function BBNPage() {
  const router = useRouter();
  const slug = router.query.slug as string;

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Table state
  const [searchInput, setSearchInput] = useState('');  // immediate input value (for display)
  const [search, setSearch] = useState('');            // debounced value (sent to API)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Live search debounce — wait 400ms after user stops typing before firing API request
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
  const totalBBNs = bbnData?.meta?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Data Biaya"
          subtitle="Kelola data biaya dengan mudah"
        />

        {/* Content */}
        <BBNTable
          bbns={bbnList}
          search={searchInput}
          onSearchChange={(v) => setSearchInput(v)}
          isLoading={isLoading}
          page={page}
          perPage={perPage}
          totalData={totalBBNs}
          onPageChange={setPage}
          onPerPageChange={(v) => {
            setPerPage(v);
          }}
          onAdd={handleAddClick}
          onImport={canCreate ? () => setIsImportOpen(true) : undefined}
          onExport={handleExport}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          isExporting={exportMutation.isPending}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />

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
