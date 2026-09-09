import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { DocumentTemplateTable } from '@/components/features/document-template/DocumentTemplateTable';
import { useDeleteDocumentTemplate, useDocumentTemplates } from '@/hooks/useDocumentTemplate';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { DocumentTemplate } from '@/@types/document-template.types';

export default function DocumentTemplateListPage() {
  const router = useRouter();
  const slug = String(router.query.slug ?? '');
  const { hasPermission } = usePermissionGuard();
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
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari dokumen template"
          searchAriaLabel="Cari dokumen template"
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
              {canCreate && (
                <Button onClick={goCreate} className="bg-[#1e3a5f] hover:bg-[#152e4d]">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
              )}
            </>
          }
        >
          <DocumentTemplateTable
            data={data?.data ?? []}
            loading={isLoading || deleteMutation.isPending}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={goEdit}
            onDelete={remove}
          />
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}