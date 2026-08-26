import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { VendorTable } from '@/components/features/vendor/VendorTable';
import { VendorFormModal, VendorFormData } from '@/components/features/vendor/VendorFormModal';
import { EditVendorModal } from '@/components/features/vendor/EditVendorModal';
import { DeleteVendorModal } from '@/components/features/vendor/DeleteVendorModal';
import { ImportVendorModal } from '@/components/features/vendor/ImportVendorModal';
import { toast } from 'sonner';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor, useImportVendor, useExportVendor } from '@/hooks/useVendor';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { Vendor } from '@/types/vendor.types';

export default function VendorPage() {
  const { companyId: localCompanyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Table state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data: vendorsData } = useVendors({ page, perPage, search, company_id: localCompanyId ?? undefined });
  
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();
  const importMutation = useImportVendor();
  const exportMutation = useExportVendor();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    setSelectedVendor(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (vendor: Vendor) => {
    if (!canEdit) return;
    setSelectedVendor(vendor);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (vendor: Vendor) => {
    if (!canDelete) return;
    setSelectedVendor(vendor);
    setIsDeleteOpen(true);
  };

  const handleSaveForm = async (data: VendorFormData) => {
    if (selectedVendor && !canEdit) return;
    if (!selectedVendor && !canCreate) return;
    try {
      if (!localCompanyId) {
        toast.error('Company belum dipilih');
        return;
      }
      const companyId = localCompanyId;
      if (selectedVendor) {
        // Edit
        await updateMutation.mutateAsync({ id: selectedVendor.id, data: { ...data, companyId }});
        toast.success('Data vendor berhasil diubah');
      } else {
        // Add
        await createMutation.mutateAsync({ ...data, companyId });
        toast.success('Data vendor berhasil ditambahkan');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;
    if (selectedVendor) {
      try {
        await deleteMutation.mutateAsync(selectedVendor.id);
        toast.success('Data vendor berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedVendor(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus data');
      }
    }
  };

  const handleImport = async (file: File) => {
    if (!canCreate) return;
    try {
      if (!localCompanyId) {
        toast.error('Company belum dipilih');
        return;
      }
      const companyId = localCompanyId;
      await importMutation.mutateAsync({ companyId, file });
      toast.success('Import data vendor berhasil');
      setIsImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Import data vendor gagal');
    }
  };

  const handleExport = async () => {
    try {
      if (!localCompanyId) {
        toast.error('Company belum dipilih');
        return;
      }
      await exportMutation.mutateAsync(localCompanyId);
      toast.success('Berhasil export data vendor');
    } catch (error: any) {
      toast.error(error.message || 'Gagal export data vendor');
    }
  };

  const vendorsList = (vendorsData as any)?.data || [];
  const totalVendors = (vendorsData as any)?.meta?.total || (vendorsData as any)?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Data Vendor"
          subtitle="Kelola data vendor dengan mudah"
        />

        {/* Content */}
        <VendorTable
          vendors={vendorsList}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          page={page}
          perPage={perPage}
          totalData={totalVendors}
          onPageChange={setPage}
          onPerPageChange={(v) => {
            setPerPage(v);
            setPage(1);
          }}
          onAdd={handleAddClick}
          onImport={canCreate ? () => setIsImportOpen(true) : undefined}
          onExport={handleExport}
          isExporting={exportMutation.isPending}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />

      </div>

      {/* Modals */}
      <VendorFormModal 
        isOpen={isFormOpen && !selectedVendor} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveForm} 
      />

      {selectedVendor && (
          <EditVendorModal 
            isOpen={isFormOpen && !!selectedVendor} 
            onClose={() => {
                setIsFormOpen(false);
                setTimeout(() => setSelectedVendor(null), 300);
            }} 
            onSave={handleSaveForm}
            initialData={selectedVendor}
          />
      )}

      <DeleteVendorModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={handleConfirmDelete} 
        isDeleting={deleteMutation.isPending}
      />

      <ImportVendorModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
        isUploading={importMutation.isPending}
      />
    </DashboardLayout>
  );
}
