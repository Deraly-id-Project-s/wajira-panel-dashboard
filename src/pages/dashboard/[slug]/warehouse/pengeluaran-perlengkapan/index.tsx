import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { cn } from '@/lib/utils';
import {
  useGoodsIssueEquipments,
  useDeleteGoodsIssueEquipment,
  useCreateGoodsIssueEquipment,
} from '@/hooks/warehouse/useGoodsIssueEquipment';
import { useUploadGoodsTransactionInvoice } from '@/hooks/warehouse/useGoodsTransactionInvoiceMutation';
import { GoodsIssueEquipmentTable } from '@/components/features/warehouse/issue-equipment/GoodsIssueEquipmentTable';
import { GoodsIssueEquipmentFormModal } from '@/components/features/warehouse/issue-equipment/GoodsIssueEquipmentFormModal';
import { GoodsIssueEquipmentUploadInvoiceModal } from '@/components/features/warehouse/issue-equipment/GoodsIssueEquipmentUploadInvoiceModal';
import type { GoodsIssueEquipment } from '@/@types/goods-issue-equipment.types';
import type { GoodsIssueEquipmentFormValues } from '@/scheme/goods-issue-equipment.schema';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const getErrorMessage = (error: any): string => {
  return getApiErrorMessage(error);
};

export default function PengeluaranPerlengkapanIndex() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { isLoading: isCompanyLoading } = useCompany();

  // Enforce company ID 4 (Transindo) for data fetching
  const activeCompanyId = 4;

  const { page, perPage, search, setPage, setPerPage, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('warehouse:create');
  const canEdit = hasPermission('warehouse:edit');
  const canDelete = hasPermission('warehouse:delete');

  const [formOpen, setFormOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<GoodsIssueEquipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodsIssueEquipment | null>(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateQuery({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, search, updateQuery]);

  const transactionsQuery = useGoodsIssueEquipments({
    companyId: activeCompanyId,
    code: search || undefined,
    page,
    perPage,
    enabled: !isCompanyLoading,
  });

  const createMutation = useCreateGoodsIssueEquipment();
  const deleteMutation = useDeleteGoodsIssueEquipment();
  const uploadInvoiceMutation = useUploadGoodsTransactionInvoice();

  const transactions = transactionsQuery.data?.data ?? [];
  const meta = transactionsQuery.data?.meta;
  const totalData = meta?.total ?? 0;
  const totalPages = meta?.lastPage ?? 1;
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);
  const pageNumbers = useMemo(() => getVisiblePageNumbers(totalPages, page, 5), [page, totalPages]);

  const handleCreateSubmit = async (values: GoodsIssueEquipmentFormValues) => {
    try {
      const res = await createMutation.mutateAsync({
        companyId: activeCompanyId,
        type: 'issue',
        category: values.category,
        vehicleFleetId: values.vehicleFleetId,
        driverId: values.driverId,
        transactionDate: values.transactionDate,
        description: values.description,
      });
      toast.success('Transaksi pengeluaran perlengkapan berhasil dibuat');
      setFormOpen(false);
      router.push(`/dashboard/${slug}/warehouse/pengeluaran-perlengkapan/${res.id}/edit`);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUploadInvoiceSubmit = async (file: File) => {
    if (!invoiceTarget) return;
    try {
      await uploadInvoiceMutation.mutateAsync({ id: invoiceTarget.id, file });
      toast.success('Invoice berhasil diunggah');
      setInvoiceOpen(false);
      setInvoiceTarget(null);
      transactionsQuery.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Transaksi pengeluaran perlengkapan berhasil dihapus');
      setDeleteTarget(null);
      transactionsQuery.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const renderPagination = () => {
    const showLastPage = totalPages > 5 && !pageNumbers.includes(totalPages);

    return (
      <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
          disabled={page <= 1 || transactionsQuery.isLoading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
              pageNumber === page
                ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
                : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
            )}
            disabled={transactionsQuery.isLoading}
            onClick={() => setPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        {showLastPage && <span className="px-1 text-slate-500">...</span>}
        {showLastPage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-9 rounded-md border border-transparent bg-transparent px-3 text-sm font-medium text-slate-700 hover:border-slate-200 hover:bg-white"
            disabled={transactionsQuery.isLoading}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
          disabled={page >= totalPages || totalData === 0 || transactionsQuery.isLoading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Data Pengeluaran Perlengkapan"
          subtitle="Kelola dan lacak semua transaksi pengeluaran perlengkapan kendaraan"
          actions={
            canCreate && (
              <Button onClick={() => setFormOpen(true)} className="button-theme-1!">
                <Plus className="mr-2 h-4 w-4" /> Tambah
              </Button>
            )
          }
        />

        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by code here"
                  className="pl-9 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                  <SelectTrigger className="w-[70px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>Page</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-md border border-gray-200 bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <GoodsIssueEquipmentTable
                data={transactions}
                isLoading={transactionsQuery.isLoading}
                slug={slug}
                onUploadInvoice={(item) => {
                  setInvoiceTarget(item);
                  setInvoiceOpen(true);
                }}
                onDelete={(item) => setDeleteTarget(item)}
              />
            </div>
          </div>

          {/* Pagination Info */}
          <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Showing {startData}-{endData} of {totalData} data
            </p>
            {renderPagination()}
          </div>
        </div>
      </div>

      {/* Main Header Dialog Modal */}
      <GoodsIssueEquipmentFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
      />

      {/* Invoice Upload Dialog Modal */}
      <GoodsIssueEquipmentUploadInvoiceModal
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        onSubmit={handleUploadInvoiceSubmit}
        isSubmitting={uploadInvoiceMutation.isPending}
        initialData={invoiceTarget}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[28px] border-none p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-3 text-left">
            <AlertDialogTitle className="text-[24px] font-semibold text-slate-950">
              Hapus Data Ini?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[16px] text-slate-500">
              Apakah Anda yakin ingin menghapus transaksi pengeluaran perlengkapan{' '}
              <span className="font-semibold text-slate-800">{deleteTarget?.code}</span>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-4 mt-6">
            <AlertDialogCancel className="h-12 rounded-md border-slate-300 px-5 text-[16px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              disabled={deleteMutation.isPending}
              className="h-12 rounded-md bg-red-600 px-5 text-[16px] hover:bg-red-700 font-semibold"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
