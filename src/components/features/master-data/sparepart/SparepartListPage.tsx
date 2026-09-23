'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Plus, Upload } from 'lucide-react';
import { SparepartTable } from './SparepartTable';
import { SparepartFormDialog } from '@/components/features/sparepart/SparepartFormDialog';
import { DeleteSparepartDialog } from '@/components/features/sparepart/DeleteSparepartDialog';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useSpareparts, useImportSparepart } from '@/hooks/useSparepart';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { Sparepart } from '@/@types/sparepart.types';

export const SparepartListPage = () => {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId, isLoading: isLoadingCompany } = useCompany();
  const safeCompanyId = companyId || '1';

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({
    defaultPerPage: 25,
  });
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const { data, isLoading, isError, isFetching, refetch } = useSpareparts({
    page,
    perPage,
    search,
    company_id: safeCompanyId,
    enabled: !isLoadingCompany && !!companyId,
  });

  const importMutation = useImportSparepart(safeCompanyId);

  const [selected, setSelected] = useState<Sparepart | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const handleCreateClick = () => {
    if (!canCreate) return;
    const basePath = slug ? `/dashboard/${slug}/master/sparepart` : '/master-data/sparepart';
    void router.push(`${basePath}/create`);
  };

  const handleEdit = (item: Sparepart) => {
    if (!canEdit) return;
    setSelected(item);
    setOpenForm(true);
  };

  const handleDelete = (item: Sparepart) => {
    if (!canDelete) return;
    setSelected(item);
    setOpenDelete(true);
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    await importMutation.mutateAsync({ file });
    await refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Sparepart"
          subtitle="Kelola semua sparepart"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari sparepart"
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
                >
                  Reset
                </Button>
              )}
              {canCreate && (
                <>
                  <Button onClick={() => setOpenImport(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="default" onClick={handleCreateClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </>
              )}
            </>
          }
        >
          {isError ? (
            <div className="py-10 text-center text-red-600">Gagal memuat data sparepart</div>
          ) : (
            <SparepartTable
              data={data?.data ?? []}
              isLoading={isLoading || isFetching}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </SearchPagination>
      </div>

      <SparepartFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        sparepart={selected}
        companyId={safeCompanyId}
      />

      <DeleteSparepartDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        sparepart={selected}
        companyId={safeCompanyId}
      />

      <DataImportModal
        open={openImport}
        onOpenChange={setOpenImport}
        title="Import Data Sparepart"
        description="Unggah file .xlsx untuk mengimport data sparepart."
        onImport={handleImport}
        isPending={importMutation.isPending}
        templateUrl="https://docs.google.com/spreadsheets/d/16yxx_9Yxx9eHMx85b42dwqr7BQ8okess45wGkd-TUig/edit?usp=sharing"
      />
    </DashboardLayout>
  );
};
