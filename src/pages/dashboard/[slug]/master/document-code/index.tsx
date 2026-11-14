import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DocumentCodeTable } from '@/components/features/document-code/DocumentCodeTable';
import { DocumentCodeFormDialog } from '@/components/features/document-code/DocumentCodeFormDialog';
import { useDocumentCodes, useUpdateDocumentCode } from '@/hooks/useDocumentCode';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { DocumentCode } from '@/@types/document-archive.types';

export default function DocumentCodeListPage() {
  const { hasPermission } = usePermissionGuard();
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 10 });
  const [searchInput, setSearchInput] = useState(search);
  const [editingItem, setEditingItem] = useState<DocumentCode | null>(null);

  const { data, isLoading } = useDocumentCodes({ page, perPage, search });
  const updateMutation = useUpdateDocumentCode();

  const canEdit = hasPermission(['document-code:edit', 'master-data:edit']) || hasPermission('master-data:edit');

  const handleEdit = (item: DocumentCode) => {
    setEditingItem(item);
  };

  const handleSave = async (payload: { code: string; description?: string }) => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({ id: editingItem.id, payload });
      toast.success('Kode dokumen berhasil diperbarui');
      setEditingItem(null);
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal memperbarui kode dokumen');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Master Data' },
            { label: 'Kode Dokumen' },
          ]}
          title="Referensi Kode Dokumen"
          subtitle="Atur prefix format penomoran otomatis untuk setiap tipe arsip dokumen"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={(val) => {
            setSearchInput(val);
            setSearch(val.trim());
          }}
          searchPlaceholder="Cari kode atau tipe dokumen..."
          searchAriaLabel="Cari kode atau tipe dokumen"
          page={page}
          perPage={perPage}
          total={data?.meta.total}
          lastPage={data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        >
          <DocumentCodeTable
            data={data?.data ?? []}
            loading={isLoading}
            canEdit={canEdit}
            onEdit={handleEdit}
          />
        </SearchPagination>

        <DocumentCodeFormDialog
          open={Boolean(editingItem)}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          documentCode={editingItem}
          onSubmit={handleSave}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
