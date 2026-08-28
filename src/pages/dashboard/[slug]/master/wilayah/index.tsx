import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { RegionTable } from '@/components/features/region/RegionTable';
import { RegionFormModal, RegionFormData } from '@/components/features/region/RegionFormModal';
import { EditRegionModal } from '@/components/features/region/EditRegionModal';
import { DeleteRegionModal } from '@/components/features/region/DeleteRegionModal';
import { ImportRegionModal } from '@/components/features/region/ImportRegionModal';
import { toast } from 'sonner';
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion, useExportRegion } from '@/hooks/useRegion';
import type { Region } from '@/@types/region.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function RegionPage() {
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Table state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data: regionsData } = useRegions({ page, perPage, search });
  
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const deleteMutation = useDeleteRegion();
  const exportMutation = useExportRegion();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    setSelectedRegion(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (region: Region) => {
    if (!canEdit) return;
    setSelectedRegion(region);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (region: Region) => {
    if (!canDelete) return;
    setSelectedRegion(region);
    setIsDeleteOpen(true);
  };

  const handleSaveForm = async (data: RegionFormData) => {
    if (selectedRegion && !canEdit) return;
    if (!selectedRegion && !canCreate) return;
    try {
      if (selectedRegion) {
        // Edit
        await updateMutation.mutateAsync({ id: selectedRegion.id, data });
        toast.success('Data wilayah berhasil diubah');
      } else {
        // Add
        await createMutation.mutateAsync(data);
        toast.success('Data wilayah berhasil ditambahkan');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (selectedRegion) {
      try {
        await deleteMutation.mutateAsync(selectedRegion.id);
        toast.success('Data wilayah berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedRegion(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus data');
      }
    }
  };



  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast.success('Berhasil export data wilayah');
    } catch (error: any) {
      toast.error(error.message || 'Gagal export data wilayah');
    }
  };

  const regionsList = (regionsData as any)?.data || [];
  const totalRegions = (regionsData as any)?.meta?.total || (regionsData as any)?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Data Wilayah"
          subtitle="Kelola data wilayah dengan mudah"
        />

        {/* Content */}
        <RegionTable
          regions={regionsList}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          page={page}
          perPage={perPage}
          totalData={totalRegions}
          onPageChange={setPage}
          onPerPageChange={(v) => {
            setPerPage(v);
          }}
          onAdd={handleAddClick}
          onImport={canCreate ? () => setIsImportOpen(true) : undefined}
          onExport={handleExport}
          isExporting={exportMutation.isPending}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />

      </div>

      {/* Modals */}
      <RegionFormModal 
        isOpen={isFormOpen && !selectedRegion} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveForm} 
      />

      {selectedRegion && (
          <EditRegionModal 
            isOpen={isFormOpen && !!selectedRegion} 
            onClose={() => {
                setIsFormOpen(false);
                setTimeout(() => setSelectedRegion(null), 300);
            }} 
            onSave={handleSaveForm}
            initialData={selectedRegion}
          />
      )}

      <DeleteRegionModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={handleConfirmDelete} 
        isDeleting={deleteMutation.isPending}
      />

      <ImportRegionModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </DashboardLayout>
  );
}
