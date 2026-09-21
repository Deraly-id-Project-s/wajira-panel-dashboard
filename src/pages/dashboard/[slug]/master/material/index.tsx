import { useEffect, useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { MaterialTable } from '@/components/features/material/MaterialTable';
import { MaterialFormModal, MaterialFormData } from '@/components/features/material/MaterialFormModal';
import { EditMaterialModal } from '@/components/features/material/EditMaterialModal';
import { DeleteMaterialModal } from '@/components/features/material/DeleteMaterialModal';
import { ImportMaterialModal } from '@/components/features/material/ImportMaterialModal';
import { toast } from 'sonner';
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, useImportMaterial, useExportMaterial } from '@/hooks/useMaterial';
import type { Material } from '@/@types/material.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';

export default function MaterialPage() {
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

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

  const { data: materialsData } = useMaterials({ page, perPage, search });
  
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();
  const importMutation = useImportMaterial();
  const exportMutation = useExportMaterial();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (material: Material) => {
    if (!canEdit) return;
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (material: Material) => {
    if (!canDelete) return;
    setSelectedMaterial(material);
    setIsDeleteOpen(true);
  };

  const handleSaveForm = async (data: MaterialFormData) => {
    if (selectedMaterial && !canEdit) return;
    if (!selectedMaterial && !canCreate) return;
    try {
      if (selectedMaterial) {
        // Edit
        await updateMutation.mutateAsync({ id: selectedMaterial.id, data });
        toast.success('Data material berhasil diubah');
      } else {
        // Add
        await createMutation.mutateAsync(data);
        toast.success('Data material berhasil ditambahkan');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (selectedMaterial) {
      try {
        await deleteMutation.mutateAsync(selectedMaterial.id);
        toast.success('Data material berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedMaterial(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus data');
      }
    }
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    try {
      await importMutation.mutateAsync({ file });
      toast.success('Import data material berhasil');
      setIsImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Import data material gagal');
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast.success('Berhasil export data material');
    } catch (error: any) {
      toast.error(error.message || 'Gagal export data material');
    }
  };

  const materialsList = (materialsData as any)?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Data Material"
          subtitle="Kelola data material dengan mudah"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari material"
          page={page}
          perPage={perPage}
          total={(materialsData as any)?.meta?.total || (materialsData as any)?.total || 0}
          lastPage={(materialsData as any)?.meta?.lastPage || 1}
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
          <MaterialTable
            materials={materialsList}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>

      </div>

      {/* Modals */}
      <MaterialFormModal 
        isOpen={isFormOpen && !selectedMaterial} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveForm} 
      />

      {selectedMaterial && (
          <EditMaterialModal 
            isOpen={isFormOpen && !!selectedMaterial} 
            onClose={() => {
                setIsFormOpen(false);
                setTimeout(() => setSelectedMaterial(null), 300);
            }} 
            onSave={handleSaveForm}
            initialData={selectedMaterial}
          />
      )}

      <DeleteMaterialModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={handleConfirmDelete} 
        isDeleting={deleteMutation.isPending}
      />

      <ImportMaterialModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
        isUploading={importMutation.isPending}
      />
    </DashboardLayout>
  );
}
