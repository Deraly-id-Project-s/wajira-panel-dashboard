import React, { useEffect, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, CircleDashed, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchPagination } from '@/components/ui/search-pagination';
import { ArmadaTable } from '@/components/features/armada/ArmadaTable';
import { DeleteArmadaModal } from '@/components/features/armada/DeleteArmadaModal';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { useArmadas, useDeleteArmada, useImportArmada } from '@/hooks/useArmada';
import { useDoEkspedisis } from '@/hooks/useDoEkspedisi';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { Armada } from '@/@types/armada.types';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';

type RowMark = 'alert' | 'base' | 'success';
type DoStatusMeta = {
  label: string;
  mark: RowMark | null;
};

const getDoStatusMeta = (status?: string | null): DoStatusMeta => {
  switch (String(status ?? '').toLowerCase()) {
    case 'process':
      return { label: 'Proses', mark: 'alert' };
    case 'pending':
      return { label: 'Tertunda', mark: 'base' };
    case 'draft':
      return { label: 'Draft', mark: 'base' };
    case 'done':
      return { label: 'Selesai', mark: 'success' };
    case 'failed':
      return { label: 'Gagal', mark: 'alert' };
    default:
      return { label: 'Belum ada DO', mark: null };
  }
};

const getDoSortTime = (item: DoEkspedisi) => {
  const value = item.updatedAt || item.createdAt || item.date;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

export default function ArmadaPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedArmadaId, setSelectedArmadaId] = useState<string | number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const { data, isLoading } = useArmadas({ page, perPage, search });
  const { data: doEkspedisiData, isLoading: isLoadingDoEkspedisi } = useDoEkspedisis({
    page: 1,
    perPage: 1000,
    order_by: 'updated_at',
    order_sort: 'desc',
  });
  const deleteMutation = useDeleteArmada();
  const importMutation = useImportArmada();

  const handleAddClick = () => {
    if (!canCreate) return;
    if (slug) {
      router.push(`/dashboard/${slug}/master/armada/create`);
    }
  };

  const handleEditClick = (armada: { id: string | number }) => {
    if (!canEdit) return;
    if (slug) {
      router.push(`/dashboard/${slug}/master/armada/edit/${armada.id}`);
    }
  };

  const handleDeleteClick = (armada: { id: string | number }) => {
    if (!canDelete) return;
    setSelectedArmadaId(armada.id);
    setIsDeleteOpen(true);
  };

  const handleDetailClick = (armada: { id: string | number }) => {
    if (slug) {
      router.push(`/dashboard/${slug}/master/armada/${armada.id}`);
    }
  };


  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (!selectedArmadaId) return;

    try {
      await deleteMutation.mutateAsync(selectedArmadaId);
      toast.success('Data armada berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedArmadaId(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data armada');
    }
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    await importMutation.mutateAsync(file);
  };

  const armadas = data?.data ?? [];
  const totalData = data?.meta.total ?? 0;
  const totalPages = data?.meta.lastPage ?? 1;
  const latestDoByVehicleId = useMemo(() => {
    const result = new Map<string, DoEkspedisi>();

    (doEkspedisiData?.data ?? []).forEach((item) => {
      if (!item.vehicleId) return;

      const vehicleId = String(item.vehicleId);
      const existing = result.get(vehicleId);
      if (!existing || getDoSortTime(item) >= getDoSortTime(existing)) {
        result.set(vehicleId, item);
      }
    });

    return result;
  }, [doEkspedisiData?.data]);

  const getDoExpeditionRowMark = (armada: Armada) => {
    const latestDo = latestDoByVehicleId.get(String(armada.id));
    return getDoStatusMeta(latestDo?.status).mark;
  };

  const markSummary = armadas.reduce(
    (summary, armada) => {
      const latestDo = latestDoByVehicleId.get(String(armada.id));
      const status = String(latestDo?.status ?? '').toLowerCase();

      if (status === 'process') summary.process += 1;
      else if (status === 'pending') summary.pending += 1;
      else if (status === 'draft') summary.draft += 1;
      else if (status === 'done') summary.done += 1;
      else if (status === 'failed') summary.failed += 1;
      else summary.empty += 1;

      return summary;
    },
    { process: 0, pending: 0, draft: 0, done: 0, failed: 0, empty: 0 },
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Armada"
          subtitle="Kelola data armada dengan mudah"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari armada"
          page={page}
          perPage={perPage}
          total={totalData}
          lastPage={totalPages}
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
                  <Button onClick={() => setIsImportOpen(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleAddClick} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </>
              )}
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-slate-800">
                Penanda status DO Ekspedisi terbaru
                {isLoadingDoEkspedisi ? <span className="ml-2 font-normal text-slate-500">Memuat status...</span> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-[#DC2626]">
                  <CircleAlert className="h-3.5 w-3.5" />
                  Proses / Gagal ({markSummary.process + markSummary.failed})
                </Badge>
                <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-[#F59E0B]">
                  <CircleDashed className="h-3.5 w-3.5" />
                  Draft / Tertunda ({markSummary.draft + markSummary.pending})
                </Badge>
                <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-[#16A34A]">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Selesai ({markSummary.done})
                </Badge>
                <Badge variant="outline" className="gap-1 border-slate-200 bg-slate-50 text-slate-600">
                  Belum ada DO ({markSummary.empty})
                </Badge>
              </div>
            </div>

            <ArmadaTable
              armadas={armadas}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onDetail={handleDetailClick}
              canEdit={canEdit}
              canDelete={canDelete}
              getRowMark={getDoExpeditionRowMark}
            />
          </div>
        </SearchPagination>
      </div>

      <DeleteArmadaModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <DataImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Data Armada"
        description="Unggah file Excel untuk menambahkan data armada secara massal."
        onImport={handleImport}
        isPending={importMutation.isPending}
        templateUrl="https://docs.google.com/spreadsheets/d/1cdvmtF4S7LrDJoyWmNDR9dd-CQz2OPj7B7EAbUwQSU4/edit?usp=sharing"
      />
    </DashboardLayout>
  );
}
