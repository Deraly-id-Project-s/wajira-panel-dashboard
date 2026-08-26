import * as React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { DeleteVehicleDocumentDialog } from '@/components/features/vehicle-document/DeleteVehicleDocumentDialog';
import { VehicleDocumentDialog } from '@/components/features/vehicle-document/VehicleDocumentDialog';
import { VehicleDocumentTable } from '@/components/features/vehicle-document/VehicleDocumentTable';
import type { VehicleDocumentPayload, VehicleDocumentSummary } from '@/types/vehicle-document.types';
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

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<VehicleDocumentSummary | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

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

        <VehicleDocumentTable
          items={listQuery.data?.data ?? []}
          search={searchInput}
          isLoading={listQuery.isLoading}
          page={page}
          perPage={perPage}
          totalData={listQuery.data?.meta.total ?? 0}
          onSearchChange={setSearchInput}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
          onAdd={() => setCreateOpen(true)}
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
          onEdit={(item) => router.push(`/dashboard/${slug}/stnk-bpkb/${item.id}/edit`)}
          onDelete={setDeleteTarget}
          isExporting={exportMutation.isPending}
        />
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
