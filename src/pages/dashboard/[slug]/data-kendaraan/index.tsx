import React, { useEffect, useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArmadaTable } from '@/components/features/armada/ArmadaTable';
import { DeleteArmadaModal } from '@/components/features/armada/DeleteArmadaModal';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { Button } from '@/components/ui/button';
import { SearchPagination } from '@/components/ui/search-pagination';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { useArmadas, useDeleteArmada, useImportArmada } from '@/hooks/useArmada';
import type { Armada } from '@/@types/armada.types';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { VehicleDataTable } from '@/components/features/vehicle-data/VehicleDataTable';
import { DeleteVehicleDataDialog } from '@/components/features/vehicle-data/DeleteVehicleDataDialog';
import {
  useVehicleDataList,
  useDeleteVehicleData,
  useImportVehicleData,
  useExportVehicleData,
  useVendorLookup,
  useAssignVehicleData,
} from '@/hooks/useVehicleData';
import type { VehicleData } from '@/@types/vehicle-data.types';

export default function VehicleFleetPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();

  const { page, perPage, search, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedArmadaId, setSelectedArmadaId] = useState<string | number | null>(null);

  // Vehicle data states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [assignVendorId, setAssignVendorId] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [assignProcessDate, setAssignProcessDate] = useState<Date>();

  const [isDeleteVehicleOpen, setIsDeleteVehicleOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const formatDateValue = (date?: Date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  // Standard Armada Hooks
  const { data: armadaData, isLoading: isArmadaLoading } = useArmadas({ page, perPage, search, enabled: companyId !== '3' });
  const deleteMutation = useDeleteArmada();
  const importMutation = useImportArmada();

  // Vehicle Data Hooks (enabled only when companyId is '3')
  const vendorLookup = useVendorLookup(vendorSearch);
  const vendorOptions = React.useMemo(() => {
    return (vendorLookup.data ?? []).map((item) => ({
      value: String(item.id),
      label: item.label,
      subtitle: item.vendor.phone || item.vendor.code || undefined,
    }));
  }, [vendorLookup.data]);

  const vehicleParams = {
    page,
    perPage,
    search,
  };
  const { data: vehicleDataResponse, isLoading: isVehicleLoading } = useVehicleDataList(vehicleParams, { enabled: companyId === '3' });

  const deleteVehicleMutation = useDeleteVehicleData();
  const importVehicleMutation = useImportVehicleData();
  const exportVehicleMutation = useExportVehicleData();
  const assignMutation = useAssignVehicleData();

  const assignedIds = React.useMemo(() => {
    return (vehicleDataResponse?.data ?? [])
      .filter((item) => !!item.vehicleRegistration || (item.ditlantasProcess && item.ditlantasProcess.length > 0))
      .map((item) => item.id);
  }, [vehicleDataResponse?.data]);

  const handleAddClick = () => {
    if (slug) {
      router.push(`/dashboard/${slug}/data-kendaraan/create`);
    }
  };

  const handleEditClick = (armada: Armada) => {
    if (slug) {
      router.push(`/dashboard/${slug}/data-kendaraan/${armada.id}/edit`);
    }
  };

  const handleDetailClick = (armada: Armada) => {
    if (slug) {
      router.push(`/dashboard/${slug}/data-kendaraan/${armada.id}`);
    }
  };

  const handleDeleteClick = (armada: Armada) => {
    setSelectedArmadaId(armada.id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedArmadaId) return;

    try {
      await deleteMutation.mutateAsync(selectedArmadaId);
      toast.success('Data kendaraan berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedArmadaId(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data kendaraan');
    }
  };

  const handleImport = async (file: File) => {
    try {
      await importMutation.mutateAsync(file);
      toast.success('Import data kendaraan berhasil');
      setIsImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengimport data kendaraan');
      throw error;
    }
  };

  // Vehicle data action handlers
  const handleAssignSubmit = async () => {
    const pendingIds = selectedIds.filter((id) => !assignedIds.includes(id));
    if (!pendingIds.length) {
      toast.error('Pilih minimal satu data kendaraan yang belum di-assign');
      return;
    }

    if (!assignVendorId) {
      toast.error('Vendor wajib dipilih');
      return;
    }

    if (!assignProcessDate) {
      toast.error('Tanggal proses wajib diisi');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        vehicleDataIds: pendingIds,
        vendorId: Number(assignVendorId),
        processDate: formatDateValue(assignProcessDate),
      });
      toast.success('Data kendaraan berhasil diserahkan ke ditlantas');
      setSelectedIds([]);
      setAssignVendorId('');
      setAssignProcessDate(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyerahkan data kendaraan');
    }
  };

  const handleDetailVehicleClick = (item: VehicleData) => {
    if (slug) {
      router.push(`/dashboard/${slug}/data-kendaraan/${item.id}`);
    }
  };

  const handleEditVehicleClick = (item: VehicleData) => {
    if (slug) {
      router.push(`/dashboard/${slug}/data-kendaraan/${item.id}/edit`);
    }
  };

  const handleDeleteVehicleClick = (item: VehicleData) => {
    setSelectedVehicle(item);
    setIsDeleteVehicleOpen(true);
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      await deleteVehicleMutation.mutateAsync(selectedVehicle.id);
      toast.success('Data kendaraan berhasil dihapus');
      setIsDeleteVehicleOpen(false);
      setSelectedVehicle(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data kendaraan');
    }
  };

  const handleImportVehicle = async (file: File) => {
    try {
      await importVehicleMutation.mutateAsync(file);
      toast.success('Import data kendaraan berhasil');
      setIsImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengimport data kendaraan');
      throw error;
    }
  };

  const handleExportVehicle = async () => {
    try {
      await exportVehicleMutation.mutateAsync();
      toast.success('Export data kendaraan berhasil');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengexport data kendaraan');
    }
  };

  const armadas = armadaData?.data ?? [];
  const totalData = companyId === '3' ? (vehicleDataResponse?.meta.total ?? 0) : (armadaData?.meta.total ?? 0);
  const totalPages = companyId === '3' ? (vehicleDataResponse?.meta.lastPage ?? 1) : (armadaData?.meta.lastPage ?? 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Kendaraan</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola data kendaraan dengan mudah</p>
        </div>

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari data kendaraan"
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
              {companyId === '3' && (
                <>
                  <Button onClick={handleExportVehicle} disabled={exportVehicleMutation.isPending} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    {exportVehicleMutation.isPending ? 'Exporting...' : 'Export'}
                  </Button>
                  <Button onClick={() => setIsImportOpen(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleAddClick} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </>
              )}
            </>
          }
        >
          {companyId === '3' ? (
            <VehicleDataTable
              items={vehicleDataResponse?.data ?? []}
              isLoading={isVehicleLoading}
              selectedIds={selectedIds}
              assignedIds={assignedIds}
              onSelectedIdsChange={setSelectedIds}
              onDetail={handleDetailVehicleClick}
              onEdit={handleEditVehicleClick}
              onDelete={handleDeleteVehicleClick}
              vendorId={assignVendorId}
              onVendorIdChange={setAssignVendorId}
              vendorOptions={vendorOptions}
              onVendorSearchChange={setVendorSearch}
              processDate={assignProcessDate}
              onProcessDateChange={setAssignProcessDate}
              onSubmitAssign={handleAssignSubmit}
              isAssigning={assignMutation.isPending}
            />
          ) : (
            <ArmadaTable
              armadas={armadas}
              isLoading={isArmadaLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onDetail={handleDetailClick}
              canEdit={false}
              canDelete={false}
            />
          )}
        </SearchPagination>
      </div>

      <DeleteArmadaModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <DeleteVehicleDataDialog
        open={isDeleteVehicleOpen}
        onOpenChange={setIsDeleteVehicleOpen}
        onConfirm={handleConfirmDeleteVehicle}
        isDeleting={deleteVehicleMutation.isPending}
        itemName={selectedVehicle ? `${selectedVehicle.invoiceNumber} - ${selectedVehicle.stnkName}` : undefined}
      />

      <DataImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Data Kendaraan"
        description="Unggah file Excel untuk menambahkan data kendaraan secara massal."
        onImport={companyId === '3' ? handleImportVehicle : handleImport}
        isPending={companyId === '3' ? importVehicleMutation.isPending : importMutation.isPending}
        templateUrl={
          companyId === '3'
            ? "https://docs.google.com/spreadsheets/d/1wQmTkJSGyt7vb6DA21TdHyYiDD3tLqlXxUwQA88Qb1M/edit?usp=sharing"
            : "https://docs.google.com/spreadsheets/d/1cdvmtF4S7LrDJoyWmNDR9dd-CQz2OPj7B7EAbUwQSU4/edit?usp=sharing"
        }
      />
    </DashboardLayout>
  );
}
