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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { useKas } from '@/hooks/useKas';
import { cn } from '@/lib/utils';

// Import new hooks, types, components
import {
  useGoodsReceiptEquipments,
  useDeleteGoodsReceiptEquipment,
  useCreateGoodsReceiptEquipment,
  useUploadGoodsReceiptInvoice,
  useCreateGoodsReceiptBilling,
  useCreateGoodsReceiptPayment,
} from '@/hooks/warehouse/useGoodsReceiptEquipment';
import { GoodsReceiptEquipmentTable } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentTable';
import { GoodsReceiptEquipmentFormModal } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentFormModal';
import { GoodsReceiptEquipmentPaymentModal } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentPaymentModal';
import { UploadInvoiceModal } from '@/components/features/material-receipt/UploadInvoiceModal';
import type { GoodsReceiptEquipment } from '@/@types/goods-receipt-equipment.types';
import type { GoodsReceiptEquipmentFormValues } from '@/scheme/goods-receipt-equipment.schema';
import type { GoodsReceiptEquipmentPaymentFormValues } from '@/scheme/goods-receipt-equipment.schema';
import { getReceiptBilling } from '@/components/features/warehouse/receipt-equipment/goodsReceiptEquipment.utils';

import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const getErrorMessage = (error: any): string => {
  return getApiErrorMessage(error);
};

export default function PerlengkapanMasukListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  // PT Wajira Transindo company_id is 4
  const activeCompanyId = 4;

  const { page, perPage, search, setPage, setPerPage, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateQuery({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, search, updateQuery]);

  const transactionsQuery = useGoodsReceiptEquipments({
    page,
    perPage,
    companyId: activeCompanyId,
    code: search || undefined,
    supplier_name: search || undefined,
  });

  const cashesQuery = useKas(activeCompanyId);

  const createMutation = useCreateGoodsReceiptEquipment();
  const deleteMutation = useDeleteGoodsReceiptEquipment();
  const uploadInvoiceMutation = useUploadGoodsReceiptInvoice();
  const createBillingMutation = useCreateGoodsReceiptBilling();
  const createPaymentMutation = useCreateGoodsReceiptPayment();

  // UI States
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('warehouse:create');
  const canEdit = hasPermission('warehouse:edit');
  const canDelete = hasPermission('warehouse:delete');

  const [openForm, setOpenForm] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GoodsReceiptEquipment | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<GoodsReceiptEquipment | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<GoodsReceiptEquipment | null>(null);

  // Pagination Helper Values
  const totalPages = transactionsQuery.data?.meta.lastPage ?? 1;
  const pageNumbers = useMemo(() => getVisiblePageNumbers(totalPages, page, 5), [page, totalPages]);
  const totalData = transactionsQuery.data?.meta.total ?? 0;
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);

  const handleCreateSubmit = async (values: GoodsReceiptEquipmentFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        companyId: activeCompanyId,
        type: 'receipt',
      });
      toast.success('Penerimaan perlengkapan berhasil dibuat');
      setOpenForm(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUploadInvoiceSubmit = async (file: File | null) => {
    if (!invoiceTarget) return;
    if (!file) {
      toast.error('Silakan pilih file invoice terlebih dahulu');
      return;
    }

    try {
      await uploadInvoiceMutation.mutateAsync({ id: invoiceTarget.id, file });
      toast.success(`Invoice untuk ${invoiceTarget.code} berhasil diunggah`);
      setOpenInvoice(false);
      setInvoiceTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCreateBilling = async (item: GoodsReceiptEquipment) => {
    try {
      await createBillingMutation.mutateAsync({ goodsTransactionId: item.id });
      toast.success('Billing berhasil dibuat');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePaymentSubmit = async (values: GoodsReceiptEquipmentPaymentFormValues) => {
    if (!paymentTarget) return;
    const billing = getReceiptBilling(paymentTarget as any);
    if (!billing) {
      toast.error('Billing tidak ditemukan');
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        goodsTransactionBillingId: billing.id,
        cashId: values.cashId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        description: values.description,
      });
      toast.success(`Pembayaran untuk ${paymentTarget.code} berhasil didaftarkan`);
      setOpenPayment(false);
      setPaymentTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Penerimaan perlengkapan ${deleteTarget.code} berhasil dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Penerimaan Perlengkapan Kendaraan"
          subtitle="Kelola dan lacak semua transaksi perlengkapan masuk"
          actions={
            canCreate && (
              <Button onClick={() => setOpenForm(true)} className="btn-primary-orange!">
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Button>
            )
          }
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search here"
                  className="pl-9 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                <span>Show</span>
                <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                  <SelectTrigger className="w-[70px] bg-white">
                    <SelectValue placeholder="25" />
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

          <div className="rounded-md border border-gray-200 bg-white overflow-hidden shadow-none">
            <GoodsReceiptEquipmentTable
              data={transactionsQuery.data?.data ?? []}
              isLoading={transactionsQuery.isLoading}
              isFetching={transactionsQuery.isFetching}
              slug={slug}
              onUploadInvoice={(item) => {
                setInvoiceTarget(item);
                setOpenInvoice(true);
              }}
              onCreateBilling={handleCreateBilling}
              onPayBilling={(item) => {
                setPaymentTarget(item);
                setOpenPayment(true);
              }}
              onDelete={setDeleteTarget}
            />
          </div>

          <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Showing {startData}-{endData} of {totalData} data
            </p>
            <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                disabled={page <= 1}
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
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
              {totalPages > 5 && !pageNumbers.includes(totalPages) && <span className="px-2 text-slate-500">...</span>}
              {totalPages > 5 && !pageNumbers.includes(totalPages) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 min-w-9 rounded-md border border-transparent bg-transparent px-3 text-sm font-medium text-slate-700 hover:border-slate-200 hover:bg-white"
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <GoodsReceiptEquipmentFormModal
        open={openForm}
        onOpenChange={setOpenForm}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
        companyId={activeCompanyId}
      />

      <UploadInvoiceModal
        open={openInvoice}
        onOpenChange={setOpenInvoice}
        onSubmit={handleUploadInvoiceSubmit}
        isSubmitting={uploadInvoiceMutation.isPending}
        title="Upload Nota Penerimaan"
        description="Masukkan file invoice / nota perlengkapan masuk"
      />

      {paymentTarget && (
        <GoodsReceiptEquipmentPaymentModal
          open={openPayment}
          onOpenChange={setOpenPayment}
          onSubmit={handlePaymentSubmit}
          isSubmitting={createPaymentMutation.isPending}
          transaction={paymentTarget}
          totalAmount={getReceiptBilling(paymentTarget as any)?.grandTotal ?? paymentTarget.totalBrutto}
          cashes={cashesQuery.data?.data ?? []}
          isLoadingCashes={cashesQuery.isLoading}
        />
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[680px] rounded-[28px] border-none p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-5 text-left">
            <AlertDialogTitle className="text-[28px] font-semibold text-slate-950">Hapus Data Ini?</AlertDialogTitle>
            <AlertDialogDescription className="text-[18px] text-slate-500">
              Apakah anda yakin ingin menghapus data penerimaan perlengkapan{' '}
              <span className="font-semibold text-slate-900">{deleteTarget?.code}</span>? Data detail, billing, dan history pembayaran yang terkait juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-4">
            <AlertDialogCancel className="h-14 rounded-md border-slate-300 px-7 text-[18px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="h-14 rounded-md bg-red-600 px-7 text-[18px] hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
