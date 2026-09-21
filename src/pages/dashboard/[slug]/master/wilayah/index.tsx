import React, { useEffect, useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { RegionTable } from '@/components/features/region/RegionTable';
import { RegionFormModal, RegionFormData } from '@/components/features/region/RegionFormModal';
import { EditRegionModal } from '@/components/features/region/EditRegionModal';
import { DeleteRegionModal } from '@/components/features/region/DeleteRegionModal';
import { ImportRegionModal } from '@/components/features/region/ImportRegionModal';
import { toast } from 'sonner';
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion, useExportRegion } from '@/hooks/useRegion';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { Region } from '@/@types/region.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function RegionPage() {
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Table state
  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

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
  const lastPageRegions = (regionsData as any)?.meta?.lastPage || (regionsData as any)?.last_page || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Data Wilayah"
          subtitle="Kelola data wilayah dengan mudah"
        />

        {/* Search, Actions & Table */}
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari wilayah"
          page={page}
          perPage={perPage}
          total={totalRegions}
          lastPage={lastPageRegions}
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
                    Tambah Data
                  </Button>
                </>
              )}
            </>
          }
        >
          <RegionTable
            regions={regionsList}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>

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
