import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { AssetTable } from '@/components/features/master-data/asset/AssetTable';
import { AssetFormModal, AssetFormData } from '@/components/features/master-data/asset/AssetFormModal';
import { EditAssetModal } from '@/components/features/master-data/asset/EditAssetModal';
import { DeleteAssetModal } from '@/components/features/master-data/asset/DeleteAssetModal';
import { ImportAssetModal } from '@/components/features/master-data/asset/ImportAssetModal';
import { toast } from 'sonner';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, useImportAsset, useExportAsset } from '@/hooks/useAsset';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { Asset } from '@/@types/asset.types';
import { Download, Plus, Upload } from 'lucide-react';

export default function AssetPage() {
  const { companyId } = useCompany();
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

  const { data, isLoading, isFetching, isError } = useAssets(companyId, { page, perPage, search });

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const importMutation = useImportAsset();
  const exportMutation = useExportAsset();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    setSelectedAsset(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (asset: Asset) => {
    if (!canEdit) return;
    setSelectedAsset(asset);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (asset: Asset) => {
    if (!canDelete) return;
    setSelectedAsset(asset);
    setIsDeleteOpen(true);
  };

  const handleSaveForm = async (data: AssetFormData) => {
    try {
      if (selectedAsset) {
        // Edit
        await updateMutation.mutateAsync({ id: selectedAsset.id, data });
        toast.success('Data aset berhasil diubah');
      } else {
        // Add
        await createMutation.mutateAsync({ ...data, company_id: Number(companyId) });
        toast.success('Data aset berhasil ditambahkan');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedAsset) {
      try {
        await deleteMutation.mutateAsync(selectedAsset.id);
        toast.success('Data aset berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedAsset(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus data');
      }
    }
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    try {
      await importMutation.mutateAsync({ file, companyId: companyId ? Number(companyId) : undefined });
      toast.success('Import data aset berhasil');
      setIsImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Import data aset gagal');
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync(companyId ? Number(companyId) : undefined);
      toast.success('Berhasil export data aset');
    } catch (error: any) {
      toast.error(error.message || 'Gagal export data aset');
    }
  };

  const assetsList = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Data Aset"
          subtitle="Kelola data aset perusahaan dengan mudah"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari aset"
          page={page}
          perPage={perPage}
          total={data?.meta.total}
          lastPage={data?.meta.lastPage}
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
          {isError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-6 py-5 text-base text-red-600">
              Gagal memuat data aset.
            </div>
          ) : (
            <AssetTable
              assets={assetsList}
              isLoading={isLoading || isFetching}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </SearchPagination>
      </div>

      {/* Modals */}
      <AssetFormModal
        isOpen={isFormOpen && !selectedAsset}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveForm}
        companyId={Number(companyId)}
      />

      {selectedAsset && (
        <EditAssetModal
          isOpen={isFormOpen && !!selectedAsset}
          onClose={() => {
            setIsFormOpen(false);
            setTimeout(() => setSelectedAsset(null), 300);
          }}
          onSave={handleSaveForm}
          initialData={selectedAsset}
        />
      )}

      <DeleteAssetModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <ImportAssetModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
        isUploading={importMutation.isPending}
      />
    </DashboardLayout>
  );
}