import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { LoadingState } from '@/components/ui/loading-state';
import { useVehicleEquipmentDetail } from '@/hooks/useVehicleEquipment';
import {
  useCreateVehicleEquipmentPriceVersion,
  useDeleteVehicleEquipmentPriceVersion,
  useVehicleEquipmentPriceVersions,
  useUpdateVehicleEquipmentPriceVersion,
} from '@/hooks/useVehicleEquipmentPriceVersion';
import { VehicleEquipmentPriceVersionTable } from '@/components/features/vehicle-equipment/VehicleEquipmentPriceVersionTable';
import { VehicleEquipmentPriceVersionForm } from '@/components/features/vehicle-equipment/VehicleEquipmentPriceVersionForm';
import type {
  VehicleEquipmentPriceVersion,
  VehicleEquipmentPriceVersionFormValues,
} from '@/@types/vehicle-equipment-price-version.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { toast } from 'sonner';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function VehicleEquipmentDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const equipmentId = typeof id === 'string' ? id : '';

  const { data: equipment, isLoading, isError } = useVehicleEquipmentDetail(equipmentId);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<VehicleEquipmentPriceVersion | undefined>();

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const versions = useVehicleEquipmentPriceVersions(equipmentId, {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const createMutation = useCreateVehicleEquipmentPriceVersion();
  const updateMutation = useUpdateVehicleEquipmentPriceVersion();
  const deleteMutation = useDeleteVehicleEquipmentPriceVersion(equipmentId);

  const handleSubmit = (values: VehicleEquipmentPriceVersionFormValues) => {
    const payload = { ...values, vehicle_equipment_id: Number(equipmentId) };
    const options = {
      onSuccess: () => {
        toast.success(selected ? 'Versi harga berhasil diubah' : 'Versi harga berhasil ditambahkan');
        setFormOpen(false);
      },
      onError: (error: any) =>
        toast.error(error?.response?.data?.message || error?.message || 'Gagal menyimpan versi harga'),
    };
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  };

  const handleDelete = (version: VehicleEquipmentPriceVersion) => {
    if (!window.confirm(`Hapus versi harga "${version.name}"?`)) return;
    deleteMutation.mutate(version.id, {
      onSuccess: () => toast.success('Versi harga berhasil dihapus'),
      onError: (error: any) =>
        toast.error(error?.response?.data?.message || error?.message || 'Gagal menghapus versi harga'),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (isError || !equipment) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-red-500">Data perlengkapan tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Versi Harga Perlengkapan"
          subtitle={`${equipment.name} (${equipment.code})${equipment.description ? ` - ${equipment.description}` : ''}`}
          breadcrumbs={[
            { label: 'Perlengkapan Kendaraan', onClick: () => router.push(`/dashboard/${slug}/master/vehicle-equipment`) },
            { label: 'Versi Harga' },
          ]}
          onBack={() => router.push(`/dashboard/${slug}/master/vehicle-equipment`)}
        />

        {/* Current Info Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-md border bg-white p-4">
            <p className="text-xs text-slate-500">Harga Beli Saat Ini</p>
            <p className="mt-2 text-lg font-semibold">{currenciesFormat('idr', equipment.buy_price ?? equipment.buyPrice ?? 0)}</p>
          </div>
          <div className="rounded-md border bg-white p-4">
            <p className="text-xs text-slate-500">Harga Jual Saat Ini</p>
            <p className="mt-2 text-lg font-semibold">{currenciesFormat('idr', equipment.sell_price ?? equipment.sellPrice ?? 0)}</p>
          </div>
          <div className="rounded-md border bg-white p-4">
            <p className="text-xs text-slate-500">Stok Tersedia</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {(equipment.available_stock ?? equipment.availableStock ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Price Versions Table */}
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Riwayat Versi Harga</h2>
            <p className="text-sm text-slate-500">Kelola riwayat versi harga beli dan harga jual perlengkapan.</p>
          </div>

          <SearchPagination
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari versi harga..."
            searchAriaLabel="Cari versi harga"
            page={page}
            perPage={perPage}
            total={versions.data?.total ?? 0}
            lastPage={versions.data?.last_page ?? 1}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            actions={
              canCreate && (
                <Button
                  onClick={() => {
                    setSelected(undefined);
                    setFormOpen(true);
                  }}
                  className="btn-primary!"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Versi
                </Button>
              )
            }
          >
            <VehicleEquipmentPriceVersionTable
              data={versions.data?.data || []}
              isLoading={versions.isLoading}
              onEdit={(version) => {
                setSelected(version);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </SearchPagination>
        </div>
      </div>

      <VehicleEquipmentPriceVersionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selected}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
