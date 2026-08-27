import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DealerTable } from '@/components/features/dealer/DealerTable';
import { DealerFormModal, DealerFormData } from '@/components/features/dealer/DealerFormModal';
import { EditDealerModal } from '@/components/features/dealer/EditDealerModal';
import { DeleteDealerModal } from '@/components/features/dealer/DeleteDealerModal';
import { toast } from 'sonner';
import { useDealers, useCreateDealer, useUpdateDealer, useDeleteDealer, useExportDealer } from '@/hooks/useDealer';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { Dealer } from '@/@types/dealer.types';

export default function DealerPage() {
  const { companyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Table state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data: dealersData } = useDealers(companyId, { page, perPage, search });
  
  const createMutation = useCreateDealer();
  const updateMutation = useUpdateDealer();
  const deleteMutation = useDeleteDealer();

  const exportMutation = useExportDealer();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  // Handlers
  const handleAddClick = () => {
    if (!canCreate) return;
    setSelectedDealer(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (dealer: Dealer) => {
    if (!canEdit) return;
    setSelectedDealer(dealer);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (dealer: Dealer) => {
    if (!canDelete) return;
    setSelectedDealer(dealer);
    setIsDeleteOpen(true);
  };

  const handleSaveForm = async (data: DealerFormData) => {
    try {
      if (selectedDealer) {
        // Edit
        await updateMutation.mutateAsync({ id: selectedDealer.id, data: { ...data, companyId: Number(companyId) } });
        toast.success('Data dealer berhasil diubah');
      } else {
        // Add
        await createMutation.mutateAsync({ ...data, companyId: Number(companyId) });
        toast.success('Data dealer berhasil ditambahkan');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedDealer) {
      try {
        await deleteMutation.mutateAsync(selectedDealer.id);
        toast.success('Data dealer berhasil dihapus');
        setIsDeleteOpen(false);
        setSelectedDealer(null);
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus data');
      }
    }
  };



  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync(companyId ? Number(companyId) : undefined);
      toast.success('Berhasil export data');
    } catch (error: any) {
      toast.error(error.message || 'Gagal export data');
    }
  };

  const dealersList = (dealersData as any)?.data || [];
  const totalDealers = (dealersData as any)?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Dealer"
          subtitle="Kelola akun Dealer dengan mudah"
        />

        {/* Content */}
        <DealerTable
          dealers={dealersList}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          page={page}
          perPage={perPage}
          totalData={totalDealers}
          onPageChange={setPage}
          onPerPageChange={(v) => {
            setPerPage(v);
          }}
          onAdd={handleAddClick}

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
      <DealerFormModal 
        isOpen={isFormOpen && !selectedDealer} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveForm} 
      />

      {selectedDealer && (
          <EditDealerModal 
            isOpen={isFormOpen && !!selectedDealer} 
            onClose={() => {
                setIsFormOpen(false);
                setTimeout(() => setSelectedDealer(null), 300);
            }} 
            onSave={handleSaveForm}
            initialData={selectedDealer}
          />
      )}

      <DeleteDealerModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleConfirmDelete} />


    </DashboardLayout>

  );
}
