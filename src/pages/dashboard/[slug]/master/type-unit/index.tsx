import { useEffect, useMemo, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTypeUnits, useDeleteTypeUnit, useImportTypeUnit } from '@/hooks/useTypeUnit';
import { TypeUnitTable } from '@/components/features/type-unit/TypeUnitTable';
import { DeleteTypeUnitDialog } from '@/components/features/type-unit/DeleteTypeUnitDialog';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import type { TypeUnit } from '@/@types/type-unit.types';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LoadingState } from '@/components/ui/loading-state';

export default function TypeUnitPage() {
  const router = useRouter();
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

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const { data, isLoading, isError, refetch } = useTypeUnits();
  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    const result = data?.data || [];

    return result.filter((item) => [item.code, item.name, item.unitType, item.unitModel, item.brand?.name].filter(Boolean).some((value) => value!.toString().toLowerCase().includes(term)));
  }, [data?.data, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredData.slice(start, end);
  }, [filteredData, page, perPage]);

  const manualMeta = useMemo(
    () => ({
      currentPage: page,
      perPage,
      total: filteredData.length,
      lastPage: Math.max(1, Math.ceil(filteredData.length / perPage)),
    }),
    [filteredData.length, page, perPage],
  );

  useEffect(() => {
    if (page > manualMeta.lastPage) {
      setPage(manualMeta.lastPage);
    }
  }, [page, manualMeta.lastPage, setPage]);
  const { companyId } = useCompany();
  const deleteTypeUnit = useDeleteTypeUnit();
  const importMutation = useImportTypeUnit(companyId ?? undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [typeUnitToDelete, setTypeUnitToDelete] = useState<TypeUnit | null>(null);

  const handleCreateClick = () => {
    if (!canCreate) return;
    const slug = router.query.slug as string;
    router.push(`/dashboard/${slug}/master/type-unit/create`);
  };

  const handleEditClick = (typeUnit: TypeUnit) => {
    if (!canEdit) return;
    const slug = router.query.slug as string;
    router.push(`/dashboard/${slug}/master/type-unit/${typeUnit.id}/edit`);
  };

  const handleDeleteClick = (typeUnit: TypeUnit) => {
    if (!canDelete) return;
    setTypeUnitToDelete(typeUnit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeUnitToDelete) return;

    try {
      await deleteTypeUnit.mutateAsync(typeUnitToDelete.id);
      setDeleteDialogOpen(false);
      setTypeUnitToDelete(null);
      toast.success('Data berhasil dihapus');
      refetch();
    } catch (error) {
      toast.error('Gagal menghapus data tipe unit');
    }
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    await importMutation.mutateAsync({ file });
    refetch();
  };


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Tipe Unit"
            subtitle="Kelola semua tipe unit"
          />
          <Card className="rounded-md p-6">
            <LoadingState variant="page" />
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Tipe Unit"
            subtitle="Kelola semua tipe unit"
          />
          <Card className="rounded-md p-6">
            <div className="text-center text-destructive">Gagal memuat data</div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <PageHeader
          title="Tipe Unit"
          subtitle="Kelola semua tipe unit"
        />

        {/* SEARCH & TABLE */}
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari tipe unit"
          page={page}
          perPage={perPage}
          total={manualMeta.total}
          lastPage={manualMeta.lastPage}
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
                <>
                  <Button onClick={() => setOpenImport(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleCreateClick} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </>
              )}
            </>
          }
        >
          <TypeUnitTable
            typeUnits={paginatedData}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </SearchPagination>
      </div>

      <DeleteTypeUnitDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} isDeleting={deleteTypeUnit.isPending} />
      <DataImportModal
        open={openImport}
        onOpenChange={setOpenImport}
        title="Import Data Tipe Unit"
        description="Unggah file .xlsx untuk mengimport data tipe unit."
        onImport={handleImport}
        isPending={importMutation.isPending}
        templateUrl="https://docs.google.com/spreadsheets/d/1iR1WZMEO_G8x91noO9q4T8hUMzIAD8U18qrmPmode2I/edit?usp=sharing"
      />
    </DashboardLayout>
  );
}
