import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { VehicleEquipmentTable } from '@/components/features/vehicle-equipment/VehicleEquipmentTable';
import { DeleteVehicleEquipmentModal } from '@/components/features/vehicle-equipment/DeleteVehicleEquipmentModal';
import { useVehicleEquipments, useDeleteVehicleEquipment } from '@/hooks/useVehicleEquipment';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function VehicleEquipmentPage() {
  const router = useRouter();
  const slug = router.query.slug as string;

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Table state
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

  // React query operations
  const { data: listData, isLoading, isError } = useVehicleEquipments({ page, perPage, search });
  const deleteMutation = useDeleteVehicleEquipment();

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VehicleEquipment | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    router.push(`/dashboard/${slug}/master/vehicle-equipment/create`);
  };

  const handleEditClick = (item: VehicleEquipment) => {
    if (!canEdit) return;
    router.push(`/dashboard/${slug}/master/vehicle-equipment/${item.id}/edit`);
  };

  const handleVersioningClick = (item: VehicleEquipment) => {
    router.push(`/dashboard/${slug}/master/vehicle-equipment/${item.id}`);
  };

  const handleDeleteClick = (item: VehicleEquipment) => {
    if (!canDelete) return;
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (selectedItem) {
      try {
        await deleteMutation.mutateAsync(selectedItem.id);
        toast.success('Data perlengkapan berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedItem(null);
      } catch (error: any) {
        toast.error(error?.message || 'Gagal menghapus data perlengkapan');
      }
    }
  };

  const equipmentsList = listData?.data || [];
  const totalEquipments = listData?.meta?.total ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <PageHeader
          title="Perlengkapan Kendaraan"
          subtitle="Kelola data perlengkapan kendaraan dengan mudah"
        />

        {/* Search, Actions & Table */}
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari perlengkapan"
          page={page}
          perPage={perPage}
          total={totalEquipments}
          lastPage={listData?.meta?.lastPage ?? 1}
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
                <Button onClick={handleAddClick} className="btn-primary-orange!">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              )}
            </>
          }
        >
          {isError ? (
            <Card className="rounded-md border border-red-100 bg-red-50/50 p-12 text-center shadow-none">
              <p className="text-sm font-semibold text-red-600">Gagal memuat data perlengkapan</p>
            </Card>
          ) : (
            <VehicleEquipmentTable
              equipments={equipmentsList}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onVersioning={handleVersioningClick}
              onDelete={handleDeleteClick}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </SearchPagination>
      </div>

      <DeleteVehicleEquipmentModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
