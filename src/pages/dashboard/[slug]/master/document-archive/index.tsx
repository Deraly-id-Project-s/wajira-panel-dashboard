import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentArchiveTable } from '@/components/features/document-archive/DocumentArchiveTable';
import { DocumentArchiveFormDialog } from '@/components/features/document-archive/DocumentArchiveFormDialog';
import { DocumentArchiveDetailDialog } from '@/components/features/document-archive/DocumentArchiveDetailDialog';
import { DocumentArchiveUpdateFileDialog } from '@/components/features/document-archive/DocumentArchiveUpdateFileDialog';
import {
  useCreateDocumentArchive,
  useDeleteDocumentArchive,
  useDocumentArchives,
  useUpdateArchiveFile,
  useUpdateDocumentArchive,
} from '@/hooks/useDocumentArchive';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type {
  CreateDocumentArchivePayload,
  DocumentArchive,
  DocumentArchiveType,
  UpdateDocumentArchivePayload,
} from '@/@types/document-archive.types';
import { DOCUMENT_ARCHIVE_TYPE_OPTIONS } from '@/@types/document-archive.types';

export default function DocumentArchiveListPage() {
  const { hasPermission } = usePermissionGuard();
  const { page, perPage, search, getParam, setPage, setPerPage, setSearch, updateQuery } =
    useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);

  // Filters from query params
  const typeFilter = getParam('type', 'all');
  const formatFilter = getParam('format', 'all');

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DocumentArchive | null>(null);
  const [detailItem, setDetailItem] = useState<DocumentArchive | null>(null);
  const [updateFileItem, setUpdateFileItem] = useState<DocumentArchive | null>(null);

  // API mutations & queries
  const { data, isLoading } = useDocumentArchives({
    page,
    perPage,
    search,
    type: typeFilter !== 'all' ? (typeFilter as DocumentArchiveType) : undefined,
    format: formatFilter !== 'all' ? formatFilter : undefined,
  });

  const createMutation = useCreateDocumentArchive();
  const updateMutation = useUpdateDocumentArchive();
  const updateFileMutation = useUpdateArchiveFile();
  const deleteMutation = useDeleteDocumentArchive();

  const canCreate = hasPermission(['document-archive:create', 'master-data:create']) || hasPermission('master-data:create');
  const canEdit = hasPermission(['document-archive:edit', 'master-data:edit']) || hasPermission('master-data:edit');
  const canDelete = hasPermission(['document-archive:delete', 'master-data:delete']) || hasPermission('master-data:delete');

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: DocumentArchive) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    payload: CreateDocumentArchivePayload | UpdateDocumentArchivePayload
  ) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          payload: payload as UpdateDocumentArchivePayload,
        });
        toast.success('Arsip dokumen berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(payload as CreateDocumentArchivePayload);
        toast.success('Arsip dokumen berhasil ditambahkan');
      }
      setFormOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal menyimpan arsip dokumen');
    }
  };

  const handleUpdateFileSubmit = async (file: File) => {
    if (!updateFileItem) return;
    try {
      await updateFileMutation.mutateAsync({ id: updateFileItem.id, file });
      toast.success('Berkas dokumen berhasil diperbarui');
      setUpdateFileItem(null);
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal mengganti berkas dokumen');
    }
  };

  const handleDelete = async (item: DocumentArchive) => {
    if (!canDelete || !window.confirm(`Hapus arsip dokumen ${item.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success('Arsip dokumen berhasil dihapus');
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal menghapus arsip dokumen');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Master Data' },
            { label: 'Arsip Dokumen' },
          ]}
          title="Arsip Dokumen"
          subtitle="Penyimpanan terpusat dokumen, laporan, dan berkas transaksi beserta kontrol revisi"
          actions={
            canCreate && (
              <Button onClick={handleOpenCreate} className="bg-[#1e3a5f] hover:bg-[#152e4d]">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Arsip
              </Button>
            )
          }
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={(val) => {
            setSearchInput(val);
            setSearch(val.trim());
          }}
          searchPlaceholder="Cari nama, kode, atau catatan arsip..."
          searchAriaLabel="Cari arsip dokumen"
          filters={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={typeFilter}
                onValueChange={(val) => updateQuery({ type: val === 'all' ? undefined : val, page: 1 })}
              >
                <SelectTrigger className="w-full sm:w-[170px] bg-white">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {DOCUMENT_ARCHIVE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={formatFilter}
                onValueChange={(val) => updateQuery({ format: val === 'all' ? undefined : val, page: 1 })}
              >
                <SelectTrigger className="w-full sm:w-[140px] bg-white">
                  <SelectValue placeholder="Semua Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Format</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          page={page}
          perPage={perPage}
          total={data?.meta.total}
          lastPage={data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        >
          <DocumentArchiveTable
            data={data?.data ?? []}
            loading={isLoading || deleteMutation.isPending}
            canEdit={canEdit}
            canDelete={canDelete}
            onDetail={(item) => setDetailItem(item)}
            onEdit={handleOpenEdit}
            onUpdateFile={(item) => setUpdateFileItem(item)}
            onDelete={handleDelete}
          />
        </SearchPagination>

        {/* Modal Form Tambah / Edit */}
        <DocumentArchiveFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingItem(null);
          }}
          documentArchive={editingItem}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        {/* Modal Detail & Revisi */}
        <DocumentArchiveDetailDialog
          open={Boolean(detailItem)}
          onOpenChange={(open) => {
            if (!open) setDetailItem(null);
          }}
          documentArchive={detailItem}
          onSelectRevision={(item) => setDetailItem(item)}
        />

        {/* Modal Ganti Berkas */}
        <DocumentArchiveUpdateFileDialog
          open={Boolean(updateFileItem)}
          onOpenChange={(open) => {
            if (!open) setUpdateFileItem(null);
          }}
          documentArchive={updateFileItem}
          onSubmit={handleUpdateFileSubmit}
          isSubmitting={updateFileMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
