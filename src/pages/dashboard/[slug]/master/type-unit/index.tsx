import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTypeUnits, useDeleteTypeUnit, useImportTypeUnit } from '@/hooks/useTypeUnit';
import { TypeUnitTable } from '@/components/features/type-unit/TypeUnitTable';
import { DeleteTypeUnitDialog } from '@/components/features/type-unit/DeleteTypeUnitDialog';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import type { TypeUnit } from '@/types/type-unit.types';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LoadingState } from '@/components/ui/loading-state';

export default function TypeUnitPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

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

        {/* TABLE CARD */}
        <div className="">
          <TypeUnitTable
            typeUnits={paginatedData}
            meta={manualMeta}
            search={search}
            page={page}
            perPage={perPage}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onAdd={canCreate ? handleCreateClick : undefined}
            onImport={canCreate ? () => setOpenImport(true) : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
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
