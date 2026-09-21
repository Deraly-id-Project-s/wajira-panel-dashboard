import * as React from 'react';
import { useRouter } from 'next/router';
import { Download, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DeleteVehicleDocumentDialog } from '@/components/features/vehicle-document/DeleteVehicleDocumentDialog';
import { VehicleDocumentDialog } from '@/components/features/vehicle-document/VehicleDocumentDialog';
import { VehicleDocumentTable } from '@/components/features/vehicle-document/VehicleDocumentTable';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { VehicleDocumentPayload, VehicleDocumentSummary } from '@/@types/vehicle-document.types';
import {
  useCreateVehicleDocument,
  useDeleteVehicleDocument,
  useExportVehicleDocument,
  useImportVehicleDocument,
  useVehicleDocuments,
} from '@/hooks/useVehicleDocument';

export default function VehicleDocumentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = React.useState(search);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<VehicleDocumentSummary | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const listQuery = useVehicleDocuments({ page, perPage, search });
  const createMutation = useCreateVehicleDocument();
  const deleteMutation = useDeleteVehicleDocument();
  const importMutation = useImportVehicleDocument();
  const exportMutation = useExportVehicleDocument();

  const handleCreate = async (payload: VehicleDocumentPayload) => {
    try {
      const created = await createMutation.mutateAsync(payload);
      toast.success('Data penerimaan berhasil ditambahkan');
      setCreateOpen(false);
      router.push(`/dashboard/${slug}/stnk-bpkb/${created.id}/edit`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan data penerimaan');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Data penerimaan berhasil dihapus');
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data penerimaan');
    }
  };

  const handleImport = async (file: File) => {
    try {
      await importMutation.mutateAsync(file);
      toast.success('Import data penerimaan berhasil');
    } catch (error: any) {
      toast.error(error.message || 'Import data penerimaan gagal');
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast.success('Export data penerimaan berhasil');
    } catch (error: any) {
      toast.error(error.message || 'Export data penerimaan gagal');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Data Penerimaan</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola data penerimaan BPKP/STNK dengan mudah</p>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari penerimaan"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total ?? 0}
          lastPage={listQuery.data?.meta.lastPage ?? 1}
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
              <Button onClick={() => setImportOpen(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setCreateOpen(true)} className="btn-primary!">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </>
          }
        >
          <VehicleDocumentTable
            items={listQuery.data?.data ?? []}
            isLoading={listQuery.isLoading}
            onEdit={(item) => router.push(`/dashboard/${slug}/stnk-bpkb/${item.id}/edit`)}
            onDelete={setDeleteTarget}
          />
        </SearchPagination>
      </div>

      <VehicleDocumentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        title="Tambah Data Penerimaan"
        descriptionText="Tambahkan data penerimaan baru untuk BPKB/STNK."
      />

      <DeleteVehicleDocumentDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        code={deleteTarget?.code}
      />

      <DataImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Data Penerimaan"
        description="Unggah file Excel untuk data penerimaan STNK/BPKB."
        onImport={handleImport}
        isPending={importMutation.isPending}
      />
    </DashboardLayout>
  );
}
