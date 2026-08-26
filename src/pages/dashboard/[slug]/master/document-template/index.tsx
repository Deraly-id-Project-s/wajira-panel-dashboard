import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DocumentTemplateTable } from '@/components/features/document-template/DocumentTemplateTable';
import { useDeleteDocumentTemplate, useDocumentTemplates } from '@/hooks/useDocumentTemplate';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { DocumentTemplate } from '@/types/document-template.types';

export default function DocumentTemplateListPage() {
  const router = useRouter();
  const slug = String(router.query.slug ?? '');
  const { hasPermission } = usePermissionGuard();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const { data, isLoading } = useDocumentTemplates({ page, perPage, search });
  const deleteMutation = useDeleteDocumentTemplate();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const goCreate = () => { if (canCreate) void router.push(`/dashboard/${slug}/master/document-template/create`); };
  const goEdit = (item: DocumentTemplate) => { if (canEdit) void router.push(`/dashboard/${slug}/master/document-template/${item.id}/edit`); };
  const remove = async (item: DocumentTemplate) => {
    if (!canDelete || !window.confirm(`Hapus dokumen template ${item.name}?`)) return;
    try { await deleteMutation.mutateAsync(item.id); toast.success('Dokumen template berhasil dihapus'); } catch (error: any) { toast.error(error?.message ?? 'Gagal menghapus dokumen template'); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Master Data' },
            { label: 'Dokumen Template' }
          ]}
          title="Dokumen Template"
          subtitle="Kelola template dokumen untuk kebutuhan transaksi"
        />
        <DocumentTemplateTable
          data={data?.data ?? []}
          loading={isLoading || deleteMutation.isPending}
          search={search}
          page={page}
          perPage={perPage}
          total={data?.meta.total ?? 0}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
          onCreate={goCreate}
          onEdit={goEdit}
          onDelete={remove}
        />
      </div>
    </DashboardLayout>
  );
}
